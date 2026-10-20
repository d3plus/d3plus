/**
    How Candlestick merges rows that share a series and a period: the open is
    the first row's open, the high the highest high, the low the lowest low,
    and the close the last row's close, taking rows in data order; volumes
    add up.

    A field read from a data key merges through an `aggs` entry on that key,
    so the merged row itself holds the period's values and a user's own
    `aggs` entry for the key wins. A field read by a function has no key to
    aggregate, so its values are aggregated from the merged rows and kept
    beside the merged row, where the chart's readers find them; an `aggs`
    entry named after the field (e.g. `aggs.close`) replaces the default.

    @module
*/

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {finiteValue, type OhlcAccessors} from "./ohlc.js";

/** A row accessor, as the chart's value fields store them. */
export type RowAccessor = (d: DataPoint, i: number) => unknown;

/** An `aggs` entry: the merged rows and a reader of one value from a row. */
export type Aggregator = (rows: DataPoint[], value: (d: DataPoint) => unknown) => unknown;

/** The value fields Candlestick aggregates when rows merge. */
export const VALUE_FIELDS = ["open", "high", "low", "close", "volume"] as const;

/** One of the aggregated value fields. */
export type ValueField = (typeof VALUE_FIELDS)[number];

/** The data keys accessors were created from. */
const accessorKeys = new WeakMap<RowAccessor, string>();

/**
    Coerces a value-field setter argument: a string becomes an accessor of
    that key (remembered, so the key can carry an `aggs` entry), a function
    is kept, and anything else becomes a constant.
    @param value The setter's argument.
*/
export function keyedAccessor(value: unknown): unknown {
  if (typeof value === "function") return value;
  if (typeof value !== "string") return constant(value as never);
  const fn = accessor(value) as RowAccessor;
  accessorKeys.set(fn, value);
  return fn;
}

/**
    Remembers that `fn` reads the data key `key`.
    @param fn The accessor.
    @param key The data key it reads.
*/
export function rememberKey(fn: RowAccessor, key: string): void {
  accessorKeys.set(fn, key);
}

/** The data key `fn` reads, when it was set from one. */
export function accessorKey(fn: unknown): string | undefined {
  return typeof fn === "function" ? accessorKeys.get(fn as RowAccessor) : undefined;
}

/** The finite values `value` reads from `rows`, in row order. */
const finiteValues = (rows: DataPoint[], value: (d: DataPoint) => unknown): number[] =>
  rows.map(value).map(finiteValue).filter((v): v is number => v !== undefined);

/** The first finite value, in row order. */
export const firstValue: Aggregator = (rows, value) => finiteValues(rows, value)[0];

/** The last finite value, in row order. */
export const lastValue: Aggregator = (rows, value) => finiteValues(rows, value).at(-1);

/** The largest finite value. */
export const maxValue: Aggregator = (rows, value) => {
  const values = finiteValues(rows, value);
  return values.length ? Math.max(...values) : undefined;
};

/** The smallest finite value. */
export const minValue: Aggregator = (rows, value) => {
  const values = finiteValues(rows, value);
  return values.length ? Math.min(...values) : undefined;
};

/** The sum of the finite values; undefined when there is none. */
export const sumValue: Aggregator = (rows, value) => {
  const values = finiteValues(rows, value);
  return values.length ? values.reduce((a, b) => a + b, 0) : undefined;
};

/** Each field's default aggregation. */
export const DEFAULT_AGGS: Record<ValueField, Aggregator> = {
  open: firstValue,
  high: maxValue,
  low: minValue,
  close: lastValue,
  volume: sumValue,
};

const defaults = new Set<unknown>(Object.values(DEFAULT_AGGS));

/** Whether an `aggs` entry is one of the chart's own defaults. */
export const isDefaultAgg = (agg: unknown): boolean => defaults.has(agg);

/**
    Points `aggs` at the defaults for every value field read from a data key,
    leaving the user's own entries alone and dropping defaults left on keys no
    field reads anymore. When two fields read one key, the later field wins.
    @param aggs The chart's `aggs`, updated in place.
    @param accessors Each value field's accessor.
*/
export function syncDefaultAggs(
  aggs: Record<string, unknown>,
  accessors: Partial<Record<ValueField, unknown>>,
): void {
  const wanted = new Map<string, Aggregator>();
  for (const field of VALUE_FIELDS) {
    const key = accessorKey(accessors[field]);
    if (key !== undefined) wanted.set(key, DEFAULT_AGGS[field]);
  }
  for (const key of Object.keys(aggs)) {
    if (isDefaultAgg(aggs[key]) && !wanted.has(key)) delete aggs[key];
  }
  wanted.forEach((agg, key) => {
    if (!aggs[key] || isDefaultAgg(aggs[key])) aggs[key] = agg;
  });
}

/**
    The values of every function-read field over the rows being merged: the
    field's `aggs` entry (by field name) when the user set one, else its
    default. Undefined when every field is read from a data key.
    @param rows The rows being merged, in data order.
    @param accessors Each value field's accessor.
    @param aggs The chart's `aggs`.
*/
export function aggregateFunctionFields(
  rows: DataPoint[],
  accessors: Partial<Record<ValueField, unknown>>,
  aggs: Record<string, unknown>,
): Partial<Record<ValueField, unknown>> | undefined {
  let out: Partial<Record<ValueField, unknown>> | undefined;
  for (const field of VALUE_FIELDS) {
    const fn = accessors[field];
    if (typeof fn !== "function" || accessorKey(fn) !== undefined) continue;
    const own = aggs[field];
    const agg = typeof own === "function" && !isDefaultAgg(own) ? (own as Aggregator) : DEFAULT_AGGS[field];
    (out ??= {})[field] = agg(rows, d => (fn as RowAccessor)(d, rows.indexOf(d)));
  }
  return out;
}

/** The value fields' accessors, as stored on the chart. */
const fieldAccessors = (viz: VizInstance): Partial<Record<ValueField, unknown>> =>
  Object.fromEntries(VALUE_FIELDS.map(f => [f, viz.schema[f]]));

/** The function-read fields' values kept beside each merged row. */
const mergedValues = new WeakMap<VizInstance, WeakMap<DataPoint, Partial<Record<ValueField, unknown>>>>();

/**
    Installs Candlestick's row merging on a chart: before each draw, the
    defaults for key-read fields go into `aggs`; as rows merge, the
    function-read fields' values are aggregated beside the merged row.
    @param viz The chart.
*/
export function installAggregation(viz: VizInstance): void {
  const kept = new WeakMap<DataPoint, Partial<Record<ValueField, unknown>>>();
  mergedValues.set(viz, kept);
  viz._mergeRows = (leaves: DataPoint[]) => {
    const d = merge(leaves, viz.schema.aggs) as DataPoint;
    if (leaves.length > 1) {
      const values = aggregateFunctionFields(leaves, fieldAccessors(viz), viz.schema.aggs);
      if (values) kept.set(d, values);
    }
    return d;
  };
}

/** Points `aggs` at the defaults for the chart's key-read fields; run before each draw. */
export function syncChartAggs(viz: VizInstance): void {
  syncDefaultAggs(viz.schema.aggs, fieldAccessors(viz));
}

/**
    The chart's accessor for `field`: the merged value when the row was
    merged from several rows and the field is read by a function, else the
    field's own accessor.
    @param viz The chart.
    @param field The value field.
*/
export function fieldAccessor(viz: VizInstance, field: ValueField): RowAccessor {
  return (d, i) => {
    const values = mergedValues.get(viz)?.get(d);
    return values && field in values ? values[field] : (viz.schema[field] as RowAccessor)(d, i);
  };
}

/** The chart's open/high/low/close accessors, reading merged values where rows merged. */
export function ohlcAccessors(viz: VizInstance): OhlcAccessors {
  return {
    open: fieldAccessor(viz, "open"),
    high: fieldAccessor(viz, "high"),
    low: fieldAccessor(viz, "low"),
    close: fieldAccessor(viz, "close"),
  };
}
