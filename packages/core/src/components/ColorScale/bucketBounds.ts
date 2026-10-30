import {max} from "d3-array";

/**
    The number of decimal places `value` is written with, read at 15
    significant digits so float noise (`0.1 + 0.2`) doesn't count.
*/
export function decimalPlaces(value: number): number {
  const [mantissa, exponent] = value.toExponential(14).split("e");
  const decimals = mantissa.split(".")[1].replace(/0+$/, "");
  return Math.max(0, decimals.length - Number(exponent));
}

/** `value` counted in steps of `10^-places`, with float noise rounded off. */
const toSteps = (value: number, places: number): number =>
  +(value * 10 ** places).toPrecision(15);

/** The value of `steps` steps of `10^-places` (never `-0`). */
const fromSteps = (steps: number, places: number): number =>
  +(steps / 10 ** places).toPrecision(15) || 0;

/** Significant digits from which a value reads as computed rather than written. */
const COMPUTED_DIGITS = 12;

/** The number of significant digits `value` is written with, at 15 digits. */
export function significantDigits(value: number): number {
  const mantissa = value.toExponential(14).split("e")[0];
  return mantissa.replace(/[-.]/g, "").replace(/0+$/, "").length || 1;
}

/** How small, as a share of the values' span, a value is float noise around zero. */
const NOISE = 1e-9;

/**
    The decimal places bucket labels step at: the most any value is written
    with. A computed value (a mean such as `1 / 3`) carries float precision
    no label should step at, so its own places count only to the data's
    display precision: three significant digits of the values' span. A value
    within float noise of zero (`-1.4e-14`) counts as zero.
*/
export function labelPlaces(allValues: number[]): number {
  const finite = allValues.filter(Number.isFinite);
  if (!finite.length) return 0;
  const span = max(finite)! - Math.min(...finite) || Math.abs(finite[0]);
  const values = finite.map(v => (Math.abs(v) < span * NOISE ? 0 : v));
  const written = values.filter(v => significantDigits(v) < COMPUTED_DIGITS);
  const places = max(written.map(decimalPlaces)) ?? 0;
  if (written.length === values.length) return places;
  const display = span ? Math.max(0, 2 - Math.floor(Math.log10(span))) : 0;
  return Math.max(places, display);
}

/** `value` rounded to the places bucket labels step at (see `labelPlaces`). */
export function labelValue(value: number, allValues: number[]): number {
  const places = labelPlaces(allValues);
  return fromSteps(Math.round(toSteps(value, places)), places);
}

/**
    The `[lower, upper]` values a ColorScale label shows for the bucket
    `[ticks[i], ticks[i + 1])`: the first and last values the data's own
    precision (see `labelPlaces`) can write inside it, so integer data reads
    "1 - 2", "3 - 4", and computed values such as means don't step at float
    precision (a bucket ending at 0 reads "-9.5 - -0.1", not "-9.5 - -1f").
    When `format` prints the upper bound the same as the next bucket's lower
    one (an abbreviation like "1.5k"), the upper bound drops a decimal place
    at a time until it reads differently ("1.49k").
*/
export function bucketBounds(
  tick: number,
  i: number,
  ticks: number[],
  allValues: number[],
  format: (v: number) => string,
): [number, number] {
  const next = ticks[i + 1];
  const places = labelPlaces(allValues);
  const tickSteps = toSteps(tick, places);
  // A repeated first tick labels its own value, so the bucket after it
  // starts one step above.
  const lower = fromSteps(
    i === 1 && ticks[0] === tick
      ? Math.floor(tickSteps) + 1
      : Math.ceil(tickSteps),
    places,
  );
  const below = (p: number): number =>
    fromSteps(Math.ceil(toSteps(next, p)) - 1, p);
  const nextLabel = format(fromSteps(Math.ceil(toSteps(next, places)), places));
  let p = places;
  let upper = below(p);
  while (format(upper) === nextLabel && below(p - 1) >= lower)
    upper = below(--p);
  return [lower, upper];
}
