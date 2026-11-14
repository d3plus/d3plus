/**
    `networkEmit` — link Paths + per-shape-type node groups. Emits flat
    SceneNodes directly (no transient Shape compute pass).
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {Bounds} from "@d3plus/math";
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
import {
  edgeArrowTrims,
  emphasizedArrowEdge,
  scaledArrowSize,
  scaledStrokeWidth,
  straightEdgeArrows,
  straightEdgeD,
} from "../features/edgeArrows.js";
import type {ArrowEdge, ArrowValue} from "../features/edgeArrows.js";
import {
  drawNodeLabel,
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import {
  linkAriaLabel,
  linkHitPath,
  linkMeta,
} from "../features/linkInteraction.js";
import type {LinkDatum} from "../features/linkInteraction.js";
import {linkColorResolver} from "../features/linkColor.js";
import type {LinkEnds} from "../features/linkColor.js";
import {segmentMidpoint} from "../features/linkLabelGeometry.js";
import {selfLoopArrows, selfLoopD} from "../features/selfLoops.js";
import type {SelfLoopGeometry} from "../features/selfLoops.js";
import {emitLinkLabels} from "../features/linkLabels.js";
import {curvePoints} from "../features/linkLabelPath.js";
import {networkClusterLabels} from "./clusterLabels.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import {bundledLinkAnchor, bundledLinkEdge, bundledLinkPath} from "./bundle.js";
import type {VizInstance} from "../viz/vizTypes.js";

interface NetworkLink {
  source: DataPoint & {x: number; y: number};
  target: DataPoint & {x: number; y: number};
  size?: number;
  datum?: LinkDatum;
  loop?: SelfLoopGeometry;
  points?: [number, number][];
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

/**
    A link's visible stroke and arrowheads (straight, center-to-center,
    along its loop, or along its bundle), drawn `scale` times as wide (see
    `emphasizedArrowEdge`): cut short at each node's outline, or at its
    arrowheads' bases (see `edgeArrowTrims`), so the line doesn't overlap
    them.
*/
function networkLinkEdge(
  viz: VizInstance,
  link: NetworkLink,
  datum: DataPoint,
  i: number,
  paint: Paint,
  keyPrefix: string,
  scale: number,
): ArrowEdge {
  const common = {
    arrows: viz.schema.arrows as ArrowValue,
    arrowSize: scaledArrowSize(viz.schema.arrowSize, scale),
    strokeWidth: scaledStrokeWidth(
      typeof paint.strokeWidth === "number" ? paint.strokeWidth : undefined,
      scale,
    ),
    datum,
    i,
    keyPrefix,
    fill: typeof paint.stroke === "string" ? paint.stroke : undefined,
  };
  const trims = edgeArrowTrims(common);
  if (link.loop)
    return {
      d: selfLoopD(link.loop, trims),
      arrows: selfLoopArrows({...common, loop: link.loop}),
    };
  if (link.points)
    return bundledLinkEdge(viz, {...link, points: link.points}, common);
  const ends = {
    source: link.source as NetworkNode,
    target: link.target as NetworkNode,
  };
  return {
    d: straightEdgeD(ends.source, ends.target, trims),
    arrows: straightEdgeArrows({...common, ...ends}),
  };
}

/**
    Link Paths, one per resolved `c.links` entry, each followed by a wider
    transparent hit path over it and its arrowheads.
*/
function emitNetworkLinks(viz: VizInstance, c: NetworkCtx): SceneNode[] {
  const out: SceneNode[] = [];
  const linkColor = linkColorResolver(viz);
  for (const link of c.links) {
    const datum = link.datum;
    if (!datum) continue;
    const i = linkMeta(datum)!.index;
    const paint = paintFromShapeConfig(c.linkConfig, datum, i);
    // Link's strokeWidth comes from the layout-injected `d.size`.
    if (typeof link.size === "number") paint.strokeWidth = link.size;
    const stroke = linkColor(datum, link as unknown as LinkEnds);
    if (stroke) paint.stroke = stroke;
    const srcId = (link.source as DataPoint).id ?? "";
    const tgtId = (link.target as DataPoint).id ?? "";
    const key = networkLinkKey(link, i);
    const d = c.linkD(link);
    // Optional directional arrowheads at the node boundary.
    const edge = emphasizedArrowEdge(scale =>
      networkLinkEdge(
        viz,
        link,
        datum,
        i,
        paint,
        `network-arrow-${srcId}-${tgtId}-${i}`,
        scale,
      ),
    );
    out.push({
      type: "path",
      key,
      d: edge.d,
      ...(edge.emphasis ? {emphasis: edge.emphasis} : {}),
      datum,
      index: i,
      paint,
      aria: {label: linkAriaLabel(viz, datum)},
    } as SceneNode);
    out.push(linkHitPath(key, d, datum, paint.strokeWidth) as SceneNode);
    out.push(...edge.arrows);
  }
  return out;
}

/** A link's scene key. */
const networkLinkKey = (link: NetworkLink, i: number): string =>
  `network-link-${(link.source as DataPoint).id ?? ""}-${(link.target as DataPoint).id ?? ""}-${i}`;

/**
    The link labels, at the middle of each link's run between its nodes (a
    loop's far point), clear of every node and every node label placed
    beside its node.
*/
function networkLinkLabels(
  viz: VizInstance,
  c: NetworkCtx,
  placed: Map<NetworkNode, CircleLabelLayout>,
  taken: Bounds[] = [],
): SceneNode[] {
  if (!c.links?.length) return [];
  const beside = [...placed.values()].flatMap(p =>
    p.position === "outside" ? [p.box] : [],
  );
  const nodes = c.nodeGroups.flatMap(([, values]) => values);
  return emitLinkLabels(
    viz,
    c.links.flatMap(link => {
      if (!link.datum) return [];
      const i = linkMeta(link.datum)!.index;
      return [
        {
          key: networkLinkKey(link, i),
          link,
          i,
          anchor: link.loop
            ? link.loop.apex
            : link.points
              ? bundledLinkAnchor({...link, points: link.points})
              : link.source && link.target
                ? segmentMidpoint(
                    [link.source.x, link.source.y],
                    [link.target.x, link.target.y],
                    (link.source as NetworkNode).r ?? 0,
                    (link.target as NetworkNode).r ?? 0,
                  )
                : null,
          path: link.loop
            ? curvePoints(link.loop.d)
            : link.points
              ? bundledLinkPath({...link, points: link.points})
              : null,
          priority: link.size,
        },
      ];
    }),
    {
      circles: nodes
        .filter(n => n.shape !== "Rect")
        .map(n => ({x: n.x, y: n.y, r: n.r})),
      boxes: nodes
        .filter(n => n.shape === "Rect")
        .map(n => {
          const w = n.width ?? n.r * 2;
          const h = n.height ?? n.r * 2;
          return {x: n.x - w / 2, y: n.y - h / 2, width: w, height: h};
        })
        .concat(beside, taken),
    },
  );
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

  const placed = c.nodeGroups?.length
    ? placeNetworkLabels(viz, c)
    : new Map<NetworkNode, CircleLabelLayout>();
  if (c.links && c.links.length) out.push(...emitNetworkLinks(viz, c));
  const clusters = networkClusterLabels(
    viz,
    (c.nodeGroups ?? []).flatMap(([, values]) => values),
    placed,
  );
  out.push(...clusters.scene);
  out.push(...networkLinkLabels(viz, c, placed, clusters.boxes));

  if (c.nodeGroups && c.nodeGroups.length) {
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
