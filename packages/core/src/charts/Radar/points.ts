/**
    Radar vertex dots: one Circle per polygon vertex, painted from
    `shapeConfig.Circle` (a `r` of 0 or less draws none). Hovering a dot
    shows that group's value for its metric and keeps only that metric's
    label bright.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {
  paintFromShapeConfig,
  resolveAccessor,
} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The metric and value a dot's datum stands for. */
export interface RadarPoint {
  metric: unknown;
  value: number;
}

/** A polygon's vertices, as `applyRadarLayout` lays them out. */
export interface RadarPointGroup {
  id: string | number;
  /** Each vertex's merged row. */
  arr: DataPoint[];
  /** Each vertex's metric. */
  metrics: unknown[];
  /** Each vertex's value. */
  values: number[];
  /** Each vertex's position, relative to the web's center. */
  points: {x: number; y: number}[];
}

/** The dot rows of every drawn radar, each to the metric and value it shows. */
const pointRows = new WeakMap<object, RadarPoint>();

/** Marks `row` as the dot for `point`, so its tooltip and hover read it. */
export function registerRadarPoint(row: DataPoint, point: RadarPoint): void {
  pointRows.set(row, point);
}

/** The metric and value `d` stands for when it is a dot's row, else undefined. */
export function radarPointOf(d: unknown): RadarPoint | undefined {
  return d && typeof d === "object" ? pointRows.get(d) : undefined;
}

/** A dot's value as text: through `levelFormat` when set, as the ring labels are, else abbreviated. */
function valueText(viz: VizInstance, value: number): string {
  const format = viz.schema.levelFormat as
    ((d: number) => string | number) | undefined;
  return typeof format === "function"
    ? `${format(value)}`
    : formatAbbreviate(value, viz.schema.locale as string);
}

/**
    The tooltip rows for a hovered datum: a dot's metric and value, nothing
    for a polygon.
*/
export function radarPointTooltipRows(
  viz: VizInstance,
  d: DataPoint,
): [string, string][] {
  const point = radarPointOf(d);
  return point ? [[`${point.metric}`, valueText(viz, point.value)]] : [];
}

/**
    One Circle node per vertex of each group, painted from `circleConfig`
    and drawn above every polygon. None when the radius resolves to 0 or
    less.
*/
export function radarPointNodes(
  viz: VizInstance,
  groups: RadarPointGroup[],
  circleConfig: Record<string, unknown>,
): SceneNode[] {
  const out: SceneNode[] = [];
  groups.forEach((g, gi) => {
    g.points.forEach((p, k) => {
      const datum = g.arr[k];
      const r = Number(resolveAccessor<number>(circleConfig.r, datum, gi));
      if (!(r > 0)) return;
      const metric = g.metrics[k];
      out.push({
        type: "circle",
        key: `radar-point-${g.id}-${metric}`,
        cx: 0,
        cy: 0,
        r,
        transform: {x: p.x, y: p.y},
        datum,
        // Only this dot's metric label stays bright on hover.
        hoverKeys: {metric: [metric]},
        paint: paintFromShapeConfig(circleConfig, datum, gi),
        aria: {
          label: `${viz._drawLabel(datum, gi)}, ${metric}: ${valueText(viz, g.values[k])}.`,
        },
      } as SceneNode);
    });
  });
  return out;
}

/**
    Wraps the chart's `mouseenter` handler so hovering a dot lights its
    whole polygon but only its own metric's label (see `_hoverFocus`).
*/
export function radarPointHover(viz: VizInstance): void {
  const base = viz.schema.on.mouseenter as
    ((d: DataPoint, i: number, x: unknown, event: unknown) => void) | undefined;
  viz.schema.on.mouseenter = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: unknown,
  ) => {
    if (base) base.call(viz, d, i, x, event);
    const point = radarPointOf(d);
    const hover = viz._hover;
    if (point && typeof hover === "function")
      viz._hoverFocus = {
        hover: hover as (d: DataPoint, i: number) => boolean,
        rows: [{metric: point.metric} as DataPoint],
      };
  };
}
