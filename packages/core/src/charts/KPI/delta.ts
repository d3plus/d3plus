/**
    A KPI tile's change against its previous value: the change itself, the
    words it reads as, and whether it is good or bad news. Pure functions,
    except `deltaColors`, which reads the chart's theme.
*/

import {interpolateRgb} from "d3-interpolate";
import {colorContrast, colorDefaults} from "@d3plus/color";
import {formatAbbreviate} from "@d3plus/format";

import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** Which way a value moved: `"none"` when it held still. */
export type KpiDirection = "up" | "down" | "none";

/** Whether a change is good news, bad news, or neither. */
export type KpiTone = "good" | "bad" | "neutral";

/** What a tile's delta shows: the percent change, the absolute change, or both. */
export type KpiDeltaMode = "percent" | "absolute" | "both";

/** A value's change against its previous value. */
export interface KpiDelta {
  /** The value minus the previous value. */
  absolute: number;
  /** The change as a share of the previous value's size (`NaN` when the previous value is 0). */
  percent: number;
  direction: KpiDirection;
}

/** The glyph a delta leads with, by direction. */
export const DELTA_GLYPHS: Record<KpiDirection, string> = {
  up: "▲",
  down: "▼",
  none: "",
};

/**
    The change from `previous` to `value`, or undefined when either isn't a
    finite number.
*/
export function kpiDelta(
  value: number,
  previous: number,
): KpiDelta | undefined {
  if (!Number.isFinite(value) || !Number.isFinite(previous)) return undefined;
  const absolute = value - previous;
  return {
    absolute,
    percent: previous === 0 ? NaN : absolute / Math.abs(previous),
    direction: absolute > 0 ? "up" : absolute < 0 ? "down" : "none",
  };
}

/** Coerces a `deltaDirection` value: `"down"` when a fall is good news, else `"up"`. */
export function goodDirection(value: unknown): "up" | "down" {
  return value === "down" ? "down" : "up";
}

/**
    Whether a move is good news: a move in the `good` direction is good, the
    other way bad, and no move neutral.
*/
export function deltaTone(
  direction: KpiDirection,
  good: "up" | "down",
): KpiTone {
  if (direction === "none") return "neutral";
  return direction === good ? "good" : "bad";
}

/** Coerces a `delta` setting to a mode, or false to hide the delta. */
export function deltaMode(value: unknown): KpiDeltaMode | false {
  if (value === false) return false;
  return value === "absolute" || value === "both" ? value : "percent";
}

/** Formats a delta's parts: the value format for the absolute change, the percent format for the share. */
export interface DeltaFormats {
  value: (n: number) => string;
  percent: (share: number) => string;
}

/**
    A delta as text. On a tile (`signed` false) it leads with ▲ or ▼ and
    shows the change's size; in a tooltip (`signed` true) it shows a signed
    change instead ("+1.2K (+4.5%)"). The percent falls back to the absolute
    change when the previous value is 0.
*/
export function deltaText(
  delta: KpiDelta,
  mode: KpiDeltaMode,
  formats: DeltaFormats,
  signed = false,
): string {
  const sign = (n: number, text: string) =>
    signed && n > 0 ? `+${text}` : text;
  const absolute = sign(
    delta.absolute,
    formats.value(signed ? delta.absolute : Math.abs(delta.absolute)),
  );
  const percent = Number.isFinite(delta.percent)
    ? sign(
        delta.percent,
        formats.percent(signed ? delta.percent : Math.abs(delta.percent)),
      )
    : undefined;
  const body =
    mode === "absolute" || percent === undefined
      ? absolute
      : mode === "both"
        ? `${absolute} (${percent})`
        : percent;
  const glyph = signed ? "" : DELTA_GLYPHS[delta.direction];
  return glyph ? `${glyph} ${body}` : body;
}

/** A 0–1 share as a percentage in the chart's locale, such as "4.5%". */
export function kpiPercentFormat(viz: VizInstance): (share: number) => string {
  return (share: number) =>
    `${formatAbbreviate(share * 100, viz.schema.locale)}%`;
}

/** The colors a delta is drawn in, by tone. */
export interface DeltaColors {
  good: string;
  bad: string;
  neutral: string;
}

/**
    The delta colors for the chart's theme: `colorDefaults.on` for good news
    and `colorDefaults.off` for bad, lifted toward the text color on a dark
    background so they stay legible, and a muted text color for no change.
*/
export function deltaColors(viz: VizInstance): DeltaColors {
  const defaults = {...colorDefaults, ...viz.schema.colorDefaults};
  const background = chartBackground(viz);
  const text = backgroundInk(viz);
  const dark = colorContrast(background, defaults) !== defaults.dark;
  const lift = (c: string) => (dark ? interpolateRgb(c, text)(0.3) : c);
  return {
    good: lift(defaults.on),
    bad: lift(defaults.off),
    neutral: interpolateRgb(background, text)(0.6),
  };
}
