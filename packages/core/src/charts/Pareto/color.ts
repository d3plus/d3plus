/**
    Pareto's colors: one color for every bar, the first color of the chart's
    categorical palette, while each category draws a single bar. Bars that
    split a category into series (a deeper `groupBy`) color by series, and a
    user `color` replaces both.

    @module
*/
import type {ColorDefaults} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {categoryKey, type RowAccessor} from "./paretoSteps.js";
import {barRows, categoryOf, paretoState, sourceRow} from "./state.js";

/** The color every bar shares: the first color of the chart's categorical palette. */
export function barColor(viz: VizInstance): string {
  const defaults = viz.schema.colorDefaults as ColorDefaults;
  return defaults.scale.range()[0];
}

/**
    Whether no category of `rows` draws more than one bar (within its
    small-multiples panel).
    @param rows The bar rows.
    @param category Reads a row's category.
    @param panel Reads a row's small-multiples panel, if any.
*/
export function oneBarPerCategory(
  rows: DataPoint[],
  category: RowAccessor,
  panel?: RowAccessor,
): boolean {
  const seen = new Set<string>();
  return rows.every((d, i) => {
    const key = `${panel ? panel(d, i) : ""}\u0001${categoryKey(category(d, i))}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Whether the bars being drawn share one color: one bar per category, and no user `color`. */
export function sharesOneColor(viz: VizInstance): boolean {
  const state = paretoState(viz);
  if (viz.schema.color !== state.color) return false;
  const data = viz._filteredData;
  const cached = data ? state.oneColor.get(data) : undefined;
  if (cached !== undefined) return cached;
  const facet =
    typeof viz.schema.facet === "function"
      ? (viz.schema.facet as RowAccessor)
      : undefined;
  const one = oneBarPerCategory(
    barRows(data),
    (d, i) => categoryOf(viz, d, i),
    facet,
  );
  if (data) state.oneColor.set(data, one);
  return one;
}

/**
    The chart's default `color`: the shared bar color while the bars share
    one, else the first `groupBy` level, as every chart colors by default.
    @param viz The chart.
*/
export function paretoColor(viz: VizInstance) {
  return (d: DataPoint, i: number): unknown =>
    sharesOneColor(viz)
      ? barColor(viz)
      : (viz.schema.groupBy as RowAccessor[])[0](sourceRow(d)!, i);
}
