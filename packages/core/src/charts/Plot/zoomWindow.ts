/**
    A Plot's zoom as windows of axis values: the window a zoom transform
    shows along each rescaled axis, and the transform that shows a given
    window. The range selector (`drawSteps/rangeSelector.ts`) and linked
    zoom (`drawSteps/zoomLink.ts`) speak in windows, so a window means the
    same dates or numbers on every chart.

    @module
*/
import {zoomIdentity, zoomTransform} from "d3-zoom";

import {fitArea, zoomedDims} from "../drawSteps/zoomFit.js";
import type Viz from "../viz/Viz.js";
import type {
  AxisValue,
  LinearScale,
  PlotZoomBase,
  ZoomState,
} from "./plotZoom.js";
import type {AxisName} from "./zoomAxes.js";

/** A window of axis values, low end first (a Date as its time). */
export type ZoomWindow = [number, number];

/** A window along each screen dimension a zoom scales. */
export type ZoomWindows = Partial<Record<"x" | "y", ZoomWindow>>;

/**
    The domain a zoom transform shows along one of the plot's rescaled axes:
    the values at the ends of its unzoomed pixel range, in the orientation
    the axis reads its domain in.
    @param base The unzoomed draw.
    @param t The zoom transform.
    @param axis A rescaled axis.
*/
export function zoomedDomain(
  base: PlotZoomBase,
  t: ZoomState,
  axis: AxisName,
): AxisValue[] {
  const {pCtx, chartTransform: ct} = base;
  const scale = base.scales[axis]!;
  // Surface point s shows unzoomed surface point (s - t) / k. Axis positions
  // live in the plot body (`ct` from the surface origin), and y positions are
  // additionally offset by the x2 axis height (see `renderYAxes`).
  // A time axis's domain comes back as Dates, which the axis reads as given.
  const vertical = axis[0] === "y";
  const origin = vertical ? ct.y : ct.x;
  const shift = vertical ? t.y : t.x;
  const offset = vertical ? -pCtx.x2Height : 0;
  const domain = scale
    .range()
    .map(r =>
      scale.invert((r + offset + origin - shift) / t.k - origin - offset),
    );
  // Keep the base domain's orientation, handing a reversed axis its
  // domain the way round the axis reverses.
  const [b0, b1] = scale.domain();
  const flip = (+b1 - +b0) * (+domain[1] - +domain[0]) < 0;
  return flip !== Boolean(base.reversed[axis]) ? domain.reverse() : domain;
}

/** The chart's live d3-zoom transform. */
export function liveTransform(viz: Viz): ZoomState {
  const node = (viz._zoomEventTarget || viz._container)?.node();
  const t = node ? zoomTransform(node) : zoomIdentity;
  return {k: t.k, x: t.x, y: t.y};
}

/** A window's ends in order. */
const ordered = (a: number, b: number): ZoomWindow =>
  a <= b ? [a, b] : [b, a];

/**
    The window a Plot shows along each dimension its zoom scales (x, or y),
    read from the x and y axes. Empty for a chart that isn't an
    axis-rescaling Plot.
    @param viz The chart.
    @param t The transform; the live one when omitted.
*/
export function zoomWindows(
  viz: Viz,
  t: ZoomState = liveTransform(viz),
): ZoomWindows {
  const base = viz._plotZoomBase;
  const out: ZoomWindows = {};
  if (!base) return out;
  for (const dim of ["x", "y"] as const) {
    if (!base.scales[dim]) continue;
    const [a, b] = zoomedDomain(base, t, dim).map(Number);
    out[dim] = ordered(a, b);
  }
  return out;
}

/**
    The extent of a list of axis values (numbers and Dates), as numbers, or
    undefined when none is finite.
    @param values The values.
*/
export function valuesExtent(values: unknown[]): ZoomWindow | undefined {
  let lo = Infinity,
    hi = -Infinity;
  for (const v of values) {
    const n = typeof v === "number" ? v : v instanceof Date ? +v : NaN;
    if (!Number.isFinite(n)) continue;
    if (n < lo) lo = n;
    if (n > hi) hi = n;
  }
  return lo <= hi ? [lo, hi] : undefined;
}

/**
    The extent of the data along a Plot's x or y axis, as numbers, or
    undefined when it has none.
    @param viz The chart.
    @param dim The axis.
*/
export function dataWindow(viz: Viz, dim: "x" | "y"): ZoomWindow | undefined {
  const values = viz._plotZoomBase?.pCtx[`${dim}Data`];
  return values ? valuesExtent(values) : undefined;
}

/** Where a value on an axis sits in surface pixels, unzoomed. */
function surfaceAt(
  base: PlotZoomBase,
  dim: "x" | "y",
  scale: LinearScale,
  value: number,
): number {
  const ct = base.chartTransform;
  return dim === "x"
    ? scale(value) + ct.x
    : scale(value) + ct.y - base.pCtx.x2Height;
}

/**
    The zoom transform that shows `windows` along the dimensions a Plot's
    zoom scales: the first given window (x, then y) sets the scale and each
    given window its own translation; a dimension without one stays
    centered. Null when the chart isn't an axis-rescaling Plot or no given
    window lies along an axis it rescales. Unclamped: `zoomTo` clamps it.
    @param viz The chart.
    @param windows The windows to show.
*/
export function windowTransform(
  viz: Viz,
  windows: ZoomWindows,
): ZoomState | null {
  const base = viz._plotZoomBase;
  if (!base) return null;
  const dims = zoomedDims(viz);
  const area = fitArea(viz);
  const spans: Partial<Record<"x" | "y", {lo: number; k: number}>> = {};
  for (const dim of ["x", "y"] as const) {
    const scale = base.scales[dim];
    const window = windows[dim];
    if (!scale || !window || !dims[dim]) continue;
    const ends = window.map(v => surfaceAt(base, dim, scale, v));
    const lo = Math.min(...ends),
      hi = Math.max(...ends);
    const i = dim === "x" ? 0 : 1;
    const size = area[1][i] - area[0][i];
    if (!(hi > lo) || !(size > 0)) continue;
    spans[dim] = {lo, k: size / (hi - lo)};
  }
  const k = spans.x?.k ?? spans.y?.k;
  if (k === undefined) return null;
  const translate = (dim: "x" | "y"): number => {
    const i = dim === "x" ? 0 : 1;
    const span = spans[dim];
    if (span) return area[0][i] - k * span.lo;
    const center = (area[0][i] + area[1][i]) / 2;
    return center * (1 - k);
  };
  return {k, x: translate("x"), y: translate("y")};
}
