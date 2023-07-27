import { TTLCache } from './ttl-cache';

describe('TTLCache', () => {
  it('should expire cache after ttl', async () => {
    jest.useFakeTimers();

    const cache = new TTLCache(1000);
    const fetcher = jest.fn(() => 2);
    const key = 'key';

    expect(await cache.get(key, fetcher)).toBe(2);
    expect(fetcher).toHaveBeenCalledTimes(1);

    // T = 0
    await cache.get(key, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);

    // T = 500ms
    jest.advanceTimersByTime(500);
    await cache.get(key, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);

    // T = 1000ms
    jest.advanceTimersByTime(500);
    await cache.get(key, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
