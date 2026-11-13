/**
    DensityPlot — an AreaPlot of kernel density curves: each group's raw
    observations become one smoothed distribution along a shared value axis,
    overlaid (or stacked with `stacked`).
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {KernelDensityOptions} from "@d3plus/math";

import AreaPlot from "../AreaPlot/index.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {facetActive} from "../facet/facetConfig.js";
import type {FacetAccessor} from "../facet/facetConfig.js";
import {facetKey, toFacetValue} from "../facet/facetData.js";
import {unwrapRow} from "../helpers/densityChart.js";
import type {DensitySummary} from "../helpers/densityData.js";
import {autoTitle, valueField, valueKeyOf} from "../helpers/valueTitle.js";
import {drawnRawRows} from "../pipeline/preDrawData.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  densityCurves,
  densityHeightLabel,
  densityHeightScale,
  resolveDensityScale,
} from "./densityCurves.js";

/** The key each curve point keeps its group's distribution under. */
export const DENSITY_POINT = "__d3plusDensityPoint";

/** What a curve point carries under `DENSITY_POINT`. */
export interface DensityPointMeta {
  summary: DensitySummary;
  /** The group's unscaled density at this point. */
  density: number;
}

/** Per-instance state kept on `viz.ctx.densityPlot`. */
interface DensityPlotState {
  /** The user's raw observation rows. */
  raw: DataPoint[];
  /** The last rows written to `viz._data`. */
  rows: DataPoint[];
  /** The curve points among `rows`, all estimated from rows that passed `filter`. */
  curves: Set<DataPoint>;
  /** The axis titles last set automatically, so user titles are left alone. */
  xTitle?: string;
  yTitle?: string;
}

type RowFn = (d: DataPoint, i: number) => unknown;

/** The distribution a (possibly wrapped) curve point carries, if any. */
export function densityPointMeta(d: DataPoint): DensityPointMeta | undefined {
  const row = unwrapRow(d);
  const meta = row?.[DENSITY_POINT];
  return meta && typeof meta === "object" && !Array.isArray(meta)
    ? (meta as unknown as DensityPointMeta)
    : undefined;
}

/**
    Replaces the raw rows with each group's density curve before Plot's
    pre-draw: one row per curve point, carrying the group's fields, the value
    as `x` and the scaled density as `y`. Only the rows in the selected time
    period that pass `filter` are estimated, each facet panel's groups on
    their own rows, with one bandwidth and grid for every curve.
*/
export function curvesBeforePreDraw(viz: VizInstance): void {
  const state = viz.ctx.densityPlot as DensityPlotState;
  if (viz._data !== state.rows) state.raw = viz._data;
  viz._sourceData = state.raw;

  const {drawn, offstage} = drawnRawRows(viz, state.raw);
  const facet = facetActive(viz)
    ? (viz.schema.facet as FacetAccessor)
    : undefined;
  const panel = (d: DataPoint, i: number) =>
    facet ? facetKey(toFacetValue(facet(d, i))) : "";
  const groupBy = viz.schema.groupBy as RowFn[];
  const {groups} = densityCurves(drawn, {
    value: viz.schema.value,
    key: (d, i) =>
      [...groupBy.map(g => `${g(d, i)}`), panel(d, i)].join("\u0000"),
    density: viz.schema.densityConfig as KernelDensityOptions,
  });

  // A stacked panel's curves add up to that panel's density, so shares are
  // taken of each panel's observations.
  const totals = new Map<string, number>();
  groups.forEach(g => {
    const key = panel(g.first, 0);
    totals.set(key, (totals.get(key) ?? 0) + g.summary.n);
  });
  const mode = resolveDensityScale(viz.schema.densityScale, viz.schema.stacked);

  // Ungrouped observations become one series named after the value.
  const valueKey = valueKeyOf(viz.schema.value);
  const ungrouped = groups.every(g =>
    groupBy.every(fn => fn(g.first, 0) === undefined),
  );
  const fallback = valueKey ?? viz.schema.translate("Value");
  const points = groups.flatMap(g => {
    const factor = densityHeightScale(
      totals.get(panel(g.first, 0)) ?? 0,
      mode,
    )(g);
    return g.summary.curve.map(([x, density]) => {
      const row: DataPoint = {...g.first};
      if (valueKey) delete row[valueKey];
      if (ungrouped) row.id = fallback;
      row.x = x;
      row.y = density * factor;
      row[DENSITY_POINT] = {
        summary: g.summary,
        density,
      } satisfies DensityPointMeta as never;
      return row;
    });
  });
  // Rows outside the selected period stay in the data as given (see
  // `drawnRawRows`).
  state.rows = viz._data = offstage.length ? [...points, ...offstage] : points;
  state.curves = new Set(points);

  const yTitle = viz.schema.translate(densityHeightLabel(mode));
  autoTitle(viz._yConfig!, state.yTitle, yTitle);
  state.yTitle = yTitle;
  autoTitle(viz._xConfig!, state.xTitle, valueKey);
  state.xTitle = valueKey;
}

/**
    The tooltip rows a curve point adds below Plot's value and height rows:
    its group's observation count and median.
*/
export function densityPointTooltipRows(
  viz: VizInstance,
  d: DataPoint,
): [string, string][] {
  const meta = densityPointMeta(d);
  if (!meta) return [];
  const fmt = (n: number) => formatAbbreviate(n, viz.schema.locale);
  const t = (s: string) => viz.schema.translate(s) as string;
  return [
    [t("Observations"), fmt(meta.summary.n)],
    [t("Median"), fmt(meta.summary.median)],
  ];
}

export const densityPlotDef: ChartDefinition = {
  name: "DensityPlot",
  paintDriven: true,
  // Each series is a whole distribution, so `threshold` folds nothing.
  thresholdFunction: (_viz, data) => data,

  setup: viz => {
    const state: DensityPlotState = {raw: [], rows: [], curves: new Set()};
    viz.ctx.densityPlot = state;
    // `filter` selects raw rows before they're estimated, so the pipeline
    // doesn't run it on the curve points.
    viz._filterApplied = d => state.curves.has(d);
    // The value axis is linear, spanning every curve's points, and rounds
    // out to its nearest ticks.
    viz._discreteExtent = (d: DataPoint) => [Number(d.x), Number(d.x)];
    viz._xConfig = {...viz._xConfig, rounding: "outside"};
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      curvesBeforePreDraw(viz);
      preDraw();
    };
  },

  ctx: {},

  fields: [
    /**
        Kernel density options for every curve: `kernel` (`"gaussian"` or
        `"epanechnikov"`), `bandwidth` (in data units, or a function of every
        observation; Silverman's rule of thumb on every group's observations
        together by default, so every curve is smoothed the same), `points`
        (about how many values each curve is evaluated at, in round steps),
        and `cut` (how far the curves run past the smallest and largest
        observation, in bandwidths).
        @type {{kernel?: "gaussian" | "epanechnikov" | function, bandwidth?: number | function, points?: number, cut?: number}}
    */
    {
      key: "densityConfig",
      merge: true,
      default: {kernel: "gaussian", points: 100, cut: 3},
    },
    /**
        What each curve's height measures: `"area"` (each curve's area is 1),
        `"count"` (each curve is weighted by its group's share of the
        observations, so stacked curves add up to the density of every
        observation), or `"width"` (each curve peaks at 1). Defaults to
        `"count"` when `stacked`, else `"area"`.
        @type {"area" | "count" | "width"}
    */
    {key: "densityScale"},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Area: {
          // Overlaid curves stay see-through where they cross.
          fillOpacity: () => (viz.schema.stacked ? 1 : 0.4),
          strokeWidth: 1.5,
        },
      }),
    },
    /**
        Stacks the groups' curves instead of overlaying them, so the top edge
        is the density of every observation together.
    */
    {key: "stacked", default: false},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint) => densityPointTooltipRows(viz, d),
      }),
    },
    /**
        Accessor function or string key for each row's numeric observation.
        @type {string | function}
    */
    valueField(),
  ],
};

/**
    Creates a density plot from an array of raw observations: the `value` of
    each row is smoothed into a kernel density curve per group, every curve
    with the same bandwidth, drawn as overlaid translucent areas along a
    shared value axis (or stacked with `stacked`).
*/
export default makeChart(densityPlotDef, AreaPlot);
