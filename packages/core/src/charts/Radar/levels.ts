/**
    Radar's radial value axis: the concentric "level" rings and the value
    labels drawn along one direction of the web. Ring values come from the
    same d3 linear-scale `nice()` + `ticks()` logic the cartesian axes use, so
    rings land on round numbers (0, 50, 100, …).
*/

import {scaleLinear} from "d3-scale";

import type {SceneNode} from "@d3plus/render";

export interface RadarLevels {
  /** The value range the radius spans, center → outer edge. */
  domain: [number, number];
  /** Ring values, ascending. */
  ticks: number[];
}

/**
    Resolves the radial domain and ring values for a Radar. A numeric `levels`
    is a tick-count hint: the domain is `[min(0, data), max(0, data)]` rounded
    out with `nice()`, and the rings are its `ticks()`. An array of `levels`
    is used as the exact ring values, and the domain grows to include them.
    @param values Every plotted (aggregated) value.
    @param levels A tick-count hint, or the exact ring values.
*/
export function radarLevels(values: number[], levels: number | number[]): RadarLevels {
  const custom = Array.isArray(levels) ? levels.filter(Number.isFinite) : [];
  const finite = values.filter(Number.isFinite).concat(custom);
  const lo = Math.min(0, ...finite);
  const hi = Math.max(0, ...finite);
  if (Array.isArray(levels)) {
    const ticks = Array.from(new Set(custom)).sort((a, b) => a - b);
    return {domain: [lo, hi], ticks};
  }
  const count = Math.max(1, Math.round(levels));
  const scale = scaleLinear().domain([lo, hi]).nice(count);
  const [d0, d1] = scale.domain() as [number, number];
  return {domain: [d0, d1], ticks: scale.ticks(count)};
}

/** Maps a value onto a pixel radius for the given domain. */
export function radarRadius(value: number, domain: [number, number], radius: number): number {
  const span = domain[1] - domain[0];
  return span ? ((value - domain[0]) / span) * radius : 0;
}

/**
    How far (px) a level label may extend past the outer ring. The metric
    labels start 10px beyond it.
*/
const OUTER_OVERFLOW = 8;

export interface RadarLevelLabel {
  value: number;
  text: string;
  /** Distance from the center, in pixels. */
  r: number;
  /** Center of the label, relative to the radar's center. */
  x: number;
  y: number;
  /** Measured width of `text`. */
  textWidth: number;
  /** Backdrop size (text plus padding). */
  width: number;
  height: number;
}

export interface RadarLevelLabelOpts {
  ticks: number[];
  domain: [number, number];
  radius: number;
  /** Direction of the labels, in degrees clockwise from 12 o'clock. */
  angle: number;
  format: (d: number) => string;
  /** Measures a label's text width in pixels. */
  measure: (text: string) => number;
  fontSize: number;
  padding: number;
}

/**
    Lays out one value label per ring, centered on the ring where it crosses
    the label direction. When neighboring labels would overlap along that
    direction, only every n-th label is kept (counting out from the center).
*/
export function radarLevelLabels(opts: RadarLevelLabelOpts): RadarLevelLabel[] {
  const {ticks, domain, radius, angle, format, measure, fontSize, padding} = opts;
  const radians = (angle * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const labels = ticks
    .filter(t => t >= domain[0] && t <= domain[1])
    .map((value): RadarLevelLabel => {
      const r = radarRadius(value, domain, radius);
      const text = format(value);
      const textWidth = measure(text);
      return {
        value,
        text,
        r,
        x: r * dx,
        y: r * dy,
        textWidth,
        width: textWidth + padding * 2,
        height: fontSize + padding * 2,
      };
    });
  // Extent of each backdrop projected onto the label direction.
  const extentOf = (l: RadarLevelLabel): number =>
    Math.abs(l.width * dx) + Math.abs(l.height * dy);
  const extent = Math.max(0, ...labels.map(extentOf));
  let gap = Infinity;
  for (let i = 1; i < labels.length; i++) gap = Math.min(gap, labels[i].r - labels[i - 1].r);
  const stride = gap > 0 ? Math.max(1, Math.ceil((extent + 2) / gap)) : labels.length;
  // Labels reaching past the outer ring into the metric labels' padding are dropped.
  return labels.filter(
    (l, i) => i % stride === 0 && l.r + extentOf(l) / 2 <= radius + OUTER_OVERFLOW,
  );
}

export interface RadarLevelLabelPaint {
  fontColor: string;
  fontFamily: string;
  fontOpacity: number;
  fontSize: number;
  fontWeight: number | string;
  background: string | false;
  backgroundOpacity: number;
  borderRadius: number;
}

/** Builds the backdrop + text scene nodes for laid-out level labels. */
export function emitRadarLevelLabels(
  labels: RadarLevelLabel[],
  paint: RadarLevelLabelPaint,
): SceneNode[] {
  if (!labels.length) return [];
  const children: SceneNode[] = [];
  for (const l of labels) {
    if (paint.background) {
      children.push({
        type: "rect",
        key: `radar-level-label-bg-${l.value}`,
        interactive: false,
        x: l.x - l.width / 2,
        y: l.y - l.height / 2,
        width: l.width,
        height: l.height,
        rx: paint.borderRadius,
        ry: paint.borderRadius,
        paint: {fill: paint.background, fillOpacity: paint.backgroundOpacity, stroke: "none"},
      });
    }
    children.push({
      type: "text",
      key: `radar-level-label-${l.value}`,
      interactive: false,
      x: 0,
      y: 0,
      transform: {x: l.x, y: l.y},
      lines: [{text: l.text, x: 0, y: paint.fontSize * 0.35, width: l.textWidth}],
      font: {
        family: paint.fontFamily,
        size: paint.fontSize,
        weight: paint.fontWeight,
        anchor: "middle",
        baseline: "alphabetic",
      },
      paint: {fill: paint.fontColor, opacity: paint.fontOpacity},
    });
  }
  return [{type: "group", key: "radar-level-labels", interactive: false, children}];
}
