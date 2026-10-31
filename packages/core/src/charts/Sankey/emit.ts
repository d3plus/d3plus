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
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import {
  linkAriaLabel,
  linkHitPath,
  linkMeta,
} from "../features/linkInteraction.js";
import type {LinkDatum} from "../features/linkInteraction.js";
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
  paint: ReturnType<typeof paintFromShapeConfig>,
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
    for (const link of c.links) {
      const datum = link.datum;
      const i = linkMeta(datum)?.index ?? 0;
      const paint = paintFromShapeConfig(linkConfig, datum, i);
      const key = `sankey-link-${link.source.id ?? ""}-${link.target.id ?? ""}`;
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
