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
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {DataPoint} from "@d3plus/data";

/**
    @interface VizContext
    The value that flows through the chart pipeline. Each stage reads from it
    and returns the fields it derives. The runner (`Viz._preDraw`) folds the
    stages together and writes the result back onto the Viz instance so
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

/**
    Discrete-axis nest keys for the rollup. Plot stores its discrete accessor
    on `viz._x`/`viz._y`; fluent-schema charts (Radar/RadialMatrix `metric`)
    store it on `viz.schema.<discrete>`. Resolve from either so the rollup
    nests by the discrete dimension regardless of where the accessor lives —
    without it, per-metric rows collapse into one aggregated row per group.
*/
export function discreteNestKeys(
  viz: any,
): ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])[] {
  const disc = viz.schema.discrete;
  if (!disc) return [];
  const keys: ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])[] = [];
  for (const k of [disc, `${disc}2`]) {
    if (`_${k}` in viz) keys.push(viz[`_${k}`]);
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
