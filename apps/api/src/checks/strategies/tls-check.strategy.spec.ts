import { EventEmitter } from 'node:events';

class FakeTlsSocket extends EventEmitter {
  destroy = jest.fn();
  getPeerCertificate = jest.fn();
}

const connectMock = jest.fn();
let lastFakeSocket: FakeTlsSocket;

jest.mock('node:tls', () => ({
  connect: (...args: unknown[]) => {
    lastFakeSocket = new FakeTlsSocket();
    connectMock(...args);
    return lastFakeSocket;
  },
}));

import { TlsCheckStrategy } from './tls-check.strategy';

describe('TlsCheckStrategy', () => {
  let strategy: TlsCheckStrategy;

  beforeEach(() => {
    strategy = new TlsCheckStrategy();
    connectMock.mockClear();
  });

  it('usa el puerto 443 por defecto cuando el target no lleva puerto', async () => {
    const promise = strategy.run('github.com');

    expect(connectMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'github.com', port: 443 }),
    );

    lastFakeSocket.getPeerCertificate.mockReturnValue({
      valid_to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toUTCString(),
    });
    lastFakeSocket.emit('secureConnect');
    await promise;
  });

  it('respeta el puerto explicito en "host:puerto"', async () => {
    const promise = strategy.run('example.com:8443');

    expect(connectMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'example.com', port: 8443 }),
    );

    lastFakeSocket.getPeerCertificate.mockReturnValue({
      valid_to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toUTCString(),
    });
    lastFakeSocket.emit('secureConnect');
    await promise;
  });

  it('da por bueno un certificado que caduca dentro de mucho', async () => {
    const promise = strategy.run('github.com');
    const validTo = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    lastFakeSocket.getPeerCertificate.mockReturnValue({
      valid_to: validTo.toUTCString(),
    });
    lastFakeSocket.emit('secureConnect');

    const outcome = await promise;

    expect(outcome.success).toBe(true);
    expect(outcome.errorMessage).toBeNull();
    // toUTCString() trunca a segundos, asi que el redondeo pierde hasta 999ms.
    expect(outcome.certExpiresAt?.getTime()).toBeCloseTo(validTo.getTime(), -4);
  });

  it('da por malo un certificado que caduca dentro de pocos dias', async () => {
    const promise = strategy.run('github.com');
    lastFakeSocket.getPeerCertificate.mockReturnValue({
      valid_to: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toUTCString(),
    });
    lastFakeSocket.emit('secureConnect');

    const outcome = await promise;

    expect(outcome.success).toBe(false);
    expect(outcome.errorMessage).toMatch(/caduca en/);
  });

  it('da por malo un certificado ya caducado', async () => {
    const promise = strategy.run('github.com');
    lastFakeSocket.getPeerCertificate.mockReturnValue({
      valid_to: new Date(Date.now() - 24 * 60 * 60 * 1000).toUTCString(),
    });
    lastFakeSocket.emit('secureConnect');

    const outcome = await promise;

    expect(outcome.success).toBe(false);
  });

  it('da fallo si no se puede leer el certificado', async () => {
    const promise = strategy.run('github.com');
    lastFakeSocket.getPeerCertificate.mockReturnValue({});
    lastFakeSocket.emit('secureConnect');

    const outcome = await promise;

    expect(outcome.success).toBe(false);
    expect(outcome.errorMessage).toMatch(/certificado/i);
  });

  it('da fallo con el mensaje del error cuando la conexion falla', async () => {
    const promise = strategy.run('github.com');
    lastFakeSocket.emit('error', new Error('connect ECONNREFUSED'));

    const outcome = await promise;

    expect(outcome).toEqual({
      success: false,
      latencyMs: null,
      statusCode: null,
      errorMessage: 'connect ECONNREFUSED',
    });
  });

  it('da fallo cuando el socket agota el timeout', async () => {
    const promise = strategy.run('github.com');
    lastFakeSocket.emit('timeout');

    const outcome = await promise;

    expect(outcome.success).toBe(false);
    expect(outcome.errorMessage).toMatch(/tiempo de espera/);
  });
});
