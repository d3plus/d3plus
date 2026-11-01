/**
    `sankeyEmit` — link Paths + per-shape-type node groups (typically Rect).
    Emits flat SceneNodes directly (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import {arrowEnds, arrowNode} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
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
    Optional directional arrowheads for one link. Flow runs source(left) →
    target(right): the target arrow points right into the target, the source
    arrow points left into the source (bidirectional when both are set).
*/
function emitSankeyArrows(
  viz: VizInstance,
  link: SankeyLink,
  datum: DataPoint,
  i: number,
  paint: Paint,
): SceneNode[] {
  const arrows: SceneNode[] = [];
  const ends = arrowEnds(viz.schema.arrows as ArrowValue, datum, i);
  if (ends.source || ends.target) {
    const width = typeof link.width === "number" ? link.width : 2;
    const sizeCfg = resolveAccessor<number>(viz.schema.arrowSize, datum, i);
    const size =
      typeof sizeCfg === "number" ? sizeCfg : Math.max(8, Math.min(width, 28));
    const fill = typeof paint.stroke === "string" ? paint.stroke : undefined;
    if (ends.target && typeof link.y1 === "number") {
      arrows.push(
        arrowNode({
          key: `sankey-arrow-t-${link.source.id}-${link.target.id}`,
          datum,
          x: link.target.x0,
          y: link.y1,
          angle: 0,
          size,
          fill,
          opacity: 1,
        }),
      );
    }
    if (ends.source && typeof link.y0 === "number") {
      arrows.push(
        arrowNode({
          key: `sankey-arrow-s-${link.source.id}-${link.target.id}`,
          datum,
          x: link.source.x1,
          y: link.y0,
          angle: Math.PI,
          size,
          fill,
          opacity: 1,
        }),
      );
    }
  }
  return arrows;
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
      const d = c.pathFn(link);
      out.push({
        type: "path",
        shapeType: "Link",
        key,
        d,
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
