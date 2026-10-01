/**
    Pure geometry for the nested-circle size legend: given a radius scale and
    a handful of values, lays out concentric circles sharing a bottom tangent,
    a leader line from each circle's top to a label column on the right, and
    the labels themselves (nudged apart when small circles crowd them).

    No DOM: text is measured with `textWidth`, so the same layout feeds both
    the chart's margin reservation and its final paint.

    @module
*/
import {ticks} from "d3-array";

import {textWidth} from "@d3plus/dom";

/** A continuous radius scale — the subset of a d3 scale the legend reads. */
export interface SizeLegendScale {
  (value: number): number;
  domain(): number[];
  invert?(radius: number): number;
}

/** A chart's size legend as measured, and the chart area it would share, for the `sizeLegend` visibility check. */
export interface SizeLegendSize {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
}

/**
    The default `sizeLegend` rule: show the legend (marks are sized by more
    than one value, or there'd be nothing to measure) unless it would take up
    more than a third of the chart's width or height.
*/
export function sizeLegendFits(_config: unknown, _scale: SizeLegendScale, size: SizeLegendSize): boolean {
  return size.width <= size.availableWidth / 3 && size.height <= size.availableHeight / 3;
}

/** Values to show: explicit numbers, a count of auto-picked values, or a picker. */
export type SizeLegendValues = number[] | number | ((domain: [number, number]) => number[]);

export interface SizeLegendLayoutInput {
  scale: SizeLegendScale;
  values?: SizeLegendValues;
  tickFormat: (value: number) => string;
  fontFamily: string;
  fontSize: number;
  title?: string;
  titleFontFamily: string;
  titleFontSize: number;
  titleFontWeight: number | string;
  /** Gap between the widest circle's right edge and the leader-line end. */
  lineLength: number;
  /** Gap between the leader-line end and its label. */
  labelPadding: number;
  /** Padding around the whole legend. */
  padding: number;
  /** Drop any value whose circle would be larger than this radius. */
  maxRadius?: number;
}

export interface SizeLegendCircle {
  value: number;
  cx: number;
  cy: number;
  r: number;
}

export interface SizeLegendLine {
  value: number;
  points: [number, number][];
}

export interface SizeLegendLabel {
  value: number;
  text: string;
  /** The label's left edge. */
  x: number;
  /** Vertical center of the label. */
  y: number;
  width: number;
}

export interface SizeLegendLayout {
  circles: SizeLegendCircle[];
  lines: SizeLegendLine[];
  labels: SizeLegendLabel[];
  /** The title, centered on `x`, with `y` its baseline. */
  title?: {text: string; x: number; y: number; width: number};
  width: number;
  height: number;
}

/** A layout with nothing to draw. */
export const emptySizeLegendLayout = (): SizeLegendLayout => ({
  circles: [],
  lines: [],
  labels: [],
  width: 0,
  height: 0,
});

/** How many significant digits a number needs (500 → 1, 18 → 2). */
function significantDigits(n: number): number {
  for (let p = 1; p < 15; p++) if (Number(n.toPrecision(p)) === n) return p;
  return 15;
}

/**
    The default values for a domain: its min and max (the real extremes, so
    the outer and inner circles match the chart's largest and smallest marks)
    plus, between them, the roundest number near each evenly spaced target —
    among the candidates within 15% of the range of a target, the one with
    the fewest significant digits, then the closest.
*/
export function defaultSizeLegendValues(domain: [number, number], count = 3): number[] {
  const [lo, hi] = domain;
  if (count <= 1) return [hi];
  if (count === 2) return [lo, hi];
  const inner = ticks(lo, hi, count * 4).filter(t => t > lo && t < hi);
  const tolerance = (hi - lo) * 0.15;
  const picked: number[] = [];
  for (let k = 1; k < count - 1; k++) {
    const target = lo + ((hi - lo) * k) / (count - 1);
    const near = inner.filter(t => !picked.includes(t) && Math.abs(t - target) <= tolerance);
    near.sort(
      (a, b) =>
        significantDigits(a) - significantDigits(b) || Math.abs(a - target) - Math.abs(b - target),
    );
    if (near.length) picked.push(near[0]);
  }
  return [lo, ...picked.sort((a, b) => a - b), hi];
}

/** Resolves the `values` option against a domain: sorted descending, deduped, finite. */
function resolveValues(values: SizeLegendValues | undefined, domain: [number, number]): number[] {
  const raw =
    typeof values === "function"
      ? values(domain)
      : Array.isArray(values)
        ? values
        : defaultSizeLegendValues(domain, values ?? 3);
  return Array.from(new Set(raw.filter(v => Number.isFinite(v)))).sort((a, b) => b - a);
}

/**
    Lays out the legend: circles sharing a bottom edge, a leader line from
    each circle's top to its label in a column on the right (labels are
    pushed apart so they never overlap), and the title centered over the
    circles. Returns an empty layout when the scale's domain is a single
    value (nothing to compare) or every value maps to a zero radius.
*/
export function computeSizeLegend(input: SizeLegendLayoutInput): SizeLegendLayout {
  const domain = input.scale.domain() as [number, number];
  if (domain.length < 2 || !Number.isFinite(domain[0]) || !Number.isFinite(domain[1]) || domain[0] === domain[1])
    return emptySizeLegendLayout();

  const limit = input.maxRadius ?? Infinity;
  const values = resolveValues(input.values, domain).filter(v => input.scale(v) <= limit + 0.5);
  const radii = values.map(v => Math.max(0, input.scale(v) || 0));
  const maxR = Math.max(0, ...radii);
  if (!values.length || !maxR) return emptySizeLegendLayout();

  const {padding, fontSize} = input;
  const lineHeight = fontSize * 1.2;
  const texts = values.map(v => input.tickFormat(v));
  const widths = texts.map(t => textWidth(t, {"font-family": input.fontFamily, "font-size": fontSize}));

  const titleText = input.title ? String(input.title) : "";
  const titleWidth = titleText
    ? textWidth(titleText, {
        "font-family": input.titleFontFamily,
        "font-size": input.titleFontSize,
        "font-weight": input.titleFontWeight,
      })
    : 0;
  const titleHeight = titleText ? input.titleFontSize * 1.2 + 2 : 0;

  // Horizontal: the circles and their label column, in the wider of that
  // block and the title, with the circles centered under the title as far as
  // the label column allows.
  const block = maxR * 2 + input.lineLength + input.labelPadding + Math.max(...widths);
  const inner = Math.max(block, titleWidth);
  const cx = Math.min(padding + inner / 2, padding + inner - block + maxR);

  // Vertical: each label is centered on its circle's top, so the largest
  // circle's pokes half a line above it.
  const top = padding + titleHeight + lineHeight / 2;
  const base = top + maxR * 2;
  const circles = values.map((value, i) => ({value, cx, cy: base - radii[i], r: radii[i]}));

  const labelX = cx + maxR + input.lineLength + input.labelPadding;
  const labels: SizeLegendLabel[] = [];
  const lines: SizeLegendLine[] = [];
  let lastY = -Infinity;
  circles.forEach((c, i) => {
    const circleTop = c.cy - c.r;
    const y = Math.max(circleTop, lastY + lineHeight);
    lastY = y;
    labels.push({value: c.value, text: texts[i], x: labelX, y, width: widths[i]});
    const points: [number, number][] = [[c.cx, circleTop], [c.cx + maxR, circleTop]];
    if (y !== circleTop) points.push([c.cx + maxR + input.lineLength / 2, y]);
    points.push([labelX - input.labelPadding, y]);
    lines.push({value: c.value, points});
  });

  let title: SizeLegendLayout["title"];
  if (titleText) {
    const x = Math.min(Math.max(cx, padding + titleWidth / 2), padding + inner - titleWidth / 2);
    title = {text: titleText, x, y: padding + input.titleFontSize, width: titleWidth};
  }

  const height = Math.max(base, lastY + lineHeight / 2) + padding;
  return {circles, lines, labels, title, width: Math.ceil(inner + padding * 2), height: Math.ceil(height)};
}

/**
    The legend scale for marks drawn under a zoom of `k`: on screen, each
    mark's radius is `k` times its layout radius, so the circles for a value
    grow by `k` too. To keep the legend inside the space reserved for its
    unzoomed circles, the domain's top shrinks to the value whose zoomed
    circle fits in the unzoomed largest one's space (rounded down to a nice
    number) — the legend relabels rather than grows. Scales without
    `invert` keep their domain.
*/
export function zoomSizeLegendScale(scale: SizeLegendScale, k: number): SizeLegendScale {
  if (k === 1 || !Number.isFinite(k) || k <= 0) return scale;
  const [lo, hi] = scale.domain() as [number, number];
  const fit = scale.invert ? Math.max(lo, Math.min(hi, scale.invert(scale(hi) / k))) : hi;
  // Round down to a nice value (the extremes only need to be exact unzoomed,
  // where they're real marks); a nice value still fits inside the reservation.
  const nice = fit < hi ? ticks(lo, fit, 4).filter(t => t > lo && t <= fit).pop() : undefined;
  const top = nice ?? fit;
  const zoomed = ((v: number) => scale(v) * k) as SizeLegendScale;
  zoomed.domain = () => [lo, top];
  return zoomed;
}
