import { Injectable } from '@nestjs/common';
import { connect } from 'node:tls';
import { CheckType } from '#prisma/client';
import type { CheckOutcome, CheckStrategy } from '../checks.interface';

const TIMEOUT_MS = 10_000;
// Por debajo de este margen el certificado se considera "en riesgo" y el
// check falla, para poder avisar antes de que caduque de verdad.
const WARN_WITHIN_DAYS = 14;

// Target format: "host" o "host:port" (443 por defecto), ej. "github.com"
@Injectable()
export class TlsCheckStrategy implements CheckStrategy {
  readonly type = CheckType.TLS;

  run(target: string): Promise<CheckOutcome> {
    const separatorIndex = target.lastIndexOf(':');
    const host =
      separatorIndex === -1 ? target : target.slice(0, separatorIndex);
    const port =
      separatorIndex === -1 ? 443 : Number(target.slice(separatorIndex + 1));

    return new Promise((resolve) => {
      const startedAt = Date.now();
      const socket = connect({
        host,
        port,
        servername: host,
        // Solo nos interesa leer el certificado y sus fechas, no validar la
        // cadena de confianza completa.
        rejectUnauthorized: false,
        timeout: TIMEOUT_MS,
      });

      const finish = (outcome: CheckOutcome) => {
        socket.destroy();
        resolve(outcome);
      };

      socket.once('secureConnect', () => {
        const latencyMs = Date.now() - startedAt;
        const cert = socket.getPeerCertificate();

        if (!cert || !cert.valid_to) {
          finish({
            success: false,
            latencyMs,
            statusCode: null,
            errorMessage: 'No se pudo leer el certificado del servidor',
          });
          return;
        }

        const certExpiresAt = new Date(cert.valid_to);
        const daysRemaining =
          (certExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);

        finish({
          success: daysRemaining > WARN_WITHIN_DAYS,
          latencyMs,
          statusCode: null,
          errorMessage:
            daysRemaining <= WARN_WITHIN_DAYS
              ? `El certificado caduca en ${Math.max(0, Math.floor(daysRemaining))} día(s)`
              : null,
          certExpiresAt,
        });
      });
      socket.once('timeout', () => {
        finish({
          success: false,
          latencyMs: null,
          statusCode: null,
          errorMessage: 'Conexión TLS agotó el tiempo de espera',
        });
      });
      socket.once('error', (error: Error) => {
        finish({
          success: false,
          latencyMs: null,
          statusCode: null,
          errorMessage: error.message,
        });
      });
    });
  }
}
