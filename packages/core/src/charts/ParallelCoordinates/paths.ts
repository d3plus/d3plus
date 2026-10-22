/**
    ParallelCoordinates line geometry: where a row crosses each axis, and the
    path through those crossings.
*/

import {curveBumpX, curveBumpY, curveLinear, line} from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import {isMissing} from "./dimensions.js";

/** `"horizontal"` lays the axes out left to right (each axis vertical); `"vertical"` stacks them top to bottom. */
export type ParallelOrient = "horizontal" | "vertical";

/** `"linear"` draws straight segments; `"bump"` eases into and out of each axis. */
export type ParallelCurve = "linear" | "bump";

/** One axis as the line geometry sees it: where it sits and how it places a value. */
export interface LineAxis {
  key: string;
  /** The axis line's position across the layout (x when horizontal, y when vertical). */
  offset: number;
  /** A value's position along the axis, or NaN when it has none. */
  position: (v: number | string) => number;
}

/**
    The point where `row` crosses each axis, in axis order, or null where the
    row has no value (or the value has no place on the axis).
*/
export function linePoints(
  row: DataPoint,
  axes: LineAxis[],
  orient: ParallelOrient = "horizontal",
): ([number, number] | null)[] {
  return axes.map(axis => {
    const v = row[axis.key];
    if (isMissing(v)) return null;
    const p = axis.position(v as number | string);
    if (typeof p !== "number" || !Number.isFinite(p)) return null;
    return orient === "horizontal" ? [axis.offset, p] : [p, axis.offset];
  });
}

/**
    The SVG path through `points`, broken wherever a point is null. A `"bump"`
    curve leaves and enters each axis square to it.
*/
export function parallelPath(
  points: ([number, number] | null)[],
  curve: ParallelCurve = "linear",
  orient: ParallelOrient = "horizontal",
): string {
  const factory =
    curve === "bump"
      ? orient === "horizontal"
        ? curveBumpX
        : curveBumpY
      : curveLinear;
  const gen = line<[number, number] | null>()
    .defined(p => p !== null)
    .x(p => (p as [number, number])[0])
    .y(p => (p as [number, number])[1])
    .curve(factory);
  return gen(points) ?? "";
}
