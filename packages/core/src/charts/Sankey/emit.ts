/**
    `sankeyEmit` — link Paths + per-shape-type node groups (typically Rect).
    Emits flat SceneNodes directly (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import {arrowEnds, arrowTrim, trimCubic} from "../features/edgeArrows.js";
import {
  arrowAlongChord,
  chordArrowNodes,
  cubicArrowEdge,
} from "../features/curvedArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import type {ArrowedEnd} from "../features/curvedArrows.js";
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
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {circularLinkAnchor, circularRibbonD} from "./circularLinks.js";
import type {CircularShape} from "./circularLinks.js";
import {sankeyLabels} from "./labels.js";
import type {SankeyLabelHeads} from "./labels.js";
import {arrowedRibbonD, bandRibbonD} from "./ribbons.js";
import type {Point} from "./ribbons.js";

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
    A link's arrowhead size: `arrowSize`, else its band's width, kept
    between 8 and 28.
    @param width The band's width.
*/
export function sankeyArrowSize(
  viz: VizInstance,
  width: number | undefined,
  datum: DataPoint,
  i: number,
): number {
  if (typeof width !== "number") width = 2;
  const sizeCfg = resolveAccessor<number>(viz.schema.arrowSize, datum, i);
  return typeof sizeCfg === "number"
    ? sizeCfg
    : Math.max(8, Math.min(width, 28));
}

/**
    A band's thickness: its layout width less a pixel each side, so
    neighboring bands show a gap, and at least 1.
*/
export function sankeyBandThickness(link: {width?: number}): number {
  const width = typeof link.width === "number" ? link.width : 0;
  return Math.max(1, width - 2);
}

/** A link's full band as a filled ribbon, `half` its thickness each side of its center line. */
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
    A link's arrowed ends and visible ribbon: the band follows its center
    line up to each head's base, then runs along the head's axis to end
    square inside it. The tips sit on the nodes' edges, where the band
    ends. Null when the link has no arrows.
*/
function sankeyArrowEdge(
  viz: VizInstance,
  link: SankeyLink,
  i: number,
  thickness: number,
): {d: string; source?: ArrowedEnd; target?: ArrowedEnd; size: number} | null {
  const ends = arrowEnds(viz.schema.arrows as ArrowValue, link.datum, i);
  if (!ends.source && !ends.target) return null;
  if (typeof link.y0 !== "number" || typeof link.y1 !== "number") return null;
  const size = sankeyArrowSize(viz, link.width, link.datum, i);
  const trim = arrowTrim(size, thickness);
  if (link.circular)
    return {
      ...circularArrowEdge(link.circular, size, trim, ends, thickness / 2),
      size,
    };
  const x0 = link.source.x1;
  const x1 = link.target.x0;
  const xm = (x0 + x1) / 2;
  const curve: [Point, Point, Point, Point] = [
    [x0, link.y0],
    [xm, link.y0],
    [xm, link.y1],
    [x1, link.y1],
  ];
  const {source, target} = cubicArrowEdge(curve, {
    ends,
    size,
    source: ends.source ? trim : 0,
    target: ends.target ? trim : 0,
  });
  const body = trimCubic(curve, source ? size : 0, target ? size : 0);
  return {
    d: arrowedRibbonD(body, thickness / 2, source, target),
    source,
    target,
    size,
  };
}

/**
    A circular link's arrowed ends and visible ribbon: each head lies along
    the band's straight end at its node, its tip on the node's edge, and the
    ribbon ends square inside each head.
    @param half Half the band's thickness.
*/
export function circularArrowEdge(
  shape: CircularShape,
  size: number,
  trim: number,
  ends: {source: boolean; target: boolean},
  half: number,
): {d: string; source?: ArrowedEnd; target?: ArrowedEnd} {
  const target = ends.target
    ? arrowAlongChord([shape.xt, shape.ty], [shape.xt - size, shape.ty], trim)
    : undefined;
  const source = ends.source
    ? arrowAlongChord([shape.xs, shape.sy], [shape.xs + size, shape.sy], trim)
    : undefined;
  const d = circularRibbonD(
    shape,
    half,
    source ? source.cut[0] - shape.xs : 0,
    target ? shape.xt - target.cut[0] : 0,
  );
  return {d, source, target};
}

/**
    A link's visible band: its ribbon, cut short inside its arrowheads (see
    `sankeyArrowEdge`). The full ribbon stays its hit area.
    @param thickness The band's thickness (see `sankeyBandThickness`).
*/
export function sankeyVisibleD(
  viz: VizInstance,
  link: SankeyLink,
  i: number,
  thickness: number,
): string {
  return (
    sankeyArrowEdge(viz, link, i, thickness)?.d ??
    sankeyRibbonD(link, thickness / 2)
  );
}

/**
    Optional directional arrowheads for one link, aimed along the band's
    chord from each head's base to its tip: the target arrow points into the
    target, the source arrow back into the source.
*/
function emitSankeyArrows(
  viz: VizInstance,
  link: SankeyLink,
  datum: DataPoint,
  i: number,
  paint: Paint,
  thickness: number,
): SceneNode[] {
  const edge = sankeyArrowEdge(viz, link, i, thickness);
  if (!edge) return [];
  const ids = `${link.source.id}-${link.target.id}`;
  return chordArrowNodes({
    ends: edge,
    size: edge.size,
    datum,
    keyPrefix: "sankey-arrow",
    keys: {source: `sankey-arrow-s-${ids}`, target: `sankey-arrow-t-${ids}`},
    fill: typeof paint.fill === "string" ? paint.fill : undefined,
    opacity: 1,
  });
}

/** A link's scene key. */
const sankeyLinkKey = (link: SankeyLink): string =>
  `sankey-link-${link.source.id ?? ""}-${link.target.id ?? ""}`;

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

/** The link labels, centered on their bands, clear of every node. */
function sankeyLinkLabels(
  viz: VizInstance,
  c: SankeyCtx,
  nodeLabels: readonly SceneNode[],
): SceneNode[] {
  return emitLinkLabels(
    viz,
    c.links.map((link, i) => ({
      key: sankeyLinkKey(link),
      link,
      i,
      anchor: sankeyLinkAnchor(link),
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

/**
    How long the arrowheads at each node's sides are (see `SankeyLabelHeads`).
*/
export function sankeyHeads(
  viz: VizInstance,
  c: Pick<SankeyCtx, "links">,
): SankeyLabelHeads {
  const into = new Map<unknown, number>();
  const out = new Map<unknown, number>();
  const longest = (map: Map<unknown, number>, key: unknown, size: number) =>
    map.set(key, Math.max(map.get(key) ?? 0, size));
  for (const link of c.links ?? []) {
    const i = linkMeta(link.datum)?.index ?? 0;
    const edge = sankeyArrowEdge(viz, link, i, sankeyBandThickness(link));
    if (edge?.target) longest(into, link.target.id, edge.size);
    if (edge?.source) longest(out, link.source.id, edge.size);
  }
  return {
    into: d => into.get(d.id) ?? 0,
    out: d => out.get(d.id) ?? 0,
    maxInto: Math.max(0, ...into.values()),
    maxOut: Math.max(0, ...out.values()),
  };
}

/** The nodes, their background images and their labels, and the labels on their own. */
function emitSankeyNodes(
  viz: VizInstance,
  c: SankeyCtx,
  heads: SankeyLabelHeads,
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
    const own = sankeyLabels(viz, values, cfg, c.width, c.height, heads);
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
  if (c.links && c.links.length) {
    const linkColor = linkColorResolver(viz);
    for (const link of c.links) {
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
      const key = sankeyLinkKey(link);
      out.push({
        type: "path",
        shapeType: "Link",
        key,
        d: sankeyVisibleD(viz, link, i, thickness),
        datum,
        index: i,
        paint,
        aria: {label: linkAriaLabel(viz, datum)},
      } as SceneNode);
      // The full ribbon, a few pixels wider, so thin bands are easy to point at.
      out.push({
        ...linkHitPath(key, sankeyRibbonD(link, thickness / 2), datum, 0),
        paint: {
          fill: "transparent",
          stroke: "transparent",
          strokeWidth: LINK_HIT_WIDTH,
        },
        shapeType: "Link",
      } as SceneNode);

      out.push(...emitSankeyArrows(viz, link, datum, i, paint, thickness));
    }
  }
  const nodes = emitSankeyNodes(viz, c, sankeyHeads(viz, c));
  if (c.links && c.links.length)
    out.push(...sankeyLinkLabels(viz, c, nodes.labels));
  out.push(...nodes.out);
  return out;
};
