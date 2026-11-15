/**
    Dorling and Demers cartogram shapes: each region drawn as a circle
    (Dorling) or square (Demers) whose area stands for its value (see
    `cartogramRelax.ts` for where they land).

    @module
*/

/** The cartogram kinds Geomap draws. */
export type CartogramKind = "dorling" | "demers";

/** A region about to be placed: its home (projected center) and its size. */
export interface CartogramNode {
  /** The home x position. */
  x: number;
  /** The home y position. */
  y: number;
  /** The circle's radius, or half the square's side. */
  r: number;
}

/** Where a region's shape lands. */
export interface CartogramPlacement {
  x: number;
  y: number;
  r: number;
}

/** How `relaxCartogram` separates the shapes. */
export interface RelaxOptions {
  /** Squares (Demers) rather than circles (Dorling). */
  square?: boolean;
  /** The gap left between neighboring shapes, in pixels. */
  padding?: number;
  /** The passes that pull shapes home while pushing them apart. */
  iterations?: number;
}

/**
    The radius (or, for squares, half the side) of each value's shape, with
    the shapes' areas adding up to `area` and each in proportion to its
    value. A value that isn't a positive number gets 0.
    @param values Each region's value.
    @param area The total area the shapes take.
    @param square Squares (Demers) rather than circles (Dorling).
    @param total The value the whole `area` stands for; defaults to the sum of `values`.
*/
export function cartogramRadii(
  values: number[],
  area: number,
  square: boolean,
  total?: number,
): number[] {
  const positive = values.map(v => (Number.isFinite(v) && v > 0 ? v : 0));
  const sum = total ?? positive.reduce((a, b) => a + b, 0);
  if (!sum || !(area > 0)) return positive.map(() => 0);
  return positive.map(v => {
    const a = (v / sum) * area;
    return square ? Math.sqrt(a) / 2 : Math.sqrt(a / Math.PI);
  });
}

/** The points around a circle drawn as a cartogram shape. */
const CIRCLE_POINTS = 64;

/**
    A circle as polygon path data, so it can morph to and from a region's
    outline (see `morphPathD` in `@d3plus/render`).
    @param x The center x.
    @param y The center y.
    @param r The radius.
*/
export function circlePathD(x: number, y: number, r: number): string {
  let d = "";
  for (let i = 0; i < CIRCLE_POINTS; i++) {
    const a = (i / CIRCLE_POINTS) * 2 * Math.PI - Math.PI / 2;
    d += `${i ? "L" : "M"}${round(x + r * Math.cos(a))},${round(y + r * Math.sin(a))}`;
  }
  return `${d}Z`;
}

/**
    A square centered on `(x, y)`, `2h` on a side, as polygon path data.
    @param x The center x.
    @param y The center y.
    @param h Half the side.
*/
export function squarePathD(x: number, y: number, h: number): string {
  const x0 = round(x - h),
    x1 = round(x + h),
    y0 = round(y - h),
    y1 = round(y + h);
  return `M${x0},${y0}L${x1},${y0}L${x1},${y1}L${x0},${y1}Z`;
}

/** A coordinate rounded to a thousandth of a pixel, as d3-geo writes them. */
function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
