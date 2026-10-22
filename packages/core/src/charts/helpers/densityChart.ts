/**
    Shared Plot plumbing for the density charts (Violin, Ridgeline): raw
    observation rows become one summary row per group before Plot's pre-draw,
    each carrying its distribution under `DENSITY`. Plot then lays the rows out
    on a category axis and a value axis, and the chart's Area emitter draws each
    row's density curve.
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {KernelDensityOptions} from "@d3plus/math";

import constant from "../../utils/constant.js";
import type {D3Scale} from "../../utils/index.js";
import type {ConfigField} from "../../fluent.js";
import type {ShapeEmitter} from "../features/shapeEmit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {autoTitle, keyedAccessor, valueKeyOf} from "./valueTitle.js";
import {
  densityGroups,
  densityWidthScale,
  sortByMedian,
  type DensityScale,
  type DensitySummary,
  type MedianSort,
} from "./densityData.js";

/** The key each summary row keeps its distribution under. */
export const DENSITY = "__d3plusDensity";

/** What a summary row carries under `DENSITY`. */
export interface DensityMeta {
  summary: DensitySummary;
  /** Position in drawing order. */
  order: number;
  /** The factor mapping this curve's densities onto `[0, 1]` widths. */
  scale: number;
}

/** How a density chart lays out its category axis. */
export interface DensityLayout {
  /** The axis holding the observed values. */
  valueAxis: (viz: VizInstance) => "x" | "y";
  /** The category axis's point-scale outer padding (in steps) and alignment. */
  categoryPadding: (viz: VizInstance) => [number, number];
  /** Whether the categories run in reverse along the category axis's domain. */
  reverse?: boolean;
  /** The chart's Area emitter. */
  emit: ShapeEmitter;
}

/** Per-instance state kept on `viz.ctx.density`. */
interface DensityState {
  raw: DataPoint[];
  rows: DataPoint[];
  layout: DensityLayout;
  /** Each category's position in drawing order. */
  categories: Map<string, number>;
  /** The axis title last set automatically, and the axis it was set on. */
  title?: string;
  titleAxis?: "x" | "y";
}

/** Walks Plot's `__d3plus__` wrappers down to the user-level row. */
export function unwrapRow(d: DataPoint): DataPoint {
  while (d && d.__d3plus__ && d.data) d = d.data as DataPoint;
  return d;
}

/** The distribution a (possibly wrapped) summary row carries, if any. */
export function densityMeta(d: DataPoint): DensityMeta | undefined {
  const row = unwrapRow(d);
  return row ? (row[DENSITY] as unknown as DensityMeta | undefined) : undefined;
}

/**
    The id a density curve's Area draws under. Scene keys come from ids, and a
    category axis keys its ticks by category, which is often the group's id.
*/
export function densityShapeId(row: DataPoint): string {
  return `density-${row.id}`;
}

type RowFn = (d: DataPoint, i: number) => unknown;

/** The grouping key for a raw row: every groupBy level, plus its facet and time. */
function groupKey(viz: VizInstance): (d: DataPoint, i: number) => string {
  const groupBy = viz.schema.groupBy as RowFn[];
  const extra = [viz.schema.facet, viz.schema.time].filter(Boolean) as RowFn[];
  return (d, i) => [...groupBy, ...extra].map(fn => `${fn(d, i)}`).join("\u0000");
}

/**
    Replaces the raw rows with one summary row per group: the group's first
    row with the category on the category axis, the median on the value axis,
    and its distribution under `DENSITY`.
*/
export function summarizeBeforePreDraw(viz: VizInstance): void {
  const state = viz.ctx.density as DensityState;
  if (viz._data !== state.rows) state.raw = viz._data;

  const valueAxis = state.layout.valueAxis(viz);
  const categoryAxis = valueAxis === "x" ? "y" : "x";
  const groupBy = viz.schema.groupBy as RowFn[];
  const valueKey = valueKeyOf(viz.schema.value);
  const groups = densityGroups(state.raw, {
    value: viz.schema.value,
    key: groupKey(viz),
    density: viz.schema.densityConfig as KernelDensityOptions,
  });
  const ordered = sortByMedian(groups, viz.schema.medianSort as MedianSort);
  const widthOf = densityWidthScale(groups.map(g => g.summary), viz.schema.densityScale as DensityScale);
  // Ungrouped observations become one category named after the value.
  const ungrouped = groups.every(g => groupBy.every(fn => fn(g.first, 0) === undefined));
  const fallback = valueKey ?? viz.schema.translate("Value");

  state.categories = new Map();
  state.rows = viz._data = ordered.map((g, order) => {
    const row: DataPoint = {...g.first};
    if (valueKey) delete row[valueKey];
    if (ungrouped) row.id = fallback;
    const category = ungrouped ? fallback : `${groupBy[0](g.first, 0)}`;
    if (!state.categories.has(category)) state.categories.set(category, state.categories.size);
    row[categoryAxis] = category;
    row[valueAxis] = g.summary.median;
    row[DENSITY] = {summary: g.summary, order, scale: widthOf(g.summary)} satisfies DensityMeta as never;
    return row;
  });

  const configs = {x: viz._xConfig, y: viz._yConfig};
  if (state.titleAxis && state.titleAxis !== valueAxis) autoTitle(configs[state.titleAxis], state.title, undefined);
  autoTitle(configs[valueAxis], state.titleAxis === valueAxis ? state.title : undefined, valueKey);
  state.title = valueKey;
  state.titleAxis = valueAxis;
}

/** Orders the category axis by each category's first summary row. */
function categorySort(viz: VizInstance) {
  return (a: DataPoint, b: DataPoint) => {
    const state = viz.ctx.density as DensityState;
    const axis = state.layout.valueAxis(viz) === "x" ? "y" : "x";
    const order = (d: DataPoint) => state.categories.get(`${unwrapRow(d)?.[axis]}`) ?? 0;
    return state.layout.reverse ? order(b) - order(a) : order(a) - order(b);
  };
}

/**
    Plot buffer for the density Area rows: widens the value axis to every
    curve's extent and pads the category axis (see `DensityLayout`).
*/
function densityBuffer(
  this: VizInstance,
  {data, x, y, x2, y2}: {data: DataPoint[]; x: D3Scale; y: D3Scale; x2?: boolean; y2?: boolean},
): [D3Scale, D3Scale] {
  if (x2 || y2) return [x, y];
  const state = this.ctx.density as DensityState;
  const valueAxis = state.layout.valueAxis(this);
  const value = valueAxis === "x" ? x : y;
  const category = valueAxis === "x" ? y : x;
  const domain = (value.domain() as number[]).slice();
  const flip = domain[0] > domain[1];
  if (flip) domain.reverse();
  data.forEach(d => {
    const curve = densityMeta(d)?.summary.curve;
    if (!curve || !curve.length) return;
    domain[0] = Math.min(domain[0], curve[0][0]);
    domain[1] = Math.max(domain[1], curve[curve.length - 1][0]);
  });
  if (flip) domain.reverse();
  value.domain(domain);
  const [padding, align] = state.layout.categoryPadding(this);
  if (category.padding) category.padding(padding);
  if (category.align) category.align(align);
  return [x, y];
}

/**
    Wires a density chart onto a Plot instance: the pre-draw summary, the
    category order, the Area buffer, and the chart's Area emitter.
*/
export function installDensity(viz: VizInstance, layout: DensityLayout): void {
  viz.ctx.density = {raw: [], rows: [], layout, categories: new Map()} satisfies DensityState;
  viz._buffer = {...viz._buffer, Area: densityBuffer};
  viz._plotShapeEmitters = {...viz._plotShapeEmitters, Area: layout.emit};
  // A curve has no single point to snap a tooltip to: hovering it shows the
  // group's distribution through the default shape tooltip instead.
  (viz as VizInstance & {_sharedHover: () => void})._sharedHover = () => undefined;
  const sort = categorySort(viz);
  const preDraw = viz._preDraw.bind(viz);
  viz._preDraw = () => {
    summarizeBeforePreDraw(viz);
    // The category axis follows the summary order unless the user sorts it.
    const categoryAxis = layout.valueAxis(viz) === "x" ? "y" : "x";
    const other = categoryAxis === "x" ? "y" : "x";
    if (viz.schema[`${other}Sort`] === sort) viz.schema[`${other}Sort`] = undefined;
    if (!viz.schema[`${categoryAxis}Sort`]) viz.schema[`${categoryAxis}Sort`] = sort;
    preDraw();
  };
}

/** The tooltip rows for a summary row, or the value of a raw observation. */
export function densityTooltipRows(viz: VizInstance, d: DataPoint, i: number): [string, string][] {
  const fmt = (n: number) => formatAbbreviate(n, viz.schema.locale);
  const t = (s: string) => viz.schema.translate(s) as string;
  const meta = densityMeta(d);
  if (!meta) {
    const v = Number(viz.schema.value(unwrapRow(d), i));
    return Number.isFinite(v) ? [[valueKeyOf(viz.schema.value) ?? t("Value"), fmt(v)]] : [];
  }
  const s = meta.summary;
  return [
    [t("Observations"), fmt(s.n)],
    [t("Maximum"), fmt(s.max)],
    [t("Upper Quartile"), fmt(s.q3)],
    [t("Median"), fmt(s.median)],
    [t("Lower Quartile"), fmt(s.q1)],
    [t("Minimum"), fmt(s.min)],
  ];
}

/** The fluent accessors every density chart shares. */
export function densityAccessorFields(): ConfigField[] {
  return [
    /**
        How curves are sized against each other: `"area"` (default) gives
        every shape the same area, `"count"` makes areas proportional to each
        group's observations, and `"width"` scales every shape to the full
        width (Violin) or height (Ridgeline).
        @type {"area" | "count" | "width"}
    */
    {key: "densityScale", default: "area"},
    /**
        Orders categories by median: `false` (default; data order),
        `"ascending"`, or `"descending"`.
        @type {false | "ascending" | "descending"}
    */
    {key: "medianSort", default: false},
    {key: "shape", default: constant("Area"), coerce: "const"},
    // A distribution has no single value to share across categories.
    {key: "tooltipShared", default: false},
    /**
        Accessor function or string key for each row's numeric observation.
        @type {string | function}
    */
    {
      key: "value",
      default: keyedAccessor("value"),
      coerce: v => (typeof v === "string" ? keyedAccessor(v) : typeof v === "function" ? v : constant(v as never)),
    },
  ];
}

/**
    The config bags every density chart shares. `cut` is how far each curve
    runs past its group's extent by default, in bandwidths.
*/
export function densityConfigFields(cut: number): ConfigField[] {
  return [
    /**
        Kernel density options for every curve: `kernel` (`"gaussian"` or
        `"epanechnikov"`), `bandwidth` (in data units; each group's own
        Silverman rule-of-thumb bandwidth by default), `points` (how many
        values each curve is evaluated at), and `cut` (how far each curve runs
        past its group's smallest and largest value, in bandwidths).
        @type {{kernel?: "gaussian" | "epanechnikov" | function, bandwidth?: number | function, points?: number, cut?: number}}
    */
    {key: "densityConfig", merge: true, default: {kernel: "gaussian", points: 80, cut}},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => densityTooltipRows(viz, d, i),
      }),
    },
  ];
}
