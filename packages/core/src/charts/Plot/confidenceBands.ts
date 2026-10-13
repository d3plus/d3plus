/**
    Nested `confidence` bands: the setter's band list, each band's bounds on a
    row, and the opacity ramp that shades several bands from the widest
    (lightest) to the narrowest (darkest).
*/
import {interpolateNumber, piecewise} from "d3-interpolate";

import type {DataPoint} from "@d3plus/data";

import type {ConfidenceAccessor, VizInstance} from "../viz/vizTypes.js";
import {resolveConfidence} from "./confidenceConfig.js";

/** One `confidence` band: its lower and upper bound accessors, and an optional tooltip label. */
export interface ConfidenceBand {
  lower: ConfidenceAccessor | false;
  upper: ConfidenceAccessor | false;
  label?: string;
}

/** A band's finite bounds on one row. */
export interface BandBounds {
  label: string;
  lower?: number;
  upper?: number;
}

/** The composite opacities of the outermost and innermost band when `bandOpacity` is unset. */
export const DEFAULT_BAND_OPACITY: [number, number] = [0.15, 0.6];

const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

/** Whether a setter argument lists several bands rather than one `[lower, upper]` pair. */
function isBandList(value: unknown): value is unknown[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(v => Array.isArray(v) || isPlainObject(v))
  );
}

/** One band from a `[lower, upper, label?]` tuple or a `{lower, upper, label}` object. */
function resolveBand(value: unknown): ConfidenceBand | null {
  const [lower, upper, label] = Array.isArray(value)
    ? value
    : isPlainObject(value)
      ? [value.lower, value.upper, value.label]
      : [];
  const pair = resolveConfidence([lower, upper]);
  if (!pair) return null;
  const band: ConfidenceBand = {lower: pair[0], upper: pair[1]};
  if (typeof label === "string" || typeof label === "number")
    band.label = `${label}`;
  return band;
}

/**
    The bands a `confidence` setter argument describes: one band for a
    `[lower, upper]` pair (or a `{lower, upper, label}` object), or one per
    entry of an array of pairs/objects, outermost first. Bands without either
    bound are dropped; anything else (`false`, `RESET`) gives none.
    @param value The setter's argument.
*/
export function resolveConfidenceBands(value: unknown): ConfidenceBand[] {
  const list = isBandList(value) ? value : [value];
  return list.map(resolveBand).filter((b): b is ConfidenceBand => b !== null);
}

/**
    A chart's confidence bands, outermost first. A chart whose `_confidence`
    pair was set without a band list has that pair as its only band.
    @param viz The chart.
*/
export function confidenceBands(viz: VizInstance): ConfidenceBand[] {
  const pair = viz._confidence;
  if (!pair) return [];
  const bands = viz._confidenceBands;
  return bands && bands.length ? bands : [{lower: pair[0], upper: pair[1]}];
}

/**
    Each band's finite bounds on a source row, outermost first, labeled with
    the band's `label` or "Band 1", "Band 2", ….
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
*/
export function rowBands(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): BandBounds[] {
  if (!d) return [];
  return confidenceBands(viz).map((band, k) => {
    const out: BandBounds = {
      label: band.label ?? `${viz.schema.translate("Band")} ${k + 1}`,
    };
    const l = band.lower ? band.lower(d, i) : undefined;
    const u = band.upper ? band.upper(d, i) : undefined;
    if (finite(l)) out.lower = l;
    if (finite(u)) out.upper = u;
    return out;
  });
}

/**
    Each band's composite opacity, outermost first: what a band looks like
    where it is the innermost band drawn. A number applies to every band; an
    array is a ramp from the outermost band's opacity to the innermost's,
    sampled evenly (any values between its ends are passed through on the
    way).
    @param setting The `bandOpacity` setting.
    @param count How many bands are drawn.
*/
export function bandOpacityTargets(setting: unknown, count: number): number[] {
  if (count <= 0) return [];
  if (finite(setting)) return Array.from({length: count}, () => setting);
  const ramp =
    Array.isArray(setting) && setting.length && setting.every(finite)
      ? (setting as number[])
      : DEFAULT_BAND_OPACITY;
  if (ramp.length === 1) return Array.from({length: count}, () => ramp[0]);
  const at = piecewise(interpolateNumber, ramp);
  return Array.from({length: count}, (_, k) =>
    at(count === 1 ? 1 : k / (count - 1)),
  );
}

/**
    The opacity to draw each stacked band layer at so that, layered outermost
    first, each band's region shows its composite target opacity. A target
    lower than the band beneath it draws that layer fully transparent.
    @param targets Composite opacities, outermost first.
*/
export function layerOpacities(targets: number[]): number[] {
  let below = 0;
  return targets.map(t => {
    const target = Math.min(1, Math.max(0, t));
    const layer = below >= 1 ? 0 : Math.max(0, 1 - (1 - target) / (1 - below));
    below = 1 - (1 - below) * (1 - layer);
    return +layer.toFixed(6);
  });
}

/**
    A bound to draw, falling back to the line's own value when the row has
    no bound: a band pinches onto its line wherever a row lacks a bound.
    @param bound The row's bound.
    @param value The row's plotted value.
*/
export function boundOrValue(bound: unknown, value: unknown): unknown {
  return bound === undefined ||
    bound === null ||
    (typeof bound === "number" && Number.isNaN(bound))
    ? value
    : bound;
}

/**
    The bounds of every band after the first on plotted rows, for widening
    the value axis (the first band's bounds already widen it).
    @param viz The chart.
    @param rows Plotted rows, each wrapping its source row as `data`.
*/
export function extraBandValues(
  viz: VizInstance,
  rows: {data?: unknown; i?: unknown}[],
): number[] {
  const bands = confidenceBands(viz).slice(1);
  const out: number[] = [];
  for (const band of bands)
    for (const row of rows) {
      const d = row.data as DataPoint,
        i = row.i as number;
      for (const bound of [band.lower, band.upper]) {
        const v = bound ? bound(d, i) : undefined;
        if (finite(v)) out.push(v);
      }
    }
  return out;
}
