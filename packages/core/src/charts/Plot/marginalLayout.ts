/**
    Where a Plot's marginal strips (`marginals`) go: the room the plot leaves
    for them above its area (the x axis's distribution) and right of it (the
    y axis's), and each strip's band once the axes have settled. The strips
    sit outside any x2 or y2 axis, which keep hugging the plot.

    @module
*/
import {
  marginalScale,
  resolveMarginals,
  type MarginalAxes,
  type MarginalScale,
} from "./marginalStats.js";
import type {MarginalConfig} from "../../utils/D3plusConfig.js";
import {vizDiscrete} from "../viz/discrete.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A strip's default thickness, as a share of the chart area's shorter side. */
export const MARGINAL_SHARE = 0.15;
/** The thinnest and thickest a strip sized by a share gets, in pixels. */
export const MARGINAL_MIN = 16;
export const MARGINAL_MAX = 120;
/** The default gap between a strip and the plot (or its x2/y2 axis), in pixels. */
export const MARGINAL_PADDING = 8;

/** The marginal strips a Plot draws this render, and the room they take. */
export interface MarginalLayout {
  axes: MarginalAxes;
  /** Each axis's marginal space (see `marginalScale`). */
  scales: {x: MarginalScale | null; y: MarginalScale | null};
  /** Each strip's thickness. */
  size: number;
  padding: number;
  /** The room reserved above the plot, and right of it. */
  top: number;
  right: number;
}

/**
    A strip's thickness in pixels: `size` itself above 1, else that share
    (by default `MARGINAL_SHARE`) of the chart area's shorter side, kept
    between `MARGINAL_MIN` and `MARGINAL_MAX`.
    @param size The configured size.
    @param width The chart area's width.
    @param height The chart area's height.
*/
export function marginalSize(
  size: unknown,
  width: number,
  height: number,
): number {
  const value = typeof size === "number" && size > 0 ? size : MARGINAL_SHARE;
  if (value > 1) return value;
  const px = Math.round(value * Math.max(0, Math.min(width, height)));
  return Math.max(MARGINAL_MIN, Math.min(MARGINAL_MAX, px));
}

/**
    The marginal strips a Plot draws, or null for none: `marginals` names
    them, and each axis gets its strip only while both axes are continuous
    (no category axis or swarm) and that axis can place a distribution.
    @param viz The chart.
    @param area The chart area's width and height.
    @param types Each axis's scale type (`"linear"`, `"log"`, `"time"`, …).
*/
export function resolveMarginalLayout(
  viz: VizInstance,
  area: {width: number; height: number},
  types: {x: string; y: string},
): MarginalLayout | null {
  const asked = resolveMarginals(viz.schema.marginals);
  if ((!asked.x && !asked.y) || vizDiscrete(viz) || viz._swarm) return null;
  const scales = {x: marginalScale(types.x), y: marginalScale(types.y)};
  if (!scales.x || !scales.y) return null;
  const config = (viz.schema.marginalConfig ?? {}) as MarginalConfig;
  const size = marginalSize(config.size, area.width, area.height);
  const padding =
    typeof config.padding === "number" && config.padding >= 0
      ? config.padding
      : MARGINAL_PADDING;
  return {
    axes: asked,
    scales,
    size,
    padding,
    top: asked.x ? size + padding : 0,
    right: asked.y ? size + padding : 0,
  };
}

/** A strip's band: `[start, end]` along its axis and `[inner, outer]` across it, in content space. */
export interface MarginalBand {
  along: [number, number];
  /** The edge nearest the plot, then the far edge. */
  across: [number, number];
}

/**
    The bands of the top (x) and right (y) strips, given the plot's final
    ranges: the top strip runs above the plot and any x2 axis, and the right
    strip right of the plot and any y2 axis, each `padding` clear of them.
    @param layout The marginal layout.
    @param plot The plot's x and y ranges in content space, and the x2
    axis's height and y2 axis's width.
*/
export function marginalBands(
  layout: Pick<MarginalLayout, "size" | "padding">,
  plot: {
    xRange: number[];
    yRange: number[];
    x2Height: number;
    y2Width?: number;
  },
): {x: MarginalBand; y: MarginalBand} {
  const {size, padding} = layout;
  const top = plot.yRange[0] - plot.x2Height,
    bottom = plot.yRange[1] - plot.x2Height;
  const right = plot.xRange[plot.xRange.length - 1];
  const above = top - plot.x2Height - padding;
  const beside = right + (plot.y2Width ?? 0) + padding;
  return {
    x: {
      along: [plot.xRange[0], right],
      across: [above, above - size],
    },
    y: {
      along: [top, bottom],
      across: [beside, beside + size],
    },
  };
}

/**
    `resolveMarginalLayout` for a Plot draw, from its axes' scale types: a
    point or band scale (a category axis), else the scale its axis draws.
    @param viz The chart.
    @param area The chart area's width and height.
    @param scales The draw's `plotScales` and `plotConfigScales`.
*/
export function plotMarginalLayout(
  viz: VizInstance,
  area: {width: number; height: number},
  scales: {
    xScale: string;
    yScale: string;
    xConfigScale: string;
    yConfigScale: string;
  },
): MarginalLayout | null {
  const category = /^(point|band)$/i;
  return resolveMarginalLayout(viz, area, {
    x: category.test(scales.xScale) ? scales.xScale : scales.xConfigScale,
    y: category.test(scales.yScale) ? scales.yScale : scales.yConfigScale,
  });
}
