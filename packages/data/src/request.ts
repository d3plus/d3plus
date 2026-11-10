import {text} from "d3-fetch";
import {csvParse, tsvParse} from "d3-dsv";

import type {DataPoint} from "./DataPoint.js";
import cacheKey from "./cacheKey.js";
import copyPayload from "./copyPayload.js";
import {inFlightFor, isCurrent} from "./dataCache.js";
import type {LoadCache} from "./dataCache.js";
import fold from "./fold.js";
import validateData from "./validateData.js";

/** A request object: a URL plus `fetch` request options. */
export interface LoadRequestConfig {
  url: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

/** A parsed response. */
export type Payload = DataPoint[] | Record<string, unknown> | string;

/** Receives a request's parsed payload, or the error that ended it. */
type Receiver = (error: Error | undefined, payload?: Payload) => void;

/**
  Parses a response body by its URL's file extension (CSV, TSV, plain text, or
  JSON), folds a `{headers, data}` response into rows, and coerces stringified
  numbers and booleans.
  @param url The URL the body came from.
  @param body The response text.
  @private
*/
export function parsePayload(url: string, body: string): Payload {
  const ext = url.slice(url.length - 4);
  let data =
    ext === ".csv"
      ? csvParse(body)
      : ext === ".tsv"
        ? tsvParse(body)
        : ext === ".txt"
          ? body
          : JSON.parse(body);
  if (!(data instanceof Array) && data.data && data.headers)
    data = fold(data as Parameters<typeof fold>[0]);
  return validateData(data as Payload);
}

/**
  Hands each receiver the payload, the first one the parsed original and the
  rest their own copies, all made before any receiver can change it. A
  receiver that throws gets the error, as a failed request would.
  @private
*/
function deliver(receivers: Receiver[], payload: Payload): void {
  const payloads = receivers.map((_, i) =>
    i === 0 ? payload : copyPayload(payload),
  );
  receivers.forEach((receive, i) =>
    Promise.resolve()
      .then(() => receive(undefined, payloads[i]))
      .catch((err: Error) => receive(err)),
  );
}

/**
  Fetches and parses one URL or request object for `receive`. With a cache,
  a response already in it is parsed at once (calling back synchronously), and
  requests for the same key while one is in flight share its fetch and parse,
  each receiver getting its own copy. The response text is cached once it
  parses; a failed request is not.
  @param item The URL or request object.
  @param cache The data cache, when the load caches.
  @param receive Called with the parsed payload, or the error.
  @private
*/
export default function request(
  item: string | LoadRequestConfig,
  cache: LoadCache | undefined,
  receive: Receiver,
): void {
  const url = typeof item === "object" ? item.url : item;
  const init = (typeof item === "object" ? item : {}) as RequestInit;
  const key = cache ? cacheKey(item) : "";
  const receivers = [receive];
  const pending = cache ? inFlightFor<Receiver>(cache) : undefined;
  if (cache && pending) {
    const body = cache.get(key);
    if (typeof body === "string") {
      receive(undefined, parsePayload(url, body));
      return;
    }
    const waiting = pending.get(key);
    if (waiting) {
      waiting.push(receive);
      return;
    }
    pending.set(key, receivers);
  }
  /** The receivers of this request, which stops being in flight. */
  const settle = (): Receiver[] => {
    pending?.delete(key);
    return receivers;
  };
  text(url, init)
    .then(body => {
      const payload = parsePayload(url, body);
      // A request the cache was cleared during delivers without caching.
      if (cache && pending && isCurrent(cache, pending)) cache.set(key, body);
      return payload;
    })
    .then(
      payload => deliver(settle(), payload),
      (err: Error) =>
        settle().forEach(r => Promise.resolve().then(() => r(err))),
    );
}
