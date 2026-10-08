/**
    Pure polar geometry for the Sunburst: ring radii per hierarchy depth, the
    per-arc pad angle, and where (and in which orientation) an arc's label fits.

    Angles follow d3-shape's convention: 0 is 12 o'clock, increasing clockwise.
*/

/** How ring radii are distributed from the center outward. */
export type SunburstRingSize = "equal" | "area";

/** An annular sector — the polar extent of one Sunburst node. */
export interface SunburstArc {
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}

/** Where an arc's label goes: a box centered at (x, y), rotated `rotate` degrees about its center. */
export interface SunburstLabelBox {
  orientation: "center" | "radial" | "tangential";
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
}

const TAU = Math.PI * 2;

/**
    The [inner, outer] radius of every hierarchy depth, depth 0 being the
    center slot (the focused node after a drill-down, empty otherwise).

    `"equal"` gives every ring (and the center slot) the same thickness, which
    keeps label room uniform from the center out. `"area"` makes every ring
    cover the same area, so outer rings — which hold the most, and narrowest,
    arcs — don't visually outweigh the inner levels.

    @param outerRadius The radius of the outermost ring.
    @param levels The number of rings around the center slot.
    @param ringSize The radius distribution.
    @param centerRadius An explicit center-slot radius; defaults to one ring's share.
*/
export function sunburstRadii(
  outerRadius: number,
  levels: number,
  ringSize: SunburstRingSize = "equal",
  centerRadius?: number,
): [number, number][] {
  const R = Math.max(0, outerRadius);
  if (levels < 1) return [[0, R]];
  const slots = levels + 1;
  const c =
    centerRadius !== undefined && Number.isFinite(centerRadius)
      ? Math.min(Math.max(0, centerRadius), R)
      : ringSize === "area"
        ? R * Math.sqrt(1 / slots)
        : R / slots;
  const edge = (k: number): number =>
    ringSize === "area"
      ? Math.sqrt(c * c + ((R * R - c * c) * k) / levels)
      : c + ((R - c) * k) / levels;
  const radii: [number, number][] = [[0, c]];
  for (let k = 1; k <= levels; k++) radii.push([edge(k - 1), edge(k)]);
  return radii;
}

/**
    Where an arc that a zoom removes collapses to: the zoom maps the clicked
    node's old angular range onto the full circle and its ring onto the center
    slot, so an arc outside that range folds to a zero-width sliver at 0 or 2π
    on the ring it moves to — the same mapping the arcs that stay follow.
    @param arc The removed arc's old geometry.
    @param depth The removed arc's old ring index.
    @param focus The clicked node's old angles and ring index.
    @param radii The new layout's radii per ring (see `sunburstRadii`).
*/
export function sunburstCollapse(
  arc: Pick<SunburstArc, "startAngle" | "endAngle">,
  depth: number,
  focus: {startAngle: number; endAngle: number; depth: number},
  radii: [number, number][],
): SunburstArc {
  const span = focus.endAngle - focus.startAngle || 1;
  const map = (a: number): number =>
    Math.min(TAU, Math.max(0, ((a - focus.startAngle) / span) * TAU));
  const ring = depth - focus.depth;
  const outer = radii[radii.length - 1]?.[1] ?? 0;
  const [innerRadius, outerRadius] =
    ring < 0 ? [0, 0] : (radii[ring] ?? [outer, outer]);
  return {
    innerRadius,
    outerRadius,
    startAngle: map(arc.startAngle),
    endAngle: map(arc.endAngle),
  };
}

/**
    The pad angle that opens a gap of roughly `padPixel` pixels between
    neighboring arcs of a ring. d3-shape measures the gap along its default pad
    radius, √(inner² + outer²), so dividing by that radius keeps the linear gap
    the same in every ring. An explicit `padAngle` wins.
*/
export function sunburstPadAngle(
  arc: Pick<SunburstArc, "innerRadius" | "outerRadius">,
  padAngle: number,
  padPixel: number,
): number {
  if (padAngle) return padAngle;
  if (!padPixel) return 0;
  const padRadius = Math.sqrt(arc.innerRadius ** 2 + arc.outerRadius ** 2);
  return padRadius ? padPixel / padRadius : 0;
}

/** The largest box (w, h) of the given thickness `along` the radius that sits centered in the arc. */
function radialFit(arc: SunburstArc, padding: number): [number, number] {
  const {innerRadius: ir, outerRadius: or} = arc;
  const span = arc.endAngle - arc.startAngle;
  const w = Math.max(0, or - ir - padding * 2);
  const near = ir + padding;
  const far = or - padding;
  const angular = span < Math.PI ? near * Math.tan(span / 2) : near;
  const rim = Math.sqrt(Math.max(0, or * or - far * far));
  return [w, Math.max(0, 2 * Math.min(angular, rim) - padding * 2)];
}

/** The largest box running along the arc's tangent, at most `heightShare` of the ring thick. */
function tangentialFit(
  arc: SunburstArc,
  padding: number,
  heightShare = 0.6,
): [number, number] {
  const {innerRadius: ir, outerRadius: or} = arc;
  const span = arc.endAngle - arc.startAngle;
  const rm = (ir + or) / 2;
  const h = Math.max(0, (or - ir) * heightShare);
  const near = rm - h / 2;
  const far = rm + h / 2;
  const angular = span < Math.PI ? near * Math.tan(span / 2) : Infinity;
  const rim = Math.sqrt(Math.max(0, or * or - far * far));
  return [Math.max(0, 2 * Math.min(angular, rim) - padding * 2), h];
}

/**
    The largest font height a box can hold for a label `aspect` times wider than
    it is tall — the score that picks a label's orientation.
*/
function fontRoom(w: number, h: number, aspect: number): number {
  return Math.min(h, w / aspect);
}

/** Normalizes an angle in degrees into [0, 360). */
function degrees(radians: number): number {
  const d = (radians * 180) / Math.PI;
  return ((d % 360) + 360) % 360;
}

/**
    Rotation (degrees) that runs text along the radius at polar angle `a`
    (degrees), flipped on the left half so it never reads upside down.
*/
export function radialRotation(a: number): number {
  return a <= 180 ? a - 90 : a - 270;
}

/**
    Rotation (degrees) that runs text along the arc's tangent at polar angle
    `a` (degrees), flipped on the bottom half so it never reads upside down.
*/
export function tangentialRotation(a: number): number {
  return a > 90 && a < 270 ? a - 180 : a >= 270 ? a - 360 : a;
}

/**
    Decides whether, and how, a label fits inside an arc.

    The full-circle center slot gets an upright box inscribed in its disc. A
    ring arc compares the box that runs along its tangent with the one that
    runs along its radius and keeps whichever lets a typical label (`aspect`
    times wider than tall) be drawn larger: wide arcs read tangentially, thin
    slivers of the outer rings read radially. Returns null when neither box can
    hold text at `fontMin` pixels.

    @param arc The node's polar extent.
    @param options `fontMin` (px, default 8), `padding` (px, default 2), and the
        expected label `aspect` ratio (default 4).
*/
export function sunburstLabelBox(
  arc: SunburstArc,
  options: {fontMin?: number; padding?: number; aspect?: number} = {},
): SunburstLabelBox | null {
  const {fontMin = 8, padding = 2, aspect = 4} = options;
  const span = arc.endAngle - arc.startAngle;
  if (!(span > 0) || !(arc.outerRadius > arc.innerRadius)) return null;

  if (arc.innerRadius <= 0 && span >= TAU - 1e-6) {
    const r = arc.outerRadius;
    const box = {
      orientation: "center" as const,
      x: 0,
      y: 0,
      width: r * 1.6,
      height: r * 0.9,
      rotate: 0,
    };
    return fontRoom(box.width, box.height, aspect) >= fontMin ? box : null;
  }

  const [tw, th] = tangentialFit(arc, padding);
  const [rw, rh] = radialFit(arc, padding);
  const tangentialRoom = fontRoom(tw, th, aspect);
  const radialRoom = fontRoom(rw, rh, aspect);
  const radial = radialRoom > tangentialRoom;
  if (Math.max(tangentialRoom, radialRoom) < fontMin) return null;

  const mid = (arc.startAngle + arc.endAngle) / 2;
  const rm = (arc.innerRadius + arc.outerRadius) / 2;
  const a = degrees(mid);
  return {
    orientation: radial ? "radial" : "tangential",
    x: rm * Math.sin(mid),
    y: -rm * Math.cos(mid),
    width: radial ? rw : tw,
    height: radial ? rh : th,
    rotate: radial ? radialRotation(a) : tangentialRotation(a),
  };
}
