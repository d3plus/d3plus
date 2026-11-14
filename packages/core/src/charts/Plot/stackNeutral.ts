/**
    A diverging stack centered on a neutral series (`stackNeutral`), as a
    Likert chart draws it: each stack's neutral segments straddle zero, half
    on each side, and the other series stack outward from them by their
    place in the scale. Series listed before the neutral one go on the
    negative side, series after it on the positive side, each at its
    absolute value, so the data needs no negating.

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
export type StackSeries = ArrayLike<number[]> & {key: string};

/** A stacked Plot row: its stack key, source datum and index. */
interface NeutralRow {
  id?: unknown;
  data?: unknown;
  i?: unknown;
}

/** Which side of the neutral series a stack key sits on: -1 before it, 0 neutral, 1 after it. */
export type NeutralSide = -1 | 0 | 1;

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
    Each series' place in the data: the order the series first appear in
    (by their rows' indices), so data listed along the scale ("Strongly
    disagree" … "Strongly agree") ranks in that order.
    @param rows The stacked rows.
    @param seriesOf The series a row belongs to.
*/
export function seriesDataRanks<R extends NeutralRow>(
  rows: R[],
  seriesOf: (row: R) => string,
): Map<string, number> {
  const first = new Map<string, number>();
  for (const row of rows) {
    const series = seriesOf(row);
    const i = Number(row.i);
    if (!first.has(series) || i < first.get(series)!) first.set(series, i);
  }
  const order = [...first.keys()].sort((a, b) => first.get(a)! - first.get(b)!);
  return new Map(order.map((series, rank) => [series, rank]));
}

/**
    Each series' place in an explicit `stackOrder` list of series ids,
    those it leaves out following in their data order.
    @param list The `stackOrder` array.
    @param dataRanks Each series' place in the data (see `seriesDataRanks`).
*/
export function seriesListRanks(
  list: unknown[],
  dataRanks: Map<string, number>,
): Map<string, number> {
  const names = list.map(v => `${v}`);
  const ranks = new Map<string, number>();
  dataRanks.forEach((rank, series) => {
    const at = names.indexOf(series);
    ranks.set(series, at >= 0 ? at : names.length + rank);
  });
  return ranks;
}

/**
    Each series' place in a stack order: the first place any of its stack
    keys takes in `order`'s output.
    @param series The stack's series.
    @param order A d3-stack order.
    @param seriesOf Each stack key's series.
*/
export function seriesOrderRanks(
  series: StackSeries[],
  order: (series: StackSeries[]) => number[],
  seriesOf: Map<string, string>,
): Map<string, number> {
  const ranks = new Map<string, number>();
  order(series).forEach((index, place) => {
    const key = series[index].key;
    const name = seriesOf.get(key) ?? key;
    if (!ranks.has(name)) ranks.set(name, place);
  });
  return ranks;
}

/** A neutral-centered stack's order and offset, and the scale rank they found for each stack key. */
export interface NeutralStack {
  order: (series: StackSeries[]) => number[];
  offset: (series: StackSeries[], order: number[]) => void;
  /** Each stack key's place along the scale, filled once the order runs. */
  ranks: Map<string, number>;
}

/**
    A diverging stack centered on the neutral series. Every series takes
    its place along the scale from `fixed` (series ranks, such as their
    data order) or else from `base` (the chart's stack order): those before
    the neutral series stack on the negative side, those after it on the
    positive side, each at its absolute value, outward from the neutral
    segments in scale order (so the nearest answers sit next to it). At
    each stack, the neutral segments span from minus half their total to
    plus half.
    @param neutral The neutral series' stack keys.
    @param seriesOf Each stack key's series.
    @param base The chart's stack order, used without `fixed`.
    @param fixed Each series' place along the scale.
*/
export function neutralStack(
  neutral: Set<string>,
  seriesOf: Map<string, string>,
  base: (series: StackSeries[]) => number[],
  fixed?: Map<string, number>,
): NeutralStack {
  const ranks = new Map<string, number>();
  const sides = new Map<string, NeutralSide>();
  const order = (series: StackSeries[]): number[] => {
    const named = fixed ?? seriesOrderRanks(series, base, seriesOf);
    const rankOf = (key: string) =>
      named.get(seriesOf.get(key) ?? key) ?? Infinity;
    let pivot = Infinity;
    for (const s of series)
      if (neutral.has(s.key)) pivot = Math.min(pivot, rankOf(s.key));
    ranks.clear();
    sides.clear();
    for (const s of series) {
      const rank = rankOf(s.key);
      ranks.set(s.key, rank);
      sides.set(s.key, neutral.has(s.key) ? 0 : rank < pivot ? -1 : 1);
    }
    const indices = series.map((_, i) => i);
    const of = (side: NeutralSide) =>
      indices.filter(i => sides.get(series[i].key) === side);
    const byRank = (a: number, b: number) =>
      ranks.get(series[a].key)! - ranks.get(series[b].key)! || a - b;
    return [
      ...of(0).sort(byRank),
      ...of(-1).sort((a, b) => byRank(b, a)),
      ...of(1).sort(byRank),
    ];
  };
  const offset = (series: StackSeries[], order: number[]): void => {
    const n = series.length;
    if (!n) return;
    const m = series[order[0]].length;
    for (let j = 0; j < m; ++j) {
      let half = 0;
      for (const k of order) {
        const s = series[k];
        if (sides.get(s.key) === 0)
          half += Math.abs(s[j][1] - s[j][0] || 0) / 2;
      }
      let yn = 0 - half;
      let yp = half;
      let yc = yn;
      for (const k of order) {
        const s = series[k];
        const d = s[j];
        const dy = Math.abs(d[1] - d[0] || 0);
        const side = sides.get(s.key) ?? 1;
        if (side === 0) {
          d[0] = yc;
          d[1] = yc += dy;
        } else if (side < 0) {
          d[1] = yn;
          d[0] = yn -= dy;
        } else {
          d[0] = yp;
          d[1] = yp += dy;
        }
      }
    }
  };
  return {order, offset, ranks};
}
