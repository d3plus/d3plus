/**
    Label angles for `labelRotation`. `true` rotates labels -90 degrees; a
    number rotates them by that many degrees; left to the layout, crowded
    labels slant 30 degrees (see `autoAngle`). Labels at an angle between the
    two axis directions ("slanted", e.g. -45) hang off the axis from the end
    of their text nearest it, so each one ends (or starts) at its tick.
*/

/** The axis sides, as `Axis.orient` names them. */
export type AxisOrient = "top" | "right" | "bottom" | "left";

/** A point relative to a label's tick, on the axis line. */
export interface Point {
  x: number;
  y: number;
}

/**
    `degrees` brought into [-90, 90], turning upside-down text a half turn
    so it reads left to right: 135 becomes -45, 180 becomes 0.
*/
export function normalizeAngle(degrees: number): number {
  let a = ((degrees % 360) + 360) % 360;
  if (a > 180) a -= 360;
  if (a > 90) a -= 180;
  else if (a < -90) a += 180;
  return a === 0 ? 0 : a;
}

/**
    The angle a `labelRotation` setting rotates labels by when they rotate:
    a number (normalized, see `normalizeAngle`), else -90.
*/
export function settingAngle(setting: unknown): number {
  return typeof setting === "number" && Number.isFinite(setting)
    ? normalizeAngle(setting)
    : -90;
}

/** How an axis draws its labels: whether they rotate, by what angle, and whether they slant. */
export interface LabelTurn {
  rotate: boolean;
  /** Degrees, 0 when flat. */
  angle: number;
  /** Laid out at the angle (see `slantedLabelBox`), rather than upright as `true` stands them. */
  slant: boolean;
}

/** No rotation. */
export const FLAT: LabelTurn = {rotate: false, angle: 0, slant: false};

/**
    How a `labelRotation` setting draws an axis's labels before the layout
    has its say: `true` upright (-90), a number at its angle, anything else
    flat.
*/
export function settingTurn(setting: unknown, horizontal: boolean): LabelTurn {
  if (!settingRotates(setting)) return FLAT;
  return {
    rotate: true,
    angle: settingAngle(setting),
    slant: slantsLabels(setting, horizontal),
  };
}

/**
    The angle crowded labels slant at when the layout rotates them: -30 on
    a bottom axis (rising to the right, ending at their ticks), 30 on a top
    axis (the mirror image).
*/
export const autoAngle = (orient: string): number =>
  orient === "top" ? 30 : -30;

/**
    Whether a `labelRotation` setting rotates the labels: `true`, or a
    number that isn't a multiple of 180. `undefined` leaves it to the
    layout, which this doesn't decide.
*/
export function settingRotates(setting: unknown): boolean {
  if (typeof setting === "number")
    return Number.isFinite(setting) && normalizeAngle(setting) !== 0;
  return setting === true;
}

/**
    Whether a `labelRotation` setting lays its labels out at their angle
    (see `slantedLabelBox`): a number that rotates them, except ±90 on a
    horizontal axis, which stands them upright as `true` does.
*/
export function slantsLabels(setting: unknown, horizontal: boolean): boolean {
  if (!settingRotates(setting) || typeof setting !== "number") return false;
  return !horizontal || Math.abs(normalizeAngle(setting)) !== 90;
}

/**
    The angle (in radians, 0 to π/2) between a label's text at `angle` and
    the axis it labels: 0 when the text runs along the axis, π/2 when it
    stands straight out from it.
*/
export function axisCrossing(angle: number, horizontal: boolean): number {
  const a = (Math.abs(angle) * Math.PI) / 180;
  return horizontal ? a : Math.PI / 2 - a;
}

/** The unit vector pointing away from the axis, toward its labels. */
function outward(orient: AxisOrient): Point {
  return orient === "bottom"
    ? {x: 0, y: 1}
    : orient === "top"
      ? {x: 0, y: -1}
      : orient === "left"
        ? {x: -1, y: 0}
        : {x: 1, y: 0};
}

/**
    Which end of a rotated label's text sits at its tick: the end nearer the
    axis. On a bottom axis, text rising to the right (a negative angle) ends
    at its tick and text falling to the right starts at it; a top axis is
    the reverse; a left axis's labels end at their ticks, a right axis's start
    at them.
*/
export function rotatedTextAnchor(
  orient: AxisOrient,
  angle: number,
): "start" | "middle" | "end" {
  const t = (angle * Math.PI) / 180;
  const o = outward(orient);
  const along = Math.cos(t) * o.x + Math.sin(t) * o.y;
  return Math.abs(along) < 1e-9 ? "middle" : along < 0 ? "end" : "start";
}

/** A slanted label's box before rotation, and its corners once rotated. */
export interface SlantedLabelBox {
  /** The unrotated box, relative to the tick; it rotates about its center. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** The rotated text's four corners, relative to the tick. */
  corners: Point[];
}

/**
    Where a slanted label goes: its text (`width` long, `textHeight` thick,
    in a box `height` tall) rotated by `angle` about the box's center, with
    the text's end nearest the axis (see `rotatedTextAnchor`) across from its
    tick and every corner at least `gap` from the axis line.
*/
export function slantedLabelBox(
  orient: AxisOrient,
  angle: number,
  width: number,
  textHeight: number,
  height: number,
  gap: number,
): SlantedLabelBox {
  const t = (angle * Math.PI) / 180;
  const u = {x: Math.cos(t), y: Math.sin(t)};
  const n = {x: -Math.sin(t), y: Math.cos(t)};
  const o = outward(orient);
  const anchor = rotatedTextAnchor(orient, angle);
  const across = Math.abs(n.x * o.x + n.y * o.y);
  const a = {
    x: o.x * (gap + (textHeight / 2) * across),
    y: o.y * (gap + (textHeight / 2) * across),
  };
  // The anchor, in the text's own (unrotated) coordinates from its box's top left.
  const ax = anchor === "end" ? width : anchor === "start" ? 0 : width / 2;
  const ay = textHeight / 2;
  const at = (px: number, py: number): Point => ({
    x: a.x + (px - ax) * u.x + (py - ay) * n.x,
    y: a.y + (px - ax) * u.y + (py - ay) * n.y,
  });
  const center = at(width / 2, height / 2);
  return {
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
    corners: [at(0, 0), at(width, 0), at(width, textHeight), at(0, textHeight)],
  };
}

/**
    How far a slanted label reaches from its tick along the axis, before and
    after it (toward lower and higher positions).
*/
export function slantedReach(
  orient: AxisOrient,
  angle: number,
  width: number,
  textHeight: number,
): [number, number] {
  const horizontal = orient === "top" || orient === "bottom";
  const along = slantedLabelBox(
    orient,
    angle,
    width,
    textHeight,
    textHeight,
    0,
  ).corners.map(c => (horizontal ? c.x : c.y));
  return [Math.max(0, -Math.min(...along)), Math.max(0, Math.max(...along))];
}

/**
    How far a slanted label reaches out from the axis line: its text's
    length and thickness projected across the axis.
*/
export function slantedDepth(
  angle: number,
  horizontal: boolean,
  width: number,
  textHeight: number,
): number {
  const phi = axisCrossing(angle, horizontal);
  return width * Math.sin(phi) + textHeight * Math.cos(phi);
}

/**
    The longest and thickest a slanted label's text may be: as long as
    reaches `depth` out from the axis (with one line of `lineHeight`), and
    as thick as fits between labels `space` apart along the axis (at least
    one line). Text running along the axis is `space` long and `depth`
    thick.
*/
export function slantedWrapSize(
  angle: number,
  horizontal: boolean,
  depth: number,
  space: number,
  lineHeight: number,
): {width: number; height: number} {
  const phi = axisCrossing(angle, horizontal);
  const sin = Math.sin(phi);
  // Text running along the axis wraps like flat labels on a horizontal one.
  if (sin < 1e-9) return {width: space, height: depth};
  return {
    width: Math.max(0, (depth - lineHeight * Math.cos(phi)) / sin),
    height: Math.max(lineHeight, space * sin),
  };
}
