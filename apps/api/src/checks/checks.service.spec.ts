import { CheckType } from '#prisma/client';
import { ChecksService } from './checks.service';
import type { CheckOutcome, CheckStrategy } from './checks.interface';
import type { HttpCheckStrategy } from './strategies/http-check.strategy';
import type { DnsCheckStrategy } from './strategies/dns-check.strategy';
import type { TcpCheckStrategy } from './strategies/tcp-check.strategy';

const OK: CheckOutcome = {
  success: true,
  latencyMs: 42,
  statusCode: 200,
  errorMessage: null,
};

function fakeStrategy(
  type: CheckType,
  run: jest.Mock = jest.fn().mockResolvedValue(OK),
): CheckStrategy {
  return { type, run };
}

describe('ChecksService', () => {
  it('elige la estrategia HTTP para un servicio de tipo HTTP y le pasa el target', async () => {
    const httpRun = jest.fn().mockResolvedValue(OK);
    const service = new ChecksService(
      fakeStrategy(CheckType.HTTP, httpRun) as unknown as HttpCheckStrategy,
      fakeStrategy(CheckType.DNS) as unknown as DnsCheckStrategy,
      fakeStrategy(CheckType.TCP) as unknown as TcpCheckStrategy,
    );

    const outcome = await service.execute({
      type: CheckType.HTTP,
      target: 'https://github.com',
    });

    expect(httpRun).toHaveBeenCalledWith('https://github.com');
    expect(outcome).toBe(OK);
  });

  it('elige la estrategia DNS para un servicio de tipo DNS', async () => {
    const dnsRun = jest.fn().mockResolvedValue(OK);
    const service = new ChecksService(
      fakeStrategy(CheckType.HTTP) as unknown as HttpCheckStrategy,
      fakeStrategy(CheckType.DNS, dnsRun) as unknown as DnsCheckStrategy,
      fakeStrategy(CheckType.TCP) as unknown as TcpCheckStrategy,
    );

    await service.execute({
      type: CheckType.DNS,
      target: 'github.com@1.1.1.1',
    });

    expect(dnsRun).toHaveBeenCalledWith('github.com@1.1.1.1');
  });

  it('elige la estrategia TCP para un servicio de tipo TCP', async () => {
    const tcpRun = jest.fn().mockResolvedValue(OK);
    const service = new ChecksService(
      fakeStrategy(CheckType.HTTP) as unknown as HttpCheckStrategy,
      fakeStrategy(CheckType.DNS) as unknown as DnsCheckStrategy,
      fakeStrategy(CheckType.TCP, tcpRun) as unknown as TcpCheckStrategy,
    );

    await service.execute({ type: CheckType.TCP, target: 'github.com:443' });

    expect(tcpRun).toHaveBeenCalledWith('github.com:443');
  });

  it('convierte un rechazo de la estrategia en un CheckOutcome de fallo, sin propagar la excepcion', async () => {
    const service = new ChecksService(
      fakeStrategy(
        CheckType.HTTP,
        jest.fn().mockRejectedValue(new Error('boom')),
      ) as unknown as HttpCheckStrategy,
      fakeStrategy(CheckType.DNS) as unknown as DnsCheckStrategy,
      fakeStrategy(CheckType.TCP) as unknown as TcpCheckStrategy,
    );

    const outcome = await service.execute({
      type: CheckType.HTTP,
      target: 'https://example.com',
    });

    expect(outcome).toEqual({
      success: false,
      latencyMs: null,
      statusCode: null,
      errorMessage: 'boom',
    });
  });

  it('da un mensaje generico si la estrategia lanza algo que no es un Error', async () => {
    const service = new ChecksService(
      fakeStrategy(
        CheckType.HTTP,
        jest.fn().mockRejectedValue('no soy un Error'),
      ) as unknown as HttpCheckStrategy,
      fakeStrategy(CheckType.DNS) as unknown as DnsCheckStrategy,
      fakeStrategy(CheckType.TCP) as unknown as TcpCheckStrategy,
    );

    const outcome = await service.execute({
      type: CheckType.HTTP,
      target: 'https://example.com',
    });

    expect(outcome.success).toBe(false);
    expect(outcome.errorMessage).toBe('Unknown check error');
  });
});
