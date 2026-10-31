/**
    Warns when a config key names a data field that no row of the chart's data
    has (a typo like `y: "vlaue"` otherwise draws an empty chart in silence).
    Only field names the user gave are checked: string config values become
    accessors remembered by `fieldAccessor`, while function accessors,
    constants, and defaults are never checked.
*/

import type {DataPoint} from "@d3plus/data";

import {canWarnOnce, warnConfigOnce} from "../../utils/configWarnings.js";
import {fieldNameOf} from "../../utils/fieldAccessor.js";
import type {VizInstance} from "./vizTypes.js";
import {displayName} from "../../utils/displayName.js";

/** A config key and the data field it names. */
export interface FieldUse {
  key: string;
  field: string;
}

/** Config keys a chart stores outside `viz.schema`. */
const SLOT_KEYS = {
  x: "_x",
  x2: "_x2",
  y: "_y",
  y2: "_y2",
  size: "_size",
  stackOrder: "_stackOrder",
} as const;

/** Schema keys that hold field names as plain strings. */
const NAME_KEYS = ["dimensions"];

/** The most field names a warning lists. */
export const MAX_LISTED_FIELDS = 10;

/**
    The data fields a chart's config names, each under the first key that
    holds its accessor (so `thresholdKey`, which some charts point at `sum` or
    `y`, only names a field the user gave it alone).
    @param viz The chart.
*/
export function fieldUses(viz: VizInstance): FieldUse[] {
  const uses = new Map<unknown, FieldUse>();
  const add = (key: string, fn: unknown) => {
    const field = fieldNameOf(fn);
    if (field !== undefined && !uses.has(fn)) uses.set(fn, {key, field});
  };
  for (const [key, slot] of Object.entries(SLOT_KEYS)) add(key, viz[slot]);
  for (const band of viz._confidenceBands ?? []) {
    add("confidence", band.lower);
    add("confidence", band.upper);
  }
  const keys = Object.keys(viz.schema).filter(k => k !== "thresholdKey");
  for (const key of [...keys, "thresholdKey"]) {
    const value: unknown = viz.schema[key];
    // An array of accessors, like `groupBy`; other arrays (such as `nodes`)
    // hold data, not config.
    if (Array.isArray(value) && typeof value[0] === "function")
      value.forEach(fn => add(key, fn));
    else add(key, value);
  }
  const out = Array.from(uses.values());
  for (const key of NAME_KEYS) {
    const value: unknown = viz.schema[key];
    const names = Array.isArray(value) ? value : [value];
    for (const field of names)
      if (typeof field === "string") out.push({key, field});
  }
  return out;
}

/**
    The rows a chart's field names are read from: its data (the user's rows,
    when the chart derives `_data` from them), plus the `nodes` and `links`
    arrays of a network chart.
    @param viz The chart.
*/
export function fieldRows(viz: VizInstance): DataPoint[][] {
  const data = viz._sourceData ?? viz._data;
  return [data, viz.schema.nodes, viz.schema.links].filter(
    (rows): rows is DataPoint[] => Array.isArray(rows),
  );
}

const isRow = (d: unknown): d is DataPoint =>
  d !== null && typeof d === "object";

/**
    Whether any row in `rowSets` has `field`.
    @param rowSets Arrays of data rows.
    @param field The field name.
*/
export function rowsHaveField(rowSets: DataPoint[][], field: string): boolean {
  return rowSets.some(rows => rows.some(d => isRow(d) && field in d));
}

/**
    Every field name in `rowSets`, in the order first seen.
    @param rowSets Arrays of data rows.
*/
export function rowFields(rowSets: DataPoint[][]): string[] {
  const names = new Set<string>();
  for (const rows of rowSets)
    for (const d of rows) if (isRow(d)) for (const k in d) names.add(k);
  return Array.from(names);
}

/**
    The warning for a config key whose field no row has, listing the first
    `MAX_LISTED_FIELDS` fields the rows do have.
    @param chart The chart's name.
    @param use The config key and the field it names.
    @param fields The fields the rows have.
*/
export function missingFieldMessage(
  chart: string,
  {key, field}: FieldUse,
  fields: string[],
): string {
  const listed = fields.slice(0, MAX_LISTED_FIELDS);
  if (fields.length > MAX_LISTED_FIELDS) listed.push("…");
  return `${chart} ${key}: no rows have '${field}'; fields are: ${listed.join(", ")}`;
}

/**
    Warns, once per key and field for each chart, about every config key that
    names a field none of the chart's rows have. Rows missing some fields are
    normal (sparse data), so a field any row has never warns, and a chart with
    no rows warns about nothing.
    @param viz The chart.
*/
export function warnMissingFields(viz: VizInstance): void {
  const id = ({key, field}: FieldUse) => `missing-field:${key}:${field}`;
  const uses = fieldUses(viz).filter(use => canWarnOnce(viz, id(use)));
  if (!uses.length) return;
  const rowSets = fieldRows(viz);
  if (!rowSets.some(rows => rows.some(isRow))) return;
  let fields: string[] | undefined;
  for (const use of uses) {
    if (rowsHaveField(rowSets, use.field)) continue;
    fields ??= rowFields(rowSets);
    warnConfigOnce(
      viz,
      id(use),
      missingFieldMessage(displayName(viz), use, fields),
    );
  }
}
