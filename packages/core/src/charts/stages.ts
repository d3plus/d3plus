/**
    E1 (RFC §3): `Viz._preDraw` as a pipeline of pure stages.

    Status: **live.** `Viz._preDraw` runs these stages via `runStages` and the
    progressive writeback below copies each stage's outputs onto `this` so any
    downstream legacy consumer (drawSteps, `_thresholdFunction`, chart subclass
    `_draw` overrides, component instances) reads the values the prior stage
    produced. The pipeline ran into a Treemap hang on first attempt because
    `Treemap._thresholdFunction` reads `this._drawDepth` and the writeback
    used to happen only after all stages — fixed by writing back progressively.

    @see docs/V4_PHASE_E_PLAN.md for the broader pipeline/feature/fluent plan.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import {group, max, min, rollup} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {merge} from "@d3plus/data";
import {date} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

/**
    A function that introspects the `d` Data Object for internally nested
    d3plus data and indices, runs the accessor function on that user data.
    @private
*/
function accessorFetch(
  acc: (d: DataPoint, i: number) => unknown,
  d: DataPoint,
  i: number,
): unknown {
  while (d.__d3plus__ && d.data) {
    if (typeof d.i === "number") i = d.i;
    d = d.data as DataPoint;
  }
  return acc(d, i);
}

/** Turns an array of values into a comma+and joined string. @private */
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

/**
    @interface VizContext
    The value that flows through the chart pipeline. Each stage reads from it
    and returns the fields it derives. The runner (`Viz._preDraw`) folds the
    stages together and writes the result back onto the Viz instance so legacy
    consumers (`_draw`, drawSteps, components) see the same shape.
*/
export interface VizContext {
  /** The chart instance. Stages read configuration from it. */
  viz: any;
  // Derived outputs (populated as stages run):
  drawDepth?: number;
  id?: (d: DataPoint, i: number) => unknown;
  ids?: (d: DataPoint, i: number) => string[];
  drawLabel?: (d: DataPoint, i: number, depth?: number) => string;
  timeFilter?: (d: DataPoint, i?: number) => boolean;
  filteredData?: DataPoint[];
  legendData?: DataPoint[];
  /** Adjustments to `viz.schema.shapeConfig` deferred until writeback. */
  shapeConfigOverrides?: {hoverOpacity?: number; duration?: number};
  /** True when no data passes filters and the noData message should display. */
  displayNoData?: boolean;
  /**
      Chart-specific layout output (e.g. Treemap's d3-hierarchy result). Produced
      by `applyTreemapLayout` and consumed by Treemap's `_draw` to drive the
      Rect emit. Generic on purpose — each chart's layout stage shapes it.
  */
  shapeData?: any[];
  /**
      Plot's chart-specific staged outputs. `formatPlotData` produces them;
      downstream Plot stages (and Plot._draw's paint phase) read them.
  */
  plotFormattedData?: any[];
  plotAxisData?: any[];
  x2Exists?: boolean;
  y2Exists?: boolean;
  /** Closure used by Plot's stacked branch to compute fillerPoint groups. */
  plotStackGroup?: (d: any, i: number) => string;
  /** Per-axis unique values arrays (output of `computePlotAxisValues`). */
  xData?: any[];
  x2Data?: any[];
  yData?: any[];
  y2Data?: any[];
  /** Initial domains from the stacked/non-stacked branch (output of `computePlotInitialDomains`). */
  plotInitialDomains?: Record<string, any[]>;
  /** Stacked-mode bookkeeping (output of `computePlotInitialDomains`). */
  plotDiscreteKeys?: any[];
  plotStackData?: any[];
  plotStackKeys?: any[];
  /** Final domains after log/baseline adjustments (output of `computePlotScales`). */
  plotDomains?: Record<string, any[]>;
  /** Four configured d3 scale instances + their scale-type strings. */
  plotScales?: any;
  plotConfigScales?: any;
  plotOpps?: any;
  /** Pre-measured test axes + label-test shapes for `measurePlotLineLabels`. */
  plotTestAxes?: any;
  plotLineLabelTest?: any;
  /** Outputs of `measurePlotLineLabels`. */
  plotLabelWidths?: any[];
  plotLargestLabel?: number;
  plotXRangeMax?: number;
  /** Outputs of `preparePlotAxisLayout`. */
  plotDefaultConfig?: any;
  plotDefaultX2Config?: any;
  plotDefaultY2Config?: any;
  plotShowX?: boolean;
  plotShowY?: boolean;
  plotYC?: any;
  plotBarLabels?: string[];
  plotXTicks?: any[] | null;
  plotX2Ticks?: any[] | null;
  plotYTicks?: any[] | null;
  plotY2Ticks?: any[] | null;
  plotXDomain?: any[];
  plotX2Domain?: any[];
  plotYDomain?: any[];
  plotY2Domain?: any[];
}

/**
    @type TransformStage
    A pipeline stage: pure function from a context to the fields it derives.
    Stages never mutate the input; the runner merges the returned partial.
*/
export type TransformStage = (ctx: VizContext) => Partial<VizContext>;

/* ------------------------------ stages ------------------------------ */

/** Resolve which depth of the groupBy hierarchy is being drawn. */
export const resolveDrawDepth: TransformStage = ({viz}) => ({
  drawDepth:
    viz.schema.depth !== void 0
      ? min([viz.schema.depth >= 0 ? viz.schema.depth : 0, viz.schema.groupBy.length - 1])!
      : viz.schema.groupBy.length - 1,
});

/** Build the id / ids closures used to key shapes for the current draw depth. */
export const buildIdAccessors: TransformStage = ({viz, drawDepth}) => {
  const id = (d: DataPoint, i: number) => {
    const groupByDrawDepth = accessorFetch(viz.schema.groupBy[drawDepth!], d, i);
    return typeof groupByDrawDepth === "number"
      ? `${groupByDrawDepth}`
      : groupByDrawDepth;
  };
  const ids = (d: DataPoint, i: number) =>
    (viz.schema.groupBy as ((d: DataPoint, i: number) => unknown)[])
      .map(g => `${accessorFetch(g, d, i)}`)
      .filter(Boolean);
  return {id, ids};
};

/** Build the draw-label closure (drill-down captions, threshold aggregation labels). */
export const buildDrawLabel: TransformStage = ({viz, drawDepth, ids}) => ({
  drawLabel: (d: DataPoint, i: number, depth: number = drawDepth!): string => {
    if (!d) return "";
    while (d.__d3plus__ && d.data) {
      d = d.data as DataPoint;
      i = d.i as number;
    }
    if (d._isAggregation) {
      return `${viz.schema.thresholdName(d, i)} < ${formatAbbreviate(
        (d._threshold as number) * 100,
        viz.schema.locale,
      )}%`;
    }
    if (viz.schema.label && depth === drawDepth) return `${viz.schema.label(d, i)}`;
    const l = ids!(d, i).slice(0, depth + 1);
    const n =
      l.reverse().find((ll: unknown) => !Array.isArray(ll)) || l[l.length - 1];
    return Array.isArray(n) ? listify(n) : `${n}`;
  },
});

/**
    Initialize the time filter when one wasn't set. The discrete-axis case
    keeps the data unfiltered; otherwise the filter pins to the latest time.
*/
export const applyTimeFilter: TransformStage = ({viz}) => {
  if (!viz.schema.time || viz.schema.timeFilter || !viz._data.length) {
    return {timeFilter: viz.schema.timeFilter};
  }
  const dates = viz._data.map(viz.schema.time).map(date);
  const d = viz._data[0];
  const i = 0;
  if (
    viz.schema.discrete &&
    `_${viz.schema.discrete}` in viz &&
    viz[`_${viz.schema.discrete}`](d, i) === viz.schema.time(d, i)
  ) {
    return {timeFilter: () => true};
  }
  const latestTime = +max(dates as Date[])!;
  return {
    timeFilter: (d: DataPoint, i?: number) =>
      +date(viz.schema.time(d, i ?? 0))! === latestTime,
  };
};

/**
    Filter the data + rollup by groupBy + discrete axes, merging leaves through
    `viz.schema.aggs`. Applies hidden/solo. Produces `filteredData` and `legendData`.
*/
export const rollupAndFilter: TransformStage = ({viz, id, drawDepth, timeFilter}) => {
  const filteredOut: DataPoint[] = [];
  const legendData: DataPoint[] = [];
  if (!viz._data.length) return {filteredData: filteredOut, legendData};

  let flatData: DataPoint[] = timeFilter ? viz._data.filter(timeFilter) : viz._data;
  if (viz.schema.filter) flatData = flatData.filter(viz.schema.filter);

  const nestKeys: ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])[] = [];
  for (let i = 0; i <= drawDepth!; i++) nestKeys.push(viz.schema.groupBy[i]);
  if (viz.schema.discrete && `_${viz.schema.discrete}` in viz) nestKeys.push(viz[`_${viz.schema.discrete}`]);
  if (viz.schema.discrete && `_${viz.schema.discrete}2` in viz) nestKeys.push(viz[`_${viz.schema.discrete}2`]);

  let collected: DataPoint[] = filteredOut;

  rollup(
    flatData,
    (leaves: DataPoint[]) => {
      const index = viz._data.indexOf(leaves[0]);
      const shape = viz.schema.shape(leaves[0], index);
      const idValue = id!(leaves[0], index);
      const d = merge(leaves, viz.schema.aggs) as unknown as DataPoint;
      if (
        !viz._hidden.includes(idValue) &&
        (!viz._solo.length || viz._solo.includes(idValue))
      ) {
        if (!viz.schema.discrete && shape === "Line") collected = collected.concat(leaves);
        else collected.push(d);
      }
      legendData.push(d);
      return null;
    },
    ...nestKeys,
  );

  return {filteredData: collected, legendData};
};

/** Apply the optional threshold function to merge small leaves into aggregates. */
export const applyThreshold: TransformStage = ({viz, filteredData, id: _id, drawDepth, timeFilter}) => {
  // Rebuild the rollup tree for the threshold function to consume.
  if (!viz._data.length) return {filteredData};
  let flatData: DataPoint[] = timeFilter ? viz._data.filter(timeFilter) : viz._data;
  if (viz.schema.filter) flatData = flatData.filter(viz.schema.filter);
  const nestKeys: ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])[] = [];
  for (let i = 0; i <= drawDepth!; i++) nestKeys.push(viz.schema.groupBy[i]);
  if (viz.schema.discrete && `_${viz.schema.discrete}` in viz) nestKeys.push(viz[`_${viz.schema.discrete}`]);
  if (viz.schema.discrete && `_${viz.schema.discrete}2` in viz) nestKeys.push(viz[`_${viz.schema.discrete}2`]);
  const tree = rollup(flatData, () => null, ...nestKeys);
  return {filteredData: viz._thresholdFunction(filteredData, tree)};
};

/**
    Auto-disable hover-opacity and animation when the data set is large. Also
    caches the user-provided hover/duration so they can be restored when the
    dataset shrinks below the cutoff again. The cache write is a deliberate
    side effect on `viz` — it's state preservation across renders, not a
    pipeline output.
*/
export const adjustForLargeData: TransformStage = ({viz, filteredData, id}) => {
  const uniqueIds = group(filteredData!, id! as any).size;
  if (uniqueIds > viz.schema.dataCutoff) {
    if (viz._userHover === undefined)
      viz._userHover = viz.schema.shapeConfig.hoverOpacity || 0.5;
    if (viz._userDuration === undefined)
      viz._userDuration = viz.schema.shapeConfig.duration || 600;
    return {shapeConfigOverrides: {hoverOpacity: 1, duration: 0}};
  }
  if (viz._userHover !== undefined) {
    return {
      shapeConfigOverrides: {
        hoverOpacity: viz._userHover,
        duration: viz._userDuration,
      },
    };
  }
  return {};
};

/** Flag empty-data state so the runner can mount the no-data message. */
export const detectNoData: TransformStage = ({viz, filteredData}) => ({
  displayNoData: viz.schema.noDataMessage && !filteredData!.length,
});

/**
    Legacy `Viz._preDraw` stage list. Wired as `def.stages` on every
    ChartDefinition for documentation, but the production preDraw path
    runs `vizPreDrawPure` (in `vizPreDrawPure.ts`) instead — `def.stages`
    is not invoked by any runtime path. The two implementations should
    be kept in sync if either is updated; future cleanup work will
    collapse to a single source of truth (either delete this and the
    `def.stages` field, or wire `vizPreDraw` to consume `def.stages`).

    Each chart subclass that adds chart-specific stages composes them
    onto this base (`[...vizPreDrawStages, applyTreemapLayout]`) — that
    composition IS run via `runChartDraw` for non-paint-driven charts.
*/
export const vizPreDrawStages: TransformStage[] = [
  resolveDrawDepth,
  buildIdAccessors,
  buildDrawLabel,
  applyTimeFilter,
  rollupAndFilter,
  applyThreshold,
  adjustForLargeData,
  detectNoData,
];

/**
    Run a stage pipeline and accumulate the partial outputs into one context.
*/
/**
    Maps context-field names to the `this.*` properties downstream legacy
    consumers (`_draw`, drawSteps, component instances, chart subclasses) read.
    Stages with side effects on `this` (the threshold function reading
    `this._drawDepth`, drawSteps reading `this._filteredData`, etc.) require
    this writeback to happen *before* later stages that may invoke them.
*/
const writebackMap: Record<string, string> = {
  drawDepth: "_drawDepth",
  id: "_id",
  ids: "_ids",
  drawLabel: "_drawLabel",
  timeFilter: "_timeFilter",
  filteredData: "_filteredData",
  legendData: "_legendData",
};

export function runStages(
  initial: VizContext,
  stages: TransformStage[],
): VizContext {
  let ctx = initial;
  const viz = initial.viz;
  for (const stage of stages) {
    const partial = stage(ctx);
    ctx = Object.assign({}, ctx, partial);
    // Progressive writeback: legacy code that one stage transitively invokes
    // (e.g. Treemap._thresholdFunction reading this._drawDepth) sees the
    // values the prior stage produced. `Object.keys` (not `for...in`) so a
    // stage returning a class-instance partial doesn't leak prototype-bag
    // entries onto viz — parity with runLayout's vizUpdate fix.
    for (const key of Object.keys(partial)) {
      const field = writebackMap[key];
      const value = (partial as Record<string, unknown>)[key];
      if (field && value !== undefined)
        (viz as unknown as Record<string, unknown>)[field] = value;
    }
  }
  return ctx;
}
