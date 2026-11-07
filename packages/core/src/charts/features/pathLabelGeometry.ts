/**
    Polyline geometry for labels drawn along a line (trend line labels, line
    labels that follow their series): trimming a line to the plot, keeping
    its text upright, lifting it clear of the stroke, and the path `d` a
    TextBox `textPath` follows.
*/

/** A point in pixels. */
export type Pt = [number, number];

/** A rectangle by its edges. */
export interface Edges {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
    The polyline's length.
    @param points The polyline.
*/
export function polylineLength(points: Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++)
    total += Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
    );
  return total;
}

/**
    The polyline in the direction its text reads upright: left to right, or
    bottom to top when it runs (near enough) straight up or down. A line
    running right to left in screen space (a reversed axis, or a fit along
    the y axis) is reversed, so its text never reads upside down.
    @param points The polyline.
    @param steep How far across, for each pixel up or down, a line can run
    and still read bottom to top. Defaults to `0.02`.
*/
export function uprightPoints(points: Pt[], steep = 0.02): Pt[] {
  if (points.length < 2) return points;
  const [x0, y0] = points[0];
  const [x1, y1] = points[points.length - 1];
  const dx = x1 - x0,
    dy = y1 - y0;
  const upright = Math.abs(dx) < Math.abs(dy) * steep;
  return (upright ? dy > 0 : dx < 0) ? [...points].reverse() : points;
}

/**
    The polyline moved `distance` pixels to its left (above a line running
    left to right), each vertex along the average of its segments' normals.
    @param points The polyline.
    @param distance How far to move it.
*/
export function offsetPolyline(points: Pt[], distance: number): Pt[] {
  if (points.length < 2 || !distance) return points;
  const normal = (a: Pt, b: Pt): Pt => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  };
  // Each segment's normal, shared by the vertices at its ends.
  const normals = points.slice(1).map((p, i) => normal(points[i], p));
  return points.map((p, i) => {
    const before = i > 0 ? normals[i - 1] : null;
    const after = i < points.length - 1 ? normals[i] : null;
    const n =
      before && after
        ? [before[0] + after[0], before[1] + after[1]]
        : (before ?? after)!;
    const len = Math.hypot(n[0], n[1]) || 1;
    return [p[0] + (n[0] / len) * distance, p[1] + (n[1] / len) * distance];
  });
}

/**
    The stretch of the polyline from `from` to `to` pixels along it, its ends
    interpolated.
    @param points The polyline.
    @param from The distance along it where the stretch starts.
    @param to The distance along it where the stretch ends.
*/
export function trimPolyline(points: Pt[], from: number, to: number): Pt[] {
  const out: Pt[] = [];
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const len = Math.hypot(bx - ax, by - ay);
    const next = walked + len;
    const at = (s: number): Pt => {
      const t = len ? (s - walked) / len : 0;
      return [ax + (bx - ax) * t, ay + (by - ay) * t];
    };
    if (next >= from && walked <= to) {
      if (!out.length) out.push(at(Math.max(from, walked)));
      if (next <= to) out.push([bx, by]);
      else {
        out.push(at(to));
        break;
      }
    }
    walked = next;
  }
  return out;
}

/**
    A polyline with the distance along it to each of its points, for taking
    many stretches or samples of it in one pass: `trim` and `at` give what
    `trimPolyline` does, but start from the first segment the stretch
    reaches instead of the polyline's first point. Walking forward is
    cheapest; a shorter distance than the last searches back.
*/
export class PolylineRuler {
  /** The polyline's length. */
  readonly length: number;
  /** The distance along the polyline to each point. */
  private cum: number[];
  /** The segment (its end point's index) the last lookup stopped at. */
  private i = 1;

  /** @param points The polyline. */
  constructor(private points: Pt[]) {
    const cum = [0];
    let walked = 0;
    for (let i = 1; i < points.length; i++) {
      walked += Math.hypot(
        points[i][0] - points[i - 1][0],
        points[i][1] - points[i - 1][1],
      );
      cum.push(walked);
    }
    this.cum = cum;
    this.length = walked;
  }

  /** The first segment ending `distance` or more along the polyline (`points.length` when none does). */
  private seek(distance: number): number {
    const {cum} = this;
    const n = this.points.length;
    let i = this.i;
    if (i > 1 && cum[i - 1] >= distance) {
      let lo = 1,
        hi = i - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] >= distance) hi = mid;
        else lo = mid + 1;
      }
      i = lo;
    }
    while (i < n && cum[i] < distance) i++;
    this.i = i;
    return i;
  }

  /**
      The stretch from `from` to `to` pixels along the polyline, the same
      points `trimPolyline` gives.
      @param from The distance along it where the stretch starts.
      @param to The distance along it where the stretch ends.
  */
  trim(from: number, to: number): Pt[] {
    const {points, cum} = this;
    const out: Pt[] = [];
    // Every segment before the first one reaching `from` adds nothing.
    for (let i = this.seek(from); i < points.length; i++) {
      const [ax, ay] = points[i - 1];
      const [bx, by] = points[i];
      const len = Math.hypot(bx - ax, by - ay);
      const walked = cum[i - 1];
      const next = cum[i];
      const at = (s: number): Pt => {
        const t = len ? (s - walked) / len : 0;
        return [ax + (bx - ax) * t, ay + (by - ay) * t];
      };
      if (next >= from && walked <= to) {
        if (!out.length) out.push(at(Math.max(from, walked)));
        if (next <= to) out.push([bx, by]);
        else {
          out.push(at(to));
          break;
        }
      }
    }
    return out;
  }

  /**
      The point `distance` pixels along the polyline, as `trimPolyline`'s
      first point for a stretch from there to there, or undefined past its
      end.
      @param distance The distance along it.
  */
  at(distance: number): Pt | undefined {
    const i = this.seek(distance);
    if (i >= this.points.length || !(this.cum[i - 1] <= distance))
      return undefined;
    const [ax, ay] = this.points[i - 1];
    const [bx, by] = this.points[i];
    const len = Math.hypot(bx - ax, by - ay);
    const walked = this.cum[i - 1];
    const t = len ? (Math.max(distance, walked) - walked) / len : 0;
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  }
}

/**
    The longest run of consecutive points inside `rect`: the part of a line a
    label can sit on where the plot's domains don't cut it off.
    @param points The polyline.
    @param rect The plot area.
*/
export function visibleRun(points: Pt[], rect: Edges): Pt[] {
  const inside = ([x, y]: Pt) =>
    x >= rect.x0 - 0.5 &&
    x <= rect.x1 + 0.5 &&
    y >= rect.y0 - 0.5 &&
    y <= rect.y1 + 0.5;
  let best: Pt[] = [];
  let run: Pt[] = [];
  for (const p of points) {
    if (Number.isFinite(p[0]) && Number.isFinite(p[1]) && inside(p))
      run.push(p);
    else run = [];
    if (polylineLength(run) > polylineLength(best)) best = run.slice();
  }
  return best;
}

/**
    The SVG path `d` through a polyline's points.
    @param points The polyline.
*/
export function polylineD(points: Pt[]): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return points.map(([x, y], i) => `${i ? "L" : "M"}${r(x)},${r(y)}`).join("");
}

/**
    The plot area's edges from its x and y ranges, the y range shifted up by
    the top x axis's height, as the plot's clip reads them.
    @param xRange The x range in pixels.
    @param yRange The y range in pixels.
    @param x2Height The top x axis's height.
*/
export function plotEdges(
  xRange: unknown[],
  yRange: unknown[],
  x2Height = 0,
): Edges {
  const xs = xRange.slice(0, 2).map(Number);
  const ys = yRange.slice(0, 2).map(r => Number(r) - x2Height);
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  };
}
