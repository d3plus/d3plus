/**
    Circle geometry for Venn and Euler diagrams: the area two or more
    circles share, the distance that gives two circles a given overlap, and
    the arcs that outline an intersection. Pure functions over plain
    `{x, y, radius}` circles.
*/

/** A circle by its center and radius. */
export interface VennCircle {
  x: number;
  y: number;
  radius: number;
}

/** A point where two circles cross, with the indices of those circles. */
export interface CrossPoint {
  x: number;
  y: number;
  parents: [number, number];
}

/**
    One arc of an intersection's outline: it runs along `circle` from `p1`
    to `p2`, and `width` is the height of the segment it cuts off (more
    than the radius when the arc is the larger part of its circle).
*/
export interface IntersectionArc {
  circle: VennCircle;
  p1: {x: number; y: number};
  p2: {x: number; y: number};
  width: number;
}

/** The area circles share, and the arcs that outline it. */
export interface Intersection {
  area: number;
  arcs: IntersectionArc[];
}

const SMALL = 1e-10;

/** The distance between two points. */
export function distance(
  a: {x: number; y: number},
  b: {x: number; y: number},
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
    The area of the segment a chord cuts off a circle of radius `r`, where
    `width` is the segment's height (0 to 2r).
*/
export function segmentArea(r: number, width: number): number {
  const w = Math.max(0, Math.min(2 * r, width));
  return (
    r * r * Math.acos(Math.max(-1, Math.min(1, 1 - w / r))) -
    (r - w) * Math.sqrt(Math.max(0, w * (2 * r - w)))
  );
}

/** The area two circles of radii `r1` and `r2` share when their centers are `d` apart. */
export function circleOverlap(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const w1 = r1 - (d * d - r2 * r2 + r1 * r1) / (2 * d);
  const w2 = r2 - (d * d - r1 * r1 + r2 * r2) / (2 * d);
  return segmentArea(r1, w1) + segmentArea(r2, w2);
}

/** The points where two circles' outlines cross: none, or two. */
export function circleCrossings(
  a: VennCircle,
  b: VennCircle,
): {x: number; y: number}[] {
  const d = distance(a, b);
  if (d >= a.radius + b.radius || d <= Math.abs(a.radius - b.radius)) return [];
  const along = (a.radius ** 2 - b.radius ** 2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a.radius ** 2 - along * along));
  const x0 = a.x + (along * (b.x - a.x)) / d;
  const y0 = a.y + (along * (b.y - a.y)) / d;
  const rx = -(b.y - a.y) * (h / d);
  const ry = -(b.x - a.x) * (h / d);
  return [
    {x: x0 + rx, y: y0 - ry},
    {x: x0 - rx, y: y0 + ry},
  ];
}

/**
    The distance between the centers of two circles of radii `r1` and `r2`
    that share `overlap` of area: their radii apart when they share nothing,
    and close enough for the smaller to sit inside the larger when the
    overlap is all of it.
*/
export function distanceForOverlap(
  r1: number,
  r2: number,
  overlap: number,
): number {
  if (overlap <= 0) return r1 + r2;
  if (Math.PI * Math.min(r1, r2) ** 2 <= overlap + SMALL)
    return Math.abs(r1 - r2);
  let lo = Math.abs(r1 - r2);
  let hi = r1 + r2;
  for (let k = 0; k < 100 && hi - lo > SMALL; k++) {
    const mid = (lo + hi) / 2;
    if (circleOverlap(r1, r2, mid) > overlap) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Whether a point lies inside (or on) every circle. */
export function insideAll(
  point: {x: number; y: number},
  circles: VennCircle[],
): boolean {
  return circles.every(c => distance(point, c) < c.radius + SMALL);
}

/** Every point where two of the circles cross, with the pair that crosses there. */
function crossPoints(circles: VennCircle[]): CrossPoint[] {
  const out: CrossPoint[] = [];
  for (let i = 0; i < circles.length; i++)
    for (let j = i + 1; j < circles.length; j++)
      for (const p of circleCrossings(circles[i], circles[j]))
        out.push({...p, parents: [i, j]});
  return out;
}

/**
    The intersection when no two outlines cross on its border: the smallest
    circle whole, when it lies inside all the others, and nothing otherwise.
*/
function nestedIntersection(circles: VennCircle[]): Intersection {
  let smallest = circles[0];
  for (const c of circles) if (c.radius < smallest.radius) smallest = c;
  const inside = circles.every(
    c => distance(c, smallest) + smallest.radius <= c.radius + SMALL,
  );
  if (!inside) return {area: 0, arcs: []};
  const top = {x: smallest.x, y: smallest.y + smallest.radius};
  return {
    area: Math.PI * smallest.radius ** 2,
    arcs: [{circle: smallest, p1: top, p2: top, width: 2 * smallest.radius}],
  };
}

/**
    The arc between two consecutive corners of an intersection: along the
    circle both corners lie on whose arc between them bulges least.
*/
function cornerArc(
  circles: VennCircle[],
  p1: CrossPoint,
  p2: CrossPoint,
): IntersectionArc | null {
  const mid = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
  let best: IntersectionArc | null = null;
  for (const j of p1.parents) {
    if (!p2.parents.includes(j)) continue;
    const circle = circles[j];
    const a1 = Math.atan2(p1.x - circle.x, p1.y - circle.y);
    const a2 = Math.atan2(p2.x - circle.x, p2.y - circle.y);
    let diff = a2 - a1;
    if (diff < 0) diff += 2 * Math.PI;
    const a = a2 - diff / 2;
    const edge = {
      x: circle.x + circle.radius * Math.sin(a),
      y: circle.y + circle.radius * Math.cos(a),
    };
    const width = Math.min(distance(mid, edge), circle.radius * 2);
    if (!best || best.width > width) best = {circle, width, p1, p2};
  }
  return best;
}

/**
    The area every circle shares, with the arcs that outline it, in order
    around the border. The area is the polygon through the border's corners
    plus the circular segment beyond each of its edges.
*/
export function intersection(circles: VennCircle[]): Intersection {
  if (!circles.length) return {area: 0, arcs: []};
  if (circles.length === 1) return nestedIntersection(circles);
  const corners = crossPoints(circles).filter(p => insideAll(p, circles));
  if (corners.length <= 1) return nestedIntersection(circles);
  const cx = corners.reduce((s, p) => s + p.x, 0) / corners.length;
  const cy = corners.reduce((s, p) => s + p.y, 0) / corners.length;
  const angle = (p: CrossPoint) => Math.atan2(p.x - cx, p.y - cy);
  corners.sort((a, b) => angle(b) - angle(a));
  let polygon = 0;
  let segments = 0;
  const arcs: IntersectionArc[] = [];
  let p2 = corners[corners.length - 1];
  for (const p1 of corners) {
    polygon += (p2.x + p1.x) * (p1.y - p2.y);
    const arc = cornerArc(circles, p1, p2);
    if (arc) {
      arcs.push(arc);
      segments += segmentArea(arc.circle.radius, arc.width);
      p2 = p1;
    }
  }
  return {area: polygon / 2 + segments, arcs};
}

/** The area every circle shares. */
export function intersectionArea(circles: VennCircle[]): number {
  if (circles.length === 2)
    return circleOverlap(
      circles[0].radius,
      circles[1].radius,
      distance(circles[0], circles[1]),
    );
  return intersection(circles).area;
}

/** An SVG path for a whole circle. */
export function circlePath(c: VennCircle): string {
  const {x, y, radius: r} = c;
  return `M${x - r},${y}A${r},${r},0,1,0,${x + r},${y}A${r},${r},0,1,0,${x - r},${y}Z`;
}

/**
    An SVG path outlining the area every circle shares, or an empty string
    when they share none.
*/
export function intersectionPath(circles: VennCircle[]): string {
  const {arcs} = intersection(circles);
  if (!arcs.length) return "";
  if (arcs.length === 1) return circlePath(arcs[0].circle);
  const start = arcs[0].p2;
  const parts = [`M${start.x},${start.y}`];
  for (const arc of arcs) {
    const r = arc.circle.radius;
    const large = arc.width > r ? 1 : 0;
    parts.push(`A${r},${r},0,${large},1,${arc.p1.x},${arc.p1.y}`);
  }
  return `${parts.join("")}Z`;
}
