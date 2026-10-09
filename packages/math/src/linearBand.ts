import studentTQuantile from "./studentTQuantile.js";

/**
    Shared setup for the simple linear regression bands: fits `points`, then returns a function mapping an x value to `ŷ ± t·s·√(extra + 1/n + (x − x̄)²/Sxx)`, where `extra` is 0 for the mean response's confidence band and 1 for a new observation's prediction band. Returns `null` when there are fewer than three usable points, the x values do not vary, or `level` is outside (0, 1).
    @private
*/
export default function linearBand(
  points: [number, number][],
  level: number,
  extra: number,
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
    const margin = t * s * Math.sqrt(extra + 1 / n + (x - mx) ** 2 / sxx);
    return [yHat - margin, yHat + margin];
  };
}
