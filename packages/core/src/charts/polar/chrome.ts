/**
    The chrome a polar chart draws around its marks: the category labels just
    outside the circle (and the radius they leave for it), the value rings,
    and the ring value labels. Rings and ring labels come from Radar's level
    machinery with the chart's own value → radius mapping and node keys;
    everything here is non-interactive scenery drawn beneath the marks.
*/

import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import type {TransformStage} from "../pipeline/stages.js";
import {
  radarAxisLabelLayout,
  RADAR_EDGE_GAP,
  RADAR_LABEL_MAX_LINES,
} from "../Radar/axisLabels.js";
import {
  labelFont,
  radarLevelLabelNodes,
  radarRingNodes,
} from "../Radar/axisDecorations.js";
import type {RadarAxisConfig} from "../Radar/axisDecorations.js";
import type {RadarLevels} from "../Radar/levels.js";
import {textWrap} from "@d3plus/text";

import {
  POLAR_LABEL_PADDING,
  polarHorizontalLayout,
  polarLabelPlacement,
  polarLabelsCollide,
  polarSpokeRotation,
} from "./labels.js";

type Viz = Parameters<TransformStage>[0]["viz"];

/** One category label to place around the circle. */
export interface PolarCategory {
  key: string;
  text: string;
  /** The slot's center angle (radians, 0 at 12 o'clock, clockwise). */
  angle: number;
  data: DataPoint;
}

/** A category label laid out for `emitLabels`. */
interface PolarLabelDatum {
  __d3plus__: true;
  data: DataPoint;
  id: string;
  text: string;
  x: number;
  y: number;
  rotate: number;
  textAnchor: "start" | "middle" | "end";
  verticalAlign: "top" | "middle" | "bottom";
  labelBounds: {x: number; y: number; width: number; height: number};
  rotateAnchor?: [number, number];
}

/** Where the category labels go, and the radius they leave for the circle. */
export interface PolarCategoryLayout {
  radius: number;
  labels: PolarLabelDatum[];
}

/** The narrowest box a category label is laid out in, in pixels. */
const LABEL_MIN_WIDTH = 12;

const anchorFor = (ux: number): "start" | "middle" | "end" =>
  ux > 0.3 ? "start" : ux < -0.3 ? "end" : "middle";
const alignFor = (uy: number): "top" | "middle" | "bottom" =>
  uy < -0.3 ? "bottom" : uy > 0.3 ? "top" : "middle";

/** The measured labels and area `spokeLayout` lays out in. */
interface SpokeInput {
  fonts: ReturnType<typeof labelFont>[];
  widths: number[];
  innerW: number;
  innerH: number;
  fixed: number | undefined;
  outerPadding: number | "auto" | undefined;
}

/** Lays every category label along its spoke, sized like Radar's metric labels. */
function spokeLayout(
  categories: PolarCategory[],
  {fonts, widths, innerW, innerH, fixed, outerPadding}: SpokeInput,
): PolarCategoryLayout {
  const spoke = radarAxisLabelLayout({
    labels: categories.map((c, i) => ({
      text: c.text,
      angle: c.angle - Math.PI / 2,
      lineHeight: fonts[i].lineHeight,
      i,
    })),
    width: innerW,
    height: innerH,
    padding: POLAR_LABEL_PADDING,
    measure: l => widths[l.i],
    wrap: (l, wrapWidth, maxLines) =>
      textWrap()
        .fontFamily(fonts[l.i].fontFamily)
        .fontSize(fonts[l.i].fontSize)
        .fontWeight(fonts[l.i].fontWeight)
        .lineHeight(fonts[l.i].lineHeight)
        .width(wrapWidth)
        .height(fonts[l.i].lineHeight * maxLines)
        .maxLines(maxLines)(l.text),
  });
  const r = fixed ?? spoke.radius;
  const labels = categories.map((c, i): PolarLabelDatum => {
    const {rotate, anchor} = polarSpokeRotation(c.angle);
    const ww = Math.max(
      LABEL_MIN_WIDTH,
      typeof outerPadding === "number"
        ? outerPadding
        : spoke.labels[i].wrapWidth,
    );
    const hh = fonts[i].lineHeight * RADAR_LABEL_MAX_LINES;
    const x =
      anchor === "start" ? POLAR_LABEL_PADDING : -ww - POLAR_LABEL_PADDING;
    return {
      __d3plus__: true,
      data: c.data,
      id: c.key,
      text: c.text,
      x: r * Math.sin(c.angle),
      y: -r * Math.cos(c.angle),
      rotate,
      textAnchor: anchor,
      verticalAlign: "middle",
      labelBounds: {x, y: -hh / 2, width: ww, height: hh},
      rotateAnchor: [-x, hh / 2],
    };
  });
  return {radius: r, labels};
}

/**
    Lays out the category labels around a circle centered in `width` ×
    `height`, and the circle's radius. `outerPadding` "auto" sizes both from
    the measured labels; a number reserves that many pixels around the
    circle. With `show` false, the circle fills the area.
*/
export function polarCategoryLayout(
  viz: Viz,
  categories: PolarCategory[],
  width: number,
  height: number,
  show = true,
): PolarCategoryLayout {
  const half = Math.max(0, Math.min(width, height) / 2);
  if (!show || !categories.length) return {radius: half, labels: []};
  const outerPadding = viz.schema.outerPadding as number | "auto" | undefined;
  const fonts = categories.map((c, i) => labelFont(viz, c.text, c.data, i));
  const style = (i: number) => ({
    "font-family": fonts[i].fontFamily,
    "font-size": fonts[i].fontSize,
    "font-weight": fonts[i].fontWeight,
  });
  const widths = categories.map(
    (c, i) => textWidth(c.text, style(i)) as number,
  );
  const lineHeight = Math.max(...fonts.map(f => f.lineHeight));
  const innerW = Math.max(0, width - RADAR_EDGE_GAP * 2);
  const innerH = Math.max(0, height - RADAR_EDGE_GAP * 2);
  const fixed =
    typeof outerPadding === "number"
      ? Math.max(0, half - outerPadding)
      : undefined;

  // TextBox only draws into a box strictly larger than one line and the
  // minimum font size, so each box gets a little slack.
  const slack = (w: number) => Math.max(w + 2, LABEL_MIN_WIDTH);
  const horizontal = polarHorizontalLayout({
    angles: categories.map(c => c.angle),
    widths: widths.map(w =>
      slack(typeof outerPadding === "number" ? Math.min(w, outerPadding) : w),
    ),
    lineHeight: lineHeight + 2,
    width: innerW,
    height: innerH,
  });
  const radius = fixed ?? horizontal.radius;
  const boxes = categories.map((c, i) => ({
    angle: c.angle,
    width: horizontal.labels[i].width,
    height: horizontal.labels[i].height,
  }));
  if (!polarLabelsCollide(boxes, radius)) {
    const labels = categories.map((c, i): PolarLabelDatum => {
      const b = boxes[i];
      const p = polarLabelPlacement(c.angle, radius, b.width, b.height);
      return {
        __d3plus__: true,
        data: c.data,
        id: c.key,
        text: c.text,
        x: 0,
        y: 0,
        rotate: 0,
        textAnchor: anchorFor(Math.sin(c.angle)),
        verticalAlign: alignFor(-Math.cos(c.angle)),
        labelBounds: p,
      };
    });
    return {radius, labels};
  }

  // Too crowded to read horizontally: each label runs along its spoke.
  return spokeLayout(categories, {
    fonts,
    widths,
    innerW,
    innerH,
    fixed,
    outerPadding,
  });
}

/** Builds the category label nodes laid out by `polarCategoryLayout`. */
export function polarCategoryNodes(
  viz: Viz,
  labels: PolarLabelDatum[],
  key: string,
): SceneNode[] {
  if (!labels.length) return [];
  const axisConfig = viz.schema.axisConfig as RadarAxisConfig;
  const asLabel = (d: DataPoint) => d as unknown as PolarLabelDatum;
  const nodes = emitLabels({
    data: labels as unknown as DataPoint[],
    label: d => asLabel(d).text,
    x: d => asLabel(d).x,
    y: d => asLabel(d).y,
    aes: () => ({}),
    rotate: d => asLabel(d).rotate,
    id: d => `${key}-label-${asLabel(d).id}`,
    labelBounds: d => asLabel(d).labelBounds,
    labelConfig: {
      ...(axisConfig.shapeConfig?.labelConfig ?? {}),
      verticalAlign: (d: {data?: PolarLabelDatum}) =>
        d.data?.verticalAlign ?? "middle",
    },
  });
  for (const n of nodes) n.interactive = false;
  return nodes.length
    ? [
        {
          type: "group",
          key: `${key}-labels`,
          interactive: false,
          children: nodes,
        },
      ]
    : [];
}

/**
    The value rings and their value labels (Radar's, the innermost included),
    at the radii `toRadius` gives, keyed with `key`.
*/
export function polarLevelNodes(
  viz: Viz,
  levels: RadarLevels,
  outer: number,
  toRadius: (value: number) => number,
  key: string,
): {rings: SceneNode[]; labels: SceneNode[]} {
  return {
    rings: radarRingNodes(viz, levels, outer, toRadius, key),
    labels: radarLevelLabelNodes(viz, levels, outer, toRadius, key),
  };
}
