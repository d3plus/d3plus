/**
    The scales an Axis draws, and how it reads its `scale` setting: `"utc"`
    is a time scale in UTC, and a name it doesn't draw warns once and draws
    linear.
*/
import {warnConfig} from "../../utils/configWarnings.js";

/** The scales an Axis draws: `AxisConfig.scale`'s names, but `"auto"`, which a Plot resolves. */
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
