/**
    Network's remembered layout and live force simulation.

    A Network remembers where it drew each node. When the nodes or links
    change (a new timeline period, say), the nodes it drew before keep their
    places, new ones enter beside a linked neighbor (see `seedPositions`), and
    a force simulation settles the change. Nodes dropped by a drag stay
    pinned where they were dropped.

    At or under `forceLive` nodes the simulation keeps running after the
    chart paints, one tick per animation frame, re-laying out and repainting
    the chart until it cools, so the layout visibly settles and reacts to a
    dragged node. Larger networks (or reduced motion) settle a change at
    once, before they paint.

    @module
*/

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type {Simulation, SimulationNodeDatum} from "d3-force";

import type {VizInstance} from "../viz/vizTypes.js";
import {motionReduced} from "../viz/reducedMotion.js";
import type {GraphLink, GraphNode} from "./graph.js";
import {
  fitDataPositions,
  graphKey,
  linkSpacing,
  rescalePositions,
  seedPositions,
} from "./livePositions.js";
import type {Bounds, Position} from "./livePositions.js";

/** The node count `forceLive` defaults to. */
export const FORCE_LIVE_DEFAULT = 200;
/** How fast a live simulation cools: about 150 ticks from its start to rest. */
const ALPHA_DECAY = 0.04;
/** The heat a live simulation starts with on its first draw. */
const START_ALPHA = 0.5;
/** The heat a change (new nodes or links) restarts the simulation with. */
const CHANGE_ALPHA = 0.3;
/** The heat a dragged node keeps the simulation at. */
const DRAG_ALPHA = 0.3;
/** How many ticks a large network settles a change in, before it paints. */
const QUICK_TICKS = 120;
/**
    The share of the chart area kept clear around the nodes the data places
    when only some have an `x`/`y`, so the simulated ones fit around them.
*/
const DATA_INSET = 0.1;
/** The room kept between a node and the chart's edge, for its hover outline. */
const EDGE_PAD = 3;

/** A simulated node: its id and the half-size it keeps clear. */
export interface LiveNode extends SimulationNodeDatum {
  id: string;
  /** Half its width. */
  rx: number;
  /** Half its height. */
  ry: number;
}

/** A simulated link, by node ids. */
export interface LiveLink {
  source: string | LiveNode;
  target: string | LiveNode;
}

/** The layout a Network keeps across draws, on `viz.ctx.networkLive`. */
export interface NetworkLive {
  /** Where each node was drawn last, in the chart's pixel space. */
  positions: Map<string, Position>;
  /** Nodes a drag dropped, held where they were dropped. */
  pinned: Map<string, Position>;
  /** The chart area the positions are in. */
  bounds?: Bounds;
  /** The graph (see `graphKey`) the positions were laid out for. */
  key?: string;
  /** Each node's precomputed position on the last full draw. */
  laid?: Map<string, Position>;
  /** Whether the positions differ from the precomputed layout. */
  custom?: boolean;
  /** The running simulation, in live mode. */
  sim?: Simulation<LiveNode, undefined>;
  /** The pending animation frame of the live loop. */
  frame?: number;
  /** Set while a frame of the live loop re-lays the chart out. */
  frameDraw?: boolean;
  /** The node being dragged. */
  dragging?: string;
  /** A click on a pinned node, waiting to see if it is a double-click. */
  clickTimer?: ReturnType<typeof setTimeout>;
  /** Re-runs the chart's layout and emit (set by the chart's `setup`). */
  relayout?: () => void;
}

/** The chart's remembered layout, created on first use. */
export function networkLive(viz: VizInstance): NetworkLive {
  let state = viz.ctx.networkLive as NetworkLive | undefined;
  if (!state)
    viz.ctx.networkLive = state = {positions: new Map(), pinned: new Map()};
  return state;
}

/**
    Whether a network of `count` nodes runs its simulation live: at most
    `forceLive` nodes (`true` for any number, `false` for never), in a
    browser, with motion allowed.
    @param viz The chart.
    @param count The number of nodes.
*/
export function liveForceOn(viz: VizInstance, count: number): boolean {
  const setting = viz.schema.forceLive as number | boolean | undefined;
  if (setting === false || !count) return false;
  const cap =
    setting === true
      ? Infinity
      : typeof setting === "number"
        ? setting
        : FORCE_LIVE_DEFAULT;
  return (
    count <= cap &&
    !viz._ssr &&
    typeof requestAnimationFrame === "function" &&
    typeof document !== "undefined" &&
    !motionReduced(viz)
  );
}

/**
    A force simulation over `nodes` in the chart's pixel space, stopped (it
    is ticked by hand): links pull to `spacing` apart (or just clear of both
    nodes), nodes push each other off and don't overlap, and a weak pull
    toward the middle keeps unlinked groups in view.
    @param nodes The nodes, at their starting positions.
    @param links The links, by node ids.
    @param bounds The chart area.
    @param spacing The distance linked nodes settle at.
*/
export function networkSimulation(
  nodes: LiveNode[],
  links: LiveLink[],
  bounds: Bounds,
  spacing: number,
): Simulation<LiveNode, undefined> {
  const reach = (n: LiveNode) => Math.max(n.rx, n.ry);
  return forceSimulation<LiveNode>(nodes)
    .stop()
    .alphaDecay(ALPHA_DECAY)
    .force(
      "link",
      forceLink<LiveNode, LiveLink & SimulationNodeDatum>(
        links as (LiveLink & SimulationNodeDatum)[],
      )
        .id(d => d.id)
        .distance(l =>
          Math.max(
            spacing,
            reach(l.source as LiveNode) + reach(l.target as LiveNode) + 4,
          ),
        ),
    )
    .force(
      "charge",
      forceManyBody<LiveNode>()
        .strength(-spacing)
        .distanceMax(spacing * 6),
    )
    .force(
      "collide",
      forceCollide<LiveNode>(n => reach(n) + 2),
    )
    .force("x", forceX<LiveNode>(bounds.width / 2).strength(0.03))
    .force("y", forceY<LiveNode>(bounds.height / 2).strength(0.03));
}

/**
    Keeps every free node inside the chart area, `pad` pixels clear of its
    edges (a node too big to fit sits in the middle). Fixed nodes stay put.
    @param nodes The simulated nodes.
    @param bounds The chart area.
    @param pad The room kept at each edge.
*/
export function containLive(
  nodes: readonly LiveNode[],
  bounds: Bounds,
  pad = EDGE_PAD,
): void {
  const clamp = (v: number, half: number, size: number) => {
    const lo = half + pad;
    const hi = size - half - pad;
    return lo > hi ? size / 2 : Math.max(lo, Math.min(hi, v));
  };
  for (const n of nodes) {
    if (n.fx !== undefined && n.fx !== null) continue;
    n.x = clamp(n.x ?? 0, n.rx, bounds.width);
    n.y = clamp(n.y ?? 0, n.ry, bounds.height);
  }
}

/** Builds the simulation for this draw's nodes, starting at `positions`. */
function buildSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  positions: Map<string, Position>,
  fixed: Map<string, Position>,
  bounds: Bounds,
): Simulation<LiveNode, undefined> {
  const simNodes: LiveNode[] = nodes.map(n => {
    const at = fixed.get(n.id) ?? positions.get(n.id)!;
    const half = (size: number | undefined) => (size ?? n.r * 2) / 2;
    return {
      id: n.id,
      x: at.x,
      y: at.y,
      rx: half(n.width),
      ry: half(n.height),
      ...(fixed.has(n.id) ? {fx: at.x, fy: at.y} : {}),
    };
  });
  const ids = new Set(nodes.map(n => n.id));
  const simLinks: LiveLink[] = links.flatMap(l =>
    l.source &&
    l.target &&
    l.source !== l.target &&
    ids.has(l.source.id) &&
    ids.has(l.target.id)
      ? [{source: l.source.id, target: l.target.id}]
      : [],
  );
  // Spaced as the precomputed layout spaces linked nodes.
  const spacing = linkSpacing(nodes, links);
  const sim = networkSimulation(simNodes, simLinks, bounds, spacing);
  containLive(simNodes, bounds);
  return sim;
}

/** The pinned nodes still in the graph. */
function fixedPositions(
  state: NetworkLive,
  nodes: GraphNode[],
): Map<string, Position> {
  const ids = new Set(nodes.map(n => n.id));
  const fixed = new Map<string, Position>();
  for (const [id, p] of state.pinned) if (ids.has(id)) fixed.set(id, p);
  return fixed;
}

/** Moves the remembered positions (and the simulation) into a resized chart area. */
function resize(state: NetworkLive, bounds: Bounds): void {
  if (!state.bounds) return;
  const from = state.bounds;
  if (from.width === bounds.width && from.height === bounds.height) return;
  state.positions = rescalePositions(state.positions, from, bounds);
  state.pinned = rescalePositions(state.pinned, from, bounds);
}

/**
    Places this draw's nodes (see the module notes), writing each node's
    `x`/`y` (and `fx`/`fy`). The nodes arrive at their precomputed layout's
    positions, fitted to the chart area. Returns whether any node ended up
    elsewhere, so the caller leaves the positions as they are rather than
    refitting them. Small multiples lay each panel out afresh instead.
    @param viz The chart.
    @param nodes The nodes, at their precomputed positions.
    @param links The links.
    @param bounds The chart area.
    @param dataCoords The `x`/`y` the data gives each node that has one.
*/
export function placeNetworkNodes(
  viz: VizInstance,
  nodes: GraphNode[],
  links: GraphLink[],
  bounds: Bounds,
  dataCoords: Map<string, [number, number]>,
): boolean {
  if (viz._facetStep) return false;
  const state = networkLive(viz);
  resize(state, bounds);
  state.bounds = bounds;
  if (state.frameDraw && state.sim) {
    applyPositions(nodes, state.positions);
    return true;
  }
  state.laid = new Map(nodes.map(n => [n.id, {x: n.x ?? 0, y: n.y ?? 0}]));
  const hot = state.sim && state.sim.alpha() >= state.sim.alphaMin();
  const heat = state.sim?.alpha() ?? 0;
  stopLiveLoop(viz);
  state.sim = undefined;
  const key = graphKey(nodes, links);
  const first = state.key === undefined;
  const changed = !first && key !== state.key;
  state.key = key;
  // With every node placed by the data there is nothing to simulate.
  const allData = dataCoords.size > 0 && dataCoords.size === nodes.length;
  const live = liveForceOn(viz, nodes.length) && !allData;
  const fixed = fixedPositions(state, nodes);
  if (live && dataCoords.size) {
    const pad = Math.max(
      Math.max(0, ...nodes.map(n => n.r)) + EDGE_PAD,
      Math.min(bounds.width, bounds.height) * DATA_INSET,
    );
    for (const [id, p] of fitDataPositions(dataCoords, bounds, pad))
      if (!fixed.has(id)) fixed.set(id, p);
  }
  const seeded =
    (live || changed || state.custom) && !first
      ? seedPositions(nodes, links, state.positions).positions
      : seedPositions(nodes, links, new Map()).positions;
  for (const [id, p] of fixed) seeded.set(id, p);
  if (live) {
    const sim = buildSimulation(nodes, links, seeded, fixed, bounds);
    const alpha = first ? START_ALPHA : changed ? CHANGE_ALPHA : hot ? heat : 0;
    sim.alpha(alpha);
    state.sim = sim;
    for (const n of sim.nodes()) seeded.set(n.id, {x: n.x!, y: n.y!});
    if (alpha >= sim.alphaMin()) scheduleFrame(viz);
  } else if (changed && nodes.some(n => state.positions.has(n.id))) {
    // A large network settles the change before it paints.
    const sim = buildSimulation(nodes, links, seeded, fixed, bounds);
    sim.alpha(CHANGE_ALPHA);
    for (let i = 0; i < QUICK_TICKS; i++) sim.tick();
    containLive(sim.nodes(), bounds);
    for (const n of sim.nodes()) seeded.set(n.id, {x: n.x!, y: n.y!});
  }
  state.custom = live || fixed.size > 0 || (state.custom && !first) || changed;
  if (!state.custom) return false;
  applyPositions(nodes, seeded);
  return state.custom;
}

/** Writes each node's position. */
function applyPositions(
  nodes: GraphNode[],
  positions: ReadonlyMap<string, Position>,
): void {
  for (const n of nodes) {
    const p = positions.get(n.id);
    if (!p) continue;
    n.x = n.fx = p.x;
    n.y = n.fy = p.y;
  }
}

/** Remembers where each node was drawn. */
export function rememberPositions(viz: VizInstance, nodes: GraphNode[]): void {
  if (viz._facetStep) return;
  const state = networkLive(viz);
  state.positions = new Map(
    nodes.map(n => [n.id, {x: n.x ?? 0, y: n.y ?? 0}] as const),
  );
}

/** Asks for the next frame of the live loop. */
export function scheduleFrame(viz: VizInstance): void {
  const state = networkLive(viz);
  if (state.frame !== undefined || typeof requestAnimationFrame !== "function")
    return;
  state.frame = requestAnimationFrame(() => liveFrame(viz));
}

/**
    Asks for the chart to be re-laid out at the remembered positions on the
    next frame: the next tick of the live loop, or a plain repaint.
*/
export function scheduleRedraw(viz: VizInstance): void {
  const state = networkLive(viz);
  if (state.sim) {
    scheduleFrame(viz);
    return;
  }
  if (state.frame !== undefined) return;
  if (typeof requestAnimationFrame !== "function") {
    redrawPositions(viz);
    return;
  }
  state.frame = requestAnimationFrame(() => {
    state.frame = undefined;
    redrawPositions(viz);
  });
}

/** Cancels the live loop's pending frame. */
export function stopLiveLoop(viz: VizInstance): void {
  const state = viz.ctx.networkLive as NetworkLive | undefined;
  if (state?.frame === undefined) return;
  if (typeof cancelAnimationFrame === "function")
    cancelAnimationFrame(state.frame);
  state.frame = undefined;
}

/** Stops the live simulation and its loop (chart teardown). */
export function stopLive(viz: VizInstance): void {
  stopLiveLoop(viz);
  const state = viz.ctx.networkLive as NetworkLive | undefined;
  if (!state) return;
  state.sim = undefined;
  clearTimeout(state.clickTimer);
}

/** Re-lays the chart out at the remembered positions and repaints it at once. */
export function redrawPositions(viz: VizInstance): void {
  const state = networkLive(viz);
  if (!state.relayout || !viz._sceneRenderer) return;
  state.frameDraw = true;
  try {
    state.relayout();
  } finally {
    state.frameDraw = false;
  }
  viz._drawSceneToTarget(0);
}

/**
    One frame of the live loop: a tick of the simulation, then the chart
    re-laid out and repainted at the new positions. It waits out an animated
    transition (so it doesn't cut one short) and stops once the simulation
    cools, unless a node is being dragged, or when the chart has no scene.
*/
function liveFrame(viz: VizInstance): void {
  const state = networkLive(viz);
  state.frame = undefined;
  const sim = state.sim;
  if (!sim || !viz._sceneRenderer || !state.bounds) return;
  if (viz._transitionEndsAt && Date.now() < viz._transitionEndsAt) {
    scheduleFrame(viz);
    return;
  }
  sim.tick();
  containLive(sim.nodes(), state.bounds);
  for (const n of sim.nodes())
    state.positions.set(n.id, {x: n.x ?? 0, y: n.y ?? 0});
  redrawPositions(viz);
  if (state.dragging !== undefined || sim.alpha() >= sim.alphaMin())
    scheduleFrame(viz);
}

/** Heats the live simulation for a drag, or cools it again after. */
export function dragHeat(viz: VizInstance, dragging: boolean): void {
  const sim = networkLive(viz).sim;
  if (!sim) return;
  sim.alphaTarget(dragging ? DRAG_ALPHA : 0);
  if (dragging) sim.alpha(Math.max(sim.alpha(), DRAG_ALPHA));
  scheduleFrame(viz);
}

/**
    Re-heats the live simulation (after a node is let go), or — without
    one — repaints the chart at the remembered positions.
*/
export function reheat(viz: VizInstance): void {
  const sim = networkLive(viz).sim;
  if (!sim) {
    redrawPositions(viz);
    return;
  }
  sim.alpha(Math.max(sim.alpha(), CHANGE_ALPHA));
  scheduleFrame(viz);
}
