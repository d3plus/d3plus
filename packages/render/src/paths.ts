import {
  area as d3area,
  curveBasis,
  curveCardinal,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  line as d3line,
} from "d3-shape";
import type {CurveFactory} from "d3-shape";

import type {AreaNode, CurveName, LineNode} from "./scene.js";

const CURVES: Record<string, CurveFactory> = {
  basis: curveBasis,
  cardinal: curveCardinal,
  catmullRom: curveCatmullRom as unknown as CurveFactory,
  linear: curveLinear,
  monotoneX: curveMonotoneX,
  natural: curveNatural,
  step: curveStep,
  stepAfter: curveStepAfter,
  stepBefore: curveStepBefore,
};

/**
    Resolves a curve name to a d3-shape curve factory, defaulting to linear.
    Both the SVG and Canvas backends share this so a curve looks identical on each.
    @param name The curve name from a LineNode/AreaNode.
*/
export function curveFor(name?: CurveName): CurveFactory {
  return (name && CURVES[name]) || curveLinear;
}

/**
    Generates an SVG path string for a line node.
    @param node The line node.
*/
export function linePath(node: LineNode): string {
  const gen = d3line<[number, number]>()
    .curve(curveFor(node.curve))
    .x(p => p[0])
    .y(p => p[1]);
  return gen(node.points) ?? "";
}

/**
    Generates an SVG path string for an area node. The topline and baseline share
    x positions by index (as d3plus areas do); the area is filled between them.
    @param node The area node.
*/
export function areaPath(node: AreaNode): string {
  const {topline, baseline} = node;
  const gen = d3area<number>()
    .curve(curveFor(node.curve))
    .x((_, i) => topline[i][0])
    .y0((_, i) => (baseline[i] ? baseline[i][1] : 0))
    .y1((_, i) => topline[i][1]);
  return gen(topline.map((_, i) => i)) ?? "";
}
