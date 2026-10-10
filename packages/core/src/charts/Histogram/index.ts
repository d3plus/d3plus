/**
    Histogram — BarChart-style Plot that bins raw observations along a linear
    x axis, one contiguous bar per bin, stacking series by `groupBy`.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {facetActive, resolveFacetConfig} from "../facet/facetConfig.js";
import type {FacetAccessor, FacetConfig} from "../facet/facetConfig.js";
import {facetKey, toFacetValue} from "../facet/facetData.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {computeTimeFilter} from "../pipeline/vizPreDrawPure.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import binData, {type BinNormalize, type BinRow} from "./binData.js";

/** Per-instance binning state kept on `viz.ctx.histogram`. */
interface HistogramState {
  /** The user's raw observation rows. */
  raw: DataPoint[];
  /** The last binned rows written to `viz._data`. */
  bins: DataPoint[];
  /** The bin rows among `bins`, all binned from rows that passed `filter`. */
  binned: Set<DataPoint>;
  /** The axis titles last set automatically, so user titles are left alone. */
  xTitle?: string;
  yTitle?: string;
}

const yTitles: Record<BinNormalize, string> = {
  count: "Count",
  density: "Density",
  relative: "Relative Frequency",
};

/** Data keys behind string `value` accessors, for the x-axis title. */
const valueKeys = new WeakMap<object, string>();

/** `accessor(key)` that remembers its key. */
function keyedAccessor(key: string) {
  const fn = accessor(key);
  valueKeys.set(fn, key);
  return fn;
}

/** Walks Plot's `__d3plus__` wrappers down to the bin row. */
function binRow(d: DataPoint): BinRow {
  while (d && d.__d3plus__ && d.data) d = d.data as DataPoint;
  return d as BinRow;
}

/** A series' merged datum (legend swatch): its `x` collects every bin's midpoint. */
const isSeries = (b: BinRow) => Array.isArray(b.x);

/** Sets an axis title unless the user has configured their own. */
function autoTitle(config: Record<string, unknown>, previous: string | undefined, next: string | undefined) {
  if (config.title === undefined || config.title === previous) config.title = next;
}

/**
    The time filter the draw applies: the configured `timeFilter` or, with a
    `time` key, the latest period in `rows`.
*/
function drawnTimeFilter(viz: VizInstance, rows: DataPoint[]) {
  if (viz.schema.timeFilter) return viz.schema.timeFilter as (d: DataPoint, i: number) => boolean;
  const data = viz._data;
  viz._data = rows;
  try {
    return computeTimeFilter(viz);
  }
  finally {
    viz._data = data;
  }
}

/**
    Re-bins the raw rows before Plot's pre-draw aggregates them. Only the rows
    in the selected time period that pass `filter` are binned, and each facet
    panel is binned on its own rows (sharing edges when the panels share
    scales), so every panel draws the histogram of exactly the rows it shows.
*/
function binBeforePreDraw(viz: VizInstance) {
  const state = viz.ctx.histogram as HistogramState;
  if (viz._data !== state.bins) state.raw = viz._data;

  const timeFilter = drawnTimeFilter(viz, state.raw);
  const filter = viz.schema.filter as ((d: DataPoint, i: number) => boolean) | undefined;
  const period = timeFilter ? state.raw.filter(timeFilter) : state.raw;
  const drawn = filter ? period.filter(filter) : period;
  const facet = facetActive(viz) ? (viz.schema.facet as FacetAccessor) : undefined;

  const groupBy = viz.schema.groupBy as ((d: DataPoint, i: number) => unknown)[];
  const valueKey = valueKeys.get(viz.schema.value);
  const bins = binData(drawn, {
    value: viz.schema.value,
    group: (d, i) => groupBy.map(g => `${g(d, i)}`).join("_"),
    panel: facet ? (d, i) => facetKey(toFacetValue(facet(d, i))) : undefined,
    sharedEdges: resolveFacetConfig(viz.schema.facetConfig as FacetConfig | undefined).scales === "shared",
    thresholds: viz.schema.binThresholds,
    domain: viz.schema.binDomain,
    width: viz.schema.binWidth,
    normalize: viz.schema.binNormalize,
  });
  // Ungrouped observations become one series named after the value, so it
  // colors and labels like any other series.
  const ungrouped = bins.every((b, i) => groupBy.every(g => g(b, i) === undefined));
  bins.forEach(b => {
    if (valueKey) delete b[valueKey];
    if (ungrouped) b.id = valueKey ?? viz.schema.translate("Value");
  });
  // Rows outside the selected period stay in the data unbinned: the time
  // filter drops them from the draw, while the timeline still lists their
  // periods and the facet grid keeps the panels of those that pass `filter`.
  const offstage = timeFilter ? state.raw.filter((d, i) => !timeFilter(d, i)) : [];
  state.bins = viz._data = offstage.length ? [...bins, ...offstage] : bins;
  state.binned = new Set(bins);

  const yTitle = viz.schema.translate(yTitles[viz.schema.binNormalize as BinNormalize] ?? yTitles.count);
  autoTitle(viz._yConfig!, state.yTitle, yTitle);
  state.yTitle = yTitle;
  autoTitle(viz._xConfig!, state.xTitle, valueKey);
  state.xTitle = valueKey;
}

export const histogramDef: ChartDefinition = {
  name: "Histogram",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],
  defaults: {groupPadding: 1},

  setup: viz => {
    const state: HistogramState = {raw: [], bins: [], binned: new Set()};
    viz.ctx.histogram = state;
    // `filter` selects raw rows before they're binned, so the pipeline
    // doesn't run it on the bins.
    viz._filterApplied = d => state.binned.has(d);
    // Each bin is its own stacked series; ordering by key keeps every group
    // at the same stack level from bin to bin.
    (viz as unknown as Plot).stackOrder("key");
    // Bin ranges are read off the x axis, so bars carry no labels.
    viz.schema.shapeConfig.Bar = {...viz.schema.shapeConfig.Bar, label: false};
    viz._discreteExtent = (d: DataPoint) => [(d as BinRow).x0, (d as BinRow).x1];
    // Hovering a bar highlights just that bin of that series; legend hover
    // still highlights the whole series.
    const baseMouseMoveShape = viz.schema.on["mousemove.shape"];
    viz.schema.on["mousemove.shape"] = (d: DataPoint, i: number, x: unknown, event: unknown) => {
      baseMouseMoveShape(d, i, x, event);
      if (viz.schema.shapeConfig.hoverOpacity === 1) return;
      const target = binRow(d);
      const id = `${viz._id(target, i)}`;
      type HoverFn = (fn: (h: DataPoint, ii: number) => boolean) => unknown;
      (viz as VizInstance & {hover: HoverFn}).hover((h: DataPoint, ii: number) => {
        const b = binRow(h);
        return `${viz._id(b, ii)}` === id && (isSeries(b) || b.x0 === target.x0);
      });
    };
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      binBeforePreDraw(viz);
      preDraw();
    };
  },

  ctx: {},

  fields: [
    {key: "baseline", default: 0},
    /**
        Bin edges: a bin count, an array of interior edges, or a d3-array
        threshold generator such as `thresholdSturges` (the default),
        `thresholdScott`, or `thresholdFreedmanDiaconis`.
    */
    {key: "binThresholds"},
    /** `[min, max]` to bin across. Defaults to the nicely rounded extent of the values. */
    {key: "binDomain"},
    /** A uniform bin width. When set, takes precedence over `binThresholds`. */
    {key: "binWidth"},
    /**
        What each bar's height measures: `"count"` (default), `"density"`
        (count ÷ (total × bin width), so the bars' area sums to 1), or
        `"relative"` (count ÷ total, so the heights sum to 1).
    */
    {key: "binNormalize", default: "count"},
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Bar"), coerce: "const"},
    {key: "stacked", default: true},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => {
        const fmt = (n: number) => formatAbbreviate(n, viz.schema.locale);
        const range = (d: DataPoint) => {
          const b = binRow(d);
          return `${fmt(b.x0)} – ${fmt(b.x1)}`;
        };
        const hasGroups = (d: DataPoint, i: number) =>
          viz.schema.groupBy.some((g: (d: DataPoint, i: number) => unknown) => g(binRow(d), i) !== undefined);
        return {
          title: (d: DataPoint, i: number) =>
            hasGroups(d, i) ? viz._drawLabel(binRow(d), i) : range(d),
          tbody: (d: DataPoint, i: number) => {
            const b = binRow(d);
            const rows: [string, string][] = [];
            if (isSeries(b)) return [[viz.schema.translate(yTitles.count), fmt(b.count)]];
            if (hasGroups(d, i)) rows.push([viz.schema.translate("Range"), range(d)]);
            rows.push([viz.schema.translate(yTitles.count), fmt(b.count)]);
            const normalize = viz.schema.binNormalize as BinNormalize;
            if (normalize !== "count") rows.push([viz.schema.translate(yTitles[normalize]), fmt(b.y)]);
            return rows;
          },
        };
      },
    },
    /** Accessor for each row's numeric observation. */
    {
      key: "value",
      default: keyedAccessor("value"),
      coerce: v => (typeof v === "string" ? keyedAccessor(v) : typeof v === "function" ? v : constant(v as never)),
    },
  ],
};

/**
    Creates a histogram from an array of raw observations: the `value` of each
    row is binned along a linear x axis, and bar heights show each bin's
    count (or density / relative frequency via `binNormalize`). Series set by
    `groupBy` share bin edges and are stacked.
*/
export default makeChart(histogramDef, Plot);
