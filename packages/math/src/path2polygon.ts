import type {Point} from "./lineIntersection.js";
import parsePath, {arcPoint, arcToCenter} from "./pathParse.js";

/** Chord-length of a cubic Bézier's control polygon — an upper bound on its arc length. */
function cubicPolyLen(
  x0: number, y0: number, x1: number, y1: number,
  x2: number, y2: number, x3: number, y3: number,
): number {
  return (
    Math.hypot(x1 - x0, y1 - y0) +
    Math.hypot(x2 - x1, y2 - y1) +
    Math.hypot(x3 - x2, y3 - y2)
  );
}

/**
    Transforms a path string into an Array of points, with no DOM involved.
    Straight segments contribute their endpoints; curves and arcs are flattened
    into line segments no longer than `segmentLength`. Higher `segmentLength`
    values lower computation time but yield more rigid curves.
    @param path An SVG string path, commonly the "d" property of a <path> element.
    @param segmentLength The maximum length of line segments when flattening curves.
*/
export default function path2polygon(
  path: string,
  segmentLength: number = 50,
): Point[] {
  const points: Point[] = [];
  const step = Math.max(1, segmentLength);
  let cx = 0, cy = 0;

  const push = (x: number, y: number): void => {
    const last = points[points.length - 1];
    // Skip exact duplicates (e.g. a curve start == the previous endpoint).
    if (!last || last[0] !== x || last[1] !== y) points.push([x, y]);
  };

  for (const seg of parsePath(path)) {
    if (seg.type === "M" || seg.type === "L") {
      push(seg.x, seg.y);
      cx = seg.x;
      cy = seg.y;
    } else if (seg.type === "C") {
      const len = cubicPolyLen(cx, cy, seg.x1, seg.y1, seg.x2, seg.y2, seg.x, seg.y);
      const n = Math.max(2, Math.ceil(len / step));
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        push(
          u * u * u * cx + 3 * u * u * t * seg.x1 + 3 * u * t * t * seg.x2 + t * t * t * seg.x,
          u * u * u * cy + 3 * u * u * t * seg.y1 + 3 * u * t * t * seg.y2 + t * t * t * seg.y,
        );
      }
      cx = seg.x;
      cy = seg.y;
    } else if (seg.type === "Q") {
      const len =
        Math.hypot(seg.x1 - cx, seg.y1 - cy) + Math.hypot(seg.x - seg.x1, seg.y - seg.y1);
      const n = Math.max(2, Math.ceil(len / step));
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        push(
          u * u * cx + 2 * u * t * seg.x1 + t * t * seg.x,
          u * u * cy + 2 * u * t * seg.y1 + t * t * seg.y,
        );
      }
      cx = seg.x;
      cy = seg.y;
    } else if (seg.type === "A") {
      const arc = arcToCenter(
        cx, cy, seg.rx, seg.ry, seg.rot, seg.large, seg.sweep, seg.x, seg.y,
      );
      if (!arc) {
        push(seg.x, seg.y);
      } else {
        // Estimate length from the average radius × swept angle.
        const len = ((arc.rx + arc.ry) / 2) * Math.abs(arc.dtheta);
        const n = Math.max(2, Math.ceil(len / step));
        for (let i = 1; i <= n; i++) {
          const [px, py] = arcPoint(arc, arc.theta1 + (arc.dtheta * i) / n);
          push(px, py);
        }
      }
      cx = seg.x;
      cy = seg.y;
    }
    // Z contributes no new vertex — the subpath start is already in `points`.
  }

  return points;
}
