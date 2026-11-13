/**
    `arcDiagramEmit` — ArcDiagram's scene: the arcs (longest first), a wider
    transparent hit path over each so thin arcs are easy to point at, their
    arrowheads, the nodes, and the node labels.
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {
  edgeArrowTrims,
  emphasizedArrowEdge,
  scaledArrowSize,
  scaledStrokeWidth,
} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import {paintFromShapeConfig, shapeConfigFor} from "../features/emitHelpers.js";
import {linkAriaLabel, linkHitPath} from "../features/linkInteraction.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {ArcCtx, ArcLink, ArcNode} from "./applyLayout.js";
import {linkColorResolver} from "../features/linkColor.js";
import type {LinkAnchor} from "../features/linkLabelGeometry.js";
import {emitLinkLabels} from "../features/linkLabels.js";
import {curvePoints, trimToNodes} from "../features/linkLabelPath.js";
import {arcApex, arcArrowEdge, arcPathD, arcPoint} from "./arcGeometry.js";
import {outlineReach} from "../features/nodeOutline.js";
import {chordArrowNodes} from "../features/curvedArrows.js";
import {emitArcLabels} from "./arcLabels.js";
import {selfLoopArrows, selfLoopD} from "../features/selfLoops.js";

/** A node's paint, from the node shape's config. */
function nodePaint(config: Record<string, unknown>, n: ArcNode): Paint {
  return paintFromShapeConfig(config, n.data, n.i);
}

/** Where an arc's label goes: its highest point (a loop's far point), running with the line. */
export function arcLabelAnchor(link: ArcLink): LinkAnchor {
  if (link.loop) return link.loop.apex;
  const [x, y] = arcApex(link.arc);
  return {x, y, angle: link.arc.orient === "vertical" ? Math.PI / 2 : 0};
}

/**
    The curve an arc's label follows: the arc between the edges of its two
    nodes, or the loop.
*/
export function arcLabelPath(link: ArcLink): [number, number][] {
  if (link.loop) return curvePoints(link.loop.d);
  return trimToNodes(
    curvePoints(arcPathD(link.arc)),
    link.source.r,
    link.target.r,
  );
}

/** The arc labels, at the top of each arc, clear of every node. */
function arcLinkLabels(viz: VizInstance, c: ArcCtx): SceneNode[] {
  return emitLinkLabels(
    viz,
    c.links.map((link, i) => ({
      key: arcLinkKey(link),
      link,
      i,
      anchor: arcLabelAnchor(link),
      path: arcLabelPath(link),
      priority: link.size,
    })),
    {circles: c.nodes.map(n => ({x: n.x, y: n.y, r: n.r}))},
  );
}

/** An arc's scene key. */
const arcLinkKey = (link: ArcLink): string =>
  `arc-link-${link.source.id}-${link.target.id}-${link.index}`;

/**
    Arrowheads at an arc's (or loop's) selected ends, each pointing along it
    into its node, sized for `scale` times its stroke (see
    `emphasizedArrowEdge`).
*/
function arcArrows(
  viz: VizInstance,
  link: ArcLink,
  stroke: string | undefined,
  key: string,
  scale = 1,
): SceneNode[] {
  const datum = link.datum;
  if (link.loop)
    return selfLoopArrows({
      arrows: viz.schema.arrows as ArrowValue,
      arrowSize: scaledArrowSize(viz.schema.arrowSize, scale),
      strokeWidth: scaledStrokeWidth(link.size, scale),
      datum,
      i: link.index,
      keyPrefix: key,
      fill: stroke,
      loop: link.loop,
    });
  const trims = arcTrims(viz, link, scale);
  if (!trims.ends.source && !trims.ends.target) return [];
  return chordArrowNodes({
    ends: arcArrowEdge(link.arc, trims, arcInsets(link)),
    size: trims.size,
    datum,
    keyPrefix: key,
    fill: stroke,
  });
}

/**
    An arc's (or loop's) visible stroke: along it up to each arrowhead's
    base, then along the head's axis to end inside it (see `arcArrowEdge`),
    whose tips sit a pixel out past the nodes, and from the outline of a
    node at an end with no head. `scale` widens the stroke (see
    `emphasizedArrowEdge`).
*/
export function arcVisibleD(
  viz: VizInstance,
  link: ArcLink,
  scale = 1,
): string {
  const trims = arcTrims(viz, link, scale);
  if (link.loop)
    return trims.source || trims.target ? selfLoopD(link.loop, trims) : link.d;
  return arcArrowEdge(
    link.arc,
    trims,
    arcInsets(link),
    arcOutlines(link, trims.strokeWidth),
  ).d;
}

/** An arc's arrow ends, size, and stroke trims, `scale` times as wide. */
const arcTrims = (viz: VizInstance, link: ArcLink, scale = 1) =>
  edgeArrowTrims({
    arrows: viz.schema.arrows as ArrowValue,
    arrowSize: scaledArrowSize(viz.schema.arrowSize, scale),
    strokeWidth: scaledStrokeWidth(link.size, scale),
    datum: link.datum,
    i: link.index,
  });

/**
    How far out from the line a stroke `strokeWidth` wide leaving each of an
    arc's nodes starts, to sit on the node's outline (see `outlineReach`):
    an arc leaves its node square to the line.
*/
const arcOutlines = (link: ArcLink, strokeWidth: number) => {
  const [x0, y0] = arcPoint(link.arc, link.arc.from, 0);
  const [x1, y1] = arcPoint(link.arc, link.arc.from, 1);
  const out = Math.atan2(y1 - y0, x1 - x0);
  return {
    source: outlineReach(link.source, out, strokeWidth),
    target: outlineReach(link.target, out, strokeWidth),
  };
};

/** How far out from the line each of an arc's arrow tips sits: a pixel past its node. */
const arcInsets = (link: ArcLink) => ({
  source: link.source.r + 1,
  target: link.target.r + 1,
});

/** The arcs, their hit paths, and their arrowheads. */
function emitArcs(viz: VizInstance, c: ArcCtx): SceneNode[] {
  const linkColor = linkColorResolver(viz);
  const arcs: SceneNode[] = [];
  const hits: SceneNode[] = [];
  const arrows: SceneNode[] = [];
  for (const link of c.links) {
    const datum = link.datum;
    const paint = paintFromShapeConfig(c.linkConfig, datum, link.index);
    paint.fill = "none";
    paint.strokeWidth = link.size;
    const stroke = linkColor(datum, link);
    if (stroke) paint.stroke = stroke;
    const key = arcLinkKey(link);
    const fill = typeof paint.stroke === "string" ? paint.stroke : undefined;
    const arrowKey = `arc-arrow-${link.source.id}-${link.target.id}-${link.index}`;
    const edge = emphasizedArrowEdge(scale => ({
      d: arcVisibleD(viz, link, scale),
      arrows: arcArrows(viz, link, fill, arrowKey, scale),
    }));
    arcs.push({
      type: "path",
      key,
      d: edge.d,
      ...(edge.emphasis ? {emphasis: edge.emphasis} : {}),
      datum,
      index: link.index,
      paint,
      aria: {label: linkAriaLabel(viz, datum)},
    } as SceneNode);
    hits.push(linkHitPath(key, link.d, datum, link.size) as SceneNode);
    arrows.push(...edge.arrows);
  }
  return [...arcs, ...hits, ...arrows, ...arcLinkLabels(viz, c)];
}

/** One node's Circle (or Rect, with `shape: "Rect"`). */
function nodeMark(
  viz: VizInstance,
  n: ArcNode,
  config: Record<string, unknown>,
): SceneNode {
  const paint = nodePaint(config, n);
  // Nodes keep a constant screen stroke as the chart zooms.
  if (paint.vectorEffect === undefined)
    paint.vectorEffect = "non-scaling-stroke";
  const sizeFn = viz._size as
    ((d: DataPoint, i: number) => unknown) | undefined;
  const sized = sizeFn ? `, ${sizeFn(n.data, n.i)}` : "";
  const base = {
    datum: n.data,
    index: n.i,
    paint,
    aria: {label: `${n.label}${sized}.`},
  };
  if (n.shape === "Rect") {
    const side = n.r * 2;
    return {
      type: "rect",
      key: `arc-node-${n.id}`,
      x: n.x - n.r,
      y: n.y - n.r,
      width: side,
      height: side,
      ...base,
    };
  }
  return {
    type: "circle",
    key: `arc-node-${n.id}`,
    cx: n.x,
    cy: n.y,
    r: n.r,
    ...base,
  };
}

export const arcDiagramEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.arcCtx as ArcCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = emitArcs(viz, c);
  const images: SceneNode[] = [];
  for (const n of c.nodes) {
    const config = shapeConfigFor(viz, n.shape === "Rect" ? "Rect" : "Circle");
    const node = nodeMark(viz, n, config);
    out.push(node);
    const image = backgroundImageNode(config, node, n.data, n.i);
    if (image) images.push(image);
  }
  out.push(...images, ...emitArcLabels(viz, c.labels, c.labelHalo));
  return out;
};
