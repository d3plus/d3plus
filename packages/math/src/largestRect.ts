import {extent, merge, range} from "d3-array";
import {polygonArea, polygonCentroid, polygonContains} from "d3-polygon";

import type {Point} from "./lineIntersection.js";
import polygonInside from "./polygonInside.js";
import polygonRayCast from "./polygonRayCast.js";
import polygonRotate from "./polygonRotate.js";
import simplify from "./simplify.js";
import pointDistanceSquared from "./pointDistanceSquared.js";

// Algorithm constants
const aspectRatioStep = 0.5; // step size for the aspect ratio
const angleStep = 5; // step size for angles (in degrees); has linear impact on running time

interface LargestRectEvent {
  type: string;
  [key: string]: unknown;
}

/**
    @typedef {Object} largestRect
    The returned Object of the largestRect function.
    @property {Number} width The width of the rectangle
    @property {Number} height The height of the rectangle
    @property {Number} cx The x coordinate of the rectangle's center
    @property {Number} cy The y coordinate of the rectangle's center
    @property {Number} angle The rotation angle of the rectangle in degrees. The anchor of rotation is the center point.
    @property {Number} area The area of the largest rectangle.
    @property {Array} points An array of x/y coordinates for each point in the rectangle, useful for rendering paths.
*/

export interface LargestRectResult {
  width: number;
  height: number;
  cx: number;
  cy: number;
  angle: number;
  area: number;
  points: Point[];
  events?: LargestRectEvent[];
}

export interface LargestRectOptions {
  angle?: number | string | number[];
  aspectRatio?: number | string | number[];
  maxAspectRatio?: number;
  minAspectRatio?: number;
  nTries?: number;
  minHeight?: number;
  minWidth?: number;
  tolerance?: number;
  origin?: Point | Point[];
  cache?: boolean;
  verbose?: boolean;
  events?: boolean;
}

const polyCache: Record<string, LargestRectResult | null> = {};

/**
    Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspect ratios.

An angle of zero means that the longer side of the polygon (the width) will be aligned with the x axis. An angle of 90 and/or -90 means that the longer side of the polygon (the width) will be aligned with the y axis. The value can be a number between -90 and 90 specifying the angle of rotation of the polygon, a string which is parsed to a number, or an array of numbers specifying the possible rotations of the polygon.
    @author Daniel Smilkov [dsmilkov@gmail.com]
    @param poly An Array of points that represent a polygon.
    @param options An Object that allows for overriding various parameters of the algorithm.
    @param options.angle The allowed rotations of the final rectangle.
    @param options.aspectRatio The ratio between the width and height of the rectangle. The value can be a number, a string which is parsed to a number, or an array of numbers specifying the possible aspect ratios of the final rectangle.
    @param options.maxAspectRatio The maximum aspect ratio (width/height) allowed for the rectangle. This property should only be used if the aspectRatio is not provided.
    @param options.minAspectRatio The minimum aspect ratio (width/height) allowed for the rectangle. This property should only be used if the aspectRatio is not provided.
    @param options.nTries The number of randomly drawn points inside the polygon which the algorithm explores as possible center points of the maximal rectangle.
    @param options.minHeight The minimum height of the rectangle.
    @param options.minWidth The minimum width of the rectangle.
    @param options.tolerance The simplification tolerance factor, between 0 and 1. A larger tolerance corresponds to more extensive simplification.
    @param options.origin The center point of the rectangle. If specified, the rectangle will be fixed at that point, otherwise the algorithm optimizes across all possible points. The given value can be either a two dimensional array specifying the x and y coordinate of the origin or an array of two dimensional points specifying multiple possible center points of the rectangle.
    @param options.cache Whether or not to cache the result, which would be used in subsequent calculations to preserve consistency and speed up calculation time.
    @defaultValue
```
{
  angle: d3.range(-90, 95, 5),
  cache: true,
  maxAspectRatio: 15,
  minAspectRatio: 1,
  minHeight: 0,
  minWidth: 0,
  nTries: 20,
  tolerance: 0.02,
  verbose: false,
}
```
*/
export default function (
  poly: Point[],
  options: LargestRectOptions = {},
): LargestRectResult | null {
  if (poly.length < 3) {
    if (options.verbose)
      console.error("polygon has to have at least 3 points", poly);
    return null;
  }

  // For visualization debugging purposes
  const events: LargestRectEvent[] = [];

  // User's input normalization
  const opts = Object.assign(
    {
      angle: range(-90, 90 + angleStep, angleStep),
      cache: true,
      maxAspectRatio: 15,
      minAspectRatio: 1,
      minHeight: 0,
      minWidth: 0,
      nTries: 20,
      tolerance: 0.02,
      verbose: false,
    },
    options,
  ) as Required<
    Pick<
      LargestRectOptions,
      | "angle"
      | "cache"
      | "maxAspectRatio"
      | "minAspectRatio"
      | "minHeight"
      | "minWidth"
      | "nTries"
      | "tolerance"
      | "verbose"
    >
  > &
    LargestRectOptions;

  const angles: number[] =
    opts.angle instanceof Array
      ? opts.angle
      : typeof opts.angle === "number"
        ? [opts.angle]
        : typeof opts.angle === "string" && !isNaN(Number(opts.angle))
          ? [Number(opts.angle)]
          : [];

  const aspectRatios: number[] =
    opts.aspectRatio instanceof Array
      ? opts.aspectRatio
      : typeof opts.aspectRatio === "number"
        ? [opts.aspectRatio]
        : typeof opts.aspectRatio === "string" &&
            !isNaN(Number(opts.aspectRatio))
          ? [Number(opts.aspectRatio)]
          : [];

  const origins: Point[] =
    opts.origin && opts.origin instanceof Array
      ? (opts.origin as Point[])[0] instanceof Array
        ? (opts.origin as Point[])
        : [opts.origin as Point]
      : [];

  let cacheString: string | undefined;
  if (opts.cache) {
    cacheString = merge(poly as unknown as unknown[][]).join(",");
    cacheString += `-${opts.minAspectRatio}`;
    cacheString += `-${opts.maxAspectRatio}`;
    cacheString += `-${opts.minHeight}`;
    cacheString += `-${opts.minWidth}`;
    cacheString += `-${angles.join(",")}`;
    cacheString += `-${origins.join(",")}`;
    if (polyCache[cacheString!]) return polyCache[cacheString!];
  }

  const area = Math.abs(polygonArea(poly)); // take absolute value of the signed area
  if (area === 0) {
    if (opts.verbose) console.error("polygon has 0 area", poly);
    return null;
  }
  // get the width of the bounding box of the original polygon to determine tolerance
  let [minx, maxx] = extent(poly, (d: Point) => d[0]) as [number, number];
  let [miny, maxy] = extent(poly, (d: Point) => d[1]) as [number, number];

  // simplify polygon
  const tolerance = Math.min(maxx - minx, maxy - miny) * opts.tolerance;

  if (tolerance > 0) poly = simplify(poly, tolerance);
  if (opts.events) events.push({type: "simplify", poly});

  // get the width of the bounding box of the simplified polygon
  [minx, maxx] = extent(poly, (d: Point) => d[0]) as [number, number];
  [miny, maxy] = extent(poly, (d: Point) => d[1]) as [number, number];
  const [boxWidth, boxHeight] = [maxx - minx, maxy - miny];

  // discretize the binary search for optimal width to a resolution of this times the polygon width
  const widthStep = Math.min(boxWidth, boxHeight) / 50;

  // populate possible center points with random points inside the polygon
  if (!origins.length) {
    // get the centroid of the polygon
    const centroid = polygonCentroid(poly) as Point;
    if (!isFinite(centroid[0])) {
      if (opts.verbose) console.error("cannot find centroid", poly);
      return null;
    }
    if (polygonContains(poly, centroid)) origins.push(centroid);

    let nTries = opts.nTries;
    // get few more points inside the polygon
    while (nTries) {
      const rndX = Math.random() * boxWidth + minx;
      const rndY = Math.random() * boxHeight + miny;
      const rndPoint: Point = [rndX, rndY];
      if (polygonContains(poly, rndPoint)) {
        origins.push(rndPoint);
      }
      nTries--;
    }
  }
  if (opts.events) events.push({type: "origins", points: origins});
  let maxArea = 0;
  let maxRect: LargestRectResult | null = null;

  for (let ai = 0; ai < angles.length; ai++) {
    const angle = angles[ai];
    const angleRad = (-angle * Math.PI) / 180;
    if (opts.events) events.push({type: "angle", angle});
    for (let i = 0; i < origins.length; i++) {
      const origOrigin = origins[i];
      // generate improved origins
      const [p1W, p2W] = polygonRayCast(poly, origOrigin, angleRad);
      const [p1H, p2H] = polygonRayCast(
        poly,
        origOrigin,
        angleRad + Math.PI / 2,
      );
      const modifOrigins: Point[] = [];
      if (p1W && p2W)
        modifOrigins.push([(p1W[0] + p2W[0]) / 2, (p1W[1] + p2W[1]) / 2]); // average along with width axis
      if (p1H && p2H)
        modifOrigins.push([(p1H[0] + p2H[0]) / 2, (p1H[1] + p2H[1]) / 2]); // average along with height axis

      if (opts.events)
        events.push({
          type: "modifOrigin",
          idx: i,
          p1W,
          p2W,
          p1H,
          p2H,
          modifOrigins,
        });

      for (let i = 0; i < modifOrigins.length; i++) {
        const origin = modifOrigins[i];

        if (opts.events)
          events.push({type: "origin", cx: origin[0], cy: origin[1]});

        const [p1W, p2W] = polygonRayCast(poly, origin, angleRad);
        if (p1W === null || p2W === null) continue;
        const minSqDistW = Math.min(
          pointDistanceSquared(origin, p1W),
          pointDistanceSquared(origin, p2W),
        );
        const maxWidth = 2 * Math.sqrt(minSqDistW);

        const [p1H, p2H] = polygonRayCast(poly, origin, angleRad + Math.PI / 2);
        if (p1H === null || p2H === null) continue;
        const minSqDistH = Math.min(
          pointDistanceSquared(origin, p1H),
          pointDistanceSquared(origin, p2H),
        );
        const maxHeight = 2 * Math.sqrt(minSqDistH);

        if (maxWidth * maxHeight < maxArea) continue;

        let aRatios = aspectRatios;
        if (!aRatios.length) {
          const minAspectRatio = Math.max(
            opts.minAspectRatio,
            opts.minWidth / maxHeight,
            maxArea / (maxHeight * maxHeight),
          );
          const maxAspectRatio = Math.min(
            opts.maxAspectRatio,
            maxWidth / opts.minHeight,
            (maxWidth * maxWidth) / maxArea,
          );
          aRatios = range(
            minAspectRatio,
            maxAspectRatio + aspectRatioStep,
            aspectRatioStep,
          );
        }

        for (let a = 0; a < aRatios.length; a++) {
          const aRatio = aRatios[a];

          // do a binary search to find the max width that works
          let left = Math.max(opts.minWidth, Math.sqrt(maxArea * aRatio));
          let right = Math.min(maxWidth, maxHeight * aRatio);
          if (right * maxHeight < maxArea) continue;

          if (opts.events && right - left >= widthStep)
            events.push({type: "aRatio", aRatio});

          while (right - left >= widthStep) {
            const width = (left + right) / 2;
            const height = width / aRatio;
            const [cx, cy] = origin;
            let rectPoly: Point[] = [
              [cx - width / 2, cy - height / 2],
              [cx + width / 2, cy - height / 2],
              [cx + width / 2, cy + height / 2],
              [cx - width / 2, cy + height / 2],
            ];
            rectPoly = polygonRotate(rectPoly, angleRad, origin);
            const insidePoly = polygonInside(rectPoly, poly);
            if (insidePoly) {
              // we know that the area is already greater than the maxArea found so far
              maxArea = width * height;
              rectPoly.push(rectPoly[0]);
              maxRect = {
                area: maxArea,
                cx,
                cy,
                width,
                height,
                angle: -angle,
                points: rectPoly,
              };
              left = width; // increase the width in the binary search
            } else {
              right = width; // decrease the width in the binary search
            }
            if (opts.events)
              events.push({
                type: "rectangle",
                areaFraction: (width * height) / area,
                cx,
                cy,
                width,
                height,
                angle,
                insidePoly,
              });
          }
        }
      }
    }
  }

  if (opts.cache) {
    polyCache[cacheString!] = maxRect;
  }

  return opts.events
    ? Object.assign(maxRect || ({} as LargestRectResult), {events})
    : maxRect;
}
