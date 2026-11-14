/**
    A Dumbbell category's change, read from the chart's drawn rows: its
    connector's default colors and its tooltip row (the "Change" with
    `arrows`, the "Range" with a bar connector).

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {VizInstance} from "../viz/vizTypes.js";
import {
  changeText,
  directionColor,
  dumbbellConnector,
  type DumbbellDirection,
} from "./changes.js";

type Accessor = (d: DataPoint, i: number) => unknown;

/** A category's first and last values in data order, and its smallest and largest. */
export interface CategoryValues {
  first: number;
  last: number;
  min: number;
  max: number;
}

/**
    The values of the category `category` among `rows`: its first and last
    in data order, and its smallest and largest. Null with fewer than two
    numeric values.
    @param rows The drawn rows, in data order.
    @param categoryOf Reads a row's category.
    @param value Reads a row's value.
    @param category The category.
*/
export function categoryValues(
  rows: DataPoint[],
  categoryOf: Accessor,
  value: Accessor,
  category: unknown,
): CategoryValues | null {
  const values: number[] = [];
  rows.forEach((d, i) => {
    if (`${categoryOf(d, i)}` !== `${category}`) return;
    const v = Number(value(d, i));
    if (Number.isFinite(v)) values.push(v);
  });
  if (values.length < 2) return null;
  return {
    first: values[0],
    last: values[values.length - 1],
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/** The chart's category and value accessors, by its `discrete` axis. */
function axes(viz: VizInstance): {category: Accessor; value: Accessor} {
  const horizontal = viz.schema.discrete !== "x";
  return {
    category: (horizontal ? viz._y : viz._x) as Accessor,
    value: (horizontal ? viz._x : viz._y) as Accessor,
  };
}

/** The values of the category a row (or a category value) belongs to. */
function valuesOf(
  viz: VizInstance,
  row: DataPoint | null,
  category?: unknown,
): CategoryValues | null {
  const rows = (viz._filteredData ?? []) as DataPoint[];
  const {category: categoryOf, value} = axes(viz);
  if (!categoryOf || !value) return null;
  const key = row ? categoryOf(row, rows.indexOf(row)) : category;
  return categoryValues(rows, categoryOf, value, key);
}

/** Which way a row's category moves, from its first value to its last. */
export function rowDirection(
  viz: VizInstance,
  row: DataPoint,
): DumbbellDirection {
  const v = valuesOf(viz, row);
  if (!v) return "none";
  return v.last > v.first ? "increase" : v.last < v.first ? "decrease" : "none";
}

/**
    The line connector's default color for a row's category: its direction's
    color with `arrows`, else `gray`.
*/
export function lineColor(
  viz: VizInstance,
  row: DataPoint,
  gray: string,
): string {
  if (!viz.schema.arrows) return gray;
  return directionColor(
    rowDirection(viz, row),
    viz.schema,
    gray,
    viz.schema.colorDefaults,
  );
}

/**
    A floating bar's default fill for a row's category: its direction's
    color with `arrows`, else the color defaults' `sequential`.
*/
export function barColor(viz: VizInstance, row: DataPoint): string {
  const sequential = viz.schema.colorDefaults?.sequential as string;
  if (!viz.schema.arrows) return sequential;
  return directionColor(
    rowDirection(viz, row),
    viz.schema,
    sequential,
    viz.schema.colorDefaults,
  );
}

/**
    The tooltip row a category adds: its signed "Change" from its first
    value to its last with `arrows`, its "Range" (largest minus smallest)
    with a bar connector, else none.
    @param viz The chart.
    @param row A row of the category, or null with `category`.
    @param category The category, when there is no row.
*/
export function changeRow(
  viz: VizInstance,
  row: DataPoint | null,
  category?: unknown,
): [string, string] | null {
  const arrows = !!viz.schema.arrows;
  const bar = dumbbellConnector(viz.schema.connector) === "bar";
  if (!arrows && !bar) return null;
  const v = valuesOf(viz, row, category);
  if (!v) return null;
  const format = (n: number) => formatAbbreviate(n, viz.schema.locale);
  return arrows
    ? [viz.schema.translate("Change"), changeText(v.last - v.first, format)]
    : [viz.schema.translate("Range"), format(v.max - v.min)];
}
