/**
    Tick values for a power scale whose exponent isn't 1. Value-spaced ticks
    bunch up where the exponent compresses the axis and leave long gaps
    where it stretches it, so these are spaced evenly along the axis instead,
    each rounded to a round number at the precision its neighbors allow.
*/

/**
    The exponent a `"pow"` axis uses: `exponent` when it is a positive
    number, else 1.
*/
export const powExponent = (exponent: unknown): number =>
  typeof exponent === "number" && Number.isFinite(exponent) && exponent > 0
    ? exponent
    : 1;

/** `value` raised to `exponent`, keeping its sign (as d3's `scalePow` does). */
const raise = (value: number, exponent: number): number =>
  value < 0 ? -Math.pow(-value, exponent) : Math.pow(value, exponent);

/**
    `value` rounded to the roundest number within `tolerance` of it: the
    nearest multiple of the largest step (1, 2 or 5 times a power of ten)
    that lands that close.
*/
export function roundWithin(value: number, tolerance: number): number {
  if (!(tolerance > 0) || !Number.isFinite(tolerance)) return value;
  let power = Math.floor(Math.log10(Math.max(Math.abs(value), tolerance))) + 1;
  for (; power > -30; power--) {
    for (const m of [5, 2, 1]) {
      const step = m * Math.pow(10, power);
      const rounded = Math.round(value / step) * step;
      if (Math.abs(rounded - value) <= tolerance)
        return +rounded.toPrecision(12);
    }
  }
  return value;
}

/**
    Each value rounded to within a third of the distance to its nearest
    neighbor in `neighbors`, so neighbors stay apart.
*/
function roundEach(values: number[], neighbors: number[]): number[] {
  return values.map(value => {
    const spacing = Math.min(
      ...neighbors.map(n => Math.abs(n - value)).filter(d => d > 0),
    );
    return roundWithin(value, spacing / 3);
  });
}

/**
    Tick values for a power scale: `count` equal steps along the axis (in the
    scale's transformed space), each rounded to a round number. With
    `minor`, the midpoints between those steps are added, so the major
    ticks are always a subset of the minor ones. Returns ascending values
    inside the domain, or the domain's own order when it runs high to low.
    @param domain The scale's domain.
    @param exponent The scale's exponent.
    @param count How many steps to divide the axis into.
    @param minor Whether to add a tick between each pair of steps.
*/
export function powTicks(
  domain: number[],
  exponent: number,
  count: number,
  minor = false,
): number[] {
  const [d0, d1] = domain.map(Number);
  const lo = Math.min(d0, d1);
  const hi = Math.max(d0, d1);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi || !exponent)
    return lo === hi && Number.isFinite(lo) ? [lo] : [];
  const steps = Math.max(1, Math.round(count));
  const t0 = raise(lo, exponent);
  const t1 = raise(hi, exponent);
  const sample = (n: number): number[] =>
    Array.from({length: n + 1}, (_, i) =>
      raise(t0 + ((t1 - t0) * i) / n, 1 / exponent),
    );
  const majorRaw = sample(steps);
  const major = roundEach(majorRaw, majorRaw);
  let ticks = major;
  if (minor) {
    const all = sample(steps * 2);
    const mids = all.filter((_, i) => i % 2);
    ticks = major.concat(roundEach(mids, all));
  }
  const values = Array.from(new Set(ticks))
    .filter(d => d >= lo && d <= hi)
    .sort((a, b) => a - b);
  return d1 < d0 ? values.reverse() : values;
}
