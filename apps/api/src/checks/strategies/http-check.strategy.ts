import { Injectable } from '@nestjs/common';
import { CheckType } from '#prisma/client';
import type { CheckOutcome, CheckStrategy } from '../checks.interface';

const TIMEOUT_MS = 10_000;
const USER_AGENT = 'NetPulse-Monitor/1.0 (portfolio project)';

@Injectable()
export class HttpCheckStrategy implements CheckStrategy {
  readonly type = CheckType.HTTP;

  async run(target: string): Promise<CheckOutcome> {
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
      return {
        success: response.status < 400,
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
