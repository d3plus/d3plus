/**
    Click focus for links on the node-link charts (Network, Rings, Sankey).
    Clicking a link (or pressing Enter on it) keeps it and its two ends
    bright and dims the rest, and a chart that zooms zooms to fit the two
    ends. Clicking the focused link again, or the chart's background, clears
    the focus.
*/

import type {DataPoint} from "@d3plus/data";

import {zoomToNodeBounds} from "../Network/graph.js";
import {surfaceOrigin} from "../viz/pointTooltipAnchor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {chartBounds} from "./chartGeometry.js";
import {linkHighlight, linkMeta} from "./linkInteraction.js";
import type {LinkDatum} from "./linkInteraction.js";

type NodeKey = (d: DataPoint, i: number) => string;
/** A box as `[[x0, y0], [x1, y1]]`. */
export type FocusBox = [[number, number], [number, number]];

/** The id a focused link sets on `viz._focus`. */
export function linkFocusId(d: LinkDatum): string {
  return `link:${linkMeta(d)?.index}`;
}

/**
    The box around a link's two ends, from the chart's laid-out nodes
    (`viz.ctx.nodeLookup` records with `x`, `y`, and `r`), or null when they
    aren't laid out that way.
*/
export function linkEndsBox(viz: VizInstance, d: LinkDatum): FocusBox | null {
  const meta = linkMeta(d);
  const lookup = viz.ctx.nodeLookup as Record<string, unknown> | undefined;
  if (!meta || !lookup) return null;
  const ends = [meta.source.id, meta.target.id].map(
    id => lookup[id] as {x?: unknown; y?: unknown; r?: unknown} | undefined,
  );
  const boxes: FocusBox[] = [];
  for (const n of ends) {
    if (!n || typeof n.x !== "number" || typeof n.y !== "number") return null;
    const r = typeof n.r === "number" ? n.r : 0;
    boxes.push([
      [n.x - r, n.y - r],
      [n.x + r, n.y + r],
    ]);
  }
  return [
    [
      Math.min(boxes[0][0][0], boxes[1][0][0]),
      Math.min(boxes[0][0][1], boxes[1][0][1]),
    ],
    [
      Math.max(boxes[0][1][0], boxes[1][1][0]),
      Math.max(boxes[0][1][1], boxes[1][1][1]),
    ],
  ];
}

/**
    Clears a click focus: the active marks, and the zoom where the chart
    zooms. Returns whether there was a focus to clear.
*/
export function clearLinkFocus(viz: VizInstance): boolean {
  if (viz._focus === undefined) return false;
  viz.active?.(false);
  viz._focus = undefined;
  viz._zoomToBounds?.(null);
  return true;
}

const boundSurfaces = new WeakSet<Element>();

/**
    Routes clicks on the chart's own outer `<svg>` (the empty space around an
    SVG scene, which only takes the pointer over what it paints) to
    `viz._backgroundClick`. Clicks on marks, on the chart's chrome, or on a
    zoom surface's background land on other elements and are left alone; the
    Canvas renderer reports its empty clicks itself.
*/
export function bindSvgBackgroundClick(viz: VizInstance): void {
  const outer = viz._select?.node?.() as Element | null | undefined;
  if (!outer || typeof outer.addEventListener !== "function") return;
  if (boundSurfaces.has(outer)) return;
  boundSurfaces.add(outer);
  outer.addEventListener("click", e => {
    if (e.target !== outer) return;
    const origin = surfaceOrigin(viz);
    const {clientX, clientY} = e as MouseEvent;
    viz._backgroundClick?.([clientX - origin.left, clientY - origin.top]);
  });
}

/**
    Focuses a clicked link: it and the nodes at its ends stay bright, the
    rest dims, and a chart that zooms zooms to `box`. Clicking the focused
    link again clears the focus. Rows that aren't recorded nodes (legend
    entries) match by `nodeKey`.
*/
export function focusLink(
  viz: VizInstance,
  d: LinkDatum,
  {nodeKey, box}: {nodeKey?: NodeKey; box?: FocusBox | null} = {},
): void {
  viz._tooltipClass?.data([]).render();
  const id = linkFocusId(d);
  if (viz._focus === id) {
    clearLinkFocus(viz);
    return;
  }
  viz.hover?.(false);
  viz.active?.(linkHighlight(viz, d, nodeKey));
  viz._focus = id;
  bindSvgBackgroundClick(viz);
  if (box && viz._zoomToBounds)
    zoomToNodeBounds(viz, [box[0][0], box[1][0]], [box[0][1], box[1][1]]);
}

/**
    Clears the chart's click focus when a click lands on no mark within its
    chart area (`viz._backgroundClick`, given the click's point on the
    chart's surface).
*/
export function installFocusBackgroundClick(viz: VizInstance): void {
  viz._backgroundClick = ([x, y]) => {
    const {width, height} = chartBounds(viz);
    const {left, top} = viz._margin;
    if (x >= left && x <= left + width && y >= top && y <= top + height)
      clearLinkFocus(viz);
  };
}
