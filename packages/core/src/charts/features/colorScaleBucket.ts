import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

interface BucketCtx {
  /** The colorScale's own data (one row per merged group). */
  rows: DataPoint[];
  /** Maps a datum to the bucket color its ColorScale value falls in. */
  colorOf: (d: DataPoint, i: number) => unknown;
}

/**
    Resolves the colorScale's data + a value→bucket-color mapper from a viz, or
    null when there's no usable colorScale. Shared by the share and hover
    helpers so they bucket data identically.
*/
function bucketCtx(viz: VizInstance): BucketCtx | null {
  const cs = viz._colorScaleClass as unknown as
    | {_data?: DataPoint[]; _colorScale?: (v: unknown) => unknown}
    | undefined;
  const value = viz.schema.colorScale as
    | ((d: DataPoint, i: number) => unknown)
    | undefined;
  if (!cs || typeof cs._colorScale !== "function" || !value) return null;
  const colorScale = cs._colorScale;
  const colorOf = (d: DataPoint, i: number): unknown => {
    // Unwrap label/shape wrappers to the source row before reading the value.
    let row = d as DataPoint & {
      __d3plus__?: boolean;
      data?: DataPoint;
      _isColorScaleBucket?: boolean;
      color?: unknown;
    };
    while (row && row.__d3plus__ && row.data) row = row.data as typeof row;
    // A bucket datum (swatch/label) already IS a bucket — use its color. A
    // data row maps through the scale. Handling both lets one predicate match
    // chart marks (by value) AND swatches (by color), so e.g. the mouseleave
    // guard `_hover(bucketDatum)` resolves correctly.
    if (row && row._isColorScaleBucket) return row.color;
    return colorScale(value(row, i));
  };
  return {rows: Array.isArray(cs._data) ? cs._data : [], colorOf};
}

/**
    Sums the share (size fraction of the grand total) of every datum whose
    ColorScale value falls in `bucketColor`'s range, so a chart tooltip
    (Treemap, Pie) can report the aggregate share of a hovered colorScale
    swatch instead of a blank row.

    Computed at hover time from the colorScale's own data + threshold scale —
    NOT from a pre-stamped `share` — because the colorScale lays out before
    the chart's layout stage writes `share`, so no per-row share exists yet
    when the swatch is built. `sizeFn` is the chart's size metric (Treemap's
    `sum`, Pie's `value`). Returns null when there's no colorScale to read or
    the total is zero.
*/
export function colorScaleBucketShare(
  viz: VizInstance,
  bucketColor: unknown,
  sizeFn: (d: DataPoint, i: number) => number,
): number | null {
  const ctx = bucketCtx(viz);
  if (!ctx) return null;

  let total = 0;
  let bucket = 0;
  ctx.rows.forEach((d, i) => {
    const size = sizeFn(d, i);
    if (!Number.isFinite(size)) return;
    total += size;
    if (ctx.colorOf(d, i) === bucketColor) bucket += size;
  });
  return total ? bucket / total : null;
}

/**
    Unwraps a scene/handler datum to its colorScale-bucket source, or null when
    it isn't a bucket. A swatch (or its label) reaches a handler wrapped one or
    more levels deep (label → shape-row → bucket), so walk the `__d3plus__`
    chain before reading `_isColorScaleBucket`. Shared by `mouseenter` (to build
    the highlight predicate) and the chart `mousemove.shape` overrides (to skip
    their row/column hover so the bucket highlight isn't clobbered on move).
*/
export function colorScaleBucketOf(
  d: unknown,
): (DataPoint & {color?: unknown}) | null {
  let bucket = d as
    | (DataPoint & {__d3plus__?: boolean; data?: DataPoint; _isColorScaleBucket?: boolean; color?: unknown})
    | undefined;
  while (bucket && bucket.__d3plus__ && bucket.data)
    bucket = bucket.data as typeof bucket;
  return bucket && bucket._isColorScaleBucket ? bucket : null;
}

/**
    Predicate matching every datum whose ColorScale value falls in
    `bucketColor`'s range — used to highlight the data shapes when a colorScale
    swatch is hovered (it has no groupBy id to match on, unlike a normal
    legend). Returns null when there's no colorScale to read.
*/
export function colorScaleBucketPredicate(
  viz: VizInstance,
  bucketColor: unknown,
): ((d: DataPoint, i: number) => boolean) | null {
  const ctx = bucketCtx(viz);
  if (!ctx) return null;
  return (d: DataPoint, i: number) => ctx.colorOf(d, i) === bucketColor;
}

/**
    The set of bucket colors that contain at least one datum satisfying
    `predicate` — i.e. the swatches that should stay bright while the rest dim.
    Lets the colorScale self-dim consistently for any hover source: hovering a
    swatch lights only that color; hovering a data shape (or legend item)
    lights the swatch whose range contains it. Returns null without a
    colorScale.
*/
export function activeBucketColors(
  viz: VizInstance,
  predicate: (d: DataPoint, i: number) => boolean,
): Set<unknown> | null {
  const ctx = bucketCtx(viz);
  if (!ctx) return null;
  const colors = new Set<unknown>();
  ctx.rows.forEach((d, i) => {
    if (predicate(d, i)) colors.add(ctx.colorOf(d, i));
  });
  return colors;
}
