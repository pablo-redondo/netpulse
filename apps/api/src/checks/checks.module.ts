import { Module } from '@nestjs/common';
import { ChecksService } from './checks.service';
import { HttpCheckStrategy } from './strategies/http-check.strategy';
import { DnsCheckStrategy } from './strategies/dns-check.strategy';
import { TcpCheckStrategy } from './strategies/tcp-check.strategy';

@Module({
  providers: [
    ChecksService,
    HttpCheckStrategy,
    DnsCheckStrategy,
    TcpCheckStrategy,
  ],
  exports: [ChecksService],
})
export class ChecksModule {}
