/**
    Pareto's hover: the cumulative line stays bright while a bar (or legend
    entry) is hovered, so the running share through the hovered category
    still reads, and of its points only the hovered categories' stay bright,
    picking them out along the line. The other bars dim as usual.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {categoryKey} from "./paretoSteps.js";
import {barRows, categoryOf, isLineRow, lineStep} from "./state.js";

type Predicate = (d: DataPoint, i: number) => boolean;

/**
    A hover predicate that also matches every point of the cumulative line.
    `false` and `undefined` (clearing the hover) pass through.
    @param fn The hover predicate.
*/
export function withLine<T>(fn: T): T | Predicate {
  if (typeof fn !== "function") return fn;
  const match = fn as unknown as Predicate;
  return (d: DataPoint, i: number) => isLineRow(d) || match(d, i);
}

/**
    Whether a row is the cumulative line's path rather than one of its points:
    Plot merges the line's rows into the path's, so its step lists every
    category.
    @param d The row.
*/
export const isLinePath = (d: DataPoint): boolean =>
  Array.isArray(lineStep(d)?.key);

/**
    The keys of the categories whose bars a hover predicate matches.
    @param viz The chart.
    @param fn The hover predicate.
*/
export function hoveredCategories(
  viz: VizInstance,
  fn: Predicate,
): Set<string> {
  const out = new Set<string>();
  barRows(viz._filteredData).forEach((d, i) => {
    if (fn(d, i)) out.add(categoryKey(categoryOf(viz, d, i)));
  });
  return out;
}

/**
    Routes the chart's `hover` through `withLine`, so whatever a hover
    highlights, the cumulative line stays bright with it; when it highlights
    bars, only the line's points over those bars stay bright.
    @param viz The chart.
*/
export function keepLineBright(viz: VizInstance): void {
  const hover = viz.hover!.bind(viz) as (...args: unknown[]) => unknown;
  viz.hover = ((...args: unknown[]) => {
    if (!args.length) return hover();
    const fn = args[0];
    const out = hover(withLine(fn));
    const matched = viz._hover;
    if (typeof fn !== "function" || typeof matched !== "function") return out;
    const categories = hoveredCategories(viz, fn as Predicate);
    if (!categories.size) return out;
    viz._hover = (d: DataPoint, i?: number) =>
      isLineRow(d)
        ? isLinePath(d) || categories.has(lineStep(d)!.key)
        : matched(d, i);
    return out;
  }) as unknown as VizInstance["hover"];
}
