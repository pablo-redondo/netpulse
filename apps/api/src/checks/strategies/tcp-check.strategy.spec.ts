import { EventEmitter } from 'node:events';

class FakeSocket extends EventEmitter {
  setTimeout = jest.fn();
  connect = jest.fn();
  destroy = jest.fn();
}

jest.mock('node:net', () => ({
  Socket: jest.fn().mockImplementation(() => new FakeSocket()),
}));

import { Socket } from 'node:net';
import { TcpCheckStrategy } from './tcp-check.strategy';

const MockedSocket = Socket as unknown as jest.Mock;

function lastSocket(): FakeSocket {
  const { results } = MockedSocket.mock;
  return results[results.length - 1].value as FakeSocket;
}

describe('TcpCheckStrategy', () => {
  let strategy: TcpCheckStrategy;

  beforeEach(() => {
    strategy = new TcpCheckStrategy();
    MockedSocket.mockClear();
  });

  it('parsea "host:puerto" con un dominio', async () => {
    const promise = strategy.run('github.com:443');

    expect(lastSocket().connect).toHaveBeenCalledWith(443, 'github.com');

    lastSocket().emit('connect');
    await promise;
  });

  it('parsea "host:puerto" cuando el host es una IP (el separador es el ultimo ":")', async () => {
    const promise = strategy.run('1.1.1.1:53');

    expect(lastSocket().connect).toHaveBeenCalledWith(53, '1.1.1.1');

    lastSocket().emit('connect');
    await promise;
  });

  it('resuelve con exito al conectar y mide la latencia', async () => {
    const promise = strategy.run('github.com:443');
    lastSocket().emit('connect');

    const outcome = await promise;

    expect(outcome.success).toBe(true);
    expect(outcome.statusCode).toBeNull();
    expect(outcome.errorMessage).toBeNull();
    expect(outcome.latencyMs).not.toBeNull();
  });

  it('da fallo con mensaje propio cuando el socket agota el timeout', async () => {
    const promise = strategy.run('smtp.gmail.com:587');
    lastSocket().emit('timeout');

    const outcome = await promise;

    expect(outcome).toEqual({
      success: false,
      latencyMs: null,
      statusCode: null,
      errorMessage: 'Connection timed out',
    });
  });

  it('da fallo con el mensaje del error cuando la conexion se rechaza', async () => {
    const promise = strategy.run('1.1.1.1:53');
    lastSocket().emit('error', new Error('connect ECONNREFUSED 1.1.1.1:53'));

    const outcome = await promise;

    expect(outcome).toEqual({
      success: false,
      latencyMs: null,
      statusCode: null,
      errorMessage: 'connect ECONNREFUSED 1.1.1.1:53',
    });
  });

  it('cierra el socket tanto si conecta como si falla', async () => {
    const promiseOk = strategy.run('github.com:443');
    const socketOk = lastSocket();
    socketOk.emit('connect');
    await promiseOk;
    expect(socketOk.destroy).toHaveBeenCalledTimes(1);

    const promiseFail = strategy.run('github.com:443');
    const socketFail = lastSocket();
    socketFail.emit('error', new Error('boom'));
    await promiseFail;
    expect(socketFail.destroy).toHaveBeenCalledTimes(1);
  });

  it('aplica el timeout configurado al socket antes de conectar', async () => {
    const promise = strategy.run('github.com:443');
    const socket = lastSocket();

    expect(socket.setTimeout).toHaveBeenCalledWith(10_000);

    socket.emit('connect');
    await promise;
  });
});
