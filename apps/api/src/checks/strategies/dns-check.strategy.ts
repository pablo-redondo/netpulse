import { Injectable } from '@nestjs/common';
import { Resolver } from 'node:dns/promises';
import { CheckType } from '#prisma/client';
import type { CheckOutcome, CheckStrategy } from '../checks.interface';

const TIMEOUT_MS = 5_000;

// Target format: "hostname@resolverIP", ej. "github.com@1.1.1.1"
@Injectable()
export class DnsCheckStrategy implements CheckStrategy {
  readonly type = CheckType.DNS;

  async run(target: string): Promise<CheckOutcome> {
    const [hostname, resolverIp] = target.split('@');
    const resolver = new Resolver({ timeout: TIMEOUT_MS });
    resolver.setServers([resolverIp]);

    const startedAt = Date.now();
    try {
      const addresses = await resolver.resolve4(hostname);
      const latencyMs = Date.now() - startedAt;
      return {
        success: addresses.length > 0,
        latencyMs,
        statusCode: null,
        errorMessage: null,
      };
    } catch (error) {
      return {
        success: false,
        latencyMs: null,
        statusCode: null,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown DNS error',
      };
    }
  }
}
