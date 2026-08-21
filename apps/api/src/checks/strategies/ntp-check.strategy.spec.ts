import { EventEmitter } from 'node:events';

class FakeUdpSocket extends EventEmitter {
  close = jest.fn();
  send = jest.fn(
    (
      _packet: Buffer,
      _port: number,
      _host: string,
      cb: (error?: Error) => void,
    ) => cb(),
  );
}

let lastFakeSocket: FakeUdpSocket;

jest.mock('node:dgram', () => ({
  createSocket: () => {
    lastFakeSocket = new FakeUdpSocket();
    return lastFakeSocket;
  },
}));

import { NtpCheckStrategy } from './ntp-check.strategy';

const NTP_EPOCH_OFFSET_SECONDS = 2_208_988_800;

function ntpResponse({
  stratum = 2,
  offsetMs = 0,
}: { stratum?: number; offsetMs?: number } = {}): Buffer {
  const packet = Buffer.alloc(48);
  packet[1] = stratum;

  const writeTimestamp = (unixMs: number, offset: number) => {
    const seconds = Math.floor(unixMs / 1000) + NTP_EPOCH_OFFSET_SECONDS;
    packet.writeUInt32BE(seconds, offset);
    packet.writeUInt32BE(0, offset + 4);
  };

  const now = Date.now();
  writeTimestamp(now + offsetMs, 32); // Receive Timestamp (T2)
  writeTimestamp(now + offsetMs, 40); // Transmit Timestamp (T3)
  return packet;
}

describe('NtpCheckStrategy', () => {
  let strategy: NtpCheckStrategy;

  beforeEach(() => {
    strategy = new NtpCheckStrategy();
  });

  it('envia un paquete NTPv3 de cliente al puerto 123', async () => {
    const promise = strategy.run('time.cloudflare.com');

    expect(lastFakeSocket.send).toHaveBeenCalledWith(
      expect.any(Buffer),
      123,
      'time.cloudflare.com',
      expect.any(Function),
    );
    const [packet] = lastFakeSocket.send.mock.calls[0] as [Buffer];
    expect(packet.length).toBe(48);
    expect(packet[0]).toBe(0x1b);

    lastFakeSocket.emit('message', ntpResponse());
    await promise;
  });

  it('da por buena una respuesta con stratum valido', async () => {
    const promise = strategy.run('time.cloudflare.com');
    lastFakeSocket.emit('message', ntpResponse({ stratum: 3 }));

    const outcome = await promise;

    expect(outcome.success).toBe(true);
    expect(outcome.errorMessage).toBeNull();
    expect(outcome.details).toContain('stratum 3');
  });

  it('informa el desfase de reloj en el detalle', async () => {
    const promise = strategy.run('time.cloudflare.com');
    lastFakeSocket.emit('message', ntpResponse({ offsetMs: 5_000 }));

    const outcome = await promise;

    expect(outcome.details).toMatch(/Desfase de reloj: \+\d+ ms/);
  });

  it('da por mala una respuesta con stratum 0 (kiss-of-death)', async () => {
    const promise = strategy.run('time.cloudflare.com');
    lastFakeSocket.emit('message', ntpResponse({ stratum: 0 }));

    const outcome = await promise;

    expect(outcome.success).toBe(false);
    expect(outcome.errorMessage).toMatch(/stratum 0/);
  });

  it('da fallo con el mensaje del error si el socket falla', async () => {
    const promise = strategy.run('time.cloudflare.com');
    lastFakeSocket.emit('error', new Error('getaddrinfo ENOTFOUND'));

    const outcome = await promise;

    expect(outcome).toEqual({
      success: false,
      latencyMs: null,
      statusCode: null,
      errorMessage: 'getaddrinfo ENOTFOUND',
    });
  });

  it('cierra el socket tanto si responde como si falla', async () => {
    const promiseOk = strategy.run('time.cloudflare.com');
    const socketOk = lastFakeSocket;
    socketOk.emit('message', ntpResponse());
    await promiseOk;
    expect(socketOk.close).toHaveBeenCalledTimes(1);

    const promiseFail = strategy.run('time.cloudflare.com');
    const socketFail = lastFakeSocket;
    socketFail.emit('error', new Error('boom'));
    await promiseFail;
    expect(socketFail.close).toHaveBeenCalledTimes(1);
  });
});
