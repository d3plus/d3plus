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

/** How many numbers each SVG path command takes per segment. */
const PATH_ARITY: Record<string, number> = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0};

/**
    A path's `d` collapsed onto the line where one coordinate equals `at`:
    every point keeps its other coordinate and moves onto that line, so the
    result has the same commands and point count as `d` and morphs into it
    point by point. Relative commands keep a zero offset on the collapsed
    axis.
    @param d The SVG path data.
    @param axis The coordinate to collapse: `"x"` flattens onto the vertical
        line `x = at`, `"y"` onto the horizontal line `y = at`.
    @param at Where the collapsed coordinate lands.
*/
export function flattenPath(d: string, axis: "x" | "y", at: number): string {
  const out: string[] = [];
  let first = true;
  for (const [, cmd, args] of d.matchAll(/([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi)) {
    const lower = cmd.toLowerCase();
    const arity = PATH_ARITY[lower];
    const nums = (args.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(Number);
    if (!arity) {
      out.push(cmd + args.trim());
      continue;
    }
    const relative = cmd === lower;
    const flattened = nums.map((n, i) => {
      const j = i % arity;
      // A relative moveto's first pair is absolute when it opens the path.
      const value = relative && !(first && lower === "m" && i < 2) ? 0 : at;
      if (lower === "h") return axis === "x" ? value : n;
      if (lower === "v") return axis === "y" ? value : n;
      if (lower === "a") return j === (axis === "x" ? 5 : 6) ? value : n;
      return j % 2 === (axis === "x" ? 0 : 1) ? value : n;
    });
    first = false;
    out.push(cmd + flattened.join(","));
  }
  return out.join("");
}
