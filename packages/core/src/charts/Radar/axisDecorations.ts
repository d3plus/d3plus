/**
    Radar's chrome: the metric labels around the web (and the radius they
    leave for it), the spokes, the level rings, and the level value labels.
    Everything here is non-interactive scenery drawn beneath the polygons.
*/

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {fontExists, textWidth} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";
import {fontFamily as defaultFontFamily, fontFamilyStringify, textWrap} from "@d3plus/text";

import TextBox from "../../components/TextBox.js";
import {gridStroke} from "../../components/Axis/gridStroke.js";
import {emitLabels, shapeLabelDefaults} from "../../shapes/emitLabels.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {paintFromShapeConfig, shapeConfigFor} from "../features/emitHelpers.js";
import type {TransformStage} from "../pipeline/stages.js";
import {backgroundInk} from "../viz/backgroundInk.js";

import {
  RADAR_EDGE_GAP,
  RADAR_LABEL_MAX_LINES,
  RADAR_LABEL_PADDING,
  radarAxisLabelLayout,
} from "./axisLabels.js";
import {emitRadarLevelLabels, radarLevelLabels, radarRadius} from "./levels.js";
import type {RadarLevels} from "./levels.js";
import {emitRadarRings, radarRingStyle} from "./rings.js";
import type {RadarRingStyle} from "./rings.js";

type Viz = Parameters<TransformStage>[0]["viz"];

const TAU = Math.PI * 2;

export interface PolarAxisDatum {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  id: string | number;
  key: string | number;
  angle: number;
  textAnchor: string;
  labelBounds: {x: number; y: number; width: number; height: number};
  rotateAnchor: [number, number];
  x: number;
  y: number;
}

export interface RadarAxisConfig {
  barConfig?: RadarRingStyle;
  gridConfig?: RadarRingStyle;
  shapeConfig?: {labelConfig?: Record<string, unknown>} & Record<string, unknown>;
}

type FontAccessor<T> = (d: DataPoint, i: number) => T;

/** Resolves the font a metric label renders with, the way its TextBox will. */
const labelFont = (viz: Viz, text: string, datum: DataPoint, i: number) => {
  const axisConfig = viz.schema.axisConfig as RadarAxisConfig;
  const tb = new TextBox().config({
    ...shapeLabelDefaults,
    ...(axisConfig.shapeConfig?.labelConfig ?? {}),
  });
  const s = tb.schema as Record<string, FontAccessor<unknown>>;
  const record = {data: datum, i, text} as unknown as DataPoint;
  const fontSize = Number(s.fontSize(record, i)) || 10;
  return {
    fontFamily: String(fontExists(s.fontFamily(record, i) as string | string[]) || "sans-serif"),
    fontSize,
    fontWeight: s.fontWeight(record, i) as number | string,
    lineHeight: Number(s.lineHeight(record, i)) || fontSize * 1.2,
  };
};

/**
    Lays out the metric labels and the web radius. `outerPadding` "auto"
    sizes both from the measured labels; a number reserves that many pixels
    around the web and wraps labels to it.
*/
export function radarPolarAxis(
  viz: Viz,
  axisData: [unknown, DataPoint[]][],
  width: number,
  height: number,
): {radius: number; polarAxis: PolarAxisDatum[]} {
  const total = axisData.length;
  const aggs = viz.schema.aggs as Parameters<typeof merge>[1];
  const outerPadding = viz.schema.outerPadding as number | "auto";
  const inputs = axisData.map(([key, values], i) => {
    const data = merge(values, aggs) as DataPoint;
    const font = labelFont(viz, String(key), data, i);
    return {key, data, font, text: String(key), angle: (TAU / total) * i, lineHeight: font.lineHeight};
  });

  let radius: number;
  let boxes: {wrapWidth: number}[];
  if (typeof outerPadding === "number") {
    radius = Math.max(0, Math.min(width, height) / 2 - outerPadding);
    boxes = inputs.map(() => ({wrapWidth: outerPadding}));
  } else {
    const layout = radarAxisLabelLayout({
      labels: inputs,
      width: width - RADAR_EDGE_GAP * 2,
      height: height - RADAR_EDGE_GAP * 2,
      measure: ({text, font: f}) =>
        textWidth(text, {"font-family": f.fontFamily, "font-size": f.fontSize, "font-weight": f.fontWeight}),
      wrap: ({text, font: f}, wrapWidth, maxLines) =>
        textWrap()
          .fontFamily(f.fontFamily)
          .fontSize(f.fontSize)
          .fontWeight(f.fontWeight)
          .lineHeight(f.lineHeight)
          .width(wrapWidth)
          .height(f.lineHeight * maxLines)
          .maxLines(maxLines)(text),
    });
    radius = layout.radius;
    boxes = layout.labels;
  }

  const polarAxis = inputs
    .map(({key, data, font, angle: radians}, i): PolarAxisDatum => {
      const hh = font.lineHeight * RADAR_LABEL_MAX_LINES;
      const ww = boxes[i].wrapWidth;
      const quadrant = (parseInt(String(360 - ((360 / total) * i) / 90), 10) % 4) + 1;
      let angle = (360 / total) * i;
      let textAnchor = "start";
      let x = RADAR_LABEL_PADDING;
      if (quadrant === 2 || quadrant === 3) {
        x = -ww - RADAR_LABEL_PADDING;
        textAnchor = "end";
        angle += 180;
      }
      return {
        __d3plus__: true,
        data,
        i,
        id: key as string | number,
        key: key as string | number,
        angle,
        textAnchor,
        labelBounds: {x, y: -hh / 2, width: ww, height: hh},
        rotateAnchor: [-x, hh / 2],
        x: radius * Math.cos(radians),
        y: radius * Math.sin(radians),
      };
    })
    .sort((a, b) => Number(a.key) - Number(b.key));
  return {radius, polarAxis};
}

/** Builds the metric labels and the spokes (non-interactive, datum-free). */
export function radarAxisNodes(viz: Viz, polarAxis: PolarAxisDatum[]): SceneNode[] {
  const axisConfig = viz.schema.axisConfig as RadarAxisConfig;
  const out: SceneNode[] = [];
  const labels = emitLabels({
    data: polarAxis as unknown as DataPoint[],
    label: d => (d as unknown as PolarAxisDatum).id,
    x: d => (d as unknown as PolarAxisDatum).x,
    y: d => (d as unknown as PolarAxisDatum).y,
    aes: () => ({}),
    rotate: d => (d as unknown as PolarAxisDatum).angle || 0,
    id: d => (d as unknown as PolarAxisDatum).id,
    labelBounds: d => (d as unknown as PolarAxisDatum).labelBounds,
    labelConfig: axisConfig.shapeConfig?.labelConfig ?? {},
  });
  if (labels.length) out.push({type: "group", key: "radar-axis-labels", children: labels});

  const spokeConfig = shapeConfigFor(viz, "Path", axisConfig.shapeConfig ?? {});
  const spokes: SceneNode[] = polarAxis.map((p, i) => ({
    type: "path",
    key: `radar-spoke-${p.id}`,
    interactive: false,
    d: `M0,0 ${p.x},${p.y}`,
    paint: paintFromShapeConfig(spokeConfig, p as unknown as DataPoint, i),
  }));
  if (spokes.length)
    out.push({type: "group", key: "radar-axis-spokes", interactive: false, children: spokes});
  return out;
}

/** The default inner-ring (grid) and outer-ring (axis line) styles. */
export function radarRingDefaults(viz: Viz): {grid: RadarRingStyle; outer: RadarRingStyle} {
  const node = viz._select && typeof viz._select.node === "function" ? viz._select.node() : null;
  return {
    grid: {stroke: gridStroke(node, viz.schema.colorDefaults), strokeWidth: 1},
    outer: {stroke: backgroundInk(viz), strokeWidth: 1},
  };
}

/** Builds the level rings, with user `gridConfig`/`barConfig` over the defaults. */
export function radarRingNodes(viz: Viz, {domain, ticks}: RadarLevels, radius: number): SceneNode[] {
  const axisConfig = viz.schema.axisConfig as RadarAxisConfig;
  const defaults = radarRingDefaults(viz);
  const rings = ticks.map(value => ({value, r: radarRadius(value, domain, radius)}));
  return emitRadarRings(
    rings,
    radius,
    domain[1],
    radarRingStyle(defaults.grid, axisConfig.gridConfig),
    radarRingStyle(defaults.outer, axisConfig.barConfig),
  );
}

/** Resolves `levelLabelConfig` + `levelFormat` and builds the level label nodes. */
export function radarLevelLabelNodes(
  viz: Viz,
  {domain, ticks}: RadarLevels,
  radius: number,
): SceneNode[] {
  if (!viz.schema.levelLabels) return [];
  const cfg = (viz.schema.levelLabelConfig ?? {}) as NonNullable<D3plusConfig["levelLabelConfig"]>;
  const fontSize = cfg.fontSize ?? 10;
  const fontWeight = cfg.fontWeight ?? 400;
  const fontFamily = fontFamilyStringify(
    cfg.fontFamily ?? (viz.schema.fontFamily as string | string[] | undefined) ?? defaultFontFamily,
  );
  const style = {"font-family": fontFamily, "font-size": fontSize, "font-weight": fontWeight};
  const userFormat = viz.schema.levelFormat as ((d: number) => string | number) | undefined;
  const format = (d: number): string =>
    typeof userFormat === "function"
      ? String(userFormat(d))
      : formatAbbreviate(d, viz.schema.locale as string);
  const labels = radarLevelLabels({
    ticks,
    domain,
    radius,
    angle: Number(viz.schema.levelLabelAngle) || 0,
    format,
    measure: text => textWidth(text, style),
    fontSize,
  });
  return emitRadarLevelLabels(labels, {
    fontColor: cfg.fontColor ?? backgroundInk(viz),
    fontFamily,
    fontOpacity: cfg.fontOpacity ?? 1,
    fontSize,
    fontWeight,
  });
}
