/**
    A Box's optional extras: a mean marker (`boxMean`), a notch around the
    median (`boxNotch`), widths that grow with each box's observation count
    (`boxWidthByCount`), and every observation drawn as a jittered point
    (`boxPoints`). Each works on the box datums `Box` computes, in the same
    units as its `x` and `y` accessors.
*/

import type {DataPoint} from "@d3plus/data";

import {jitterOffset, jitterWidth} from "../utils/jitter.js";
import {fieldAccessor} from "../utils/fieldAccessor.js";

/** A row accessor. */
type RowFn = (d: DataPoint, i: number) => unknown;

/** A box datum, as `Box` computes it. */
type BoxDatum = Record<string, unknown>;

/** The multiplier of IQR/√n that gives a notch's half-height. */
const NOTCH_FACTOR = 1.58;

/** The mean marker's half-diagonal in pixels. */
export const MEAN_SIZE = 5;

/**
    A `boxMean` or `boxNotch` setting: `true` computes it from the box's
    values, a function reads it from each box's datum, a string (`boxMean`)
    reads that data key, and anything else turns it off.
*/
export function toBoxExtra(value: unknown): boolean | RowFn {
  if (typeof value === "function") return value as RowFn;
  if (typeof value === "string" && value) return fieldAccessor(value) as RowFn;
  return value === true;
}

const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** The arithmetic mean of `values`, or undefined when there are none. */
export function meanOf(values: number[]): number | undefined {
  const nums = values.filter(finite);
  if (!nums.length) return undefined;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
    The median's notch, `median ± 1.58·IQR/√n` (McGill, Tukey & Larsen),
    an approximate 95% interval around the median. Null when `n` is under 1
    or any value isn't finite.
    @param median The median.
    @param q1 The lower quartile.
    @param q3 The upper quartile.
    @param n How many observations the box summarizes.
*/
export function notchInterval(
  median: number,
  q1: number,
  q3: number,
  n: number,
): [number, number] | null {
  if (![median, q1, q3, n].every(finite) || n < 1) return null;
  const half = (NOTCH_FACTOR * Math.abs(q3 - q1)) / Math.sqrt(n);
  return [median - half, median + half];
}

/**
    A box's width scaled by the square root of its share of the largest
    box's count, so area tracks how many observations each box holds.
    @param width The full box width.
    @param n This box's observation count.
    @param maxN The largest count among the boxes.
*/
export function countWidth(width: number, n: number, maxN: number): number {
  if (!finite(n) || !finite(maxN) || maxN <= 0 || n <= 0) return width;
  return width * Math.sqrt(Math.min(n, maxN) / maxN);
}

/**
    A notched box's outline, around its center: the box between its
    quartiles, pinched to half its width at the median, with the pinch
    starting and ending at the notch's ends (held inside the box).
    @param box The box datum: `orient`, `width`, `height`, `x`, `y`, `median`, and `notch`.
*/
export function notchedBoxPath(box: BoxDatum): string {
  const vertical = box.orient === "vertical";
  const across = ((vertical ? box.width : box.height) as number) / 2;
  const along = ((vertical ? box.height : box.width) as number) / 2;
  const center = (vertical ? box.y : box.x) as number;
  const [lo, hi] = box.notch as [number, number];
  const clampIn = (v: number) => Math.max(-along, Math.min(along, v - center));
  const a = clampIn(Math.min(lo, hi));
  const b = clampIn(Math.max(lo, hi));
  const m = clampIn(box.median as number);
  const inner = across / 2;
  const outline: [number, number][] = [
    [-across, -along],
    [across, -along],
    [across, a],
    [inner, m],
    [across, b],
    [across, along],
    [-across, along],
    [-across, b],
    [-inner, m],
    [-across, a],
  ];
  const points = outline.map(([u, v]) => (vertical ? [u, v] : [v, u]));
  return `M${points.map(p => p.join(",")).join("L")}Z`;
}

/** What `applyBoxExtras` reads from the Box. */
export interface BoxExtrasHost {
  schema: Record<string, unknown>;
}

/** Each box's values along its value axis, as its `x` or `y` accessor gives them. */
function boxValues(schema: Record<string, unknown>, box: BoxDatum): number[] {
  const value = (box.orient === "vertical" ? schema.y : schema.x) as RowFn;
  return ((box.values || []) as DataPoint[]).map(
    (d, i) => value(d, i) as number,
  );
}

/**
    Stamps each box datum with its extras: `count` (its observations, or a
    precomputed box's `boxCount`), `mean` and `notch` when those are on,
    and, with `boxWidthByCount`, a width scaled by its count.
    @param host The Box.
    @param boxes The computed box datums.
    @param computed Whether the boxes summarize observations (not precomputed rows).
*/
export function applyBoxExtras(
  host: BoxExtrasHost,
  boxes: BoxDatum[],
  computed: boolean,
): void {
  const {schema} = host;
  const read = (key: string, box: BoxDatum): unknown => {
    const fn = schema[key];
    return typeof fn === "function"
      ? (fn as RowFn)(box.data as DataPoint, box.i as number)
      : undefined;
  };
  for (const box of boxes) {
    const given = Number(read("boxCount", box));
    box.count = computed
      ? ((box.values || []) as unknown[]).length
      : finite(given)
        ? given
        : undefined;
    const mean =
      schema.boxMean === true
        ? computed
          ? meanOf(boxValues(schema, box))
          : undefined
        : read("boxMean", box);
    if (finite(mean)) box.mean = mean;
    const notch =
      schema.boxNotch === true
        ? notchInterval(
            box.median as number,
            box.first as number,
            box.third as number,
            box.count as number,
          )
        : read("boxNotch", box);
    if (Array.isArray(notch) && notch.length === 2 && notch.every(finite))
      box.notch = notch;
  }
  if (!schema.boxWidthByCount) return;
  const counts = boxes.map(b => b.count).filter(finite);
  const maxN = Math.max(0, ...counts);
  for (const box of boxes) {
    const side = box.orient === "vertical" ? "width" : "height";
    box[side] = countWidth(box[side] as number, box.count as number, maxN);
  }
}

/** A point's stable jitter key: its row's `id`, else its index in the box. */
const pointKey = (row: DataPoint, k: number): string =>
  `${(row as Record<string, unknown>).id ?? k}`;

/**
    The cross-axis position of a point beside `box`: the box's center plus
    the point's seeded offset times `jitter` of the box's width.
    @param box The box datum.
    @param key The point's jitter key.
    @param jitter The `jitter` setting.
*/
export function jitteredCenter(
  box: BoxDatum,
  key: string,
  jitter: unknown,
): number {
  const vertical = box.orient === "vertical";
  const center = (vertical ? box.x : box.y) as number;
  const width = (vertical ? box.width : box.height) as number;
  return center + jitterOffset(key) * jitterWidth(jitter) * width;
}

/**
    The point records `boxPoints` draws for a computed box: one per
    observation inside its whiskers (outliers keep their own marks), each
    jittered across the box's width by `jitter`.
    @param host The Box.
    @param box The box datum.
*/
export function boxPointData(host: BoxExtrasHost, box: BoxDatum): DataPoint[] {
  const {schema} = host;
  const vertical = box.orient === "vertical";
  const values = boxValues(schema, box);
  const lo = Math.min(box.lowerLimit as number, box.upperLimit as number);
  const hi = Math.max(box.lowerLimit as number, box.upperLimit as number);
  const out: DataPoint[] = [];
  ((box.values || []) as DataPoint[]).forEach((row, k) => {
    const v = values[k];
    if (!finite(v) || v < lo || v > hi) return;
    const key = pointKey(row, k);
    const at = jitteredCenter(box, key, schema.jitter);
    out.push({
      __d3plus__: true,
      data: row,
      i: k,
      id: `${box.id}-point-${key}`,
      x: vertical ? at : v,
      y: vertical ? v : at,
    } as unknown as DataPoint);
  });
  return out;
}

/**
    Moves each outlier record off its box's center line by its seeded
    jitter, so outliers sit among the box's jittered points.
    @param host The Box.
    @param box The box datum the outliers belong to.
    @param outliers The box's outlier records.
*/
export function jitterOutliers(
  host: BoxExtrasHost,
  box: BoxDatum,
  outliers: DataPoint[],
): void {
  const axis = box.orient === "vertical" ? "x" : "y";
  for (const o of outliers) {
    const rec = o as Record<string, unknown>;
    const key = pointKey(rec.data as DataPoint, rec.i as number);
    rec[axis] = jitteredCenter(box, key, host.schema.jitter);
  }
}
