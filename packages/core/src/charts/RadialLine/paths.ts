/**
    Path geometry for RadialLine and RadialArea: points at an angle and
    radius drawn as a line or a band through d3-shape's radial generators,
    optionally closed into a loop. Angles follow d3-shape's convention:
    radians, 0 at 12 o'clock, increasing clockwise.
*/

import {
  areaRadial,
  curveBasisClosed,
  curveCardinalClosed,
  curveCatmullRomClosed,
  curveLinearClosed,
  lineRadial,
} from "d3-shape";
import type {CurveFactory} from "d3-shape";

import {curveFactory} from "../Plot/lineCurve.js";

/** The curves that have a closed form, by name. */
const CLOSED: Partial<Record<string, CurveFactory>> = {
  basis: curveBasisClosed,
  cardinal: curveCardinalClosed,
  catmullRom: curveCatmullRomClosed as unknown as CurveFactory,
  linear: curveLinearClosed,
};

/** A point on a line: its angle and radius. */
export interface RadialLinePoint {
  angle: number;
  r: number;
}

/** A point on a band: its angle and the radii it spans. */
export interface RadialBandPoint {
  angle: number;
  r0: number;
  r1: number;
}

/** The pixel position of `angle` (radians) at radius `r`, relative to the center. */
export function polarXY(angle: number, r: number): [number, number] {
  return [r * Math.sin(angle), -r * Math.cos(angle)];
}

/**
    The curve a radial path draws with: the named d3 curve (see
    `curveFactory`), its closed form when `closed`. A curve with no closed
    form closes by repeating its first point (`repeatFirst`).
*/
export function radialCurve(
  name: string,
  closed: boolean,
): {curve: CurveFactory; repeatFirst: boolean} {
  if (!closed) return {curve: curveFactory(name), repeatFirst: false};
  const curve = CLOSED[name];
  return curve
    ? {curve, repeatFirst: false}
    : {curve: curveFactory(name), repeatFirst: true};
}

/** `points`, with the first repeated at the end when `repeat` (and there are two or more). */
const looped = <T>(points: T[], repeat: boolean): T[] =>
  repeat && points.length > 1 ? [...points, points[0]] : points;

/** The SVG path of a line through `points`, in order, looping back to the first when `closed`. */
export function radialLinePath(
  points: RadialLinePoint[],
  curveName = "linear",
  closed = true,
): string {
  if (!points.length) return "";
  const {curve, repeatFirst} = radialCurve(curveName, closed);
  return (
    lineRadial<RadialLinePoint>()
      .angle(p => p.angle)
      .radius(p => p.r)
      .curve(curve)(looped(points, repeatFirst)) ?? ""
  );
}

/**
    The SVG path of the band between each point's `r0` and `r1`, in order.
    Closed, it is a ring: the outer loop and the inner loop wound the other
    way, so the space inside the inner loop stays empty.
*/
export function radialAreaPath(
  points: RadialBandPoint[],
  curveName = "linear",
  closed = true,
): string {
  if (!points.length) return "";
  const {curve, repeatFirst} = radialCurve(curveName, closed);
  return (
    areaRadial<RadialBandPoint>()
      .angle(p => p.angle)
      .innerRadius(p => p.r0)
      .outerRadius(p => p.r1)
      .curve(curve)(looped(points, repeatFirst)) ?? ""
  );
}
