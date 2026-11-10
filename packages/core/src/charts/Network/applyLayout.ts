/**
    `applyNetworkLayout` — Network's chart-specific layout stage.

    Resolves nodes + links into a single laid-out node array (running a
    d3-force simulation only when fx/fy coords are missing), normalizes
    link stroke sizes, and stashes `networkCtx` + node/link lookups on
    `viz.ctx` for the click/hover handlers installed by `setup`.
*/

import {extent, max, min, groups} from "d3-array";
import {forceLink, forceManyBody, forceSimulation} from "d3-force";
import type {SimulationNodeDatum, SimulationLinkDatum} from "d3-force";
import {polygonHull} from "d3-polygon";
import * as scales from "d3-scale";

import {largestRect, pointRotate} from "@d3plus/math";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import {shapeConfigFor} from "../features/emitHelpers.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";
import {publishLinkGraph} from "../features/linkInteraction.js";
import {linkWidthRange} from "../features/linkWidths.js";
import {polylinePath} from "../features/polyline.js";
import {
  awayFromAngle,
  isSelfLoop,
  layoutSelfLoops,
  selfLoopReach,
  widestGapAngle,
} from "../features/selfLoops.js";
import type {LoopNode, SelfLoopGeometry} from "../features/selfLoops.js";
import type {FocusBox} from "../features/linkFocus.js";
import {bundleNetworkLinks} from "./bundle.js";
import {minNodeDistance} from "./minNodeDistance.js";
import {graphLinkEnd, resolveGraphLinks, resolveGraphNodes} from "./graph.js";
import type {GraphLink, GraphNode} from "./graph.js";

interface NetworkLayoutNode extends SimulationNodeDatum {
  id: string;
  size?: number;
  shape?: string;
}
interface NetworkLayoutLink extends SimulationLinkDatum<NetworkLayoutNode> {
  size?: number;
}

/** Single laid-out node — accreted across the layout's passes. */
type NetworkNode = GraphNode;
type NetworkLink = GraphLink;

interface RScale {
  (v: number): number;
  domain: (d: [number, number]) => RScale;
  range: ((r: [number, number]) => RScale) & (() => [number, number]);
}

const buildNetworkNodes = (v: Parameters<TransformStage>[0]["viz"]) =>
  resolveGraphNodes(v) as NetworkNode[];
const buildNetworkLinks = resolveGraphLinks as (
  v: Parameters<TransformStage>[0]["viz"],
  nodes: NetworkNode[],
) => NetworkLink[];

/** Runs the d3-force simulation, rotating results to the largest fitting rect. */
function runForceLayout(nodes: NetworkNode[], links: NetworkLink[]): void {
  const linkStrength = scales
    .scaleLinear()
    .domain(extent(links, (d: {size: number}) => d.size) as [number, number])
    .range([0.1, 0.5]);

  const simulation = forceSimulation()
    .force(
      "link",
      forceLink(links as unknown as NetworkLayoutLink[])
        .id((d: SimulationNodeDatum) => (d as NetworkLayoutNode).id)
        .distance(1)
        .strength((d: NetworkLayoutLink) => linkStrength(d.size as number))
        .iterations(4),
    )
    .force("charge", forceManyBody().strength(-1))
    .stop();

  const iterations = 100;
  const alphaMin = 0.001;
  const alphaDecay = 1 - Math.pow(alphaMin, 1 / iterations);
  simulation.velocityDecay(0);
  simulation.alphaMin(alphaMin);
  simulation.alphaDecay(alphaDecay);
  simulation.alphaDecay(0);
  simulation.nodes(nodes);
  simulation.tick(iterations).stop();

  const nodePositions = nodes.map(
    n => [n.vx ?? 0, n.vy ?? 0] as [number, number],
  );
  let angle = 0,
    cx = 0,
    cy = 0;
  if (nodePositions.length === 2) {
    angle = 100;
  } else if (nodePositions.length > 2) {
    const hull = polygonHull(nodePositions) || [];
    const rect = largestRect(hull, {verbose: true})!;
    angle = rect.angle;
    cx = rect.cx;
    cy = rect.cy;
  }

  nodes.forEach(n => {
    const p = pointRotate(
      [n.vx ?? 0, n.vy ?? 0],
      -1 * ((Math.PI / 180) * angle),
      [cx, cy],
    );
    n.fx = p[0];
    n.fy = p[1];
  });
}

/**
    Places `lone` (nodes no link pulls on) in rows under `placed`, as far
    apart as the placed nodes typically sit from their nearest neighbor,
    the rows centered beneath them. Without placed nodes the rows form a
    square-ish grid.
*/
export function placeLoneNodes(
  placed: NetworkNode[],
  lone: NetworkNode[],
): void {
  if (!lone.length) return;
  // The median distance from each placed node to its nearest neighbor.
  const nearest = placed
    .map(n =>
      Math.min(
        ...placed
          .filter(m => m !== n)
          .map(m => Math.hypot(m.fx! - n.fx!, m.fy! - n.fy!)),
      ),
    )
    .filter(d => d > 0 && Number.isFinite(d))
    .sort((a, b) => a - b);
  const step = nearest.length ? nearest[Math.floor(nearest.length / 2)] : 1;
  const xs = placed.map(n => n.fx!);
  const ys = placed.map(n => n.fy!);
  const left = xs.length ? Math.min(...xs) : 0;
  const right = xs.length ? Math.max(...xs) : 0;
  const bottom = ys.length ? Math.max(...ys) : -step;
  const columns = Math.max(
    Math.ceil(Math.sqrt(lone.length)),
    Math.floor((right - left) / step) + 1,
  );
  const center = (left + right) / 2;
  lone.forEach((n, i) => {
    const row = Math.floor(i / columns);
    const inRow = Math.min(columns, lone.length - row * columns);
    n.fx = center + ((i % columns) - (inRow - 1) / 2) * step;
    n.fy = bottom + (row + 1) * step;
  });
}

/**
    Gives every node an `fx`/`fy`: its own x/y, or — when any node lacks
    them — a force-simulated position. Nodes no link pulls on sit out the
    simulation, in rows under the rest (see `placeLoneNodes`). The layout
    depends only on the node ids and links, so its result is cached on
    `v.ctx` and reused by the size legend's pre-layout estimate and the
    layout that follows it. Links from a node to itself don't take part.
*/
function positionNetworkNodes(
  v: Parameters<TransformStage>[0]["viz"],
  nodes: NetworkNode[],
  links: NetworkLink[],
): void {
  if (!nodes.some(n => n.fx === undefined || n.fy === undefined)) return;
  // Only links between two resolved, distinct nodes pull on the layout.
  const pulling = links.filter(l => l.source && l.target && !isSelfLoop(l));
  const key = `${nodes.map(n => n.id).join("\u0000")}|${pulling
    .map(l => `${l.source.id}>${l.target.id}:${l.size}`)
    .join("\u0000")}`;
  const cache = v.ctx.networkForceCache as
    {key: string; positions: [number, number][]} | undefined;
  if (cache && cache.key === key) {
    nodes.forEach((n, i) => {
      n.fx = cache.positions[i][0];
      n.fy = cache.positions[i][1];
    });
    return;
  }
  const linked = new Set(pulling.flatMap(l => [l.source, l.target]));
  const placed = nodes.filter(n => linked.has(n));
  if (placed.length) runForceLayout(placed, pulling);
  placeLoneNodes(
    placed,
    nodes.filter(n => !linked.has(n)),
  );
  v.ctx.networkForceCache = {key, positions: nodes.map(n => [n.fx, n.fy])};
}

/**
    Network's size-legend scale for a chart area of `width` × `height`: the
    same node set, positions, and fitted radius scale the layout builds, run
    on a scratch copy of the nodes. The fit only shrinks as the area does, so
    the layout's final radii never exceed this estimate's.
*/
export function networkSizeLegendScale(
  v: Parameters<TransformStage>[0]["viz"],
  width: number,
  height: number,
): SizeLegendScale | null {
  if (!v._size) return null;
  if (
    !Array.isArray(v._filteredData) ||
    !Array.isArray(v.schema.nodes) ||
    !Array.isArray(v.schema.links)
  )
    return null;
  const nodes = buildNetworkNodes(v);
  if (!nodes.length) return null;
  const {nodeLookup, linkLookup} = v.ctx;
  const links = buildNetworkLinks(v, nodes);
  v.ctx.nodeLookup = nodeLookup;
  v.ctx.linkLookup = linkLookup;
  positionNetworkNodes(v, nodes, links);
  return scaleNetworkNodes(
    v,
    nodes,
    width,
    height,
    links,
  ) as unknown as SizeLegendScale;
}

/**
    The scale from a link's `size` to its stroke width, on the
    linkSizeScale between the widths `linkWidthRange` gives for nodes no
    smaller than `rMin`, or none when every link is the same size (and
    keeps it).
*/
function linkStrokeScale(
  v: Parameters<TransformStage>[0]["viz"],
  links: NetworkLink[],
  rMin: number,
): RScale | null {
  const strokeExtent = extent(links, (d: NetworkLink) => d.size);
  if (strokeExtent[0] === strokeExtent[1]) return null;
  return (scales as unknown as Record<string, () => RScale>)
    [
      `scale${v.schema.linkSizeScale.charAt(0).toUpperCase()}${v.schema.linkSizeScale.slice(1)}`
    ]()
    .domain(strokeExtent as [number, number])
    .range(linkWidthRange(v.schema.linkSizeMin, v.schema.linkSizeMax, rMin));
}

/**
    The boxes (in pixels, at the radii `r` gives) the nodes and their loops
    cover. Loops are laid out as they will draw, at the widest their strokes
    can be before the nodes shrink to fit.
*/
function nodeBoxes(
  v: Parameters<TransformStage>[0]["viz"],
  nodes: NetworkNode[],
  links: NetworkLink[],
  r: RScale,
): FocusBox[] {
  const sized = new Map(
    nodes.map(n => [n.id, {id: n.id, x: n.x ?? 0, y: n.y ?? 0, r: r(n.r)}]),
  );
  const boxes: FocusBox[] = [...sized.values()].map(n => [
    [n.x - n.r, n.y - n.r],
    [n.x + n.r, n.y + n.r],
  ]);
  const stroke = linkStrokeScale(v, links, r.range()[0]);
  const loops = networkLoops(
    nodes,
    links,
    n => sized.get(n.id)!,
    l => (stroke ? stroke(l.size as number) : (l.size as number)),
  );
  for (const {box} of loops.values()) boxes.push(box);
  return boxes;
}

/**
    Positions nodes within bounds and assigns final r/width/height via a
    fitted radius scale. Nodes with a link in `links` to themselves keep
    room for their loops, strokes included.
*/
function scaleNetworkNodes(
  v: Parameters<TransformStage>[0]["viz"],
  nodes: NetworkNode[],
  width: number,
  height: number,
  links: NetworkLink[] = [],
): RScale {
  const xExtent = extent(nodes.map(n => n.fx)) as unknown as [number, number];
  const yExtent = extent(nodes.map(n => n.fy)) as unknown as [number, number];

  const x = scales.scaleLinear().domain(xExtent).range([0, width]);
  const y = scales.scaleLinear().domain(yExtent).range([0, height]);

  const nodeRatio = (xExtent[1] - xExtent[0]) / (yExtent[1] - yExtent[0]) || 1;
  const screenRatio = width / height;

  if (nodeRatio > screenRatio) {
    const h = (height * screenRatio) / nodeRatio;
    y.range([(height - h) / 2, height - (height - h) / 2]);
  } else {
    const w = (width * nodeRatio) / screenRatio;
    x.range([(width - w) / 2, width - (width - w) / 2]);
  }

  nodes.forEach(n => {
    n.x = x(n.fx);
    n.y = y(n.fy);
  });

  const rExtent = extent(nodes.map(n => n.r)) as unknown as [number, number];
  let rMax =
    v.schema.sizeMax ||
    (max([1, (minNodeDistance(nodes) as number) / 2]) as unknown as number);

  const r: RScale = (scales as unknown as Record<string, () => RScale>)
    [
      `scale${v.schema.sizeScale.charAt(0).toUpperCase()}${v.schema.sizeScale.slice(1)}`
    ]()
    .domain(rExtent)
    .range([
      rExtent[0] === rExtent[1]
        ? rMax
        : (min([rMax / 2, v.schema.sizeMin as number]) as number),
      rMax,
    ]);
  const xDomain = x.domain();
  const yDomain = y.domain();

  const xOldSize = xDomain[1] - xDomain[0];
  const yOldSize = yDomain[1] - yDomain[0];

  // Reserve a few px around each node so the hover/active stroke (which grows
  // the outline up to ~3×) isn't clipped by the container edge — a node sitting
  // flush against the bottom/side would otherwise lose a pixel or two of stroke.
  const strokePad = 3;
  for (const [[x0, y0], [x1, y1]] of nodeBoxes(v, nodes, links, r)) {
    xDomain[0] = Math.min(xDomain[0], x.invert(x0 - strokePad));
    xDomain[1] = Math.max(xDomain[1], x.invert(x1 + strokePad));
    yDomain[0] = Math.min(yDomain[0], y.invert(y0 - strokePad));
    yDomain[1] = Math.max(yDomain[1], y.invert(y1 + strokePad));
  }

  const xNewSize = xDomain[1] - xDomain[0];
  const yNewSize = yDomain[1] - yDomain[0];
  rMax *= min([xOldSize / xNewSize, yOldSize / yNewSize])!;
  r.range([
    rExtent[0] === rExtent[1] ? rMax : min([rMax / 2, v.schema.sizeMin]),
    rMax,
  ]);
  x.domain(xDomain);
  y.domain(yDomain);

  const fallbackRadius = (nodeRatio > screenRatio ? width : height) / 2;
  nodes.forEach(n => {
    n.x = x(n.fx);
    n.fx = n.x;
    n.y = y(n.fy);
    n.fy = n.y;
    n.r = r(n.r) || fallbackRadius;
    n.width = n.r * 2;
    n.height = n.r * 2;
  });

  return r;
}

/** Normalizes link stroke sizes onto the linkSizeScale, mutating each link's size. */
function normalizeLinkStrokes(
  v: Parameters<TransformStage>[0]["viz"],
  links: NetworkLink[],
  r: RScale,
): void {
  const strokeScale = linkStrokeScale(v, links, r.range()[0]);
  if (strokeScale)
    links.forEach(link => {
      link.size = strokeScale(link.size as number);
    });
}

/**
    The loops for each link from a node to itself, pointing into the widest
    gap between the node's other links, or away from the middle of the
    network when it has none. A node's loops fan out side by side.
    @param at A node's position and radius.
    @param strokeWidth A loop's stroke width.
*/
function networkLoops(
  nodes: NetworkNode[],
  links: NetworkLink[],
  at: (n: NetworkNode) => LoopNode & {id: string},
  strokeWidth: (l: NetworkLink) => number,
): Map<NetworkLink, SelfLoopGeometry> {
  const loops = links.filter(l => l.datum && isSelfLoop(l));
  if (!loops.length) return new Map();
  const neighbors = new Map<string, [number, number][]>();
  for (const l of links) {
    if (!l.source || !l.target || isSelfLoop(l)) continue;
    for (const [a, b] of [
      [l.source, l.target],
      [l.target, l.source],
    ]) {
      if (!neighbors.has(a.id)) neighbors.set(a.id, []);
      const p = at(b);
      neighbors.get(a.id)!.push([p.x, p.y]);
    }
  }
  const points = nodes.map(at);
  const center: [number, number] = [
    points.reduce((sum, n) => sum + n.x, 0) / points.length,
    points.reduce((sum, n) => sum + n.y, 0) / points.length,
  ];
  return layoutSelfLoops(loops, {
    node: l => at(l.source),
    angle: n =>
      widestGapAngle(
        [n.x, n.y],
        neighbors.get(n.id) ?? [],
        awayFromAngle([n.x, n.y], center),
      ),
    reach: l => selfLoopReach(at(l.source).r),
    strokeWidth,
  });
}

/** Shapes each link from a node to itself as a loop (see `networkLoops`). */
function placeNetworkLoops(nodes: NetworkNode[], links: NetworkLink[]): void {
  const placed = networkLoops(
    nodes,
    links,
    n => ({id: n.id, x: n.x ?? NaN, y: n.y ?? NaN, r: n.r ?? 0}),
    l => l.size as number,
  );
  for (const [link, loop] of placed) link.loop = loop;
}

export const applyNetworkLayout: TransformStage = ({viz}) => {
  const v = viz;
  const {width, height} = chartBounds(v);

  if (!Array.isArray(v._filteredData)) v._filteredData = [];
  if (!Array.isArray(v.schema.nodes)) v.schema.nodes = [];
  if (!Array.isArray(v.schema.links)) v.schema.links = [];

  const nodes = buildNetworkNodes(v);
  const links = buildNetworkLinks(v, nodes);
  publishLinkGraph(
    v,
    links.flatMap(l => (l.datum ? [l.datum] : [])),
    nodes.map(graphLinkEnd),
  );

  positionNetworkNodes(v, nodes, links);

  const r = scaleNetworkNodes(v, nodes, width, height, links);
  v._sizeLegendFinal = v._size ? (r as unknown as SizeLegendScale) : null;
  normalizeLinkStrokes(v, links, r);
  placeNetworkLoops(nodes, links);
  bundleNetworkLinks(v, links);

  const linkConfig = shapeConfigFor(v, "Path", v.schema.shapeConfig, "edge");
  delete linkConfig.on;

  const nodeShapeConfig = {
    label: (d: NetworkNode) =>
      nodes.length <= v.schema.dataCutoff ||
      (v._hover && v._hover(d)) ||
      (v._active && v._active(d))
        ? v._drawLabel(d.data || d.node, d.i)
        : false,
  };
  const linkD = (d: NetworkLink) =>
    d.loop
      ? d.loop.d
      : d.points
        ? polylinePath(d.points)
        : `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`;
  const nodeGroups = Array.from(groups(nodes, d => d.shape));

  v.ctx.networkCtx = {links, linkConfig, linkD, nodeGroups, nodeShapeConfig};
  return {shapeData: nodes as unknown as DataPoint[]};
};
