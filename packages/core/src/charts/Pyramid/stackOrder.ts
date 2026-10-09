/**
    Pyramid's default stack order: sub-groups mirror each other across the
    center line, ranked by their combined size (largest nearest the center).
*/
import * as d3Shape from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import type {StackOrderFn} from "../Plot/stackHelpers.js";

type Series = d3Shape.Series<Record<string, unknown>, string>;

/** A formatted Plot row, as carried in each stacked point's `.data` group. */
type Row = {id?: unknown; data?: DataPoint; i?: number};

/** The formatted row behind a stack series (its key is that row's id). */
function seriesRow(series: Series): Row | undefined {
  for (let j = 0; j < series.length; j++) {
    const group = ((series[j] as unknown as {data?: Row[]}).data || []) as Row[];
    const row = group.find(g => g.id === series.key);
    if (row) return row;
  }
  return undefined;
}

/** The absolute sum of a series' (signed, pre-offset) values. */
function seriesMagnitude(series: Series): number {
  let total = 0;
  for (let j = 0; j < series.length; j++) total += Math.abs(+series[j][1] || 0);
  return total;
}

/**
    Builds the stack order. `subKey` names a row's sub-group: everything that
    identifies it below the side, so the same sub-group on both sides shares a
    key. Sub-groups are ranked by their total across both sides, largest
    first (stacked nearest the center); ties keep their first-seen order.
*/
export function pyramidStackOrder(subKey: (d: DataPoint, i: number) => string): StackOrderFn {
  const order = ((series: Series[]) => {
    const keys = series.map(s => {
      const row = seriesRow(s);
      return row && row.data ? subKey(row.data, row.i ?? 0) : `${s.key}`;
    });
    const totals = new Map<string, number>();
    keys.forEach((k, i) => totals.set(k, (totals.get(k) ?? 0) + seriesMagnitude(series[i])));
    const ranked = Array.from(totals.keys()).sort((a, b) => totals.get(b)! - totals.get(a)!);
    const rank = new Map(ranked.map((k, i) => [k, i]));
    return series.map((_, i) => i).sort((a, b) => rank.get(keys[a])! - rank.get(keys[b])! || a - b);
  }) as StackOrderFn;
  order.__d3plusStackOrder = true;
  return order;
}
