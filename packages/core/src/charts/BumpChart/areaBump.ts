/**
    Area bump bands for BumpChart: with `size` set, each series draws as a
    band centered on its rank at every period, as thick as its `size` value,
    bending smoothly from one period's rank to the next.
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import type {D3Scale} from "../../utils/index.js";
import {genericEmit, type ShapeEmitter} from "../features/shapeEmit.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A band outline point: the row plus its pixel center and half thickness. */
interface BandDatum extends DataPoint {
  __center: number;
  __half: number;
}

/**
    A row's band value: its `size` value as a number, 0 when it has none or
    it is negative (a band can't be thinner than nothing).
    @param viz The chart.
    @param d The Plot row.
*/
export function bumpBandValue(viz: VizInstance, d: DataPoint): number {
  if (!viz._size) return 0;
  const value = Number(viz._size((d.data ?? d) as DataPoint, d.i as number));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
    The distance between neighboring ranks, in pixels: the smallest gap
    between the distinct positions, or `fallback` with fewer than two.
    @param positions The pixel position of each rank.
    @param fallback The step to use when there's only one rank.
*/
export function bumpRankStep(positions: number[], fallback: number): number {
  const sorted = Array.from(new Set(positions.filter(Number.isFinite))).sort(
    (a, b) => a - b,
  );
  let step = Infinity;
  for (let i = 1; i < sorted.length; i++)
    step = Math.min(step, sorted[i] - sorted[i - 1]);
  return Number.isFinite(step) && step > 0 ? step : Math.abs(fallback);
}

/**
    The band thickness for a value: linear from zero, the largest value
    filling its rank's slot less `bandPadding` (a share of the slot, kept
    between neighboring bands).
    @param max The largest value.
    @param step The distance between neighboring ranks, in pixels.
    @param bandPadding The share of each rank's slot left empty, 0 to 1.
*/
export function bumpBandThickness(
  max: number,
  step: number,
  bandPadding: number,
): (value: number) => number {
  const padding = Number.isFinite(bandPadding)
    ? Math.min(1, Math.max(0, bandPadding))
    : 0;
  const full = Math.max(0, step * (1 - padding));
  return value =>
    max > 0 && value > 0 ? (Math.min(value, max) / max) * full : 0;
}

/**
    The largest band value: the shared size scale's maximum in small
    multiples, else the largest among `rows`.
    @param viz The chart.
    @param rows The Plot rows drawn as bands.
*/
export function bumpBandMax(viz: VizInstance, rows: DataPoint[]): number {
  const shared = viz._plotFacetScales?.size as D3Scale | undefined;
  if (shared) {
    const top = Number((shared.domain() as number[])[1]);
    if (Number.isFinite(top) && top > 0) return top;
  }
  return rows.reduce((m, d) => Math.max(m, bumpBandValue(viz, d)), 0);
}

/** The rank axes' outer padding, in rank steps, that bands draw with. */
export const BAND_SCALE_PADDING = 0.5;

/**
    Pads the rank axes (`yConfig` and `y2Config`) half a rank on each end
    while bands are drawn, so the first and last ranks' bands have room to
    their full thickness, and takes the padding back off once they aren't.
    A `scalePadding` the user sets is left alone.
    @param viz The chart.
*/
export function bumpBandAxisPadding(viz: VizInstance): void {
  const set = (viz.ctx.bandAxisPadding ??= new Set<string>()) as Set<string>;
  for (const key of ["_yConfig", "_y2Config"] as const) {
    const config = (viz[key] ??= {}) as Record<string, unknown>;
    if (viz._size) {
      if (config.scalePadding === undefined) {
        config.scalePadding = BAND_SCALE_PADDING;
        set.add(key);
      }
    } else if (set.has(key)) {
      delete config.scalePadding;
      set.delete(key);
    }
  }
}

/**
    The name a band's `size` value goes by in tooltips: its key, else the
    translated "Value".
    @param viz The chart.
*/
export function bumpSizeName(viz: VizInstance): string {
  return viz._sizeKey ?? (viz.schema.translate("Value") as unknown as string);
}

/**
    A row's `size` value as a tooltip shows it (abbreviated, in the chart's
    locale), or undefined when it has none.
    @param viz The chart.
    @param d The user row.
    @param i Its index.
*/
export function bumpSizeText(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string | undefined {
  if (!viz._size || !d || typeof d !== "object") return undefined;
  const raw = viz._size(d, i) as unknown;
  const value = raw === null || raw === "" ? NaN : Number(raw);
  return Number.isFinite(value)
    ? formatAbbreviate(value, viz.schema.locale)
    : undefined;
}

/**
    The shared tooltip's value column while bands are drawn: titled by the
    `size` key, each series showing its `size` value at the hovered period.
    Undefined without a `size`, when the column shows the rank axis's.
    @param viz The chart.
*/
export function bumpSharedTooltipValue(
  viz: VizInstance,
): {title: string; value: (d: DataPoint, i: number) => string} | undefined {
  if (!viz._size) return undefined;
  return {
    title: bumpSizeName(viz),
    value: (d, i) => bumpSizeText(viz, d, i) ?? "",
  };
}

/**
    A single band's tooltip row: its `size` value under the `size` key. None
    without a `size`, or for a row without a value.
    @param viz The chart.
    @param d The hovered row.
    @param i Its index.
*/
export function bumpSizeTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  const text = bumpSizeText(viz, d, i);
  return text === undefined ? [] : [[bumpSizeName(viz), text]];
}

/** A hit-area twin's key without its `::hit` suffix. */
const baseKey = (key: string | number): string =>
  `${key}`.replace(/::hit$/, "");

/** Every path under `nodes`, by key. */
function pathsByKey(
  nodes: SceneNode[],
  out = new Map<string, string>(),
): Map<string, string> {
  for (const node of nodes) {
    if (node.type === "group") pathsByKey(node.children, out);
    else if (node.type === "path") out.set(`${node.key}`, node.d);
  }
  return out;
}

/** Sets each path's `enterD` to its collapsed twin's, so bands grow out of their center lines. */
function growFromCenter(nodes: SceneNode[], collapsed: Map<string, string>) {
  for (const node of nodes) {
    if (node.type === "group") growFromCenter(node.children, collapsed);
    else if (node.type === "path") {
      const d =
        collapsed.get(`${node.key}`) ?? collapsed.get(baseKey(node.key));
      if (d) node.enterD = d;
    }
  }
}

/**
    BumpChart's Area emitter: each row's band centered on its rank, as thick
    as its value (see `bumpBandThickness`), traced with a `"bumpX"` curve so
    it bends smoothly between periods. Bands grow out of their center lines.
*/
export const areaBumpEmit: ShapeEmitter = (ctx, key) => {
  const {viz, values, x, y, yRange} = ctx;
  const step = bumpRankStep(
    values.map(d => y(d.y, "y")),
    (yRange[yRange.length - 1] - yRange[0]) / 2,
  );
  const thickness = bumpBandThickness(
    bumpBandMax(viz, values),
    step,
    Number(viz.schema.bandPadding),
  );
  const outline: BandDatum[] = values.map(d => ({
    ...d,
    __center: y(d.y, "y"),
    __half: thickness(bumpBandValue(viz, d)) / 2,
  }));
  const pos = (d: DataPoint) => x(d.x, "x");
  const geometry = (half: (d: BandDatum) => number) => ({
    curve: "bumpX",
    x: pos,
    x0: pos,
    x1: null,
    y: (d: BandDatum) => d.__center,
    y0: (d: BandDatum) => d.__center + half(d),
    y1: (d: BandDatum) => d.__center - half(d),
  });
  const emit = (half: (d: BandDatum) => number) =>
    genericEmit(
      {
        ...ctx,
        values: outline,
        shapeConfig: {...ctx.shapeConfig, ...geometry(half)},
      },
      key,
    );
  const nodes = emit(d => d.__half);
  growFromCenter(nodes, pathsByKey(emit(() => 0)));
  return nodes;
};
