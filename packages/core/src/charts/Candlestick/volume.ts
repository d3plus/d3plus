/**
    Candlestick's volume strip: with `volume` set, a short strip under the
    candles holds one bar per candle, as tall as its period's volume on the
    strip's own value axis, colored like its candle.

    The strip claims room at the bottom of the plot (see Plot's
    `_plotInsetBottom`), so the price axis shrinks to make room and the x axis
    sits under the strip; its axis claims room on the left (`_plotMinLeft`)
    when its labels are wider than the price axis's.

    @module
*/

import {max} from "d3-array";
import {scaleLinear} from "d3-scale";
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {AxisLeft} from "../../components/index.js";
import configPrep from "../../utils/configPrep.js";
import type {VizContext} from "../../utils/configPrep.js";
import {collectComputed, makeShape, shapeConfigFor} from "../features/emitHelpers.js";
import type {PlotDatum} from "../features/plotPaint.js";
import {withAxisInk} from "../Plot/axisInk.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {fieldAccessor, keyedAccessor} from "./aggregate.js";
import {finiteValue} from "./ohlc.js";

/** `volumeConfig`: the strip's size and the styling of its bars and axis. */
export interface VolumeConfig {
  /** The strip's height: a share of the plot's height (0–1), or pixels when above 1. */
  height?: number;
  /** Pixels between the candles and the strip. */
  gap?: number;
  /** Config for the strip's value axis, over its defaults. */
  axisConfig?: Record<string, unknown>;
  /** Config for the volume bars (Path keys), over their defaults. */
  shapeConfig?: Record<string, unknown>;
}

/** `volumeConfig`'s defaults. */
export const VOLUME_DEFAULTS: Required<Omit<VolumeConfig, "axisConfig">> & {axisConfig: Record<string, unknown>} = {
  height: 0.2,
  gap: 16,
  axisConfig: {},
  shapeConfig: {fillOpacity: 0.5},
};

/** The most of the plot's height the strip may take. */
const MAX_SHARE = 0.5;
/** How many ticks the strip's axis aims for. */
const TICK_COUNT = 2;

/**
    Coerces the `volume` setter's argument: off for `undefined`, `null`, or
    `false`; otherwise an accessor as `keyedAccessor` makes one.
    @param value The setter's argument.
*/
export function volumeAccessor(value: unknown): unknown {
  return value === undefined || value === null || value === false ? undefined : keyedAccessor(value);
}

/** Whether the chart draws a volume strip. */
export const volumeEnabled = (viz: VizInstance): boolean => typeof viz.schema.volume === "function";

/** The chart's `volumeConfig`, over its defaults. */
export function volumeConfig(viz: VizInstance): typeof VOLUME_DEFAULTS {
  const config = (viz.schema.volumeConfig ?? {}) as VolumeConfig;
  return {...VOLUME_DEFAULTS, ...config} as typeof VOLUME_DEFAULTS;
}

/** A row's volume, or undefined when it has none. */
export function readVolume(viz: VizInstance, d: DataPoint, i: number): number | undefined {
  return volumeEnabled(viz) ? finiteValue(fieldAccessor(viz, "volume")(d, i)) : undefined;
}

/**
    The strip's height and gap in pixels for a plot `plotHeight` tall:
    `height` as a share of it (or pixels when above 1), never more than half
    of it.
    @param config The chart's `volumeConfig`.
    @param plotHeight The plot's height, strip included.
*/
export function stripSize(config: VolumeConfig, plotHeight: number): {height: number; gap: number} {
  if (!(plotHeight > 0)) return {height: 0, gap: 0};
  const raw = Number(config.height);
  const share = Number.isFinite(raw) && raw > 0 ? raw : VOLUME_DEFAULTS.height;
  const height = Math.min(share <= 1 ? share * plotHeight : share, plotHeight * MAX_SHARE);
  const gap = Math.max(0, Number.isFinite(Number(config.gap)) ? Number(config.gap) : VOLUME_DEFAULTS.gap);
  return {height: Math.round(height), gap};
}

/**
    The strip axis's domain and ticks for volumes up to `top`: from zero to
    a nice value at or above it.
    @param top The largest volume.
*/
export function volumeScale(top: number): {domain: [number, number]; ticks: number[]} {
  const scale = scaleLinear().domain([0, top > 0 ? top : 1]).nice(TICK_COUNT);
  return {domain: scale.domain() as [number, number], ticks: scale.ticks(TICK_COUNT)};
}

/** The largest volume over `rows`, or 0. */
function largestVolume(viz: VizInstance, rows: DataPoint[]): number {
  return max(rows, (d, i) => readVolume(viz, d, i)) ?? 0;
}

/** Per-instance strip state: the largest volume over every panel, for shared facet scales. */
const allTops = new WeakMap<VizInstance, number>();

/**
    Notes the largest volume over every panel's rows, so panels sharing
    scales share the strip's too; run as the facet chrome draws.
    @param viz The chart.
*/
export function noteVolumeTop(viz: VizInstance): void {
  allTops.set(viz, largestVolume(viz, viz._filteredData || []));
}

/** The largest volume the strip spans: every panel's when facet panels share scales, else the rows drawn. */
function stripTop(viz: VizInstance): number {
  const shared = viz._facetStep === "panel" && viz._plotFacetScales;
  return shared ? (allTops.get(viz) ?? 0) : largestVolume(viz, viz._filteredData || []);
}

/** Whether the price axis shows its labels (a facet panel off the grid's left edge doesn't). */
function labelsShown(viz: VizInstance): boolean {
  const labels = (viz._yConfig as {labels?: unknown} | undefined)?.labels;
  return !(Array.isArray(labels) && !labels.length);
}

/** Abbreviates a volume, e.g. `1.2M`, in the chart's locale. */
export function formatVolume(viz: VizInstance, value: number): string {
  return formatAbbreviate(value, viz.schema.locale as Parameters<typeof formatAbbreviate>[1]);
}

/**
    The strip's value axis, configured for `range` (pixels, top to bottom):
    labeled at its nonzero ticks, abbreviated, without gridlines or title,
    in the chart's background ink like the price axis.
    @param viz The chart.
    @param range The strip's top and bottom.
*/
export function volumeAxis(viz: VizInstance, range: [number, number]): AxisLeft {
  const {domain, ticks} = volumeScale(stripTop(viz));
  const show = labelsShown(viz);
  return new AxisLeft()
    .renderMode("compute")
    .select(null)
    .config(withAxisInk(viz, {
      locale: viz.schema.locale,
      scale: "linear",
      domain: [domain[1], domain[0]],
      range,
      ticks,
      labels: show ? ticks.filter(t => t > 0) : [],
      tickFormat: (v: number) => formatVolume(viz, v),
      gridSize: 0,
      rounding: "none",
      title: false,
      height: range[1],
      width: range[1],
    }))
    .config(volumeConfig(viz).axisConfig) as AxisLeft;
}

/** The room the strip's axis needs left of the plot: its measured width. */
function axisWidth(axis: AxisLeft): number {
  const bounds = axis.outerBounds() as {width: number};
  return bounds.width ? bounds.width + (axis.padding() as number) : 0;
}

/**
    Installs the strip's room on a chart: at the bottom of the plot, and on
    its left for the strip's axis labels.
    @param viz The chart.
*/
export function installVolumeStrip(viz: VizInstance): void {
  viz._plotInsetBottom = (plotHeight: number) => {
    if (!volumeEnabled(viz)) return 0;
    const {height, gap} = stripSize(volumeConfig(viz), plotHeight);
    return height ? height + gap : 0;
  };
  viz._plotMinLeft = () => {
    if (!volumeEnabled(viz) || !labelsShown(viz)) return 0;
    return axisWidth(volumeAxis(viz, [0, 100]).measure());
  };
}

/** Where the strip sits in content space. */
export interface VolumeStrip {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
    The strip's rectangle for a Plot shape-emit context: from the gap under
    the price axis's range to the x axis. Undefined when no room was reserved.
    @param ctx The Plot shape-emit context.
*/
export function volumeStripRect(ctx: ShapeEmitContext): VolumeStrip | undefined {
  const inset = ctx.insetBottom ?? 0;
  if (!(inset > 0)) return undefined;
  const priceBottom = ctx.yRange[1] - (ctx.x2Height ?? 0);
  const {gap} = volumeConfig(ctx.viz);
  const top = priceBottom + Math.min(gap, inset);
  return {top, bottom: priceBottom + inset, left: ctx.xRange[0], right: ctx.xRange[ctx.xRange.length - 1]};
}

/**
    Whether a node computed for a candle or volume bar snaps the hover to its
    period: the mark itself, or its `::hit` hover target, which the pointer
    crosses first; not its backgroundImage group.
    @param node A node computed for a candle or volume bar.
*/
export const snapsToPeriod = (node: SceneNode): boolean =>
  node.type === "path" || String(node.key).endsWith("::hit");

/** One volume bar's layout. */
export interface VolumeBar {
  cx: number;
  width: number;
  /** The bar's top; its bottom is the strip's. */
  top: number;
}

/**
    The strip's bars and axis scene for a Plot shape-emit context. Each bar
    is a mark of `shapeKey` carrying its candle's row and snap point, so it
    hovers, highlights, and fires events with its candle.
    @param ctx The Plot shape-emit context.
    @param candles Each drawn row's candle center, width, and snap points.
    @param style The bars' styling beneath `volumeConfig.shapeConfig` (fill by direction).
    @param shapeKey The shape key the bars are stamped and wired as.
    @param texture Resolves a bar's texture from its configured texture and fill.
*/
export function emitVolume(
  ctx: ShapeEmitContext,
  candles: Map<PlotDatum, {cx: number; width: number; interactionPoints: unknown[]}>,
  style: Record<string, unknown>,
  shapeKey: string,
  texture: (texture: unknown, fill: unknown) => unknown,
): SceneNode[] {
  const {viz} = ctx;
  const strip = volumeStripRect(ctx);
  if (!strip || !candles.size) return [];
  const {domain} = volumeScale(stripTop(viz));
  const span = strip.bottom - strip.top;
  const bars = new Map<PlotDatum, VolumeBar>();
  candles.forEach(({cx, width}, d) => {
    const v = readVolume(viz, d.data, d.i);
    if (v === undefined || v < 0) return;
    const h = Math.min(span, (v / domain[1]) * span);
    bars.set(d, {cx, width, top: strip.bottom - h});
  });

  const config = volumeConfig(viz);
  const path = makeShape("Path")
    .renderMode("compute")
    .config(shapeConfigFor(viz, shapeKey))
    .config(style)
    .config(configPrep.bind(viz as unknown as VizContext)(config.shapeConfig as Parameters<typeof configPrep>[0]))
    .config({
      d: (d: PlotDatum) => {
        const {cx, width, top} = bars.get(d)!;
        const half = width / 2;
        return `M${cx - half},${top}H${cx + half}V${strip.bottom}H${cx - half}Z`;
      },
      hitArea: (d: PlotDatum) => {
        const {cx, width} = bars.get(d)!;
        const w = Math.max(width, 6);
        return {x: cx - w / 2, y: strip.top, width: w, height: span};
      },
      id: (d: PlotDatum) => `${d.id}_${d.discrete}_volume`,
      label: false,
      x: 0,
      y: 0,
    });
  const fillOf = path.schema.fill as (d: PlotDatum, i: number) => unknown;
  const textureOf = path.schema.texture as (d: PlotDatum, i: number) => unknown;
  path
    .config({texture: (d: PlotDatum, i: number) => texture(textureOf(d, i), fillOf(d, i))})
    .data(Array.from(bars.keys()));
  viz._wirePlotShapeEvents!(path, shapeKey, ctx.events);
  const nodes = collectComputed(path).map(node => {
    const d = node.datum as unknown as PlotDatum | undefined;
    const point = d && snapsToPeriod(node) ? {interactionPoints: candles.get(d)?.interactionPoints} : {};
    return {...node, shapeType: shapeKey, ...point} as SceneNode;
  });

  const axis = volumeAxis(viz, [strip.top, strip.bottom]);
  axis.render();
  const scene = axis.toScene();
  const axisNode = tagAxis({
    ...scene,
    key: "candlestick-volume-axis",
    transform: {x: strip.left - axisLineX(axis, scene), y: 0},
  } as SceneNode);
  return [...nodes, axisNode];
}

/** Where an axis drew its domain line, in its own space: its bar, else its outer bounds' right edge. */
function axisLineX(axis: AxisLeft, scene: SceneNode): number {
  const kids = (scene as {children?: SceneNode[]}).children || [];
  const bar = kids.find(n => n.key === "bar" && n.type === "line") as {points?: [number, number][]} | undefined;
  const x = bar?.points?.[0]?.[0];
  if (Number.isFinite(x)) return x as number;
  const bounds = axis.outerBounds() as {x: number; width: number};
  return bounds.x + bounds.width;
}

/** Marks an axis's nodes as axis chrome, not marks (as Plot does its own axes). */
function tagAxis(node: SceneNode): SceneNode {
  const kids = (node as {children?: SceneNode[]}).children;
  return {
    ...node,
    interactionGroup: "axis",
    ...(kids ? {children: kids.map(tagAxis)} : {}),
  } as SceneNode;
}
