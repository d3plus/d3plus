import linearBand from "./linearBand.js";

/**
    Builds the prediction band for a new observation under a simple linear regression of `points`: `ŷ ± t·s·√(1 + 1/n + (x − x̄)²/Sxx)`. Wider than the confidence band of `linearConfidence`, since it covers the scatter of individual values as well as the uncertainty of the fitted line, which makes it the band to draw around a forecast. Returns a function mapping an x value to its `[lower, upper]` bounds, or `null` when there are fewer than three usable points or the x values do not vary.
    @param points An array of `[x, y]` pairs.
    @param level The confidence level, between 0 and 1. Defaults to 0.95.
*/
export default function linearPrediction(
  points: [number, number][],
  level = 0.95,
): ((x: number) => [number, number]) | null {
  return linearBand(points, level, 1);
}
