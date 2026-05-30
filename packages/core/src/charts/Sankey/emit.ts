/**
    `sankeyEmit` — link Paths + per-shape-type node groups (typically Rect).
    Emits flat SceneNodes directly (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../emitHelpers.js";
import type {ChartEmit} from "../ChartDefinition.js";

interface SankeyLink {
  source: SankeyNode;
  target: SankeyNode;
  value: number;
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
      const paint = paintFromShapeConfig(linkConfig, link as unknown as DataPoint, i);
      out.push({
        type: "path",
        key: `sankey-link-${(link.source.id ?? "")}-${(link.target.id ?? "")}`,
        d: c.pathFn(link),
        datum: link as unknown as DataPoint,
        paint,
      } as SceneNode);
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
          } as SceneNode);
        }
        // Other shape kinds: skipped (Sankey's default is Rect).
      }
    }
  }

  return out;
};
