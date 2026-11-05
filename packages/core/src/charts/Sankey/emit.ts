/**
    `sankeyEmit` — link Paths + per-shape-type node groups (typically Rect).
    Emits flat SceneNodes directly (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import {
  drawNodeLabel,
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import {
  LINK_HIT_WIDTH,
  linkAriaLabel,
  linkHitPath,
  linkMeta,
} from "../features/linkInteraction.js";
import type {LinkDatum} from "../features/linkInteraction.js";
import {linkColorResolver} from "../features/linkColor.js";
import type {LinkEnds} from "../features/linkColor.js";
import {cubicMidpoint} from "../features/linkLabelGeometry.js";
import type {LinkAnchor} from "../features/linkLabelGeometry.js";
import {emitLinkLabels, textLineBoxes} from "../features/linkLabels.js";
import {curvePoints} from "../features/linkLabelPath.js";
import {uniqueLinkKeys} from "../features/linkKeys.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {
  circularLinkAnchor,
  circularLinkD,
  circularRibbonD,
} from "./circularLinks.js";
import type {CircularShape} from "./circularLinks.js";
import {sankeyLabels} from "./labels.js";
import {bandRibbonD} from "./ribbons.js";

export interface SankeyLink {
  source: SankeyNode;
  target: SankeyNode;
  value: number;
  datum: LinkDatum;
  // Added by the layout: link thickness + per-end y-centers.
  width?: number;
  y0?: number;
  y1?: number;
  /** A link that loops back: its band's geometry (see `circularLinkShape`). */
  circular?: CircularShape;
}
export type SankeyNode = DataPoint & {
  __d3plus__?: true;
  data?: DataPoint;
  i?: number;
  id: string | number;
  shape: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};
export interface SankeyCtx {
  links: SankeyLink[];
  nodeGroups: [string, SankeyNode[]][];
  width: number;
  height: number;
}

/**
    A band's thickness: its layout width less a pixel each side, so
    neighboring bands show a gap, and at least 1.
*/
export function sankeyBandThickness(link: {width?: number}): number {
  const width = typeof link.width === "number" ? link.width : 0;
  return Math.max(1, width - 2);
}

/** A link's band as a filled ribbon from node to node, `half` its thickness each side of its center line. */
export function sankeyRibbonD(link: SankeyLink, half: number): string {
  if (link.circular) return circularRibbonD(link.circular, half);
  return bandRibbonD(
    link.source.x1,
    link.y0 ?? 0,
    link.target.x0,
    link.y1 ?? 0,
    half,
  );
}

/**
    Each link's key ids, `source-target`, unique across `links`: parallel
    links after the first add their order among them (see `uniqueLinkKeys`).
    A link's scene key is `sankey-link-${ids}`.
*/
export const sankeyLinkIds = (links: readonly SankeyLink[]): string[] =>
  uniqueLinkKeys(links.map(l => `${l.source.id ?? ""}-${l.target.id ?? ""}`));

/**
    Where a link's label goes: the middle of its band, which runs as a
    horizontal link curve from where it leaves its source to where it enters
    its target.
*/
export function sankeyLinkAnchor(link: SankeyLink): LinkAnchor | null {
  if (link.circular) return circularLinkAnchor(link.circular);
  if (typeof link.y0 !== "number" || typeof link.y1 !== "number") return null;
  const x0 = link.source.x1;
  const x1 = link.target.x0;
  const xm = (x0 + x1) / 2;
  return cubicMidpoint(
    [x0, link.y0],
    [xm, link.y0],
    [xm, link.y1],
    [x1, link.y1],
  );
}

/**
    The curve a link's label follows: its band's centerline, or a circular
    link's center line around its return lane.
*/
export function sankeyLinkPath(link: SankeyLink): [number, number][] | null {
  if (link.circular) return curvePoints(circularLinkD(link.circular));
  if (typeof link.y0 !== "number" || typeof link.y1 !== "number") return null;
  const x0 = link.source.x1;
  const x1 = link.target.x0;
  const xm = (x0 + x1) / 2;
  return curvePoints(
    `M${x0},${link.y0}C${xm},${link.y0} ${xm},${link.y1} ${x1},${link.y1}`,
  );
}

/** The link labels, centered on their bands, clear of every node. */
function sankeyLinkLabels(
  viz: VizInstance,
  c: SankeyCtx,
  nodeLabels: readonly SceneNode[],
  ids: readonly string[],
): SceneNode[] {
  return emitLinkLabels(
    viz,
    c.links.map((link, i) => ({
      key: `sankey-link-${ids[i]}`,
      link,
      i,
      anchor: sankeyLinkAnchor(link),
      path: sankeyLinkPath(link),
      priority: link.value,
    })),
    {
      boxes: c.nodeGroups.flatMap(([, values]) =>
        values.map(n => ({
          x: n.x0,
          y: n.y0,
          width: n.x1 - n.x0,
          height: n.y1 - n.y0,
        })),
      ),
      labels: textLineBoxes(nodeLabels),
    },
  );
}

/** The nodes, their background images and their labels, and the labels on their own. */
function emitSankeyNodes(
  viz: VizInstance,
  c: SankeyCtx,
): {out: SceneNode[]; labels: SceneNode[]} {
  const out: SceneNode[] = [];
  const labels: SceneNode[] = [];
  for (const [shapeKind, values] of c.nodeGroups ?? []) {
    if (!values.length) continue;
    const cfg = shapeConfigFor(viz, shapeKind);
    const start = out.length;
    for (let i = 0; i < values.length; i++) {
      const d = values[i];
      const datum = (d.data ?? d) as DataPoint;
      const paint = paintFromShapeConfig(cfg, datum, d.i ?? i);
      const aria = {label: `${drawNodeLabel(viz, d, i)}.`};
      if (shapeKind === "Rect") {
        out.push({
          type: "rect",
          key: `sankey-${shapeKind}-${d.id}`,
          x: d.x0,
          y: d.y0,
          width: d.x1 - d.x0,
          height: d.y1 - d.y0,
          datum,
          paint,
          aria,
        } as SceneNode);
      } else if (shapeKind === "Circle") {
        const r = Number(resolveAccessor<number>(cfg.r, datum, d.i ?? i) ?? 0);
        out.push({
          type: "circle",
          key: `sankey-${shapeKind}-${d.id}`,
          cx: (d.x0 + d.x1) / 2,
          cy: (d.y0 + d.y1) / 2,
          r,
          datum,
          paint,
          aria,
        } as SceneNode);
      }
      // Other shape kinds: skipped (Sankey's default is Rect).
    }
    out.push(
      ...backgroundImageNodes(cfg, out.slice(start), k => {
        const d = values[k];
        return [(d.data ?? d) as DataPoint, d.i ?? k];
      }),
    );
    const own = sankeyLabels(viz, values, cfg, c.width, c.height);
    labels.push(...own);
    out.push(...own);
  }
  return {out, labels};
}

export const sankeyEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.sankeyCtx as SankeyCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = [];

  // Sankey's link config is the raw `viz.schema.shapeConfig.Path` (no
  // configPrep wrap): each link's datum is a plain resolved link, not
  // d3plus-wrapped.
  const linkConfig = ((
    viz.schema.shapeConfig as Record<string, unknown> | undefined
  )?.Path ?? {}) as Record<string, unknown>;
  const ids = sankeyLinkIds(c.links ?? []);
  if (c.links && c.links.length) {
    const linkColor = linkColorResolver(viz);
    for (const [j, link] of c.links.entries()) {
      const datum = link.datum;
      const i = linkMeta(datum)?.index ?? 0;
      const paint: Paint = paintFromShapeConfig(linkConfig, datum, i);
      const color = linkColor(datum, link as unknown as LinkEnds);
      if (color) {
        // A colored band is see-through, so the flows it crosses show.
        paint.fill = color;
        paint.fillOpacity =
          resolveAccessor<number>(linkConfig.fillOpacity, datum, i) ?? 0.5;
      }
      const thickness = sankeyBandThickness(link);
      const key = `sankey-link-${ids[j]}`;
      out.push({
        type: "path",
        shapeType: "Link",
        key,
        d: sankeyRibbonD(link, thickness / 2),
        datum,
        index: i,
        paint,
        aria: {label: linkAriaLabel(viz, datum)},
      } as SceneNode);
      // The ribbon, a few pixels wider, so thin bands are easy to point at.
      out.push({
        ...linkHitPath(key, sankeyRibbonD(link, thickness / 2), datum, 0),
        paint: {
          fill: "transparent",
          stroke: "transparent",
          strokeWidth: LINK_HIT_WIDTH,
        },
        shapeType: "Link",
      } as SceneNode);
    }
  }
  const nodes = emitSankeyNodes(viz, c);
  if (c.links && c.links.length)
    out.push(...sankeyLinkLabels(viz, c, nodes.labels, ids));
  out.push(...nodes.out);
  return out;
};
