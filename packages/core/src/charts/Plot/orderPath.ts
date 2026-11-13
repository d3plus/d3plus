/**
    `order`: each series' points joined in the order a field sets (a year, a
    step), so a line can double back and trace the path two measures took
    together. These are the pure parts: the order's comparison, each
    series' points in path order, and where the direction arrows and the
    first and last labels go.
*/
import type {DataPoint} from "@d3plus/data";

import {fieldAccessor, fieldNameOf} from "../../utils/fieldAccessor.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A pixel point. */
export type Pt = [number, number];

/** An order accessor: the row's place along its series' path. */
export type OrderAccessor = (d: DataPoint, i: number) => unknown;

/**
    The order ConnectedScatter joins points in until `order` is set: the
    order the rows come in. Rows aren't aggregated by it.
*/
export const DATA_ORDER: OrderAccessor = (_d, i) => i;

/**
    The `order` setter's coercion: a string reads that field, a function is
    used as is, and anything else turns the path off.
    @param value The configured `order`.
*/
export function coerceOrder(value: unknown): OrderAccessor | undefined {
  if (typeof value === "string") return fieldAccessor(value);
  return typeof value === "function" ? (value as OrderAccessor) : undefined;
}

/** The chart's order accessor, when it draws paths. */
export function orderOf(viz: VizInstance): OrderAccessor | undefined {
  const order = viz.schema.order;
  return typeof order === "function" ? (order as OrderAccessor) : undefined;
}

/**
    Keeps the field `order` reads from being summed when rows sharing a step
    aggregate: unless the user's `aggs` covers it, the merged row keeps the
    step's value.
    @param viz The chart.
*/
export function keepOrderField(viz: VizInstance): void {
  const order = orderOf(viz);
  const key = order && fieldNameOf(order);
  if (!key || viz.schema.aggs[key]) return;
  viz.schema.aggs[key] = (
    rows: DataPoint[],
    value: (d: DataPoint) => unknown,
  ) => {
    const values = Array.from(new Set(rows.map(value)));
    return values.length === 1 ? values[0] : values;
  };
}

/** An order value as a sortable number, or the value itself. */
function rank(v: unknown): unknown {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(+v))
    return +v;
  return v;
}

/**
    Compares two order values: numbers, numeric strings, and dates by value,
    other strings alphabetically after them, and missing values last.
    @param a The first value.
    @param b The second value.
*/
export function compareOrder(a: unknown, b: unknown): number {
  const missing = (v: unknown) =>
    v === undefined || v === null || (typeof v === "number" && isNaN(v));
  if (missing(a) || missing(b)) return missing(a) ? (missing(b) ? 0 : 1) : -1;
  const ra = rank(a),
    rb = rank(b);
  if (typeof ra === "number" && typeof rb === "number") return ra - rb;
  if (typeof ra === "number") return -1;
  if (typeof rb === "number") return 1;
  return `${ra}`.localeCompare(`${rb}`);
}

/** A formatted Plot row: its source row and index. */
interface Row {
  data: DataPoint;
  i: number;
  id?: unknown;
  [key: string]: unknown;
}

/**
    `rows` in path order: by `order` (ties keep their order), or as they
    come with `DATA_ORDER`.
    @param rows The formatted rows.
    @param order The order accessor.
*/
export function sortByOrder<T extends Row>(
  rows: T[],
  order: OrderAccessor,
): T[] {
  if (order === DATA_ORDER) return rows.slice().sort((a, b) => a.i - b.i);
  return rows
    .map((row, n) => ({row, n, v: order(row.data, row.i)}))
    .sort((a, b) => compareOrder(a.v, b.v) || a.n - b.n)
    .map(({row}) => row);
}

/**
    Each series' rows in path order, by series id, series in order of their
    first row.
    @param rows The formatted rows.
    @param order The order accessor.
*/
export function orderedSeries<T extends Row>(
  rows: T[],
  order: OrderAccessor,
): Map<string, T[]> {
  const series = new Map<string, T[]>();
  rows.forEach(row => {
    const id = `${row.id}`;
    if (!series.has(id)) series.set(id, []);
    series.get(id)!.push(row);
  });
  series.forEach((list, id) => series.set(id, sortByOrder(list, order)));
  return series;
}

/**
    A scene key for each point that stays with it across redraws: its series
    and its order value (or its position, with `DATA_ORDER`), numbered when
    a series repeats one.
    @param rows The points.
    @param order The order accessor.
*/
export function orderedPointKeys<T extends Row>(
  rows: T[],
  order: OrderAccessor,
): Map<T, string> {
  const seen = new Map<string, number>();
  const keys = new Map<T, string>();
  rows.forEach(row => {
    const step =
      order === DATA_ORDER
        ? `${row.x}_${row.y}`
        : `${rank(order(row.data, row.i))}`;
    const base = `${row.id}_${step}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    keys.set(row, n ? `${base}_${n}` : base);
  });
  return keys;
}

/** An arrowhead along a path: its tip, direction (radians), and segment. */
export interface PathArrow {
  x: number;
  y: number;
  angle: number;
  /** The index of the segment's first point. */
  segment: number;
}

/**
    One arrowhead centered on each segment of a path, pointing along it, for
    every segment with room for it: at least `3 × size` of line showing
    between the marks at its ends.
    @param points The path's points, in pixels.
    @param size The arrowheads' tip-to-base length.
    @param radii Each point's mark radius (0 for none).
*/
export function segmentArrows(
  points: Pt[],
  size: number,
  radii: number[] = [],
): PathArrow[] {
  const arrows: PathArrow[] = [];
  for (let k = 0; k < points.length - 1; k++) {
    const [x0, y0] = points[k],
      [x1, y1] = points[k + 1];
    const length = Math.hypot(x1 - x0, y1 - y0);
    const shown = length - (radii[k] ?? 0) - (radii[k + 1] ?? 0);
    if (!Number.isFinite(shown) || shown < size * 3) continue;
    const angle = Math.atan2(y1 - y0, x1 - x0);
    const mid = (radii[k] ?? 0) + shown / 2;
    arrows.push({
      x: x0 + Math.cos(angle) * (mid + size / 2),
      y: y0 + Math.sin(angle) * (mid + size / 2),
      angle,
      segment: k,
    });
  }
  return arrows;
}

/**
    The straight path an end label's text runs along inside the box it was
    placed in (see `placeCircleLabels`): across the box at its text's
    baseline.
    @param box The label's box.
    @param fontSize The label's font size.
*/
export function endLabelPath(
  box: {x: number; y: number; width: number; height: number},
  fontSize: number,
): string {
  const baseline = box.y + (box.height + fontSize * 0.7) / 2;
  return `M${box.x},${baseline}L${box.x + box.width},${baseline}`;
}
