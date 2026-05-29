/**
    Shared geometry helpers for chart `_draw` methods and layout stages.

    Three patterns repeat across every chart subclass + layout stage:

      1. Compute the margin-adjusted chart-area width/height.
      2. Compute the chart's `_chartTransform` (where the chart-cells
         group sits relative to the svg origin).
      3. Pull the nested data slice for the current draw depth.

    Centralizing these into one module:
      - removes 14+ lines of duplication across the codebase
      - gives one place to fix coord-system bugs
      - makes the chart classes' `_draw` bodies easier to scan
      - removes the temptation to inline a slightly-different variant

    @module
*/

import type {Transform} from "@d3plus/render";
import type {VizInstance as Viz} from "./vizTypes.js";

/**
    Margin-adjusted chart-area dimensions. Replaces the pattern:

      const height = viz.schema.height - viz._margin.top - viz._margin.bottom;
      const width = viz.schema.width - viz._margin.left - viz._margin.right;
*/
export function chartBounds(viz: Viz): {width: number; height: number} {
  return {
    width: viz.schema.width - viz._margin.left - viz._margin.right,
    height: viz.schema.height - viz._margin.top - viz._margin.bottom,
  };
}

/**
    Build a `_chartTransform` that places the chart-cells group at the
    margin origin. Replaces the pattern:

      this._chartTransform = {x: this._margin.left, y: this._margin.top};

    Used by Tree, Network, Rings, Sankey, Treemap, etc. — every
    rectangular chart whose data lays out from the top-left of the
    chart area.
*/
export function marginOriginTransform(viz: Viz): Transform {
  return {x: viz._margin.left, y: viz._margin.top};
}

/**
    Build a `_chartTransform` that centers the chart-cells group within
    the chart area. Replaces the pattern:

      this._chartTransform = {
        x: this._margin.left + width / 2,
        y: this._margin.top + height / 2,
      };

    Used by Pie, Donut, RadialMatrix, Radar — every chart whose data
    lays out around a center point (polar / circular geometry).

    Width and height are the margin-adjusted chart-area dimensions —
    callers usually have them on hand from `chartBounds(viz)` or from
    fields a stage stashed (e.g. `_pieWidth` / `_radialMatrixWidth`).
*/
export function centerChartTransform(
  viz: Viz,
  width: number,
  height: number,
): Transform {
  return {
    x: viz._margin.left + width / 2,
    y: viz._margin.top + height / 2,
  };
}
