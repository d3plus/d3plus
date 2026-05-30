/**
    `applyRingsLayout` — Rings' chart-specific layout stage. Lays out the
    focal center node + two concentric rings of connected nodes, sizes
    each by extent, builds bezier link `d` accessor, and stashes
    `ringsCtx` + `nodeLookup`/`linkLookup` on `viz.ctx`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import {extent, groups, max, min} from "d3-array";
import * as scales from "d3-scale";

import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../chartGeometry.js";
import {resolveAccessor, shapeConfigFor} from "../emitHelpers.js";
import type {TransformStage} from "../stages.js";

/**
    Single laid-out node — accreted across the layout's passes. Each
    field is filled in by one of the steps below; collected here so a
    single type captures the union of accreted state.
*/
interface RingsNode {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  id: string;
  node: DataPoint;
  shape: string;
  // Set by the placement pass.
  x?: number;
  y?: number;
  r?: number;
  ring?: 1 | 2;
  radians?: number;
  // Set by the per-link traversal.
  edges?: RingsEdge[] | Record<string, {angle: number; radius: number}>;
  edge?: RingsEdge;
  size?: number;
  // Set by the label-bounds pass.
  labelBounds?: {x: number; y: number; width: number; height: number};
  rotate?: number;
  textAnchor?: string;
}

/**
    Resolved bezier link. Source/target get rewritten in-place during
    the placement pass; the bezier-control fields (`sourceX`, etc.) and
    the `spline` flag are added by the same pass.
*/
interface RingsEdge {
  source: RingsNode;
  target: RingsNode;
  size: number;
  spline?: boolean;
  sourceX?: number;
  sourceY?: number;
  sourceBisectX?: number;
  sourceBisectY?: number;
  targetX?: number;
  targetY?: number;
  targetBisectX?: number;
  targetBisectY?: number;
}

interface RScale {
  (v: number): number;
  domain: (d: [number, number]) => RScale;
  range: ((r: [number, number]) => RScale) & (() => [number, number]);
  rangeRound: (r: [number, number]) => RScale;
}

type RawLink = {source: string | number | DataPoint; target: string | number | DataPoint};

/** Shared empty `ringsCtx` value for the early-return branches. */
const emptyRingsCtx = () => ({
  edges: [],
  nodeGroups: [],
  linkConfig: {},
  linkD: () => "",
  nodeShapeConfig: {},
});

/**
    Build the Rings node set + link descriptors from filtered data and schema
    nodes/links. Stashes `nodeLookup` on `viz.ctx` and returns the working
    `nodes`, `nodeLookup`, `links`, and per-node `linkMap`.
*/
function buildRingsGraph(
  v: any,
  data: Record<string, DataPoint>,
): {
  nodes: RingsNode[];
  nodeLookup: Record<string, RingsNode>;
  links: RingsEdge[];
  linkMap: Record<string, RingsEdge[]>;
} {
  let rawNodes: DataPoint[] = v.schema.nodes as DataPoint[];
  if (!rawNodes.length && (v.schema.links as RawLink[]).length) {
    const nodeIds = Array.from(
      new Set(
        (v.schema.links as RawLink[]).reduce(
          (ids: unknown[], link) => ids.concat([link.source, link.target]),
          [],
        ),
      ),
    );
    rawNodes = nodeIds.map(node =>
      typeof node === "object" ? (node as DataPoint) : ({id: node} as unknown as DataPoint),
    );
  }

  const nodesById: Record<string, DataPoint> = rawNodes.reduce(
    (obj: Record<string, DataPoint>, d, i) => {
      const key = (v.schema.nodeGroupBy
        ? v.schema.nodeGroupBy[v._drawDepth](d, i)
        : v._id(d, i)) as string;
      obj[key] = d;
      return obj;
    },
    {},
  );

  const nodes: RingsNode[] = Array.from(new Set(Object.keys(data).concat(Object.keys(nodesById))))
    .map((id, i) => {
      const d = data[id];
      const n = nodesById[id];
      if (n === undefined) return false as const;
      return {
        __d3plus__: true,
        data: (d || n) as DataPoint,
        i,
        id,
        node: n,
        shape: (d !== undefined && v.schema.shape(d) !== undefined
          ? v.schema.shape(d)
          : v.schema.shape(n)) as string,
      } satisfies RingsNode;
    })
    .filter((n): n is RingsNode => !!n);

  const nodeLookup: Record<string, RingsNode> = nodes.reduce(
    (obj: Record<string, RingsNode>, d) => {
      obj[d.id] = d;
      return obj;
    },
    {},
  );
  v.ctx.nodeLookup = nodeLookup;

  const links: RingsEdge[] = (v.schema.links as RawLink[]).map(link => {
    const resolve = (refIdx: 0 | 1): RingsNode => {
      const ref = refIdx === 0 ? link.source : link.target;
      if (typeof ref === "number") {
        const original = v.schema.nodes && (v.schema.nodes as DataPoint[])[ref];
        if (original == null) return undefined as unknown as RingsNode;
        if (typeof original === "object")
          return (nodeLookup[(original as DataPoint).id as string] ||
            nodeLookup[original as unknown as string]) as RingsNode;
        return nodeLookup[original as unknown as string];
      }
      const key = typeof ref === "object" ? ((ref as DataPoint).id as string) : (ref as string);
      return nodeLookup[key];
    };
    return {
      source: resolve(0),
      target: resolve(1),
      size: v.schema.linkSize(link) as number,
    };
  });

  const linkMap: Record<string, RingsEdge[]> = links.reduce(
    (map: Record<string, RingsEdge[]>, link) => {
      if (!map[link.source.id]) map[link.source.id] = [];
      map[link.source.id].push(link);
      if (!map[link.target.id]) map[link.target.id] = [];
      map[link.target.id].push(link);
      return map;
    },
    {},
  );

  return {nodes, nodeLookup, links, linkMap};
}

/** Ring geometry derived from the chart bounds. */
interface RingGeometry {
  width: number;
  height: number;
  ringWidth: number;
  primaryRing: number;
  secondaryRing: number;
}

/**
    Claim the center node + two rings, compute each node's angle/position, build
    the radius scale, and size every node. Returns the rebuilt `nodes` array
    plus the `primaries`/`secondaries` rings.
*/
function placeRingsNodes(
  v: any,
  nodeLookup: Record<string, RingsNode>,
  linkMap: Record<string, RingsEdge[]>,
  center: RingsNode,
  geom: RingGeometry,
  data: Record<string, DataPoint>,
): {nodes: RingsNode[]; primaries: RingsNode[]; secondaries: RingsNode[]} {
  const {width, height, primaryRing, secondaryRing} = geom;

  center.x = width / 2;
  center.y = height / 2;
  center.r = v.schema.sizeMin
    ? max([v.schema.sizeMin, primaryRing * 0.65])
    : v.schema.sizeMax
      ? min([v.schema.sizeMax, primaryRing * 0.65])
      : primaryRing * 0.65;

  const claimed: RingsNode[] = [center];
  const primaries: RingsNode[] = [];
  const centerLinks = linkMap[v.schema.center as string] || [];
  centerLinks.forEach(edge => {
    const node = edge.source.id === v.schema.center ? edge.target : edge.source;
    node.edges = linkMap[node.id].filter(
      link => link.source.id !== v.schema.center || link.target.id !== v.schema.center,
    );
    node.edge = edge;
    claimed.push(node);
    primaries.push(node);
  });

  primaries.sort((a, b) => (a.edges as RingsEdge[]).length - (b.edges as RingsEdge[]).length);
  const secondaries: RingsNode[] = [];
  let totalEndNodes = 0;

  primaries.forEach(p => {
    const primaryId = p.id;
    p.edges = (p.edges as RingsEdge[]).filter(edge =>
      (!claimed.includes(edge.source) && edge.target.id === primaryId) ||
      (!claimed.includes(edge.target) && edge.source.id === primaryId),
    );
    totalEndNodes += (p.edges as RingsEdge[]).length || 1;
    (p.edges as RingsEdge[]).forEach(edge => {
      const {source, target} = edge;
      const claim = target.id === primaryId ? source : target;
      claimed.push(claim);
    });
  });

  const tau = Math.PI * 2;
  let offset = 0;

  primaries.forEach((p, i) => {
    const pEdges = p.edges as RingsEdge[];
    const children = pEdges.length || 1;
    const space = (tau / totalEndNodes) * children;
    if (i === 0) offset -= space / 2;
    const angle = offset + space / 2 - tau / 4;
    p.radians = angle;
    p.x = width / 2 + primaryRing * Math.cos(angle);
    p.y = height / 2 + primaryRing * Math.sin(angle);
    offset += space;

    pEdges.forEach((edge, j) => {
      const node = edge.source.id === p.id ? edge.target : edge.source;
      const s = tau / totalEndNodes;
      const a = angle - (s * children) / 2 + s / 2 + s * j;
      node.radians = a;
      node.x = width / 2 + secondaryRing * Math.cos(a);
      node.y = height / 2 + secondaryRing * Math.sin(a);
      secondaries.push(node);
    });
  });

  sizeRingsNodes(v, center, geom, data, primaries, secondaries);

  const nodes = [center].concat(primaries).concat(secondaries);

  return {nodes, primaries, secondaries};
}

/**
    Build the radius scale from the size extent (or ring defaults) and assign
    each ring node its `ring` + `r`. Mutates `center.r` and every ring node.
*/
function sizeRingsNodes(
  v: any,
  center: RingsNode,
  geom: RingGeometry,
  data: Record<string, DataPoint>,
  primaries: RingsNode[],
  secondaries: RingsNode[],
): void {
  const {ringWidth} = geom;
  const primaryDistance = ringWidth / 2;
  const secondaryDistance = ringWidth / 4;

  let primaryMax = primaryDistance / 2 - 4;
  if (primaryDistance / 2 - 4 < 8) primaryMax = min([primaryDistance / 2, 8]) || 0;

  let secondaryMax = secondaryDistance / 2 - 4;
  if (secondaryDistance / 2 - 4 < 4) secondaryMax = min([secondaryDistance / 2, 4]) || 0;
  if (secondaryMax > ringWidth / 10) secondaryMax = ringWidth / 10;
  if (secondaryMax > primaryMax && secondaryMax > 10) secondaryMax = primaryMax * 0.75;
  if (primaryMax > secondaryMax * 1.5) primaryMax = secondaryMax * 1.5;
  primaryMax = Math.floor(primaryMax);
  secondaryMax = Math.floor(secondaryMax);

  let radiusFn: (v: number) => number;
  if (v._size) {
    const domain = extent(
      Object.values(data),
      (d: DataPoint) => d.size as number,
    ) as [number, number];
    if (domain[0] === domain[1]) domain[0] = 0;
    radiusFn = scales.scaleLinear()
      .domain(domain)
      .rangeRound([3, min([primaryMax, secondaryMax]) as number]) as unknown as (v: number) => number;
    center.r = radiusFn(center.size as number);
  } else {
    radiusFn = scales.scaleLinear()
      .domain([1, 2])
      .rangeRound([primaryMax, secondaryMax]) as unknown as (v: number) => number;
  }

  secondaries.forEach(s => {
    s.ring = 2;
    const val = (v._size ? s.size : 2) as number;
    s.r = v.schema.sizeMin
      ? (max([v.schema.sizeMin, radiusFn(val)]) as number)
      : v.schema.sizeMax
        ? (min([v.schema.sizeMax, radiusFn(val)]) as number)
        : radiusFn(val);
  });
  primaries.forEach(p => {
    p.ring = 1;
    const val = (v._size ? p.size : 1) as number;
    p.r = v.schema.sizeMin
      ? (max([v.schema.sizeMin, radiusFn(val)]) as number)
      : v.schema.sizeMax
        ? (min([v.schema.sizeMax, radiusFn(val)]) as number)
        : radiusFn(val);
  });
}

/**
    Resolve link endpoints to placed nodes, compute bezier control points for
    spline edges, and push every edge onto `edges` (mutated in place).
*/
function buildRingsEdges(
  v: any,
  nodes: RingsNode[],
  primaries: RingsNode[],
  secondaries: RingsNode[],
  linkMap: Record<string, RingsEdge[]>,
  center: RingsNode,
  geom: RingGeometry,
  edges: RingsEdge[],
): void {
  const {width, height, ringWidth, primaryRing, secondaryRing} = geom;

  primaries.forEach(p => {
    type EndKey = "source" | "target";
    const checks: EndKey[] = ["source", "target"];
    const pEdge = p.edge as RingsEdge;
    checks.forEach(node => {
      pEdge[node] = nodes.find(n => n.id === pEdge[node].id) as RingsNode;
    });
    edges.push(pEdge);

    linkMap[p.id].forEach(edge => {
      const otherNode = edge.source.id === p.id ? edge.target : edge.source;
      if (otherNode.id === center.id) return;
      let target = secondaries.find(s => s.id === otherNode.id);
      if (!target) target = primaries.find(s => s.id === otherNode.id);
      if (!target) return;
      edge.spline = true;

      const centerX = width / 2;
      const centerY = height / 2;
      const middleRing = primaryRing + (secondaryRing - primaryRing) * 0.5;
      const checks2: EndKey[] = ["source", "target"];

      checks2.forEach((endKey, i) => {
        const endNode = edge[endKey];
        const endRadians = endNode.radians as number;
        const endRing = endNode.ring;
        const endRX = endNode.x as number;
        const endRY = endNode.y as number;
        const endRR = endNode.r as number;
        const rotated = endRing === 2 ? endRadians + Math.PI : endRadians;
        edge[`${endKey}X` as const] = endRX + Math.cos(rotated) * endRR;
        edge[`${endKey}Y` as const] = endRY + Math.sin(rotated) * endRR;
        edge[`${endKey}BisectX` as const] = centerX + middleRing * Math.cos(endRadians);
        edge[`${endKey}BisectY` as const] = centerY + middleRing * Math.sin(endRadians);
        edge[endKey] = nodes.find(n => n.id === endNode.id) as RingsNode;
        const ringNode = edge[endKey];
        if (ringNode.edges === undefined) {
          ringNode.edges = {} as Record<string, {angle: number; radius: number}>;
        }
        const oppId = (i === 0 ? edge.target.id : edge.source.id) as string;
        const edgeMap = ringNode.edges as Record<string, {angle: number; radius: number}>;
        if (ringNode.id === p.id) {
          edgeMap[oppId] = {angle: (p.radians as number) + Math.PI, radius: ringWidth / 2};
        } else {
          edgeMap[oppId] = {angle: target!.radians as number, radius: ringWidth / 2};
        }
      });
      edges.push(edge);
    });
  });
}

/** Compute each node's label bounds, rotation, and text anchor (mutated in place). */
function applyRingsLabelBounds(v: any, nodes: RingsNode[], geom: RingGeometry): void {
  const {primaryRing, ringWidth} = geom;
  nodes.forEach(node => {
    if (node.id === v.schema.center) {
      node.labelBounds = {
        x: -primaryRing / 2,
        y: -primaryRing / 2,
        width: primaryRing,
        height: primaryRing,
      };
      return;
    }
    const labelConfigRef = (v.schema.shapeConfig as Record<string, unknown>).labelConfig as
      | {fontSize?: (d: RingsNode) => number}
      | undefined;
    const fontSize =
      (labelConfigRef?.fontSize && labelConfigRef.fontSize(node)) || 11;
    const lineHeight = fontSize * 1.4;
    const h = lineHeight * 2;
    const padding = 5;
    const w = ringWidth - (node.r as number);

    let angle = (node.radians as number) * (180 / Math.PI);
    let x = (node.r as number) + padding;
    let textAnchor = "start";

    if (angle < -90 || angle > 90) {
      x = -(node.r as number) - w - padding;
      textAnchor = "end";
      angle += 180;
    }
    node.labelBounds = {x, y: -lineHeight / 2, width: w, height: h};
    node.rotate = angle;
    node.textAnchor = textAnchor;
  });
}

/**
    Build the link/node shape config + `linkD` accessor, scale link strokes, and
    stash `linkLookup` + `ringsCtx` on `viz.ctx`.
*/
function publishRingsCtx(
  v: any,
  nodes: RingsNode[],
  nodeLookup: Record<string, RingsNode>,
  links: RingsEdge[],
  edges: RingsEdge[],
): void {
  v.ctx.linkLookup = links.reduce(
    (obj: Record<string, RingsNode[]>, d) => {
      if (!obj[d.source.id]) obj[d.source.id] = [];
      obj[d.source.id].push(d.target);
      if (!obj[d.target.id]) obj[d.target.id] = [];
      obj[d.target.id].push(d.source);
      return obj;
    },
    {},
  );

  const strokeExtent = extent(links, d => d.size);
  if (strokeExtent[0] !== strokeExtent[1]) {
    const rNodeMin = min(nodes, d => d.r as number);
    const strokeScale = (scales as unknown as Record<string, () => RScale>)[
      `scale${v.schema.linkSizeScale.charAt(0).toUpperCase()}${v.schema.linkSizeScale.slice(1)}`
    ]()
      .domain(strokeExtent as [number, number])
      .range([v.schema.linkSizeMin as number, rNodeMin as number]);
    links.forEach(link => {
      link.size = strokeScale(link.size);
    });
  }

  const linkConfig = shapeConfigFor(v, "Path", v.schema.shapeConfig, "edge");
  delete linkConfig.on;

  const linkD = (d: RingsEdge) =>
    d.spline
      ? `M${d.sourceX},${d.sourceY}C${d.sourceBisectX},${d.sourceBisectY} ${d.targetBisectX},${d.targetBisectY} ${d.targetX},${d.targetY}`
      : `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`;

  const shapeConfig = {
    label: (d: RingsNode) =>
      nodes.length <= v.schema.dataCutoff ||
      (v._hover && v._hover(d)) ||
      (v._active && v._active(d))
        ? v._drawLabel(d.data || d.node, d.i)
        : false,
    labelBounds: (d: RingsNode) => d.labelBounds,
    labelConfig: {
      fontColor: (d: RingsNode & {key?: string; data?: RingsNode}) => {
        const node = (d.data ?? d) as RingsNode & {key?: string};
        if (node.id === v.schema.center) {
          const fill = resolveAccessor<string>(
            (shapeConfigFor(v, node.key ?? node.shape) as {fill?: unknown}).fill,
            (node.data ?? node) as DataPoint,
            node.i,
          );
          return colorContrast(typeof fill === "string" ? fill : "rgb(255, 255, 255)");
        }
        return colorContrast(
          v._select ? backgroundColor(v._select.node()) : "rgb(255, 255, 255)",
        );
      },
      fontResize: (d: RingsNode & {data?: RingsNode}) => ((d.data ?? d) as RingsNode).id === v.schema.center,
      padding: 0,
      textAnchor: (d: RingsNode & {key?: string; data?: RingsNode}) => {
        const node = (d.data ?? d) as RingsNode & {key?: string};
        return nodeLookup[node.id]?.textAnchor ||
          (shapeConfigFor(v, (node.key ?? node.shape)) as {labelConfig: {textAnchor: string}}).labelConfig.textAnchor;
      },
      verticalAlign: (d: RingsNode & {data?: RingsNode}) =>
        ((d.data ?? d) as RingsNode).id === v.schema.center ? "middle" : "top",
    },
    rotate: (d: RingsNode) => nodeLookup[d.id].rotate || 0,
  };

  const nodeGroups = Array.from(groups(nodes, d => d.shape));
  v.ctx.ringsCtx = {edges, nodeGroups, linkConfig, linkD, nodeShapeConfig: shapeConfig};
}

export const applyRingsLayout: TransformStage = ({viz}) => {
  const v = viz;

  if (!Array.isArray(v._filteredData)) v._filteredData = [];
  if (!Array.isArray(v.schema.nodes)) v.schema.nodes = [];
  if (!Array.isArray(v.schema.links)) v.schema.links = [];
  if (!v._filteredData.length && !v.schema.nodes.length && !v.schema.links.length) {
    v.ctx.nodeLookup = {};
    v.ctx.linkLookup = {};
    v.ctx.ringsCtx = emptyRingsCtx();
    return {viz};
  }

  const data: Record<string, DataPoint> = (v._filteredData as DataPoint[]).reduce(
    (obj: Record<string, DataPoint>, d, i) => {
      obj[v._id(d, i) as string] = d;
      return obj;
    },
    {},
  );

  const {nodeLookup, links, linkMap} = buildRingsGraph(v, data);

  const {width, height} = chartBounds(v);
  const edges: RingsEdge[] = [];
  const radius = (min([height, width]) || 0) / 2;
  const ringWidth = radius / 3;
  const primaryRing = ringWidth;
  const secondaryRing = ringWidth * 2;
  const geom: RingGeometry = {width, height, ringWidth, primaryRing, secondaryRing};

  const center = nodeLookup[v.schema.center];
  if (!center) {
    v.ctx.ringsCtx = emptyRingsCtx();
    return {viz};
  }

  const {nodes, primaries, secondaries} = placeRingsNodes(
    v,
    nodeLookup,
    linkMap,
    center,
    geom,
    data,
  );

  buildRingsEdges(v, nodes, primaries, secondaries, linkMap, center, geom, edges);

  applyRingsLabelBounds(v, nodes, geom);

  publishRingsCtx(v, nodes, nodeLookup, links, edges);

  return {shapeData: nodes as unknown as DataPoint[]};
};
