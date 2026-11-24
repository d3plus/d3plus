/**
    Paints a Plot's value colors (see `valueColors.ts`) onto its marks: a
    gradient along the value axis for each line and area, the one color of
    its value for each bar, point, and lollipop stem. Stacked areas and bars
    keep their series colors. Every mark keeps its own node, so a series
    still hovers, highlights, and takes focus as one.

    @module
*/
import {extent} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {gradientToken} from "@d3plus/render";
import type {Paint, SceneNode} from "@d3plus/render";

import type Shape from "../../shapes/Shape.js";
import {scalePole, signalColor} from "../../utils/theme.js";
import type {PlotAxisFn, PlotDatum} from "../features/plotPaint.js";
import {legendKeys} from "../features/legendKeys.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {valueAxis} from "./baselineDomain.js";
import {FILL_BETWEEN_KEY} from "./fillBetween.js";
import {
  linkedValues,
  swatchGradient,
  valueColorAt,
  valuePixelStops,
  valueScale,
} from "./valueColors.js";
import type {
  ValueColorDefaults,
  ValueColorsSetting,
  ValueScale,
} from "./valueColors.js";

/** The color scale config keys value colors default to. */
interface ColorScaleColors {
  color?: unknown;
  colorMin?: string;
  colorMax?: string;
}

/** The colors a chart's value scale defaults to, following its theme and `colorScaleConfig`. */
function scaleDefaults(viz: VizInstance): ValueColorDefaults {
  const cs = (viz.schema.colorScaleConfig ?? {}) as ColorScaleColors;
  return {
    below: signalColor(viz, "off"),
    middle: signalColor(viz, "caution"),
    above: signalColor(viz, "on"),
    low: cs.colorMin ?? scalePole(viz, "min"),
    high: cs.colorMax ?? scalePole(viz, "max"),
  };
}

/** Whether a chart sets `valueColors`. */
const wantsValueColors = (viz: VizInstance): boolean => {
  const setting = viz.schema.valueColors;
  return (
    Boolean(setting) && typeof setting === "object" && !Array.isArray(setting)
  );
};

/**
    A chart's value scale for `rows`, or undefined when it colors by series.
    A gradient across the data spans the rows' values; a gradient without
    `colors` takes the `colorScaleConfig` colors, when set.
    @param viz The chart.
    @param rows The plotted rows.
*/
export function plotValueScale(
  viz: VizInstance,
  rows: PlotDatum[],
): ValueScale | undefined {
  if (!wantsValueColors(viz)) return undefined;
  const axis = valueAxis(viz);
  const values = rows.map(d => rowValue(d, axis)).filter(Number.isFinite);
  const range = extent(values) as [number, number] | [undefined, undefined];
  const cs = (viz.schema.colorScaleConfig ?? {}) as ColorScaleColors;
  const given = viz.schema.valueColors as ValueColorsSetting;
  const setting = {
    ...given,
    values: linkedValues(given.values, viz.schema.referenceLines),
  } as ValueColorsSetting;
  return valueScale(
    setting.type === "gradient" &&
      setting.colors === undefined &&
      Array.isArray(cs.color)
      ? {...setting, colors: cs.color}
      : setting,
    range[0] === undefined ? undefined : (range as [number, number]),
    scaleDefaults(viz),
  );
}

/** A plotted row's value along `axis` (its secondary axis's, when it has one). */
export function rowValue(d: PlotDatum | undefined, axis: "x" | "y"): number {
  if (!d) return NaN;
  const v = d[`${axis}2`] !== undefined ? d[`${axis}2`] : d[axis];
  return v === null || v === undefined ? NaN : Number(v);
}

/** Whether a chart's `key` shapes draw in value colors: all but stacked areas and bars. */
export function valueColored(viz: VizInstance, key: string): boolean {
  return !(viz.schema?.stacked && (key === "Area" || key === "Bar"));
}

/**
    Sets a Bar or Circle shape's fill to the color of each row's value,
    keeping its own fill where the scale says `null` or a row has no value.
    @param viz The chart.
    @param scale The chart's value scale.
    @param s The shape, configured.
*/
export function applyValueFill(
  viz: VizInstance,
  scale: ValueScale | undefined,
  s: Shape,
): void {
  if (!scale) return;
  const axis = valueAxis(viz);
  const fill = s.fill() as (d: DataPoint, i: number) => string;
  s.fill((d: DataPoint, i: number) => {
    const own = fill(d, i);
    return (
      valueColorAt(scale, rowValue(d as unknown as PlotDatum, axis), own) ?? own
    );
  });
}

/** The parts of the paint context the value colors read. */
export interface ValueColorFrame {
  x: PlotAxisFn;
  y: PlotAxisFn;
  xRange: number[];
  yRange: number[];
}

type PaintedNode = SceneNode & {
  key?: string | number;
  shapeType?: string;
  datum?: unknown;
  paint?: Paint;
  transform?: {x?: number; y?: number; scale?: number};
  children?: SceneNode[];
};

/** A plain color, not unset, invisible, or already a paint token. */
const ownColor = (c: unknown): c is string =>
  typeof c === "string" &&
  c !== "none" &&
  c !== "transparent" &&
  !c.includes(":");

/**
    A node's gradient token for a scale: the pixel stops along the value
    axis, moved into the node's own coordinates.
*/
function nodeGradient(
  node: PaintedNode,
  stops: NonNullable<ReturnType<typeof valuePixelStops>>,
  axis: "x" | "y",
): string {
  const t = node.transform ?? {};
  const s = t.scale || 1;
  const at = (px: number) => (px - ((axis === "y" ? t.y : t.x) ?? 0)) / s;
  const point = (px: number): [number, number] =>
    axis === "y" ? [0, at(px)] : [at(px), 0];
  return gradientToken({
    type: "linear",
    units: "userSpaceOnUse",
    from: point(stops.lo),
    to: point(stops.hi),
    stops: stops.stops,
  });
}

/**
    Paints value colors onto a shape group's scene nodes, in place: a
    gradient stroke on each line, a gradient fill (and stroke) on each area,
    and the color of its value on each lollipop stem. Hover targets
    (`::hit`) and fills between lines are left as they are.
    @param viz The chart.
    @param scale The chart's value scale.
    @param frame The plot's axis functions and pixel ranges.
    @param nodes The shape group's nodes.
*/
export function paintValueColors(
  viz: VizInstance,
  scale: ValueScale | undefined,
  frame: ValueColorFrame,
  nodes: SceneNode[],
): SceneNode[] {
  if (!scale) return nodes;
  const axis = valueAxis(viz);
  const span = axis === "x" ? frame.xRange : frame.yRange;
  const walk = (node: PaintedNode): void => {
    const key = `${node.key ?? ""}`;
    if (key.startsWith(FILL_BETWEEN_KEY) || key.endsWith("::hit")) return;
    if (node.children) node.children.forEach(n => walk(n as PaintedNode));
    const paint = node.paint;
    if (!paint || node.type !== "path") return;
    const datum = node.datum as PlotDatum | undefined;
    if (key.endsWith("::stem")) {
      if (ownColor(paint.stroke))
        paint.stroke =
          valueColorAt(scale, rowValue(datum, axis), paint.stroke) ??
          paint.stroke;
      return;
    }
    if (node.shapeType !== "Line" && node.shapeType !== "Area") return;
    const secondary = datum?.[`${axis}2`] !== undefined ? `${axis}2` : axis;
    const scaleFn = axis === "x" ? frame.x : frame.y;
    const toPixel = (v: number) => scaleFn(v, secondary);
    const recolor = (own: string) => {
      const stops = valuePixelStops(scale, toPixel, span, own);
      return stops ? nodeGradient(node, stops, axis) : own;
    };
    if (node.shapeType === "Area" && ownColor(paint.fill))
      paint.fill = recolor(paint.fill);
    if (ownColor(paint.stroke)) paint.stroke = recolor(paint.stroke);
  };
  nodes.forEach(n => walk(n as PaintedNode));
  return nodes;
}

/**
    Sets the color each plotted datum draws in for this paint (for tooltip
    swatches and hover markers), or clears it when the chart colors by
    series.
    @param viz The chart.
    @param scale The chart's value scale.
*/
export function setDatumColor(
  viz: VizInstance,
  scale: ValueScale | undefined,
): void {
  if (!scale) {
    viz._datumColor = undefined;
    return;
  }
  const axis = valueAxis(viz);
  const {getAttr} = legendKeys(viz);
  viz._datumColor = (datum: unknown) => {
    const d = datum as PlotDatum | undefined;
    if (!d || typeof d !== "object" || !d.__d3plus__) return undefined;
    if (!valueColored(viz, `${d.shape}`)) return undefined;
    const own = getAttr(d as unknown as DataPoint, d.i, "fill");
    return valueColorAt(scale, rowValue(d, axis), own);
  };
}

/**
    A legend entry's swatch under value colors: its series' colors in equal
    steps, left to right for a Line entry and bottom to top for any other.
    Its own `fill` when the chart colors by series, or the entry's shape
    keeps series colors (a stacked area or bar).
    @param viz The chart.
    @param d The legend entry's datum.
    @param i Its index.
    @param fill Its fill.
*/
export function legendSwatchFill(
  viz: VizInstance,
  d: DataPoint,
  i: number,
  fill: string,
): string {
  if (!wantsValueColors(viz) || !ownColor(fill)) return fill;
  const shape = `${viz.schema.shape(d, i)}`;
  if (!valueColored(viz, shape)) return fill;
  // The swatch shows colors only, so any extent places them.
  const scale = plotValueScale(viz, [
    {data: d, i, id: "", x: 0, y: 0},
    {data: d, i, id: "", x: 1, y: 1},
  ]);
  return scale
    ? gradientToken(swatchGradient(scale, fill, shape === "Line"))
    : fill;
}
