/**
    CyclePlot's mean lines: each series' mean across the cycles of one
    panel, drawn as a reference line across the panel.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {ReferenceLineConfig} from "../features/annotationTypes.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** One series' mean in a panel, with the first row it was taken from. */
export interface CycleMean {
  id: string;
  mean: number;
  row: DataPoint;
  index: number;
}

/** A row accessor. */
type RowFn = (d: DataPoint, i: number) => unknown;

/**
    The mean of each series' finite values, in the order the series first
    appear. Series without a finite value are left out.
    @param rows The panel's rows.
    @param id Each row's series.
    @param value Each row's value.
*/
export function cycleMeans(
  rows: DataPoint[],
  id: RowFn,
  value: RowFn,
): CycleMean[] {
  const sums = new Map<
    string,
    {sum: number; count: number; row: DataPoint; index: number}
  >();
  rows.forEach((d, i) => {
    const v = Number(value(d, i));
    if (!Number.isFinite(v)) return;
    const key = `${id(d, i)}`;
    const entry = sums.get(key);
    if (entry) {
      entry.sum += v;
      entry.count += 1;
    } else sums.set(key, {sum: v, count: 1, row: d, index: i});
  });
  return Array.from(sums, ([key, e]) => ({
    id: key,
    mean: e.sum / e.count,
    row: e.row,
    index: e.index,
  }));
}

/**
    The reference lines a panel draws at each series' mean (none when `mean`
    is off): in the chart's text color for a single series, else in each
    series' color, styled by `meanConfig`.
*/
export function cycleMeanLines(viz: VizInstance): Record<string, unknown>[] {
  if (viz.schema.mean === false || !viz._y) return [];
  const means = cycleMeans(
    viz._filteredData || [],
    viz._id as RowFn,
    viz._y as RowFn,
  );
  const config = (viz.schema.meanConfig ?? {}) as ReferenceLineConfig;
  const fill = viz.schema.shapeConfig.fill;
  const colored = means.length > 1;
  return means.map(m => ({
    strokeOpacity: 1,
    ...(colored
      ? {stroke: typeof fill === "function" ? `${fill(m.row, m.index)}` : fill}
      : {}),
    ...config,
    y: m.mean,
  }));
}
