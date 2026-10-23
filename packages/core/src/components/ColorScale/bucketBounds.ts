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

/** The value of `steps` steps of `10^-places`. */
const fromSteps = (steps: number, places: number): number =>
  +(steps / 10 ** places).toPrecision(15);

/**
    The `[lower, upper]` values a ColorScale label shows for the bucket
    `[ticks[i], ticks[i + 1])`: the first and last values the data's own
    precision can write inside it, so integer data reads "1 - 2", "3 - 4".
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
  const places = max(allValues.filter(Number.isFinite).map(decimalPlaces)) ?? 0;
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
