import { Injectable } from '@nestjs/common';
import { Socket } from 'node:net';
import { CheckType } from '#prisma/client';
import type { CheckOutcome, CheckStrategy } from '../checks.interface';

const TIMEOUT_MS = 10_000;

// Target format: "host:port", ej. "github.com:443"
@Injectable()
export class TcpCheckStrategy implements CheckStrategy {
  readonly type = CheckType.TCP;

  run(target: string): Promise<CheckOutcome> {
    const separatorIndex = target.lastIndexOf(':');
    const host = target.slice(0, separatorIndex);
    const port = Number(target.slice(separatorIndex + 1));

    return new Promise((resolve) => {
      const socket = new Socket();
      const startedAt = Date.now();

      const finish = (outcome: CheckOutcome) => {
        socket.destroy();
        resolve(outcome);
      };

      socket.setTimeout(TIMEOUT_MS);
      socket.once('connect', () => {
        finish({
          success: true,
          latencyMs: Date.now() - startedAt,
          statusCode: null,
          errorMessage: null,
        });
      });
      socket.once('timeout', () => {
        finish({
          success: false,
          latencyMs: null,
          statusCode: null,
          errorMessage: 'Connection timed out',
        });
      });
      socket.once('error', (error) => {
        finish({
          success: false,
          latencyMs: null,
          statusCode: null,
          errorMessage: error.message,
        });
      });

      socket.connect(port, host);
    });
  }
}
