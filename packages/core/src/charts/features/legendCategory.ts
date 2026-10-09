/**
    Legend entries that stand for a color category. When `color` is a
    categorical key no groupBy level matches (e.g. `groupBy("country")` with
    `color("region")`), each legend entry merges several ids, so the entry is
    labelled by its color value instead of by those ids. Hide, solo, and hover
    act on the entry's merged ids, which are every id in the category.
*/
import {color} from "d3-color";

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

/** A legend entry and the color value its data share. */
export interface LegendEntry {
  datum: DataPoint;
  color: unknown;
}

/**
    The category a color value names: its text, when it is a non-empty string,
    a number, or a boolean that doesn't parse as a CSS color. A CSS color is
    painted as-is, so it names no category.
    @param value A value returned by the chart's `color` accessor.
*/
export function colorCategory(value: unknown): string | undefined {
  if (!["string", "number", "boolean"].includes(typeof value)) return undefined;
  const text = `${value}`;
  return text === "" || color(text) ? undefined : text;
}

/**
    Whether any legend entry merges more than one id at the legend's depth,
    so no single groupBy value can label it.
    @param viz The chart, whose `_legendDepth` is already computed.
    @param legendData The rolled-up legend entries.
*/
export function legendMergesIds(viz: VizInstance, legendData: DataPoint[]): boolean {
  const groupBy = viz.schema.groupBy?.[viz._legendDepth ?? 0];
  if (typeof groupBy !== "function") return false;
  return legendData.some((d, i) => {
    const id = groupBy.bind(viz)(d, i);
    return Array.isArray(id) && id.length > 1;
  });
}

/**
    Maps each legend entry to the color category it stands for, or returns
    undefined unless every entry names a category (see `colorCategory`) and no
    two entries name the same one.
    @param entries Each legend entry with its color value.
*/
export function legendCategories(entries: LegendEntry[]): WeakMap<DataPoint, string> | undefined {
  const categories = new WeakMap<DataPoint, string>();
  const seen = new Set<string>();
  for (const {datum, color: value} of entries) {
    const category = colorCategory(value);
    if (category === undefined || seen.has(category)) return undefined;
    seen.add(category);
    categories.set(datum, category);
  }
  return categories;
}

/**
    The color category a legend entry stands for, or undefined when the legend
    is labelled by groupBy. Unwraps the shape and tooltip wrappers a legend
    datum travels in.
    @param viz The chart.
    @param d A legend entry, or a wrapper around one.
*/
export function legendCategoryOf(viz: VizInstance, d: DataPoint | undefined): string | undefined {
  if (!viz._legendCategories || !d) return undefined;
  while (d.__d3plus__ && d.data) d = d.data as DataPoint;
  return viz._legendCategories.get(d);
}
