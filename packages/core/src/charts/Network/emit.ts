/**
    `networkEmit` — link Paths + per-shape-type node groups. Emits flat
    SceneNodes directly (no transient Shape compute pass).
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels, shapeLabelDefaults} from "../../shapes/emitLabels.js";
import {chartBounds} from "../features/chartGeometry.js";
import {
  emitOutsideLabels,
  insideFontMin,
  layoutCircleLabels,
  outsideLabels,
} from "../features/circleLabels.js";
import type {
  CircleLabelItem,
  CircleLabelLayout,
} from "../features/circleLabels.js";
import {straightEdgeArrows} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import {
  drawNodeLabel,
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";

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

/** Arrowheads for one network link (straight, center-to-center). */
function networkLinkArrows(
  viz: VizInstance,
  link: NetworkLink,
  datum: DataPoint,
  stroke: string | undefined,
  strokeWidth: number | undefined,
  i: number,
  keyPrefix: string,
): SceneNode[] {
  return straightEdgeArrows({
    arrows: viz.schema.arrows as ArrowValue,
    arrowSize: viz.schema.arrowSize,
    strokeWidth,
    datum,
    i,
    keyPrefix,
    fill: typeof stroke === "string" ? stroke : undefined,
    source: link.source as NetworkNode,
    target: link.target as NetworkNode,
  });
}

/** Link Paths, one per `c.links` entry — split out to keep `networkEmit` under the line budget. */
function emitNetworkLinks(viz: VizInstance, c: NetworkCtx): SceneNode[] {
  const out: SceneNode[] = [];
  for (let i = 0; i < c.links.length; i++) {
    const link = c.links[i];
    const datum = link as unknown as DataPoint;
    const paint = paintFromShapeConfig(c.linkConfig, datum, i);
    // Link's strokeWidth comes from the layout-injected `d.size`.
    if (typeof link.size === "number") paint.strokeWidth = link.size;
    const sizeLabel = typeof link.size === "number" ? `, ${link.size}` : "";
    const srcId = (link.source as DataPoint).id ?? "";
    const tgtId = (link.target as DataPoint).id ?? "";
    out.push({
      type: "path",
      key: `network-link-${srcId}-${tgtId}-${i}`,
      d: c.linkD(link),
      datum,
      paint,
      aria: {
        label: `${drawNodeLabel(viz, link.source, 0)} to ${drawNodeLabel(viz, link.target, 0)}${sizeLabel}.`,
      },
    } as SceneNode);

    // Optional directional arrowheads at the node boundary.
    out.push(
      ...networkLinkArrows(
        viz,
        link,
        datum,
        paint.stroke,
        paint.strokeWidth,
        i,
        `network-arrow-${srcId}-${tgtId}-${i}`,
      ),
    );
  }
  return out;
}

/** One node's Circle or Rect SceneNode, or null for any other shape kind. */
function networkNode(
  shapeKind: string,
  d: NetworkNode,
  merged: Record<string, unknown>,
  base: {datum: DataPoint; paint: Paint; aria: {label: string}},
  i: number,
): SceneNode | null {
  const key = `network-${shapeKind}-${d.id}`;
  if (shapeKind === "Circle")
    return {type: "circle", key, cx: d.x, cy: d.y, r: d.r, ...base};
  if (shapeKind === "Rect") {
    const w = Number(
      d.width ?? resolveAccessor<number>(merged.width, base.datum, i) ?? 0,
    );
    const h = Number(
      d.height ?? resolveAccessor<number>(merged.height, base.datum, i) ?? 0,
    );
    return {
      type: "rect",
      key,
      x: d.x - w / 2,
      y: d.y - h / 2,
      width: w,
      height: h,
      ...base,
    };
  }
  return null;
}

/** Places the Circle nodes' labels among every node (see `labelPosition`). */
function placeNetworkLabels(
  viz: VizInstance,
  c: NetworkCtx,
): Map<NetworkNode, CircleLabelLayout> {
  const labelFn = c.nodeShapeConfig.label as
    ((d: NetworkNode, i: number) => unknown) | undefined;
  const items: CircleLabelItem<NetworkNode>[] = [];
  for (const [shapeKind, values] of c.nodeGroups) {
    const circle = shapeKind === "Circle";
    const cfg = {...shapeConfigFor(viz, shapeKind), ...c.nodeShapeConfig};
    const labelConfig = (cfg.labelConfig ?? {}) as Record<string, unknown>;
    values.forEach((d, i) => {
      const datum = (d.data ?? d) as DataPoint;
      const index = d.i ?? i;
      // A Rect node is an obstacle the size of the circle around it.
      const r = circle
        ? d.r
        : Math.hypot(d.width ?? 0, d.height ?? 0) / 2 || d.r;
      items.push({
        key: d,
        datum,
        index,
        x: d.x,
        y: d.y,
        r,
        text: circle && labelFn ? labelFn(d, i) : undefined,
        inside: {
          width: d.r * 1.5,
          height: d.r * 1.5,
          padding: (resolveAccessor<number | string>(
            labelConfig.padding,
            datum,
            index,
          ) ?? shapeLabelDefaults.padding) as number | string,
          font: {
            family: resolveAccessor<string | string[]>(
              labelConfig.fontFamily,
              datum,
              index,
            ),
            weight: resolveAccessor<string | number>(
              labelConfig.fontWeight,
              datum,
              index,
            ),
          },
        },
      });
    });
  }
  const {width, height} = chartBounds(viz);
  return layoutCircleLabels(viz, items, {x: 0, y: 0, width, height});
}

/**
    One node group's labels: inside each node (the bounds are its shape's
    aes: a square within a circle, a rect's own box), or beside a Circle node
    where `labelPosition` moved it.
*/
function networkNodeLabels(
  viz: VizInstance,
  c: NetworkCtx,
  shapeKind: string,
  values: NetworkNode[],
  merged: Record<string, unknown>,
  placed: Map<NetworkNode, CircleLabelLayout>,
): SceneNode[] {
  const labelFn = c.nodeShapeConfig.label as
    ((d: NetworkNode, i: number) => unknown) | undefined;
  if (!labelFn) return [];
  const circle = shapeKind === "Circle";
  const inside = (d: NetworkNode): boolean => {
    const p = placed.get(d);
    return !p || p.position === "inside";
  };
  const baseConfig = (merged.labelConfig as Record<string, unknown>) ?? {
    fontResize: true,
  };
  const userConfig = userLabelConfig(viz, shapeKind);
  const fontMin = userConfig.fontMin ?? baseConfig.fontMin;
  const labelNodes = emitLabels({
    data: values as DataPoint[],
    label: (d, i) =>
      inside(d as NetworkNode) ? labelFn(d as NetworkNode, i) : false,
    x: d => (d as NetworkNode).x,
    y: d => (d as NetworkNode).y,
    aes: d => {
      const n = d as NetworkNode;
      if (circle) return {r: n.r, width: n.r * 2, height: n.r * 2};
      return {width: n.width ?? 0, height: n.height ?? 0};
    },
    rotate: constant(0),
    id: d => `network-label-${(d as NetworkNode).id}`,
    labelBounds: (_d, _i, aes) => {
      const a = aes as {r?: number; width?: number; height?: number};
      if (circle) {
        const r = a.r ?? 0;
        return {width: r * 1.5, height: r * 1.5, x: -r * 0.75, y: -r * 0.75};
      }
      const w = a.width ?? 0;
      const h = a.height ?? 0;
      return {width: w, height: h, x: -w / 2, y: -h / 2};
    },
    labelConfig: {
      ...baseConfig,
      fontColor: (d: {data?: NetworkNode}) => {
        const node = (d.data ?? d) as NetworkNode;
        const fill = resolveAccessor<string>(
          merged.fill,
          (node.data ?? node) as DataPoint,
          node.i ?? 0,
        );
        return colorContrast(
          typeof fill === "string" ? fill : "rgb(255, 255, 255)",
          viz.schema.colorDefaults,
        );
      },
      ...userConfig,
      fontMin: (rec: DataPoint, i: number) =>
        insideFontMin(
          viz,
          placed.get(rec.data as NetworkNode),
          resolveAccessor<number>(fontMin, rec, i) ??
            shapeLabelDefaults.fontMin,
        ),
    },
  });
  if (!circle) return labelNodes;
  const mine = new Map(
    values.filter(d => placed.has(d)).map(d => [d, placed.get(d)!]),
  );
  const beside = outsideLabels(mine, d => ({
    id: `network-label-${d.id}`,
    datum: d as DataPoint,
  }));
  return [...labelNodes, ...emitOutsideLabels(viz, beside)];
}

export const networkEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.networkCtx as NetworkCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = [];

  if (c.links && c.links.length) out.push(...emitNetworkLinks(viz, c));

  if (c.nodeGroups && c.nodeGroups.length) {
    const placed = placeNetworkLabels(viz, c);
    for (const [shapeKind, values] of c.nodeGroups) {
      if (!values.length) continue;
      const vizCfg = shapeConfigFor(viz, shapeKind);
      const merged = {...vizCfg, ...c.nodeShapeConfig};
      const images: SceneNode[] = [];

      for (let i = 0; i < values.length; i++) {
        const d = values[i];
        const datum = (d.data ?? d) as DataPoint;
        const paint = paintFromShapeConfig(merged, datum, d.i ?? i);
        // Nodes are data shapes: keep their stroke a constant screen width as the
        // network zooms (the links above deliberately scale with the zoom, so
        // heavier connections read as heavier when zoomed in).
        if (paint.vectorEffect === undefined)
          paint.vectorEffect = "non-scaling-stroke";
        const sizeFn = viz._size as
          ((d: DataPoint, i: number) => unknown) | undefined;
        const validSize = sizeFn ? `, ${sizeFn(datum, d.i ?? i)}` : "";
        const aria = {label: `${drawNodeLabel(viz, d, i)}${validSize}.`};
        const node = networkNode(
          shapeKind,
          d,
          merged,
          {datum, paint, aria},
          d.i ?? i,
        );
        // Other shape kinds: skipped (Network's default is Circle).
        if (!node) continue;
        out.push(node);
        const image = backgroundImageNode(merged, node, datum, d.i ?? i);
        if (image) images.push(image);
      }
      out.push(...images);

      out.push(...networkNodeLabels(viz, c, shapeKind, values, merged, placed));
    }
  }

  return out;
};
