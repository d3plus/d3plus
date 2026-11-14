/**
    RadialLine and RadialArea's vertex dots: one Circle per point that has a
    row, painted from `shapeConfig.Circle` (a `r` of 0 or less draws none).
    Hovering a dot shows its series' value at that `x`, lights its series,
    and keeps only its own `x` label bright.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {
  paintFromShapeConfig,
  resolveAccessor,
} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** What a dot's row stands for: its `x` label, and its value. */
export interface RadialPointInfo {
  /** The `x` value's key. */
  key: string;
  /** The `x` value as labeled around the circle. */
  label: string;
  value: number;
}

/** A dot to draw: its row, where it sits, and what it stands for. */
export interface RadialDot {
  row: DataPoint;
  i: number;
  x: number;
  y: number;
  info: RadialPointInfo;
}

/** The dot rows of every drawn chart, each to what it stands for. */
const pointRows = new WeakMap<object, RadialPointInfo>();

/** Marks `row` as the dot for `info`, so its tooltip and hover read it. */
export function registerRadialPoint(
  row: DataPoint,
  info: RadialPointInfo,
): void {
  pointRows.set(row, info);
}

/** What `d` stands for when it is a dot's row, else undefined. */
export function radialPointOf(d: unknown): RadialPointInfo | undefined {
  return d && typeof d === "object" ? pointRows.get(d) : undefined;
}

/** A value as text: through `levelFormat` when set, as the ring labels are, else abbreviated. */
export function radialValueText(viz: VizInstance, value: number): string {
  const format = viz.schema.levelFormat as
    ((d: number) => string | number) | undefined;
  return typeof format === "function"
    ? `${format(value)}`
    : formatAbbreviate(value, viz.schema.locale as string);
}

/** The tooltip rows for a hovered datum: a dot's `x` label and value, nothing for a whole series. */
export function radialPointTooltipRows(
  viz: VizInstance,
  d: DataPoint,
): [string, string][] {
  const info = radialPointOf(d);
  return info ? [[info.label, radialValueText(viz, info.value)]] : [];
}

/**
    One Circle node per dot of series `id` (drawn `si`th), painted from
    `circleConfig`. None when the radius resolves to 0 or less.
*/
export function radialDotNodes(
  viz: VizInstance,
  id: string,
  si: number,
  dots: RadialDot[],
  circleConfig: Record<string, unknown>,
  prefix: string,
): SceneNode[] {
  const out: SceneNode[] = [];
  for (const dot of dots) {
    const r = Number(resolveAccessor<number>(circleConfig.r, dot.row, si));
    if (!(r > 0)) continue;
    out.push({
      type: "circle",
      key: `${prefix}-point-${id}-${dot.info.key}`,
      cx: 0,
      cy: 0,
      r,
      transform: {x: dot.x, y: dot.y},
      datum: dot.row,
      index: dot.i,
      // Only this dot's `x` label stays bright on hover.
      hoverKeys: {slot: [dot.info.key]},
      paint: paintFromShapeConfig(circleConfig, dot.row, si),
      aria: {
        label: `${viz._drawLabel(dot.row, dot.i)}, ${dot.info.label}: ${radialValueText(viz, dot.info.value)}.`,
      },
    } as SceneNode);
  }
  return out;
}

/**
    Wraps the chart's `mouseenter` handler so hovering a dot lights its
    whole series but only its own `x` label (see `_hoverFocus`).
*/
export function radialPointHover(viz: VizInstance): void {
  const base = viz.schema.on.mouseenter as
    ((d: DataPoint, i: number, x: unknown, event: unknown) => void) | undefined;
  viz.schema.on.mouseenter = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: unknown,
  ) => {
    if (base) base.call(viz, d, i, x, event);
    const info = radialPointOf(d);
    const hover = viz._hover;
    if (info && typeof hover === "function")
      viz._hoverFocus = {
        hover: hover as (d: DataPoint, i: number) => boolean,
        rows: [{slot: info.key} as DataPoint],
      };
  };
}
