/**
    Network's `layout: "circle"`: the nodes spaced evenly around a circle,
    ordered so each cluster (or top-level group) sits together, its most
    connected nodes first, which keeps the links between them short. Links
    bow in toward the center, as a chord diagram's ribbons do, and each
    node's label runs outward along its spoke past the circle, flipped
    upright on the left half. A node's loops point outward, its label
    starting past them.
*/

import {extent} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";

import {measureLabel, pointLabelSettings} from "../features/circleLabels.js";
import {
  boxReach,
  fitSpokeFont,
  polarPoint,
  radialFit,
  SPOKE_LABEL_PADDING,
  spokeLines,
  spokePlacement,
} from "../features/spokeLabels.js";
import type {SpokePlacement} from "../features/spokeLabels.js";
import {
  isSelfLoop,
  selfLoopExtent,
  selfLoopReach,
} from "../features/selfLoops.js";
import {linkWidthRange} from "../features/linkWidths.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  naturalCompare,
  nodeDegrees,
  sortArcNodes,
} from "../ArcDiagram/arcGeometry.js";
import type {NodeSort} from "../ArcDiagram/arcGeometry.js";
import type {ClusterState} from "./clusters.js";
import type {GraphLink, GraphNode} from "./graph.js";

type Point = [number, number];

/** How Network places its nodes. */
export type NetworkLayout = "force" | "circle";

/**
    How far a circle layout's links bow toward the center: the share of the
    way from the middle of a link's chord to the center its curve's control
    point sits. 1 bows each link through the center's pull, as a chord
    diagram's ribbons do; 0 draws straight lines.
*/
export const CIRCLE_LINK_BOW = 1;

/** The most a circle layout's node radius takes by default, in pixels. */
export const CIRCLE_NODE_MAX = 16;

/** The share of the space between neighboring nodes a node's radius takes by default. */
export const CIRCLE_NODE_SHARE = 0.4;

/** A node, with everything a circle layout can order it by. */
export interface CircleSortable {
  id: string;
  datum: DataPoint;
  label: string;
  /** Its cluster's rank, or its top-level group, or undefined for none. */
  group?: unknown;
  degree: number;
  /** Its position in `nodes`, which breaks every tie. */
  order: number;
}

/**
    Orders nodes around the circle. With no `sort`, by group (each cluster
    or top-level group together, in order, nodes in none last), then most
    connected first, ties kept in the `nodes` order. Any `nodeSort` that
    ArcDiagram takes (`"data"`, `"label"`, `"group"`, `"degree"`, or a
    comparator of two node rows) overrides it. Returns a new array.
*/
export function sortCircleNodes<T extends CircleSortable>(
  nodes: readonly T[],
  sort: NodeSort | undefined,
): T[] {
  if (sort !== undefined && sort !== null) return sortArcNodes(nodes, sort);
  return [...nodes].sort(
    (a, b) =>
      naturalCompare(a.group, b.group) ||
      b.degree - a.degree ||
      a.order - b.order,
  );
}

/**
    A node's group for the circle's default order: its cluster's rank
    (0 for the largest) while clusters color the chart, else its top
    `groupBy` (or `nodeGroupBy`) level when there are several, else none.
*/
export function circleNodeGroup(v: VizInstance, n: GraphNode): unknown {
  const state = v.ctx.clusterState as ClusterState | undefined;
  if (state?.active) {
    const rank = state.clusters.findIndex(c => c.ids.includes(n.id));
    return rank < 0 ? undefined : rank;
  }
  const top = (list: unknown) =>
    Array.isArray(list) && list.length > 1
      ? (list[0] as (d: DataPoint, i: number) => unknown)
      : undefined;
  const group = top(v.schema.groupBy);
  if (group) return group(n.data, n.i);
  const nodeGroup = top(v.schema.nodeGroupBy);
  return nodeGroup ? nodeGroup(n.node, n.i) : undefined;
}

/** `count` angles spaced evenly around the circle, the first at 12 o'clock, clockwise. */
export function circleAngles(count: number): number[] {
  return Array.from({length: Math.max(0, count)}, (_, k) =>
    count ? (2 * Math.PI * k) / count : 0,
  );
}

/**
    A link's path between two points on the circle, bowed toward `center`:
    a quadratic curve whose control point sits `bow` of the way from the
    middle of the chord to the center, sampled into `steps` straight runs.
*/
export function circleLinkPoints(
  source: Point,
  target: Point,
  center: Point,
  bow = CIRCLE_LINK_BOW,
  steps = 24,
): Point[] {
  const mid: Point = [(source[0] + target[0]) / 2, (source[1] + target[1]) / 2];
  const c: Point = [
    mid[0] + (center[0] - mid[0]) * bow,
    mid[1] + (center[1] - mid[1]) * bow,
  ];
  const n = Math.max(1, Math.round(steps));
  return Array.from({length: n + 1}, (_, k) => {
    const t = k / n;
    const u = 1 - t;
    return [
      u * u * source[0] + 2 * u * t * c[0] + t * t * target[0],
      u * u * source[1] + 2 * u * t * c[1] + t * t * target[1],
    ] as Point;
  });
}

/**
    The circle for `count` nodes in a chart `half` pixels from its center to
    its nearest edge: the room past it for labels (`labelWidth` wide) and
    loops (`loopExtent` past a node's edge) comes off first, then the
    largest node's radius, `sizeMax` or else `CIRCLE_NODE_SHARE` of the
    space between neighbors (at most `CIRCLE_NODE_MAX`). Returns the
    circle's radius, the largest node radius, and the room left for labels.
*/
export function fitCircle(
  half: number,
  count: number,
  labelWidth: number,
  loopExtent = 0,
  sizeMax?: number,
): {radius: number; rMax: number; labelWidth: number} {
  const room = Math.max(0, half - Math.max(0, loopExtent));
  const nodeMax = (radius: number) => {
    if (typeof sizeMax === "number" && sizeMax > 0) return sizeMax;
    const spacing = count > 1 ? 2 * radius * Math.sin(Math.PI / count) : radius;
    return Math.max(1, Math.min(spacing * CIRCLE_NODE_SHARE, CIRCLE_NODE_MAX));
  };
  // The node radius depends on the circle's, so settle the two in turn.
  let fit = radialFit(room, labelWidth, 0);
  let rMax = nodeMax(fit.radius);
  for (let pass = 0; pass < 3; pass++) {
    fit = radialFit(room, labelWidth, rMax);
    rMax = nodeMax(fit.radius);
  }
  const radius = Math.max(0, fit.radius);
  return {
    radius,
    rMax: Math.min(rMax, radius || rMax),
    labelWidth: fit.labelWidth,
  };
}

interface RScale {
  (v: number): number;
  domain: (d: [number, number]) => RScale;
  range: ((r: [number, number]) => RScale) & (() => [number, number]);
}

/** A node's spoke label: its placement, text, and font size. */
export interface CircleLabel {
  place: SpokePlacement;
  text: string;
  fontSize: number;
}

/** What the circle layout hands the emit. */
export interface CircleNetwork {
  center: Point;
  radius: number;
  /** How far from the center the labels' room reaches. */
  outer: number;
  /** Each node id's angle, clockwise from 12 o'clock. */
  thetas: Map<string, number>;
  /** Each node id's label, for the nodes whose text fits (see `placeCircleNetworkLabels`). */
  labels: Map<string, CircleLabel>;
}

/**
    Places the nodes around a circle in a `width` × `height` chart (see
    the module comment), giving each its `x`/`y` (and `fx`/`fy`), its final
    radius `r`, `width`, and `height`, and returns the radius scale (from a
    node's `size` value) with the circle, its labels yet to be placed (see
    `placeCircleNetworkLabels`).
*/
export function layoutCircleNetwork(
  v: VizInstance,
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
): {r: RScale; circle: CircleNetwork} {
  const resolved = links.filter(l => l.source && l.target);
  const degrees = nodeDegrees(resolved);
  const order = new Map((v.schema.nodes as DataPoint[]).map((d, i) => [d, i]));
  const sorted = sortCircleNodes(
    nodes.map(n => ({
      n,
      id: n.id,
      datum: n.data,
      label: `${v._drawLabel(n.data, n.i) ?? ""}`,
      group: circleNodeGroup(v, n),
      degree: degrees.get(n.id) ?? 0,
      order: order.get(n.node) ?? n.i,
    })),
    v.schema.nodeSort as NodeSort | undefined,
  );

  const settings = pointLabelSettings(v);
  const font = {size: settings.fontSize};
  const widest = Math.max(
    0,
    ...sorted.map(s => (s.label ? measureLabel(s.label, font).width : 0)),
  );
  const looped = new Set(
    resolved.filter(l => isSelfLoop(l)).map(l => l.source.id),
  );
  const rawExtent = extent(nodes, n => n.r) as [number, number];
  const sizeMax = v.schema.sizeMax as number | undefined;
  // Past the largest node's radius, its loops (which reach about as far
  // again) and a Rect's corners take room before the labels.
  const hasRect = nodes.some(n => n.shape === "Rect");
  // The widest a loop's stroke can draw: the links' one size, or the
  // widest of the range differing sizes scale to.
  const sizes = extent(resolved, l => l.size) as [number, number];
  const loopStroke = (rMax: number) =>
    sizes[0] === sizes[1]
      ? Number(sizes[0]) || 1
      : linkWidthRange(v.schema.linkSizeMin, v.schema.linkSizeMax, rMax)[1];
  const loopRoom = (rMax: number) =>
    Math.max(
      looped.size ? selfLoopExtent(selfLoopReach(rMax), loopStroke(rMax)) : 0,
      hasRect ? rMax * (Math.SQRT2 - 1) : 0,
    );
  const half = Math.min(width, height) / 2;
  let fit = fitCircle(half, nodes.length, widest, 0, sizeMax);
  if (looped.size || hasRect)
    fit = fitCircle(half, nodes.length, widest, loopRoom(fit.rMax), sizeMax);
  const {radius, rMax} = fit;

  const scaleName = `${v.schema.sizeScale}`;
  const r = (scales as unknown as Record<string, () => RScale>)
    [`scale${scaleName.charAt(0).toUpperCase()}${scaleName.slice(1)}`]()
    .domain(rawExtent)
    .range([
      rawExtent[0] === rawExtent[1]
        ? rMax
        : Math.min(rMax / 2, v.schema.sizeMin as number),
      rMax,
    ]);

  const center: Point = [width / 2, height / 2];
  const angles = circleAngles(sorted.length);
  const thetas = new Map<string, number>();
  sorted.forEach(({n}, k) => {
    const [x, y] = polarPoint(center[0], center[1], angles[k], radius);
    n.x = n.fx = x;
    n.y = n.fy = y;
    n.r = r(n.r) || rMax;
    n.width = n.r * 2;
    n.height = n.r * 2;
    thetas.set(n.id, angles[k]);
  });
  return {
    r,
    circle: {
      center,
      radius,
      outer:
        radius + rMax + loopRoom(rMax) + SPOKE_LABEL_PADDING + fit.labelWidth,
      thetas,
      labels: new Map(),
    },
  };
}

/**
    How far from its center a node's outline, and any loop on it, reach
    along the spoke at `theta`: a circle's radius or where the spoke leaves
    a Rect's box, and the far side of each loop's stroke.
*/
export function nodeSpokeReach(
  n: {
    x?: number;
    y?: number;
    r?: number;
    shape?: string;
    width?: number;
    height?: number;
  },
  theta: number,
  loops: readonly {apex: {x: number; y: number}; strokeWidth: number}[] = [],
): number {
  const r = n.r ?? 0;
  const own =
    n.shape === "Rect"
      ? boxReach(n.width ?? r * 2, n.height ?? r * 2, theta)
      : r;
  const x = n.x ?? 0;
  const y = n.y ?? 0;
  return Math.max(
    own,
    ...loops.map(
      l => Math.hypot(l.apex.x - x, l.apex.y - y) + l.strokeWidth / 2,
    ),
  );
}

/**
    Fills in each node's label on the circle (see `layoutCircleNetwork`):
    along its spoke from just past its outline and its loops out to the
    label ring's edge, wrapping onto as many lines as fit beside its
    neighbors, its font shrunk until its widest word fits. A node whose
    label still doesn't fit, or has less room than two lines' height (or
    its own width, when shorter), gets none.
*/
export function placeCircleNetworkLabels(
  v: VizInstance,
  nodes: GraphNode[],
  links: GraphLink[],
  circle: CircleNetwork,
): void {
  const settings = pointLabelSettings(v);
  const font = {size: settings.fontSize};
  const lineHeight = Math.ceil(settings.fontSize * 1.2) + 1;
  const gap = nodes.length > 1 ? (2 * Math.PI) / nodes.length : 2 * Math.PI;
  const loops = new Map<
    string,
    {apex: {x: number; y: number}; strokeWidth: number}[]
  >();
  for (const l of links) {
    if (!l.loop || !l.source) continue;
    const list = loops.get(l.source.id) ?? [];
    list.push({apex: l.loop.apex, strokeWidth: l.size ?? 0});
    loops.set(l.source.id, list);
  }
  const [cx, cy] = circle.center;
  circle.labels.clear();
  for (const n of nodes) {
    const label = `${v._drawLabel(n.data, n.i) ?? ""}`;
    const theta = circle.thetas.get(n.id);
    if (!label || theta === undefined) continue;
    const from =
      circle.radius +
      nodeSpokeReach(n, theta, loops.get(n.id)) +
      SPOKE_LABEL_PADDING;
    const room = circle.outer - from;
    const own = measureLabel(label, font).width;
    if (room <= 0 || room < Math.min(lineHeight * 2, own)) continue;
    const height = spokeLines(gap, from, lineHeight) * lineHeight;
    const size = fitSpokeFont(label, font, room, height);
    if (size === null) continue;
    circle.labels.set(n.id, {
      place: spokePlacement(cx, cy, theta, from, room, height),
      text: label,
      fontSize: size,
    });
  }
}

/**
    Gives each link between two distinct, placed nodes without a path of
    its own (a bundled one) its curve toward the circle's center (see
    `circleLinkPoints`).
*/
export function curveCircleLinks(links: GraphLink[], center: Point): void {
  for (const l of links) {
    if (!l.source || !l.target || l.points || l.loop || isSelfLoop(l)) continue;
    const s: Point = [l.source.x ?? NaN, l.source.y ?? NaN];
    const t: Point = [l.target.x ?? NaN, l.target.y ?? NaN];
    if (![...s, ...t].every(Number.isFinite)) continue;
    l.points = circleLinkPoints(s, t, center);
  }
}
