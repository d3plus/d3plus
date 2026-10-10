/**
    Pure layout for the category labels around a polar chart. Each label sits
    just outside the outer radius at its slot's center angle. Labels read
    horizontally, each box pushed away from the circle along its angle (so a
    label at 3 o'clock grows rightward, one at 12 o'clock upward); when
    neighbors would overlap that way, every label turns to read along its
    spoke instead (see `radarAxisLabelLayout`). Angles are radians, 0 at
    12 o'clock, increasing clockwise.
*/

const EPSILON = 1e-9;

/** Gap (px) between the outer radius and each category label. */
export const POLAR_LABEL_PADDING = 6;

/** The circle keeps at least this share of the largest radius that fits the area. */
export const POLAR_MIN_RADIUS_SHARE = 0.5;

/** A horizontal label's size and the angle it sits at. */
export interface PolarLabelBox {
  angle: number;
  width: number;
  height: number;
}

/** A placed horizontal label: its box's top-left corner, relative to the center. */
export interface PolarLabelPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    Where a horizontal `width` × `height` label sits for a circle of radius
    `r`: the point `padding` px beyond the circle at `angle`, with the box
    shifted by half its size along the angle's direction so its nearest edge
    meets that point.
*/
export function polarLabelPlacement(
  angle: number,
  r: number,
  width: number,
  height: number,
  padding = POLAR_LABEL_PADDING,
): PolarLabelPlacement {
  const ux = Math.sin(angle);
  const uy = -Math.cos(angle);
  const cx = (r + padding) * ux + (ux * width) / 2;
  const cy = (r + padding) * uy + (uy * height) / 2;
  return {x: cx - width / 2, y: cy - height / 2, width, height};
}

/**
    The largest radius at which every horizontal label fits inside a
    `width` × `height` area centered on the circle (never more than the area's
    own half-size, never below 0).
*/
export function polarLabelFitRadius(
  boxes: PolarLabelBox[],
  width: number,
  height: number,
  padding = POLAR_LABEL_PADDING,
): number {
  let r = Math.min(width, height) / 2;
  for (const b of boxes) {
    const sx = Math.abs(Math.sin(b.angle));
    const sy = Math.abs(Math.cos(b.angle));
    if (sx > EPSILON)
      r = Math.min(r, (width / 2 - (b.width / 2) * (1 + sx)) / sx - padding);
    if (sy > EPSILON)
      r = Math.min(r, (height / 2 - (b.height / 2) * (1 + sy)) / sy - padding);
  }
  return Math.max(0, r);
}

/**
    How wide a horizontal label at `angle` may be for a circle of radius `r`
    before it leaves a `width`-wide area. Infinite at 12 and 6 o'clock, where
    a label grows vertically only.
*/
export function polarLabelRoom(
  angle: number,
  r: number,
  width: number,
  padding = POLAR_LABEL_PADDING,
): number {
  const sx = Math.abs(Math.sin(angle));
  if (sx <= EPSILON) return width;
  return Math.max(0, ((width / 2 - (r + padding) * sx) * 2) / (1 + sx));
}

/** Whether two placed boxes overlap, allowing `gap` px between them. */
const overlaps = (
  a: PolarLabelPlacement,
  b: PolarLabelPlacement,
  gap: number,
): boolean =>
  a.x < b.x + b.width + gap &&
  b.x < a.x + a.width + gap &&
  a.y < b.y + b.height + gap &&
  b.y < a.y + a.height + gap;

/**
    Whether any two neighboring labels (in angle order, wrapping around)
    overlap when placed horizontally around a circle of radius `r`.
*/
export function polarLabelsCollide(
  boxes: PolarLabelBox[],
  r: number,
  padding = POLAR_LABEL_PADDING,
  gap = 2,
): boolean {
  if (boxes.length < 2) return false;
  const placed = boxes
    .map(b => ({
      angle: b.angle,
      p: polarLabelPlacement(b.angle, r, b.width, b.height, padding),
    }))
    .sort((a, b) => a.angle - b.angle);
  for (let i = 0; i < placed.length; i++) {
    const next = placed[(i + 1) % placed.length];
    if (next === placed[i]) continue;
    if (overlaps(placed[i].p, next.p, gap)) return true;
  }
  return false;
}

/** The horizontal layout: the circle's radius, and each label's box. */
export interface PolarHorizontalLayout {
  radius: number;
  labels: {width: number; height: number; lines: number}[];
}

/**
    Sizes the circle to horizontal labels measured on one line
    (`widths[i]`, each `lineHeight` tall). The circle gets the largest radius
    at which every label fits, down to `minRadiusShare` of the area's
    half-size; below that, labels that don't fit narrow to their room and wrap
    onto two lines.
*/
export function polarHorizontalLayout(opts: {
  angles: number[];
  widths: number[];
  lineHeight: number;
  width: number;
  height: number;
  padding?: number;
  minRadiusShare?: number;
}): PolarHorizontalLayout {
  const {angles, widths, lineHeight, width, height} = opts;
  const padding = opts.padding ?? POLAR_LABEL_PADDING;
  const maxRadius = Math.max(0, Math.min(width, height) / 2);
  const minRadius = maxRadius * (opts.minRadiusShare ?? POLAR_MIN_RADIUS_SHARE);
  const boxes = angles.map((angle, i) => ({
    angle,
    width: widths[i],
    height: lineHeight,
  }));
  const fit = polarLabelFitRadius(boxes, width, height, padding);
  if (fit >= minRadius)
    return {
      radius: fit,
      labels: widths.map(w => ({width: w, height: lineHeight, lines: 1})),
    };
  return {
    radius: minRadius,
    labels: angles.map((angle, i) => {
      const room = polarLabelRoom(angle, minRadius, width, padding);
      return widths[i] <= room
        ? {width: widths[i], height: lineHeight, lines: 1}
        : {width: room, height: lineHeight * 2, lines: 2};
    }),
  };
}

/**
    How a label reading along its spoke is turned so it never reads upside
    down: rotated by the spoke's direction in degrees (0 at 3 o'clock), and
    flipped half a turn on the left half of the circle, where it then runs
    toward the center (`"end"`) instead of away from it (`"start"`).
*/
export function polarSpokeRotation(angle: number): {
  rotate: number;
  anchor: "start" | "end";
} {
  const deg = (((((angle - Math.PI / 2) * 180) / Math.PI) % 360) + 360) % 360;
  return Math.sin(angle) < -EPSILON
    ? {rotate: deg - 180, anchor: "end"}
    : {rotate: deg, anchor: "start"};
}
