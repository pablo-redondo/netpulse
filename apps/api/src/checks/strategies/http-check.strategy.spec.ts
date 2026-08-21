import { HttpCheckStrategy } from './http-check.strategy';

function mockFetchResolvedWith(status: number, body = ''): jest.Mock {
  return jest
    .fn()
    .mockResolvedValue({ status, text: () => Promise.resolve(body) });
}

describe('HttpCheckStrategy', () => {
  let strategy: HttpCheckStrategy;
  const originalFetch = global.fetch;

  beforeEach(() => {
    strategy = new HttpCheckStrategy();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('da por buena una respuesta 200 y mide la latencia', async () => {
    global.fetch = mockFetchResolvedWith(200);

    const outcome = await strategy.run('https://github.com');

    expect(outcome.success).toBe(true);
    expect(outcome.statusCode).toBe(200);
    expect(outcome.errorMessage).toBeNull();
    expect(outcome.latencyMs).not.toBeNull();
    expect(outcome.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('da por buena una redirección 301', async () => {
    global.fetch = mockFetchResolvedWith(301);

    const outcome = await strategy.run('https://google.com');

    expect(outcome.success).toBe(true);
    expect(outcome.statusCode).toBe(301);
  });

  it('da por malo un 404, pero conserva la latencia: hubo respuesta', async () => {
    global.fetch = mockFetchResolvedWith(404);

    const outcome = await strategy.run('https://api.github.com/does-not-exist');

    expect(outcome.success).toBe(false);
    expect(outcome.statusCode).toBe(404);
    expect(outcome.latencyMs).not.toBeNull();
  });

  it('da por malo un 500', async () => {
    global.fetch = mockFetchResolvedWith(500);

    const outcome = await strategy.run('https://example.com');

    expect(outcome.success).toBe(false);
    expect(outcome.statusCode).toBe(500);
  });

  it('un error de red se traduce en fallo sin latencia ni codigo', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

    const outcome = await strategy.run('https://no-existe.invalid');

    expect(outcome).toEqual({
      success: false,
      latencyMs: null,
      statusCode: null,
      errorMessage: 'getaddrinfo ENOTFOUND',
    });
  });

  it('envia un User-Agent identificable en la peticion', async () => {
    const fetchMock = mockFetchResolvedWith(200);
    global.fetch = fetchMock;

    await strategy.run('https://github.com');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://github.com',
      expect.objectContaining({
        headers: { 'User-Agent': 'NetPulse-Monitor/1.0 (portfolio project)' },
      }),
    );
  });

  it('con expectedContent, da por bueno un 200 que contiene el texto', async () => {
    global.fetch = mockFetchResolvedWith(
      200,
      '<html>Bienvenido a Wikipedia</html>',
    );

    const outcome = await strategy.run('https://wikipedia.org', {
      expectedContent: 'Wikipedia',
    });

    expect(outcome.success).toBe(true);
  });

  it('con expectedContent, da por malo un 200 que no lo contiene', async () => {
    global.fetch = mockFetchResolvedWith(200, '<html>Otra cosa</html>');

    const outcome = await strategy.run('https://wikipedia.org', {
      expectedContent: 'Wikipedia',
    });

    expect(outcome.success).toBe(false);
    expect(outcome.statusCode).toBe(200);
    expect(outcome.errorMessage).toMatch(/contenido esperado/i);
  });

  it('sin expectedContent, no lee el body de la respuesta', async () => {
    const textMock = jest.fn().mockResolvedValue('');
    global.fetch = jest.fn().mockResolvedValue({ status: 200, text: textMock });

    await strategy.run('https://github.com');

    expect(textMock).not.toHaveBeenCalled();
  });

  it('aborta y devuelve fallo si el servidor no responde a tiempo', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(
      (_url, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const abortError = new Error('This operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        }),
    ) as unknown as typeof fetch;

    const promise = strategy.run('https://muy-lento.example');
    await jest.advanceTimersByTimeAsync(10_000);
    const outcome = await promise;

    expect(outcome.success).toBe(false);
    expect(outcome.latencyMs).toBeNull();
    expect(outcome.errorMessage).toMatch(/abort/i);
  });
});
