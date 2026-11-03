/**
    `sankeyEmit` — link Paths + per-shape-type node groups (typically Rect).
    Emits flat SceneNodes directly (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import {arrowEnds, arrowTrim} from "../features/edgeArrows.js";
import {
  arrowAlongChord,
  chordArrowNodes,
  chordEndsPathD,
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
  linkAriaLabel,
  linkHitPath,
  linkMeta,
} from "../features/linkInteraction.js";
import type {LinkDatum} from "../features/linkInteraction.js";
import {linkColorResolver} from "../features/linkColor.js";
import type {LinkEnds} from "../features/linkColor.js";
import {cubicMidpoint} from "../features/linkLabelGeometry.js";
import type {LinkAnchor} from "../features/linkLabelGeometry.js";
import {emitLinkLabels} from "../features/linkLabels.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {circularLinkAnchor, circularLinkD} from "./circularLinks.js";
import type {CircularShape} from "./circularLinks.js";
import {sankeyLabels} from "./labels.js";

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
  pathFn: (d: SankeyLink) => string;
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
    A link's arrowed ends and visible band (see `cubicArrowEdge`): the band
    follows its horizontal link curve up to each head's base, then runs
    along the head's axis to end inside it. The tips sit on the nodes'
    edges, where the band ends. Null when the link has no arrows.
*/
function sankeyArrowEdge(
  viz: VizInstance,
  link: SankeyLink,
  i: number,
  strokeWidth: unknown,
): (ReturnType<typeof cubicArrowEdge> & {size: number}) | null {
  const ends = arrowEnds(viz.schema.arrows as ArrowValue, link.datum, i);
  if (!ends.source && !ends.target) return null;
  if (typeof link.y0 !== "number" || typeof link.y1 !== "number") return null;
  const size = sankeyArrowSize(viz, link.width, link.datum, i);
  const trim = arrowTrim(
    size,
    typeof strokeWidth === "number" ? strokeWidth : 1,
  );
  if (link.circular)
    return {...circularArrowEdge(link.circular, size, trim, ends), size};
  const x0 = link.source.x1;
  const x1 = link.target.x0;
  const xm = (x0 + x1) / 2;
  const edge = cubicArrowEdge(
    [
      [x0, link.y0],
      [xm, link.y0],
      [xm, link.y1],
      [x1, link.y1],
    ],
    {
      ends,
      size,
      source: ends.source ? trim : 0,
      target: ends.target ? trim : 0,
    },
  );
  return {...edge, size};
}

/**
    A circular link's arrowed ends and visible band: each head lies along
    the band's straight end at its node, its tip on the node's edge, and the
    band runs between the heads' bases, then on to end inside each head.
*/
export function circularArrowEdge(
  shape: CircularShape,
  size: number,
  trim: number,
  ends: {source: boolean; target: boolean},
): {d: string; source?: ArrowedEnd; target?: ArrowedEnd} {
  const target = ends.target
    ? arrowAlongChord([shape.xt, shape.ty], [shape.xt - size, shape.ty], trim)
    : undefined;
  const source = ends.source
    ? arrowAlongChord([shape.xs, shape.sy], [shape.xs + size, shape.sy], trim)
    : undefined;
  const body = circularLinkD(shape, source ? size : 0, target ? size : 0);
  return {d: chordEndsPathD(body, source, target), source, target};
}

/** A link's visible band: `d`, or cut short inside its arrowheads (see `sankeyArrowEdge`). The full band stays its hit area. */
export function sankeyVisibleD(
  viz: VizInstance,
  link: SankeyLink,
  i: number,
  strokeWidth: unknown,
  d: string,
): string {
  return sankeyArrowEdge(viz, link, i, strokeWidth)?.d ?? d;
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
): SceneNode[] {
  const edge = sankeyArrowEdge(viz, link, i, paint.strokeWidth);
  if (!edge) return [];
  const ids = `${link.source.id}-${link.target.id}`;
  return chordArrowNodes({
    ends: edge,
    size: edge.size,
    datum,
    keyPrefix: "sankey-arrow",
    keys: {source: `sankey-arrow-s-${ids}`, target: `sankey-arrow-t-${ids}`},
    fill: typeof paint.stroke === "string" ? paint.stroke : undefined,
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
function sankeyLinkLabels(viz: VizInstance, c: SankeyCtx): SceneNode[] {
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
    },
  );
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
      const stroke = linkColor(datum, link as unknown as LinkEnds);
      if (stroke) {
        // A colored band is see-through, so the flows it crosses show.
        paint.stroke = stroke;
        paint.strokeOpacity =
          resolveAccessor<number>(linkConfig.strokeOpacity, datum, i) ?? 0.5;
      }
      const key = sankeyLinkKey(link);
      const d = link.circular ? circularLinkD(link.circular) : c.pathFn(link);
      out.push({
        type: "path",
        shapeType: "Link",
        key,
        d: sankeyVisibleD(viz, link, i, paint.strokeWidth, d),
        datum,
        index: i,
        paint,
        aria: {label: linkAriaLabel(viz, datum)},
      } as SceneNode);
      out.push({
        ...linkHitPath(key, d, datum, paint.strokeWidth),
        shapeType: "Link",
      } as SceneNode);

      out.push(...emitSankeyArrows(viz, link, datum, i, paint));
    }
    out.push(...sankeyLinkLabels(viz, c));
  }

  if (c.nodeGroups && c.nodeGroups.length) {
    for (const [shapeKind, values] of c.nodeGroups) {
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
          const r = Number(
            resolveAccessor<number>(cfg.r, datum, d.i ?? i) ?? 0,
          );
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
      out.push(...sankeyLabels(viz, values, cfg, c.width, c.height));
    }
  }

  return out;
};
