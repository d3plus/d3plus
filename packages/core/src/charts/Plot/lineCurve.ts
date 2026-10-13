/**
    The curve a Plot's lines draw with: its name, read from the Line config,
    and the d3 curve factory behind a name. Shapes drawn alongside the lines
    (a fill between two of them, a dash measured along one) follow the same
    curve.
*/
import * as paths from "d3-shape";
import type {CurveFactory} from "d3-shape";

import {shapeConfigFor} from "../features/emitHelpers.js";
import type {PlotDatum} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    The d3 curve factory for a curve name ("linear", "monotoneX", …),
    falling back to linear for an unknown name.
    @param name The curve name, as Line's `curve` takes it.
*/
export function curveFactory(name: string): CurveFactory {
  const key = `curve${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  const factory = (paths as unknown as Record<string, unknown>)[key];
  return typeof factory === "function"
    ? (factory as CurveFactory)
    : paths.curveLinear;
}

/**
    The curve name a Plot's lines draw with, read from its Line config.
    @param viz The chart.
    @param d A plotted Line row, for a curve given as an accessor.
*/
export function lineCurve(viz: VizInstance, d: PlotDatum | undefined): string {
  const setting = shapeConfigFor(viz, "Line").curve;
  const name =
    typeof setting === "function" ? (d ? setting(d, d.i) : undefined) : setting;
  return typeof name === "string" && name ? name : "linear";
}
