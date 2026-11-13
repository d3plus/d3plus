/**
    The scene for `order` (see `orderPath.ts`): each series' Line rows drawn
    in path order, its point rows (Circle, Rect) joined by a line in that
    order beneath them, an arrowhead on each segment pointing along the path
    (`pathArrows`), and the order values of its first and last points beside
    them (`pathLabels`).
*/
import type {DataPoint} from "@d3plus/data";
import {fontExists, textWidth} from "@d3plus/dom";
import {formatAbbreviate, formatDate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";
import {fontFamily as defaultFontFamily} from "@d3plus/text";

import {fieldNameOf} from "../../utils/fieldAccessor.js";
import {arrowNode, defaultArrowSize} from "../features/edgeArrows.js";
import {shapeConfigFor} from "../features/emitHelpers.js";
import {PATH_LABEL_FONT_SIZE, pathLabelNodes} from "../features/pathLabels.js";
import type {PathLabel} from "../features/pathLabels.js";
import type {PlotDatum} from "../features/plotPaint.js";
import {
  emitShape,
  genericEmit,
  type ShapeEmitContext,
} from "../features/shapeEmit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  DATA_ORDER,
  endLabelSpot,
  orderOf,
  orderedPointKeys,
  orderedSeries,
  segmentArrows,
  sortByOrder,
  type OrderAccessor,
  type Pt,
} from "./orderPath.js";

/** A formatted Plot row as the scene's datum type. */
const asRow = (d: PlotDatum) => d as unknown as DataPoint;

/** The shapes drawn as points, which `order` joins with a line. */
export const ORDER_POINT_SHAPES = ["Circle", "Rect"];

/** Each series' stroke color and width, read off its drawn lines. */
export function seriesStrokes(
  nodes: SceneNode[],
): Map<string, {stroke: string; width: number}> {
  const out = new Map<string, {stroke: string; width: number}>();
  const visit = (node: SceneNode) => {
    if (node.type === "group") node.children.forEach(visit);
    const shaped = node as SceneNode & {shapeType?: string};
    if (shaped.shapeType !== "Line" || `${node.key}`.endsWith("::hit")) return;
    const datum = node.datum as {key?: unknown; id?: unknown} | undefined;
    const id = datum?.key ?? datum?.id;
    const paint = (node.paint ?? {}) as {
      stroke?: unknown;
      strokeWidth?: unknown;
    };
    if (id === undefined || typeof paint.stroke !== "string") return;
    if (!out.has(`${id}`))
      out.set(`${id}`, {
        stroke: paint.stroke,
        width: typeof paint.strokeWidth === "number" ? paint.strokeWidth : 1,
      });
  };
  nodes.forEach(visit);
  return out;
}

/**
    The default text for an order value: a date as the chart labels dates
    among `dates`, a whole number under 10,000 (such as a year) as is, other
    numbers abbreviated, and anything else as text.
    @param value The order value.
    @param dates Every order value in the series that is a date.
    @param locale The chart's locale.
*/
export function orderValueText(
  value: unknown,
  dates: Date[],
  locale: string,
): string {
  if (value instanceof Date) return formatDate(value, dates);
  if (typeof value === "number")
    return Number.isInteger(value) && Math.abs(value) < 1e4
      ? `${value}`
      : formatAbbreviate(value, locale);
  return value === undefined || value === null ? "" : `${value}`;
}

/**
    The tooltip row naming a point's step along its path, e.g.
    `["year", "2004"]`, when `order` reads a named field; none otherwise, or
    for a datum standing for a whole series.
    @param viz The chart.
    @param d The hovered datum.
    @param i Its index.
*/
export function orderTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  const order = orderOf(viz);
  const name = order && order !== DATA_ORDER ? fieldNameOf(order) : undefined;
  if (!order || !name) return [];
  let row = d as DataPoint & {
    __d3plus__?: boolean;
    data?: DataPoint;
    i?: number;
  };
  let index = i;
  while (row && row.__d3plus__ && row.data) {
    if (typeof row.i === "number") index = row.i;
    row = row.data as typeof row;
  }
  const value = row ? order(row, index) : undefined;
  if (Array.isArray(value)) return [];
  const text = orderValueText(
    value,
    value instanceof Date ? [value] : [],
    viz.schema.locale,
  );
  return text ? [[name, text]] : [];
}

/** A point's mark radius: its circle's, a line marker's, or none. */
function radiusOf(viz: VizInstance): (d: PlotDatum) => number {
  const circle = shapeConfigFor(viz, "Circle").r;
  const marker = viz._lineMarkerConfig?.r;
  const value = (v: unknown, d: PlotDatum) =>
    Number(typeof v === "function" ? v(d, d.i) : v) || 0;
  return d =>
    d.shape === "Line"
      ? viz._lineMarkers
        ? value(marker, d)
        : 0
      : value(circle, d);
}

/** The text a `pathLabels` setting gives a point, or null for none. */
function labelText(
  viz: VizInstance,
  order: OrderAccessor,
  series: PlotDatum[],
  d: PlotDatum,
): string | null {
  const setting = viz.schema.pathLabels;
  if (!setting) return null;
  if (typeof setting === "function") {
    const text = (setting as (d: DataPoint, i: number) => unknown)(d.data, d.i);
    return text === false || text === null || text === undefined || text === ""
      ? null
      : `${text}`;
  }
  // Rows joined as they come have no order value to show.
  if (order === DATA_ORDER) return null;
  const dates = series
    .map(p => order(p.data, p.i))
    .filter((v): v is Date => v instanceof Date);
  return orderValueText(order(d.data, d.i), dates, viz.schema.locale) || null;
}

/** The arrowheads and end labels for every series' path. */
function pathDecor(
  ctx: ShapeEmitContext,
  rows: PlotDatum[],
  order: OrderAccessor,
  strokes: Map<string, {stroke: string; width: number}>,
): SceneNode[] {
  const {viz, x, y} = ctx;
  const radius = radiusOf(viz);
  const arrows: SceneNode[] = [];
  const labels: PathLabel[] = [];
  const style = {
    "font-family": fontExists(defaultFontFamily) as string,
    "font-size": PATH_LABEL_FONT_SIZE,
    "font-weight": 600,
  };
  const [left, right] = [Math.min(...ctx.xRange), Math.max(...ctx.xRange)];
  const [top, bottom] = [Math.min(...ctx.yRange), Math.max(...ctx.yRange)];
  const bounds: [number, number, number, number] = [left, right, top, bottom];
  orderedSeries(rows, order).forEach((series, id) => {
    const points = series.map((d): Pt => [x(d.x), y(d.y)]);
    const radii = series.map(radius);
    const {stroke, width} = strokes.get(id) ?? {stroke: "#888", width: 1};
    if (viz.schema.pathArrows)
      segmentArrows(points, defaultArrowSize(width), radii).forEach(a =>
        arrows.push(
          arrowNode({
            key: `order-arrow-${id}-${a.segment}`,
            datum: asRow(series[a.segment + 1]),
            x: a.x,
            y: a.y,
            angle: a.angle,
            size: defaultArrowSize(width),
            fill: stroke,
          }),
        ),
      );
    const ends = series.length > 1 ? [0, series.length - 1] : [0];
    ends.forEach(n => {
      const text = labelText(viz, order, series, series[n]);
      if (!text) return;
      const neighbor = points[n === 0 ? 1 : n - 1];
      const spot = endLabelSpot(
        points[n],
        neighbor,
        radii[n],
        textWidth(text, style) as number,
        PATH_LABEL_FONT_SIZE,
        bounds,
      );
      labels.push({
        key: `order-label-${id}-${n === 0 ? "first" : "last"}`,
        text,
        color: stroke,
        datum: asRow(series[n]),
        index: series[n].i,
        ...spot,
      });
    });
  });
  return [...arrows, ...pathLabelNodes(viz, labels)];
}

/**
    The plot's marks with `order` applied: Line rows in path order, point
    rows with keys that follow their order value and a line joining them
    beneath, then the paths' arrowheads and end labels on top.
    @param ctx The shape emit context.
    @param shapeData The rows by shape.
    @param order The order accessor.
*/
export function orderedMarks(
  ctx: ShapeEmitContext,
  shapeData: [string, DataPoint[]][],
  order: OrderAccessor,
): {marks: SceneNode[]; decor: SceneNode[]} {
  const rowsOf = (key: string) =>
    shapeData
      .filter(([k]) => k === key)
      .flatMap(([, values]) => values as PlotDatum[]);
  const points = ORDER_POINT_SHAPES.flatMap(rowsOf);
  const lines = sortByOrder(rowsOf("Line"), order);
  // The joining line is drawn first: the point shapes decorate their rows.
  const joins = points.length
    ? genericEmit(
        {
          ...ctx,
          values: [...orderedSeries(points, order).values()].flat().map(asRow),
        },
        "Line",
      )
    : [];
  const marks = shapeData.flatMap(([key, values]) => {
    if (key === "Line")
      return emitShape({...ctx, values: lines.map(asRow)}, key);
    if (!ORDER_POINT_SHAPES.includes(key))
      return emitShape({...ctx, values}, key);
    const keys = orderedPointKeys(values as PlotDatum[], order);
    // Points along a path leave naming the series to the legend.
    const shapeConfig = {
      ...ctx.shapeConfig,
      id: (d: PlotDatum) => keys.get(d),
      label: false,
    };
    return emitShape({...ctx, shapeConfig, values}, key);
  });
  const all = [...joins, ...marks];
  return {
    marks: all,
    decor: pathDecor(ctx, [...lines, ...points], order, seriesStrokes(all)),
  };
}
