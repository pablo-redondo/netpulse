import { Injectable } from '@nestjs/common';
import { createSocket } from 'node:dgram';
import { CheckType } from '#prisma/client';
import type { CheckOutcome, CheckStrategy } from '../checks.interface';

const TIMEOUT_MS = 5_000;
const NTP_PORT = 123;
// El reloj NTP cuenta segundos desde 1900, el de Unix desde 1970.
const NTP_EPOCH_OFFSET_SECONDS = 2_208_988_800;

function buildRequest(): Buffer {
  const packet = Buffer.alloc(48);
  packet[0] = 0x1b; // LI=0, VN=3 (NTPv3), Mode=3 (client)
  return packet;
}

// Timestamp NTP: 32 bits de segundos + 32 bits de fraccion, big-endian.
function readNtpTimestamp(buffer: Buffer, offset: number): number {
  const seconds = buffer.readUInt32BE(offset);
  const fraction = buffer.readUInt32BE(offset + 4);
  return (
    (seconds - NTP_EPOCH_OFFSET_SECONDS) * 1000 + (fraction / 2 ** 32) * 1000
  );
}

// Target: hostname de un servidor NTP, ej. "time.cloudflare.com" (UDP/123)
@Injectable()
export class NtpCheckStrategy implements CheckStrategy {
  readonly type = CheckType.NTP;

  run(target: string): Promise<CheckOutcome> {
    return new Promise((resolve) => {
      const socket = createSocket('udp4');
      let settled = false;

      const finish = (outcome: CheckOutcome) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        socket.close();
        resolve(outcome);
      };

      const timeout = setTimeout(() => {
        finish({
          success: false,
          latencyMs: null,
          statusCode: null,
          errorMessage: 'El servidor NTP no respondió a tiempo',
        });
      }, TIMEOUT_MS);

      socket.once('error', (error: Error) => {
        finish({
          success: false,
          latencyMs: null,
          statusCode: null,
          errorMessage: error.message,
        });
      });

      const t1 = Date.now();

      // Formula clasica de sincronizacion NTP con las 4 marcas de tiempo:
      // T1 salida de la peticion, T2 llegada al servidor, T3 salida de la
      // respuesta, T4 llegada de la respuesta. offset = ((T2-T1)+(T3-T4))/2.
      socket.once('message', (response) => {
        const t4 = Date.now();
        const stratum = response.readUInt8(1);

        if (stratum === 0 || stratum >= 16) {
          finish({
            success: false,
            latencyMs: t4 - t1,
            statusCode: null,
            errorMessage: `Respuesta NTP inválida (stratum ${stratum})`,
          });
          return;
        }

        const t2 = readNtpTimestamp(response, 32);
        const t3 = readNtpTimestamp(response, 40);
        const offsetMs = Math.round((t2 - t1 + (t3 - t4)) / 2);

        finish({
          success: true,
          latencyMs: t4 - t1,
          statusCode: null,
          errorMessage: null,
          details: `Desfase de reloj: ${offsetMs >= 0 ? '+' : ''}${offsetMs} ms (stratum ${stratum})`,
        });
      });

      socket.send(buildRequest(), NTP_PORT, target, (error) => {
        if (error) {
          finish({
            success: false,
            latencyMs: null,
            statusCode: null,
            errorMessage: error.message,
          });
        }
      });
    });
  }
}
