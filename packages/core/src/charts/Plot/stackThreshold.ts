/**
    `threshold` on stacked Plot charts: the series whose summed value, over
    every position on the discrete axis, is under `threshold` of the chart's
    total fold into one bucket series. Membership is decided once for the
    whole chart, so a series is in the bucket at every position or at none.
*/
import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

type Accessor = (d: DataPoint, i: number) => unknown;
type Aggs = Parameters<typeof merge>[1];

/** What `stackThresholdBucket` and `foldStackRows` read off the chart. */
export interface StackThresholdInputs {
  /** Per-key aggregations `merge` applies when folding rows. */
  aggs?: Aggs;
  /** The series a row belongs to. */
  id: Accessor;
  /** Accessors for a row's position: the discrete axis, and the time. */
  position: Accessor[];
  /** Returns the threshold, a 0..1 share of the total, for the rows. */
  threshold: (rows: DataPoint[]) => number;
  /** The value a row adds to its series' total. */
  value: Accessor;
}

/** The series one bucket folds together. */
export interface StackThresholdBucket {
  /** The series keys (`${id}`) the bucket holds. */
  members: Set<string>;
  /** The threshold the bucket was cut at, a 0..1 share. */
  percent: number;
  /** The series-level fields every bucket row carries (see `seriesIdentity`). */
  identity: DataPoint;
}

/** A value's comparison key: arrays by their items, Dates by their time. */
const valueKey = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(valueKey).join("\u0001")
    : v instanceof Date
      ? +v
      : v;

/**
    The fields that name a series rather than a point on it, merged over the
    bucket's series: every non-numeric field that holds one value along each
    series and is not a row's position. Every bucket row carries them, so the
    bucket keeps one id, label, and color at every position, whichever of
    its series have a row there.
*/
export function seriesIdentity(
  series: DataPoint[][],
  position: Accessor[],
  aggs?: Aggs,
): DataPoint {
  const keys = new Set<string>();
  series.forEach(rows =>
    rows.forEach(d => Object.keys(d).forEach(k => keys.add(k))),
  );
  const identityKeys = Array.from(keys).filter(k =>
    series.every(rows => {
      let first: unknown;
      return rows.every((d, i) => {
        const v = d[k];
        if (typeof v === "number") return false;
        const key = valueKey(v);
        if (position.some(p => valueKey(p(d, i)) === key)) return false;
        if (i === 0) first = key;
        return key === first;
      });
    }),
  );
  const reps = series
    .filter(rows => rows.length)
    .map(rows => {
      const rep: DataPoint = {};
      for (const k of identityKeys) rep[k] = rows[0][k];
      return rep;
    });
  return merge(reps, aggs) as unknown as DataPoint;
}

/**
    The bucket for `rows`: the series whose summed absolute `value` is under
    `threshold` of the summed absolute value of every row. Null when the
    threshold is off (0 or not a number) or no series falls under it.
*/
export function stackThresholdBucket(
  rows: DataPoint[],
  inputs: StackThresholdInputs,
): StackThresholdBucket | null {
  const {aggs, id, position, threshold, value} = inputs;
  const percent = Math.min(1, Math.max(0, +threshold(rows)));
  if (!(percent > 0)) return null;

  const totals = new Map<string, number>();
  const series = new Map<string, DataPoint[]>();
  let grand = 0;
  rows.forEach((d, i) => {
    const key = `${id(d, i)}`;
    const v = Math.abs(+(value(d, i) as number)) || 0;
    totals.set(key, (totals.get(key) ?? 0) + v);
    const list = series.get(key);
    if (list) list.push(d);
    else series.set(key, [d]);
    grand += v;
  });
  if (!(grand > 0)) return null;

  const members = new Set<string>();
  totals.forEach((total, key) => {
    if (total < percent * grand) members.add(key);
  });
  if (!members.size) return null;

  const identity = seriesIdentity(
    Array.from(members, key => series.get(key)!),
    position,
    aggs,
  );
  return {members, percent, identity};
}

/**
    Replaces the rows of the bucket's series with one bucket row per
    position: their merged values at that position, the bucket's
    series-level fields, and the `_isAggregation` / `_threshold` flags the
    threshold label reads. The bucket rows come after every kept row.
*/
export function foldStackRows(
  rows: DataPoint[],
  bucket: StackThresholdBucket,
  inputs: Pick<StackThresholdInputs, "aggs" | "id" | "position">,
): DataPoint[] {
  const {aggs, id, position} = inputs;
  const kept: DataPoint[] = [];
  const folded = new Map<string, DataPoint[]>();
  rows.forEach((d, i) => {
    if (!bucket.members.has(`${id(d, i)}`)) {
      kept.push(d);
      return;
    }
    const at = position.map(p => `${valueKey(p(d, i))}`).join("\u0002");
    const list = folded.get(at);
    if (list) list.push(d);
    else folded.set(at, [d]);
  });
  if (!folded.size) return rows;
  const merged = Array.from(folded.values(), group => {
    const row = merge(group, aggs) as unknown as DataPoint;
    // The fields holding the position keep it, rather than summing it.
    const first = group[0];
    const at = position.map(p => valueKey(p(first, 0)));
    for (const k of Object.keys(first)) {
      if (at.some(v => group.every(d => valueKey(d[k]) === v)))
        row[k] = first[k];
    }
    return {
      ...row,
      ...bucket.identity,
      _isAggregation: true,
      _threshold: bucket.percent,
    } as DataPoint;
  });
  return kept.concat(merged);
}

/** The bucket inputs a stacked Plot reads: its series, positions, and stacked value. */
export function plotStackInputs(viz: VizInstance): StackThresholdInputs {
  const discrete = viz.schema.discrete === "y" ? "y" : "x";
  const opp = discrete === "x" ? "y" : "x";
  const position: Accessor[] = [viz[`_${discrete}`] as Accessor];
  if (viz.schema.time) position.push(viz.schema.time as Accessor);
  return {
    aggs: viz.schema.aggs as Aggs,
    id: viz._id as Accessor,
    position,
    threshold: viz.schema.threshold as (rows: DataPoint[]) => number,
    value: (viz.schema.thresholdKey ?? viz[`_${opp}`]) as Accessor,
  };
}

/**
    A stacked Plot's `threshold`: folds `data` (the drawn rows) into a bucket
    series, deciding the bucket's series from `all` (every row, legend-hidden
    ones included, so hiding a series doesn't move others in or out of the
    bucket). Returns `data` unchanged when the chart isn't stacked.
*/
export function plotStackThreshold(
  viz: VizInstance,
  data: DataPoint[],
  all: DataPoint[] = data,
): DataPoint[] {
  if (!viz.schema.stacked) return data;
  const inputs = plotStackInputs(viz);
  const bucket = stackThresholdBucket(all, inputs);
  return bucket ? foldStackRows(data, bucket, inputs) : data;
}

/**
    The legend rows of a stacked Plot with its threshold bucket folded into
    one entry, so the legend shows the bucket instead of its series.
*/
export function plotStackThresholdLegend(
  viz: VizInstance,
  legendData: DataPoint[],
): DataPoint[] {
  if (!viz.schema.stacked || !legendData.length) return legendData;
  const inputs = plotStackInputs(viz);
  const bucket = stackThresholdBucket(legendData, inputs);
  return bucket
    ? foldStackRows(legendData, bucket, {...inputs, position: []})
    : legendData;
}
