/**
    A `polygonContains` for one polygon tested at many points that share
    rows: the edge crossings along each row are found once.

    @module
*/

type Point = [number, number];

/** A polygon's edge crossings by row, and the test they answer. */
export interface PolygonRows {
  /** Whether `point` lies inside, as `polygonContains(polygon, point)`. */
  contains: (point: Point) => boolean;
  /** Where the polygon's edges cross the row at `y` (see `insideRow`). */
  row: (y: number) => number[];
}

/**
    Whether `x` lies inside a polygon along a row whose edge crossings are
    `xs`: d3-polygon's ray cast, toggling at each crossing past `x`.
*/
export function insideRow(xs: readonly number[], x: number): boolean {
  let inside = false;
  for (const cx of xs) if (x < cx) inside = !inside;
  return inside;
}

/**
    Tests points against `polygon` with d3-polygon's `polygonContains` rule
    (a ray cast along the point's row, toggling at each edge it crosses).
    The crossings are worked out with the same arithmetic, so each answer
    equals `polygonContains(polygon, point)`; they are kept per row, so the
    points of a grid cost one pass over the edges per row instead of per
    point.
*/
export function polygonRows(polygon: readonly Point[]): PolygonRows {
  const rows = new Map<number, number[]>();
  const crossings = (y: number): number[] => {
    const xs: number[] = [];
    const n = polygon.length;
    let [x0, y0] = polygon[n - 1];
    for (let i = 0; i < n; ++i) {
      const [x1, y1] = polygon[i];
      if (y1 > y !== y0 > y) xs.push(((x0 - x1) * (y - y1)) / (y0 - y1) + x1);
      x0 = x1;
      y0 = y1;
    }
    return xs;
  };
  const row = (y: number): number[] => {
    let xs = rows.get(y);
    if (!xs) rows.set(y, (xs = crossings(y)));
    return xs;
  };
  return {contains: ([x, y]) => insideRow(row(y), x), row};
}
