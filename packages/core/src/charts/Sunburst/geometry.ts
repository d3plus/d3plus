/**
    Pure polar geometry for the Sunburst: ring radii per hierarchy depth, the
    per-arc pad angle, zoom collapse targets, and the label rotations that
    never read upside down.

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

/** Normalizes an angle in radians into degrees in [0, 360). */
export function degrees(radians: number): number {
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
