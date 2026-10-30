/**
    Hexbin's pure density-contour helpers: a kernel density estimate of the
    points in pixel space (d3-contour's `contourDensity`), cut at threshold
    levels, each level's region as an SVG path.

    Levels are in points per bin: the density (points per square pixel)
    times the area of one bin, so a level reads as the count a bin would
    hold there and shares the bins' color scale.

    @module
*/

import {contourDensity} from "d3-contour";
import {ticks} from "d3-array";

import type {PixelPoint} from "./binning.js";

/** A GeoJSON MultiPolygon's coordinates: polygons of rings of points. */
type MultiPolygonCoords = number[][][][];

/** One contour level: its threshold and its region's outline. */
export interface ContourLevel {
  level: number;
  path: string;
}

/** What a density contour pass needs. */
export interface ContourOptions {
  /** The plot's left and top edge, in pixels: the density grid's origin. */
  left: number;
  top: number;
  /** The plot's size, in pixels. */
  width: number;
  height: number;
  /** The kernel's standard deviation, in pixels. */
  bandwidth: number;
  /** About how many levels to draw (rounded to nice values), or the levels themselves. */
  thresholds: number | number[];
  /** Square pixels per level unit: the area of one bin. */
  unit: number;
}

/**
    The levels to cut a density whose peak is `max` at: the given levels
    above zero (sorted), or about `thresholds` nice values between zero and
    the peak.
*/
export function contourLevels(
  max: number,
  thresholds: number | number[],
): number[] {
  if (Array.isArray(thresholds))
    return thresholds
      .filter(t => Number.isFinite(t) && t > 0)
      .sort((a, b) => a - b);
  if (!(max > 0) || !(thresholds > 0)) return [];
  return ticks(0, max, thresholds).filter(t => t > 0 && t < max);
}

/** A MultiPolygon's rings as one absolute SVG path, shifted by `[dx, dy]`. */
export function contourPath(
  coordinates: MultiPolygonCoords,
  [dx, dy]: [number, number] = [0, 0],
): string {
  const round = (n: number) => Math.round(n * 100) / 100;
  return coordinates
    .flatMap(polygon =>
      polygon.map(
        ring =>
          `M${ring.map(([x, y]) => `${round(x + dx)},${round(y + dy)}`).join("L")}Z`,
      ),
    )
    .join("");
}

/** d3-contour v4's density `contours` method, which its typings predate. */
interface DensityContours {
  (threshold: number): {coordinates: MultiPolygonCoords};
  max: number;
}

/**
    The density contours of `points`, one per level that encloses any area,
    lowest level first.
*/
export function densityContours(
  points: PixelPoint[],
  options: ContourOptions,
): ContourLevel[] {
  const {left, top, width, height, bandwidth, unit} = options;
  const valid = points.filter(
    p => Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  if (!valid.length || !(width > 0) || !(height > 0) || !(unit > 0)) return [];
  const density = contourDensity<PixelPoint>()
    .x(p => p.x - left)
    .y(p => p.y - top)
    .weight(p =>
      typeof p.weight === "number" && Number.isFinite(p.weight) ? p.weight : 1,
    )
    .size([Math.ceil(width), Math.ceil(height)])
    .bandwidth(Math.max(bandwidth, 0.5));
  const contours = (
    density as unknown as {contours(data: PixelPoint[]): DensityContours}
  ).contours(valid);
  return contourLevels(contours.max * unit, options.thresholds)
    .map(level => ({
      level,
      path: contourPath(contours(level / unit).coordinates, [left, top]),
    }))
    .filter(c => c.path.length);
}
