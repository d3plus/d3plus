/** A data cache: response text by `cacheKey`. */
export interface LoadCache {
  get(key: string): unknown;
  set(key: string, value: string): void;
}

/** The receivers waiting on in-flight requests, by cache key. */
export type InFlight<R> = Map<string, R[]>;

/**
  How much response text the shared cache keeps, in characters: about 50 MB of
  memory, at about 2 bytes per character.
*/
export const DATA_CACHE_LIMIT = 25 * 1024 * 1024;

/**
  A least-recently-used cache of response text that evicts by the total
  length of the text it holds, so a few large files and many small ones cost
  the same. A response longer than the whole limit is not kept.
  @private
*/
export class SizedCache implements LoadCache {
  /** Most recently used last. */
  private readonly _map = new Map<string, string>();
  private _size = 0;

  /** @param limit The most text to keep, in characters. */
  constructor(readonly limit: number = DATA_CACHE_LIMIT) {}

  /** The total length of the cached text. */
  get size(): number {
    return this._size;
  }

  /** The cached keys, least recently used first. */
  keys(): string[] {
    return [...this._map.keys()];
  }

  get(key: string): string | undefined {
    const value = this._map.get(key);
    if (value === undefined) return undefined;
    this._map.delete(key);
    this._map.set(key, value);
    return value;
  }

  set(key: string, value: string): void {
    this.delete(key);
    if (value.length > this.limit) return;
    this._map.set(key, value);
    this._size += value.length;
    for (const [oldest, text] of this._map) {
      if (this._size <= this.limit) break;
      this._map.delete(oldest);
      this._size -= text.length;
    }
  }

  delete(key: string): void {
    const value = this._map.get(key);
    if (value === undefined) return;
    this._map.delete(key);
    this._size -= value.length;
  }

  clear(): void {
    this._map.clear();
    this._size = 0;
  }
}

/** The cache every chart on the page shares. */
export const sharedCache = new SizedCache();

/** The in-flight requests of each cache. */
const inFlight = new WeakMap<LoadCache, InFlight<unknown>>();

/**
  The requests in flight for `cache`, created when it has none.
  @private
*/
export function inFlightFor<R>(cache: LoadCache): InFlight<R> {
  let pending = inFlight.get(cache);
  if (!pending) inFlight.set(cache, (pending = new Map()));
  return pending as InFlight<R>;
}

/**
  Whether `pending` is still `cache`'s current set of in-flight requests:
  false once `clearDataCache` has run since it was created.
  @private
*/
export function isCurrent(
  cache: LoadCache,
  pending: InFlight<unknown>,
): boolean {
  return inFlight.get(cache) === pending;
}

/**
  Empties the data cache that every chart shares, so the next load of each URL fetches it again (after a user logs out, say). Requests already in flight still reach the charts waiting on them, but their responses are not cached, and a load started after the clear fetches anew rather than joining one of them.
*/
export default function clearDataCache(): void {
  sharedCache.clear();
  inFlight.delete(sharedCache);
}
