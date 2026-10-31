/**
    `applyArcDiagramLayout` — ArcDiagram's layout stage. Resolves nodes and
    links the way Network does, orders the nodes along the line (`nodeSort`),
    spaces them evenly, sizes them, fits their labels, and shapes each link as
    an arc on its side of the line, flattened just enough that the tallest
    arc fits. The result rides on `viz.ctx.arcCtx` for the emit.
*/

import {extent, max, min} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import {measureLabel, pointLabelSettings} from "../features/circleLabels.js";
import {shapeConfigFor} from "../features/emitHelpers.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";
import {resolveGraphLinks, resolveGraphNodes} from "../Network/graph.js";
import type {GraphNode} from "../Network/graph.js";
import {
  arcPathD,
  arcScale,
  arcSideOf,
  nodeDegrees,
  slotPositions,
  sortArcNodes,
} from "./arcGeometry.js";
import type {ArcGeometry, ArcOrient, ArcSide, NodeSort} from "./arcGeometry.js";
import {
  fitLabels,
  labelReach,
  labelWidthLimit,
  placeArcLabel,
} from "./arcLabels.js";
import type {ArcLabel, LabelFit} from "./arcLabels.js";

/** A laid-out node. `r` is its final radius. */
export interface ArcNode extends GraphNode {
  x: number;
  y: number;
  /** Its index along the line. */
  rank: number;
  label: string;
  group: unknown;
  degree: number;
}

/** A laid-out link: the link's own fields, its resolved ends, and its arc. */
export interface ArcLink {
  [key: string]: unknown;
  source: ArcNode;
  target: ArcNode;
  /** Stroke width, in pixels. */
  size: number;
  /** The link's index in `links`. */
  index: number;
  arc: ArcGeometry;
  d: string;
}

/** Everything the emit needs. */
export interface ArcCtx {
  nodes: ArcNode[];
  links: ArcLink[];
  labels: ArcLabel[];
  linkConfig: Record<string, unknown>;
}

type ScaleFn = ((v: number) => number) & {
  domain?: (d: [number, number]) => ScaleFn;
  range?: ((r: [number, number]) => ScaleFn) & (() => [number, number]);
};

/** A d3 continuous scale by name (`"sqrt"` → `scaleSqrt`). */
const namedScale = (name: string): ScaleFn => {
  const key = `scale${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  const make = (
    scales as unknown as Record<string, (() => ScaleFn) | undefined>
  )[key];
  return (make ?? scales.scaleSqrt)() as ScaleFn;
};

/**
    The node radius scale for nodes `spacing` pixels apart. Nodes are at most
    `sizeMax` (default: just under half the spacing, up to 20px). Unsized
    nodes all draw at `sizeMin` (within that cap); sized ones run from
    `sizeMin` (or half the cap, if smaller) up to the cap.
*/
export function arcRadiusScale(
  values: number[] | null,
  opts: {sizeMin: number; sizeMax?: number; sizeScale: string; spacing: number},
): ScaleFn {
  const cap =
    typeof opts.sizeMax === "number"
      ? opts.sizeMax
      : Math.max(1, Math.min(opts.spacing * 0.45, 20));
  if (!values) {
    const r = Math.min(opts.sizeMin, cap);
    return Object.assign(() => r, {
      domain: undefined,
      range: undefined,
    }) as unknown as ScaleFn;
  }
  const ext = extent(values) as [number, number];
  if (ext[0] === undefined || ext[0] === ext[1]) {
    const scale = scales.scaleLinear().domain([0, 1]).range([cap, cap]);
    return scale as unknown as ScaleFn;
  }
  return namedScale(opts.sizeScale).domain!(ext).range!([
    Math.min(cap / 2, opts.sizeMin),
    cap,
  ]);
}

/** A node's group for `nodeSort: "group"`: its top `groupBy` (or `nodeGroupBy`) level, else its color value. */
export function arcNodeGroup(v: VizInstance, n: GraphNode): unknown {
  const top = (list: unknown) =>
    Array.isArray(list) && list.length > 1
      ? (list[0] as (d: DataPoint, i: number) => unknown)
      : undefined;
  const group = top(v.schema.groupBy);
  if (group) return group(n.data, n.i);
  const nodeGroup = top(v.schema.nodeGroupBy);
  if (nodeGroup) return nodeGroup(n.node, n.i);
  const color = v.schema.color as
    ((d: DataPoint, i: number) => unknown) | undefined;
  return typeof color === "function" ? color(n.data, n.i) : undefined;
}

/** Resolves, filters, and orders the nodes and links, before any geometry. */
function resolveArcGraph(v: VizInstance) {
  const graph = resolveGraphNodes(v);
  const links = resolveGraphLinks(v, graph)
    .map((l, index) => ({...l, index}))
    // Unresolved ends and self-links draw no arc.
    .filter(l => l.source && l.target && l.source !== l.target);
  const degrees = nodeDegrees(links);
  const order = new Map((v.schema.nodes as DataPoint[]).map((d, i) => [d, i]));
  const sortable = graph.map(n => ({
    ...n,
    datum: n.data,
    label: `${v._drawLabel(n.data, n.i) ?? ""}`,
    group: arcNodeGroup(v, n),
    degree: degrees.get(n.id) ?? 0,
    order: order.get(n.node) ?? n.i,
  }));
  const nodes = sortArcNodes(sortable, v.schema.nodeSort as NodeSort);
  return {nodes, links};
}

/** The radius scale for the chart's nodes along a line `length` pixels long. */
function radiusFor(v: VizInstance, nodes: GraphNode[], length: number) {
  const spacing = nodes.length ? length / nodes.length : length;
  return arcRadiusScale(v._size ? nodes.map(n => n.r) : null, {
    sizeMin: v.schema.sizeMin as number,
    sizeMax: v.schema.sizeMax as number | undefined,
    sizeScale: (v.schema.sizeScale as string) || "sqrt",
    spacing,
  });
}

/** Whether node labels draw at all (`shapeConfig.Circle.label: false` turns them off). */
function labelsOn(v: VizInstance): boolean {
  const cfg = shapeConfigFor(v, "Circle");
  return cfg.label !== false;
}

/** Fits the labels and the line's extent along its axis, leaving room for slanted labels at the ends. */
function fitAlong(
  widths: number[],
  length: number,
  lineHeight: number,
  maxDepth: number,
  orient: ArcOrient,
  labelSide: "above" | "below",
): {start: number; length: number; fit: LabelFit; widthCap: number} {
  const n = widths.length;
  let start = 0;
  let along = length;
  let fit: LabelFit = {angle: 0, step: 1};
  let widthCap = Infinity;
  for (let pass = 0; pass < 3; pass++) {
    const spacing = n ? along / n : along;
    fit = fitLabels(max(widths) ?? 0, spacing, lineHeight, orient);
    widthCap = labelWidthLimit(fit.angle, maxDepth, lineHeight, orient);
    if (orient !== "horizontal" || fit.angle !== -45) break;
    // Slanted labels reach past their node: down-left under the line,
    // up-right over it. Inset the line so the end labels stay inside.
    let inset = 0;
    widths.forEach((w, i) => {
      if (i % fit.step) return;
      const {spread} = labelReach(
        -45,
        Math.min(w, widthCap),
        lineHeight,
        orient,
      );
      const room = (labelSide === "below" ? i + 0.5 : n - i - 0.5) * spacing;
      inset = Math.max(inset, spread - room);
    });
    start = labelSide === "below" ? inset : 0;
    along = length - inset;
  }
  return {start, length: along, fit, widthCap};
}

/** Each side's widest arc span, with every arc's side. */
function spansBySide(
  links: {
    source: {rank: number; at: number};
    target: {rank: number; at: number};
  }[],
  side: ArcSide,
) {
  let above = 0,
    below = 0;
  const sides = links.map(l => {
    const s = arcSideOf(l.source.rank, l.target.rank, side);
    const span = Math.abs(l.target.at - l.source.at);
    if (s === "above") above = Math.max(above, span);
    else below = Math.max(below, span);
    return s;
  });
  return {above, below, sides};
}

/** Normalizes link widths onto `linkSizeScale`, from `linkSizeMin` to the smallest node's radius. */
function linkWidths(v: VizInstance, sizes: number[], rMin: number): number[] {
  const ext = extent(sizes) as [number, number];
  if (ext[0] === undefined || ext[0] === ext[1]) return sizes;
  const lo = v.schema.linkSizeMin as number;
  const scale = namedScale((v.schema.linkSizeScale as string) || "sqrt")
    .domain!(ext).range!([lo, Math.max(lo, rMin)]);
  return sizes.map(s => scale(s));
}

/** ArcDiagram's size-legend scale for a chart area of `width` × `height`. */
export function arcSizeLegendScale(
  v: VizInstance,
  width: number,
  height: number,
): SizeLegendScale | null {
  if (!v._size || !Array.isArray(v.schema.nodes)) return null;
  if (!Array.isArray(v._filteredData) || !Array.isArray(v.schema.links))
    return null;
  const {nodeLookup, linkLookup} = v.ctx;
  const nodes = resolveGraphNodes(v);
  v.ctx.nodeLookup = nodeLookup;
  v.ctx.linkLookup = linkLookup;
  if (!nodes.length) return null;
  const length = v.schema.orient === "vertical" ? height : width;
  return radiusFor(v, nodes, length) as unknown as SizeLegendScale;
}

/** The cross-axis layout: how far arcs flatten, and where the line sits. */
function crossLayout(opts: {
  cross: number;
  spans: {above: number; below: number};
  labelSide: "above" | "below";
  labelBand: number;
  rMax: number;
  strokePad: number;
  orient: ArcOrient;
}): {scale: number; base: number} {
  const {cross, spans, labelSide, labelBand, rMax, strokePad} = opts;
  const room = Math.max(0, cross - strokePad * 2);
  const [labelArcs, otherArcs] =
    labelSide === "above"
      ? [spans.above, spans.below]
      : [spans.below, spans.above];
  const scale = Math.min(
    arcScale(otherArcs, labelArcs, room).scale,
    arcScale(otherArcs, 0, room - labelBand).scale,
  );
  const region = (span: number, labeled: boolean) =>
    Math.max((scale * span) / 2, labeled ? labelBand : rMax);
  const regionAbove = region(spans.above, labelSide === "above");
  const regionBelow = region(spans.below, labelSide === "below");
  // The region first along the cross axis: above a horizontal line (the top),
  // or below a vertical one (its left, where "below" arcs and labels go).
  const [first, second] =
    opts.orient === "horizontal"
      ? [regionAbove, regionBelow]
      : [regionBelow, regionAbove];
  const offset = Math.max(0, (cross - first - second - strokePad * 2) / 2);
  return {scale, base: offset + strokePad + first};
}

type RankedNode = ReturnType<typeof resolveArcGraph>["nodes"][number] & {
  rank: number;
  at: number;
};

/** The laid-out nodes, on the line at `base`. */
function placeNodes(
  ranked: RankedNode[],
  radii: number[],
  base: number,
  orient: ArcOrient,
): ArcNode[] {
  return ranked.map((n, i) => {
    const [x, y] = orient === "horizontal" ? [n.at, base] : [base, n.at];
    return {
      __d3plus__: true,
      data: n.data,
      i: n.i,
      id: n.id,
      fx: x,
      fy: y,
      node: n.node,
      shape: n.shape,
      x,
      y,
      r: radii[i],
      width: radii[i] * 2,
      height: radii[i] * 2,
      rank: n.rank,
      label: n.label,
      group: n.group,
      degree: n.degree,
    };
  });
}

/** The laid-out links, longest first so shorter arcs draw (and hit-test) over them. */
function placeLinks(
  v: VizInstance,
  placed: {index: number; source: RankedNode; target: RankedNode}[],
  nodes: ArcNode[],
  geometry: {base: number; scale: number; orient: ArcOrient},
  sides: ("above" | "below")[],
  sizes: number[],
): ArcLink[] {
  const raw = v.schema.links as DataPoint[];
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const links: ArcLink[] = placed.map((l, i) => {
    const arc: ArcGeometry = {
      ...geometry,
      from: l.source.at,
      to: l.target.at,
      side: sides[i],
    };
    return {
      ...(raw[l.index] as Record<string, unknown>),
      source: nodeById.get(l.source.id)!,
      target: nodeById.get(l.target.id)!,
      size: sizes[i],
      index: l.index,
      arc,
      d: arcPathD(arc),
    };
  });
  return links.sort(
    (a, b) =>
      Math.abs(b.arc.to - b.arc.from) - Math.abs(a.arc.to - a.arc.from) ||
      a.index - b.index,
  );
}

/** Stashes the layout and the id lookups hover and click focus read. */
function stashArcCtx(v: VizInstance, ctx: ArcCtx): void {
  v.ctx.arcCtx = ctx;
  v.ctx.nodeLookup = Object.fromEntries(ctx.nodes.map(n => [n.id, n]));
  const neighbors: Record<string, ArcNode[]> = {};
  for (const l of ctx.links) {
    (neighbors[l.source.id] ??= []).push(l.target);
    (neighbors[l.target.id] ??= []).push(l.source);
  }
  v.ctx.linkLookup = neighbors;
}

export const applyArcDiagramLayout: TransformStage = ({viz}) => {
  const v = viz;
  const {width, height} = chartBounds(v);
  if (!Array.isArray(v._filteredData)) v._filteredData = [];
  if (!Array.isArray(v.schema.nodes)) v.schema.nodes = [];
  if (!Array.isArray(v.schema.links)) v.schema.links = [];

  const orient: ArcOrient =
    v.schema.orient === "vertical" ? "vertical" : "horizontal";
  const side = (v.schema.arcSide as ArcSide) || "above";
  const labelSide = side === "below" ? "above" : "below";
  const {nodes, links} = resolveArcGraph(v);
  const along = orient === "horizontal" ? width : height;
  const cross = orient === "horizontal" ? height : width;

  const settings = pointLabelSettings(v);
  const lineHeight = Math.ceil(settings.fontSize * 1.2) + 1;
  const font = {size: settings.fontSize, lineHeight: settings.fontSize * 1.2};
  const showLabels = labelsOn(v);
  const widths = nodes.map(n =>
    showLabels && n.label ? measureLabel(n.label, font).width : 0,
  );
  const line = fitAlong(
    widths,
    along,
    lineHeight,
    cross * 0.3,
    orient,
    labelSide,
  );
  const positions = slotPositions(nodes.length, line.start, line.length);
  const spacing = nodes.length ? line.length / nodes.length : line.length;

  const r = radiusFor(v, nodes, line.length);
  v._sizeLegendFinal = v._size ? (r as unknown as SizeLegendScale) : null;
  const radii = nodes.map(n => r(n.r) || 1);
  const rMax = max(radii) ?? 0;

  const ranked = nodes.map((n, rank) => ({...n, rank, at: positions[rank]}));
  const byId = new Map(ranked.map(n => [n.id, n]));
  const placed = links.map(l => ({
    index: l.index,
    size: l.size,
    source: byId.get(l.source.id)!,
    target: byId.get(l.target.id)!,
  }));
  const spans = spansBySide(placed, side);

  // Labels claim the room past the nodes on their side of the line.
  const labelGap = rMax + settings.padding;
  const shown = widths.map((w, i) =>
    i % line.fit.step ? 0 : Math.min(w, line.widthCap),
  );
  const widest = max(shown) ?? 0;
  const depth = widest
    ? labelReach(line.fit.angle, widest, lineHeight, orient).depth
    : 0;
  const sizes = linkWidths(
    v,
    placed.map(l => l.size),
    min(radii) ?? 1,
  );
  const {scale, base} = crossLayout({
    cross,
    spans,
    labelSide,
    labelBand: depth ? labelGap + depth : rMax,
    rMax,
    strokePad: (max(sizes) ?? 1) / 2 + 2,
    orient,
  });

  const arcNodes = placeNodes(ranked, radii, base, orient);
  const arcLinks = placeLinks(
    v,
    placed,
    arcNodes,
    {base, scale, orient},
    spans.sides,
    sizes,
  );
  const labels: ArcLabel[] = [];
  arcNodes.forEach((n, i) => {
    if (!shown[i] || !n.label) return;
    labels.push(
      placeArcLabel({
        id: `arc-label-${n.id}`,
        datum: n.data,
        text: n.label,
        at: positions[i],
        base,
        gap: labelGap,
        width: shown[i],
        spacing,
        lineHeight,
        angle: line.fit.angle,
        side: labelSide,
        orient,
      }),
    );
  });

  const linkConfig = shapeConfigFor(v, "Path", v.schema.shapeConfig, "edge");
  delete linkConfig.on;
  stashArcCtx(v, {nodes: arcNodes, links: arcLinks, labels, linkConfig});
  return {shapeData: arcNodes as unknown as DataPoint[]};
};
