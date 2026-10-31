/**
    ArcDiagram's pointer handlers. Hovering a node highlights it, its
    neighbors, and the arcs between them; hovering an arc highlights it and
    its two ends. Clicking a node or arc focuses the same set and zooms to it
    (clicking it again, or the background, resets), and clicking a legend
    item focuses its nodes, as Network does.
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {graphNodeId, zoomToNodeBounds} from "../Network/graph.js";
import type {ArcCtx, ArcLink, ArcNode} from "./applyLayout.js";
import {arcBox} from "./arcGeometry.js";

type Predicate = (d: DataPoint, i: number) => boolean;
type Toggle = (predicate?: Predicate | false) => unknown;
/** The chart's hover and active setters. */
export type ArcViz = VizInstance & {hover: Toggle; active: Toggle};

/** Whether a row is one of ArcDiagram's links (it has resolved ends). */
export const isArcLink = (d: unknown): d is ArcLink =>
  !!d &&
  typeof d === "object" &&
  !!(d as ArcLink).source &&
  !!(d as ArcLink).target &&
  typeof (d as ArcLink).source === "object";

/**
    What hovering (or focusing) `d` highlights, and the box around it: for a
    node, it, its neighbors, and their arcs; for an arc, it and its two ends.
    Null when `d` is neither.
*/
export function arcFocus(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): {predicate: Predicate; box: [[number, number], [number, number]]} | null {
  const c = viz.ctx.arcCtx as ArcCtx | undefined;
  if (!c) return null;
  const nodeId = (h: DataPoint, hi: number) =>
    graphNodeId(viz, h as Record<string, unknown>, hi);
  let ids: Set<string>;
  let arcs: ArcLink[];
  let match: (l: ArcLink) => boolean;
  if (isArcLink(d)) {
    ids = new Set([d.source.id, d.target.id]);
    arcs = c.links.filter(l => l === d);
    match = l => l === d;
  } else {
    const id = nodeId(d, i);
    const lookup = viz.ctx.nodeLookup as Record<string, ArcNode> | undefined;
    if (!lookup || !lookup[id]) return null;
    match = l => l.source.id === id || l.target.id === id;
    arcs = c.links.filter(match);
    ids = new Set([id, ...arcs.flatMap(l => [l.source.id, l.target.id])]);
  }
  const predicate: Predicate = (h, hi) =>
    isArcLink(h) ? match(h) : ids.has(nodeId(h, hi));
  return {predicate, box: focusBox(c, ids, arcs)};
}

/** The box around a set of nodes and arcs. */
function focusBox(
  c: ArcCtx,
  ids: Set<string>,
  arcs: ArcLink[],
): [[number, number], [number, number]] {
  const boxes = c.nodes
    .filter(n => ids.has(n.id))
    .map(
      n =>
        [
          [n.x - n.r, n.y - n.r],
          [n.x + n.r, n.y + n.r],
        ] as [[number, number], [number, number]],
    )
    .concat(arcs.map(l => arcBox(l.arc)));
  return [
    [
      Math.min(...boxes.map(b => b[0][0])),
      Math.min(...boxes.map(b => b[0][1])),
    ],
    [
      Math.max(...boxes.map(b => b[1][0])),
      Math.max(...boxes.map(b => b[1][1])),
    ],
  ];
}

/** Zooms to a focus box. */
const zoomTo = (viz: VizInstance, box: [[number, number], [number, number]]) =>
  zoomToNodeBounds(viz, [box[0][0], box[1][0]], [box[0][1], box[1][1]]);

/** A stable id for a focused row, so a second click on it resets. */
const focusId = (viz: VizInstance, d: DataPoint, i: number): string =>
  isArcLink(d)
    ? `link:${d.index}`
    : graphNodeId(viz, d as Record<string, unknown>, i);

/** Installs ArcDiagram's hover, click, and legend-click handlers. */
export function setupArcEvents(viz: VizInstance): void {
  const v = viz as ArcViz;
  viz.schema.on.mouseenter = () => undefined;
  viz.schema.on["mouseleave.shape"] = () => {
    v.hover(false);
  };
  const defaultMouseMove = viz.schema.on["mousemove.shape"];
  viz.schema.on["mousemove.shape"] = (
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) => {
    defaultMouseMove(d, i, x, event);
    const focus = arcFocus(viz, d, i);
    if (focus) v.hover(focus.predicate);
  };

  viz.schema.on["click.shape"] = (d: DataPoint, i: number) => {
    viz._tooltipClass!.data([]).render();
    const id = focusId(viz, d, i);
    if (viz._focus !== undefined && viz._focus === id) {
      v.active(false);
      viz._focus = undefined;
      viz._zoomToBounds!(null);
      return;
    }
    const focus = arcFocus(viz, d, i);
    if (!focus) return;
    v.hover(false);
    v.active(focus.predicate);
    viz._focus = id;
    zoomTo(viz, focus.box);
  };

  viz.schema.on["click.legend"] = (d: DataPoint, i: number) => {
    const c = viz.ctx.arcCtx as ArcCtx | undefined;
    if (!c) return;
    const idList = viz._ids(d, i);
    const id = `legend:${idList[idList.length - 1]}`;
    if (viz._focus === id) {
      v.active(false);
      viz._focus = undefined;
      viz._zoomToBounds!(null);
      return;
    }
    // A legend item stands for every node whose row it groups.
    const key = (h: DataPoint, hi: number) => {
      const ids = viz._ids(h, hi);
      return `${ids[idList.length - 1]}`;
    };
    const want = `${idList[idList.length - 1]}`;
    const ids = new Set(
      c.nodes.filter(n => key(n.data, n.i) === want).map(n => n.id),
    );
    if (!ids.size) return;
    const arcs = c.links.filter(
      l => ids.has(l.source.id) && ids.has(l.target.id),
    );
    v.hover(false);
    v.active((h: DataPoint, hi: number) =>
      isArcLink(h) ? arcs.includes(h) : key(h, hi) === want,
    );
    viz._focus = id;
    zoomTo(viz, focusBox(c, ids, arcs));
  };
}
