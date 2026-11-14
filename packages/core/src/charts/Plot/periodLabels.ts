/**
    Plot's side of period labels (`tickLabelPosition: "period"`, see
    `components/Axis/axisPeriods.ts`).
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

/**
    Whether bars (or boxes) stand on an axis's categories: each already
    spans its period, with its label centered beneath it, so the axis keeps
    its labels at their ticks.
    @param viz The Plot.
    @param axis The axis.
*/
export function barsSpanPeriods(viz: VizInstance, axis: "x" | "y"): boolean {
  if (viz.schema.discrete !== axis) return false;
  const shape = viz.schema.shape as (d: DataPoint, i: number) => unknown;
  return (viz._filteredData ?? []).some((d: DataPoint, i: number) =>
    ["Bar", "Box"].includes(shape(d, i) as string),
  );
}

/**
    An axis's user config, its `tickLabelPosition: "period"` set back to
    `"tick"` where bars span the periods (see `barsSpanPeriods`).
*/
export function periodAxisConfig(
  viz: VizInstance,
  axis: "x" | "y",
  user: Record<string, unknown>,
): Record<string, unknown> {
  return user.tickLabelPosition === "period" && barsSpanPeriods(viz, axis)
    ? {...user, tickLabelPosition: "tick"}
    : user;
}
