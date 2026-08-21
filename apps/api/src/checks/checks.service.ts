import { Injectable } from '@nestjs/common';
import type { CheckType, MonitoredService } from '#prisma/client';
import { HttpCheckStrategy } from './strategies/http-check.strategy';
import { DnsCheckStrategy } from './strategies/dns-check.strategy';
import { TcpCheckStrategy } from './strategies/tcp-check.strategy';
import { TlsCheckStrategy } from './strategies/tls-check.strategy';
import { NtpCheckStrategy } from './strategies/ntp-check.strategy';
import type { CheckOutcome, CheckStrategy } from './checks.interface';

@Injectable()
export class ChecksService {
  private readonly strategies: Map<CheckType, CheckStrategy>;

  constructor(
    httpCheckStrategy: HttpCheckStrategy,
    dnsCheckStrategy: DnsCheckStrategy,
    tcpCheckStrategy: TcpCheckStrategy,
    tlsCheckStrategy: TlsCheckStrategy,
    ntpCheckStrategy: NtpCheckStrategy,
  ) {
    this.strategies = new Map<CheckType, CheckStrategy>([
      [httpCheckStrategy.type, httpCheckStrategy],
      [dnsCheckStrategy.type, dnsCheckStrategy],
      [tcpCheckStrategy.type, tcpCheckStrategy],
      [tlsCheckStrategy.type, tlsCheckStrategy],
      [ntpCheckStrategy.type, ntpCheckStrategy],
    ]);
  }

  async execute(
    service: Pick<MonitoredService, 'type' | 'target' | 'expectedContent'>,
  ): Promise<CheckOutcome> {
    const strategy = this.strategies.get(service.type);
    if (!strategy) {
      return {
        success: false,
        latencyMs: null,
        statusCode: null,
        errorMessage: `No check strategy registered for type "${service.type}"`,
      };
    }

    try {
      return await strategy.run(service.target, service);
    } catch (error) {
      return {
        success: false,
        latencyMs: null,
        statusCode: null,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown check error',
      };
    }
  }
}
