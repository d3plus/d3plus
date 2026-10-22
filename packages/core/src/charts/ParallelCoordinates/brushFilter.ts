/**
    ParallelCoordinates brushing math: converting a brush's pixel extent on an
    axis to a data filter and back, and testing rows against every brush.
*/

import type {DataPoint} from "@d3plus/data";

import {isNumeric} from "./dimensions.js";
import type {DimensionType} from "./dimensions.js";

/** One axis's filter: a numeric `[min, max]`, or the categories selected. */
export type BrushRange = [number, number] | string[];

/** Every active filter, keyed by dimension. */
export type BrushSelection = Record<string, BrushRange>;

/** What the brush math needs to know about an axis. */
export interface BrushAxis {
  type: DimensionType;
  domain: (number | string)[];
  /** Pixel position of a value along the axis. */
  position: (v: number | string) => number;
  /** Value at a pixel position (numeric axes). */
  invert?: (px: number) => number;
}

/** Whether a filter is a numeric range rather than a list of categories. */
export function isNumericRange(range: BrushRange): range is [number, number] {
  return range.length === 2 && range.every(v => isNumeric(v));
}

/** Whether `value` falls inside one axis's filter. Missing values never do. */
export function valuePasses(value: unknown, range: BrushRange): boolean {
  if (isNumericRange(range)) {
    if (!isNumeric(value)) return false;
    const [lo, hi] = range[0] <= range[1] ? range : [range[1], range[0]];
    return value >= lo && value <= hi;
  }
  if (value === undefined || value === null) return false;
  return (range as string[]).includes(String(value));
}

/** Whether `row` passes every brush (brushes combine with AND). */
export function rowPasses(
  row: DataPoint,
  brushes: BrushSelection | undefined,
): boolean {
  if (!brushes) return true;
  for (const key of Object.keys(brushes)) {
    if (!valuePasses(row[key], brushes[key])) return false;
  }
  return true;
}

/** Whether any brush is set. */
export function hasBrushes(brushes: BrushSelection | undefined): boolean {
  return Boolean(brushes && Object.keys(brushes).length);
}

/**
    The filter a brush spanning pixels `[a, b]` selects on `axis`: the values
    under it on a numeric axis, the categories inside it on a categorical one
    (or null when it covers none).
*/
export function brushFromPixels(
  extent: [number, number],
  axis: BrushAxis,
): BrushRange | null {
  const lo = Math.min(extent[0], extent[1]);
  const hi = Math.max(extent[0], extent[1]);
  if (axis.type === "numeric") {
    if (!axis.invert) return null;
    const a = axis.invert(lo),
      b = axis.invert(hi);
    if (!isNumeric(a) || !isNumeric(b)) return null;
    return a <= b ? [a, b] : [b, a];
  }
  const picked = axis.domain
    .filter(c => {
      const p = axis.position(c);
      return p >= lo && p <= hi;
    })
    .map(String);
  return picked.length ? picked : null;
}

/**
    The pixel extent that draws `range` on `axis`. Categories get `pad`
    pixels beyond their outermost positions. Null when nothing selected sits
    on the axis.
*/
export function pixelsFromBrush(
  range: BrushRange,
  axis: BrushAxis,
  pad = 6,
): [number, number] | null {
  if (isNumericRange(range)) {
    if (axis.type !== "numeric") return null;
    const a = axis.position(range[0]),
      b = axis.position(range[1]);
    if (!isNumeric(a) || !isNumeric(b)) return null;
    return a <= b ? [a, b] : [b, a];
  }
  const selected = new Set(range.map(String));
  const positions = axis.domain
    .filter(c => selected.has(String(c)))
    .map(c => axis.position(c))
    .filter(isNumeric);
  if (!positions.length) return null;
  return [Math.min(...positions) - pad, Math.max(...positions) + pad];
}
