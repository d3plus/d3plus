/**
    Radar metric-label sizing: how much room the labels around the web need,
    and therefore how large the web itself can be. Each label reads along its
    spoke, starting `RADAR_LABEL_PADDING` px beyond the outer ring, so it
    occupies a rotated box — `width` along the spoke, `height` across it. The
    web gets the largest radius at which every label box still fits inside
    the chart area; labels too long for that wrap (and, at worst, truncate)
    rather than shrinking the web below a minimum share of the space.
*/

/** Gap (px) between the outer ring and the start of each metric label. */
export const RADAR_LABEL_PADDING = 10;

/** The web keeps at least this share of the largest radius that fits the area. */
export const RADAR_MIN_RADIUS_SHARE = 0.5;

/** Gap (px) kept between the metric labels and the edge of the chart area. */
export const RADAR_EDGE_GAP = 2;

/** Lines a metric label may wrap onto before it truncates. */
export const RADAR_LABEL_MAX_LINES = 2;

const EPSILON = 1e-9;

export interface RadarLabelBox {
  /** Spoke direction, in radians (screen coordinates, clockwise from 3 o'clock). */
  angle: number;
  /** Length along the spoke (the text width). */
  width: number;
  /** Thickness across the spoke (the text block height). */
  height: number;
}

/**
    How long (px, along the spoke) a label at `angle` may be when the web has
    radius `r`, given its thickness `h` and a `width` × `height` area centered
    on the web. Infinite when the spoke runs parallel to an edge it never nears.
*/
export function radarLabelRoom(
  angle: number,
  r: number,
  h: number,
  width: number,
  height: number,
  padding = RADAR_LABEL_PADDING,
): number {
  const c = Math.abs(Math.cos(angle));
  const s = Math.abs(Math.sin(angle));
  let room = Infinity;
  if (c > EPSILON) room = Math.min(room, (width / 2 - (h / 2) * s) / c - r - padding);
  if (s > EPSILON) room = Math.min(room, (height / 2 - (h / 2) * c) / s - r - padding);
  return room;
}

/**
    The largest web radius at which every label box fits inside a
    `width` × `height` area centered on the web (never more than the area's
    own half-size, never below 0).
*/
export function radarFitRadius(
  boxes: RadarLabelBox[],
  width: number,
  height: number,
  padding = RADAR_LABEL_PADDING,
): number {
  let r = Math.min(width, height) / 2;
  for (const b of boxes) {
    const c = Math.abs(Math.cos(b.angle));
    const s = Math.abs(Math.sin(b.angle));
    if (c > EPSILON) r = Math.min(r, (width / 2 - (b.height / 2) * s) / c - padding - b.width);
    if (s > EPSILON) r = Math.min(r, (height / 2 - (b.height / 2) * c) / s - padding - b.width);
  }
  return Math.max(0, r);
}

export interface RadarLabelWrap {
  lines: string[];
  widths: number[];
  truncated: boolean;
}

export interface RadarAxisLabelInput {
  text: string;
  /** Spoke direction, in radians. */
  angle: number;
  lineHeight: number;
}

export interface RadarAxisLabelOpts<L extends RadarAxisLabelInput> {
  labels: L[];
  width: number;
  height: number;
  /** Measures a label on one line. */
  measure: (label: L) => number;
  /** Wraps a label into at most `maxLines` lines no wider than `wrapWidth`. */
  wrap: (label: L, wrapWidth: number, maxLines: number) => RadarLabelWrap;
  padding?: number;
  minRadiusShare?: number;
  maxLines?: number;
}

export interface RadarAxisLabelLayout {
  radius: number;
  /** Per label: the wrap width to lay it out in, and its resulting box. */
  labels: {wrapWidth: number; width: number; height: number; lines: number; truncated: boolean}[];
}

/**
    Sizes the web to its metric labels. Labels stay on one line when the web
    can be at least `minRadiusShare` of its largest possible radius that way;
    otherwise the radius is the largest one (down to that minimum) at which
    the labels that don't fit wrap onto `maxLines` lines without truncating.
    At the minimum radius, labels that still don't fit truncate.
*/
export function radarAxisLabelLayout<L extends RadarAxisLabelInput>(
  opts: RadarAxisLabelOpts<L>,
): RadarAxisLabelLayout {
  const {labels, width, height, measure, wrap} = opts;
  const padding = opts.padding ?? RADAR_LABEL_PADDING;
  const maxLines = opts.maxLines ?? RADAR_LABEL_MAX_LINES;
  const maxRadius = Math.max(0, Math.min(width, height) / 2);
  const minRadius = maxRadius * (opts.minRadiusShare ?? RADAR_MIN_RADIUS_SHARE);

  const single = labels.map(l => measure(l));
  const singleRadius = radarFitRadius(
    labels.map((l, i) => ({angle: l.angle, width: single[i], height: l.lineHeight})),
    width,
    height,
    padding,
  );
  if (singleRadius >= minRadius) {
    return {
      radius: singleRadius,
      labels: labels.map((l, i) => ({
        wrapWidth: single[i] + 1,
        width: single[i],
        height: l.lineHeight,
        lines: 1,
        truncated: false,
      })),
    };
  }

  const layoutAt = (r: number): RadarAxisLabelLayout["labels"] =>
    labels.map((l, i) => {
      if (single[i] <= radarLabelRoom(l.angle, r, l.lineHeight, width, height, padding))
        return {wrapWidth: single[i] + 1, width: single[i], height: l.lineHeight, lines: 1, truncated: false};
      const room = radarLabelRoom(l.angle, r, l.lineHeight * maxLines, width, height, padding);
      const wrapWidth = Math.max(0, room);
      const res = wrap(l, wrapWidth, maxLines);
      return {
        wrapWidth,
        width: Math.max(0, ...res.widths),
        height: Math.max(1, res.lines.length) * l.lineHeight,
        lines: res.lines.length,
        truncated: res.truncated,
      };
    });
  const fits = (layout: RadarAxisLabelLayout["labels"]): boolean => layout.every(l => !l.truncated);

  let lo = minRadius;
  let best = layoutAt(lo);
  if (!fits(best)) return {radius: minRadius, labels: best};
  let hi = maxRadius;
  for (let step = 0; step < 16 && hi - lo > 0.5; step++) {
    const mid = (lo + hi) / 2;
    const layout = layoutAt(mid);
    if (fits(layout)) {
      lo = mid;
      best = layout;
    } else hi = mid;
  }
  return {radius: lo, labels: best};
}
