/**
    Curved labels for ring segments (Pie and Donut slices, Sunburst arcs,
    Chord groups, RadialBar tracks): text that runs along a circular arc
    through the segment, reading upright, and the fit that finds how large it
    can be. Angles are radians in d3-shape's convention (0 at 12 o'clock,
    increasing clockwise), so a point at angle `a` and radius `r` sits at
    `(r·sin a, −r·cos a)`.
*/
import type {DataPoint} from "@d3plus/data";

import {largestFontSize} from "../partition/labelWords.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {uprightPoints} from "./pathLabelGeometry.js";
import type {Pt} from "./pathLabelGeometry.js";

const TAU = Math.PI * 2;
const EPSILON = 1e-6;

/** The room a curved label keeps from its segment's edges by default, in pixels: the padding straight labels keep inside their box. */
export const RING_LABEL_PADDING = 5;

/**
    The room a curved label keeps at each end of its text: `padding`, but
    never less than 0.3em, so the first and last letters stay clear of the
    segment's ends.
    @param padding The padding in pixels.
    @param fontSize The font size.
*/
export function ringLabelEnd(padding: number, fontSize: number): number {
  return Math.max(padding, 0.3 * fontSize);
}

/** The polar extent of one ring segment. */
export interface RingArc {
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  /** The d3-shape pad angle between neighbors, measured at the default pad radius. */
  padAngle?: number;
}

/**
    Where a curved label's glyphs sit across its ring: centered between the
    radii, against the outer edge (a full Pie's rim), or against the inner
    edge (just outside a Chord's ring).
*/
export type RingLabelAlign = "middle" | "outer" | "inner";

/** Options for `ringLabelFit`. */
export interface RingLabelFitOptions {
  /** The smallest font size worth drawing. Defaults to 8. */
  fontMin?: number;
  /** The largest font size to try. Defaults to 24. */
  fontMax?: number;
  /**
      The room kept between the glyphs and the segment's edges, in pixels.
      At each end of the text it is at least 0.3em. Defaults to 5, the
      padding straight labels keep inside their box.
  */
  padding?: number;
  /** The room kept at each end of the text, when it differs from `padding`; still at least 0.3em. */
  endPadding?: number;
  /** Where the glyphs sit across the ring. Defaults to `"middle"`. */
  align?: RingLabelAlign;
  /**
      How many font sizes the text's baseline must sit from the center, so
      its letters don't fan out. Defaults to 2.5.
  */
  minRadius?: number;
  /** The most a label turns around the center, in radians. Defaults to a half turn. */
  maxTurn?: number;
  /** Whether a label too long for its arc may be cut short with an ellipsis. Defaults to `true`. */
  truncate?: boolean;
}

/** Where a curved label goes along its segment. */
export interface RingLabelFit {
  /** The path its baseline follows, reading upright, centered on the segment. */
  d: string;
  fontSize: number;
  /** The baseline's radius. */
  radius: number;
  /** Whether the text runs clockwise (the top half) or counter-clockwise (the bottom half). */
  clockwise: boolean;
  /** The path's length: the room the text has. */
  length: number;
  /** Whether the text is longer than its path, so it is cut short with an ellipsis. */
  truncated: boolean;
}

/**
    The point at angle `a` on a circle of radius `r`.
    @param r The radius.
    @param a The angle.
*/
export function ringPoint(r: number, a: number): Pt {
  return [r * Math.sin(a), -r * Math.cos(a)];
}

/**
    Whether text along the arc from `a0` to `a1` (clockwise) reads upright
    running clockwise: on the top half it does, and on the bottom half it
    runs the other way so it reads left to right. The arc's chord is parallel
    to its tangent at the middle, so the upright test for a straight line
    (`uprightPoints`) decides it.
    @param a0 Where the arc starts.
    @param a1 Where it ends, clockwise from `a0`.
*/
export function ringReadsClockwise(a0: number, a1: number): boolean {
  const ends: Pt[] = [ringPoint(1, a0), ringPoint(1, a1)];
  return uprightPoints(ends) === ends;
}

/**
    The SVG path along a circle of radius `r` from angle `a0` to `a1`
    (clockwise, under a full turn), drawn clockwise or, for text on the
    bottom half, from `a1` back to `a0`.
    @param r The radius.
    @param a0 Where the arc starts.
    @param a1 Where it ends, clockwise from `a0`.
    @param clockwise Which way the path runs.
*/
export function ringTextPath(
  r: number,
  a0: number,
  a1: number,
  clockwise: boolean,
): string {
  const round = (n: number) => Math.round(n * 100) / 100;
  const [from, to] = clockwise ? [a0, a1] : [a1, a0];
  const [x0, y0] = ringPoint(r, from);
  const [x1, y1] = ringPoint(r, to);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const R = round(r);
  return `M${round(x0)},${round(y0)}A${R},${R} 0 ${large} ${clockwise ? 1 : 0} ${round(x1)},${round(y1)}`;
}

/** The glyphs' center radius across the ring at `fontSize`, or null when they don't fit across it. */
function bandCenter(
  arc: RingArc,
  fontSize: number,
  padding: number,
  align: RingLabelAlign,
): number | null {
  const lo = arc.innerRadius + padding + fontSize / 2;
  const hi = arc.outerRadius - padding - fontSize / 2;
  if (hi < lo - EPSILON) return null;
  if (align === "outer") return hi;
  if (align === "inner") return lo;
  return (arc.innerRadius + arc.outerRadius) / 2;
}

/**
    Fits a one-line label along a ring segment: the largest font size (from
    `fontMax` down to `fontMin`) at which its glyphs fit across the ring and
    its text along the arc, `padding` pixels clear of the ring's edges and
    at least 0.3em clear of the segment's ends and pad (see `ringLabelEnd`).
    When no size fits the whole text, it sits at `fontMin` and is cut
    short with an ellipsis (unless `truncate` is false), as long as its arc
    holds a few letters. Null when the label has no room. The glyphs span
    0.8em above the baseline to 0.2em below, so the baseline sits 0.3em
    below (or, on the bottom half, above) their center.
    @param arc The segment.
    @param width The text's one-line width at a font size.
    @param options The font range, padding, and where the glyphs sit.
*/
export function ringLabelFit(
  arc: RingArc,
  width: (fontSize: number) => number,
  options: RingLabelFitOptions = {},
): RingLabelFit | null {
  const {
    fontMin = 8,
    fontMax = 24,
    padding = RING_LABEL_PADDING,
    endPadding = padding,
    align = "middle",
    minRadius = 2.5,
    maxTurn = Math.PI,
    truncate = true,
  } = options;
  const a0 = Math.min(arc.startAngle, arc.endAngle);
  const span = Math.min(TAU, Math.abs(arc.endAngle - arc.startAngle));
  if (!(span > 0) || !(arc.outerRadius > arc.innerRadius) || !(fontMin > 0))
    return null;
  // A whole disc has no ring for the text to follow.
  if (arc.innerRadius <= 0 && span >= TAU - EPSILON) return null;
  const mid = a0 + span / 2;
  const clockwise = ringReadsClockwise(mid - 0.01, mid + 0.01);
  const padRadius = Math.sqrt(arc.innerRadius ** 2 + arc.outerRadius ** 2);
  const padLength = (arc.padAngle ?? 0) * padRadius;

  /** The baseline radius and the turn the text may take, at `fontSize`. */
  const room = (fontSize: number) => {
    const center = bandCenter(arc, fontSize, padding, align);
    if (center === null) return null;
    const radius = center + (clockwise ? -0.3 : 0.3) * fontSize;
    if (radius < minRadius * fontSize) return null;
    // The glyphs' inner edge is where the segment is narrowest.
    const inner = center - fontSize / 2;
    if (!(inner > 0)) return null;
    const turn = Math.min(
      maxTurn,
      span - (padLength + ringLabelEnd(endPadding, fontSize) * 2) / inner,
      TAU - EPSILON,
    );
    return turn > 0 ? {radius, turn} : null;
  };
  const fits = (fontSize: number) => {
    const r = room(fontSize);
    return Boolean(r && width(fontSize) <= r.radius * r.turn + EPSILON);
  };

  let fontSize = largestFontSize(fits, fontMin, Math.max(fontMin, fontMax));
  const truncated = fontSize === null;
  if (truncated) {
    if (!truncate) return null;
    fontSize = fontMin;
  }
  const r = room(fontSize!);
  if (!r) return null;
  const length = r.radius * r.turn;
  // A cut-short label keeps room for a few letters and its ellipsis.
  if (truncated && length < fontSize! * 3) return null;
  return {
    d: ringTextPath(r.radius, mid - r.turn / 2, mid + r.turn / 2, clockwise),
    fontSize: fontSize!,
    radius: r.radius,
    clockwise,
    length,
    truncated,
  };
}

/**
    Fits a label and a smaller second line beneath it (such as a slice's
    share) along a ring segment: the largest font size at which both lines,
    the second at three quarters of the first's size (never below
    `fontMin`), fit across the ring and along the arc whole. "Beneath" is
    toward the center on the top half and away from it on the bottom half,
    where the text reads the other way round. Null when they don't both fit.
    @param arc The segment.
    @param width The first line's one-line width at a font size.
    @param subWidth The second line's.
    @param options The font range, padding, and where the lines sit.
*/
export function ringLabelPair(
  arc: RingArc,
  width: (fontSize: number) => number,
  subWidth: (fontSize: number) => number,
  options: RingLabelFitOptions = {},
): [RingLabelFit, RingLabelFit] | null {
  const {
    fontMin = 8,
    fontMax = 24,
    padding = RING_LABEL_PADDING,
    align = "middle",
  } = options;
  const span = Math.abs(arc.endAngle - arc.startAngle);
  const mid = Math.min(arc.startAngle, arc.endAngle) + span / 2;
  const up = ringReadsClockwise(mid - 0.01, mid + 0.01) ? 1 : -1;
  const place = (fontSize: number): [RingLabelFit, RingLabelFit] | null => {
    const sub = Math.max(fontMin, Math.round(fontSize * 0.75));
    const block = fontSize + sub * 1.3;
    const center = bandCenter(arc, block, padding, align);
    if (center === null) return null;
    const line = (c: number, size: number, w: (fs: number) => number) =>
      ringLabelFit(
        {...arc, innerRadius: c - size / 2, outerRadius: c + size / 2},
        w,
        {
          ...options,
          fontMin: size,
          fontMax: size,
          padding: 0,
          endPadding: options.endPadding ?? padding,
          align: "middle",
          truncate: false,
        },
      );
    const first = line(center + (up * (block - fontSize)) / 2, fontSize, width);
    const second = line(center - (up * (block - sub)) / 2, sub, subWidth);
    return first && second ? [first, second] : null;
  };
  const fontSize = largestFontSize(
    fs => Boolean(place(fs)),
    fontMin,
    Math.max(fontMin, fontMax),
  );
  return fontSize === null ? null : place(fontSize);
}

/** How a segment's label is placed: along its arc, straight in its largest box, or not at all. */
export type RingLabelChoice = "curved" | "straight" | null;

/** A placed label's quality: its font size, and whether its text was cut short or broken mid-word. */
export interface RingLabelCandidate {
  fontSize: number;
  truncated: boolean;
}

/**
    Picks a segment's label for its `labelPosition`. `"inside"` and
    `"outside"` keep the straight label; `"along"` keeps the curved one. Any
    other value (`"auto"`) takes the curve when it shows the whole text and
    the straight label doesn't, or shows it larger (or as large, when `ties`
    is `"curved"`); else the straight label, when there is one; else a
    cut-short curve.
    @param position The segment's `labelPosition`.
    @param straight The straight label, if it fits.
    @param curved The curved label, if it fits.
    @param ties Which label wins at the same font size. Defaults to `"straight"`.
*/
export function chooseRingLabel(
  position: unknown,
  straight: RingLabelCandidate | null,
  curved: RingLabelCandidate | null,
  ties: "straight" | "curved" = "straight",
): RingLabelChoice {
  if (position === "inside" || position === "outside")
    return straight ? "straight" : null;
  if (position === "along") return curved ? "curved" : null;
  const larger = (a: number, b: number) => (ties === "curved" ? a >= b : a > b);
  if (
    curved &&
    !curved.truncated &&
    (!straight ||
      straight.truncated ||
      larger(curved.fontSize, straight.fontSize))
  )
    return "curved";
  if (straight) return "straight";
  return curved ? "curved" : null;
}

/**
    A row's `labelPosition`.
    @param viz The chart.
    @param d The row.
    @param i Its index.
*/
export function ringLabelPosition(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): unknown {
  const position = viz.schema.labelPosition;
  return typeof position === "function" ? position(d, i) : position;
}

/**
    Whether laid-out lines show less than the whole `text`: cut short with an
    ellipsis, or a word broken across lines.
    @param lines The laid-out lines' text.
    @param text The label's text.
*/
export function textBroken(lines: string[], text: string): boolean {
  const words = (s: string) => s.split(/\s+/).filter(Boolean);
  const shown = lines.flatMap(words);
  const whole = words(text);
  return shown.length !== whole.length || shown.some((w, k) => w !== whole[k]);
}
