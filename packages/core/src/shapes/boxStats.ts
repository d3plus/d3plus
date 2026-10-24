import {max, min, quantile} from "d3-array";

/** A Box's `whiskerMode` for each end: `"tukey"`, `"extent"`, or a quantile. */
export type WhiskerMode = (string | number)[];

/** The statistics a Box draws from its values. */
export interface BoxStats {
  first: number | undefined;
  median: number | undefined;
  third: number | undefined;
  lowerLimit: number | undefined;
  upperLimit: number | undefined;
}

/** A `whiskerMode` setting as a `[lower, upper]` pair. */
export function whiskerPair(mode: unknown): WhiskerMode {
  return (Array.isArray(mode) ? mode : [mode, mode]) as WhiskerMode;
}

/** One whisker end: `side` 0 is the lower, 1 the upper. */
function whiskerEnd(
  values: number[],
  mode: string | number,
  side: 0 | 1,
  first: number,
  third: number,
): number | undefined {
  const lo = min(values)!,
    hi = max(values)!;
  if (mode === "tukey") {
    const fence = side
      ? third + (third - first) * 1.5
      : first - (third - first) * 1.5;
    return side ? (fence > hi ? hi : fence) : fence < lo ? lo : fence;
  }
  if (mode === "extent") return side ? hi : lo;
  if (typeof mode === "number") return quantile(values, mode);
  return undefined;
}

/**
    The quartiles and whisker ends of ascending `values`. Each whisker end
    follows its side of `mode`: `"tukey"` reaches 1.5 interquartile ranges
    past its quartile, stopping at the extreme value; `"extent"` reaches the
    extreme value; a number reaches that quantile.
*/
export function boxStats(values: number[], mode: WhiskerMode): BoxStats {
  const first = quantile(values, 0.25);
  const median = quantile(values, 0.5);
  const third = quantile(values, 0.75);
  const end = (side: 0 | 1) =>
    whiskerEnd(values, mode[side], side, first!, third!);
  return {first, median, third, lowerLimit: end(0), upperLimit: end(1)};
}
