/**
    `networkEmit` — link Paths + per-shape-type node groups. Emits flat
    SceneNodes directly (no transient Shape compute pass).
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {paintFromShapeConfig, resolveAccessor, shapeConfigFor} from "../emitHelpers.js";
import type {ChartEmit} from "../ChartDefinition.js";

interface NetworkLink {
  source: DataPoint & {x: number; y: number};
  target: DataPoint & {x: number; y: number};
  size?: number;
}
type NetworkNode = DataPoint & {
  __d3plus__?: true;
  data?: DataPoint;
  i?: number;
  id: string;
  shape: string;
  x: number;
  y: number;
  r: number;
  width?: number;
  height?: number;
};
interface NetworkCtx {
  links: NetworkLink[];
  linkConfig: Record<string, unknown>;
  linkD: (d: NetworkLink) => string;
  nodeGroups: [string, NetworkNode[]][];
  nodeShapeConfig: Record<string, unknown>;
}

export const networkEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.networkCtx as NetworkCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = [];

  if (c.links && c.links.length) {
    for (let i = 0; i < c.links.length; i++) {
      const link = c.links[i];
      const datum = link as unknown as DataPoint;
      const paint = paintFromShapeConfig(c.linkConfig, datum, i);
      // Link's strokeWidth comes from the layout-injected `d.size`.
      if (typeof link.size === "number") paint.strokeWidth = link.size;
      out.push({
        type: "path",
        key: `network-link-${(link.source as DataPoint).id ?? ""}-${(link.target as DataPoint).id ?? ""}-${i}`,
        d: c.linkD(link),
        datum,
        paint,
      } as SceneNode);
    }
  }

  if (c.nodeGroups && c.nodeGroups.length) {
    for (const [shapeKind, values] of c.nodeGroups) {
      if (!values.length) continue;
      const vizCfg = shapeConfigFor(viz, shapeKind);
      const merged = {...vizCfg, ...c.nodeShapeConfig};

      for (let i = 0; i < values.length; i++) {
        const d = values[i];
        const datum = (d.data ?? d) as DataPoint;
        const paint = paintFromShapeConfig(merged, datum, d.i ?? i);
        if (shapeKind === "Circle") {
          out.push({
            type: "circle",
            key: `network-${shapeKind}-${d.id}`,
            cx: d.x,
            cy: d.y,
            r: d.r,
            datum,
            paint,
          } as SceneNode);
        } else if (shapeKind === "Rect") {
          const w = Number(d.width ?? resolveAccessor<number>(merged.width, datum, d.i ?? i) ?? 0);
          const h = Number(d.height ?? resolveAccessor<number>(merged.height, datum, d.i ?? i) ?? 0);
          out.push({
            type: "rect",
            key: `network-${shapeKind}-${d.id}`,
            x: d.x - w / 2,
            y: d.y - h / 2,
            width: w,
            height: h,
            datum,
            paint,
          } as SceneNode);
        }
        // Other shape kinds: skipped (Network's default is Circle).
      }

      // Labels via the chart-specific label fn. labelBounds is the
      // shape's aes (r for circles, width/height for rects).
      const labelFn = c.nodeShapeConfig.label as ((d: NetworkNode, i: number) => unknown) | undefined;
      if (labelFn) {
        const labelNodes = emitLabels({
          data: values as DataPoint[],
          label: (d, i) => labelFn(d as NetworkNode, i),
          x: d => (d as NetworkNode).x,
          y: d => (d as NetworkNode).y,
          aes: d => {
            const n = d as NetworkNode;
            if (shapeKind === "Circle") return {r: n.r, width: n.r * 2, height: n.r * 2};
            return {width: n.width ?? 0, height: n.height ?? 0};
          },
          rotate: constant(0),
          id: d => `network-label-${(d as NetworkNode).id}`,
          labelBounds: (_d, _i, aes) => {
            const a = aes as {r?: number; width?: number; height?: number};
            if (shapeKind === "Circle") {
              const r = a.r ?? 0;
              return {width: r * 1.5, height: r * 1.5, x: -r * 0.75, y: -r * 0.75};
            }
            const w = a.width ?? 0;
            const h = a.height ?? 0;
            return {width: w, height: h, x: -w / 2, y: -h / 2};
          },
          labelConfig: {
            ...((merged.labelConfig as Record<string, unknown>) ?? {fontResize: true}),
            fontColor: (d: {data?: NetworkNode}) => {
              const node = (d.data ?? d) as NetworkNode;
              const fill = resolveAccessor<string>(
                merged.fill,
                (node.data ?? node) as DataPoint,
                node.i ?? 0,
              );
              return colorContrast(typeof fill === "string" ? fill : "rgb(255, 255, 255)");
            },
          },
        });
        out.push(...labelNodes);
      }
    }
  }

  return out;
};
