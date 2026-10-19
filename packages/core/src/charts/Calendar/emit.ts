/**
    `calendarEmit` — one Rect per day (days with a row take their fill from
    `shapeConfig`, the rest the neutral `emptyFill`), the month outlines of
    year blocks above them, then the weekday, month, and year labels.
*/

import {interpolateRgb} from "d3-interpolate";
import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {backgroundColor, textWidth} from "@d3plus/dom";
import type {SceneNode, TextNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import {
  resolveAccessor,
  shapeConfigFor,
  textureFill,
} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

import type {CalendarCellDatum, CalendarLabelStyle} from "./applyLayout.js";
import {cellCornerRadius} from "./calendarGrid.js";
import type {CalendarLabel, CalendarLayoutResult} from "./calendarLayout.js";

/** The colors Calendar draws its chrome in when the config leaves them unset. */
export interface CalendarPalette {
  /** Days without a value. */
  empty: string;
  /** Month outlines. */
  outline: string;
  /** Labels. */
  text: string;
}

/**
    Chrome colors read against the chart's background, so they hold up on
    light and dark themes: empty days are a faint tint of the contrasting
    text color, outlines a stronger one, and labels stronger still.
*/
export function calendarPalette(
  background: string,
  ink: string,
): CalendarPalette {
  const mix = interpolateRgb(background, ink);
  return {empty: mix(0.09), outline: mix(0.45), text: mix(0.75)};
}

/** The chart's background color, as detected behind its container. */
function chartBackground(viz: VizInstance): string {
  return viz._select
    ? backgroundColor(viz._select.node())
    : "rgb(255, 255, 255)";
}

/** A row's `colorScale` value, when a `colorScale` is set and gives it a finite number. */
export function colorValue(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): number | undefined {
  const colorScale = viz.schema.colorScale as
    ((d: DataPoint, i: number) => unknown) | undefined;
  if (typeof colorScale !== "function") return undefined;
  const value = colorScale(d, i);
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "boolean"
  )
    return undefined;
  return Number.isFinite(+value!) ? +value! : undefined;
}

/**
    Whether a row has a value to color: always, unless a `colorScale` is set
    and gives the row no finite number.
*/
export function hasColorValue(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): boolean {
  return (
    typeof viz.schema.colorScale !== "function" ||
    colorValue(viz, d, i) !== undefined
  );
}

/** A label as a text node, vertically centered on its anchor. */
function labelNode(
  label: CalendarLabel,
  style: CalendarLabelStyle,
  color: string,
  measure: (text: string) => number,
): TextNode {
  const bold = label.kind === "year" || label.kind === "title";
  return {
    type: "text",
    key: `calendar-label-${label.key}`,
    interactive: false,
    x: 0,
    y: 0,
    transform: {
      x: label.x,
      y: label.y,
      ...(label.rotate ? {rotate: label.rotate} : {}),
    },
    lines: [{text: label.text, x: 0, y: 0, width: measure(label.text)}],
    font: {
      family: style.fontFamily,
      size: style.fontSize,
      weight: bold ? 600 : style.fontWeight,
      anchor: label.anchor,
      baseline: "middle",
    },
    paint: {fill: color},
  };
}

/** What every cell of one draw shares. */
interface CellContext {
  viz: VizInstance;
  sc: Record<string, unknown>;
  emptyFill: string;
  padding: number;
  side: number;
  radius: number;
  noData: string;
  dateFormat?: (date: Date) => string;
}

/** One day's Rect: a data row painted from `shapeConfig`, or an empty day. */
function cellNode(cell: CalendarCellDatum, c: CellContext): SceneNode {
  const {viz, sc, emptyFill, noData} = c;
  const base = {
    type: "rect",
    key: `calendar-${cell.key}`,
    x: cell.x + c.padding / 2,
    y: cell.y + c.padding / 2,
    width: c.side,
    height: c.side,
    ...(c.radius ? {rx: c.radius, ry: c.radius} : {}),
  };
  const {datum, i} = cell;
  if (!datum) {
    const day = c.dateFormat ? c.dateFormat(cell.date) : cell.key;
    return {
      ...base,
      interactive: false,
      paint: {fill: emptyFill},
      aria: {label: `${day}, ${noData}.`},
    } as SceneNode;
  }
  const value = colorValue(viz, datum, i ?? 0);
  const valued = hasColorValue(viz, datum, i ?? 0);
  const fill = valued ? resolveAccessor<string>(sc.fill, datum, i) : emptyFill;
  const name = resolveAccessor<string>(sc.ariaLabel, datum, i) ?? cell.key;
  const spoken = valued ? value : noData;
  return {
    ...base,
    datum,
    index: i,
    shapeType: "Rect",
    paint: {
      fill: valued ? textureFill(sc, datum, i, fill) : fill,
      stroke: resolveAccessor<string>(sc.stroke, datum, i),
      strokeWidth: resolveAccessor<number>(sc.strokeWidth, datum, i),
      opacity: resolveAccessor<number>(sc.opacity, datum, i) ?? 1,
    },
    aria: {label: `${spoken === undefined ? name : `${name}, ${spoken}`}.`},
  } as SceneNode;
}

/** The month outlines, styled by `monthOutlineConfig`, or none when `monthOutline` is off. */
function outlineNodes(
  viz: VizInstance,
  layout: CalendarLayoutResult,
  stroke: string,
): SceneNode[] {
  if (!viz.schema.monthOutline) return [];
  const config = (viz.schema.monthOutlineConfig ?? {}) as Record<
    string,
    unknown
  >;
  const dash = config.strokeDasharray as number[] | undefined;
  return layout.outlines.map(
    outline =>
      ({
        type: "path",
        key: `calendar-${outline.key}`,
        d: outline.d,
        interactive: false,
        paint: {
          fill: "none",
          stroke: (config.stroke as string | undefined) ?? stroke,
          strokeWidth: (config.strokeWidth as number | undefined) ?? 1,
          ...(dash ? {strokeDasharray: dash} : {}),
        },
      }) as SceneNode,
  );
}

export const calendarEmit: ChartEmit = ({viz, shapeData}) => {
  const cells = (shapeData ?? []) as unknown as CalendarCellDatum[];
  const layout = viz.ctx.calendarLayout as CalendarLayoutResult | undefined;
  if (!cells.length || !layout) return [];
  const style = viz.ctx.calendarLabelStyle as CalendarLabelStyle;

  const background = chartBackground(viz);
  const palette = calendarPalette(
    background,
    colorContrast(background, viz.schema.colorDefaults),
  );
  const sc = shapeConfigFor(viz, "Rect");
  const size = layout.fit.cell;
  const padding = Math.min(
    Math.max(0, Number(viz.schema.cellPadding) || 0),
    size / 2,
  );
  const side = Math.max(0, size - padding);
  const context: CellContext = {
    viz,
    sc,
    emptyFill: (viz.schema.emptyFill as string | undefined) ?? palette.empty,
    padding,
    side,
    radius: cellCornerRadius(Number(viz.schema.cellRadius) || 0, side),
    noData: viz.schema.translate("No Data"),
    dateFormat: viz.ctx.calendarDateFormat as
      ((date: Date) => string) | undefined,
  };
  const cellNodes = cells.map(cell => cellNode(cell, context));
  const drawn = cells.filter(cell => cell.datum);
  const dataNodes = cellNodes.filter(n => n.datum);

  const measure = (text: string) =>
    textWidth(text, {
      "font-family": style.fontFamily,
      "font-size": style.fontSize,
      "font-weight": style.fontWeight,
    }) as number;
  const labelNodes = layout.labels.map(label =>
    labelNode(label, style, style.fontColor ?? palette.text, measure),
  );

  return [
    ...cellNodes,
    ...backgroundImageNodes(sc, dataNodes, k => [drawn[k].datum!, drawn[k].i]),
    ...outlineNodes(viz, layout, palette.outline),
    ...labelNodes,
  ];
};
