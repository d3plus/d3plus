/**
    Notes a Plot's outliers (see `outlierDetect.ts`) where a reader meets a
    mark: an "Outlier" row in a single mark's tooltip, " (Outlier)" after its
    series' name in the shared tooltip, and "Outlier" in the mark's aria
    label. `outlierConfig.tooltip: false` leaves them out.
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {vizDiscrete} from "../viz/discrete.js";
import type {PlotOutlier} from "./outlierDetect.js";
import {outlierConfig, outlierOf} from "./outlierScene.js";
import {axisValue} from "./sharedTooltip.js";

/** The shapes whose one mark stands for a series of rows. */
const SERIES_SHAPES = ["Line", "Area"];

/** The outlier a row (or a datum wrapping it) is, when the chart notes it. */
export function notedOutlier(viz: VizInstance, d: unknown): PlotOutlier | null {
  if (outlierConfig(viz).tooltip === false) return null;
  return outlierOf(viz._plotOutliers, d)?.[1] ?? null;
}

/**
    The single-mark tooltip's rows for an outlier: one "Outlier" row, none
    for any other row.
    @param viz The chart.
    @param d The hovered row.
*/
export function outlierRows(viz: VizInstance, d: unknown): string[][] {
  return notedOutlier(viz, d) ? [[viz.schema.translate("Outlier")]] : [];
}

/**
    The shared tooltip's note after an outlier's series name, " (Outlier)";
    empty for any other row.
    @param viz The chart.
    @param d The row.
*/
export function outlierSuffix(viz: VizInstance, d: unknown): string {
  return notedOutlier(viz, d) ? ` (${viz.schema.translate("Outlier")})` : "";
}

/** The tooltip surface `appendOutlier` extends. */
interface TbodyHost {
  tbody(): unknown;
  tbody(_: (d: DataPoint, i: number) => unknown): unknown;
}

/** Marks the `tbody` that `appendOutlier` wrapped, so later hovers don't wrap it again. */
const WRAPPED = Symbol("outlierRows");

/**
    Adds the "Outlier" row (see `outlierRows`) after the rows a hovered
    mark's tooltip lists. The tooltip's `tbody` is wrapped once, and the row
    resolves against each row it's called with, so it leaves the tooltip
    of the next mark hovered, which keeps its `tbody`, as it found it.
    @param tooltip The tooltip being rendered.
    @param viz The chart.
*/
export function appendOutlier<T extends TbodyHost>(
  tooltip: T,
  viz: VizInstance,
): T {
  if (!viz._plotOutliers?.size) return tooltip;
  const base = tooltip.tbody() as {[WRAPPED]?: boolean} | unknown;
  if (typeof base === "function" && (base as {[WRAPPED]?: boolean})[WRAPPED])
    return tooltip;
  const wrapped = (dd: DataPoint, ii: number) => {
    const own =
      typeof base === "function"
        ? (base as (d: DataPoint, i: number) => unknown)(dd, ii)
        : base;
    return [...(Array.isArray(own) ? own : []), ...outlierRows(viz, dd)];
  };
  tooltip.tbody(Object.assign(wrapped, {[WRAPPED]: true}));
  return tooltip;
}

/**
    What a mark's aria label adds for outliers: " Outlier." after a flagged
    point or bar, and after a line or area (whose datum stands for its
    series), " Outlier: " and where along the discrete axis (or the x axis)
    each of its flagged points sits.
    @param viz The chart.
    @param d The mark's source row (a line's or area's merged row).
    @param i Its index.
*/
export function outlierAria(viz: VizInstance, d: DataPoint, i: number): string {
  const outliers = viz._plotOutliers;
  if (!outliers?.size || outlierConfig(viz).tooltip === false) return "";
  const word = viz.schema.translate("Outlier");
  if (outlierOf(outliers, d)) return ` ${word}.`;
  const shape = viz.schema.shape(d, i);
  if (!SERIES_SHAPES.includes(shape)) return "";
  const id = viz
    ._ids(d, i)
    .slice(0, viz._drawDepth + 1)
    .join("_");
  const along = vizDiscrete(viz) === "y" ? "y" : "x";
  const at = [...outliers.values()]
    .filter(o => o.row.id === id && o.row.shape === shape)
    .map(o => axisValue(viz, along, o.row[along]));
  return at.length ? ` ${word}: ${at.join(", ")}.` : "";
}
