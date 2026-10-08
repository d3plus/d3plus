/**
    Pure data helpers for Pyramid: which side each row is drawn on, the
    percent-of-total divisor, and the half-width a symmetric value axis needs.
*/
import type {DataPoint} from "@d3plus/data";

/** A per-row accessor. */
export type RowAccessor<T = unknown> = (d: DataPoint, i: number) => T;

/** A finite number, or undefined for anything else (missing, NaN, arrays). */
export function finite(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
    The side values in drawing order, left first: the configured order, then
    any values it leaves out in order of first appearance in `data`.
*/
export function pyramidSides(
  data: DataPoint[],
  side: RowAccessor,
  configured?: unknown[],
): string[] {
  const order = Array.isArray(configured) ? configured.map(String) : [];
  data.forEach((d, i) => {
    const key = `${side(d, i)}`;
    if (!order.includes(key)) order.push(key);
  });
  return order;
}

/** -1 for a row on the left side (the first of `sides`), 1 for every other. */
export function sideSign(sides: string[], value: unknown): -1 | 1 {
  return sides.length > 0 && `${value}` === sides[0] ? -1 : 1;
}

/** The sum of every finite `value` in `data`. */
export function pyramidTotal(data: DataPoint[], value: RowAccessor): number {
  return data.reduce((sum, d, i) => sum + (finite(value(d, i)) ?? 0), 0);
}

/** Sums of `value` per frame (e.g. per year), keyed by `${frame(d, i)}`. */
export function frameTotals(
  data: DataPoint[],
  value: RowAccessor,
  frame: RowAccessor,
): Map<string, number> {
  const totals = new Map<string, number>();
  data.forEach((d, i) => {
    const key = `${frame(d, i)}`;
    totals.set(key, (totals.get(key) ?? 0) + (finite(value(d, i)) ?? 0));
  });
  return totals;
}

/** Accessors `pyramidExtent` groups and sums rows by. */
export interface PyramidExtentAccessors {
  /** The row's category (the discrete axis value, e.g. an age band). */
  category: RowAccessor;
  /** The row's side. */
  side: RowAccessor;
  /** The row's (positive) bar value. */
  value: RowAccessor;
  /** The row's comparison value, when an outline is drawn. */
  comparison?: RowAccessor;
  /** Separates frames (e.g. years) whose rows never share a bar. */
  frame?: RowAccessor;
}

/**
    The largest total any one side reaches in any one category (and frame),
    counting comparison values too: the half-width of a symmetric value axis
    that fits every bar and outline.
*/
export function pyramidExtent(data: DataPoint[], accessors: PyramidExtentAccessors): number {
  const {category, side, value, comparison, frame} = accessors;
  const values = new Map<string, number>();
  const comparisons = new Map<string, number>();
  data.forEach((d, i) => {
    const key = `${frame ? frame(d, i) : ""}\u0000${category(d, i)}\u0000${side(d, i)}`;
    values.set(key, (values.get(key) ?? 0) + Math.abs(finite(value(d, i)) ?? 0));
    if (comparison)
      comparisons.set(key, (comparisons.get(key) ?? 0) + Math.abs(finite(comparison(d, i)) ?? 0));
  });
  return Math.max(0, ...values.values(), ...comparisons.values());
}

/** `[-extent, extent]`, or `[-1, 1]` when there is nothing to fit. */
export function symmetricDomain(extent: number): [number, number] {
  return extent > 0 ? [-extent, extent] : [-1, 1];
}

/** Wraps a number formatter so values on either side read as magnitudes. */
export function absoluteFormat<T>(format: (d: number) => T): (d: unknown) => T {
  return (d: unknown) => format(typeof d === "number" ? Math.abs(d) : (d as number));
}
