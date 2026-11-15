import type {VizInstance} from "../viz/vizTypes.js";
import {vizDiscrete} from "../viz/discrete.js";

/** How many points per pixel of plot a line or area draws before it is thinned. */
export const DOWNSAMPLE_DENSITY = 2;

/**
    The Line and Area config that thins a Plot's dense series (see the
    chart's `downsample`): the most points each draws, and the pixel range
    along the discrete axis that shows, so a zoomed plot thins only what it
    shows. Empty when `downsample` is `false`, or with no plot range.
    @param viz The chart.
    @param xRange The plot's x range, in pixels.
    @param yRange The plot's y range, in pixels.
*/
export function plotDownsample(
  viz: VizInstance,
  xRange: number[] | undefined,
  yRange: number[] | undefined,
): {downsample?: number; downsampleExtent?: [number, number]} {
  const setting = viz.schema.downsample;
  if (setting === false) return {};
  const range = vizDiscrete(viz) === "y" ? yRange : xRange;
  if (!range || range.length < 2) return {};
  const extent: [number, number] = [range[0], range[1]];
  const span = Math.abs(extent[1] - extent[0]);
  const target =
    typeof setting === "number"
      ? setting
      : Math.round(span * DOWNSAMPLE_DENSITY);
  return target > 0 ? {downsample: target, downsampleExtent: extent} : {};
}
