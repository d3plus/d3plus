/**
    `arcDiagramEmit` — ArcDiagram's scene: the arcs (longest first), a wider
    transparent hit path over each so thin arcs are easy to point at, their
    arrowheads, the nodes, and the node labels.
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {arrowEnds, arrowNode, arrowSizeFor} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import {paintFromShapeConfig, shapeConfigFor} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {ArcCtx, ArcLink, ArcNode} from "./applyLayout.js";
import {arcEndTip} from "./arcGeometry.js";
import {emitArcLabels} from "./arcLabels.js";

/** The smallest stroke width an arc's hit path takes, in pixels. */
const HIT_WIDTH = 8;

/**
    A link's spoken label: "Source to Target." When link sizes vary, its
    `linkSize` value follows: "Source to Target, 4."
*/
export function arcAriaLabel(
  viz: VizInstance,
  link: ArcLink,
  sized: boolean,
): string {
  const size = viz.schema.linkSize as (d: DataPoint, i: number) => unknown;
  const value = sized ? size(link as unknown as DataPoint, link.index) : null;
  const suffix = typeof value === "number" ? `, ${value}` : "";
  return `${link.source.label} ${viz.schema.translate("to")} ${link.target.label}${suffix}.`;
}

/** A node's paint, from the node shape's config. */
function nodePaint(config: Record<string, unknown>, n: ArcNode): Paint {
  return paintFromShapeConfig(config, n.data, n.i);
}

/** The arc stroke `linkColor` picks: an end node's fill, or none (the link config's). */
function linkStroke(
  viz: VizInstance,
  link: ArcLink,
  nodeConfig: Record<string, unknown>,
): string | undefined {
  const pick = viz.schema.linkColor;
  const end =
    pick === "source" ? link.source : pick === "target" ? link.target : null;
  if (!end) return undefined;
  const fill = nodePaint(nodeConfig, end).fill;
  return typeof fill === "string" ? fill : undefined;
}

/** Arrowheads at an arc's selected ends, each pointing along the arc into its node. */
function arcArrows(
  viz: VizInstance,
  link: ArcLink,
  stroke: string | undefined,
  key: string,
): SceneNode[] {
  const datum = link as unknown as DataPoint;
  const ends = arrowEnds(viz.schema.arrows as ArrowValue, datum, link.index);
  if (!ends.source && !ends.target) return [];
  const size = arrowSizeFor(viz.schema.arrowSize, datum, link.index, link.size);
  const out: SceneNode[] = [];
  for (const end of ["target", "source"] as const) {
    if (!ends[end]) continue;
    const tip = arcEndTip(link.arc, end, link[end].r + 1);
    out.push(
      arrowNode({
        key: `${key}-${end === "target" ? "t" : "s"}`,
        datum,
        x: tip.x,
        y: tip.y,
        angle: tip.angle,
        size,
        fill: stroke,
      }),
    );
  }
  return out;
}

/** The arcs, their hit paths, and their arrowheads. */
function emitArcs(viz: VizInstance, c: ArcCtx): SceneNode[] {
  const nodeConfig = shapeConfigFor(viz, "Circle");
  const arcs: SceneNode[] = [];
  const hits: SceneNode[] = [];
  const arrows: SceneNode[] = [];
  const sized = new Set(c.links.map(l => l.size)).size > 1;
  for (const link of c.links) {
    const datum = link as unknown as DataPoint;
    const paint = paintFromShapeConfig(c.linkConfig, datum, link.index);
    paint.fill = "none";
    paint.strokeWidth = link.size;
    const stroke = linkStroke(viz, link, nodeConfig);
    if (stroke) paint.stroke = stroke;
    const key = `arc-link-${link.source.id}-${link.target.id}-${link.index}`;
    arcs.push({
      type: "path",
      key,
      d: link.d,
      datum,
      index: link.index,
      paint,
      aria: {label: arcAriaLabel(viz, link, sized)},
    } as SceneNode);
    hits.push({
      type: "path",
      key: `${key}::hit`,
      d: link.d,
      datum,
      index: link.index,
      paint: {
        fill: "none",
        stroke: "transparent",
        strokeWidth: Math.max(HIT_WIDTH, link.size + 4),
      },
    } as SceneNode);
    arrows.push(
      ...arcArrows(
        viz,
        link,
        typeof paint.stroke === "string" ? paint.stroke : undefined,
        `arc-arrow-${link.source.id}-${link.target.id}-${link.index}`,
      ),
    );
  }
  return [...arcs, ...hits, ...arrows];
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
  out.push(...images, ...emitArcLabels(viz, c.labels));
  return out;
};
