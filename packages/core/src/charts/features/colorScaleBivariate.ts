/**
    A bivariate `colorScale`: two fields (`colorScale: ["a", "b"]`) read as
    one accessor that returns each row's pair of values, which the chart's
    ColorScale bins and colors from a grid (see
    `components/ColorScale/bivariateScale.ts`). Rows missing either value
    have no colorScale value, like a row missing the one field of a
    single-variable colorScale.
*/
import type {DataPoint} from "@d3plus/data";

import {
  bivariateAxisLabels,
  colorScaleValueFormat,
} from "../../components/ColorScale/bivariateRender.js";
import type {BivariateScale} from "../../components/ColorScale/bivariateScale.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Accessor = (d: DataPoint, i: number) => unknown;

/** What a bivariate accessor reads: its two accessors and the field names behind them. */
export interface BivariateSpec {
  accessors: [Accessor, Accessor];
  fields: [string | undefined, string | undefined];
}

const specs = new WeakMap<object, BivariateSpec>();

/** `value` as a finite number, or null (null, undefined, "", and non-numbers have none). */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = +value;
  return Number.isFinite(n) ? n : null;
}

/** Whether `value` names a bivariate `colorScale`: two keys or accessors. */
export function isBivariateSetting(value: unknown): value is unknown[] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(v => typeof v === "string" || typeof v === "function")
  );
}

/**
    The accessor a bivariate `colorScale` stores: each row's two values as a
    `[first, second]` pair of numbers, or undefined when either is missing.
    @param fields The two data keys or accessors.
*/
export function bivariateAccessor(
  fields: unknown[],
): (d: DataPoint, i: number) => [number, number] | undefined {
  const accessors = fields.map(f =>
    typeof f === "function" ? (f as Accessor) : fieldAccessor(f as string),
  ) as [Accessor, Accessor];
  const fn = (d: DataPoint, i: number): [number, number] | undefined => {
    const a = toNumber(accessors[0](d, i));
    const b = toNumber(accessors[1](d, i));
    return a === null || b === null ? undefined : [a, b];
  };
  specs.set(fn, {
    accessors,
    fields: fields.map(f => (typeof f === "string" ? f : undefined)) as [
      string | undefined,
      string | undefined,
    ],
  });
  return fn;
}

/** The bivariate setting behind a stored `colorScale`, or null for any other. */
export function bivariateOf(fn: unknown): BivariateSpec | null {
  return (typeof fn === "function" && specs.get(fn)) || null;
}

/** The chart's bivariate `colorScale` setting, or null when it has none. */
export function bivariateSpec(viz: VizInstance): BivariateSpec | null {
  return bivariateOf(viz.schema.colorScale);
}

/**
    The names a chart gives its bivariate scale's variables when
    `bivariateLabels` doesn't: each field's name, or "Value 1" / "Value 2"
    for an accessor.
    @param viz The chart.
    @param spec Its bivariate setting.
*/
export function bivariateFieldNames(
  viz: VizInstance,
  spec: BivariateSpec,
): [string, string] {
  return spec.fields.map(
    (field, k) => field ?? `${viz.schema.translate("Value")} ${k + 1}`,
  ) as [string, string];
}

/**
    The tooltip rows a chart's bivariate `colorScale` adds for a row: each
    variable's name (as the key labels it) and the row's value, formatted
    as the key formats its ranges. A variable the row has no value for gets
    no row; a colorScale cell, or a chart without a bivariate scale, gets
    none at all.
    @param viz The chart.
    @param d The hovered row.
    @param i Its index.
*/
export function bivariateTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  const spec = bivariateSpec(viz);
  const cs = viz._colorScaleClass;
  if (!spec || !cs || !d || typeof d !== "object") return [];
  if ((d as {_isColorScaleBucket?: boolean})._isColorScaleBucket) return [];
  const labels = bivariateAxisLabels(cs);
  const scale = cs._colorScale as unknown as Partial<BivariateScale>;
  const pairs = typeof scale?.domain === "function" ? scale.domain() : [];
  const rows: [string, string][] = [];
  spec.accessors.forEach((accessor, k) => {
    const value = toNumber(accessor(d, i));
    if (value === null) return;
    const values = pairs.map(p => (Array.isArray(p) ? p[k] : NaN));
    rows.push([labels[k], colorScaleValueFormat(cs, values)(value)]);
  });
  return rows;
}
