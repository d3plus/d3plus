import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {isPlainObject} from "../../fluent.js";
import type {ConfigField} from "../../fluent.js";
import {isPollable} from "./vizDataPolling.js";
import type {VizInstance} from "./vizTypes.js";

/** The loaders whose payload a `<key>Format` config key transforms. */
export const FORMAT_KEYS = ["data", "links", "nodes", "topojson"] as const;

/** A loader with a matching `<key>Format` config key. */
export type FormatKey = (typeof FORMAT_KEYS)[number];

/** Transforms a loader's payload (a loaded file or an inline value). */
export type LoadFormatter = (data: unknown) => unknown;

/** A loader's last value, and the formatter its stored payload went through. */
export interface LoaderState {
  source: unknown;
  applied: LoadFormatter | undefined;
}

/** A queued load: `[load, paths, formatter, key]`. */
type QueueEntry = [unknown, unknown, unknown, string];

/** The chart state the loaders read and write. */
export interface LoaderHost {
  schema: Record<string, unknown>;
  config?(config: Record<string, unknown>): unknown;
  _loaders?: Partial<Record<FormatKey, LoaderState>>;
  _queue?: QueueEntry[];
}

/**
    Whether `key` names a loader with a `<key>Format` config key.
    @private
*/
export function isFormatKey(key: string): key is FormatKey {
  return (FORMAT_KEYS as readonly string[]).includes(key);
}

/**
    The `<key>Format` function set on a chart, or `undefined` when none is set.
    @private
*/
export function formatterFor(
  viz: LoaderHost,
  key: FormatKey,
): LoadFormatter | undefined {
  const f = viz.schema[`${key}Format`];
  return typeof f === "function" ? (f as LoadFormatter) : undefined;
}

/**
    Runs `formatter` over a payload the way a loaded file is formatted: a
    `data` formatter may return `{data, ...config}`, whose config is applied to
    the chart. Without a formatter the payload passes through.
    @private
*/
export function formatPayload(
  viz: LoaderHost,
  key: FormatKey,
  payload: unknown,
  formatter: LoadFormatter | undefined,
): unknown {
  if (!formatter) return payload;
  const out = formatter(payload);
  if (key === "data" && isPlainObject(out)) {
    const {data, ...config} = out;
    viz.config?.(config);
    return data || [];
  }
  return out || [];
}

/**
    Stores a loader's payload where its getter reads it: a `_<key>` slot when
    the chart has one (`_data`), its schema otherwise.
    @private
*/
export function storePayload(
  viz: LoaderHost,
  key: string,
  value: unknown,
): void {
  const slots = viz as unknown as Record<string, unknown>;
  if (`_${key}` in slots) slots[`_${key}`] = value;
  else viz.schema[key] = value;
}

/**
    Sets a loader's value (`data`, `links`, `nodes`, `topojson`): a URL or
    request object is queued to load on the next render, and an inline value is
    stored at once. Passing a formatter as the second argument sets
    `<key>Format`; leaving it out keeps the current one.
    @param viz The chart.
    @param key The loader.
    @param args The loader's arguments: the value, then an optional formatter.
    @private
*/
export function setLoaderValue(
  viz: LoaderHost,
  key: FormatKey,
  args: ArrayLike<unknown>,
): void {
  const value = args[0];
  if (args.length > 1) viz.schema[`${key}Format`] = args[1];
  addToQueue.call(
    viz as unknown as ThisParameterType<typeof addToQueue>,
    value as DataPoint[] | string,
    undefined,
    key,
  );
  (viz._loaders ??= {})[key] = {source: value, applied: undefined};
}

/**
    Brings each loader's stored payload in line with its current `<key>Format`
    before a render draws: a URL whose formatter changed since it loaded is
    queued to load again (from the chart's cache when it holds the response),
    and an inline value is formatted in place from the
    value it was given. Queued loads already use the current formatter.
    @private
*/
export function syncLoaderFormats(viz: LoaderHost): void {
  const loaders = viz._loaders;
  if (!loaders) return;
  const queue = viz._queue ?? [];
  for (const key of FORMAT_KEYS) {
    const state = loaders[key];
    if (!state || queue.some(q => q[3] === key)) continue;
    const formatter = formatterFor(viz, key);
    if (state.applied === formatter) continue;
    if (isPollable(state.source)) {
      addToQueue.call(
        viz as unknown as ThisParameterType<typeof addToQueue>,
        state.source as DataPoint[] | string,
        undefined,
        key,
      );
    } else {
      storePayload(viz, key, formatPayload(viz, key, state.source, formatter));
      state.applied = formatter;
    }
  }
}

/**
    The formatter a queued load of `key` runs: the chart's current
    `<key>Format` for a loader that has one (recorded as applied), otherwise
    the formatter queued with it.
    @private
*/
export function queuedFormatter(
  viz: LoaderHost,
  key: string,
  queued: unknown,
): LoadFormatter | undefined {
  if (!isFormatKey(key)) return queued as LoadFormatter | undefined;
  const formatter = formatterFor(viz, key);
  const state = viz._loaders?.[key];
  if (state) state.applied = formatter;
  return formatter;
}

/**
    The `<key>Format` config fields for a chart's loaders. A new
    `topojsonFormat` re-fits the map to the reformatted topojson.
    @param keys The loaders the chart has.
*/
export function loaderFormatFields(...keys: FormatKey[]): ConfigField[] {
  return keys.map(key =>
    key === "topojson"
      ? {
          key: "topojsonFormat",
          onSet: (viz: VizInstance) => {
            viz._zoomSet = false;
          },
        }
      : {key: `${key}Format`},
  );
}
