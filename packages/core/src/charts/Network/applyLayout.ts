/**
    `applyNetworkLayout` — Network's chart-specific layout stage.

    Resolves nodes + links into a single laid-out node array (running a
    d3-force simulation only when fx/fy coords are missing), normalizes
    link stroke sizes, and stashes `networkCtx` + node/link lookups on
    `viz.ctx` for the click/hover handlers installed by `setup`.
*/

import {extent, min, groups} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import {shapeConfigFor} from "../features/emitHelpers.js";
import {rectNodeSize, sizeRectNodes} from "../features/rectNodeSize.js";
import type {RectSizeConfig} from "../features/rectNodeSize.js";
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
import {containNodes} from "./containNodes.js";
import type {NodeReach} from "./containNodes.js";
import {forceLayout} from "./forceLayout.js";
import {minNodeDistance} from "./minNodeDistance.js";
import {placeNetworkNodes, rememberPositions, stopLive} from "./liveForce.js";
import {graphLinkEnd, resolveGraphLinks, resolveGraphNodes} from "./graph.js";
import {
  curveCircleLinks,
  layoutCircleNetwork,
  linkBowOf,
  placeCircleNetworkLabels,
} from "./circleLayout.js";
import type {GraphLink, GraphNode} from "./graph.js";

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
    Returns whether the layout placed the nodes.
*/
function positionNetworkNodes(
  v: Parameters<TransformStage>[0]["viz"],
  nodes: NetworkNode[],
  links: NetworkLink[],
): boolean {
  if (!nodes.some(n => n.fx === undefined || n.fy === undefined)) return false;
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
    return true;
  }
  const linked = new Set(pulling.flatMap(l => [l.source, l.target]));
  const placed = nodes.filter(n => linked.has(n));
  if (placed.length) forceLayout(placed, pulling);
  placeLoneNodes(
    placed,
    nodes.filter(n => !linked.has(n)),
  );
  v.ctx.networkForceCache = {key, positions: nodes.map(n => [n.fx, n.fy])};
  return true;
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
  if (v.schema.layout === "circle")
    return layoutCircleNetwork(v, nodes, links, width, height)
      .r as unknown as SizeLegendScale;
  const laidOut = positionNetworkNodes(v, nodes, links);
  return scaleNetworkNodes(
    v,
    nodes,
    width,
    height,
    links,
    laidOut,
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
    The boxes (in pixels, at the radii `r` gives) the nodes (a Rect node's
    own box) and their loops cover. Loops are laid out as they will draw, at the widest their strokes
    can be before the nodes shrink to fit.
*/
function nodeBoxes(
  v: Parameters<TransformStage>[0]["viz"],
  nodes: NetworkNode[],
  links: NetworkLink[],
  r: RScale,
): FocusBox[] {
  const rect = shapeConfigFor(v, "Rect") as RectSizeConfig;
  // A Rect node reaches as far as its box, and its loops leave that box.
  const sized = new Map(
    nodes.map(n => {
      const radius = r(n.r);
      const [width, height] =
        n.shape === "Rect"
          ? rectNodeSize(rect, n, radius)
          : [radius * 2, radius * 2];
      const at = {x: n.x ?? 0, y: n.y ?? 0};
      return [
        n.id,
        {id: n.id, ...at, r: radius, shape: n.shape, width, height},
      ];
    }),
  );
  const boxes: FocusBox[] = [...sized.values()].map(n => [
    [n.x - n.width / 2, n.y - n.height / 2],
    [n.x + n.width / 2, n.y + n.height / 2],
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

/** The share of the chart's smaller side a node's radius can reach. */
const MAX_RADIUS_SHARE = 1 / 12;

/**
    The largest node radius a layout leaves room for, before the fit to the
    chart: half the distance between the closest two nodes (at least 1),
    and no more than a twelfth of the chart's smaller side, so a network of
    few nodes doesn't draw them huge.
    @param minDistance The distance between the closest two nodes, or
    undefined for a single node.
    @param width The chart area's width.
    @param height The chart area's height.
*/
export function layoutMaxRadius(
  minDistance: number | undefined,
  width: number,
  height: number,
): number {
  const spacing =
    minDistance === undefined ? Infinity : Math.max(1, minDistance / 2 || 0);
  return Math.min(spacing, Math.min(width, height) * MAX_RADIUS_SHARE);
}

/**
    The share a node's radius keeps when the fit widens an axis's domain
    from `before` to `after` to make room for the nodes. An axis the nodes
    don't spread along (they sit in one row or column) keeps them at its
    middle, so the radius only shrinks when the `needed` pixels exceed the
    `available` ones.
    @param before The domain's size before the fit.
    @param after The domain's size after it.
    @param spread The nodes' largest domain size on either axis.
    @param needed The pixels the nodes and their loops cover on the axis.
    @param available The chart's pixels on the axis.
*/
export function axisFitShare(
  before: number,
  after: number,
  spread: number,
  needed: number,
  available: number,
): number {
  if (before > spread * 1e-9) return before / after;
  return needed > available ? available / needed : 1;
}

/**
    Positions nodes within bounds and assigns final r/width/height via a
    fitted radius scale. Nodes with a link in `links` to themselves keep
    room for their loops, strokes included. Nodes the force layout placed
    (`laidOut`) are capped by `layoutMaxRadius` and fit by `axisFitShare`;
    nodes at their data's x/y are sized by their spacing alone.
*/
function scaleNetworkNodes(
  v: Parameters<TransformStage>[0]["viz"],
  nodes: NetworkNode[],
  width: number,
  height: number,
  links: NetworkLink[] = [],
  laidOut = false,
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
  const minDistance = minNodeDistance(nodes);
  let rMax =
    v.schema.sizeMax ||
    (laidOut
      ? layoutMaxRadius(minDistance, width, height)
      : Math.max(1, (minDistance ?? 0) / 2 || 0));

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
  const reach = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [[x0, y0], [x1, y1]] of nodeBoxes(v, nodes, links, r)) {
    xDomain[0] = Math.min(xDomain[0], x.invert(x0 - strokePad));
    xDomain[1] = Math.max(xDomain[1], x.invert(x1 + strokePad));
    yDomain[0] = Math.min(yDomain[0], y.invert(y0 - strokePad));
    yDomain[1] = Math.max(yDomain[1], y.invert(y1 + strokePad));
    reach[0] = Math.min(reach[0], x0 - strokePad);
    reach[1] = Math.min(reach[1], y0 - strokePad);
    reach[2] = Math.max(reach[2], x1 + strokePad);
    reach[3] = Math.max(reach[3], y1 + strokePad);
  }

  const xNewSize = xDomain[1] - xDomain[0];
  const yNewSize = yDomain[1] - yDomain[0];
  const spread = Math.max(xOldSize, yOldSize);
  rMax *= laidOut
    ? Math.min(
        axisFitShare(xOldSize, xNewSize, spread, reach[2] - reach[0], width),
        axisFitShare(yOldSize, yNewSize, spread, reach[3] - reach[1], height),
      )
    : min([xOldSize / xNewSize, yOldSize / yNewSize])!;
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
    network when it has none (or always away from `center`, when given). A
    node's loops fan out side by side.
    @param at A node's position and radius.
    @param strokeWidth A loop's stroke width.
    @param center The point every loop points away from, instead.
*/
function networkLoops(
  nodes: NetworkNode[],
  links: NetworkLink[],
  at: (n: NetworkNode) => LoopNode & {id: string},
  strokeWidth: (l: NetworkLink) => number,
  center?: [number, number],
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
  const middle: [number, number] = [
    points.reduce((sum, n) => sum + n.x, 0) / points.length,
    points.reduce((sum, n) => sum + n.y, 0) / points.length,
  ];
  return layoutSelfLoops(loops, {
    node: l => at(l.source),
    angle: n =>
      center
        ? awayFromAngle([n.x, n.y], center)
        : widestGapAngle(
            [n.x, n.y],
            neighbors.get(n.id) ?? [],
            awayFromAngle([n.x, n.y], middle),
          ),
    reach: l => selfLoopReach(at(l.source).r),
    strokeWidth,
  });
}

/**
    Shapes each link from a node to itself as a loop (see `networkLoops`),
    pointing away from `center` when given.
*/
function placeNetworkLoops(
  nodes: NetworkNode[],
  links: NetworkLink[],
  center?: [number, number],
): void {
  const placed = networkLoops(
    nodes,
    links,
    n => ({
      id: n.id,
      x: n.x ?? NaN,
      y: n.y ?? NaN,
      r: n.r ?? 0,
      shape: n.shape,
      width: n.width,
      height: n.height,
    }),
    l => l.size as number,
    center,
  );
  for (const [link, loop] of placed) link.loop = loop;
}

/**
    Moves the nodes in (see `containNodes`) when a box or loop reaches past
    the chart's edge: a Rect node's set size doesn't shrink with the radius
    scale the fit settles. Returns whether any node moved.
*/
function keepNodesInside(
  nodes: NetworkNode[],
  links: NetworkLink[],
  width: number,
  height: number,
): boolean {
  const reach = new Map<string, NodeReach>(
    nodes.map(n => {
      const x = n.x ?? 0,
        y = n.y ?? 0;
      const w = (n.width ?? (n.r ?? 0) * 2) / 2,
        h = (n.height ?? (n.r ?? 0) * 2) / 2;
      return [n.id, {x, y, left: w, right: w, top: h, bottom: h}];
    }),
  );
  for (const l of links) {
    const at = l.loop && reach.get(l.source.id);
    if (!at) continue;
    const [[x0, y0], [x1, y1]] = l.loop!.box;
    at.left = Math.max(at.left, at.x - x0);
    at.right = Math.max(at.right, x1 - at.x);
    at.top = Math.max(at.top, at.y - y0);
    at.bottom = Math.max(at.bottom, y1 - at.y);
  }
  // The same room the fit keeps for a hovered node's thicker outline.
  const {scale, dx, dy} = containNodes([...reach.values()], width, height, 3);
  if (scale === 1 && dx === 0 && dy === 0) return false;
  nodes.forEach(n => {
    n.x = n.fx = (n.x ?? 0) * scale + dx;
    n.y = n.fy = (n.y ?? 0) * scale + dy;
  });
  return true;
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

  const circle =
    v.schema.layout === "circle"
      ? layoutCircleNetwork(v, nodes, links, width, height)
      : undefined;
  // The `x`/`y` the data gives, before the layout fills every node's in.
  const dataCoords = new Map(
    nodes.flatMap(n =>
      Number.isFinite(n.fx) && Number.isFinite(n.fy)
        ? [[n.id, [n.fx, n.fy] as [number, number]] as const]
        : [],
    ),
  );
  const laidOut = !circle && positionNetworkNodes(v, nodes, links);
  if (circle) stopLive(v);

  const r = circle
    ? circle.r
    : scaleNetworkNodes(v, nodes, width, height, links, laidOut);
  v._sizeLegendFinal = v._size ? (r as unknown as SizeLegendScale) : null;
  sizeRectNodes(v, nodes);
  // Nodes kept where they were drawn, dropped, or simulated stay put.
  const placed =
    !circle && placeNetworkNodes(v, nodes, links, {width, height}, dataCoords);
  normalizeLinkStrokes(v, links, r);
  placeNetworkLoops(nodes, links, circle?.circle.center);
  if (!circle && !placed && keepNodesInside(nodes, links, width, height))
    placeNetworkLoops(nodes, links);
  if (!circle) rememberPositions(v, nodes);
  if (circle) placeCircleNetworkLabels(v, nodes, links, circle.circle);
  bundleNetworkLinks(v, links);
  if (circle)
    curveCircleLinks(links, circle.circle.center, linkBowOf(v.schema.linkBow));

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

  v.ctx.networkCtx = {
    links,
    linkConfig,
    linkD,
    nodeGroups,
    nodeShapeConfig,
    circle: circle?.circle,
  };
  return {shapeData: nodes as unknown as DataPoint[]};
};
