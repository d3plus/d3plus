/**
    `runStages` folds a list of `TransformStage`s into a context, plus the
    `VizContext` / `TransformStage` types they share and `discreteNestKeys`,
    the rollup nest-key helper.

    `runStages` is the engine for the per-chart layout stages
    (`applyTreemapLayout` etc.) that `runChartDraw` and the Plot pipeline
    invoke. Its progressive writeback copies each stage's outputs onto
    `this` so downstream consumers read the values the prior stage produced
    (writeback is progressive, not after all stages, because
    `Treemap._thresholdFunction` reads `this._drawDepth` mid-pipeline).

    The chart-shell data prep (draw-depth, id accessors, time/user
    filtering, rollup, threshold, large-data adjustment, empty-data
    detection) runs through the imperative `vizPreDrawPure` (see
    `vizPreDrawPure.ts`), which is the single source of truth for it.
*/
import type {DataPoint} from "@d3plus/data";

import type {Axis, TextBox} from "../../components/index.js";
import type Shape from "../../shapes/Shape.js";
import type {D3Scale} from "../../utils/index.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The four configured d3 scales plus their resolved scale-type strings. */
export interface PlotScales {
  x: D3Scale;
  y: D3Scale;
  x2: D3Scale;
  y2: D3Scale;
  xScale: string;
  yScale: string;
  x2Scale: string;
  y2Scale: string;
}

/** Resolved (lower-cased) scale-type strings for each axis. */
export interface PlotConfigScales {
  xConfigScale: string;
  yConfigScale: string;
  x2ConfigScale: string;
  y2ConfigScale: string;
}

/**
    @interface VizContext
    The value that flows through the chart pipeline. Each stage reads from it
    and returns the fields it derives. The runner (`Viz._preDraw`) folds the
    stages together and writes the result back onto the Viz instance so
    consumers (`_draw`, drawSteps, components) see the same shape.
*/
export interface VizContext {
  /**
      The chart instance. Stages read configuration from it. Deliberately
      `any`: this is the pipeline's dynamic bag — stages reach into chart-,
      axis-, and family-specific fields by computed name (`_${axis}Time`,
      `_${o}Config`, …) that a single structural type can't enumerate. Free
      functions that take a single chart use the `VizInstance` contract; this
      bag field stays loose by design (same rationale as `BaseClass.schema`).
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      Rect emit. Generic on purpose — each chart's layout stage shapes it
      (d3-hierarchy nodes, pie arcs, sankey nodes, …); `ChartEmit` narrows it
      to `DataPoint[]` at the emit boundary.
  */
  shapeData?: unknown[];
  /**
      Plot's chart-specific staged outputs. `formatPlotData` produces them;
      downstream Plot stages (and Plot._draw's paint phase) read them.
  */
  plotFormattedData?: Record<string, unknown>[];
  plotAxisData?: Record<string, unknown>[];
  x2Exists?: boolean;
  y2Exists?: boolean;
  /** Closure used by Plot's stacked branch to compute fillerPoint groups. */
  plotStackGroup?: (d: DataPoint, i: number) => string;
  /** Per-axis unique values arrays (output of `computePlotAxisValues`). */
  xData?: unknown[];
  x2Data?: unknown[];
  yData?: unknown[];
  y2Data?: unknown[];
  /** Initial domains from the stacked/non-stacked branch (output of `computePlotInitialDomains`). */
  plotInitialDomains?: Record<string, (number | string | Date)[]>;
  /** Stacked-mode bookkeeping (output of `computePlotInitialDomains`). */
  plotDiscreteKeys?: unknown[];
  plotStackData?: unknown[];
  plotStackKeys?: unknown[];
  /** Final domains after log/baseline adjustments (output of `computePlotScales`). */
  plotDomains?: Record<string, (number | string | Date)[]>;
  /** Four configured d3 scale instances + their scale-type strings. */
  plotScales?: PlotScales;
  plotConfigScales?: PlotConfigScales;
  plotOpps?: {opp?: string; opp2?: string; opps: string[]};
  /** Pre-measured test axes + label-test shapes for `measurePlotLineLabels`. */
  plotTestAxes?: {xTest: Axis; yTest: Axis};
  plotLineLabelTest?: {testLineShape: Shape; testTextBox: TextBox};
  /** Outputs of `measurePlotLineLabels`. */
  plotLabelWidths?: unknown[];
  plotLargestLabel?: number;
  plotXRangeMax?: number;
  /** Outputs of `preparePlotAxisLayout`. */
  plotDefaultConfig?: Record<string, unknown>;
  plotDefaultX2Config?: Record<string, unknown>;
  plotDefaultY2Config?: Record<string, unknown>;
  plotShowX?: boolean;
  plotShowY?: boolean;
  plotYC?: Record<string, unknown>;
  plotBarLabels?: string[];
  plotXTicks?: unknown[] | null;
  plotX2Ticks?: unknown[] | null;
  plotYTicks?: unknown[] | null;
  plotY2Ticks?: unknown[] | null;
  plotXDomain?: (number | string | Date)[];
  plotX2Domain?: (number | string | Date)[];
  plotYDomain?: (number | string | Date)[];
  plotY2Domain?: (number | string | Date)[];
}

/**
    @type TransformStage
    A pipeline stage: pure function from a context to the fields it derives.
    Stages never mutate the input; the runner merges the returned partial.
*/
export type TransformStage = (ctx: VizContext) => Partial<VizContext>;

/**
    Discrete-axis nest keys for the rollup. Plot stores its discrete accessor
    on `viz._x`/`viz._y`; fluent-schema charts (Radar/RadialMatrix `metric`)
    store it on `viz.schema.<discrete>`. Resolve from either so the rollup
    nests by the discrete dimension regardless of where the accessor lives —
    without it, per-metric rows collapse into one aggregated row per group.
*/
type NestKey = (d: DataPoint, i: number) => DataPoint[keyof DataPoint];

export function discreteNestKeys(viz: VizInstance): NestKey[] {
  const disc = viz.schema.discrete;
  if (!disc) return [];
  const keys: NestKey[] = [];
  const dynamic = viz as unknown as Record<string, NestKey>;
  for (const k of [disc, `${disc}2`]) {
    if (`_${k}` in viz) keys.push(dynamic[`_${k}`]);
    else if (typeof viz.schema[k] === "function") keys.push(viz.schema[k]);
  }
  return keys;
}

/**
    Maps context-field names to the `this.*` properties downstream
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

/**
    Run a stage pipeline and accumulate the partial outputs into one context.
*/
export function runStages(
  initial: VizContext,
  stages: TransformStage[],
): VizContext {
  let ctx = initial;
  const viz = initial.viz;
  for (const stage of stages) {
    const partial = stage(ctx);
    ctx = Object.assign({}, ctx, partial);
    // Progressive writeback: code that one stage transitively invokes
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
