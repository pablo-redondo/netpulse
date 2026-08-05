jest.mock('node:dns/promises', () => ({
  Resolver: jest.fn(),
}));

import { Resolver } from 'node:dns/promises';
import { DnsCheckStrategy } from './dns-check.strategy';

const MockedResolver = Resolver as unknown as jest.Mock;

describe('DnsCheckStrategy', () => {
  let strategy: DnsCheckStrategy;
  let setServers: jest.Mock;
  let resolve4: jest.Mock;

  beforeEach(() => {
    strategy = new DnsCheckStrategy();
    setServers = jest.fn();
    resolve4 = jest.fn();
    MockedResolver.mockReset().mockImplementation(() => ({
      setServers,
      resolve4,
    }));
  });

  it('parsea "hostname@resolverIP" y consulta al resolver indicado', async () => {
    resolve4.mockResolvedValue(['140.82.114.3']);

    await strategy.run('github.com@1.1.1.1');

    expect(setServers).toHaveBeenCalledWith(['1.1.1.1']);
    expect(resolve4).toHaveBeenCalledWith('github.com');
  });

  it('crea el resolver con el timeout propio del check DNS', async () => {
    resolve4.mockResolvedValue(['8.8.4.4']);

    await strategy.run('google.com@8.8.8.8');

    expect(MockedResolver).toHaveBeenCalledWith({ timeout: 5_000 });
  });

  it('da por buena una resolucion con al menos una direccion', async () => {
    resolve4.mockResolvedValue(['140.82.114.3']);

    const outcome = await strategy.run('github.com@1.1.1.1');

    expect(outcome.success).toBe(true);
    expect(outcome.statusCode).toBeNull();
    expect(outcome.errorMessage).toBeNull();
    expect(outcome.latencyMs).not.toBeNull();
  });

  it('da por mala una respuesta sin direcciones', async () => {
    resolve4.mockResolvedValue([]);

    const outcome = await strategy.run('github.com@1.1.1.1');

    expect(outcome.success).toBe(false);
    // Hubo respuesta del resolver, solo que vacia: se midio latencia igual.
    expect(outcome.latencyMs).not.toBeNull();
  });

  it('da por malo un fallo de resolucion (NXDOMAIN, resolver caido...)', async () => {
    resolve4.mockRejectedValue(new Error('queryA ENOTFOUND no-existe.invalid'));

    const outcome = await strategy.run('no-existe.invalid@1.1.1.1');

    expect(outcome).toEqual({
      success: false,
      latencyMs: null,
      statusCode: null,
      errorMessage: 'queryA ENOTFOUND no-existe.invalid',
    });
  });
});
