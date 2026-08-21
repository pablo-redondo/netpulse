import { Injectable } from '@nestjs/common';
import { CheckType, type MonitoredService } from '#prisma/client';
import type { CheckOutcome, CheckStrategy } from '../checks.interface';

const TIMEOUT_MS = 10_000;
const USER_AGENT = 'NetPulse-Monitor/1.0 (portfolio project)';

@Injectable()
export class HttpCheckStrategy implements CheckStrategy {
  readonly type = CheckType.HTTP;

  async run(
    target: string,
    service?: Pick<MonitoredService, 'expectedContent'>,
  ): Promise<CheckOutcome> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const startedAt = Date.now();

    try {
      const response = await fetch(target, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
      const latencyMs = Date.now() - startedAt;

      if (response.status >= 400) {
        return {
          success: false,
          latencyMs,
          statusCode: response.status,
          errorMessage: null,
        };
      }

      const expectedContent = service?.expectedContent;
      if (expectedContent) {
        const body = await response.text();
        if (!body.includes(expectedContent)) {
          return {
            success: false,
            latencyMs,
            statusCode: response.status,
            errorMessage: `El contenido esperado ("${expectedContent}") no aparece en la respuesta`,
          };
        }
      }

      return {
        success: true,
        latencyMs,
        statusCode: response.status,
        errorMessage: null,
      };
    } catch (error) {
      return {
        success: false,
        latencyMs: null,
        statusCode: null,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown HTTP error',
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
