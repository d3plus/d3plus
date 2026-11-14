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
import {interpolatePath} from "d3-interpolate-path";

import {pathCommands} from "@d3plus/math";

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
  return pathCommands(d)
    .map(({command, segments}, c) => {
      const lower = command.toLowerCase();
      const relative = command === lower;
      const flattened = segments.map((segment, s) => {
        // A relative moveto's first pair is absolute when it opens the path.
        const value =
          relative && !(c === 0 && lower === "m" && s === 0) ? 0 : at;
        return segment.map((n, j) => {
          if (lower === "h") return axis === "x" ? value : n;
          if (lower === "v") return axis === "y" ? value : n;
          if (lower === "a") return j === (axis === "x" ? 5 : 6) ? value : n;
          return j % 2 === (axis === "x" ? 0 : 1) ? value : n;
        });
      });
      return command + flattened.flat().join(",");
    })
    .join("");
}

/**
    A path's `d` with every segment's command written out. SVG lets a
    command repeat by listing more arguments after it (`M0,0 10,0` draws a
    line after its moveto, `L1,1 2,2` two lines); this writes each repeat
    with its own letter (`M0,0L10,0`), the repeats after a moveto as
    linetos. A path with no repeats comes back as is.
    @param d The SVG path data.
*/
export function explicitPathD(d: string): string {
  const commands = pathCommands(d);
  if (commands.every(c => c.segments.length < 2)) return d;
  return commands
    .map(({command, segments}) => {
      if (!segments.length) return command;
      const repeat = command === "M" ? "L" : command === "m" ? "l" : command;
      return segments
        .map((segment, k) => (k ? repeat : command) + segment.join(","))
        .join("");
    })
    .join("");
}

/**
    Tweens one path's `d` into another's, point by point, ending on `b` as
    given, or on an empty path when `b` is missing (a shape the projection
    can't draw). Both are written out first (see `explicitPathD`): the
    tween reads one segment per command, so it would drop a repeat's
    points, and a two-point line would vanish mid-tween.
    @param a The path data to tween from.
    @param b The path data to tween to.
*/
export function interpolatePathD(a: string, b: string): (t: number) => string {
  const tween = interpolatePath(explicitPathD(a), explicitPathD(b));
  return t => (t >= 1 ? b || "" : tween(t));
}
