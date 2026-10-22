/**
    The colors and fonts a Bullet's static parts are drawn in: read from
    `axisConfig` when set, else derived from the chart's background so the
    bullets hold up on light and dark themes.
*/

import {interpolateRgb} from "d3-interpolate";
import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {fontFamilyStringify} from "@d3plus/text";

import {resolveAccessor} from "../features/emitHelpers.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type {GaugeBand} from "../Gauge/gaugeGeometry.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {bandShades} from "./bulletGeometry.js";

/** Resolved colors and fonts for a Bullet's bands, axes, and labels. */
export interface BulletStyle {
  background: string;
  /** Mixes the background (0) toward the text color (1). */
  mix: (t: number) => string;
  /** The empty track behind the bands. */
  trackFill: string;
  tickStroke: string;
  tickStrokeWidth: number;
  fontColor: string;
  /** The sub-label's quieter color. */
  mutedColor: string;
  fontFamily: string;
  tickFontSize: number;
  tickFormat: (value: number) => string;
}

interface AxisShapeConfig {
  fill?: unknown;
  stroke?: unknown;
  strokeWidth?: unknown;
  labelConfig?: {fontColor?: unknown; fontFamily?: unknown; fontSize?: unknown};
}

/** The default tick label size, in pixels. */
export const TICK_FONT_SIZE = 10;

/** Resolves the bullets' `axisConfig` styling, calling accessors with the first row. */
export function bulletStyle(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): BulletStyle {
  const sc =
    ((viz.schema.axisConfig ?? {}) as {shapeConfig?: AxisShapeConfig})
      .shapeConfig ?? {};
  const label = sc.labelConfig ?? {};
  const background = chartBackground(viz);
  const text = colorContrast(background, viz.schema.colorDefaults);
  const mix = interpolateRgb(background, text);
  const fontColor = resolveAccessor<string>(label.fontColor, d, i) ?? text;
  const family =
    resolveAccessor<string | string[]>(label.fontFamily, d, i) ??
    viz.schema.fontFamily;
  const size = resolveAccessor<number>(label.fontSize, d, i);
  const tickFormat = viz.schema.tickFormat as (v: number) => string;
  return {
    background,
    mix,
    trackFill: resolveAccessor<string>(sc.fill, d, i) ?? mix(0.08),
    tickStroke: resolveAccessor<string>(sc.stroke, d, i) ?? mix(0.55),
    tickStrokeWidth: resolveAccessor<number>(sc.strokeWidth, d, i) ?? 1,
    fontColor,
    mutedColor: interpolateRgb(background, fontColor)(0.68),
    fontFamily: fontFamilyStringify(family),
    tickFontSize: typeof size === "number" && size > 0 ? size : TICK_FONT_SIZE,
    tickFormat: v => `${tickFormat(v)}`,
  };
}

/**
    Gives every band without a `color` its default shade: the first band
    contrasts most with the background and each later one steps lighter.
*/
export function shadeBands(
  bands: GaugeBand[],
  mix: (t: number) => string,
): GaugeBand[] {
  const shades = bandShades(bands.length);
  return bands.map((b, i) => (b.color ? b : {...b, color: mix(shades[i])}));
}
