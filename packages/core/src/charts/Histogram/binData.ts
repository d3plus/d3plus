/**
    Pure binning for Histogram: raw observation rows → one row per group per
    bin. Every group in a panel shares one set of bin edges.
*/
import {bin, extent, groups, range, thresholdSturges} from "d3-array";

import type {DataPoint} from "@d3plus/data";

/** A d3-array threshold generator: `(values, min, max) → count | edges`. */
export type ThresholdGenerator = (values: ArrayLike<number>, min: number, max: number) => number | number[];

/** How bin heights are normalized. */
export type BinNormalize = "count" | "density" | "relative";

export interface BinOptions {
  /** Numeric observation accessor. */
  value: (d: DataPoint, i: number) => unknown;
  /** Series key for a row; rows sharing a key are binned together. */
  group?: (d: DataPoint, i: number) => string;
  /**
      Panel key for a row (a small-multiple panel). Each panel is binned and
      normalized on its own rows, with edges of its own unless `sharedEdges`.
  */
  panel?: (d: DataPoint, i: number) => string;
  /** Whether every panel bins along the same edges, resolved across all rows. */
  sharedEdges?: boolean;
  /** Bin count, explicit edges, or a threshold generator. */
  thresholds?: number | number[] | ThresholdGenerator;
  /** `[min, max]` to bin across; defaults to the values' extent. */
  domain?: [number, number];
  /** Uniform bin width; overrides `thresholds`. */
  width?: number;
  /** `"count"` (default), `"density"` (area sums to 1), or `"relative"` (heights sum to 1). */
  normalize?: BinNormalize;
}

/** One bin of one group. Carries the group's first row's fields. */
export interface BinRow extends DataPoint {
  /** Bin start (inclusive). */
  x0: number;
  /** Bin end (exclusive, except for the last bin). */
  x1: number;
  /** Bin midpoint. */
  x: number;
  /** Observations in this group's bin. */
  count: number;
  /** The normalized height. */
  y: number;
}

/** Evenly spaced edges of `width` covering `[lo, hi]`, anchored at multiples of `width`. */
function widthEdges(lo: number, hi: number, width: number): number[] {
  const start = Math.floor(lo / width) * width;
  const end = Math.max(Math.ceil(hi / width) * width, start + width);
  return range(0, Math.round((end - start) / width) + 1).map(i => start + i * width);
}

/** An observation: its row, the row's index, and its numeric value. */
interface Observation {
  d: DataPoint;
  i: number;
  v: number;
}

/** The bin edges `options` resolve to over `values`. */
function binEdges(values: number[], options: BinOptions): number[] {
  let [lo, hi] = options.domain ?? (extent(values) as [number, number]);
  // An explicit domain disables d3's nice rounding of the extent.
  let fixedDomain = Boolean(options.domain);
  // A single repeated value still gets a bin with non-zero width.
  if (lo === hi) {
    [lo, hi] = [lo - 0.5, hi + 0.5];
    fixedDomain = true;
  }
  if (options.width && options.width > 0) return widthEdges(lo, hi, options.width);

  let generator = bin();
  if (fixedDomain) generator = generator.domain([lo, hi]);
  const t = options.thresholds ?? thresholdSturges;
  const bins = generator.thresholds(t as never)(values);
  return [bins[0].x0!, ...bins.map(b => b.x1!)];
}

/** One row per group per bin for one panel's observations, normalized against the panel's total. */
function binPanel(observations: Observation[], edges: number[], options: BinOptions): BinRow[] {
  const {group = () => "", normalize = "count"} = options;
  const perGroup = bin()
    .domain([edges[0], edges[edges.length - 1]])
    .thresholds(edges.slice(1, -1));
  const total = observations.length;
  const out: BinRow[] = [];
  for (const [, members] of groups(observations, o => group(o.d, o.i))) {
    const binned = perGroup(members.map(o => o.v));
    const first = members[0].d;
    binned.forEach(b => {
      const x0 = b.x0!, x1 = b.x1!;
      const count = b.length;
      const y =
        normalize === "density"
          ? count / (total * (x1 - x0))
          : normalize === "relative"
            ? count / total
            : count;
      out.push({...first, x0, x1, x: (x0 + x1) / 2, count, y});
    });
  }
  return out;
}

/**
    Bins `rows` by `options.value`. Non-finite values are dropped. Every group
    gets a row for every bin of its panel (empty bins included, so stacks
    line up).
*/
export default function binData(rows: DataPoint[], options: BinOptions): BinRow[] {
  const {value, panel = () => ""} = options;

  const observations: Observation[] = rows
    .map((d, i) => ({d, i, v: Number(value(d, i))}))
    .filter(o => o.d && Number.isFinite(o.v));
  if (!observations.length) return [];

  const shared = options.sharedEdges ? binEdges(observations.map(o => o.v), options) : undefined;
  return groups(observations, o => panel(o.d, o.i)).flatMap(([, members]) =>
    binPanel(members, shared ?? binEdges(members.map(o => o.v), options), options),
  );
}
