import studentTQuantile from "./studentTQuantile.js";

/**
    Builds the confidence band for the mean response of a simple linear regression of `points`: `ŷ ± t·s·√(1/n + (x − x̄)²/Sxx)`. Returns a function mapping an x value to its `[lower, upper]` bounds, or `null` when there are fewer than three usable points or the x values do not vary.
    @param points An array of `[x, y]` pairs.
    @param level The confidence level, between 0 and 1. Defaults to 0.95.
*/
export default function linearConfidence(
  points: [number, number][],
  level = 0.95,
): ((x: number) => [number, number]) | null {
  const usable = (points || []).filter(
    ([x, y]) => Number.isFinite(x) && Number.isFinite(y),
  );
  const n = usable.length;
  if (n < 3 || !(level > 0 && level < 1)) return null;
  const mx = usable.reduce((s, d) => s + d[0], 0) / n;
  const my = usable.reduce((s, d) => s + d[1], 0) / n;
  let sxx = 0;
  let sxy = 0;
  usable.forEach(([x, y]) => {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
  });
  if (!(sxx > 0)) return null;
  const b = sxy / sxx;
  const a = my - b * mx;
  const ssRes = usable.reduce((s, [x, y]) => s + (y - a - b * x) ** 2, 0);
  const s = Math.sqrt(ssRes / (n - 2));
  const t = studentTQuantile(1 - (1 - level) / 2, n - 2);
  return (x: number) => {
    const yHat = a + b * x;
    const margin = t * s * Math.sqrt(1 / n + (x - mx) ** 2 / sxx);
    return [yHat - margin, yHat + margin];
  };
}
