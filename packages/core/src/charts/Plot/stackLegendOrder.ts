/**
    A stacked Plot's legend order: its series in stacking order, from the
    baseline outward, so the default `"descending"` order lists the largest
    series first. The order is d3-stack's own (each drawn series' `index`),
    which the chart's `stackOrder` sets, whatever the `stackOffset` does
    with it: a diverging stack's negative series and a streamgraph's
    centered layers keep the order they were stacked in.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

/** Each series' summed fractional position across the stacks it appears in, and how many that is. */
export type StackPositions = Map<string, {total: number; count: number}>;

type Comparator = (a: DataPoint, b: DataPoint) => number;

/** A d3-stack series: its segments, and its place in the stacking order. */
type StackSeries = ArrayLike<ArrayLike<number>> & {index?: number};

/**
    Where each series sits in the drawn stacks. Each stack (one per discrete
    group) lists its non-empty segments in stacking order (each series'
    d3-stack `index`, else its place in `stackData`), and each segment adds
    its fractional position, `(rank + 0.5) / segments`, to its series. A
    stacked bar keys each segment as its own series, so this also averages
    bars that stack in different orders.
    @param stackData The d3-stack output, `[series][group] = [start, end]`.
    @param stackKeys Each series' stack key, in `stackData` order.
    @param seriesOf The legend series a stack key belongs to; undefined skips it.
*/
export function stackPositions(
  stackData: StackSeries[],
  stackKeys: unknown[],
  seriesOf: (key: string) => string | undefined,
): StackPositions {
  const positions: StackPositions = new Map();
  const groups = Math.max(0, ...stackData.map(s => s.length));
  for (let j = 0; j < groups; j++) {
    const segments: {series: string; order: number}[] = [];
    stackData.forEach((s, i) => {
      const segment = s[j];
      const series = seriesOf(`${stackKeys[i]}`);
      if (!segment || series === undefined) return;
      const [start, end] = [+segment[0], +segment[1]];
      if (!Number.isFinite(start) || !Number.isFinite(end) || start === end)
        return;
      segments.push({series, order: s.index ?? i});
    });
    segments.sort((a, b) => a.order - b.order);
    segments.forEach(({series}, rank) => {
      const entry = positions.get(series) ?? {total: 0, count: 0};
      entry.total += (rank + 0.5) / segments.length;
      entry.count += 1;
      positions.set(series, entry);
    });
  }
  return positions;
}

/**
    Combines the positions of several sets of stacks (such as each small
    multiple's) into one.
    @param all Each set's positions.
*/
export function poolStackPositions(all: StackPositions[]): StackPositions {
  const pooled: StackPositions = new Map();
  for (const positions of all) {
    positions.forEach(({total, count}, series) => {
      const entry = pooled.get(series) ?? {total: 0, count: 0};
      pooled.set(series, {
        total: entry.total + total,
        count: entry.count + count,
      });
    });
  }
  return pooled;
}

/**
    The series in reading order: by mean position, ties in the order the
    positions list them.
    @param positions Each series' stack positions.
*/
export function stackReadingOrder(positions: StackPositions): string[] {
  const mean = (s: string) => {
    const {total, count} = positions.get(s)!;
    return total / count;
  };
  return Array.from(positions.keys()).sort((a, b) => mean(a) - mean(b));
}

/**
    The drawn order with the series it left out (hidden or soloed away)
    kept in their previous place: each follows the series it followed
    before, so hiding a series doesn't move it in the legend.
    @param previous The order of the previous draw.
    @param drawn The order of this draw.
    @param keep The series still in the legend; others in `previous` drop out.
*/
export function mergeStackOrder(
  previous: string[],
  drawn: string[],
  keep: Set<string>,
): string[] {
  const out = drawn.slice();
  const placed = new Set(drawn);
  let anchor: string | undefined;
  for (const series of previous) {
    if (!placed.has(series)) {
      if (!keep.has(series)) continue;
      const at = anchor === undefined ? 0 : out.indexOf(anchor) + 1;
      out.splice(at, 0, series);
      placed.add(series);
    }
    anchor = series;
  }
  return out;
}

/**
    The ids of the Plot series a row or legend entry stands for: its groupBy
    values down to the drawn depth, joined like a Plot row's `id`. A legend
    entry merging several series (an array at some level) stands for each
    combination.
    @param viz The chart.
    @param d A row or legend entry.
    @param i Its index.
*/
export function plotSeriesIds(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string[] {
  let ids: string[][] = [[]];
  const depth = viz._drawDepth ?? 0;
  for (let level = 0; level <= depth; level++) {
    const groupBy = viz.schema.groupBy?.[level];
    if (typeof groupBy !== "function") break;
    const value = groupBy.bind(viz)(d, i);
    const values = (Array.isArray(value) ? value : [value])
      .map(v => `${v}`)
      .filter(Boolean);
    if (!values.length) continue;
    ids = ids.flatMap(path => values.map(v => [...path, v]));
  }
  return ids.map(path => path.join("_"));
}

/**
    Records a draw's stack positions as the legend's order (see
    `stackLegendSort`), keeping series the draw left out where they were.
    Undefined positions (an unstacked draw) clear it.
    @param viz The chart.
    @param positions The draw's stack positions.
*/
export function recordStackLegendOrder(
  viz: VizInstance,
  positions: StackPositions | undefined,
): void {
  if (!positions?.size) {
    viz._stackLegendOrder = undefined;
    return;
  }
  const keep = new Set(
    (viz._legendData ?? []).flatMap((d, i) => plotSeriesIds(viz, d, i)),
  );
  viz._stackLegendOrder = mergeStackOrder(
    viz._stackLegendOrder ?? [],
    stackReadingOrder(positions),
    keep,
  );
}

/**
    A stacked Plot's default legend comparator: entries in the order of
    `viz._stackLegendOrder` (an entry merging several series sits at their
    mean place), then the entries the stacks don't place, with ties broken
    by `fallback`. An unstacked chart sorts by `fallback` alone.
    @param viz The chart.
    @param fallback The comparator for everything the stack order doesn't settle.
*/
export function stackLegendSort(
  viz: VizInstance,
  fallback: Comparator,
): Comparator {
  let cached: string[] | undefined;
  let index = new Map<string, number>();
  const place = (d: DataPoint): number => {
    const ranks = plotSeriesIds(viz, d, 0)
      .map(id => index.get(id))
      .filter((r): r is number => r !== undefined);
    return ranks.length
      ? ranks.reduce((a, b) => a + b, 0) / ranks.length
      : Infinity;
  };
  return (a: DataPoint, b: DataPoint) => {
    const order = viz.schema.stacked ? viz._stackLegendOrder : undefined;
    if (order?.length) {
      if (order !== cached) {
        cached = order;
        index = new Map(order.map((id, rank) => [id, rank]));
      }
      const pa = place(a),
        pb = place(b);
      if (pa !== pb) return pa < pb ? -1 : 1;
    }
    return fallback(a, b);
  };
}
