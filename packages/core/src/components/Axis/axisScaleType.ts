/**
    The scales an Axis draws, and how it reads its `scale` setting: `"utc"`
    is a time scale in UTC, `"auto"` picks a scale for the values, and a
    name it doesn't draw warns once and draws linear.
*/
import {deviation, mean} from "d3-array";

import {warnConfig} from "../../utils/configWarnings.js";
import type Axis from "./Axis.js";

/** The scales an Axis draws: `AxisConfig.scale`'s names, but `"auto"`, which picks one of them (see `autoAxisScale`). */
export const axisScales = [
  "band",
  "linear",
  "log",
  "ordinal",
  "point",
  "pow",
  "sqrt",
  "time",
  "utc",
] as const;

/** A scale an Axis draws. */
export type AxisScaleName = (typeof axisScales)[number];

/**
    Whether a `scale` setting draws time: `"time"`, or `"utc"` (time in UTC).
    @param scale The setting.
*/
export const isTimeScaleName = (scale: unknown): boolean =>
  scale === "time" || scale === "utc";

/**
    The scale `"auto"` picks for an axis's values (a Plot's, or a standalone
    Axis's data, else its domain): `"time"` for Dates, `"band"` when any is
    a string, and for numbers `"log"` when their spread is over three times
    their mean, else `"linear"`. Missing values (`undefined`, `null`,
    `false`, `NaN`) are skipped.
    @param values The axis's values.
*/
export function autoAxisScale(
  values: readonly unknown[],
): "time" | "band" | "log" | "linear" {
  const given = values.filter(
    v =>
      v !== undefined &&
      v !== null &&
      v !== false &&
      !(typeof v === "number" && isNaN(v)),
  );
  if (!given.length) return "linear";
  if (given.every(v => v instanceof Date)) return "time";
  if (given.some(v => typeof v === "string")) return "band";
  const numbers = given.map(Number);
  return deviation(numbers)! / mean(numbers)! > 3 ? "log" : "linear";
}

/**
    The scale an Axis draws for its `scale` setting: the setting when the
    Axis draws it, else `"linear"`, with a warning naming the scales it
    draws.
    @param scale The setting.
*/
export function drawnAxisScale(scale: unknown): AxisScaleName {
  if (axisScales.includes(scale as AxisScaleName))
    return scale as AxisScaleName;
  warnConfig(
    `Axis received unknown scale ${JSON.stringify(scale) ?? String(scale)}; using "linear". ` +
      `Use one of ${axisScales.map(d => `"${d}"`).join(", ")}.`,
  );
  return "linear";
}

/**
    Sets the scale of an Axis given `scale("auto")` for this layout pass:
    the one `autoAxisScale` picks for its data, else its domain.
    @param axis The axis.
*/
export function resolveAutoScale(axis: Axis): void {
  if (!axis._autoScale) return;
  const data = (axis._data ?? []) as unknown[];
  axis.schema.scale = autoAxisScale(
    data.length ? data : ((axis.schema.domain ?? []) as unknown[]),
  );
}
