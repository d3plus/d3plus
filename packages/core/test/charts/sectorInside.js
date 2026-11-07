/**
    Checks, written from the slice's polar shape rather than with
    `sectorBox.ts`, that points and boxes lie inside a Pie slice.
*/
const TAU = Math.PI * 2;

/**
    Whether a point lies inside a ring segment, as d3-shape's arc draws it:
    within its radii and angles, and, for a ring segment with a pad, at
    least the pad's half-gap from each straight side.
    @param arc The segment: {innerRadius, outerRadius, startAngle, endAngle, padAngle?}.
    @param point The point, [x, y] from the ring's center.
    @param tol How far outside still counts as inside.
*/
export function pointInSector(arc, [x, y], tol = 1e-6) {
  const r = Math.hypot(x, y);
  if (r > arc.outerRadius + tol) return false;
  if (arc.innerRadius > 0 && r < arc.innerRadius - tol) return false;
  let a0 = Math.min(arc.startAngle, arc.endAngle);
  let a1 = Math.max(arc.startAngle, arc.endAngle);
  if (a1 - a0 >= TAU - 1e-9) return true;
  const half = (arc.padAngle ?? 0) / 2;
  const ring = arc.innerRadius > 0;
  if (half && !ring) {
    a0 += half;
    a1 -= half;
  }
  if (r <= tol) return !ring;
  const angle = Math.atan2(x, -y);
  const rel = (((angle - a0) % TAU) + TAU) % TAU;
  // The angle past the segment's end, measured either way round.
  const out = Math.min(rel - (a1 - a0), TAU - rel);
  if (out * r > tol) return false;
  if (!half || !ring) return true;
  const gap = Math.hypot(arc.innerRadius, arc.outerRadius) * Math.sin(half);
  // The distance from each side's ray, on the segment's side of it.
  const side = a => Math.abs(Math.sin(a) * y + Math.cos(a) * x);
  const clear = [side(a0) >= gap - tol, side(a1) >= gap - tol];
  return a1 - a0 <= Math.PI ? clear.every(Boolean) : clear.some(Boolean);
}

/**
    Whether a box lies inside a ring segment: every point along its edges
    does, and it doesn't surround the segment's hole.
    @param arc The segment.
    @param box The box: {x, y, width, height}.
    @param tol How far outside still counts as inside.
*/
export function boxInSector(arc, box, tol = 1e-6) {
  const {x, y, width: w, height: h} = box;
  const n = 64;
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const points = [
      [x + w * f, y],
      [x + w * f, y + h],
      [x, y + h * f],
      [x + w, y + h * f],
    ];
    if (points.some(p => !pointInSector(arc, p, tol))) return false;
  }
  const holds = x < 0 && x + w > 0 && y < 0 && y + h > 0;
  return !(arc.innerRadius > 0 && holds);
}

/**
    How far a point lies from a segment's bisector line, and how far along
    it (negative behind the ring's center).
    @param arc The segment.
    @param point The point.
*/
export function bisectorOffset(arc, [x, y]) {
  const a0 = Math.min(arc.startAngle, arc.endAngle);
  const a1 = Math.max(arc.startAngle, arc.endAngle);
  const mid = a1 - a0 >= TAU - 1e-9 ? 0 : (a0 + a1) / 2;
  const ux = Math.sin(mid);
  const uy = -Math.cos(mid);
  return {across: Math.abs(ux * y - uy * x), along: ux * x + uy * y};
}
