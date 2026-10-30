/**
    Hexbin's tooltip and aria text: a bin's measure and its x and y ranges,
    or a contour's density range.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {VizInstance} from "../viz/vizTypes.js";
import {hexbinMeta, hexbinSettings, type BinMeta} from "./settings.js";

const fmt = (viz: VizInstance, n: number): string =>
  Number.isFinite(n) ? formatAbbreviate(n, viz.schema.locale) : "";

const range = (viz: VizInstance, lo: number, hi: number): string =>
  `${fmt(viz, lo)} – ${fmt(viz, hi)}`;

/** The name an axis goes by: its data key, or the axis letter. */
function axisName(viz: VizInstance, axis: "x" | "y"): string {
  const key = viz[`_${axis}Key`];
  return typeof key === "string" ? key : axis;
}

/** A contour level's density range: up to the next level, or the level and up. */
function levelRange(viz: VizInstance, level: number, next?: number): string {
  return next === undefined ? `≥ ${fmt(viz, level)}` : range(viz, level, next);
}

/** A bin's tooltip title: its measure, such as "Count: 42". */
export function hexbinTooltipTitle(viz: VizInstance, d: DataPoint): string {
  const meta = hexbinMeta(d);
  if (!meta) return "";
  const t = (s: string) => viz.schema.translate(s) as string;
  if (meta.kind === "contour") return t("Density");
  return `${hexbinSettings(viz).measure}: ${fmt(viz, meta.value)}`;
}

/**
    A bin's tooltip rows: its x and y ranges, and its count when it measures
    something else. A contour's: its density range, in points per bin.
*/
export function hexbinTooltipRows(
  viz: VizInstance,
  d: DataPoint,
): [string, string][] {
  const meta = hexbinMeta(d);
  if (!meta) return [];
  const t = (s: string) => viz.schema.translate(s) as string;
  if (meta.kind === "contour")
    return [[t("Range"), levelRange(viz, meta.level, meta.next)]];
  const rows: [string, string][] = [
    [axisName(viz, "x"), range(viz, meta.x0, meta.x1)],
    [axisName(viz, "y"), range(viz, meta.y0, meta.y1)],
  ];
  if (hexbinSettings(viz).agg !== "count")
    rows.push([t("Count"), fmt(viz, meta.count)]);
  return rows;
}

/** A bin's accessible name: its measure, then its x and y ranges. */
export function binAriaLabel(viz: VizInstance, d: DataPoint): string {
  const meta = hexbinMeta(d) as BinMeta | undefined;
  if (!meta) return "";
  return [
    hexbinTooltipTitle(viz, d),
    `${axisName(viz, "x")} ${range(viz, meta.x0, meta.x1)}`,
    `${axisName(viz, "y")} ${range(viz, meta.y0, meta.y1)}`,
  ].join(", ");
}

/** A contour's accessible name: "Density" and its range. */
export function contourAriaLabel(viz: VizInstance, d: DataPoint): string {
  const meta = hexbinMeta(d);
  if (!meta || meta.kind !== "contour") return "";
  const t = (s: string) => viz.schema.translate(s) as string;
  return `${t("Density")}: ${levelRange(viz, meta.level, meta.next)}`;
}
