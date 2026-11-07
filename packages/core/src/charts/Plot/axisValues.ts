/**
    The sorted values a continuous Plot axis spans.

    @module
*/

import {unique} from "@d3plus/data";

/** A row of Plot's axis data: its axis values, and the row they came from. */
type AxisRow = Record<string, unknown>;

/**
    `numbers` sorted ascending (stably, as `sort((a, b) => a - b)`) without
    repeats, keeping the first of each. Sorted as a Float64Array, which
    orders them the same way, unless NaN (which that comparator leaves in
    place) or both zeros (which it keeps in their order, where a Float64Array
    puts -0 first) are among them.
*/
export function uniqueSortedNumbers(numbers: number[]): number[] {
  let nan = false,
    zero = false,
    negativeZero = false;
  for (const n of numbers) {
    if (n !== n) nan = true;
    else if (n === 0) {
      if (Object.is(n, -0)) negativeZero = true;
      else zero = true;
    }
  }
  if (nan || (zero && negativeZero))
    return unique([...numbers].sort((a, b) => a - b));
  const sorted = Float64Array.from(numbers).sort();
  const out: number[] = [];
  for (let i = 0; i < sorted.length; i++)
    if (i === 0 || sorted[i] !== sorted[i - 1]) out.push(sorted[i]);
  return out;
}

/**
    The values of `axis` across `rows`, sorted (by `sort`, else ascending)
    and without repeats (compared as strings, the
    first of each kept). Sorts `rows` in place, except when every value is a
    number and there is no `sort`: those values are sorted on their own,
    which gives the same list.
*/
export function sortedAxisValues(
  rows: AxisRow[],
  axis: string,
  sort?: (a: AxisRow, b: AxisRow) => number,
): unknown[] {
  if (!sort) {
    const values = rows.map(d => d[axis]);
    // Two numbers share a string form only when they are equal (0 and -0),
    // which is also when `unique` takes them as one.
    if (values.every(v => typeof v === "number"))
      return uniqueSortedNumbers(values as number[]);
  }
  return unique(
    rows
      .sort(sort ?? ((a, b) => (a[axis] as number) - (b[axis] as number)))
      .map(d => d[axis]),
    (d: unknown) => `${d}`,
  );
}
