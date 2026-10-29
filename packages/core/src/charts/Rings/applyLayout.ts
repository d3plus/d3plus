/**
    `applyRingsLayout` — Rings' chart-specific layout stage. Lays out the
    focal center node + two concentric rings of connected nodes, sizes
    each by extent, builds bezier link `d` accessor, and stashes
    `ringsCtx` + `nodeLookup`/`linkLookup` on `viz.ctx`.
*/
import {extent, groups, max, min} from "d3-array";
import * as scales from "d3-scale";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import {resolveAccessor, shapeConfigFor} from "../features/emitHelpers.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";

import {
  ringsCenterLabel,
  ringsGeometry,
  sizeRingsNodes,
} from "./ringsSizing.js";
import type {RingGeometry} from "./ringsSizing.js";
import {buildRingsGraph} from "./ringsGraph.js";
import type {RingsEdge, RingsNode} from "./ringsGraph.js";
import {backgroundInk} from "../viz/backgroundInk.js";

interface RScale {
  (v: number): number;
  domain: (d: [number, number]) => RScale;
  range: ((r: [number, number]) => RScale) & (() => [number, number]);
  rangeRound: (r: [number, number]) => RScale;
}

/** Shared empty `ringsCtx` value for the early-return branches. */
const emptyRingsCtx = () => ({
  edges: [],
  nodeGroups: [],
  linkConfig: {},
  linkD: () => "",
  nodeShapeConfig: {},
});

/**
    Claim the center node + two rings, compute each node's angle/position, build
    the radius scale, and size every node. Returns the rebuilt `nodes` array
    plus the `primaries`/`secondaries` rings.
*/
function placeRingsNodes(
  v: VizInstance,
  nodeLookup: Record<string, RingsNode>,
  linkMap: Record<string, RingsEdge[]>,
  center: RingsNode,
  geom: RingGeometry,
): {
  nodes: RingsNode[];
  primaries: RingsNode[];
  secondaries: RingsNode[];
  radius: SizeLegendScale | null;
} {
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
      link =>
        link.source.id !== v.schema.center ||
        link.target.id !== v.schema.center,
    );
    node.edge = edge;
    claimed.push(node);
    primaries.push(node);
  });

  primaries.sort(
    (a, b) => (a.edges as RingsEdge[]).length - (b.edges as RingsEdge[]).length,
  );
  const secondaries: RingsNode[] = [];
  let totalEndNodes = 0;

  primaries.forEach(p => {
    const primaryId = p.id;
    p.edges = (p.edges as RingsEdge[]).filter(
      edge =>
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

  const radius = sizeRingsNodes(
    v,
    center,
    geom,
    totalEndNodes,
    primaries,
    secondaries,
  );

  const nodes = [center].concat(primaries).concat(secondaries);

  return {nodes, primaries, secondaries, radius};
}

/**
    Resolve link endpoints to placed nodes, compute bezier control points for
    spline edges, and push every edge onto `edges` (mutated in place).
*/
function buildRingsEdges(
  v: VizInstance,
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
        edge[`${endKey}BisectX` as const] =
          centerX + middleRing * Math.cos(endRadians);
        edge[`${endKey}BisectY` as const] =
          centerY + middleRing * Math.sin(endRadians);
        edge[endKey] = nodes.find(n => n.id === endNode.id) as RingsNode;
        const ringNode = edge[endKey];
        if (ringNode.edges === undefined) {
          ringNode.edges = {} as Record<
            string,
            {angle: number; radius: number}
          >;
        }
        const oppId = (i === 0 ? edge.target.id : edge.source.id) as string;
        const edgeMap = ringNode.edges as Record<
          string,
          {angle: number; radius: number}
        >;
        if (ringNode.id === p.id) {
          edgeMap[oppId] = {
            angle: (p.radians as number) + Math.PI,
            radius: ringWidth / 2,
          };
        } else {
          edgeMap[oppId] = {
            angle: target!.radians as number,
            radius: ringWidth / 2,
          };
        }
      });
      edges.push(edge);
    });
  });
}

/** Compute each node's label bounds, rotation, and text anchor (mutated in place). */
function applyRingsLabelBounds(
  v: VizInstance,
  nodes: RingsNode[],
  geom: RingGeometry,
): void {
  const {ringWidth} = geom;
  nodes.forEach(node => {
    if (node.id === v.schema.center) {
      const {bounds, inside} = ringsCenterLabel(
        v,
        node,
        geom,
        v._drawLabel(node.data || node.node, node.i),
        v.schema.fontFamily,
      );
      node.labelBounds = bounds;
      node.labelInside = inside;
      return;
    }
    const labelConfigRef = (v.schema.shapeConfig as Record<string, unknown>)
      .labelConfig as {fontSize?: (d: RingsNode) => number} | undefined;
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
  v: VizInstance,
  nodes: RingsNode[],
  nodeLookup: Record<string, RingsNode>,
  links: RingsEdge[],
  edges: RingsEdge[],
): void {
  v.ctx.linkLookup = links.reduce((obj: Record<string, RingsNode[]>, d) => {
    if (!obj[d.source.id]) obj[d.source.id] = [];
    obj[d.source.id].push(d.target);
    if (!obj[d.target.id]) obj[d.target.id] = [];
    obj[d.target.id].push(d.source);
    return obj;
  }, {});

  const strokeExtent = extent(links, d => d.size);
  if (strokeExtent[0] !== strokeExtent[1]) {
    const rNodeMin = min(nodes, d => d.r as number);
    const strokeScale = (scales as unknown as Record<string, () => RScale>)
      [
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

  // The center's label sits inside its circle unless the circle is too small
  // (see `ringsCenterLabel`), in which case it sits below like any other.
  const centerInside = (node: RingsNode) =>
    node.id === v.schema.center && nodeLookup[node.id]?.labelInside !== false;
  const shapeConfig = {
    label: (d: RingsNode) =>
      nodes.length <= v.schema.dataCutoff ||
      (v._hover && v._hover(d as unknown as DataPoint)) ||
      (v._active && v._active(d as unknown as DataPoint))
        ? v._drawLabel(d.data || d.node, d.i)
        : false,
    labelBounds: (d: RingsNode) => d.labelBounds,
    labelConfig: {
      fontColor: (d: RingsNode & {key?: string; data?: RingsNode}) => {
        const node = (d.data ?? d) as RingsNode & {key?: string};
        if (
          node.id === v.schema.center &&
          nodeLookup[node.id]?.labelInside !== false
        ) {
          const fill = resolveAccessor<string>(
            (shapeConfigFor(v, node.key ?? node.shape) as {fill?: unknown})
              .fill,
            (node.data ?? node) as DataPoint,
            node.i,
          );
          return colorContrast(
            typeof fill === "string" ? fill : "rgb(255, 255, 255)",
            v.schema.colorDefaults,
          );
        }
        return backgroundInk(v);
      },
      fontResize: (d: RingsNode & {data?: RingsNode}) =>
        centerInside((d.data ?? d) as RingsNode),
      padding: 0,
      textAnchor: (d: RingsNode & {key?: string; data?: RingsNode}) => {
        const node = (d.data ?? d) as RingsNode & {key?: string};
        if (node.id === v.schema.center && !centerInside(node)) return "middle";
        return (
          nodeLookup[node.id]?.textAnchor ||
          (
            shapeConfigFor(v, node.key ?? node.shape) as {
              labelConfig: {textAnchor: string};
            }
          ).labelConfig.textAnchor
        );
      },
      verticalAlign: (d: RingsNode & {data?: RingsNode}) =>
        centerInside((d.data ?? d) as RingsNode) ? "middle" : "top",
    },
    rotate: (d: RingsNode) => nodeLookup[d.id].rotate || 0,
  };

  const nodeGroups = Array.from(groups(nodes, d => d.shape));
  v.ctx.ringsCtx = {
    edges,
    nodeGroups,
    linkConfig,
    linkD,
    nodeShapeConfig: shapeConfig,
  };
}

/**
    Filtered data keyed by id, the node graph, and the center node — or null
    when there's nothing to lay out or no node matches `center`. Normalizes
    `center` to the matched node's id.
*/
function prepareRings(v: VizInstance): {
  data: Record<string, DataPoint>;
  graph: ReturnType<typeof buildRingsGraph>;
  center: RingsNode | undefined;
} | null {
  if (!Array.isArray(v._filteredData)) v._filteredData = [];
  if (!Array.isArray(v.schema.nodes)) v.schema.nodes = [];
  if (!Array.isArray(v.schema.links)) v.schema.links = [];
  if (
    !v._filteredData.length &&
    !v.schema.nodes.length &&
    !v.schema.links.length
  )
    return null;

  const data: Record<string, DataPoint> = (
    v._filteredData as DataPoint[]
  ).reduce((obj: Record<string, DataPoint>, d, i) => {
    obj[v._id(d, i) as string] = d;
    return obj;
  }, {});

  const graph = buildRingsGraph(v, data);

  // Data loading coerces leading-zero ids (e.g. "010101") into numbers, so a
  // string `center` config may not key the (coerced) node lookup directly. Try
  // the raw value, then its coerced form.
  let center = graph.nodeLookup[v.schema.center];
  if (
    !center &&
    v.schema.center != null &&
    !isNaN(v.schema.center as unknown as number)
  )
    center = graph.nodeLookup[parseFloat(v.schema.center as unknown as string)];
  // Normalize so downstream comparisons against node ids use the matched id.
  if (center) v.schema.center = center.id;
  return {data, graph, center};
}

/**
    Rings' size-legend scale for a chart area of `width` × `height`: places a
    scratch copy of the node graph exactly as the layout does and returns the
    radius scale it sized with. The ring geometry only shrinks as the area
    does, so the layout's final radii never exceed this estimate's.
*/
export function ringsSizeLegendScale(
  v: VizInstance,
  width: number,
  height: number,
): SizeLegendScale | null {
  if (!v._size) return null;
  const {nodeLookup} = v.ctx;
  const prepared = prepareRings(v);
  v.ctx.nodeLookup = nodeLookup;
  if (!prepared || !prepared.center) return null;
  const {graph, center} = prepared;
  return placeRingsNodes(
    v,
    graph.nodeLookup,
    graph.linkMap,
    center,
    ringsGeometry(width, height),
  ).radius;
}

export const applyRingsLayout: TransformStage = ({viz}) => {
  const v = viz;
  v._sizeLegendFinal = null;

  const prepared = prepareRings(v);
  if (!prepared) {
    v.ctx.nodeLookup = {};
    v.ctx.linkLookup = {};
    v.ctx.ringsCtx = emptyRingsCtx();
    return {viz};
  }
  const {
    graph: {nodeLookup, links, linkMap},
    center,
  } = prepared;
  if (!center) {
    v.ctx.ringsCtx = emptyRingsCtx();
    return {viz};
  }

  const {width, height} = chartBounds(v);
  const edges: RingsEdge[] = [];
  const geom = ringsGeometry(width, height);

  const {nodes, primaries, secondaries, radius} = placeRingsNodes(
    v,
    nodeLookup,
    linkMap,
    center,
    geom,
  );
  v._sizeLegendFinal = radius;

  buildRingsEdges(
    v,
    nodes,
    primaries,
    secondaries,
    linkMap,
    center,
    geom,
    edges,
  );

  applyRingsLabelBounds(v, nodes, geom);

  publishRingsCtx(v, nodes, nodeLookup, links, edges);

  return {shapeData: nodes as unknown as DataPoint[]};
};
