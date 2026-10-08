/**
    Pure label fitting for the Sunburst: splits a label into whole words, and
    finds the box (and rotation) that fits those words inside an arc, favoring
    rotations close to horizontal.

    Angles follow d3-shape's convention: 0 is 12 o'clock, increasing clockwise.
    Box rotations are in degrees, clockwise, and always within (-90, 90] so text
    never reads upside down.
*/

import {textSplit} from "@d3plus/text";

import {degrees, radialRotation, tangentialRotation} from "./geometry.js";
import type {SunburstArc} from "./geometry.js";

const TAU = Math.PI * 2;
const EPSILON = 1e-6;
const SOFT_HYPHEN = "­";

/** Where an arc's label goes: a box centered at (x, y), rotated `rotate` degrees about its center. */
export interface SunburstLabelBox {
  orientation: "center" | "tangential" | "radial" | "horizontal" | "angled";
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  /** The largest font size (px) the label fits at in this box. */
  fontSize: number;
}

/** A label's words measured at a 1px font size, so any size is a multiplication away. */
export interface SunburstLabelMetrics {
  words: number[];
  space: number;
}

export interface SunburstLabelFitOptions {
  /** Smallest font size worth drawing (px). Default 8. */
  fontMin?: number;
  /** Largest font size to try (px). Default 24. */
  fontMax?: number;
  /** Inner padding of the label box (px). Default 2. */
  padding?: number;
  /** Line height as a multiple of the font size. Default 1.2. */
  lineHeight?: number;
  /** Most lines a label may wrap to. Default 3. */
  maxLines?: number;
  /**
      A rotation counts as comfortable when its text is at least this share of
      the largest size any rotation allows; the comfortable rotation closest to
      horizontal wins. Default 0.7.
  */
  comfort?: number;
}

/**
    Splits a label into words at spaces only — the shared splitter, with its
    hyphenated syllables joined back into whole words, so a long word is never
    broken across lines.
*/
export function sunburstSplit(sentence: string): string[] {
  const words: string[] = [];
  let joining = false;
  for (const part of textSplit(sentence)) {
    if (joining) words[words.length - 1] += part.replace(SOFT_HYPHEN, "");
    else words.push(part.replace(SOFT_HYPHEN, ""));
    joining = part.endsWith(SOFT_HYPHEN);
  }
  return words;
}

/** A box (centered at x, y and rotated `rotate` degrees) to test against an arc. */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
}

/** Whether `point` lies inside the arc's angular span. */
function withinSpan(arc: SunburstArc, [px, py]: [number, number]): boolean {
  const rel = (((Math.atan2(px, -py) - arc.startAngle) % TAU) + TAU) % TAU;
  return rel <= arc.endAngle - arc.startAngle + EPSILON || rel >= TAU - EPSILON;
}

/**
    Whether a box lies entirely inside an arc: every corner within the outer
    radius and the angular span, and the whole box clear of the inner radius.
    A span wider than a half turn isn't convex, so its edges are sampled too.
*/
export function boxInArc(arc: SunburstArc, box: Box): boolean {
  const rad = (box.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = box.width / 2;
  const hh = box.height / 2;
  const at = (lx: number, ly: number): [number, number] => [
    box.x + lx * cos - ly * sin,
    box.y + lx * sin + ly * cos,
  ];
  const corners = [at(-hw, -hh), at(hw, -hh), at(hw, hh), at(-hw, hh)];
  if (
    corners.some(([px, py]) => Math.hypot(px, py) > arc.outerRadius + EPSILON)
  )
    return false;

  if (arc.innerRadius > 0) {
    // The origin in the box's own frame, and its distance to the box.
    const lx = -box.x * cos - box.y * sin;
    const ly = box.x * sin - box.y * cos;
    const gap = Math.hypot(
      Math.max(Math.abs(lx) - hw, 0),
      Math.max(Math.abs(ly) - hh, 0),
    );
    if (gap < arc.innerRadius - EPSILON) return false;
  }

  const span = arc.endAngle - arc.startAngle;
  if (span >= TAU - EPSILON) return true;
  const points = [...corners];
  if (span > Math.PI) {
    for (let k = 1; k < 8; k++) {
      const t = k / 8;
      points.push(
        at(-hw + 2 * hw * t, -hh),
        at(-hw + 2 * hw * t, hh),
        at(-hw, -hh + 2 * hh * t),
        at(hw, -hh + 2 * hh * t),
      );
    }
  }
  return points.every(p => withinSpan(arc, p));
}

/** The widest box of the given height, centered at (x, y) and rotated `rotate` degrees, that fits the arc. */
export function maxBoxWidth(
  arc: SunburstArc,
  x: number,
  y: number,
  rotate: number,
  height: number,
): number {
  const fits = (width: number) => boxInArc(arc, {x, y, width, height, rotate});
  if (!fits(EPSILON)) return 0;
  let lo = 0;
  let hi = arc.outerRadius * 2;
  for (let k = 0; k < 16; k++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
    How many lines a label wraps to at `fontSize` within `width`, breaking only
    between words; Infinity when a single word is wider than the line.
*/
export function wrapLineCount(
  metrics: SunburstLabelMetrics,
  fontSize: number,
  width: number,
): number {
  let lines = 1;
  let current = 0;
  for (const word of metrics.words) {
    const w = word * fontSize;
    if (w > width + EPSILON) return Infinity;
    const next = current ? current + metrics.space * fontSize + w : w;
    if (next > width + EPSILON) {
      lines++;
      current = w;
    } else current = next;
  }
  return lines;
}

/** The box a label fits at `fontSize` in one rotation, trying 1 to `maxLines` lines; null when none fits. */
function fitAt(
  arc: SunburstArc,
  center: [number, number],
  rotate: number,
  metrics: SunburstLabelMetrics,
  fontSize: number,
  options: Required<SunburstLabelFitOptions>,
): {width: number; height: number} | null {
  const {padding, lineHeight, maxLines} = options;
  for (let n = 1; n <= maxLines; n++) {
    const height = n * lineHeight * fontSize + padding * 2;
    const width = maxBoxWidth(arc, center[0], center[1], rotate, height);
    if (width <= padding * 2) return null;
    if (wrapLineCount(metrics, fontSize, width - padding * 2) <= n)
      return {width, height};
  }
  return null;
}

/**
    The largest whole font size (between `fontMin` and `fontMax`) a label fits
    at in one rotation, with its box; null when it doesn't fit at `fontMin`.
*/
export function fitRotation(
  arc: SunburstArc,
  center: [number, number],
  rotate: number,
  metrics: SunburstLabelMetrics,
  options: SunburstLabelFitOptions = {},
): {fontSize: number; width: number; height: number} | null {
  const opts = withDefaults(options);
  if (!fitAt(arc, center, rotate, metrics, opts.fontMin, opts)) return null;
  let lo = opts.fontMin;
  let hi = Math.max(opts.fontMin, opts.fontMax);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fitAt(arc, center, rotate, metrics, mid, opts)) lo = mid;
    else hi = mid - 1;
  }
  const box = fitAt(arc, center, rotate, metrics, lo, opts)!;
  return {fontSize: lo, ...box};
}

/**
    The rotations worth trying at polar angle `a` (degrees): along the arc,
    along the radius, horizontal, and every 15° step between them — ordered
    from the most horizontal.
*/
export function labelRotations(a: number): number[] {
  const tangential = tangentialRotation(a);
  const radial = radialRotation(a);
  const lo = Math.min(tangential, radial, 0);
  const hi = Math.max(tangential, radial, 0);
  const angles = new Set([0, tangential, radial]);
  for (let step = Math.ceil(lo / 15) * 15; step <= hi; step += 15)
    angles.add(step);
  return [...angles].sort((x, y) => Math.abs(x) - Math.abs(y) || y - x);
}

function withDefaults(
  options: SunburstLabelFitOptions,
): Required<SunburstLabelFitOptions> {
  return {
    fontMin: 8,
    fontMax: 24,
    padding: 2,
    lineHeight: 1.2,
    maxLines: 3,
    comfort: 0.7,
    ...options,
  };
}

/**
    Decides whether, and how, a label fits inside an arc.

    The full-circle center disc gets an upright box. A ring arc tries the
    rotations from `labelRotations`, each centered on the arc's middle, and
    finds the largest font size its words fit at without breaking a word.
    Among the rotations that reach a comfortable size (`comfort` × the largest
    any rotation allows), the one closest to horizontal wins — so a label only
    turns toward the radius when it has to. Returns null when no rotation fits
    the label at `fontMin`.

    @param arc The node's polar extent.
    @param metrics The label's word widths at a 1px font size.
    @param options Font range, padding, line height, line limit, and comfort.
*/
export function sunburstLabelBox(
  arc: SunburstArc,
  metrics: SunburstLabelMetrics,
  options: SunburstLabelFitOptions = {},
): SunburstLabelBox | null {
  const span = arc.endAngle - arc.startAngle;
  if (
    !metrics.words.length ||
    !(span > 0) ||
    !(arc.outerRadius > arc.innerRadius)
  )
    return null;
  const opts = withDefaults(options);

  if (arc.innerRadius <= 0 && span >= TAU - EPSILON) {
    const fit = fitRotation(arc, [0, 0], 0, metrics, opts);
    return fit ? {orientation: "center", x: 0, y: 0, rotate: 0, ...fit} : null;
  }

  const mid = (arc.startAngle + arc.endAngle) / 2;
  const rm = (arc.innerRadius + arc.outerRadius) / 2;
  const center: [number, number] = [rm * Math.sin(mid), -rm * Math.cos(mid)];
  const a = degrees(mid);
  const fits = labelRotations(a)
    .map(rotate => ({
      rotate,
      fit: fitRotation(arc, center, rotate, metrics, opts),
    }))
    .filter(c => c.fit);
  if (!fits.length) return null;
  const largest = Math.max(...fits.map(c => c.fit!.fontSize));
  const chosen = fits.find(c => c.fit!.fontSize >= largest * opts.comfort)!;
  const {rotate} = chosen;
  const orientation =
    rotate === tangentialRotation(a)
      ? "tangential"
      : rotate === radialRotation(a)
        ? "radial"
        : rotate === 0
          ? "horizontal"
          : "angled";
  return {orientation, x: center[0], y: center[1], rotate, ...chosen.fit!};
}
