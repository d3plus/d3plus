/**
    Draws one piece of chart chrome — the size legend, else the legend, else
    the colorScale — inside the chart's negative space instead of in a
    margin, when the chart offers a region (`ChartDefinition.insetRegion`)
    and `legendInset` is on.

    Placement needs the chart's laid-out marks, but chrome normally claims
    its margin before the chart lays out, so the draw runs optimistically:
      1. Every candidate skips its margin claim, and the chart lays out in
         the full area.
      2. The open space around the marks (`negativeSpace`) is searched for
         the first candidate, in priority order, that fits.
      3. If one fits and nothing else is waiting on a margin, that draw
         stands. If other candidates are showing, the chart lays out again
         with them back in their margins, and the winner is fitted again in
         the (smaller) chart. When nothing fits, the chart lays out normally.

    @module
*/

import {negativeSpace} from "@d3plus/math";
import type {Bounds} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";

import {chartBounds} from "../features/chartGeometry.js";
import {paintColorScaleInset, placeColorScaleDom} from "../features/featuresColorScale.js";
import {buildLegendData, paintLegendInset} from "../features/featuresLegend.js";
import {sanitizePosition} from "../features/features.js";
import {markBoxes} from "../features/sceneBounds.js";
import {INSET_PRIORITY, insetFrame, insetStyle} from "../features/insetState.js";
import type {InsetKey, InsetOrient, InsetPlacement, InsetRegion} from "../features/insetState.js";
import {bottomRightControlsBox} from "../drawSteps/bottomRightControlsMarkup.js";
import {MINIMAP_RIGHT_INSET} from "../drawSteps/minimapMarkup.js";
import {getTopLeftContributions} from "../drawSteps/topLeftControls.js";
import {topLeftControlsBox} from "../drawSteps/topLeftControlsMarkup.js";
import {zoomControlsBox} from "../drawSteps/zoomControlsMarkup.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {resolveSpec} from "./resolveSpec.js";

/**
    The default inset region: the chart area (or `bounds`, in surface
    coordinates), with the boxes of every data mark in the chart's scene as
    obstacles (less any subtree `skip` excludes). Charts opt in by returning
    this from their `insetRegion`.
*/
export function sceneInsetRegion(
  viz: VizInstance,
  bounds?: Bounds,
  skip?: (node: SceneNode) => boolean,
): InsetRegion {
  const {width, height} = chartBounds(viz);
  return {
    bounds: bounds ?? {x: viz._margin.left, y: viz._margin.top, width, height},
    obstacles: markBoxes(viz._chartScene || [], viz._chartTransform, skip),
  };
}

/** Whether `legendInset` is on for this draw. */
function insetEnabled(viz: VizInstance): boolean {
  const flag = viz.schema.legendInset;
  return typeof flag === "function" ? Boolean(flag.bind(viz)(resolveSpec(viz))) : Boolean(flag);
}

/** The smallest a legend entry can be: a swatch (1.4× the 12px label font) plus its padding. */
const MIN_LEGEND_ENTRY = 12 * 1.4 + 5;

/**
    Whether the legend could possibly lay out inside the chart: its entries,
    even with their labels dropped, must fit the largest frame an inset
    legend may take (see `insetFrame`). Rules out laying out a legend of
    hundreds of entries just to find it doesn't fit.
*/
function legendCouldFit(viz: VizInstance): boolean {
  const frame = insetFrame("column", {width: viz.schema.width || 0, height: viz.schema.height || 0});
  const entries = buildLegendData(viz).legendData.length;
  return entries * MIN_LEGEND_ENTRY * MIN_LEGEND_ENTRY <= frame.width * frame.height;
}

/**
    The candidates this draw may place inside the chart, in priority order.
    A legend or colorScale whose position the user set explicitly stays
    where they put it.
*/
function insetCandidates(viz: VizInstance): InsetKey[] {
  const auto = viz._insetAutoPositions;
  return INSET_PRIORITY.filter(key => {
    if (key === "legend")
      return (!auto || viz.schema.legendPosition === auto.legend) && legendCouldFit(viz);
    if (key === "colorScale") return !auto || viz.schema.colorScalePosition === auto.colorScale;
    return true;
  });
}

/** The orientations a candidate may take inside the chart. */
const ORIENTS: Record<InsetKey, InsetOrient[]> = {
  sizeLegend: ["column"],
  legend: ["column", "row"],
  colorScale: ["column", "row"],
};

/** Whether a candidate laid out for the chart's interior this pass is showing at all. */
function isShowing(viz: VizInstance, key: InsetKey): boolean {
  if (key === "sizeLegend") return Boolean(bottomRightControlsBox(viz)?.inset);
  if (key === "legend") return Boolean(viz._legendClass?._data?.length);
  return Boolean(viz.schema.colorScale) &&
    sanitizePosition(viz.schema.colorScalePosition.bind(viz)(resolveSpec(viz))) !== false &&
    !viz.schema.colorScaleConfig.select;
}

/**
    Lays a showing candidate out for the chart's interior in `orient` and
    returns its content size, or null when it can't lay out that way.
*/
function measure(
  viz: VizInstance,
  key: InsetKey,
  orient: InsetOrient,
  area: {width: number; height: number},
  final = false,
): {width: number; height: number} | null {
  if (key === "sizeLegend") {
    const box = bottomRightControlsBox(viz);
    return box ? {width: box.width, height: box.height} : null;
  }
  return key === "legend"
    ? paintLegendInset(viz, orient, area)
    : paintColorScaleInset(viz, orient, area, final);
}

/** The chart corners an inset box is tried in, most preferred first. */
const CORNERS: Array<Pick<InsetPlacement, "alignX" | "alignY">> = [
  {alignX: "right", alignY: "bottom"},
  {alignX: "right", alignY: "top"},
  {alignX: "left", alignY: "bottom"},
  {alignX: "left", alignY: "top"},
];

/**
    Where a box of `width` × `height` sits in the open rects (sorted largest
    first): in the first chart corner, in `CORNERS` order, that some rect
    reaching that corner has room for. When it fits in no corner, it goes in
    the first rect it fits, against whichever of the rect's sides lie on the
    region's edges (bottom-right when it touches both), centered along an
    axis otherwise.
*/
export function fitInset(
  rects: Bounds[],
  bounds: Bounds,
  width: number,
  height: number,
): (Bounds & Pick<InsetPlacement, "alignX" | "alignY">) | null {
  const eps = 0.5;
  const fits = rects.filter(r => r.width >= width && r.height >= height);
  if (!fits.length) return null;
  const edges = (r: Bounds) => ({
    right: Math.abs(r.x + r.width - (bounds.x + bounds.width)) < eps,
    left: Math.abs(r.x - bounds.x) < eps,
    bottom: Math.abs(r.y + r.height - (bounds.y + bounds.height)) < eps,
    top: Math.abs(r.y - bounds.y) < eps,
  });
  const place = (r: Bounds, alignX: InsetPlacement["alignX"], alignY: InsetPlacement["alignY"]) => ({
    x: alignX === "right" ? r.x + r.width - width : alignX === "left" ? r.x : r.x + (r.width - width) / 2,
    y: alignY === "bottom" ? r.y + r.height - height : alignY === "top" ? r.y : r.y + (r.height - height) / 2,
    width,
    height,
    alignX,
    alignY,
  });
  for (const {alignX, alignY} of CORNERS) {
    const rect = fits.find(r => {
      const e = edges(r);
      return e[alignX as "left" | "right"] && e[alignY as "top" | "bottom"];
    });
    if (rect) return place(rect, alignX, alignY);
  }
  const rect = fits[0], e = edges(rect);
  return place(
    rect,
    e.right ? "right" : e.left ? "left" : "center",
    e.bottom ? "bottom" : e.top ? "top" : "middle",
  );
}

/** Rough height of the attribution credit, a single line of small text. */
const ATTRIBUTION_HEIGHT = 22;

/**
    Boxes of the chrome overlaid on the chart that inset chrome must also
    stay clear of: the zoom buttons (and the minimap that opens beneath
    them once zoomed), the top-left controls, and the attribution credit in
    the chart area's bottom-right corner (sized from its rendered node when
    there is one, otherwise from its text, up to the half of the chart it
    may span before collapsing to a badge).
*/
function chromeBoxes(viz: VizInstance): Bounds[] {
  const boxes: Bounds[] = [];
  const {width, height} = chartBounds(viz);
  const zoom = zoomControlsBox(viz as never);
  if (zoom) {
    const minimap = viz.schema.minimap ? (zoom.width - MINIMAP_RIGHT_INSET) * (height / Math.max(1, width)) : 0;
    boxes.push({x: viz.schema.width - zoom.width, y: 0, width: zoom.width, height: zoom.height + minimap});
  }
  const topLeft = topLeftControlsBox(viz as never, getTopLeftContributions(viz as never));
  if (topLeft) boxes.push({x: 0, y: 0, width: topLeft.width, height: topLeft.height});
  if (viz.schema.attribution) {
    const parent = viz._select?.node?.()?.parentNode as Element | null | undefined;
    const node = parent?.querySelector?.("div.d3plus-attribution") as HTMLElement | null | undefined;
    const text = String(viz.schema.attribution).replace(/<[^>]*>/g, "");
    const w = Math.min(node?.offsetWidth || text.length * 6 + 30, width / 2);
    const h = node?.offsetHeight || ATTRIBUTION_HEIGHT;
    const right = viz.schema.width - viz._margin.right, bottom = viz.schema.height - viz._margin.bottom;
    boxes.push({x: right - w, y: bottom - h, width: w, height: h});
  }
  return boxes;
}

/** The open rects in the chart's region, kept `padding` clear of the marks and the region's edges. */
function openSpace(viz: VizInstance): {rects: Bounds[]; bounds: Bounds; area: {width: number; height: number}} | null {
  const region = viz._insetRegion?.();
  if (!region) return null;
  const {padding} = insetStyle(viz);
  const b = region.bounds;
  const bounds = {
    x: b.x + padding,
    y: b.y + padding,
    width: b.width - padding * 2,
    height: b.height - padding * 2,
  };
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const exclude = chromeBoxes(viz);
  return {rects: negativeSpace(bounds, region.obstacles, {padding, exclude}), bounds, area: b};
}

/**
    Fits the first of `keys` that has room inside the chart. Returns the
    placement (or null) and which candidates are showing at all.
*/
function choose(viz: VizInstance, keys: InsetKey[]): {placement: InsetPlacement | null; showing: InsetKey[]} {
  const showing = keys.filter(key => isShowing(viz, key));
  const space = showing.length ? openSpace(viz) : null;
  if (!space || !space.rects.length) return {placement: null, showing};
  const {margin} = insetStyle(viz);
  for (const key of showing) {
    for (const orient of ORIENTS[key]) {
      const size = measure(viz, key, orient, space.area);
      const spot = size && fitInset(space.rects, space.bounds, size.width + margin * 2, size.height + margin * 2);
      if (spot) {
        // A smooth-gradient colorScale paints its own DOM copy only on its final layout.
        if (key === "colorScale") measure(viz, key, orient, space.area, true);
        return {placement: {key, orient, ...spot}, showing};
      }
    }
  }
  return {placement: null, showing};
}

/** Runs `_draw()` again from the margins the render started with. */
function redraw(viz: VizInstance, start: {margin: VizInstance["_margin"]; padding: VizInstance["_padding"]}): void {
  viz._margin = {...start.margin};
  viz._padding = {...start.padding};
  viz._draw();
}

/**
    `viz._draw()`, placing chrome inside the chart's negative space when it
    fits (see the module docs). Leaves `viz._insetPlacement` set to what was
    placed, or null.
*/
export function drawWithInset(viz: VizInstance): void {
  viz._insetPlacement = null;
  const keys = typeof viz._insetRegion === "function" && insetEnabled(viz) ? insetCandidates(viz) : [];
  if (!keys.length) {
    viz._insetPending = null;
    viz._draw();
    return;
  }
  const start = {margin: {...viz._margin}, padding: {...viz._padding}};
  viz._insetPending = new Set(keys);
  viz._draw();

  const first = choose(viz, keys);
  const {showing} = first;
  let {placement} = first;
  if (!showing.length) return;
  if (placement && showing.some(k => k !== placement!.key)) {
    viz._insetPending = new Set([placement.key]);
    redraw(viz, start);
    placement = choose(viz, [placement.key]).placement;
  }
  if (!placement) {
    viz._insetPending = new Set();
    redraw(viz, start);
    return;
  }
  viz._insetPlacement = placement;
  if (placement.key === "colorScale") placeColorScaleDom(viz);
}
