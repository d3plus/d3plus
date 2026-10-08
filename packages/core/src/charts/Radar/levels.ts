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

/** Gap (px) between a level label and the label direction's spoke. */
const SPOKE_GAP = 3;
/** Gap (px) between a level label and the inside of its ring. */
const RING_GAP = 2;

export interface RadarLevelLabel {
  value: number;
  text: string;
  /** Distance from the center, in pixels. */
  r: number;
  /** Center of the label's box, relative to the radar's center. */
  x: number;
  y: number;
  /** Text size: measured width and font-size height. */
  width: number;
  height: number;
  /** Horizontal text anchor, so the text grows away from the spoke. */
  anchor: "start" | "middle" | "end";
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
}

/**
    Lays out one value label per ring, in the open space beside the point
    where the ring crosses the label direction: offset to the clockwise side
    of that direction and pulled just inside the ring, so neither line runs
    through the text. When neighboring labels would overlap along the
    direction, only every n-th label is kept (counting out from the center).
*/
export function radarLevelLabels(opts: RadarLevelLabelOpts): RadarLevelLabel[] {
  const {ticks, domain, radius, angle, format, measure, fontSize} = opts;
  const radians = (angle * Math.PI) / 180;
  // Unit vectors along the label direction (d) and perpendicular to its
  // clockwise side (p), in screen coordinates (y down).
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const px = -dy;
  const py = dx;
  const anchor = px > 1e-6 ? "start" : px < -1e-6 ? "end" : "middle";
  // Half-extent of a width × height box projected onto a unit vector.
  const half = (w: number, h: number, ux: number, uy: number): number =>
    (Math.abs(ux) * w + Math.abs(uy) * h) / 2;
  const labels = ticks
    .filter(t => t >= domain[0] && t <= domain[1])
    .map((value): RadarLevelLabel => {
      const r = radarRadius(value, domain, radius);
      const text = format(value);
      const width = measure(text);
      const height = fontSize;
      const side = SPOKE_GAP + half(width, height, px, py);
      const along = r - RING_GAP - half(width, height, dx, dy);
      return {
        value,
        text,
        r,
        x: along * dx + side * px,
        y: along * dy + side * py,
        width,
        height,
        anchor,
      };
    });
  const extent = Math.max(0, ...labels.map(l => 2 * half(l.width, l.height, dx, dy)));
  let gap = Infinity;
  for (let i = 1; i < labels.length; i++) gap = Math.min(gap, labels[i].r - labels[i - 1].r);
  const stride = gap > 0 ? Math.max(1, Math.ceil((extent + 2) / gap)) : labels.length;
  return labels.filter((_l, i) => i % stride === 0);
}

export interface RadarLevelLabelPaint {
  fontColor: string;
  fontFamily: string;
  fontOpacity: number;
  fontSize: number;
  fontWeight: number | string;
}

/** Builds the text scene nodes for laid-out level labels. */
export function emitRadarLevelLabels(
  labels: RadarLevelLabel[],
  paint: RadarLevelLabelPaint,
): SceneNode[] {
  if (!labels.length) return [];
  const children: SceneNode[] = [];
  for (const l of labels) {
    const offset = l.anchor === "start" ? -l.width / 2 : l.anchor === "end" ? l.width / 2 : 0;
    children.push({
      type: "text",
      key: `radar-level-label-${l.value}`,
      interactive: false,
      x: 0,
      y: 0,
      transform: {x: l.x + offset, y: l.y},
      lines: [{text: l.text, x: 0, y: paint.fontSize * 0.35, width: l.width}],
      font: {
        family: paint.fontFamily,
        size: paint.fontSize,
        weight: paint.fontWeight,
        anchor: l.anchor,
        baseline: "alphabetic",
      },
      paint: {fill: paint.fontColor, opacity: paint.fontOpacity},
    });
  }
  return [{type: "group", key: "radar-level-labels", interactive: false, children}];
}
