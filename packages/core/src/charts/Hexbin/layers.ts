/**
    Hexbin's per-draw state and the rows its emitter draws: bins and contour
    levels measured from points in pixel space, and the rows the colorScale
    is laid out from (estimated before the plot area is known, then measured
    against it).

    @module
*/

import {extent, groups} from "d3-array";
import {scaleLinear} from "d3-scale";

import type {DataPoint} from "@d3plus/data";

import {facetActive, type FacetAccessor} from "../facet/facetConfig.js";
import {facetKey, toFacetValue} from "../facet/facetData.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  binArea,
  binBounds,
  binMeasure,
  binPath,
  binPoints,
  type PixelBin,
  type PixelPoint,
} from "./binning.js";
import {densityContours} from "./contours.js";
import {hexbinRow, hexbinSettings, type HexbinSettings} from "./settings.js";

/** The plot area in shape coordinates. */
export interface PlotFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Per-instance state kept on `viz.ctx.hexbin`. */
export interface HexbinState {
  /** The user's rows. */
  raw: DataPoint[];
  /** The rows with numeric x and y last written to `viz._data`. */
  rows: DataPoint[];
  /** The smallest x and y observed, where the bin grid is anchored. */
  anchor?: [number, number];
  /** Each small-multiples panel's observations, for the shared colorScale. */
  panels?: DataPoint[][];
  /** The colorScale's rows, once this draw's paint has measured them. */
  colorRows?: DataPoint[];
}

/** A Hexbin's state. */
export function hexbinState(viz: VizInstance): HexbinState {
  return viz.ctx.hexbin as HexbinState;
}

/** Whether a value is a finite number. */
export const isNumeric = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** The plot area an emitter draws in. */
export function plotFrame(
  ctx: Pick<ShapeEmitContext, "xRange" | "yRange" | "x2Height">,
): PlotFrame {
  const {xRange, yRange} = ctx;
  return {
    left: xRange[0],
    top: yRange[0] - (ctx.x2Height ?? 0),
    width: xRange[xRange.length - 1] - xRange[0],
    height: yRange[yRange.length - 1] - yRange[0],
  };
}

/**
    One row per bin, measured: its count and value, its bounds in data units
    (through `invert`), and its outline. Bins whose value isn't a number (a
    `mean` with nothing to average) are left out.
*/
export function binRows(
  bins: PixelBin[],
  settings: Pick<HexbinSettings, "shape" | "size" | "agg">,
  invert: {x: (px: number) => number; y: (px: number) => number},
): DataPoint[] {
  const shape = settings.shape || "hex";
  const rows: DataPoint[] = [];
  for (const bin of bins) {
    const value = binMeasure(bin.points, settings.agg);
    if (!Number.isFinite(value)) continue;
    const b = binBounds(bin, shape, settings.size);
    const [x0, x1] = [invert.x(b.x0), invert.x(b.x1)].sort((a, c) => a - c);
    const [y0, y1] = [invert.y(b.y0), invert.y(b.y1)].sort((a, c) => a - c);
    rows.push(
      hexbinRow(`bin-${bin.key}`, {
        kind: "bin",
        count: bin.points.length,
        value,
        x0,
        x1,
        y0,
        y1,
        path: binPath(bin, shape, settings.size),
        rows: bin.points.map(p => p.row),
      }),
    );
  }
  return rows;
}

/**
    One row per contour level, lowest first. Levels are in points per bin, so
    they share the bins' color scale; a `mean` measure contours the points'
    density, unweighted.
*/
export function contourRows(
  points: PixelPoint[],
  frame: PlotFrame,
  settings: Pick<HexbinSettings, "shape" | "size" | "agg" | "contourConfig">,
): DataPoint[] {
  const {bandwidth, thresholds} = settings.contourConfig;
  const weighted =
    settings.agg === "sum" ? points : points.map(p => ({...p, weight: 1}));
  const levels = densityContours(weighted, {
    ...frame,
    bandwidth,
    thresholds,
    unit: binArea(settings.shape || "hex", settings.size),
  });
  return levels.map((c, index) =>
    hexbinRow(`contour-${index}`, {
      kind: "contour",
      level: c.level,
      next: levels[index + 1]?.level,
      index,
      levels: levels.length,
      path: c.path,
    }),
  );
}

/** The bins that reach into the plot area: the ones a zoomed view shows. */
export function binsInView(
  bins: PixelBin[],
  frame: PlotFrame,
  settings: Pick<HexbinSettings, "shape" | "size">,
): PixelBin[] {
  const shape = settings.shape || "hex";
  return bins.filter(bin => {
    const b = binBounds(bin, shape, settings.size);
    return (
      b.x1 > frame.left &&
      b.x0 < frame.left + frame.width &&
      b.y1 > frame.top &&
      b.y0 < frame.top + frame.height
    );
  });
}

/** The points as one path of `r`-pixel dots. */
export function pointPath(points: PixelPoint[], r: number): string {
  const round = (n: number) => Math.round(n * 10) / 10;
  let d = "";
  for (const p of points) {
    if (!isNumeric(p.x) || !isNumeric(p.y)) continue;
    d += `M${round(p.x - r)},${round(p.y)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  }
  return d;
}

/**
    The rows the colorScale reads for some points: their bins in view, or
    with no bins drawn, their contour levels.
*/
export function colorRows(
  points: PixelPoint[],
  frame: PlotFrame,
  origin: [number, number],
  settings: HexbinSettings,
): DataPoint[] {
  const none = {x: () => NaN, y: () => NaN};
  if (settings.shape)
    return binRows(
      binsInView(
        binPoints(points, {shape: settings.shape, size: settings.size, origin}),
        frame,
        settings,
      ),
      settings,
      none,
    );
  return settings.contours ? contourRows(points, frame, settings) : [];
}

/** The user's rows placed through `toX`/`toY` (data value to pixel). */
function placeRows(
  viz: VizInstance,
  rows: DataPoint[],
  toX: (v: number) => number,
  toY: (v: number) => number,
  settings: HexbinSettings,
): PixelPoint[] {
  const {weight} = settings;
  return rows.map((row, i) => ({
    x: toX(Number(viz._x!(row, i))),
    y: toY(Number(viz._y!(row, i))),
    row,
    weight: weight ? Number(weight(row, i)) : undefined,
  }));
}

/** The user's rows split into small-multiples panels (one group without facets). */
function panelRows(viz: VizInstance, rows: DataPoint[]): DataPoint[][] {
  if (!facetActive(viz)) return [rows];
  const facet = viz.schema.facet as FacetAccessor;
  return groups(rows, (d, i) => facetKey(toFacetValue(facet(d, i)))).map(
    ([, g]) => g,
  );
}

/**
    Notes what the emitter needs from the whole chart before a draw: where
    the bin grid is anchored, and with small multiples, every panel's rows.
    The colorScale rows measured by the last draw are dropped.
*/
export function noteDrawRows(viz: VizInstance): void {
  const state = hexbinState(viz);
  state.colorRows = undefined;
  const rows = viz._filteredData ?? [];
  const xs = rows.map((d, i) => Number(viz._x!(d, i))).filter(isNumeric);
  const ys = rows.map((d, i) => Number(viz._y!(d, i))).filter(isNumeric);
  const [x] = extent(xs);
  const [y] = extent(ys);
  state.anchor = x !== undefined && y !== undefined ? [x, y] : undefined;
  state.panels = facetActive(viz) ? panelRows(viz, rows) : undefined;
}

/**
    The colorScale's rows for a panel's paint: the rows it measured, or with
    small multiples, every panel's, binned at this panel's scale so all of
    them share one colorScale.
*/
export function sharedColorRows(
  ctx: ShapeEmitContext,
  own: DataPoint[],
  frame: PlotFrame,
  origin: [number, number],
  settings: HexbinSettings,
): DataPoint[] {
  const {viz} = ctx;
  const panels = hexbinState(viz).panels;
  if (viz._facetStep !== "panel" || !panels) return own;
  return panels.flatMap(rows =>
    colorRows(
      placeRows(
        viz,
        rows,
        v => ctx.x(v),
        v => ctx.y(v),
        settings,
      ),
      frame,
      origin,
      settings,
    ),
  );
}

/**
    The rows the colorScale lays out from: those this draw's paint measured,
    or before the paint, an estimate (see `estimatedColorRows`).
*/
export function colorScaleRows(viz: VizInstance): DataPoint[] {
  return (
    hexbinState(viz).colorRows ?? estimatedColorRows(viz, hexbinSettings(viz))
  );
}

/** The share of the chart's size the plot area is estimated to take. */
const ESTIMATED_PLOT = {width: 0.8, height: 0.7};

/**
    The colorScale's rows before the plot area is known (only its margin
    depends on them): the observations measured in a plot area estimated
    from the chart's size. The emitter refreshes the colorScale with the
    rows it measures.
*/
export function estimatedColorRows(
  viz: VizInstance,
  settings: HexbinSettings,
): DataPoint[] {
  const rows = viz._filteredData ?? [];
  const xs = rows.map((d, i) => Number(viz._x!(d, i))).filter(isNumeric);
  const ys = rows.map((d, i) => Number(viz._y!(d, i))).filter(isNumeric);
  if (!xs.length || !ys.length) return [];
  const panels = panelRows(viz, rows);
  const frame: PlotFrame = {
    left: 0,
    top: 0,
    width: (viz.schema.width * ESTIMATED_PLOT.width) / Math.sqrt(panels.length),
    height:
      (viz.schema.height * ESTIMATED_PLOT.height) / Math.sqrt(panels.length),
  };
  const toX = scaleLinear()
    .domain(extent(xs) as [number, number])
    .range([frame.left, frame.left + frame.width]);
  const toY = scaleLinear()
    .domain(extent(ys) as [number, number])
    .range([frame.top + frame.height, frame.top]);
  const origin: [number, number] = [frame.left, frame.top + frame.height];
  return panels.flatMap(group =>
    colorRows(
      placeRows(viz, group, toX, toY, settings),
      frame,
      origin,
      settings,
    ),
  );
}

/**
    Lays the colorScale out again with `rows`, in the frame it already
    claimed, so its scale (which the bins' fills read) spans what's drawn.
    The rows are kept for any later layout of the colorScale in this draw
    (see `colorScaleRows`).
*/
export function refreshColorScale(viz: VizInstance, rows: DataPoint[]): void {
  hexbinState(viz).colorRows = rows;
  const cs = viz._colorScaleClass;
  if (!cs || !viz.schema.colorScale) return;
  cs.data(rows).render();
}
