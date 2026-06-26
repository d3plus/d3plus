/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizPreDrawPure(viz, prevCtx)` — the pure form of `vizPreDraw`.

    Contract: `(spec, prevCtx) → Partial<VizContext>`. This
    function reads from the viz instance (treating it as a spec snapshot —
    only accessor-settable fields) and returns the computed context
    fields without mutating the viz. Callers (the imperative `vizPreDraw`
    shim, or any future pipeline driver) compose the result via spread:

      const next = {...prevCtx, ...vizPreDrawPure(viz, prevCtx)};

    Side-effect carve-out: the "no-data message" path mounts DOM via
    `viz._messageClass.render({container, html, mask, style})` and runs a
    `viz._select.transition()...attr("opacity", 0)` transition. Those are
    deferred to the imperative shim — the pure function only returns
    `noDataMessage: true/false` so the shim can act on it.

    Closure carve-out: `id`/`ids` snapshot `viz.schema.groupBy` / `viz.schema.label` /
    `viz.schema.thresholdName` / `viz.schema.locale` at construction time;
    `drawLabel` snapshots the same set but live-reads `viz._drawDepth` so
    intra-render depth mutations (legend drill-down, subclass overrides)
    are reflected. Callers needing referential transparency on depth
    should pass it explicitly; the public closures are stable for the
    snapshot set, which is the contract today and into the foreseeable
    architectural evolution.
*/

import {group, max, min, rollup} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

import {discreteNestKeys} from "./stages.js";
import type {VizContext} from "./vizContext.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/**
    The shape `vizPreDrawPure` returns: a `Partial<VizContext>` plus the
    two pure-function carve-outs.

      - `_thresholdTree` is the d3-array `rollup` result that
        `viz._thresholdFunction(filteredData, tree)` needs to walk. The
        threshold function is a subclass instance method (Treemap.ts has
        the override) that reads from `this`; calling it pure would require
        moving subclass logic out of the class, which is out of scope.
        Returning the tree lets the shim apply threshold after writing
        `drawDepth` back.
      - `computedTimeFilter` is the time-filter function the pure version
        synthesized (when `_time` is set but `_timeFilter` isn't). The
        shim feeds it to `filteredData` but does NOT write it onto
        `viz.schema.timeFilter` — pinning the synthesized filter (which
        captures `latestTime` at synthesis) would make a later render
        with newer data skip re-synthesis.
*/
type ThresholdTree = any;
type TimeFilterFn =
  | ((d: DataPoint, i: number) => boolean)
  | (() => boolean);

export interface VizPreDrawResult extends Partial<VizContext> {
  /** Internal: d3-array rollup tree, consumed by the shim's threshold step. */
  _thresholdTree?: ThresholdTree;
  /** Internal: synthesized time-filter for the shim to back-assign. */
  computedTimeFilter?: TimeFilterFn;
}

function listify(n: DataPoint[keyof DataPoint][]): string {
  return n.reduce<string>(
    (str: string, item: DataPoint[keyof DataPoint], i: number) => {
      if (!i) str += item;
      else if (i === n.length - 1 && i === 1) str += ` and ${item}`;
      else if (i === n.length - 1) str += `, and ${item}`;
      else str += `, ${item}`;
      return str;
    },
    "",
  );
}

function accessorFetch(
  acc: (d: DataPoint, i: number) => DataPoint[keyof DataPoint],
  d: DataPoint,
  i: number,
): DataPoint[keyof DataPoint] {
  while (d.__d3plus__ && d.data) {
    d = d.data as DataPoint;
    i = d.i as number;
  }
  return acc(d, i);
}

/** The id / ids / drawLabel closures produced for a given preDraw. */
interface LabelClosures {
  id: (d: DataPoint, i: number) => string | number;
  ids: (d: DataPoint, i: number) => string[];
  drawLabel: (d: DataPoint, i: number, depth?: number) => string;
}

/**
    Builds the id / ids / drawLabel snapshot closures from the viz instance.
*/
function buildLabelClosures(viz: Viz, drawDepth: number): LabelClosures {
  // SNAPSHOT CLOSURES (v4 hardening): each closure captures `groupBy`,
  // `label`, `thresholdName`, and `locale` AT CONSTRUCTION instead of
  // reading viz.* at invocation. This makes `ctx.id(d, i)` referentially
  // transparent for those fields — a caller holding the closure across
  // renders gets the input's id-as-of-this-preDraw, not whatever the
  // viz has been mutated to since.
  //
  // EXCEPTION — `_drawDepth`: `drawLabel`'s effective depth is read LIVE
  // from `viz._drawDepth` at call time, falling back to the snapshotted
  // `drawDepth`. So features / stages / subclass overrides that mutate
  // `viz._drawDepth` after preDraw are reflected in label/aria output.
  // Treemap's normal `.depth(n).render()` flow still works (render reruns
  // preDraw); the live read covers the intra-render mutation path.
  const snapGroupBy = viz.schema.groupBy as ((
    d: DataPoint,
    i: number,
  ) => DataPoint[keyof DataPoint])[];
  const snapLabel = viz.schema.label;
  const snapThresholdName = viz.schema.thresholdName;
  const snapLocale = viz.schema.locale;

  const id = (d: DataPoint, i: number): string | number => {
    const groupByDrawDepth = accessorFetch(snapGroupBy[drawDepth], d, i);
    // groupBy values are string|number for id/keying purposes (numbers are
    // stringified so numeric and string ids never collide).
    return typeof groupByDrawDepth === "number"
      ? `${groupByDrawDepth}`
      : (groupByDrawDepth as string | number);
  };

  const ids = (d: DataPoint, i: number) =>
    snapGroupBy
      .map(g => `${accessorFetch(g, d, i)}`)
      .filter(Boolean);

  const drawLabel = (d: DataPoint, i: number, depth?: number) => {
    // Resolve the effective depth at call time. Prefer the live
    // `viz._drawDepth` over the snapshot so intra-render mutations
    // (e.g. a feature/stage that adjusts depth post-preDraw, or a
    // subclass override) are reflected in label/aria output.
    // `viz._drawDepth ?? drawDepth` mirrors the pre-snapshot behavior.
    const liveLeaf = (viz._drawDepth as number | undefined) ?? drawDepth;
    const effDepth = depth ?? liveLeaf;
    if (!d) return "";
    while (d.__d3plus__ && d.data) {
      d = d.data as DataPoint;
      i = d.i as number;
    }
    // ColorScale range buckets carry their label in `id` and have no groupBy
    // fields, so the groupBy resolution below would yield "undefined".
    if (d._isColorScaleBucket) return `${d.id}`;
    if (d._isAggregation) {
      return `${snapThresholdName(d, i)} < ${formatAbbreviate(
        (d._threshold as number) * 100,
        snapLocale,
      )}%`;
    }
    if (snapLabel && effDepth === liveLeaf) return `${snapLabel(d, i)}`;
    const l = ids(d, i).slice(0, effDepth + 1);
    const n =
      l.reverse().find((ll: string) => !((ll as unknown) instanceof Array)) ||
      l[l.length - 1];
    return (n as unknown) instanceof Array
      ? listify(n as unknown as DataPoint[keyof DataPoint][])
      : `${n}`;
  };

  return {id, ids, drawLabel};
}

/**
    Computes a NEW timeFilter when `time` is set but `timeFilter` isn't and
    data exists; returns undefined otherwise.
*/
function computeTimeFilter(viz: Viz): TimeFilterFn | undefined {
  let computedTimeFilter: TimeFilterFn | undefined;
  if (viz.schema.time && !viz.schema.timeFilter && viz._data.length) {
    const dates = viz._data
      .map(viz.schema.time)
      .map((d) => date(d as Parameters<typeof date>[0]));
    const d = viz._data[0],
      i = 0;
    if (
      viz.schema.discrete &&
      `_${viz.schema.discrete}` in viz &&
      (viz as unknown as Record<string, (d: DataPoint, i: number) => unknown>)[
        `_${viz.schema.discrete}`
      ](d, i) === viz.schema.time(d, i)
    ) {
      computedTimeFilter = () => true;
    } else {
      const latestTime = +max(dates as Date[])!;
      // Snapshot `viz.schema.time` into the closure. Without this, a user
      // changing `.time(...)` after the filter is constructed would
      // make the closure read the NEW accessor against the OLD
      // latestTime — nonsense results. Matches the snapGroupBy /
      // snapLabel pattern earlier in this file.
      const snapTime = viz.schema.time;
      computedTimeFilter = (dd: DataPoint, ii: number) =>
        +date(snapTime(dd, ii))! === latestTime;
    }
  }
  return computedTimeFilter;
}

/**
    Filters + groups `viz._data` into the result's `filteredData`,
    `legendData`, and (when data exists) `_thresholdTree`.
*/
function computeFilteredData(
  viz: Viz,
  out: VizPreDrawResult,
  drawDepth: number,
  id: (d: DataPoint, i: number) => DataPoint[keyof DataPoint],
  computedTimeFilter: TimeFilterFn | undefined,
): void {
  const filteredData: DataPoint[] = [];
  const legendData: DataPoint[] = [];
  let flatData: DataPoint[] = [];
  if (viz._data.length) {
    const effectiveTimeFilter = viz.schema.timeFilter || computedTimeFilter;
    flatData = effectiveTimeFilter
      ? viz._data.filter(effectiveTimeFilter)
      : viz._data;
    if (viz.schema.filter) flatData = flatData.filter(viz.schema.filter);

    const nestKeys: ((
      d: DataPoint,
      i: number,
    ) => DataPoint[keyof DataPoint])[] = [];
    for (let i = 0; i <= drawDepth; i++) nestKeys.push(viz.schema.groupBy[i]);
    nestKeys.push(...discreteNestKeys(viz));

    const tree = rollup(
      flatData,
      (leaves: DataPoint[]) => {
        const index = viz._data.indexOf(leaves[0]);
        const shape = viz.schema.shape(leaves[0], index);
        const localId = id(leaves[0], index) as string | number;

        const d = merge(leaves, viz.schema.aggs) as DataPoint;

        if (
          !viz._hidden.includes(localId) &&
          (!viz._solo.length || viz._solo.includes(localId))
        ) {
          if (!viz.schema.discrete && shape === "Line")
            filteredData.push(...leaves);
          else filteredData.push(d);
        }
        legendData.push(d);
      },
      ...nestKeys,
    );

    // `viz._thresholdFunction` reads `this.schema.aggs`/`_drawDepth`/`_groupBy`/etc.
    // It's an instance method (Treemap/Pack override it) that needs `this`.
    // Return the un-thresholded data + the rollup tree as `_thresholdTree`
    // and let the shim apply the threshold once it's written drawDepth back.
    out.filteredData = filteredData;
    out._thresholdTree = tree;
  } else {
    out.filteredData = filteredData;
  }
  out.legendData = legendData;
}

export function vizPreDrawPure(
  viz: Viz,
  _prevCtx: Partial<VizContext> = {},
): VizPreDrawResult {
  // The pure function reads the live `viz` instance directly. The
  // `resolveSpec(viz)` API exists for callers that want a frozen
  // snapshot, but this body does NOT call it — `BaseClass.config()`
  // reflects over every accessor method and memoizes `_configDefault`
  // on first call, which would (a) burn ~30+ reflective accessor calls
  // per preDraw and (b) freeze the defaults baseline to whatever
  // partially-configured state the chart happens to be in at the first
  // preDraw. The viz-instance read is the production contract; the
  // exported `resolveSpec` is available to callers that need it
  // independently.
  const out: VizPreDrawResult = {};

  // 1. drawDepth.
  const drawDepth =
    viz.schema.depth !== void 0
      ? (min([viz.schema.depth >= 0 ? viz.schema.depth : 0, viz.schema.groupBy.length - 1]) as number)
      : viz.schema.groupBy.length - 1;
  out.drawDepth = drawDepth;

  // 2. id / ids / drawLabel closures.
  const {id, ids, drawLabel} = buildLabelClosures(viz, drawDepth);
  out.id = id;
  out.ids = ids;
  out.drawLabel = drawLabel;

  // 3. timeFilter default — computes a NEW timeFilter if not set, otherwise
  // leaves alone. The pure return surfaces it via a synthesized "computed
  // timeFilter" encoded on the context. It's a returned suggestion only:
  // `filteredData` below consumes it, but it is never written onto
  // `viz.schema.timeFilter` (see the shim's note on stale-filter pinning).
  const computedTimeFilter = computeTimeFilter(viz);
  out.computedTimeFilter = computedTimeFilter;

  // 4. filteredData + legendData. Pure transformation of viz._data using
  // the user's filters + grouping, collected into local arrays.
  computeFilteredData(viz, out, drawDepth, id, computedTimeFilter);

  // 5+6. hover/duration overrides + noDataMessage moved to the shim
  // (after the shim applies _thresholdFunction). The pure function CAN'T
  // know filteredData's final shape until threshold runs, and threshold
  // is an instance method that needs `this`.

  return out;
}

// Re-exported so the shim can compute the post-threshold values without
// duplicating the logic. Takes the final filteredData (after threshold)
// + relevant config fields and returns the hover-override + no-data flag.
export function vizPostThresholdCtx(
  viz: Viz,
  filteredData: DataPoint[],
  id: (d: DataPoint, i: number) => any,
): {
  hoverOverride?: {
    hoverOpacity: number;
    duration: number;
    stashOriginals?: boolean;
    restoreOriginals?: boolean;
  };
  noDataMessage: boolean;
} {
  const result: ReturnType<typeof vizPostThresholdCtx> = {noDataMessage: false};
  const uniqueIds = group(filteredData, id).size;
  if (uniqueIds > viz.schema.dataCutoff) {
    result.hoverOverride = {
      hoverOpacity: 1,
      duration: 0,
      stashOriginals: true,
    };
  } else if (viz._userHover !== undefined) {
    result.hoverOverride = {
      hoverOpacity: viz._userHover,
      duration: viz._userDuration!,
      restoreOriginals: true,
    };
  }
  result.noDataMessage = !!(viz.schema.noDataMessage && !filteredData.length);
  return result;
}
