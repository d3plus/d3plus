/**
    Axis-rescaling zoom for the Plot family (#780).

    Rather than scaling the rendered picture (how every other chart zooms), a
    Plot keeps its axes in place and rescales the domain of each simple linear
    or time axis, then repaints its axes and shapes at the new scale. A time
    axis re-ticks for the window it shows, so zooming in steps its ticks down
    from years to months to days. Discrete (point/band) and log axes stay
    fixed — a bar chart with category bars zooms and pans along its value
    axis only. `zoomAxes` limits the rescale to one dimension, and the
    other continuous axis refits to the rows in view (see `zoomAxes.ts`).
    The d3-zoom behavior and controls are shared with every other chart
    (`drawSteps/zoomControls.ts`); `zoomed()` hands each transform to
    `Plot._zoomRescale`, which lands here.

    @module
*/

import type {ClipShape, SceneNode} from "@d3plus/render";

import {
  PLOT_ZOOM_CONTENT_KEY,
  plotPaintMeasured,
} from "../features/plotPaint.js";
import {unwrapBreakMasks} from "./plotBreaks.js";
import {unwrapDomainClips} from "./domainClip.js";
import {hasUserDomain, plotBaseline} from "./baselineDomain.js";
import {zoomedDomain} from "./zoomWindow.js";
import {broadcastZoom} from "../drawSteps/zoomLink.js";
import {
  rangeSelectorAxis,
  refitDomain,
  splitZoomAxes,
  zoomDimensions,
  type AxisName,
} from "./zoomAxes.js";
import type {
  PlotMeasureResult,
  PlotPaintContext,
} from "../features/plotPaint.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/** A value on a zoomable axis: a number, or a Date on a time axis. */
export type AxisValue = number | Date;

/** The invertible piece of an axis's d3 scale (linear or time) the rescale needs. */
export interface LinearScale {
  (value: AxisValue): number;
  domain(): AxisValue[];
  range(): number[];
  invert(value: number): AxisValue;
}

/** A continuous transform in surface space, as d3-zoom reports it. */
export interface ZoomState {
  k: number;
  x: number;
  y: number;
}

/** The unzoomed draw a zoom rescales from. */
export interface PlotZoomBase {
  pCtx: PlotPaintContext;
  layout: PlotMeasureResult;
  chartTransform: {x: number; y: number};
  scales: Partial<Record<AxisName, LinearScale>>;
  labelSpace: Partial<Record<AxisName, number>>;
  /** Axes drawn with a baseline break; a zoom keeps the break only on these. */
  breaks: Partial<Record<AxisName, boolean>>;
  /** Axes drawn `reverse`d, whose scales run the other way to their domains. */
  reversed: Partial<Record<AxisName, boolean>>;
  /**
      Continuous axes a zoom leaves unscaled (see `zoomAxes`), which refit to
      the rows in view, with their unzoomed scales.
  */
  refit: Partial<Record<AxisName, LinearScale>>;
  /** Where bars and areas start, which a refit axis always reaches. */
  baseline?: number;
}

/**
    Whether an axis zooms: a linear or power axis over a continuous scale, or
    a time axis. Point (category) axes and log axes don't.
*/
const zoomable = (plotScale: string, configScale: string): boolean =>
  configScale === "time" ||
  (plotScale === "Linear" && ["linear", "pow", "sqrt"].includes(configScale));

/** Which of the plot's axes are simple linear or time axes (the zoomable ones). */
function zoomableAxes(pCtx: PlotPaintContext): AxisName[] {
  const axes: AxisName[] = [];
  if (zoomable(pCtx.xScale, pCtx.xConfigScale)) axes.push("x");
  if (pCtx.x2Exists && zoomable(pCtx.xScale, pCtx.x2ConfigScale))
    axes.push("x2");
  if (zoomable(pCtx.yScale, pCtx.yConfigScale)) axes.push("y");
  if (pCtx.y2Exists && zoomable(pCtx.yScale, pCtx.y2ConfigScale))
    axes.push("y2");
  return axes;
}

/**
    Whether the chart's user set an axis's domain (an `xDomain`, an axis
    config `domain`, or a `baseline`), which a refit leaves alone.
*/
function userFixedDomain(viz: Viz, axis: AxisName): boolean {
  if (viz.schema[`${axis}Domain`]) return true;
  const config = viz[`_${axis}Config`] as {domain?: unknown} | undefined;
  if (Array.isArray(config?.domain)) return true;
  return (axis === "x" || axis === "y") && hasUserDomain(viz, axis);
}

/** The content group `plotEmit` wraps a zoomable plot's shapes in. */
function contentNodes(nodes: SceneNode[]): SceneNode[] | undefined {
  const group = nodes.find(n => n.key === PLOT_ZOOM_CONTENT_KEY);
  return group && group.type === "group"
    ? unwrapDomainClips(unwrapBreakMasks(group.children))
    : undefined;
}

/**
    Paints a Plot at its natural (unzoomed) scale and records what a zoom
    needs to rescale from. When a zoom is already in effect (the chart was
    re-rendered mid-zoom), the plot is immediately repainted at that zoom so
    the view doesn't snap back.
*/
export function paintZoomablePlot(
  viz: Viz,
  pCtx: PlotPaintContext,
  current?: ZoomState,
): SceneNode[] {
  const {nodes, layout} = plotPaintMeasured(viz, pCtx);
  clearTimeout(viz._plotUnclipTimer);
  viz._plotZoomBase = undefined;
  viz._zoomShapes = undefined;
  if (!viz.schema.zoom) return nodes;

  const scales: PlotZoomBase["scales"] = {};
  const labelSpace: PlotZoomBase["labelSpace"] = {};
  const breaks: PlotZoomBase["breaks"] = {};
  const reversed: PlotZoomBase["reversed"] = {};
  const refit: PlotZoomBase["refit"] = {};
  const split = splitZoomAxes(
    zoomableAxes(pCtx),
    zoomDimensions(viz.schema.zoomAxes, rangeSelectorAxis(viz)),
  );
  for (const axis of [...split.rescale, ...split.refit]) {
    const axisInstance = viz[`_${axis}Axis`];
    const d3Scale = axisInstance?._d3Scale as
      (LinearScale & {copy(): LinearScale}) | undefined;
    if (!d3Scale || typeof d3Scale.invert !== "function") continue;
    const rescaled = split.rescale.includes(axis);
    if (!rescaled && userFixedDomain(viz, axis)) continue;
    (rescaled ? scales : refit)[axis] = d3Scale.copy();
    labelSpace[axis] = axisInstance?._labelSpace;
    breaks[axis] = Boolean(axisInstance?._baselineBreak);
    reversed[axis] = Boolean(axisInstance?.schema.reverse);
  }
  // Shape sizes for the automatic `zoomMax` come from the unzoomed paint.
  viz._zoomShapes = contentNodes(nodes);
  if (!Object.keys(scales).length) return nodes;

  const {x = 0, y = 0} = viz._chartTransform || {};
  viz._plotZoomBase = {
    pCtx,
    layout,
    chartTransform: {x, y},
    scales,
    labelSpace,
    breaks,
    reversed,
    refit,
    baseline: plotBaseline(viz),
  };
  if (current && (current.k !== 1 || current.x || current.y)) {
    const zoomed = rescalePlot(viz, current);
    if (zoomed) return zoomed;
  }
  return nodes;
}

/** The baseline, when the axis's unzoomed domain reaches it (bars and areas start there). */
function reachedBaseline(
  base: PlotZoomBase,
  axis: AxisName,
): number | undefined {
  const b = base.baseline;
  if (b === undefined) return undefined;
  const [d0, d1] = base.refit[axis]!.domain().map(Number);
  return b >= Math.min(d0, d1) && b <= Math.max(d0, d1) ? b : undefined;
}

/**
    The domain a refit axis shows for a zoom transform: the extent of the
    rows within the rescaled axes' window (see `refitDomain`), in the
    orientation its unzoomed scale reads, or undefined when no rows are in
    view.
*/
function refitAxisDomain(
  base: PlotZoomBase,
  t: ZoomState,
  axis: AxisName,
): number[] | undefined {
  const along = axis[0] === "x" ? "y" : "x";
  if (!base.scales[along]) return undefined;
  const window = zoomedDomain(base, t, along).map(Number) as [number, number];
  const {pCtx} = base;
  const stacked = pCtx.stackData.length > 0 && axis === pCtx.opp;
  const extent = refitDomain({
    rows: pCtx.data as Record<string, unknown>[],
    along,
    window,
    axis,
    confidence: axis === pCtx.opp,
    stack: stacked ? pCtx.stackData : undefined,
    discrete: along,
    baseline: axis === pCtx.opp ? reachedBaseline(base, axis) : undefined,
  });
  if (!extent) return undefined;
  const [b0, b1] = base.refit[axis]!.domain();
  const out = +b1 < +b0 ? [extent[1], extent[0]] : extent;
  return base.reversed[axis] ? out.reverse() : out;
}

/**
    The paint-context overrides a zoom transform makes: each rescaled axis's
    domain and axis config, each refit axis's domain, and where the
    unzoomed plot ranges land.
*/
function zoomedContext(
  base: PlotZoomBase,
  t: ZoomState,
): Partial<PlotPaintContext> {
  const {pCtx, layout, chartTransform: ct, scales} = base;

  const zoomed: Partial<PlotPaintContext> = {};
  for (const axis of Object.keys(scales) as AxisName[])
    zoomed[`${axis}Domain`] = zoomedDomain(base, t, axis) as number[];
  // Per rescaled axis: show the exact rescaled domain (the default "outside"
  // rounding would snap it back out to nice values on every tick), label only
  // the scale's nice ticks (forcing in the arbitrary domain endpoints would
  // crowd out their neighbors), and pin the label space to its unzoomed size
  // so wider tick labels overflow outward rather than shifting the axis line.
  // A baseline break stays only where the unzoomed axis had one, so the
  // rescaled domain maps onto the same pixel range it was read from. The
  // domain is repeated here so it also wins over an `xConfig.domain`.
  zoomed.zoomAxes = {};
  for (const axis of Object.keys(scales) as AxisName[])
    zoomed.zoomAxes[axis] = {
      rounding: "none",
      domainTicks: false,
      fixedSize: base.labelSpace[axis],
      domain: zoomed[`${axis}Domain`],
      ...(base.breaks[axis] ? {} : {baselineBreak: false}),
    };
  // A refit axis rounds its domain as usual, at its unzoomed label size.
  for (const axis of Object.keys(base.refit) as AxisName[]) {
    const domain = refitAxisDomain(base, t, axis);
    if (!domain) continue;
    zoomed[`${axis}Domain`] = domain;
    zoomed.zoomAxes[axis] = {
      fixedSize: base.labelSpace[axis],
      domain,
      ...(base.breaks[axis] ? {} : {baselineBreak: false}),
    };
  }

  // Where the unzoomed plot's x and y ranges land under the zoom: bars on a
  // zoomed time axis size themselves against it (see `barEmit`).
  const land = (r: number, vertical: boolean): number => {
    const origin = vertical ? ct.y : ct.x;
    const offset = vertical ? -pCtx.x2Height : 0;
    return (
      (r + offset + origin) * t.k + (vertical ? t.y : t.x) - origin - offset
    );
  };
  zoomed.zoomRanges = {};
  if (scales.x) zoomed.zoomRanges.x = layout.xRange.map(r => land(r, false));
  if (scales.y) zoomed.zoomRanges.y = layout.yRange.map(r => land(r, true));

  return zoomed;
}

/**
    Repaints the plot for a zoom transform. Returns the new chart scene, or
    `undefined` when the plot has no linear or time axis to rescale (it then falls
    back to picture zoom like any other chart). The content is clipped to the
    plot rect unless the view is at its natural scale (or `keepClip` is set),
    where shapes drawn at the domain edges would otherwise be cut off.
*/
export function rescalePlot(
  viz: Viz,
  t: ZoomState,
  keepClip = false,
): SceneNode[] | undefined {
  const base = viz._plotZoomBase;
  if (!base) return undefined;
  const {pCtx, layout} = base;

  // At the natural scale the plot repaints exactly as it first drew (its
  // rounded domains and their end ticks included), so a reset restores it.
  const identity = t.k === 1 && !t.x && !t.y;
  const zoomed = identity ? {} : zoomedContext(base, t);
  const clip: ClipShape | undefined =
    identity && !keepClip
      ? undefined
      : {
          type: "rect",
          x: layout.xRange[0],
          y: layout.yRange[0] - pCtx.x2Height,
          width: layout.xRange[1] - layout.xRange[0],
          height:
            layout.yRange[1] - layout.yRange[0] + (layout.insetBottom ?? 0),
        };

  return plotPaintMeasured(viz, {...pCtx, ...zoomed}, layout, clip).nodes;
}

/**
    Repaints the plot for a zoom transform, animated over `duration`, and
    passes the zoom to the charts linked with it (see `zoomLink.ts`). An
    animated return to the natural scale from a zoomed view keeps the clip until the transition
    settles, so shapes tweening back in from outside the plot don't paint
    over the axes on the way; the clip is then dropped with an instant
    repaint.
*/
export function zoomPlot(
  viz: Viz,
  t: ZoomState,
  duration: number,
): SceneNode[] | undefined {
  clearTimeout(viz._plotUnclipTimer);
  const content = viz._chartScene?.find(n => n.key === PLOT_ZOOM_CONTENT_KEY);
  const clipped = content?.type === "group" && !!content.clip;
  const settling = clipped && duration > 0 && t.k === 1 && !t.x && !t.y;
  const nodes = rescalePlot(viz, t, settling);
  if (nodes) broadcastZoom(viz as never, t, duration);
  if (nodes && settling) {
    viz._plotUnclipTimer = setTimeout(() => {
      const settled = rescalePlot(viz, t);
      if (!settled) return;
      viz._chartScene = settled;
      viz._drawSceneToTarget(0);
    }, duration);
  }
  return nodes;
}
