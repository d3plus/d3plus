/**
    Radar metric labels along the web (see `labelPosition`): each metric's
    name curves just outside the outer ring, centered on its spoke, in the
    arc between the spokes on either side, wrapping onto a second curved
    line when it is too long for one. Curved names need only a line or two
    of room around the web, so when every name fits that way the web grows
    into the band the spoke labels would need.
*/
import type {DataPoint} from "@d3plus/data";
import {fontExists} from "@d3plus/dom";
import type {TextNode} from "@d3plus/render";
import {fontFamily as defaultFontFamily, textWrap} from "@d3plus/text";

import {resolveAccessor} from "../features/emitHelpers.js";
import {
  ringLabelFont,
  ringLabelNodes,
  ringTextWidth,
} from "../features/ringLabelNodes.js";
import type {RingLabelFont} from "../features/ringLabelNodes.js";
import {
  ringLabelEnd,
  ringLabelFit,
  ringLabelPosition,
} from "../features/ringLabels.js";
import type {RingLabelFit} from "../features/ringLabels.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The gap (px) between the outer ring and a curved metric label. */
export const RADAR_CURVE_PADDING = 5;

/** The lines a curved metric label may wrap onto. */
export const RADAR_CURVE_MAX_LINES = 2;

/** What curving a metric label needs. */
export interface RadarCurveInput {
  text: string;
  data: DataPoint;
  /** Spoke direction, in radians (clockwise from 3 o'clock). */
  angle: number;
  /**
      The angle (radians) the label's arc may span, centered on its spoke.
      Defaults to an even share of the circle.
  */
  span?: number;
  font: RingLabelFont & {fontSize: number; lineHeight?: number};
}

/** A metric label along the web: its lines, first to last, each with its curve. */
export interface RadarCurve {
  lines: {text: string; fit: RingLabelFit}[];
}

/** A label's line height: its font's, else 1.2em. */
const lineHeightOf = (l: RadarCurveInput) =>
  l.font.lineHeight ?? l.font.fontSize * 1.2;

/**
    The band (px) curved labels need around the web: `lines` of their
    largest line height (the last one only its font size) and the padding
    on either side.
    @param labels The metric labels.
    @param lines How many lines they take.
*/
export function radarCurveBand(labels: RadarCurveInput[], lines = 1): number {
  const size = Math.max(0, ...labels.map(l => l.font.fontSize));
  const lh = Math.max(0, ...labels.map(lineHeightOf));
  return size + (lines - 1) * lh + RADAR_CURVE_PADDING * 2;
}

/** The ring segment a label's `j`th line (0 nearest the web) curves along. */
function lineArc(label: RadarCurveInput, radius: number, j: number, n: number) {
  const half = (label.span ?? (Math.PI * 2) / Math.max(1, n)) / 2;
  // Ring angles run clockwise from 12 o'clock, a spoke's from 3 o'clock.
  const mid = label.angle + Math.PI / 2;
  const inner = radius + j * lineHeightOf(label);
  return {
    innerRadius: inner,
    outerRadius: inner + label.font.fontSize + RADAR_CURVE_PADDING * 2,
    startAngle: mid - half,
    endAngle: mid + half,
  };
}

/**
    A label's lines curved along the web, nearest line `0` at `radius`: the
    first line outermost where the text reads clockwise (the top half), so
    it reads top to bottom, and innermost on the bottom half. Null when any
    line doesn't fit whole.
*/
function curveLines(
  label: RadarCurveInput,
  lines: string[],
  radius: number,
  n: number,
): RadarCurve | null {
  const fit = (text: string, j: number) =>
    ringLabelFit(
      lineArc(label, radius, j, n),
      ringTextWidth(text, label.font),
      {
        fontMin: label.font.fontSize,
        fontMax: label.font.fontSize,
        padding: RADAR_CURVE_PADDING,
        align: "inner",
        minRadius: 0,
        truncate: false,
      },
    );
  const first = fit(lines[0], 0);
  if (!first) return null;
  const out: RadarCurve["lines"] = [];
  for (let k = 0; k < lines.length; k++) {
    const j = first.clockwise ? lines.length - 1 - k : k;
    const f = j === 0 ? first : fit(lines[k], j);
    if (!f) return null;
    out.push({text: lines[k], fit: f});
  }
  return out.length ? {lines: out} : null;
}

/**
    `text` wrapped onto `count` lines of as even a length as it allows: at
    the narrowest width, down to half of `width`, that keeps it on `count`
    lines.
    @param wrap The wrapper, set to the label's font.
    @param text The text.
    @param width The width it fits on `count` lines.
    @param count Its line count at `width`.
*/
export function balancedLines(
  wrap: ReturnType<typeof textWrap>,
  text: string,
  width: number,
  count: number,
): string[] {
  let best = wrap.width(width)(text).lines;
  if (count < 2) return best;
  let lo = width / 2;
  let hi = width;
  for (let step = 0; step < 8 && hi - lo > 1; step++) {
    const mid = (lo + hi) / 2;
    const res = wrap.width(mid)(text);
    if (!res.truncated && res.lines.length === count) {
      hi = mid;
      best = res.lines;
    } else lo = mid;
  }
  return best;
}

/**
    A label wrapped onto at most `maxLines` lines, each curved along the web,
    or null when it doesn't fit whole that way. It wraps to the arc nearest
    the web, a little narrower each try when a line still overruns.
*/
function wrappedCurve(
  label: RadarCurveInput,
  radius: number,
  n: number,
  maxLines: number,
): RadarCurve | null {
  const {fontSize} = label.font;
  const lh = lineHeightOf(label);
  const arc = lineArc(label, radius, 0, n);
  const inner = radius + RADAR_CURVE_PADDING;
  let width =
    (arc.endAngle - arc.startAngle) * inner -
    ringLabelEnd(RADAR_CURVE_PADDING, fontSize) * 2;
  const wrap = textWrap()
    .fontFamily(
      fontExists(label.font.fontFamily ?? defaultFontFamily) as string,
    )
    .fontSize(fontSize)
    .fontWeight(label.font.fontWeight ?? 400)
    .lineHeight(lh)
    .height(lh * maxLines)
    .maxLines(maxLines);
  for (let tries = 0; tries < 6 && width > fontSize; tries++) {
    const res = wrap.width(width)(label.text);
    if (res.truncated || !res.lines.length) return null;
    const curve = curveLines(
      label,
      balancedLines(wrap, label.text, width, res.lines.length),
      radius,
      n,
    );
    if (curve) return curve;
    width *= 0.9;
  }
  return null;
}

/**
    Each metric's label along the web at `radius`, or null where it doesn't
    fit between its neighbors on `maxLines` lines or its `labelPosition`
    keeps it on its spoke. One line is tried first. A label cut short with
    an ellipsis (on one line) is allowed only when its `labelPosition` is
    `"along"`.
    @param viz The chart.
    @param labels The metric labels, in spoke order.
    @param radius The web's radius.
    @param maxLines The lines a label may wrap onto.
*/
export function radarCurves(
  viz: VizInstance,
  labels: RadarCurveInput[],
  radius: number,
  maxLines = 1,
): (RadarCurve | null)[] {
  const n = labels.length;
  return labels.map((label, i) => {
    const position = ringLabelPosition(viz, label.data, i);
    if (position === "inside" || position === "outside" || !label.text)
      return null;
    const whole = curveLines(label, [label.text], radius, n);
    if (whole) return whole;
    const wrapped =
      maxLines > 1 ? wrappedCurve(label, radius, n, maxLines) : null;
    if (wrapped || position !== "along") return wrapped;
    const cut = ringLabelFit(
      lineArc(label, radius, 0, n),
      ringTextWidth(label.text, label.font),
      {
        fontMin: label.font.fontSize,
        fontMax: label.font.fontSize,
        padding: RADAR_CURVE_PADDING,
        align: "inner",
        minRadius: 0,
      },
    );
    return cut ? {lines: [{text: label.text, fit: cut}]} : null;
  });
}

/**
    Whether every metric takes a curved label: each one fits along the web
    (or is cut short, for `"along"`) or has no text.
    @param labels The metric labels.
    @param curves Each one's curve (see `radarCurves`).
*/
export function radarAllCurved(
  labels: RadarCurveInput[],
  curves: (RadarCurve | null)[],
): boolean {
  return labels.every((l, k) => curves[k] || !l.text);
}

/**
    The lines a curved label may take at `radius` so it stays inside a
    `width` × `height` area centered on the web: up to
    `RADAR_CURVE_MAX_LINES`, or 0 when not even one fits.
    @param labels The metric labels.
    @param radius The web's radius.
    @param room The room from the center to the area's nearest edge.
*/
export function radarCurveLines(
  labels: RadarCurveInput[],
  radius: number,
  room: number,
): number {
  for (let lines = RADAR_CURVE_MAX_LINES; lines > 0; lines--)
    if (radius + radarCurveBand(labels, lines) <= room) return lines;
  return 0;
}

/**
    Each label's curve at `radius`, on as many lines as the room around the
    web holds (see `radarCurveLines`), or null where it doesn't curve.
    @param viz The chart.
    @param labels The metric labels, in spoke order.
    @param radius The web's radius.
    @param room The room from the center to the area's nearest edge.
*/
export function radarCurvesAt(
  viz: VizInstance,
  labels: RadarCurveInput[],
  radius: number,
  room: number,
): (RadarCurve | null)[] {
  const lines = radarCurveLines(labels, radius, room);
  return lines
    ? radarCurves(viz, labels, radius, lines)
    : labels.map(() => null);
}

/**
    The web's radius and every metric's curved label when every name fits
    along the web, which leaves the web the most room: on one line when
    they all fit, else on up to `RADAR_CURVE_MAX_LINES`. Null when some
    name doesn't fit either way.
    @param viz The chart.
    @param labels The metric labels, in spoke order.
    @param room The room from the center to the area's nearest edge.
*/
export function radarCurvedLayout(
  viz: VizInstance,
  labels: RadarCurveInput[],
  room: number,
): {radius: number; curves: (RadarCurve | null)[]} | null {
  if (!labels.length) return null;
  for (let lines = 1; lines <= RADAR_CURVE_MAX_LINES; lines++) {
    const radius = Math.max(0, room - radarCurveBand(labels, lines));
    const curves = radarCurves(viz, labels, radius, lines);
    if (radarAllCurved(labels, curves)) return {radius, curves};
  }
  return null;
}

/** A curved label to draw: its key, its row, and its curve. */
export interface RadarCurveLabel {
  key: string;
  data: DataPoint;
  i: number;
  curve: RadarCurve;
}

/**
    The text nodes for curved labels, one per line, in `labelConfig`'s font
    and color (the chart's ink by default).
    @param viz The chart.
    @param labels The labels.
    @param labelConfig Their label config.
*/
export function radarCurveNodes(
  viz: VizInstance,
  labels: RadarCurveLabel[],
  labelConfig: Record<string, unknown>,
): TextNode[] {
  const colorOf = (l: RadarCurveLabel) => {
    const color = resolveAccessor<unknown>(labelConfig.fontColor, l.data, l.i);
    return typeof color === "string" ? color : backgroundInk(viz);
  };
  return ringLabelNodes(
    viz,
    labels.flatMap(l =>
      l.curve.lines.map((line, k) => ({
        key: `${l.key}${k ? `-${k}` : ""}`,
        text: line.text,
        fit: line.fit,
        color: colorOf(l),
      })),
    ),
    ringLabelFont(labelConfig),
  );
}
