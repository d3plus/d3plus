/**
    Bar labels beside an error bar: a bar with a `confidence` bound draws a
    whisker over its end, so its label anchors at the bar's base instead
    (the left end of a horizontal bar, the bottom of an upright one), and a
    label outside the bar starts past the whisker's far end.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {finite} from "@d3plus/math";

import type {VizInstance} from "../viz/vizTypes.js";
import {confidenceValueAxis} from "./confidenceAxes.js";
import {rowConfidence} from "./confidenceTooltip.js";

/**
    How far a bar's error bar reaches past the bar's end, in pixels along the
    way the bar grows (0 when it stops short); null when the bar has no
    finite bound, so draws no error bar. Read from the source row.
    @param viz The chart.
    @param d The bar's source row.
    @param i The row's index.
*/
export function barErrorReach(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): number | null {
  if (!viz._confidence || !d) return null;
  const {lower, upper} = rowConfidence(viz, d, i);
  const bounds = [lower, upper].filter(finite);
  if (!bounds.length) return null;
  if (viz.schema.stacked) return 0;
  const axisKey = confidenceValueAxis(viz);
  const axis = axisKey === "y" ? viz._yAxis : viz._xAxis;
  const accessor = axisKey === "y" ? viz._y : viz._x;
  const value = accessor ? Number(accessor(d, i)) : NaN;
  if (!axis || !finite(value)) return 0;
  const pos = (v: number) => axis._getPosition(v) as number;
  const end = pos(value);
  const grow = Math.sign(end - pos(0)) || (axisKey === "y" ? -1 : 1);
  const reach = Math.max(...bounds.map(b => grow * (pos(b) - end)));
  return Number.isFinite(reach) ? Math.max(0, reach) : 0;
}

/**
    Flips a bar label's anchor from the bar's end to its base: `"start"` ↔
    `"end"` (and `"top"` ↔ `"bottom"`); `"middle"` stays.
    @param anchor The anchor the label takes without an error bar.
*/
export function anchorAtBase(anchor: string): string {
  const flipped: Record<string, string> = {
    start: "end",
    end: "start",
    top: "bottom",
    bottom: "top",
  };
  return flipped[anchor] ?? anchor;
}
