import parsePath, {arcPoint, arcToCenter} from "./pathParse.js";

/** Value of a cubic Bézier on one axis at parameter t. */
function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Value of a quadratic Bézier on one axis at parameter t. */
function quadAt(p0: number, p1: number, p2: number, t: number): number {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

/** Parameters in (0,1) where a cubic Bézier's derivative is zero on one axis. */
function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = p3 - 3 * p2 + 3 * p1 - p0;
  const b = 2 * (p2 - 2 * p1 + p0);
  const c = p1 - p0;
  const ts: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) ts.push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      ts.push((-b + s) / (2 * a), (-b - s) / (2 * a));
    }
  }
  return ts.filter(t => t > 0 && t < 1);
}

/** Parameter in (0,1) where a quadratic Bézier's derivative is zero on one axis. */
function quadExtremum(p0: number, p1: number, p2: number): number[] {
  const den = p0 - 2 * p1 + p2;
  if (Math.abs(den) < 1e-12) return [];
  const t = (p0 - p1) / den;
  return t > 0 && t < 1 ? [t] : [];
}

/** True when absolute ellipse angle `theta` falls inside the arc's signed sweep. */
function angleInArc(theta: number, theta1: number, dtheta: number): boolean {
  const TAU = 2 * Math.PI;
  let d = theta - theta1;
  if (dtheta >= 0) {
    while (d < 0) d += TAU;
    while (d > TAU) d -= TAU;
    return d <= dtheta + 1e-9;
  }
  while (d > 0) d -= TAU;
  while (d < -TAU) d += TAU;
  return d >= dtheta - 1e-9;
}

/**
    Computes the exact bounding box of an SVG path string with no DOM involved,
    evaluating the true extrema of each Bézier and arc segment (not a sampled
    approximation). Returns `{x, y, width, height}`, or a zero-size box at the
    origin for an empty/unparseable path.
    @param d An SVG path string (the `d` attribute of a `<path>`).
*/
export default function pathBounds(d: string): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  let cx = 0, cy = 0;
  for (const seg of parsePath(d)) {
    if (seg.type === "M" || seg.type === "L") {
      add(seg.x, seg.y);
      cx = seg.x;
      cy = seg.y;
    } else if (seg.type === "C") {
      add(cx, cy);
      add(seg.x, seg.y);
      // At each axis extremum, include the full point on the curve — only the
      // extreme axis grows the box, the other coordinate is a real point on it.
      const ts = [
        ...cubicExtrema(cx, seg.x1, seg.x2, seg.x),
        ...cubicExtrema(cy, seg.y1, seg.y2, seg.y),
      ];
      for (const t of ts)
        add(cubicAt(cx, seg.x1, seg.x2, seg.x, t), cubicAt(cy, seg.y1, seg.y2, seg.y, t));
      cx = seg.x;
      cy = seg.y;
    } else if (seg.type === "Q") {
      add(cx, cy);
      add(seg.x, seg.y);
      const ts = [...quadExtremum(cx, seg.x1, seg.x), ...quadExtremum(cy, seg.y1, seg.y)];
      for (const t of ts)
        add(quadAt(cx, seg.x1, seg.x, t), quadAt(cy, seg.y1, seg.y, t));
      cx = seg.x;
      cy = seg.y;
    } else if (seg.type === "A") {
      add(cx, cy);
      add(seg.x, seg.y);
      const arc = arcToCenter(
        cx, cy, seg.rx, seg.ry, seg.rot, seg.large, seg.sweep, seg.x, seg.y,
      );
      if (arc) {
        const {phi, rx, ry, theta1, dtheta} = arc;
        // Ellipse-angle candidates where dX/dθ = 0 and dY/dθ = 0.
        const cands = [
          Math.atan2(-ry * Math.sin(phi), rx * Math.cos(phi)),
          Math.atan2(ry * Math.cos(phi), rx * Math.sin(phi)),
        ];
        for (const base of cands)
          for (const theta of [base, base + Math.PI])
            if (angleInArc(theta, theta1, dtheta)) {
              const [px, py] = arcPoint(arc, theta);
              add(px, py);
            }
      }
      cx = seg.x;
      cy = seg.y;
    }
  }

  if (!Number.isFinite(minX)) return {x: 0, y: 0, width: 0, height: 0};
  return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}
