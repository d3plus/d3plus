/**
    Small multiples: splitting a chart's data into one group of rows per facet
    value, in panel order, and preparing each group the way the chart prepares
    its whole dataset.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import {formatDate} from "@d3plus/format";

import {computeFilteredData, computeTimeFilter, dataFilter} from "../pipeline/vizPreDrawPure.js";
import type {VizPreDrawResult} from "../pipeline/vizPreDrawPure.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {FacetAccessor, FacetSort, FacetValue} from "./facetConfig.js";

/** One panel's facet value and raw rows. */
export interface FacetGroup {
  key: string;
  value: FacetValue;
  rows: DataPoint[];
}

/** A facet value as a comparable string key (dates compare by time). */
export function facetKey(value: unknown): string {
  return value instanceof Date ? `${+value}` : `${value}`;
}

/** Narrows an accessor result to a facet value; arrays and objects become text. */
export function toFacetValue(value: unknown): FacetValue | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return `${value}`;
}

/** Natural order: numbers and dates numerically, text alphabetically (with embedded numbers compared as numbers). */
export function compareFacetValues(a: FacetValue, b: FacetValue): number {
  const na = a instanceof Date ? +a : a, nb = b instanceof Date ? +b : b;
  if (typeof na === "number" && typeof nb === "number") return na - nb;
  return `${a}`.localeCompare(`${b}`, undefined, {numeric: true});
}

/** Orders facet values (given in data order) by a `FacetSort`. */
export function sortFacetValues(values: FacetValue[], sort: FacetSort): FacetValue[] {
  const out = values.slice();
  if (Array.isArray(sort)) {
    const rank = new Map(sort.map((v, i) => [facetKey(v), i]));
    const at = (v: FacetValue): number => rank.get(facetKey(v)) ?? Infinity;
    return out.sort((a, b) => at(a) - at(b));
  }
  if (typeof sort === "function") return out.sort(sort);
  if (sort === "data") return out;
  out.sort(compareFacetValues);
  return sort === "descending" ? out.reverse() : out;
}

/**
    Groups `rows` by facet value, in panel order. Rows without a facet value
    are left out of every panel.
*/
export function groupFacets(rows: DataPoint[], facet: FacetAccessor, sort: FacetSort): FacetGroup[] {
  const groups = new Map<string, FacetGroup>();
  rows.forEach((d, i) => {
    const value = toFacetValue(facet(d, i));
    if (value === undefined) return;
    const key = facetKey(value);
    let group = groups.get(key);
    if (!group) groups.set(key, (group = {key, value, rows: []}));
    group.rows.push(d);
  });
  const byKey = new Map(Array.from(groups.values()).map(g => [g.key, g]));
  const ordered = sortFacetValues(Array.from(groups.values()).map(g => g.value), sort);
  return ordered.map(v => byKey.get(facetKey(v))!);
}

/**
    The facet groups for `viz`: every facet value in its data (after the
    chart's own `filter`, so the grid doesn't reflow as the timeline moves or
    legend items are toggled).
*/
export function facetGroups(viz: VizInstance, sort: FacetSort): FacetGroup[] {
  const facet = viz.schema.facet as FacetAccessor | undefined;
  if (!facet) return [];
  const data = viz._data || [];
  const filter = dataFilter(viz);
  const rows = filter ? data.filter(filter) : data;
  return groupFacets(rows, facet, sort);
}

/**
    One panel's drawable rows: `rows` run through the same time filter,
    rollup, legend hide/solo, and threshold the chart applies to its whole
    dataset. `timeFilter` is computed once from the whole dataset, so every
    panel shows the same period.
*/
export function facetFilteredData(
  viz: VizInstance,
  rows: DataPoint[],
  timeFilter: ReturnType<typeof computeTimeFilter>,
): DataPoint[] {
  const out: VizPreDrawResult = {};
  computeFilteredData(viz, out, viz._drawDepth, viz._id, timeFilter, rows);
  let data = out.filteredData ?? [];
  if (rows.length && out._thresholdTree && viz._thresholdFunction)
    data = viz._thresholdFunction(data, out._thresholdTree);
  return data;
}

/** The time filter every panel shares (see `facetFilteredData`). */
export function facetTimeFilter(viz: VizInstance): ReturnType<typeof computeTimeFilter> {
  return computeTimeFilter(viz);
}

/** A panel's default title: its facet value, with dates formatted against every panel's date. */
export function formatFacetValue(value: FacetValue, values: FacetValue[]): string {
  if (value instanceof Date) {
    const dates = values.filter((v): v is Date => v instanceof Date).sort((a, b) => +a - +b);
    return formatDate(value, dates);
  }
  return `${value}`;
}
