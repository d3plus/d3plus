import {csv, json, text, tsv} from "d3-fetch";
import {isObject} from "@d3plus/dom";

import type {DataPoint} from "./DataPoint.js";
import fold from "./fold.js";
import concat from "./concat.js";
import isData from "./isData.js";

type DataFormatter = (
  data: DataPoint[] | DataPoint[][],
) => DataPoint[] | Record<string, unknown>;

interface LoadRequestConfig {
  url: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

interface VizContext {
  _cache: boolean;
  _lrucache: {set(key: string, value: DataPoint[] | DataPoint[][]): void};
  config(obj: Record<string, unknown>): void;
  schema?: Record<string, unknown>;
  [key: string]: unknown;
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

/**
  Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.
  @param path The path to the file or url to be loaded. Also support array of paths strings. If an Array of objects is passed, the xhr request logic is skipped.
  @param formatter Optional function to transform the loaded data.
  @param key The key in the `this` context to save the resulting data to.
  @param callback Optional function called with the error and loaded data.
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
  const fetchData = (
    path: string,
    init: RequestInit = {},
  ): Promise<DataPoint[] | Record<string, unknown>> => {
    const ext = path.slice(path.length - 4);
    switch (ext) {
      case ".csv":
        return csv(path, init as RequestInit) as Promise<DataPoint[]>;
      case ".tsv":
        return tsv(path, init as RequestInit) as Promise<DataPoint[]>;
      case ".txt":
        return text(path, init as RequestInit) as unknown as Promise<
          DataPoint[]
        >;
      default:
        return json(path, init as RequestInit) as Promise<
          Record<string, unknown>
        >;
    }
  };

  const validateData = (
    data: DataPoint[] | Record<string, unknown>,
  ): DataPoint[] | Record<string, unknown> => {
    if (data && data instanceof Array) {
      data.forEach((d: DataPoint) => {
        for (const k in d) {
          const v = d[k];
          if (typeof v === "string") {
            if (!isNaN(v as unknown as number)) d[k] = parseFloat(v);
            else if (v.toLowerCase() === "false") d[k] = false;
            else if (v.toLowerCase() === "true") d[k] = true;
          }
        }
      });
    }
    return data;
  };

  const loadedLength = (loadedArray: (DataPoint[] | undefined)[]): number =>
    loadedArray.reduce(
      (prev: number, current) => (current ? prev + 1 : prev),
      0,
    );

  // If path param is a not an Array then convert path to a 1 element Array to re-use logic
  if (!(path instanceof Array))
    path = [path] as (string | LoadRequestConfig | DataPoint[])[];

  const needToLoad = path.find(isData);

  let loaded: (DataPoint[] | undefined)[] = new Array(path.length);
  const toLoad: (string | LoadRequestConfig)[] = [];

  // If there is a string I'm assuming is a Array to merge, urls or data
  if (needToLoad) {
    path.forEach((dataItem, ix: number) => {
      if (isData(dataItem)) toLoad.push(dataItem as string | LoadRequestConfig);
      else loaded[ix] = dataItem as DataPoint[];
    });
  }
  // Data array itself
  else {
    loaded[0] = path as DataPoint[];
  }

  // Load all urls an combine them with data arrays
  const alreadyLoaded = loadedLength(loaded);
  toLoad.forEach(dataItem => {
    let url: string = dataItem as string;
    let init: Record<string, unknown> = {};
    if (typeof dataItem === "object" && dataItem.url) {
      url = dataItem.url;
      init = dataItem;
    }
    fetchData(url, init as RequestInit)
      .then((data: DataPoint[] | Record<string, unknown>) => {
        if (
          !(data instanceof Array) &&
          (data as Record<string, unknown>).data &&
          (data as Record<string, unknown>).headers
        )
          data = fold(data as Parameters<typeof fold>[0]);
        data = validateData(data);
        loaded[
          (path as (string | LoadRequestConfig | DataPoint[])[]).findIndex(
            d => JSON.stringify(d) == JSON.stringify(dataItem),
          )
        ] = data as DataPoint[];
        // All urls loaded
        if (loadedLength(loaded) - alreadyLoaded === toLoad.length) {
          // Format data
          let result: DataPoint[] | DataPoint[][] =
            loadedLength(loaded) === 1
              ? loaded[0]!
              : (loaded.filter(Boolean) as DataPoint[][]);
          if (this._cache) this._lrucache.set(`${key}_${url}`, result);

          if (formatter) {
            const formatterResponse = formatter(
              loadedLength(loaded) === 1
                ? loaded[0]!
                : (loaded.filter(Boolean) as DataPoint[][]),
            );
            if (key === "data" && isObject(formatterResponse)) {
              result = ((formatterResponse as Record<string, unknown>).data ||
                []) as DataPoint[];
              delete (formatterResponse as Record<string, unknown>).data;
              this.config(formatterResponse as Record<string, unknown>);
            } else result = (formatterResponse || []) as DataPoint[];
          } else if (key === "data") {
            result = concat(loaded.filter(Boolean) as DataPoint[][], "data");
          }

          if (key) storeLoaded(this, key, result);
          if (callback) callback(undefined, result);
        }
      })
      .catch((err: Error) => {
        console.error(err);
        if (callback) callback(err, undefined);
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

    // Format data
    let result: DataPoint[] | DataPoint[][] =
      loadedLength(loaded) === 1
        ? loaded[0]!
        : (loaded.filter(Boolean) as DataPoint[][]);
    if (formatter) {
      const formatterResponse = formatter(
        loadedLength(loaded) === 1
          ? loaded[0]!
          : (loaded.filter(Boolean) as DataPoint[][]),
      );
      if (key === "data" && isObject(formatterResponse)) {
        result = ((formatterResponse as Record<string, unknown>).data ||
          []) as DataPoint[];
        delete (formatterResponse as Record<string, unknown>).data;
        this.config(formatterResponse as Record<string, unknown>);
      } else result = (formatterResponse || []) as DataPoint[];
    } else if (key === "data") {
      result = concat(loaded.filter(Boolean) as DataPoint[][], "data");
    }

    if (key && `_${key}` in this) this[`_${key}`] = result;
    if (callback) callback(null, result);
  }
}
