/**
    Plot's `jitter`: point marks on a category axis spread across their
    category's band, each by an offset seeded from its id, so a redraw, a
    resize, or a filter never moves a point within its band. The same band
    sizes the ticks of a barcode plot (the Tick shape).
*/
import type {DataPoint} from "@d3plus/data";

import type {PlotAxisFn} from "../features/plotPaint.js";
import {bandStep} from "../Pyramid/scene.js";
import {jitterOffset, jitterWidth} from "../../utils/jitter.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The share of its band a Tick spans unless `shapeConfig.Tick.length` sets it. */
export const DEFAULT_TICK_LENGTH = 0.6;

/** What `plotBand` reads from a Plot shape emit. */
export interface BandInputs {
  viz: VizInstance;
  values: DataPoint[];
  x: PlotAxisFn;
  y: PlotAxisFn;
  xDomain: unknown[];
  yDomain: unknown[];
  xRange: number[];
  yRange: number[];
}

/** A Plot's band: the axis it runs across and its width in pixels. */
export interface Band {
  axis: "x" | "y";
  step: number;
}

/**
    The band a Plot's point marks sit in: across its `discrete` axis, as
    wide as the gap between neighboring categories (or neighboring values,
    on a continuous discrete axis). Null without a `discrete` axis.
    @param inputs The shape emit's rows, scales, domains, and ranges.
*/
export function plotBand(inputs: BandInputs): Band | null {
  const {viz, values} = inputs;
  const discrete = viz.schema.discrete;
  if (discrete !== "x" && discrete !== "y") return null;
  const axis: "x" | "y" = discrete;
  const scale = axis === "x" ? inputs.x : inputs.y;
  const domain = axis === "x" ? inputs.xDomain : inputs.yDomain;
  const range = axis === "x" ? inputs.xRange : inputs.yRange;
  const positions = [...domain, ...values.map(d => d[axis])]
    .filter(v => v !== undefined && v !== null && v !== "")
    .map(v => scale(v, axis));
  const span = Math.abs(range[range.length - 1] - range[0]);
  const step = bandStep(positions.filter(Number.isFinite), span);
  return {axis, step: step > 0 ? step : span};
}

/**
    Each jittered row's position across its band: its category's center plus
    its seeded offset times `width` of the band. Null when `jitter` is off or
    the Plot has no band.
    @param inputs The shape emit's rows, scales, domains, and ranges.
    @param setting The `jitter` setting.
*/
export function jitterAccessor(
  inputs: BandInputs,
  setting: unknown,
): {axis: "x" | "y"; at: (d: DataPoint) => number} | null {
  const width = jitterWidth(setting);
  const band = width ? plotBand(inputs) : null;
  if (!band) return null;
  const {axis, step} = band;
  const scale = axis === "x" ? inputs.x : inputs.y;
  return {
    axis,
    at: d => scale(d[axis], axis) + jitterOffset(`${d.id}`) * width * step,
  };
}
