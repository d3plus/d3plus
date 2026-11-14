/**
    Marginal distributions (`marginals`): the setting, each continuous axis's
    value space, and the pure statistics a marginal strip draws from the
    plotted points: histogram bins, box summaries, and density curves, one
    series per group.

    @module
*/
import {bisectRight} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import {boxStats} from "../../shapes/boxStats.js";
import {binEdges, type ThresholdGenerator} from "../Histogram/binData.js";
import {densityCurves} from "../DensityPlot/densityCurves.js";

/** The distribution a marginal strip draws. */
export type MarginalKind = "histogram" | "box" | "density";

/** The strip drawn for each axis: x along the top, y along the right. */
export interface MarginalAxes {
  x: MarginalKind | false;
  y: MarginalKind | false;
}

const KINDS: MarginalKind[] = ["histogram", "box", "density"];

const toKind = (value: unknown): MarginalKind | false =>
  KINDS.includes(value as MarginalKind) ? (value as MarginalKind) : false;

/**
    The strips a `marginals` setting asks for: a kind for both axes (`true`
    is `"histogram"`), or `{x, y}` naming each axis's kind. Anything else
    draws none.
    @param value The `marginals` setting.
*/
export function resolveMarginals(value: unknown): MarginalAxes {
  if (value && typeof value === "object") {
    const {x, y} = value as {x?: unknown; y?: unknown};
    return {x: toKind(x), y: toKind(y)};
  }
  const kind = toKind(value === true ? "histogram" : value);
  return {x: kind, y: kind};
}

/**
    How an axis's values map to the space its marginal bins and smooths in,
    and back: a log axis works in powers of ten, so its bins draw evenly
    wide; a time axis in milliseconds.
*/
export interface MarginalScale {
  /** A plotted value in marginal space; NaN when the axis can't place it. */
  to: (value: unknown) => number;
  /** A marginal-space value as the axis places it. */
  from: (value: number) => unknown;
}

/**
    The marginal space of an axis drawn with scale `type` (`"linear"`,
    `"log"`, `"time"`, …), or null for a category axis, which has no
    distribution to draw.
    @param type The axis's scale type.
*/
export function marginalScale(type: string): MarginalScale | null {
  const t = type.toLowerCase();
  if (t === "point" || t === "band" || t === "ordinal") return null;
  if (t === "log")
    return {
      to: v => {
        const n = Number(v);
        return n > 0 ? Math.log10(n) : NaN;
      },
      from: n => 10 ** n,
    };
  if (t === "time")
    return {
      to: v => (v instanceof Date ? v.getTime() : Number(v)),
      from: n => new Date(n),
    };
  return {to: v => (typeof v === "number" ? v : NaN), from: n => n};
}

/** One plotted point on one axis, in that axis's marginal space. */
export interface MarginalObservation {
  value: number;
  /** The key of the series it belongs to. */
  group: string;
  row: DataPoint;
}

/** The points of one series in one histogram bin, stacked on the series before it. */
export interface MarginalBin {
  group: string;
  /** The bin's start and end, in marginal space. */
  x0: number;
  x1: number;
  count: number;
  /** The count of the series stacked below it in this bin. */
  y0: number;
  rows: DataPoint[];
}

/** A marginal histogram: its bins, and the tallest bin's total count. */
export interface MarginalHistogram {
  bins: MarginalBin[];
  max: number;
}

/** `[lo, hi]` in ascending order. */
const ascending = ([a, b]: [number, number]): [number, number] =>
  a <= b ? [a, b] : [b, a];

/** The observations with a value inside `[lo, hi]`. */
const within = (
  observations: MarginalObservation[],
  [lo, hi]: [number, number],
): MarginalObservation[] =>
  observations.filter(
    o => Number.isFinite(o.value) && o.value >= lo && o.value <= hi,
  );

/**
    Bins the observations inside the axis's `domain`, with edges every series
    shares (see Histogram's `binEdges`): one bin per series per non-empty
    bin, each series stacked on those before it in `groups` order.
    @param observations The points, in marginal space.
    @param domain The axis's domain, in marginal space.
    @param groups The series keys, in stacking order.
    @param thresholds A bin count, interior edges, or a threshold generator (Sturges' rule by default).
*/
export function binMarginal(
  observations: MarginalObservation[],
  domain: [number, number],
  groups: string[],
  thresholds?: number | number[] | ThresholdGenerator,
): MarginalHistogram {
  const [lo, hi] = ascending(domain);
  const inside = within(observations, [lo, hi]);
  if (!inside.length || !(hi > lo)) return {bins: [], max: 0};
  const edges = binEdges(
    inside.map(o => o.value),
    {domain: [lo, hi], thresholds},
  );
  const count = edges.length - 1;
  const members = new Map<string, DataPoint[][]>();
  for (const o of inside) {
    const k = Math.min(count - 1, Math.max(0, bisectRight(edges, o.value) - 1));
    let lists = members.get(o.group);
    if (!lists) members.set(o.group, (lists = edges.slice(1).map(() => [])));
    lists[k].push(o.row);
  }
  const bins: MarginalBin[] = [];
  let max = 0;
  for (let k = 0; k < count; k++) {
    let y0 = 0;
    for (const group of groups) {
      const rows = members.get(group)?.[k];
      if (!rows || !rows.length) continue;
      bins.push({
        group,
        x0: edges[k],
        x1: edges[k + 1],
        count: rows.length,
        y0,
        rows,
      });
      y0 += rows.length;
    }
    max = Math.max(max, y0);
  }
  return {bins, max};
}

/** A series' box summary, in marginal space. */
export interface MarginalBox {
  group: string;
  rows: DataPoint[];
  min: number;
  first: number;
  median: number;
  third: number;
  max: number;
  /** The whisker ends, 1.5 interquartile ranges past the quartiles at most. */
  lowerLimit: number;
  upperLimit: number;
  /** The points past the whiskers. */
  outliers: MarginalObservation[];
}

/** The observations of each series, in `groups` order, skipping those with none. */
function bySeries(
  observations: MarginalObservation[],
  groups: string[],
): [string, MarginalObservation[]][] {
  const out = new Map<string, MarginalObservation[]>(groups.map(g => [g, []]));
  for (const o of observations) out.get(o.group)?.push(o);
  return [...out].filter(([, list]) => list.length);
}

/**
    Each series' box summary over the observations inside the axis's
    `domain`: its quartiles and its Tukey whiskers, as BoxWhisker draws them
    (see `boxStats`), and the points past those.
    @param observations The points, in marginal space.
    @param domain The axis's domain, in marginal space.
    @param groups The series keys, in drawing order.
*/
export function boxMarginal(
  observations: MarginalObservation[],
  domain: [number, number],
  groups: string[],
): MarginalBox[] {
  const inside = within(observations, ascending(domain));
  return bySeries(inside, groups).map(([group, list]) => {
    const values = list.map(o => o.value).sort((a, b) => a - b);
    const stats = boxStats(values, ["tukey", "tukey"]);
    const lowerLimit = stats.lowerLimit as number,
      upperLimit = stats.upperLimit as number;
    return {
      group,
      rows: list.map(o => o.row),
      min: values[0],
      first: stats.first as number,
      median: stats.median as number,
      third: stats.third as number,
      max: values[values.length - 1],
      lowerLimit,
      upperLimit,
      outliers: list.filter(o => o.value < lowerLimit || o.value > upperLimit),
    };
  });
}

/** A series' density curve, in marginal space. */
export interface MarginalCurve {
  group: string;
  rows: DataPoint[];
  /** `[value, density]` pairs across the axis, each density scaled by the series' share of the points. */
  curve: [number, number][];
}

/** Marginal density curves and their highest density. */
export interface MarginalDensity {
  curves: MarginalCurve[];
  max: number;
}

/** How many values a marginal density curve is evaluated at. */
export const DENSITY_POINTS = 64;

/**
    Each series' kernel density estimate across the axis's `domain` (see
    DensityPlot's `densityCurves`): every curve smoothed with one bandwidth
    and evaluated on one grid, its densities scaled by the series' share of
    the points, so the curves add up to the density of every point together.
    @param observations The points, in marginal space.
    @param domain The axis's domain, in marginal space.
    @param groups The series keys, in drawing order.
*/
export function densityMarginal(
  observations: MarginalObservation[],
  domain: [number, number],
  groups: string[],
): MarginalDensity {
  const [lo, hi] = ascending(domain);
  const inside = within(observations, [lo, hi]);
  if (!inside.length || !(hi > lo)) return {curves: [], max: 0};
  const {groups: estimates} = densityCurves(
    inside.map(o => o.row),
    {
      value: (_d, i) => inside[i].value,
      key: (_d, i) => inside[i].group,
      density: {extent: [lo, hi], points: DENSITY_POINTS},
    },
  );
  const total = inside.length;
  const order = new Map(groups.map((g, i) => [g, i]));
  let max = 0;
  const curves = estimates
    .filter(e => order.has(e.key))
    .sort((a, b) => order.get(a.key)! - order.get(b.key)!)
    .map(e => {
      const share = e.summary.n / total;
      const curve = e.summary.curve.map(([v, d]): [number, number] => [
        v,
        d * share,
      ]);
      for (const [, d] of curve) if (d > max) max = d;
      return {group: e.key, rows: e.summary.rows, curve};
    });
  return {curves, max};
}
