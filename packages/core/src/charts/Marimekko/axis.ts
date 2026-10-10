/**
    Marimekko's value axis: a 100%-stacked (`"expand"`) chart reads its
    0–1 stack extent as percentages.
*/
import {formatAbbreviate} from "@d3plus/format";

import {valueAxis} from "../Plot/baselineBreak.js";
import {resolveStackOffset} from "../Plot/stackHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** Whether the chart stacks to 100% (d3's `stackOffsetExpand`). */
export function isExpandOffset(viz: VizInstance): boolean {
  return viz._stackOffset === resolveStackOffset("expand");
}

/** `fraction` (0–1) as a locale-formatted percentage. */
export function percentText(fraction: number, locale?: string): string {
  return `${formatAbbreviate(fraction * 100, locale)}%`;
}

/**
    The axis config Marimekko supplies beneath the user's `xConfig`/`yConfig`:
    percentage ticks ending at 100% on the value axis while stacked to 100%, nothing
    otherwise.
*/
export function marimekkoAxisDefaults(viz: VizInstance): {x?: Record<string, unknown>; y?: Record<string, unknown>} {
  if (!viz.schema.stacked || !isExpandOffset(viz)) return {};
  // The stack tops can land a rounding error above 1; "none" keeps 100% as the top tick.
  return {[valueAxis(viz)]: {rounding: "none", tickFormat: (v: number) => percentText(v, viz.schema.locale)}};
}
