export interface TTLCacheItem<T> {
  expires: number;
  value: T;
}

export type TTLCacheFetcher<T> = (() => T) | (() => Promise<T>);

export class TTLCache<T> {
  cache: Record<string, TTLCacheItem<T> | undefined> = {};

  constructor(private ttl: number) {}

  async get(key: string, fetcher: TTLCacheFetcher<T>): Promise<T> {
    const item = this.cache[key];

    if (item && item.expires > Date.now()) {
      return item.value;
    }

    const value = await fetcher();
    this.cache[key] = {
      value,
      expires: Date.now() + this.ttl,
    };

    return value;
  }
}
