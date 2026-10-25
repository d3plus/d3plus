/**
    Precomputed boxes: when a Box is given its statistics (`boxMin`,
    `boxQ1`, `boxMedian`, `boxQ3`, `boxMax`, and optionally `boxOutliers`),
    each data row draws one box from them and nothing is computed.
*/

import type {DataPoint} from "@d3plus/data";

import {fieldAccessor} from "../utils/fieldAccessor.js";
import constant from "../utils/constant.js";
import {warnConfig} from "../utils/configWarnings.js";
import {drawsOutlier} from "./boxOutlierShape.js";
import type {Owned} from "./shapeOwners.js";
import {uniqueIds} from "./uniqueIds.js";

/** A row accessor. */
type RowFn = (d: DataPoint, i: number) => unknown;

/** The config keys that give a box its five statistics, lowest first. */
export const boxStatKeys = [
  "boxMin",
  "boxQ1",
  "boxMedian",
  "boxQ3",
  "boxMax",
] as const;

/** One row's statistics, each a finite number. */
export interface BoxSummary {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

/**
    A statistic setting as a row accessor: unset for `undefined`, `null`, or
    `false`, a data key for a string, a function as given, and any other
    value as a constant.
*/
export function toStatAccessor(value: unknown): RowFn | undefined {
  if (value === undefined || value === null || value === false)
    return undefined;
  if (typeof value === "function") return value as RowFn;
  if (typeof value === "string") return fieldAccessor(value) as RowFn;
  return constant(value as never) as RowFn;
}

/** Whether `config` sets any of the five statistics, which draws precomputed boxes. */
export function hasBoxStats(config: Record<string, unknown>): boolean {
  return boxStatKeys.some(key => typeof config[key] === "function");
}

/** The statistics `config` leaves unset, when it sets at least one. */
export function missingBoxStats(config: Record<string, unknown>): string[] {
  if (!hasBoxStats(config)) return [];
  return boxStatKeys.filter(key => typeof config[key] !== "function");
}

/** Warns, once, that a precomputed box config leaves some statistics unset. */
export function warnMissingBoxStats(
  owner: string,
  config: Record<string, unknown>,
): void {
  const missing = missingBoxStats(config);
  if (missing.length)
    warnConfig(
      `${owner} draws precomputed boxes only when ${boxStatKeys.join(", ")} are all set; missing ${missing.join(", ")}.`,
    );
}

const finite = (v: unknown): v is number =>
  typeof v === "number" ? Number.isFinite(v) : false;

/** `v` as a number: numbers and Dates convert, anything else is NaN. */
const toNumber = (v: unknown): number =>
  typeof v === "number" || v instanceof Date ? +v : NaN;

/**
    A row's outliers: `boxOutliers` as an array or a single value (what
    aggregating one row's array yields), in order, without any value that
    isn't a finite number.
*/
function readOutliers(
  config: Record<string, unknown>,
  d: DataPoint,
  i: number,
): number[] {
  const listed =
    typeof config.boxOutliers === "function"
      ? (config.boxOutliers as RowFn)(d, i)
      : undefined;
  return (Array.isArray(listed) ? listed : [listed])
    .map(toNumber)
    .filter(finite);
}

/**
    Reads one row's statistics from `config`'s accessors. The five values are
    sorted, so `min` is the smallest and `max` the largest even when they
    arrive in reverse (as pixels on a top-down axis do). Null when a
    statistic is unset or isn't a finite number.
*/
export function readBoxSummary(
  config: Record<string, unknown>,
  d: DataPoint,
  i: number,
): BoxSummary | null {
  const values: number[] = [];
  for (const key of boxStatKeys) {
    const fn = config[key];
    if (typeof fn !== "function") return null;
    const v = toNumber((fn as RowFn)(d, i));
    if (!finite(v)) return null;
    values.push(v);
  }
  values.sort((a, b) => a - b);
  const outliers = readOutliers(config, d, i);
  const [min, q1, median, q3, max] = values;
  return {min, q1, median, q3, max, outliers};
}

/**
    Every value a row's statistics place on the value axis, for widening its
    domain: each set statistic that is a finite number, then the outliers
    unless `outliers` is false (the row draws none). An incomplete set still
    contributes, so the axis holds its values even though the row draws no
    box.
*/
export function boxSummaryValues(
  config: Record<string, unknown>,
  d: DataPoint,
  i: number,
  outliers = true,
): number[] {
  const values: number[] = [];
  for (const key of boxStatKeys) {
    const fn = config[key];
    const v = typeof fn === "function" ? toNumber((fn as RowFn)(d, i)) : NaN;
    if (finite(v)) values.push(v);
  }
  return outliers ? values.concat(readOutliers(config, d, i)) : values;
}

/**
    Stamps a box datum's rect geometry from its quartiles (`first` and
    `third`): centered between them along the value axis, `rectWidth` across
    it, at `key` on the category axis.
*/
export function placeBox(d: DataPoint, key: unknown, rectWidth: number): void {
  const box = d as Record<string, unknown>;
  const first = d.first as number;
  const rectLength = (d.third as number) - first;
  if (d.orient === "vertical") {
    box.height = rectLength;
    box.width = rectWidth;
    box.x = key;
    box.y = first + rectLength / 2;
  } else if (d.orient === "horizontal") {
    box.height = rectWidth;
    box.width = rectLength;
    box.x = first + rectLength / 2;
    box.y = key;
  }
}

/** What a precomputed Box reads from its host. */
export interface SummaryBoxHost {
  schema: Record<string, unknown>;
  _data: DataPoint[];
  _owned: Map<object, Owned>;
}

/** An outlier record drawn with `shape` at `value` beside the box datum `d`. */
function outlierRecord(
  d: DataPoint,
  shape: unknown,
  value: number,
  k: number,
): DataPoint {
  const vertical = d.orient === "vertical";
  return {
    __d3plus__: true,
    data: d.data,
    i: d.i,
    id: `${d.id}-outlier-${k}`,
    outlier: shape,
    x: vertical ? d.x : value,
    y: vertical ? value : d.y,
  } as unknown as DataPoint;
}

/**
    Builds one box per row from its statistics, appending its outliers to
    `outlierData` (none when its `outlier` setting draws no point) and recording which box owns each record in `host._owned`.
    Rows without a complete set of statistics draw nothing.
*/
export function computeSummaryBoxes(
  host: SummaryBoxHost,
  outlierData: DataPoint[],
): DataPoint[] {
  const {schema} = host;
  warnMissingBoxStats("Box", schema);
  const rows = host._data
    .map((row, i) => ({row, i, stats: readBoxSummary(schema, row, i)}))
    .filter(r => r.stats);
  const orient = schema.orient as RowFn;
  const keys = rows.map(({row, i}) =>
    orient(row, i) === "vertical"
      ? (schema.x as RowFn)(row, i)
      : (schema.y as RowFn)(row, i),
  );
  const ids = uniqueIds(
    rows.map(({row, i}, n) => {
      const id = schema.id ? (schema.id as RowFn)(row, i) : undefined;
      return `${id ?? keys[n]}`;
    }),
  );
  host._owned = new Map();
  return rows.map(({row, i, stats}, n) => {
    const s = stats!;
    const d = {
      __d3plus__: true,
      key: keys[n],
      values: [row],
      data: row,
      i,
      id: ids[n],
      orient: orient(row, i),
      first: s.q1,
      median: s.median,
      third: s.q3,
      lowerLimit: s.min,
      upperLimit: s.max,
    } as unknown as DataPoint;
    placeBox(d, keys[n], (schema.rectWidth as RowFn)(row, i) as number);
    const start = outlierData.length;
    const shape = (schema.outlier as RowFn)(row, i);
    if (drawsOutlier(shape))
      s.outliers.forEach((v, k) =>
        outlierData.push(outlierRecord(d, shape, v, k)),
      );
    const owned = {datum: d, index: n};
    for (const record of [d, ...outlierData.slice(start)])
      host._owned.set(record, owned);
    return d;
  });
}
