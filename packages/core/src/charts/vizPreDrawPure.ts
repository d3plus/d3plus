/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizPreDrawPure(viz, prevCtx)` — the pure form of `vizPreDraw`.

    RFC §3.1 contract: `(spec, prevCtx) → Partial<VizContext>`. This
    function reads from the viz instance (treating it as a spec snapshot —
    only accessor-settable fields) and returns the computed context
    fields without mutating the viz. Callers (the imperative `vizPreDraw`
    shim, or any future pipeline driver) compose the result via spread:

      const next = {...prevCtx, ...vizPreDrawPure(viz, prevCtx)};

    Side-effect carve-out: the "no-data message" path in legacy
    `_preDraw` calls `viz._messageClass.render({container, html, mask,
    style})` (mounts DOM) and `viz._select.transition()...attr("opacity", 0)`
    (DOM transition). Those are deferred to the imperative shim — the
    pure function only returns `noDataMessage: true/false` so the shim
    can act on it.

    Closure carve-out: `id`/`ids`/`drawLabel` close over `viz._groupBy` /
    `viz._label` / `viz._thresholdName` etc. These closures reflect the
    LIVE viz state when called (not a snapshot at compute time). That's
    the same behavior the legacy `_id = (d, i) => ...this._groupBy[this._drawDepth]...`
    had — callers expecting referential transparency would need explicit
    spec-passing instead, which is the future evolution.
*/

import {group, max, min, rollup} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

import type {VizContext} from "./vizContext.js";
import type {Viz} from "./vizTypes.js";

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
        shim back-assigns it to `viz._timeFilter` for back-compat
        consumers reading the legacy slot.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function vizPreDrawPure(
  viz: Viz,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevCtx: Partial<VizContext> = {},
): VizPreDrawResult {
  // v4: `spec` is the frozen config snapshot, in case a future caller wants
  // to drive the pure function from a config object rather than a live
  // viz instance. Today the closures still read viz-internal fields (some
  // of which aren't surfaced via .config()), so the spec is computed but
  // not yet consumed; this paves the way for the v5 spec/ctx separation.
  // `resolveSpec` is the public API for snapshotting; the call below is
  // the seam that makes the future swap transparent.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _spec = typeof viz.config === "function" ? viz.config() : {};
  const out: VizPreDrawResult = {};

  // 1. drawDepth.
  const drawDepth =
    viz._depth !== void 0
      ? (min([viz._depth >= 0 ? viz._depth : 0, viz._groupBy.length - 1]) as number)
      : viz._groupBy.length - 1;
  out.drawDepth = drawDepth;

  // 2. id / ids / drawLabel closures.
  //
  // SNAPSHOT CLOSURES (v4 hardening): each closure captures the relevant
  // viz state AT CONSTRUCTION (drawDepth, groupBy reference, label,
  // thresholdName, locale) instead of reading viz.* at invocation. Two
  // wins:
  //   (a) referentially transparent — `ctx.id(d, i)` produces the same
  //       output for the same input regardless of subsequent viz mutation.
  //   (b) safe for callers that store closures across renders (currently
  //       no such caller exists, but `_preDraw` is called per render and
  //       overwrites viz._id/_ids/_drawLabel with the new closures — so
  //       intra-render reads always hit the fresh snapshot).
  //
  // The previous "live-state" form (read viz._drawDepth each call) was
  // historically necessary because subclasses like Treemap call
  // `.depth(n).render()` mid-interaction — but `.render()` itself runs
  // `_preDraw` first, regenerating closures with the new depth. So the
  // snapshot form preserves behavior while eliminating a referential-
  // transparency footgun.
  const snapGroupBy = viz._groupBy as ((
    d: DataPoint,
    i: number,
  ) => DataPoint[keyof DataPoint])[];
  const snapLabel = viz._label;
  const snapThresholdName = viz._thresholdName;
  const snapLocale = viz._locale;

  const id = (d: DataPoint, i: number) => {
    const groupByDrawDepth = accessorFetch(snapGroupBy[drawDepth], d, i);
    return typeof groupByDrawDepth === "number"
      ? `${groupByDrawDepth}`
      : groupByDrawDepth;
  };
  out.id = id;

  const ids = (d: DataPoint, i: number) =>
    snapGroupBy
      .map(g => `${accessorFetch(g, d, i)}`)
      .filter(Boolean);
  out.ids = ids;

  const drawLabel = (
    d: DataPoint,
    i: number,
    depth: number = drawDepth,
  ) => {
    if (!d) return "";
    while (d.__d3plus__ && d.data) {
      d = d.data as DataPoint;
      i = d.i as number;
    }
    if (d._isAggregation) {
      return `${snapThresholdName(d, i)} < ${formatAbbreviate(
        (d._threshold as number) * 100,
        snapLocale,
      )}%`;
    }
    if (snapLabel && depth === drawDepth) return `${snapLabel(d, i)}`;
    const l = ids(d, i).slice(0, depth + 1);
    const n =
      l.reverse().find((ll: string) => !((ll as unknown) instanceof Array)) ||
      l[l.length - 1];
    return n instanceof Array ? listify(n) : `${n}`;
  };
  out.drawLabel = drawLabel;

  // 3. timeFilter default — computes a NEW timeFilter if not set, otherwise
  // leaves alone. The pure return surfaces it via a synthesized "computed
  // timeFilter" we encode as part of the context. Since timeFilter is a
  // *config-side* concern (it's a user accessor that the legacy code
  // back-assigns to `viz._timeFilter`), keep it as a returned suggestion;
  // the shim writes it back.
  let computedTimeFilter:
    | ((d: DataPoint, i: number) => boolean)
    | (() => boolean)
    | undefined;
  if (viz._time && !viz._timeFilter && viz._data.length) {
    const dates = viz._data.map(viz._time).map(date);
    const d = viz._data[0],
      i = 0;
    if (
      viz._discrete &&
      `_${viz._discrete}` in viz &&
      viz[`_${viz._discrete}`](d, i) === viz._time(d, i)
    ) {
      computedTimeFilter = () => true;
    } else {
      const latestTime = +max(dates)!;
      computedTimeFilter = (dd: DataPoint, ii: number) =>
        +date(viz._time(dd, ii))! === latestTime;
    }
  }
  out.computedTimeFilter = computedTimeFilter;

  // 4. filteredData + legendData. Pure transformation of viz._data using
  // the user's filters + grouping. The legacy code accumulated via the
  // rollup leaves callback; we collect into local arrays here.
  const filteredData: DataPoint[] = [];
  const legendData: DataPoint[] = [];
  let flatData: DataPoint[] = [];
  if (viz._data.length) {
    const effectiveTimeFilter = viz._timeFilter || computedTimeFilter;
    flatData = effectiveTimeFilter
      ? viz._data.filter(effectiveTimeFilter)
      : viz._data;
    if (viz._filter) flatData = flatData.filter(viz._filter);

    const nestKeys: ((
      d: DataPoint,
      i: number,
    ) => DataPoint[keyof DataPoint])[] = [];
    for (let i = 0; i <= drawDepth; i++) nestKeys.push(viz._groupBy[i]);
    if (viz._discrete && `_${viz._discrete}` in viz)
      nestKeys.push(viz[`_${viz._discrete}`]);
    if (viz._discrete && `_${viz._discrete}2` in viz)
      nestKeys.push(viz[`_${viz._discrete}2`]);

    const tree = rollup(
      flatData,
      (leaves: DataPoint[]) => {
        const index = viz._data.indexOf(leaves[0]);
        const shape = viz._shape(leaves[0], index);
        const localId = id(leaves[0], index);

        const d = merge(leaves, viz._aggs);

        if (
          !viz._hidden.includes(localId) &&
          (!viz._solo.length || viz._solo.includes(localId))
        ) {
          if (!viz._discrete && shape === "Line")
            filteredData.push(...leaves);
          else filteredData.push(d);
        }
        legendData.push(d);
      },
      ...nestKeys,
    );

    // `viz._thresholdFunction` reads `this._aggs`/`_drawDepth`/`_groupBy`/etc.
    // It's an instance method (Treemap/Pack override it) that needs `this`.
    // Return the un-thresholded data + the rollup tree as `_thresholdTree`
    // and let the shim apply the threshold once it's written drawDepth back.
    out.filteredData = filteredData;
    out._thresholdTree = tree;
  } else {
    out.filteredData = filteredData;
  }
  out.legendData = legendData;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  if (uniqueIds > viz._dataCutoff) {
    result.hoverOverride = {
      hoverOpacity: 1,
      duration: 0,
      stashOriginals: true,
    };
  } else if (viz._userHover !== undefined) {
    result.hoverOverride = {
      hoverOpacity: viz._userHover,
      duration: viz._userDuration,
      restoreOriginals: true,
    };
  }
  result.noDataMessage = !!(viz._noDataMessage && !filteredData.length);
  return result;
}
