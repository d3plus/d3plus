/**
    A Plot's value colors: lines, areas, bars, and points colored by where
    they sit on the value axis rather than by series. `valueColors` either
    splits the axis into bands at its `values` (`type: "threshold"`), each
    band in one of its `colors`, or blends its `colors` across the axis
    (`type: "gradient"`).

    A line or area takes a gradient along the value axis, in its own
    coordinates, so its color changes exactly where it crosses each
    threshold (hard stops) or blends as it rises (soft stops). A bar or point
    takes the one color of its value.

    @module
*/
import {extent} from "d3-array";
import {interpolateHcl, interpolateRgb, piecewise} from "d3-interpolate";

import type {SceneGradient} from "@d3plus/render";

/** One entry of `valueColors`: a color, or `null` for the series' own color. */
export type ValueColor = string | null;

/**
    How a chart maps values to colors: bands split at `values` (one more
    color than values), or a gradient through `values` (one color per value).
*/
export interface ValueScale {
  kind: "threshold" | "gradient";
  /** Ascending: the thresholds, or the gradient's stops. */
  values: number[];
  /** Low to high; `null` stands for the series' own color. */
  colors: ValueColor[];
}

/**
    The `valueColors` setting: bands split at `values` (`"threshold"`, the
    default) or a gradient through them (`"gradient"`, where `true` or no
    `values` spans the plotted values), in `colors` from low to high.
*/
export interface ValueColorsSetting {
  type?: "threshold" | "gradient";
  values?: number | number[] | boolean;
  colors?: ValueColor[] | string;
}

/** The colors a value scale defaults to. */
export interface ValueColorDefaults {
  /** The lowest threshold band (`colorDefaults.off`). */
  below: string;
  /** The middle threshold band, between `below` and `above` when there are three or more (`colorDefaults.caution`). */
  middle: string;
  /** The highest threshold band (`colorDefaults.on`). */
  above: string;
  /** A gradient's low end (the color scale's `colorMin`). */
  low: string;
  /** A gradient's high end (the color scale's `colorMax`). */
  high: string;
}

const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
    The values of a `valueColors` setting: a number, or a list of numbers,
    sorted and deduplicated. Anything else gives none.
    @param setting The setting's `values`.
*/
export function valueThresholds(setting: unknown): number[] {
  const list = Array.isArray(setting) ? setting : [setting];
  return Array.from(new Set(list.filter(isNumber))).sort((a, b) => a - b);
}

/**
    `colors` fit to `n` entries: as given when there are `n`; otherwise
    blended (in HCL) into `n` evenly spaced colors, or, when a `null`
    (series color) entry can't be blended, cut short or padded with the last
    one.
    @param colors The colors, low to high.
    @param n How many are needed.
*/
export function fitColors(colors: ValueColor[], n: number): ValueColor[] {
  if (n <= 0 || !colors.length) return [];
  if (colors.length === n) return colors.slice();
  if (colors.length === 1 || colors.includes(null))
    return Array.from(
      {length: n},
      (_, i) => colors[Math.min(i, colors.length - 1)],
    );
  const blend = piecewise(interpolateHcl, colors as string[]);
  return Array.from({length: n}, (_, i) => blend(n === 1 ? 0.5 : i / (n - 1)));
}

/** The `valueColors` entries that are colors or `null`, or undefined when unset or empty. */
function colorList(setting: unknown): ValueColor[] | undefined {
  if (typeof setting === "string") return [setting];
  if (!Array.isArray(setting)) return undefined;
  const list = setting.filter(c => c === null || typeof c === "string");
  return list.length ? (list as ValueColor[]) : undefined;
}

/**
    The threshold colors for `n` bands: `below` and `above` for two, and a
    traffic light (`below`, `middle`, `above`, blended to fit) for more.
    @param n How many bands.
    @param defaults The chart's default colors.
*/
export function thresholdDefaults(
  n: number,
  defaults: ValueColorDefaults,
): ValueColor[] {
  return n <= 2
    ? fitColors([defaults.below, defaults.above], n)
    : fitColors([defaults.below, defaults.middle, defaults.above], n);
}

/**
    The value scale a `valueColors` setting describes, or undefined when the
    chart colors by series (no setting, or thresholds without values). A
    gradient of `true` (or without `values`) runs across `dataExtent`; a list
    of values places its colors at those values when there are as many
    colors, and otherwise spreads the colors evenly from the lowest value to
    the highest.
    @param setting The chart's `valueColors`.
    @param dataExtent The plotted values' extent, for a gradient across the data.
    @param defaults The colors each type defaults to.
*/
export function valueScale(
  setting: unknown,
  dataExtent: [number, number] | undefined,
  defaults: ValueColorDefaults,
): ValueScale | undefined {
  if (!setting || typeof setting !== "object" || Array.isArray(setting))
    return undefined;
  const {type, values, colors: given} = setting as ValueColorsSetting;
  const colors = colorList(given);
  if (type !== "gradient") {
    const thresholds = valueThresholds(values);
    if (!thresholds.length) return undefined;
    const n = thresholds.length + 1;
    return {
      kind: "threshold",
      values: thresholds,
      colors: colors ? fitColors(colors, n) : thresholdDefaults(n, defaults),
    };
  }
  const stops =
    values === true || values === undefined
      ? dataExtent && dataExtent.every(isNumber)
        ? Array.from(new Set(dataExtent))
        : []
      : valueThresholds(values);
  if (!stops.length) return undefined;
  const palette = colors ?? [defaults.low, defaults.high];
  if (palette.length === stops.length || stops.length === 1)
    return {
      kind: "gradient",
      values: stops,
      colors: fitColors(palette, stops.length),
    };
  const [lo, hi] = [stops[0], stops[stops.length - 1]];
  return {
    kind: "gradient",
    values: palette.map((_, i) => lo + ((hi - lo) * i) / (palette.length - 1)),
    colors: palette,
  };
}

/** A scale's colors with `null` entries swapped for the series' `own` color. */
function resolved(scale: ValueScale, own: string): string[] {
  return scale.colors.map(c => c ?? own);
}

/**
    The color of a value on a scale: its band's color, or the gradient's
    color there (blended in RGB, as SVG and Canvas blend gradient stops). A
    value on a threshold falls in the band above it. Undefined for a value
    that isn't a finite number.
    @param scale The value scale.
    @param value The value.
    @param own The series' own color, for `null` entries.
*/
export function valueColorAt(
  scale: ValueScale,
  value: unknown,
  own: string,
): string | undefined {
  const v = typeof value === "number" ? value : Number(value);
  if (value === null || value === undefined || !Number.isFinite(v))
    return undefined;
  const colors = resolved(scale, own);
  const {values} = scale;
  if (scale.kind === "threshold")
    return colors[values.filter(t => t <= v).length];
  if (v <= values[0]) return colors[0];
  const last = values.length - 1;
  if (v >= values[last]) return colors[last];
  const k = values.findIndex(t => t > v);
  const t = (v - values[k - 1]) / (values[k] - values[k - 1]);
  return interpolateRgb(colors[k - 1], colors[k])(t);
}

/**
    The gradient that paints a scale along the value axis, in pixels: from
    `lo` to `hi` along that axis, with stops at each threshold (two, the
    colors on either side) or gradient value. It spans `span` (the axis's
    pixel range) and every stop, so its end colors carry on past the axis.
    Undefined when no stop has a pixel position.
    @param scale The value scale.
    @param toPixel A value's pixel position along the value axis.
    @param span The value axis's pixel range.
    @param own The series' own color, for `null` entries.
*/
export function valuePixelStops(
  scale: ValueScale,
  toPixel: (value: number) => number,
  span: number[],
  own: string,
): {lo: number; hi: number; stops: SceneGradient["stops"]} | undefined {
  const colors = resolved(scale, own);
  const placed = scale.values
    .map((value, i) => ({value, i, px: toPixel(value)}))
    .filter(p => Number.isFinite(p.px));
  if (!placed.length) return undefined;
  const ends = span.filter(Number.isFinite);
  const [lo, hi] = extent([...ends, ...placed.map(p => p.px)]) as [
    number,
    number,
  ];
  if (!(hi > lo)) return undefined;
  const offset = (px: number) => (px - lo) / (hi - lo);
  // Pixels run with the values, or against them (a y axis, a reversed axis).
  const rising =
    placed.length > 1
      ? placed[placed.length - 1].px >= placed[0].px
      : toPixel(placed[0].value + 1) >= placed[0].px;
  const ordered = rising ? placed : placed.slice().reverse();
  const stops = ordered.flatMap(({i, px}) => {
    if (scale.kind === "gradient")
      return [{offset: offset(px), color: colors[i]}];
    const [first, second] = rising
      ? [colors[i], colors[i + 1]]
      : [colors[i + 1], colors[i]];
    return [
      {offset: offset(px), color: first},
      {offset: offset(px), color: second},
    ];
  });
  return {lo, hi, stops};
}

/**
    The colors a legend swatch shows for a scale, low to high: each band's
    color, or the gradient's colors, with `null` entries as the series' own.
    @param scale The value scale.
    @param own The series' own color.
*/
export function swatchColors(scale: ValueScale, own: string): string[] {
  return resolved(scale, own);
}

/**
    A swatch's gradient (objectBoundingBox units): the colors in equal
    steps, as hard bands for thresholds or a blend for a gradient, running
    left to right (a Line's swatch) or bottom to top (any other).
    @param scale The value scale.
    @param own The series' own color.
    @param horizontal Whether the colors run left to right.
*/
export function swatchGradient(
  scale: ValueScale,
  own: string,
  horizontal: boolean,
): SceneGradient {
  const colors = swatchColors(scale, own);
  const n = colors.length;
  const stops =
    scale.kind === "threshold"
      ? colors.flatMap((color, i) => [
          {offset: i / n, color},
          {offset: (i + 1) / n, color},
        ])
      : colors.map((color, i) => ({offset: n > 1 ? i / (n - 1) : 0, color}));
  return {
    type: "linear",
    from: horizontal ? [0, 0] : [0, 1],
    to: horizontal ? [1, 0] : [0, 0],
    stops,
  };
}
