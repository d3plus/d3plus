/**
    Hexbin's resolved options and the rows it draws: one row per bin or
    contour level, each carrying what it measures under `HEXBIN_META`.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import {fieldAccessor, fieldNameOf} from "../../utils/fieldAccessor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {BinAgg, BinShape} from "./binning.js";

/** The shape key Hexbin's observations, bins and contours draw under. */
export const HEXBIN_SHAPE = "Hexbin";

/** The key a bin or contour row keeps its measure under. */
export const HEXBIN_META = "__d3plusHexbin";

/** What a bin row carries. */
export interface BinMeta {
  kind: "bin";
  /** How many observations the bin holds. */
  count: number;
  /** What the bin measures: its count, or the sum or mean of `binValue`. */
  value: number;
  /** The bin's bounds in data units. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** The bin's outline, in pixels. */
  path: string;
  /** The observations in the bin. */
  rows: DataPoint[];
}

/** What a contour row carries. */
export interface ContourMeta {
  kind: "contour";
  /** The density level, in points per bin. */
  level: number;
  /** The next level up, if any: the region's density runs from `level` to it. */
  next?: number;
  /** The level's position, lowest first, and how many levels there are. */
  index: number;
  levels: number;
  path: string;
}

export type HexbinMeta = BinMeta | ContourMeta;

/** The `binValue` option: a count, or a field aggregated per bin. */
export type BinValueOption =
  | "count"
  | {
      value: string | ((d: DataPoint, i: number) => unknown);
      agg?: "sum" | "mean";
      label?: string;
    };

/** The `contours` option. */
export type ContoursOption = boolean | "lines" | "filled";

/** The `contourConfig` option. */
export interface ContourConfig {
  bandwidth?: number;
  thresholds?: number | number[];
  strokeWidth?: number;
  fillOpacity?: number;
}

/** The `pointConfig` option. */
export interface PointConfig {
  r?: number;
  fill?: string;
  fillOpacity?: number;
}

/** Hexbin's options, resolved for a draw. */
export interface HexbinSettings {
  shape: BinShape | false;
  size: number;
  agg: BinAgg;
  /** What `sum`/`mean` bins aggregate, read from each observation. */
  weight?: (d: DataPoint, i: number) => unknown;
  /** The name of what a bin measures. */
  measure: string;
  contours: false | "lines" | "filled";
  contourConfig: Required<ContourConfig>;
  points: boolean;
  pointConfig: Required<Omit<PointConfig, "fill">> & {fill?: string};
}

/** `contourConfig`'s defaults. */
export const CONTOUR_DEFAULTS: Required<ContourConfig> = {
  bandwidth: 20,
  thresholds: 8,
  strokeWidth: 1.5,
  fillOpacity: 0.8,
};

/** `pointConfig`'s defaults (the fill follows the chart's text color). */
export const POINT_DEFAULTS: Required<Omit<PointConfig, "fill">> = {
  r: 1.5,
  fillOpacity: 0.35,
};

/** The default `binSize`, in pixels. */
export const BIN_SIZE = 12;

/** Walks Plot's `__d3plus__` wrappers down to the row. */
export function unwrapHexbinRow(d: DataPoint): DataPoint {
  while (d && d.__d3plus__ && d.data) d = d.data as DataPoint;
  return d;
}

/** The measure a (possibly wrapped) bin or contour row carries, if any. */
export function hexbinMeta(d: DataPoint | undefined): HexbinMeta | undefined {
  const row = d ? unwrapHexbinRow(d) : undefined;
  return row
    ? (row[HEXBIN_META] as unknown as HexbinMeta | undefined)
    : undefined;
}

/** A bin's measure or a contour's level: what Hexbin's colorScale reads. */
export function hexbinValue(d: DataPoint): number | undefined {
  const meta = hexbinMeta(d);
  return meta ? (meta.kind === "bin" ? meta.value : meta.level) : undefined;
}

/** A row holding a bin's or contour's measure. */
export function hexbinRow(id: string, meta: HexbinMeta): DataPoint {
  return {id, [HEXBIN_META]: meta as never};
}

/**
    Resolves `binValue` to an aggregation, the accessor it aggregates, and
    the name of what each bin measures.
*/
export function resolveBinValue(
  option: unknown,
  translate: (s: string) => string,
): {agg: BinAgg; weight?: HexbinSettings["weight"]; measure: string} {
  if (!option || option === "count" || typeof option !== "object")
    return {agg: "count", measure: translate("Count")};
  const {value, agg, label} = option as Exclude<BinValueOption, "count">;
  const weight =
    typeof value === "function"
      ? value
      : typeof value === "string"
        ? fieldAccessor(value)
        : undefined;
  if (!weight) return {agg: "count", measure: translate("Count")};
  const mode = agg === "mean" ? "mean" : "sum";
  const key =
    typeof value === "string" ? value : (fieldNameOf(weight) ?? undefined);
  const name = translate(mode === "mean" ? "Mean" : "Total");
  return {
    agg: mode,
    weight,
    measure: label ?? (key ? `${name} ${key}` : name),
  };
}

/** Hexbin's options, resolved from its config for one draw. */
export function hexbinSettings(viz: VizInstance): HexbinSettings {
  const s = viz.schema;
  const translate = (k: string) => s.translate(k) as string;
  const shape =
    s.binShape === "square" ? "square" : s.binShape === false ? false : "hex";
  const size = Number(s.binSize);
  const contours =
    s.contours === "filled"
      ? "filled"
      : s.contours === true || s.contours === "lines"
        ? "lines"
        : false;
  return {
    shape,
    size: size > 0 ? size : BIN_SIZE,
    ...resolveBinValue(s.binValue, translate),
    contours,
    contourConfig: {
      ...CONTOUR_DEFAULTS,
      ...(s.contourConfig as ContourConfig | undefined),
    },
    points: Boolean(s.points),
    pointConfig: {
      ...POINT_DEFAULTS,
      ...(s.pointConfig as PointConfig | undefined),
    },
  };
}
