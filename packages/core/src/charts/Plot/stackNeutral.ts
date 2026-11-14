/**
    A diverging stack centered on a neutral series (`stackNeutral`), as a
    Likert chart draws it: each stack's neutral segments straddle zero, half
    on each side, and the other series stack outward from them, positive
    values on one side and negative values on the other.

    @module
*/
import type {DataPoint} from "@d3plus/data";

/** The `stackNeutral` setting: the neutral series' id, or an accessor that is truthy for its rows. */
export type StackNeutralSetting =
  | string
  | number
  | ((d: DataPoint, i: number) => unknown)
  | null
  | undefined
  | false;

/** A d3-stack series, as the stack's order and offset functions receive it. */
type StackSeries = ArrayLike<number[]> & {key: string};

/** A stacked Plot row: its stack key, source datum and index. */
interface NeutralRow {
  id?: unknown;
  data?: unknown;
  i?: unknown;
}

/**
    Whether a row belongs to the neutral series: an accessor's truthy
    return, or any of the row's ids (from `ids`) matching the setting.
    Null when the setting is unset.
    @param setting The `stackNeutral` setting.
    @param ids The row's ids, one per drawn `groupBy` level.
*/
export function stackNeutralMatcher(
  setting: StackNeutralSetting,
  ids: (d: DataPoint, i: number) => unknown[],
): ((d: DataPoint, i: number) => boolean) | null {
  if (setting === undefined || setting === null || setting === false)
    return null;
  if (typeof setting === "function") return (d, i) => !!setting(d, i);
  const target = `${setting}`;
  return (d, i) => ids(d, i).some(id => `${id}` === target);
}

/**
    The stack keys of the neutral series' rows.
    @param rows The stacked rows.
    @param isNeutral Whether a row's datum is neutral.
*/
export function neutralStackKeys(
  rows: NeutralRow[],
  isNeutral: (d: DataPoint, i: number) => boolean,
): Set<string> {
  const keys = new Set<string>();
  for (const row of rows)
    if (row.data && isNeutral(row.data as DataPoint, Number(row.i)))
      keys.add(`${row.id}`);
  return keys;
}

/**
    Each stack key's rank: the place its series first appears in the data,
    so data listed in scale order ("Strongly disagree" … "Strongly agree")
    ranks in that order.
    @param rows The stacked rows.
    @param seriesOf The series a row belongs to.
*/
export function stackKeyRanks(
  rows: NeutralRow[],
  seriesOf: (row: NeutralRow) => string,
): Map<string, number> {
  const first = new Map<string, number>();
  for (const row of rows) {
    const series = seriesOf(row);
    const i = Number(row.i);
    if (!first.has(series) || i < first.get(series)!) first.set(series, i);
  }
  const order = [...first.keys()].sort((a, b) => first.get(a)! - first.get(b)!);
  const ranks = new Map<string, number>();
  for (const row of rows) ranks.set(`${row.id}`, order.indexOf(seriesOf(row)));
  return ranks;
}

/** The sum of a series' values (each segment's end before the offset runs). */
const seriesSum = (s: StackSeries): number => {
  let total = 0;
  for (let j = 0; j < s.length; j++) {
    const v = +s[j][1] - +s[j][0];
    if (Number.isFinite(v)) total += v;
  }
  return total;
};

/**
    A stack order that puts the neutral series first, then the others.
    With `ranks`, the others go outward from the neutral one in data order:
    a positive series ranked nearer the start of the data stacks nearer
    zero, and a negative one ranked nearer the end does, so the stack reads
    along its axis in data order. Without `ranks`, they keep `order`'s
    order.
    @param order The chart's stack order.
    @param neutral The neutral series' stack keys.
    @param ranks Each stack key's place in the data (see `stackKeyRanks`).
*/
export function stackOrderNeutral(
  order: (series: StackSeries[]) => number[],
  neutral: Set<string>,
  ranks?: Map<string, number>,
): (series: StackSeries[]) => number[] {
  return series => {
    const isNeutral = (i: number) => neutral.has(series[i].key);
    const ranked = ranks
      ? series
          .map((s, i) => ({
            i,
            k: (ranks.get(s.key) ?? 0) * (seriesSum(s) < 0 ? -1 : 1),
          }))
          .sort((a, b) => a.k - b.k || a.i - b.i)
          .map(d => d.i)
      : order(series);
    return ranked.filter(isNeutral).concat(ranked.filter(i => !isNeutral(i)));
  };
}

/**
    A diverging stack offset centered on the neutral series: at each stack,
    the neutral segments (in stack order) span from minus half their total
    to plus half, then every other positive segment stacks up from the
    neutral's top and every negative one down from its bottom.
    @param neutral The neutral series' stack keys.
*/
export function stackOffsetNeutral(
  neutral: Set<string>,
): (series: StackSeries[], order: number[]) => void {
  return (series, order) => {
    const n = series.length;
    if (!n) return;
    const m = series[order[0]].length;
    for (let j = 0; j < m; ++j) {
      let half = 0;
      for (let k = 0; k < n; ++k) {
        const s = series[order[k]];
        if (neutral.has(s.key)) half += Math.abs(s[j][1] - s[j][0] || 0) / 2;
      }
      let yn = 0 - half;
      let yp = half;
      let yc = yn;
      for (let k = 0; k < n; ++k) {
        const s = series[order[k]];
        const d = s[j];
        const dy = d[1] - d[0] || 0;
        if (neutral.has(s.key)) {
          d[0] = yc;
          d[1] = yc += Math.abs(dy);
        } else if (dy > 0) {
          d[0] = yp;
          d[1] = yp += dy;
        } else if (dy < 0) {
          d[1] = yn;
          d[0] = yn += dy;
        } else {
          d[0] = d[1] = yp;
        }
      }
    }
  };
}
