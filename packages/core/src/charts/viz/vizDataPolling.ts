import {isData, load} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {warnConfig} from "../../utils/configWarnings.js";
import {createDataPoller} from "./dataPoller.js";
import type Viz from "./Viz.js";
import {canObserveVisibility, observeVisibility} from "./vizVisibility.js";

type PollPath = string | Record<string, unknown> | DataPoint[];
type Formatter = Parameters<typeof load>[1];

interface PollResult {
  data: DataPoint[];
  config?: Record<string, unknown>;
}

/**
    Whether a `data` value is fetched: a URL, a request object, or an Array
    holding at least one of them.
    @private
*/
export function isPollable(source: unknown): boolean {
  return source instanceof Array ? source.some(isData) : isData(source);
}

/**
    The paths a poll fetches: `source` as an Array, with each URL and request
    object revalidated with the server (`cache: "no-cache"`) unless the request
    sets its own `cache`.
    @private
*/
export function pollPaths(source: unknown): PollPath[] {
  const paths = (source instanceof Array ? source : [source]) as PollPath[];
  return paths.map(p => {
    if (!isData(p)) return p;
    if (typeof p === "string") return {url: p, cache: "no-cache"};
    const request = p as Record<string, unknown>;
    return "cache" in request ? request : {...request, cache: "no-cache"};
  });
}

/**
    A short fingerprint of a JSON-serializable value (its JSON length plus a
    32-bit FNV-1a hash), used to skip redrawing when a poll returns the same
    data.
    @private
*/
export function dataSignature(value: unknown): string {
  const json = JSON.stringify(value) ?? "";
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${json.length}:${(hash >>> 0).toString(36)}`;
}

/**
    Loads `source` the way `data()` does (the same formatter, and a formatter
    may return `{data, ...config}`) without storing it on the chart.
    @private
*/
function fetchPoll(
  viz: Viz,
  source: unknown,
  formatter: Formatter | undefined,
): Promise<PollResult> {
  return new Promise((resolve, reject) => {
    let config: Record<string, unknown> | undefined;
    const ctx = {
      _cache: false,
      _lrucache: viz._lrucache,
      _data: [] as DataPoint[] | DataPoint[][],
      config: (obj: Record<string, unknown>) => {
        config = obj;
      },
    };
    const paths = pollPaths(source) as Parameters<typeof load>[0];
    load.call(ctx, paths, formatter, "data", (err, data) => {
      if (err) reject(err);
      else resolve({data: (data ?? []) as DataPoint[], config});
    });
  });
}

/**
    Records the fingerprint of freshly loaded data, so a poll returning the
    same data skips its redraw.
    @private
*/
export function recordDataSignature(viz: Viz, data: unknown): void {
  viz._dataSignature = viz.schema.dataPollingInterval
    ? dataSignature(data)
    : undefined;
}

/**
    Stops a chart's data polling and its visibility listeners.
    @private
*/
export function stopDataPolling(viz: Viz): void {
  viz._dataPollStop?.();
  viz._dataPollStop = undefined;
  viz._dataPollFor = undefined;
}

/** What a running poll was started for; a change restarts it. */
function pollKey(viz: Viz): unknown[] {
  return [
    viz.schema.dataPollingInterval,
    viz._userData,
    viz._userDataFormat,
    viz.schema.detectVisible,
    viz.schema.scrollContainer,
  ];
}

/** Applies a poll's result and redraws, unless it matches the drawn data. */
function applyPoll(viz: Viz, {data, config}: PollResult): void {
  const signature = dataSignature(data);
  if (signature === viz._dataSignature) return;
  viz._dataSignature = signature;
  if (config) viz.config(config);
  viz._data = data;
  // A timeline the user hasn't brushed re-defaults, following a new latest period.
  if (!viz.schema.timeFilter) viz._timelineSelection = false;
  viz.render();
}

/** Starts polling `viz._userData` every `interval` ms. */
function startDataPolling(viz: Viz, interval: number): void {
  const source = viz._userData;
  const formatter = viz._userDataFormat as Formatter | undefined;
  const doc = viz._select?.node()?.ownerDocument as Document | undefined;
  let offscreen = false;
  const poller = createDataPoller<PollResult>({
    interval,
    fetch: () => fetchPoll(viz, source, formatter),
    onData: result => applyPoll(viz, result),
    onError: err => {
      console.warn(
        "d3plus: dataPollingInterval could not refresh the data; keeping the last data and retrying.",
        err,
      );
    },
    paused: () => offscreen || doc?.visibilityState === "hidden",
  });

  const onVisibilityChange = (): void => {
    if (doc?.visibilityState !== "hidden") poller.resume();
  };
  doc?.addEventListener("visibilitychange", onVisibilityChange);

  const unobserve =
    viz.schema.detectVisible && canObserveVisibility()
      ? observeVisibility(
          viz._select.node(),
          viz.schema.scrollContainer,
          () => {
            offscreen = false;
            poller.resume();
          },
          0,
          () => {
            offscreen = true;
          },
        )
      : undefined;

  viz._dataPollFor = pollKey(viz);
  viz._dataPollStop = () => {
    poller.stop();
    doc?.removeEventListener("visibilitychange", onVisibilityChange);
    unobserve?.();
  };
}

/**
    Starts, restarts or stops a drawn chart's data polling to match its
    `dataPollingInterval` and `data`. A no-op while the poll it would start is
    already running, and never polls during server-side rendering.
    @private
*/
export function syncDataPolling(viz: Viz): void {
  const interval = viz.schema.dataPollingInterval;
  const wanted =
    typeof interval === "number" && interval > 0 && isFinite(interval);
  if (wanted && !isPollable(viz._userData)) {
    warnConfig(
      `${viz.constructor.name}: dataPollingInterval only polls data loaded from a URL.`,
    );
  }
  if (!wanted || viz._ssr || !isPollable(viz._userData)) {
    stopDataPolling(viz);
    return;
  }
  const key = pollKey(viz);
  const running = viz._dataPollFor as unknown[] | undefined;
  if (running && running.every((v, i) => v === key[i])) return;
  stopDataPolling(viz);
  startDataPolling(viz, interval);
}

/**
    Applies a `dataPollingInterval` change to a chart that has finished its
    data load; a chart still loading starts polling once it draws.
    @private
*/
export function onDataPollingIntervalSet(viz: Viz): void {
  if (!viz._dataPollStop && !viz._sceneRenderer) return;
  if (viz._queue?.some((q: unknown[]) => q[3] === "data")) return;
  syncDataPolling(viz);
}
