/**
    `applyRingsLayout` — Rings' chart-specific layout stage. Lays out the
    focal center node + `hops` concentric rings of connected nodes, sizes
    each by extent, builds bezier link `d` accessor, and stashes
    `ringsCtx` + `nodeLookup`/`linkLookup` on `viz.ctx`.
*/
import {extent, groups, min} from "d3-array";
import * as scales from "d3-scale";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import {resolveAccessor, shapeConfigFor} from "../features/emitHelpers.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";

import {ringsCenterLabel, ringsGeometry, ringsHops} from "./ringsSizing.js";
import type {RingGeometry} from "./ringsSizing.js";
import {publishLinkGraph} from "../features/linkInteraction.js";
import {linkWidthRange} from "../features/linkWidths.js";
import {buildRingsGraph, ringsLinkEnd} from "./ringsGraph.js";
import {ringsLoops} from "./ringsLoops.js";
import {fanParallelEdges} from "./ringsParallel.js";
import {buildRingsEdges, placeRingsNodes} from "./ringsPlacement.js";
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
    Scales link stroke sizes onto the linkSizeScale between the widths
    `linkWidthRange` gives for the smallest node, when they differ, mutating
    each link's size.
*/
function scaleRingsStrokes(
  v: VizInstance,
  nodes: RingsNode[],
  links: RingsEdge[],
): void {
  const strokeExtent = extent(links, d => d.size);
  if (strokeExtent[0] !== strokeExtent[1]) {
    const rNodeMin = min(nodes, d => d.r as number);
    const strokeScale = (scales as unknown as Record<string, () => RScale>)
      [
        `scale${v.schema.linkSizeScale.charAt(0).toUpperCase()}${v.schema.linkSizeScale.slice(1)}`
      ]()
      .domain(strokeExtent as [number, number])
      .range(
        linkWidthRange(
          v.schema.linkSizeMin,
          v.schema.linkSizeMax,
          rNodeMin as number,
        ),
      );
    links.forEach(link => {
      link.size = strokeScale(link.size);
    });
  }
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
    if (d.source === d.target) return obj;
    if (!obj[d.source.id]) obj[d.source.id] = [];
    obj[d.source.id].push(d.target);
    if (!obj[d.target.id]) obj[d.target.id] = [];
    obj[d.target.id].push(d.source);
    return obj;
  }, {});

  scaleRingsStrokes(v, nodes, links);

  const linkConfig = shapeConfigFor(v, "Path", v.schema.shapeConfig, "edge");
  delete linkConfig.on;

  const linkD = (d: RingsEdge) =>
    d.loop
      ? d.loop.d
      : d.spline
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
    graph.linkMap,
    center,
    ringsGeometry(width, height, ringsHops(v.schema.hops)),
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
    graph: {nodes: graphNodes, nodeLookup, links, linkMap},
    center,
  } = prepared;
  publishLinkGraph(
    v,
    links.map(l => l.datum),
    graphNodes.map(ringsLinkEnd),
  );
  if (!center) {
    v.ctx.ringsCtx = emptyRingsCtx();
    return {viz};
  }

  const {width, height} = chartBounds(v);
  const geom = ringsGeometry(width, height, ringsHops(v.schema.hops));

  const {nodes, rings, radius} = placeRingsNodes(v, linkMap, center, geom);
  v._sizeLegendFinal = radius;

  const edges = buildRingsEdges(
    rings,
    linkMap,
    center,
    geom,
    !!v.schema.ringLinks,
  );

  applyRingsLabelBounds(v, nodes, geom);

  publishRingsCtx(v, nodes, nodeLookup, links, edges);
  // Parallel links fan apart by their scaled sizes.
  fanParallelEdges(edges);
  // Loops take their stroke from the scaled link sizes.
  edges.push(...ringsLoops(links, nodes, edges, center, geom));

  return {shapeData: nodes as unknown as DataPoint[]};
};
