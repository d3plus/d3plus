/**
    `sankeyEmit` — link Paths + per-shape-type node groups (typically Rect).
    Emits flat SceneNodes directly (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {arrowEnds, arrowNode} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import {
  drawNodeLabel,
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";

interface SankeyLink {
  source: SankeyNode;
  target: SankeyNode;
  value: number;
  // Added by d3-sankey: link thickness + per-end y-centers.
  width?: number;
  y0?: number;
  y1?: number;
}
type SankeyNode = DataPoint & {
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
interface SankeyCtx {
  links: SankeyLink[];
  nodeGroups: [string, SankeyNode[]][];
  pathFn: (d: SankeyLink) => string;
}

export const sankeyEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.sankeyCtx as SankeyCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = [];

  // Sankey's link config is the raw `viz.schema.shapeConfig.Path` (no
  // configPrep wrap) because links are raw `{source, target, value}`
  // records — not d3plus-wrapped.
  const linkConfig = ((viz.schema.shapeConfig as Record<string, unknown> | undefined)?.Path ?? {}) as Record<string, unknown>;
  if (c.links && c.links.length) {
    for (let i = 0; i < c.links.length; i++) {
      const link = c.links[i];
      const datum = link as unknown as DataPoint;
      const paint = paintFromShapeConfig(linkConfig, datum, i);
      out.push({
        type: "path",
        shapeType: "Link",
        key: `sankey-link-${(link.source.id ?? "")}-${(link.target.id ?? "")}`,
        d: c.pathFn(link),
        datum,
        paint,
        aria: {
          label: `${drawNodeLabel(viz, link.source, 0)} to ${drawNodeLabel(viz, link.target, 0)}, ${link.value}.`,
        },
      } as SceneNode);

      // Optional directional arrowheads. Flow runs source(left) → target(right):
      // the target arrow points right into the target, the source arrow points
      // left into the source (bidirectional when both are set).
      const ends = arrowEnds(viz.schema.arrows as ArrowValue, datum, i);
      if (ends.source || ends.target) {
        const width = typeof link.width === "number" ? link.width : 2;
        const sizeCfg = resolveAccessor<number>(viz.schema.arrowSize, datum, i);
        const size = typeof sizeCfg === "number" ? sizeCfg : Math.max(8, Math.min(width, 28));
        const fill = typeof paint.stroke === "string" ? paint.stroke : undefined;
        if (ends.target && typeof link.y1 === "number") {
          out.push(arrowNode({key: `sankey-arrow-t-${link.source.id}-${link.target.id}`, datum, x: link.target.x0, y: link.y1, angle: 0, size, fill, opacity: 1}));
        }
        if (ends.source && typeof link.y0 === "number") {
          out.push(arrowNode({key: `sankey-arrow-s-${link.source.id}-${link.target.id}`, datum, x: link.source.x1, y: link.y0, angle: Math.PI, size, fill, opacity: 1}));
        }
      }
    }
  }

  if (c.nodeGroups && c.nodeGroups.length) {
    for (const [shapeKind, values] of c.nodeGroups) {
      if (!values.length) continue;
      const cfg = shapeConfigFor(viz, shapeKind);
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
    }
  }

  return out;
};
