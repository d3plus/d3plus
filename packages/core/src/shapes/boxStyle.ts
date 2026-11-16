import {color} from "d3-color";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import {isSharedConfig, markSharedConfig} from "../utils/configWarnings.js";

type Accessor = (d: DataPoint, i: number) => unknown;

/** The Box's own styling that its box Rect takes unless `rectConfig` sets it. */
const boxRectKeys = [
  "fill",
  "stroke",
  "backgroundImage",
  "backgroundImageFit",
  "texture",
  "textureDefault",
];

/** The box Rect's colors when neither the Box nor `rectConfig` sets them. */
const boxRectDefaults = {fill: "white", stroke: "black"};

/** `config` with the Box's additions, still marked shared if `from` was. */
function extend(
  from: Record<string, unknown>,
  config: Record<string, unknown>,
): Record<string, unknown> {
  return isSharedConfig(from) ? markSharedConfig(config) : config;
}

/**
    A Box-level value for one of its parts: an accessor is called with the
    part's source datum and index (`d.data` and `d.i`), which is the box's
    merged datum for the box Rect and the observation for an outlier.
*/
function fromBox(value: unknown): unknown {
  return typeof value === "function"
    ? (d: DataPoint) => (value as Accessor)(d.data as DataPoint, d.i as number)
    : value;
}

/**
    The box Rect's config: `rectConfig`, plus the Box's own `fill`, `stroke`,
    `texture`, `textureDefault`, `backgroundImage`, and `backgroundImageFit`
    where `rectConfig` leaves them unset, and a white fill and black stroke
    where neither sets them. Accessors resolve against the box's merged datum,
    the same one `orient` and `rectWidth` see.
*/
export function boxRectConfig(
  schema: Record<string, unknown>,
  rectConfig: Record<string, unknown>,
): Record<string, unknown> {
  const config: Record<string, unknown> = {...boxRectDefaults};
  for (const key of boxRectKeys) {
    const value = schema[key];
    if (value !== undefined && !(key in rectConfig))
      config[key] = fromBox(value);
  }
  return extend(rectConfig, {...config, ...rectConfig});
}

/**
    Black or white, whichever reads better over `fill`; black when `fill`
    isn't an opaque color.
*/
export function boxMedianInk(fill: unknown): string {
  const c = typeof fill === "string" ? color(fill) : null;
  if (!c || !c.opacity) return "black";
  return colorContrast(c.formatRgb(), {dark: "black", light: "white"});
}

/** The thinnest box body, in pixels, that a 1px median line reads against. */
const MIN_BODY = 1;

/**
    Whether `v`, a position along a box datum's value axis, lies over the
    box's body: between its quartiles (`first` and `third`), on a body at
    least as thick as the median line. A box whose quartiles meet has no
    body, so its median sits on the chart's background.
*/
export function overBoxBody(d: DataPoint, v: unknown): boolean {
  const first = d.first as number;
  const third = d.third as number;
  const lo = Math.min(first, third);
  const hi = Math.max(first, third);
  return hi - lo >= MIN_BODY && typeof v === "number" && v >= lo && v <= hi;
}

/**
    The ink of a mark the Box draws at `at` along each box: black or white
    contrasting with the box's `boxFill` where the mark lies over the box's
    body (see `overBoxBody`), and `bareInk` where it lies on the chart's
    background. Both resolve on the same box datum.
*/
export function boxInk(
  boxFill: unknown,
  bareInk: unknown,
  at: (d: DataPoint) => unknown,
): (d: DataPoint, i: number) => unknown {
  const resolve = (value: unknown, d: DataPoint, i: number): unknown =>
    typeof value === "function" ? (value as Accessor)(d, i) : value;
  return (d, i) =>
    overBoxBody(d, at(d))
      ? boxMedianInk(resolve(boxFill, d, i))
      : resolve(bareInk, d, i);
}

/**
    The ink of a Box's marks off its body: its whiskers' line color, from its
    prepared `whiskerConfig`, or black (a Line's own default).
*/
export function boxBareInk(whiskerConfig: Record<string, unknown>): unknown {
  const line = whiskerConfig.lineConfig as Record<string, unknown> | undefined;
  return line?.stroke ?? "black";
}

/**
    The median Rect's config: `medianConfig`, with a fill (see `boxInk`) that
    contrasts with the box's `boxFill` where the median lies over the box's
    body, and takes `bareInk` where it doesn't (a box whose quartiles meet),
    where `medianConfig` leaves it unset.
*/
export function boxMedianConfig(
  boxFill: unknown,
  medianConfig: Record<string, unknown>,
  bareInk: unknown = "black",
): Record<string, unknown> {
  if ("fill" in medianConfig) return medianConfig;
  const fill = boxInk(boxFill, bareInk, d => d.median);
  return extend(medianConfig, {...medianConfig, fill});
}

/**
    An outlier shape's config: `outlierConfig`, plus the Box's own `fill`
    resolved against each outlier's observation where `outlierConfig` leaves
    it unset.
*/
export function boxOutlierConfig(
  schema: Record<string, unknown>,
  outlierConfig: Record<string, unknown>,
): Record<string, unknown> {
  if (schema.fill === undefined || "fill" in outlierConfig)
    return outlierConfig;
  return extend(outlierConfig, {
    ...outlierConfig,
    fill: fromBox(schema.fill),
  });
}
