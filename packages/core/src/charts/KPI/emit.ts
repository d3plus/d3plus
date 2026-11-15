/**
    `kpiEmit` — one group per tile: a card that is the tile's hit area, then
    its label, value, delta (▲/▼ in a good or bad color, with the words it
    compares against), and sparkline. The card carries the row's hover,
    tooltip, and aria label; the rest only follow it.
*/

import {interpolateRgb} from "d3-interpolate";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode, TextNode} from "@d3plus/render";
import {rtl as detectRTL, textWidth} from "@d3plus/dom";
import {fontFamilyStringify} from "@d3plus/text";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import {fitText} from "../Gauge/emitDial.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {tileSettings} from "./applyLayout.js";
import type {KpiTile} from "./applyLayout.js";
import {deltaColors, deltaMode, deltaText, kpiPercentFormat} from "./delta.js";
import type {DeltaColors, DeltaFormats} from "./delta.js";
import {sparklinePoints, sparklineType, tileContent} from "./tileLayout.js";
import type {Box, SparklineType, TileContent} from "./tileLayout.js";

/** The colors, fonts, and settings every tile is drawn with. */
export interface KpiStyle {
  family: string;
  text: string;
  muted: string;
  cardFill: string;
  cardStroke: string;
  cardStrokeWidth: number;
  rx: number;
  background: string;
  delta: DeltaColors;
  /** Whether the page reads right to left. */
  rtl: boolean;
}

/** The value's font weight. */
export const VALUE_WEIGHT = 600;

/** Resolves the tiles' colors and fonts from `tileConfig` and the chart's theme. */
export function kpiStyle(viz: VizInstance): KpiStyle {
  const settings = tileSettings(viz);
  const background = chartBackground(viz);
  const text = backgroundInk(viz);
  const mix = interpolateRgb(background, text);
  const strokeWidth = Number(settings.strokeWidth);
  const rx = Number(settings.rx);
  return {
    family: fontFamilyStringify(viz.schema.fontFamily),
    text,
    muted: mix(0.68),
    cardFill: settings.fill ?? mix(0.035),
    cardStroke: settings.stroke ?? mix(0.14),
    cardStrokeWidth: strokeWidth >= 0 ? strokeWidth : 1,
    rx: rx >= 0 ? rx : 6,
    background,
    delta: deltaColors(viz),
    rtl: detectRTL(),
  };
}

/**
    A single line of text starting at `(x, y)`, centered on `y`: running
    rightward from `x`, or leftward with `rtl`.
*/
export function tileText(
  key: string,
  text: string,
  x: number,
  y: number,
  opts: {
    size: number;
    family: string;
    color: string;
    width: number;
    weight?: number;
    rtl?: boolean;
  },
): TextNode {
  return {
    type: "text",
    key,
    interactive: false,
    x: 0,
    y: 0,
    transform: {x, y},
    lines: [{text, x: 0, y: 0, width: opts.width}],
    font: {
      family: opts.family,
      size: opts.size,
      weight: opts.weight ?? 400,
      anchor: "start",
      baseline: "middle",
      ...(opts.rtl ? {dir: "rtl" as const} : {}),
    },
    paint: {fill: opts.color},
  };
}

/**
    The value's font size: `size`, or shrunk a little past where it measures
    `width` wide, so a value that only just overflows shrinks instead of
    being cut short (text doesn't measure exactly in proportion to its size).
*/
export function valueSize(
  text: string,
  family: string,
  size: number,
  width: number,
): number {
  const measured = textWidth(text, {
    "font-family": family,
    "font-size": size,
    "font-weight": VALUE_WEIGHT,
  });
  return measured > width && measured > 0
    ? (size * width * 0.97) / measured
    : size;
}

/** The words after a tile's delta, such as "vs. previous", or "" for none. */
export function comparisonText(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string {
  const label = viz.schema.comparisonLabel;
  if (label === false) return "";
  const text = resolveAccessor<unknown>(label, d, i);
  return text === undefined || text === null
    ? viz.schema.translate("vs. previous")
    : `${text}`;
}

/** The formats a delta is written with. */
export function deltaFormats(viz: VizInstance, d: DataPoint): DeltaFormats {
  const valueFormat = viz.schema.valueFormat as (
    v: number,
    d: DataPoint,
  ) => string;
  return {
    value: (n: number) => `${valueFormat(n, d)}`,
    percent: kpiPercentFormat(viz),
  };
}

/** A sparkline's nodes, in the tile's coordinates. */
function sparklineNodes(
  tile: KpiTile,
  box: Box,
  type: SparklineType,
  color: string,
  key: string,
  style: KpiStyle,
): SceneNode[] {
  const placed = sparklinePoints(
    tile.points.map(p => p.value),
    box,
    type,
  );
  const common = {datum: tile.data, index: tile.i, interactive: false};
  if (type === "bar") {
    const step = box.width / Math.max(1, placed.length);
    const width = Math.max(1, step * 0.7);
    return placed.flatMap((p, k): SceneNode[] =>
      Number.isFinite(p.y)
        ? [
            {
              type: "rect",
              key: `${key}-bar-${k}`,
              x: p.x - width / 2,
              y: Math.min(p.y, p.base),
              width,
              height: Math.abs(p.base - p.y),
              paint: {fill: color, opacity: tile.points[k].current ? 1 : 0.4},
              ...common,
            },
          ]
        : [],
    );
  }
  const points = placed
    .filter(p => Number.isFinite(p.y))
    .map(p => [p.x, p.y] as [number, number]);
  if (points.length < 2) return [];
  const nodes: SceneNode[] = [];
  if (type === "area")
    nodes.push({
      type: "area",
      key: `${key}-area`,
      topline: points,
      baseline: points.map(([x]) => [x, box.y + box.height]),
      paint: {fill: color, opacity: 0.15},
      ...common,
    });
  nodes.push({
    type: "line",
    key: `${key}-line`,
    points,
    paint: {fill: "none", stroke: color, strokeWidth: 2},
    ...common,
  });
  let last = -1;
  tile.points.forEach((p, k) => {
    if (p.current && Number.isFinite(placed[k].y)) last = k;
  });
  if (last >= 0)
    nodes.push({
      type: "circle",
      key: `${key}-current`,
      cx: placed[last].x,
      cy: placed[last].y,
      r: 3.5,
      paint: {fill: color, stroke: style.cardFill, strokeWidth: 1.5},
      ...common,
    });
  return nodes;
}

/**
    The label, value, and delta lines of a tile, from its start edge (the
    left, or the right on a right-to-left page), with the comparison words
    after the delta. A line that can't fit the tile's width is left out.
*/
function textNodes(
  viz: VizInstance,
  tile: KpiTile,
  content: TileContent,
  key: string,
  style: KpiStyle,
): SceneNode[] {
  const {data: d, i, box} = tile;
  const {rtl} = style;
  const x = rtl ? box.width - content.pad : content.pad;
  const width = Math.max(0, box.width - content.pad * 2);
  const nodes: SceneNode[] = [];
  const add = (
    part: string,
    text: string,
    at: number,
    y: number,
    fit: {size: number; width: number},
    color: string,
    weight?: number,
  ) => {
    if (!text || fit.width > width + 0.5) return;
    nodes.push({
      ...tileText(`${key}-${part}`, text, at, y, {
        size: fit.size,
        family: style.family,
        color,
        width: fit.width,
        weight,
        rtl,
      }),
      datum: d,
      index: i,
    });
  };
  if (content.label) {
    const {size, y} = content.label;
    const fit = fitText(viz._drawLabel(d, i), style.family, size, width, size);
    add("label", fit.text, x, y, fit, style.muted);
  }
  if (content.value) {
    const valueFormat = viz.schema.valueFormat as (
      v: number,
      d: DataPoint,
    ) => string;
    const value = Number.isFinite(tile.value)
      ? `${valueFormat(tile.value, d)}`
      : "–";
    const {y} = content.value;
    const fit = fitText(
      value,
      style.family,
      Math.max(
        Math.min(12, content.value.size),
        valueSize(value, style.family, content.value.size, width),
      ),
      width,
      Math.min(12, content.value.size),
      VALUE_WEIGHT,
    );
    add("value", fit.text, x, y, fit, style.text, VALUE_WEIGHT);
  }
  const mode = deltaMode(viz.schema.delta);
  if (content.delta && tile.delta && mode) {
    const {size, y} = content.delta;
    const text = deltaText(tile.delta, mode, deltaFormats(viz, d));
    const change = fitText(text, style.family, size, width, size, 600);
    add("delta", change.text, x, y, change, style.delta[tile.tone], 600);
    const words = content.comparison ? comparisonText(viz, d, i) : "";
    const gap = size * 0.4;
    const compare = words && fitText(words, style.family, size, Infinity);
    if (compare && compare.width <= width - change.width - gap) {
      const step = change.width + gap;
      add("compare", words, rtl ? x - step : x + step, y, compare, style.muted);
    }
  }
  return nodes;
}

/** A tile's aria label: its name, value, and signed change. */
export function kpiAriaLabel(viz: VizInstance, tile: KpiTile): string {
  const {data: d, i} = tile;
  const valueFormat = viz.schema.valueFormat as (
    v: number,
    d: DataPoint,
  ) => string;
  const parts = [viz._drawLabel(d, i)];
  if (Number.isFinite(tile.value)) parts.push(valueFormat(tile.value, d));
  const mode = deltaMode(viz.schema.delta);
  if (tile.delta && mode) {
    const change = deltaText(tile.delta, mode, deltaFormats(viz, d), true);
    parts.push([change, comparisonText(viz, d, i)].filter(Boolean).join(" "));
  }
  return `${parts.filter(Boolean).join(", ")}.`;
}

export const kpiEmit: ChartEmit = ({viz, shapeData}) => {
  const tiles = (shapeData ?? []) as unknown as KpiTile[];
  if (!tiles.length) return [];
  const style = kpiStyle(viz);
  const spark = sparklineType(viz.schema.sparkline);
  const mode = deltaMode(viz.schema.delta);
  const sc = shapeConfigFor(viz, "Rect");
  const seen = new Map<string, number>();
  return tiles.flatMap((tile): SceneNode[] => {
    const {box, data: d, i} = tile;
    if (!box || !(box.width > 0) || !(box.height > 0)) return [];
    const n = seen.get(tile.key) ?? 0;
    seen.set(tile.key, n + 1);
    const key = `kpi-${tile.key}${n ? `-${n}` : ""}`;
    const hasSpark =
      spark !== false &&
      tile.points.filter(p => Number.isFinite(p.value)).length >= 2;
    const content = tileContent(box.width, box.height, {
      label: Boolean(viz._drawLabel(d, i)),
      delta: Boolean(mode && tile.delta),
      sparkline: hasSpark,
    });
    const paint = paintFromShapeConfig(sc, d, i);
    const color =
      paint.fill && !paint.fill.startsWith("pattern:")
        ? paint.fill
        : style.text;
    const card: SceneNode = {
      type: "rect",
      key: `${key}-card`,
      x: 0,
      y: 0,
      width: box.width,
      height: box.height,
      rx: style.rx,
      ry: style.rx,
      shapeType: "Rect",
      datum: d,
      index: i,
      aria: {label: kpiAriaLabel(viz, tile)},
      paint: {
        fill: style.cardFill,
        stroke: style.cardStroke,
        strokeWidth: style.cardStrokeWidth,
      },
    };
    return [
      {
        type: "group",
        key,
        transform: {x: box.x, y: box.y},
        children: [
          card,
          ...textNodes(viz, tile, content, key, style),
          ...(hasSpark && content.sparkline && spark
            ? sparklineNodes(tile, content.sparkline, spark, color, key, style)
            : []),
        ],
      },
    ];
  });
};
