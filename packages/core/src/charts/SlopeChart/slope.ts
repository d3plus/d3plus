/**
    Pure helpers behind SlopeChart: the periods its data spans, each series'
    direction between its first and last period, and the colors
    `slopeColor` draws those directions in.

    @module
*/

/** Which way a series moved between its first and last period. */
export type SlopeDirection = "up" | "down" | "flat";

/** The colors `slopeColor` draws each direction in. */
export interface SlopeColors {
  up: string;
  down: string;
  flat: string;
}

/** The `slopeColor` setting: on with the default colors, off, or on with some colors set. */
export type SlopeColorSetting = boolean | Partial<SlopeColors>;

/** A row accessor. */
type Accessor = (d: Record<string, unknown>, i: number) => unknown;

/** A period's sort key: a Date or number by value, anything else unsorted. */
const periodKey = (v: unknown): number | undefined =>
  v instanceof Date
    ? +v
    : typeof v === "number" && Number.isFinite(v)
      ? v
      : undefined;

/**
    The distinct periods among `values`, first to last: in time or numeric
    order when every value is a Date or a number, else in the order they
    first appear.
*/
export function slopePeriods(values: unknown[]): unknown[] {
  const seen = new Map<unknown, unknown>();
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const key = v instanceof Date ? +v : v;
    if (!seen.has(key)) seen.set(key, v);
  }
  const periods = [...seen.values()];
  return periods.every(p => periodKey(p) !== undefined)
    ? periods.sort((a, b) => periodKey(a)! - periodKey(b)!)
    : periods;
}

/** The direction from `start` to `end`: flat when they are equal. */
export function slopeDirection(start: number, end: number): SlopeDirection {
  return end > start ? "up" : end < start ? "down" : "flat";
}

/**
    Each series' direction between its first and last period, keyed by the
    series id as a string. A series with fewer than two periods is flat.
*/
export function slopeDirections(
  rows: Record<string, unknown>[],
  id: Accessor,
  x: Accessor,
  y: Accessor,
): Map<string, SlopeDirection> {
  const periods = slopePeriods(rows.map((d, i) => x(d, i)));
  const order = new Map(
    periods.map((p, i) => [p instanceof Date ? +p : p, i] as const),
  );
  const ends = new Map<
    string,
    {first: [number, number]; last: [number, number]}
  >();
  rows.forEach((d, i) => {
    const xv = x(d, i);
    const rank = order.get(xv instanceof Date ? +xv : xv);
    const value = Number(y(d, i));
    if (rank === undefined || !Number.isFinite(value)) return;
    const key = `${id(d, i)}`;
    const entry = ends.get(key);
    if (!entry) ends.set(key, {first: [rank, value], last: [rank, value]});
    else {
      if (rank < entry.first[0]) entry.first = [rank, value];
      if (rank >= entry.last[0]) entry.last = [rank, value];
    }
  });
  const out = new Map<string, SlopeDirection>();
  ends.forEach(({first, last}, key) =>
    out.set(key, slopeDirection(first[1], last[1])),
  );
  return out;
}

/** The default direction colors on a light background. */
export const slopeColorsLight: SlopeColors = Object.freeze({
  up: "#2f9e44",
  down: "#e03131",
  flat: "#767676",
});

/** The default direction colors on a dark background. */
export const slopeColorsDark: SlopeColors = Object.freeze({
  up: "#51cf66",
  down: "#ff6b6b",
  flat: "#adb5bd",
});

/**
    The colors a `slopeColor` setting draws in, or `null` when it is off:
    the defaults for a light or `dark` background (flat lines in `flat`, the
    theme's muted text, when given), under any colors the setting names.
*/
export function slopeColors(
  setting: SlopeColorSetting | undefined,
  dark: boolean,
  flat?: string,
): SlopeColors | null {
  if (!setting) return null;
  const base = {
    ...(dark ? slopeColorsDark : slopeColorsLight),
    ...(flat ? {flat} : {}),
  };
  return setting === true ? base : {...base, ...setting};
}
