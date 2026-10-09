import linearBand from "./linearBand.js";

/**
    Builds the confidence band for the mean response of a simple linear regression of `points`: `ŷ ± t·s·√(1/n + (x − x̄)²/Sxx)`. Returns a function mapping an x value to its `[lower, upper]` bounds, or `null` when there are fewer than three usable points or the x values do not vary.
    @param points An array of `[x, y]` pairs.
    @param level The confidence level, between 0 and 1. Defaults to 0.95.
*/
export default function linearConfidence(
  points: [number, number][],
  level = 0.95,
): ((x: number) => [number, number]) | null {
  return linearBand(points, level, 0);
}
