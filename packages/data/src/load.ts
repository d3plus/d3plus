import type {DataPoint} from "./DataPoint.js";
import fold from "./fold.js";
import concat from "./concat.js";
import isData from "./isData.js";
import request from "./request.js";
import type {LoadCache, LoadRequestConfig} from "./request.js";

type DataFormatter = (
  data: DataPoint[] | DataPoint[][],
) => DataPoint[] | Record<string, unknown>;

interface VizContext {
  /** Overrides `schema.cache` (a poll passes `false` to always fetch). */
  _cache?: boolean;
  _lrucache?: LoadCache;
  config(obj: Record<string, unknown>): void;
  schema?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
  The cache a load reads and writes, when the context caches: its `_cache` flag
  when set, else its `schema.cache`.
  @private
*/
function loadCache(ctx: VizContext): LoadCache | undefined {
  const enabled =
    typeof ctx._cache === "boolean" ? ctx._cache : Boolean(ctx.schema?.cache);
  return enabled ? ctx._lrucache : undefined;
}

/**
  Stores a loaded value under its instance key. Core data slots own a real
  `_<key>` property (e.g. `_data`); schema-managed fold keys (links, nodes,
  topojson, fitObject) live on `schema`.
  @private
*/
function storeLoaded(
  ctx: VizContext,
  key: string,
  value: DataPoint[] | DataPoint[][],
): void {
  if (`_${key}` in ctx) ctx[`_${key}`] = value;
  else if (ctx.schema) ctx.schema[key] = value;
}

type LoadedData = DataPoint[] | DataPoint[][];

/** Counts how many slots of the loaded array are populated. */
function loadedLength(loadedArray: (DataPoint[] | undefined)[]): number {
  return loadedArray.reduce(
    (prev: number, current) => (current ? prev + 1 : prev),
    0,
  );
}

/** A single loaded array unwraps to itself; multiple stay nested. */
function pickInitial(loaded: (DataPoint[] | undefined)[]): LoadedData {
  return loadedLength(loaded) === 1
    ? loaded[0]!
    : (loaded.filter(Boolean) as DataPoint[][]);
}

/**
  Applies the optional user formatter (or the default `concat` for the "data"
  key) to the loaded set, mutating ctx config when the formatter returns an
  object for the "data" key.
*/
function applyFormatter(
  ctx: VizContext,
  loaded: (DataPoint[] | undefined)[],
  formatter: DataFormatter | undefined,
  key: string | undefined,
  result: LoadedData,
): LoadedData {
  if (formatter) {
    const formatterResponse = formatter(pickInitial(loaded));
    // An object (not an array of rows) carries data plus viz config.
    if (
      key === "data" &&
      formatterResponse &&
      typeof formatterResponse === "object" &&
      !Array.isArray(formatterResponse)
    ) {
      result = ((formatterResponse as Record<string, unknown>).data ||
        []) as DataPoint[];
      delete (formatterResponse as Record<string, unknown>).data;
      ctx.config(formatterResponse as Record<string, unknown>);
    } else result = (formatterResponse || []) as DataPoint[];
  } else if (key === "data") {
    result = concat(loaded.filter(Boolean) as DataPoint[][], "data");
  }
  return result;
}

/**
  Formats a complete set of loaded payloads, stores the result under `key`,
  and hands it to the callback.
  @private
*/
function finish(
  ctx: VizContext,
  loaded: (DataPoint[] | undefined)[],
  formatter: DataFormatter | undefined,
  key: string | undefined,
  error: null | undefined,
  callback?: (
    error: Error | null | undefined,
    data: DataPoint[] | DataPoint[][] | undefined,
  ) => void,
): void {
  const result = applyFormatter(
    ctx,
    loaded,
    formatter,
    key,
    pickInitial(loaded),
  );
  if (key) storeLoaded(ctx, key, result);
  if (callback) callback(error, result);
}

/**
  Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.

  When the context caches (its `_cache` flag, else its `schema.cache`), each response's text is kept in its `_lrucache` under `cacheKey(request)`, and a later load of the same request parses it again at once, calling back synchronously, instead of fetching. Loads of a request already in flight share its fetch and parse, each getting its own copy, so a formatter that changes its rows never affects another load. A failed request is not cached.
  @param path The path to the file or url to be loaded. Also support array of paths strings. If an Array of objects is passed, the xhr request logic is skipped.
  @param formatter Optional function to transform the loaded data.
  @param key The key in the `this` context to save the resulting data to.
  @param callback Optional function called with the error and loaded data. Without one, a failed request is logged to the console.
*/
export default function (
  this: VizContext,
  path: string | (string | LoadRequestConfig | DataPoint[])[] | DataPoint[],
  formatter?: DataFormatter,
  key?: string,
  callback?: (
    error: Error | null | undefined,
    data: DataPoint[] | DataPoint[][] | undefined,
  ) => void,
): void {
  // If path param is a not an Array then convert path to a 1 element Array to re-use logic
  if (!(path instanceof Array))
    path = [path] as (string | LoadRequestConfig | DataPoint[])[];

  const needToLoad = path.find(isData);

  let loaded: (DataPoint[] | undefined)[] = new Array(path.length);
  const toLoad: number[] = [];

  // If there is a string I'm assuming is a Array to merge, urls or data
  if (needToLoad) {
    path.forEach((dataItem, ix: number) => {
      if (isData(dataItem)) toLoad.push(ix);
      else loaded[ix] = dataItem as DataPoint[];
    });
  }
  // Data array itself
  else {
    loaded[0] = path as DataPoint[];
  }

  // Load all urls and combine them with data arrays. Cached responses call
  // back at once, so a fully cached load finishes synchronously.
  const cache = toLoad.length && key ? loadCache(this) : undefined;
  let remaining = toLoad.length;
  toLoad.forEach(ix => {
    const dataItem = (path as (string | LoadRequestConfig)[])[ix];
    request(dataItem, cache, (err, data) => {
      if (err) {
        if (callback) callback(err, undefined);
        else console.error(err);
        return;
      }
      loaded[ix] = data as DataPoint[];
      if (--remaining === 0)
        finish(this, loaded, formatter, key, undefined, callback);
    });
  });

  // If there is no data to Load response is immediately
  if (toLoad.length === 0) {
    loaded = loaded.map(data => {
      if (
        data &&
        !(data instanceof Array) &&
        (data as unknown as Record<string, unknown>).data &&
        (data as unknown as Record<string, unknown>).headers
      )
        return fold(data as unknown as Parameters<typeof fold>[0]);
      return data;
    });
    finish(this, loaded, formatter, key, null, callback);
  }
}
