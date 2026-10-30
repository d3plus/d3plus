/**
    Hexbin's pure binning helpers: points in pixel space grouped into
    hexagons (d3-hexbin) or squares of a fixed pixel size, each bin's
    measure (a count, or a sum or mean of a value), and its outline.

    @module
*/

import {hexbin} from "d3-hexbin";

import type {DataPoint} from "@d3plus/data";

/** The bin shapes Hexbin draws. */
export type BinShape = "hex" | "square";

/** How a bin's measure is computed from its points. */
export type BinAgg = "count" | "sum" | "mean";

/** An observation placed in pixel space. */
export interface PixelPoint {
  x: number;
  y: number;
  /** The user's row the point came from. */
  row: DataPoint;
  /** The value `sum`/`mean` bins aggregate (and density contours weigh by). */
  weight?: number;
}

/** A bin of points: its grid key, its center in pixels, and its points. */
export interface PixelBin {
  key: string;
  cx: number;
  cy: number;
  points: PixelPoint[];
}

/** A bin's pixel bounds. */
export interface PixelBounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const SQRT3 = Math.sqrt(3);

/** Whether a point has finite pixel coordinates. */
const placed = (p: PixelPoint): boolean =>
  Number.isFinite(p.x) && Number.isFinite(p.y);

/**
    Groups points into bins of a fixed pixel size: pointy-top hexagons of
    radius `size`, or `size`-pixel squares. The grid is anchored at `origin`,
    so a grid anchored to a data point moves with it when the view pans.
    Points without finite coordinates are skipped, and only bins holding a
    point are returned.
    @param points The points, in pixels.
    @param options `shape`, `size` (hexagon radius or square side, in
    pixels), and the grid's `origin`.
*/
export function binPoints(
  points: PixelPoint[],
  options: {shape: BinShape; size: number; origin?: [number, number]},
): PixelBin[] {
  const {shape, size} = options;
  const [ox, oy] = options.origin ?? [0, 0];
  const valid = points.filter(placed);
  if (!(size > 0) || !valid.length) return [];

  if (shape === "square") {
    const bins = new Map<string, PixelBin>();
    for (const p of valid) {
      const col = Math.floor((p.x - ox) / size);
      const row = Math.floor((p.y - oy) / size);
      const key = `s${col}_${row}`;
      let bin = bins.get(key);
      if (!bin) {
        bin = {
          key,
          cx: ox + (col + 0.5) * size,
          cy: oy + (row + 0.5) * size,
          points: [],
        };
        bins.set(key, bin);
      }
      bin.points.push(p);
    }
    return Array.from(bins.values());
  }

  const dx = size * SQRT3;
  const dy = size * 1.5;
  return hexbin<PixelPoint>()
    .radius(size)
    .x(p => p.x - ox)
    .y(p => p.y - oy)(valid)
    .map(bin => ({
      key: `h${Math.round((2 * bin.x) / dx)}_${Math.round(bin.y / dy)}`,
      cx: ox + bin.x,
      cy: oy + bin.y,
      points: Array.from(bin),
    }));
}

/**
    A bin's pixel bounds: a hexagon's bounding box (it is `√3 × size` wide
    and `2 × size` tall), or a square's sides.
*/
export function binBounds(
  bin: Pick<PixelBin, "cx" | "cy">,
  shape: BinShape,
  size: number,
): PixelBounds {
  const halfW = shape === "square" ? size / 2 : (size * SQRT3) / 2;
  const halfH = shape === "square" ? size / 2 : size;
  return {
    x0: bin.cx - halfW,
    x1: bin.cx + halfW,
    y0: bin.cy - halfH,
    y1: bin.cy + halfH,
  };
}

/** A bin's outline as an absolute SVG path. */
export function binPath(
  bin: Pick<PixelBin, "cx" | "cy">,
  shape: BinShape,
  size: number,
): string {
  const round = (n: number) => Math.round(n * 100) / 100;
  if (shape === "square") {
    const {x0, x1, y0, y1} = binBounds(bin, shape, size);
    return `M${round(x0)},${round(y0)}H${round(x1)}V${round(y1)}H${round(x0)}Z`;
  }
  const corners = [0, 1, 2, 3, 4, 5].map(k => {
    const angle = (k * Math.PI) / 3;
    return `${round(bin.cx + Math.sin(angle) * size)},${round(bin.cy - Math.cos(angle) * size)}`;
  });
  return `M${corners.join("L")}Z`;
}

/** The area one bin covers, in square pixels. */
export function binArea(shape: BinShape, size: number): number {
  return shape === "square" ? size * size : ((3 * SQRT3) / 2) * size * size;
}

/**
    A bin's measure: its point count, or the sum or mean of its points'
    finite weights. A mean with no finite weight is `NaN`.
*/
export function binMeasure(points: PixelPoint[], agg: BinAgg): number {
  if (agg === "count") return points.length;
  let total = 0,
    n = 0;
  for (const p of points)
    if (typeof p.weight === "number" && Number.isFinite(p.weight)) {
      total += p.weight;
      n++;
    }
  if (agg === "sum") return total;
  return n ? total / n : NaN;
}
