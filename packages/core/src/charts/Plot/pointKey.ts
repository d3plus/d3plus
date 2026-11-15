import type {PlotDatum} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {vizDiscrete} from "../viz/discrete.js";

/**
    The key a Plot's lines and areas give each point (see `Line.pointKey`):
    its value on the discrete axis (or that axis's secondary axis), so a
    redraw with more or fewer rows slides them along.
    @param viz The chart.
*/
export function plotPointKey(viz: VizInstance): (d: PlotDatum) => unknown {
  const axis = vizDiscrete(viz) === "y" ? "y" : "x";
  return (d: PlotDatum) => d[`${axis}2`] ?? d[axis];
}
