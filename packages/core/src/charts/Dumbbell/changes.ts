/**
    Dumbbell's change and range math: which way each category moves (for
    `arrows`), how far it spans, its connector colors, and the floating bar's
    thickness (for `connector: "bar"`).

    @module
*/

import {colorDefaults, type ColorDefaults} from "@d3plus/color";
import {finite} from "@d3plus/math";

import type {PlotDatum} from "../features/plotPaint.js";

/** One category's change: its first and last rows, in data order. */
export interface DumbbellChange {
  category: string;
  from: PlotDatum;
  to: PlotDatum;
}

/** Which way a category's value moves from its first row to its last. */
export type DumbbellDirection = "increase" | "decrease" | "none";

/** How the connector between a category's values is drawn. */
export type DumbbellConnector = "line" | "bar";

/** The category's value along the value axis. */
const valueOf = (d: PlotDatum, opp: "x" | "y"): number => d[opp] as number;

/**
    Each category's change, in first-seen order: its first and last rows in
    data order (by each row's index `i`), among those with a numeric value.
    Categories with fewer than two such rows have none.
    @param rows The plotted rows.
    @param discrete The category axis.
*/
export function dumbbellChanges(
  rows: PlotDatum[],
  discrete: "x" | "y",
): DumbbellChange[] {
  const opp = discrete === "x" ? "y" : "x";
  const ends = new Map<string, {from?: PlotDatum; to?: PlotDatum}>();
  for (const d of rows) {
    const category = `${d[discrete]}`;
    let end = ends.get(category);
    if (!end) ends.set(category, (end = {}));
    if (!finite(d[opp])) continue;
    if (!end.from || d.i < end.from.i) end.from = d;
    if (!end.to || d.i > end.to.i) end.to = d;
  }
  const out: DumbbellChange[] = [];
  ends.forEach(({from, to}, category) => {
    if (from && to && from !== to) out.push({category, from, to});
  });
  return out;
}

/**
    Which way a change moves along the value axis: `"increase"` when its
    last value is larger, `"decrease"` when smaller, `"none"` when equal.
*/
export function dumbbellDirection(
  change: Pick<DumbbellChange, "from" | "to">,
  opp: "x" | "y",
): DumbbellDirection {
  const delta = valueOf(change.to, opp) - valueOf(change.from, opp);
  return delta > 0 ? "increase" : delta < 0 ? "decrease" : "none";
}

/** The colors a Dumbbell's config sets per direction. */
export interface DirectionColors {
  increaseColor?: unknown;
  decreaseColor?: unknown;
}

/**
    The color for a direction: the chart's own `increaseColor` or
    `decreaseColor`, else the color defaults' `on` (increase) or `off`
    (decrease). `"none"` gets `fallback`.
*/
export function directionColor(
  direction: DumbbellDirection,
  colors: DirectionColors,
  fallback: string,
  defaults?: Partial<ColorDefaults>,
): string {
  if (direction === "none") return fallback;
  const own = colors[`${direction}Color`];
  if (typeof own === "string" && own) return own;
  const base = {...colorDefaults, ...defaults};
  return direction === "increase" ? base.on : base.off;
}

/**
    A signed change, formatted: a leading "+" for an increase.
    @param change The last value minus the first.
    @param format Formats the magnitude.
*/
export function changeText(
  change: number,
  format: (n: number) => string,
): string {
  if (!Number.isFinite(change)) return "";
  return change > 0 ? `+${format(change)}` : format(change);
}

/** Coerces a `connector` setting, falling back to `"line"`. */
export function dumbbellConnector(value: unknown): DumbbellConnector {
  return value === "bar" ? "bar" : "line";
}

/** A floating bar's thickness, as a share of the step between categories. */
export const BAR_STEP_SHARE = 0.6;

/** The thickest a floating bar gets by default, in pixels. */
export const BAR_MAX_THICKNESS = 40;

/**
    A floating bar's thickness: `connectorWidth` when set to a positive
    number, else 60% of the smallest step between neighboring categories
    (or of `extent` for a lone category), at most 40 pixels.
    @param positions The categories' pixel positions along the category axis.
    @param extent The category axis' length, in pixels.
    @param connectorWidth The `connectorWidth` setting.
*/
export function barThickness(
  positions: number[],
  extent: number,
  connectorWidth?: unknown,
): number {
  if (typeof connectorWidth === "number" && connectorWidth > 0)
    return connectorWidth;
  const sorted = [...new Set(positions.filter(Number.isFinite))].sort(
    (a, b) => a - b,
  );
  let step = Infinity;
  for (let k = 1; k < sorted.length; k++)
    step = Math.min(step, sorted[k] - sorted[k - 1]);
  if (!Number.isFinite(step)) step = Math.max(0, extent);
  return Math.max(1, Math.min(BAR_MAX_THICKNESS, step * BAR_STEP_SHARE));
}
