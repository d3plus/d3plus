/**
    Path-length helpers for dashing part of a line: flatten a d3 curve into a
    polyline, measure how far along it a given position lies, and build the
    dash array that draws the line solid up to there and dashed after.
*/
import {line as d3Line} from "d3-shape";

import {curveFactory} from "./lineCurve.js";

type Point = [number, number];

/**
    The polyline a d3 curve draws through `points`, with each Bézier segment
    sampled `samples` times.
    @param points The points the curve passes through (or near, for a basis curve).
    @param curve The curve name.
    @param samples Samples per Bézier segment.
*/
export function curvePolyline(
  points: Point[],
  curve: string,
  samples = 16,
): Point[] {
  const out: Point[] = [];
  let cx = 0,
    cy = 0;
  const push = (x: number, y: number) => {
    out.push([x, y]);
    cx = x;
    cy = y;
  };
  const context = {
    moveTo: push,
    lineTo: push,
    closePath: () => undefined,
    bezierCurveTo(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x: number,
      y: number,
    ) {
      const x0 = cx,
        y0 = cy;
      for (let k = 1; k <= samples; k++) {
        const t = k / samples,
          u = 1 - t;
        const a = u * u * u,
          b = 3 * u * u * t,
          c = 3 * u * t * t,
          d = t * t * t;
        out.push([
          a * x0 + b * x1 + c * x2 + d * x,
          a * y0 + b * y1 + c * y2 + d * y,
        ]);
      }
      cx = x;
      cy = y;
    },
    quadraticCurveTo(x1: number, y1: number, x: number, y: number) {
      const x0 = cx,
        y0 = cy;
      for (let k = 1; k <= samples; k++) {
        const t = k / samples,
          u = 1 - t;
        out.push([
          u * u * x0 + 2 * u * t * x1 + t * t * x,
          u * u * y0 + 2 * u * t * y1 + t * t * y,
        ]);
      }
      cx = x;
      cy = y;
    },
  };
  d3Line()
    .curve(curveFactory(curve))
    .context(context as unknown as CanvasRenderingContext2D)(points);
  return out;
}

/**
    How far along a polyline it first reaches `at` along one axis, and its
    total length. A polyline that starts at or past `at` reaches it at `0`;
    one that never reaches it does so at its full length.
    @param line The polyline.
    @param axis `0` to measure along x, `1` along y.
    @param at The position to reach.
*/
export function splitLength(
  line: Point[],
  axis: 0 | 1,
  at: number,
): [number, number] {
  let total = 0,
    before: number | undefined;
  if (line.length) {
    const dir = Math.sign(line[line.length - 1][axis] - line[0][axis]) || 1;
    if ((line[0][axis] - at) * dir >= 0) before = 0;
  }
  for (let k = 1; k < line.length; k++) {
    const p = line[k - 1],
      q = line[k];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (
      before === undefined &&
      (p[axis] - at) * (q[axis] - at) <= 0 &&
      q[axis] !== p[axis]
    )
      before = total + len * ((at - p[axis]) / (q[axis] - p[axis]));
    total += len;
  }
  return [before ?? total, total];
}

/**
    A dash array that draws a path solid for its first `before` pixels and
    repeats `dash` over the rest, or `undefined` when nothing is left to dash.
    @param before The solid length.
    @param total The path's length.
    @param dash The dash pattern for the rest, as `[dash, gap, …]`.
*/
export function splitDash(
  before: number,
  total: number,
  dash: number[],
): number[] | undefined {
  const pattern = dash.length % 2 ? dash.concat(dash) : dash;
  const period = pattern.reduce((a, b) => a + b, 0);
  if (!(period > 0) || before >= total) return undefined;
  const out = [+before.toFixed(2), 0];
  for (let covered = 0; covered < total - before; covered += period)
    out.push(...pattern);
  return out;
}
