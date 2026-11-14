/**
    How a Plot's marginal marks paint (`marginalConfig`): each kind's
    defaults, layered under the user's keys for every mark, for the kind,
    and for a box's part, then resolved for one mark.

    @module
*/
import type {Paint} from "@d3plus/render";

import type {
  MarginalConfig,
  MarginalMarkDatum,
  MarginalPaintConfig,
} from "../../utils/D3plusConfig.js";
import type {MarginalKind} from "./marginalStats.js";

/** A part of a box with keys of its own. */
export type MarginalBoxPart = "median" | "whisker" | "outlier";

/**
    Which paint keys a mark takes: all of them (a bar, a box, an outlier
    dot), its fill keys only (a density curve's fill), or its stroke keys
    only (a line).
*/
export type MarginalRole = "shape" | "fill" | "line";

/** One layer of paint keys, with an outlier dot's radius. */
type Layer = MarginalPaintConfig & {r?: unknown};

const FILL_KEYS = ["fill", "fillOpacity"] as const;
const STROKE_KEYS = [
  "stroke",
  "strokeWidth",
  "strokeOpacity",
  "strokeDasharray",
] as const;
const PAINT_KEYS = [...FILL_KEYS, ...STROKE_KEYS, "opacity"] as const;

const seriesColor = (d: MarginalMarkDatum): string => d.series.color;

/**
    Each kind's default paint, in its series' color: solid histogram bars;
    boxes at 0.35 fill opacity with a 1px stroke, and solid, unstroked
    outlier dots of radius 2; density curves filled at 0.3 opacity and
    outlined 1.5px wide.
*/
export function marginalPaintDefaults(): Required<
  Pick<MarginalConfig, MarginalKind>
> {
  return {
    histogram: {fill: seriesColor},
    box: {
      fill: seriesColor,
      fillOpacity: 0.35,
      stroke: seriesColor,
      strokeWidth: 1,
      outlier: {fillOpacity: 1, stroke: "none", r: 2},
    },
    density: {
      fill: seriesColor,
      fillOpacity: 0.3,
      stroke: seriesColor,
      strokeWidth: 1.5,
    },
  };
}

/**
    The layers a mark's paint resolves through, lowest first: its kind's
    defaults, the user's keys for every mark and for its kind, then its
    part's defaults (so an outlier dot stays solid however the boxes are
    filled) and the user's keys for its part.
    @param config The chart's `marginalConfig`.
    @param kind The mark's kind.
    @param part A box's part.
*/
export function marginalPaintLayers(
  config: MarginalConfig,
  kind: MarginalKind,
  part?: MarginalBoxPart,
): Layer[] {
  const defaults = marginalPaintDefaults()[kind] as Record<string, unknown>;
  const user = config[kind] as Record<string, unknown> | undefined;
  return [
    defaults,
    config,
    user,
    part ? defaults[part] : undefined,
    part && user ? user[part] : undefined,
  ].filter((layer): layer is Layer => !!layer && typeof layer === "object");
}

/** A `strokeDasharray` value as numbers: an array, or a space- or comma-separated string. */
function dashes(value: unknown): number[] | undefined {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.trim().split(/[\s,]+/)
      : [];
  const numbers = list.map(Number).filter(n => Number.isFinite(n));
  return numbers.length ? numbers : undefined;
}

/**
    A mark's paint (and an outlier dot's radius) from its layers, each key
    the last layer's that sets it, an accessor called with the mark and its
    series' index. A line takes only stroke keys and no fill, and a density
    curve's fill only fill keys.
    @param layers The mark's layers (see `marginalPaintLayers`).
    @param role Which keys the mark takes.
    @param d The mark.
    @param i Its series' index in its strip.
*/
export function resolveMarginalPaint(
  layers: Layer[],
  role: MarginalRole,
  d: MarginalMarkDatum,
  i: number,
): {paint: Paint; r?: number} {
  const value = (key: keyof Layer): unknown => {
    let v: unknown;
    for (const layer of layers) if (layer[key] !== undefined) v = layer[key];
    return typeof v === "function"
      ? (v as (d: MarginalMarkDatum, i: number) => unknown)(d, i)
      : v;
  };
  const keys = PAINT_KEYS.filter(key =>
    role === "line"
      ? !(FILL_KEYS as readonly string[]).includes(key)
      : role === "fill"
        ? !(STROKE_KEYS as readonly string[]).includes(key)
        : true,
  );
  const paint: Record<string, unknown> = {};
  for (const key of keys) {
    const v = key === "strokeDasharray" ? dashes(value(key)) : value(key);
    if (v !== undefined && v !== null) paint[key] = v;
  }
  if (role === "line") paint.fill = "none";
  const r = Number(value("r"));
  return {paint: paint as Paint, ...(r > 0 ? {r} : {})};
}
