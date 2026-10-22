/**
    Marimekko's axes: a 100%-stacked (`"expand"`) chart reads its 0–1 stack
    extent as percentages, and its small multiples label the value axis only
    along the grid's outer edge.
*/
import {formatAbbreviate} from "@d3plus/format";

import type {FacetAxes} from "../facet/facetConfig.js";
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
export function marimekkoAxisDefaults(viz: VizInstance): {
  x?: Record<string, unknown>;
  y?: Record<string, unknown>;
} {
  if (!viz.schema.stacked || !isExpandOffset(viz)) return {};
  // The stack tops can land a rounding error above 1; "none" keeps 100% as the top tick.
  return {
    [valueAxis(viz)]: {
      rounding: "none",
      tickFormat: (v: number) => percentText(v, viz.schema.locale),
    },
  };
}

/**
    Marimekko's default `facetConfig.axes`: each panel's categories sit at its
    own bars' centers, so every panel labels its category axis, while the
    value axis (the same 0–100% in every panel) is labeled only along the
    grid's outer edge, leaving the other panels' bars the room.
*/
export function marimekkoFacetAxes(viz: VizInstance): FacetAxes {
  return valueAxis(viz) === "y"
    ? {x: "all", y: "outer"}
    : {x: "outer", y: "all"};
}

/** While stacked to 100%, the value axis reads 0–100% in every panel, even with independent scales. */
export function marimekkoFixedAxes(viz: VizInstance): {
  x?: boolean;
  y?: boolean;
} {
  return viz.schema.stacked && isExpandOffset(viz)
    ? {[valueAxis(viz)]: true}
    : {};
}
