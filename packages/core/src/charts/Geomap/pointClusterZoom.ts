/**
    How a Geomap's clusters follow the map: zooming draws the level for the
    new zoom scale (a cluster's points move out from its center as it
    splits and into the center of the cluster they merge into), and
    clicking a cluster zooms to it until it splits, or, when it can't
    split before the deepest zoom, fans its points out around it.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {zoomTo} from "../drawSteps/zoomControls.js";
import {fitBounds} from "../drawSteps/zoomFit.js";
import type Viz from "../viz/Viz.js";
import {effectiveDuration} from "../viz/reducedMotion.js";
import {setCursor} from "../viz/setCursor.js";
import {tooltipEnabled} from "../viz/tooltipEnabled.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {GeoZoom} from "./geoHexbinZoom.js";
import {clusterLevelAt} from "./pointCluster.js";
import {CLUSTER_SCENE_KEYS, emitClusterScene} from "./pointClusterEmit.js";
import type {ClusterDraw, ClusterSceneInput} from "./pointClusterEmit.js";
import {geoClusterMeta} from "./pointClusterLayout.js";
import type {GeoClusterMeta, GeoClusterState} from "./pointClusterLayout.js";

type Handler = (d: DataPoint, i: number, x: unknown, event: Event) => unknown;

/** The clusters drawn, if the map draws any. */
export function clusterState(viz: VizInstance): GeoClusterState | undefined {
  return (
    (viz.ctx.geomapCtx as {cluster?: GeoClusterState | null} | undefined)
      ?.cluster ?? undefined
  );
}

/** Whether a scene node belongs to the clustered points' part of the scene. */
const owned = (n: SceneNode) => CLUSTER_SCENE_KEYS.test(String(n.key));

/**
    Swaps the clustered part of a chart scene (its links, points, bubbles,
    and labels) for new nodes, where the old ones were drawn.
    @param scene The chart scene.
    @param nodes The new nodes.
*/
export function replaceClusterNodes(
  scene: SceneNode[],
  nodes: SceneNode[],
): SceneNode[] {
  const at = scene.findIndex(owned);
  const rest = scene.filter(n => !owned(n));
  const cut = at < 0 ? rest.length : at;
  return [...rest.slice(0, cut), ...nodes, ...rest.slice(cut)];
}

/** A node moved to where point `leaf` is drawn in `places`, faded out. */
function fadedAt(
  node: SceneNode,
  places: ClusterDraw["places"],
  leaf: number,
): SceneNode {
  return {
    ...node,
    transform: {
      ...node.transform,
      x: places.at[leaf * 2],
      y: places.at[leaf * 2 + 1],
    },
    paint: {...node.paint, opacity: 0},
  } as SceneNode;
}

/**
    The two scenes that animate a change of clusters. `staged`, drawn at
    once, adds each new node faded out where its first point was drawn
    before; `final`, animated to, draws the new nodes, and each node that
    leaves faded out where its first point is drawn now (until the
    animation ends). Nodes kept through the change animate as they are.
    @param prev The clusters drawn before.
    @param next The clusters drawn now.
*/
export function stageClusterMoves(
  prev: ClusterDraw,
  next: ClusterDraw,
): {staged: SceneNode[]; final: SceneNode[]} {
  const before = new Map(prev.nodes.map(n => [String(n.key), n]));
  const after = new Set(next.nodes.map(n => String(n.key)));
  const leaving = prev.nodes.filter(
    n => !after.has(String(n.key)) && prev.leafOf.has(n),
  );
  const staged = next.nodes.map(n => {
    const kept = before.get(String(n.key));
    if (kept) return kept;
    const leaf = next.leafOf.get(n);
    return leaf === undefined ? n : fadedAt(n, prev.places, leaf);
  });
  return {
    staged: [...leaving, ...staged],
    final: [
      ...leaving.map(n => fadedAt(n, next.places, prev.leafOf.get(n)!)),
      ...next.nodes,
    ],
  };
}

/** The clusters `state` holds, drawn at its level and zoom scale. */
const emitNow = (viz: VizInstance): ClusterDraw =>
  emitClusterScene(viz, viz.ctx.geomapCtx as unknown as ClusterSceneInput);

/**
    Animates the chart from one draw of its clusters to another at the
    same zoom (see `stageClusterMoves`), then drops the nodes that left.
*/
function animateClusters(
  viz: VizInstance,
  state: GeoClusterState,
  prev: ClusterDraw,
  next: ClusterDraw,
  duration: number,
): void {
  const {staged, final} = stageClusterMoves(prev, next);
  viz._chartScene = replaceClusterNodes(viz._chartScene ?? [], staged);
  viz._drawSceneToTarget(0);
  viz._chartScene = replaceClusterNodes(viz._chartScene, final);
  viz._drawSceneToTarget(duration);
  state.timer = setTimeout(() => {
    if (clusterState(viz) !== state || state.drawn !== next) return;
    viz._chartScene = replaceClusterNodes(viz._chartScene ?? [], next.nodes);
    viz._drawSceneToTarget(0);
  }, duration + 20);
}

/**
    Draws the clusters `state` holds again and paints them: at once, or
    animating each point out of or into its cluster over `duration`.
    @param viz The Geomap.
    @param state The clusters.
    @param duration How long the change animates.
*/
export function redrawClusters(
  viz: VizInstance,
  state: GeoClusterState,
  duration: number,
): void {
  if (!viz._chartScene) return;
  clearTimeout(state.timer);
  const prev = state.drawn;
  const next = emitNow(viz);
  state.drawn = next;
  if (duration > 0 && prev) animateClusters(viz, state, prev, next, duration);
  else {
    viz._chartScene = replaceClusterNodes(viz._chartScene, next.nodes);
    viz._drawSceneToTarget(0);
  }
}

/**
    Once an animated zoom has moved the map, draws the clusters of its new
    level, splitting out of (or merging into) the ones of level `from`
    over half the chart's duration.
    @param viz The Geomap.
    @param state The clusters.
    @param from The level drawn before the zoom.
*/
export function revealClusters(
  viz: VizInstance,
  state: GeoClusterState,
  from: number,
): void {
  if (clusterState(viz) !== state || !viz._chartScene) return;
  const to = state.level;
  state.level = from;
  const before = emitNow(viz);
  state.level = to;
  state.drawn = before;
  redrawClusters(viz, state, effectiveDuration(viz) / 2);
}

/**
    The chart's zoom hook while it draws clusters: draws the level for the
    new zoom scale, with every size held in pixels; a change of level
    folds a fanned-out cluster back up. An animated zoom that changes the
    level moves the map without the clusters (which would swell or shrink
    with it), then splits or merges them (see `revealClusters`). Leaves
    the zoom itself to move the map (returns false).
    @param viz The Geomap.
    @param zoom The new zoom.
    @param duration How long the zoom animates.
*/
export function reclusterOnZoom(
  viz: VizInstance,
  zoom: GeoZoom,
  duration: number = 0,
): boolean {
  const state = clusterState(viz);
  if (!state || viz._facetPanels || viz._facetStep || !viz._chartScene)
    return false;
  const level = clusterLevelAt(state.levels, zoom.k);
  if (zoom.k === state.k && level === state.level) return false;
  clearTimeout(state.timer);
  const from = state.level;
  if (level !== from) state.spider = null;
  state.level = level;
  state.k = zoom.k;
  if (level !== from && duration > 0) {
    const links = (state.drawn?.nodes ?? []).filter(n =>
      String(n.key).startsWith("geomap-link-"),
    );
    state.drawn = undefined;
    viz._chartScene = replaceClusterNodes(viz._chartScene, links);
    viz._drawSceneToTarget(0);
    state.timer = setTimeout(
      () => revealClusters(viz, state, from),
      duration + 20,
    );
    return false;
  }
  state.drawn = emitNow(viz);
  viz._chartScene = replaceClusterNodes(viz._chartScene, state.drawn.nodes);
  return false;
}

/** The deepest zoom scale the chart reaches, or 1 when it doesn't zoom. */
function deepestZoom(viz: VizInstance): number {
  const behavior = viz._zoomBehavior as
    {scaleExtent?: () => [number, number]} | undefined;
  return viz.schema.zoom && behavior?.scaleExtent
    ? behavior.scaleExtent()[1]
    : 1;
}

/**
    Zooms to a cluster: to fit its points with room for a bubble at each
    edge, and at least to the scale it splits at, centered on them.
    @param viz The Geomap.
    @param meta The cluster.
    @param kMax The deepest zoom scale.
    @param pad The room kept around the points, in pixels on screen.
*/
function zoomToCluster(
  viz: VizInstance,
  meta: GeoClusterMeta,
  kMax: number,
  pad: number,
): void {
  const ct = viz._chartTransform ?? {};
  const ox = ct.x ?? 0,
    oy = ct.y ?? 0;
  const [[x0, y0], [x1, y1]] = meta.bounds;
  const v = viz as unknown as Viz;
  const box = (m: number): [[number, number], [number, number]] => [
    [x0 + ox - m, y0 + oy - m],
    [x1 + ox + m, y1 + oy + m],
  ];
  const first = x1 > x0 || y1 > y0 ? fitBounds(v, box(0)) : null;
  const fit = first ? fitBounds(v, box(pad / first.k)) : null;
  const k = Math.max(meta.splitK, Math.min(fit?.k ?? kMax, kMax));
  if (fit && k === fit.k) return zoomTo(v, k, fit.x, fit.y);
  const [[a0, b0], [a1, b1]] = viz._zoomBehavior.translateExtent() as [
    [number, number],
    [number, number],
  ];
  zoomTo(
    v,
    k,
    (a0 + a1) / 2 - k * ((x0 + x1) / 2 + ox),
    (b0 + b1) / 2 - k * ((y0 + y1) / 2 + oy),
  );
}

/**
    What clicking a cluster does: zooms to it until it splits, or, when it
    can't split before the deepest zoom (or the map doesn't zoom), fans its
    points out around it; clicking a fanned-out cluster folds it back up.
    In small multiples, nothing. Returns whether `d` is a cluster.
    @param viz The Geomap.
    @param d The clicked row.
*/
export function clusterClick(viz: VizInstance, d: DataPoint): boolean {
  const meta = geoClusterMeta(d);
  const state = clusterState(viz);
  if (!meta) return false;
  if (!state || viz._facetPanels || viz._facetStep) return true;
  if (viz._tooltipClass) viz._tooltipClass.data([]).render();
  const duration = effectiveDuration(viz);
  const kMax = deepestZoom(viz);
  if (state.spider === meta.id || meta.splitK > kMax * (1 + 1e-9)) {
    state.spider = state.spider === meta.id ? null : meta.id;
    redrawClusters(viz, state, duration);
  } else zoomToCluster(viz, meta, kMax, state.bubble(meta.weight));
  return true;
}

/**
    Installs the cluster click (see `clusterClick`), and a pointer cursor
    and a "Click to Expand" note in a cluster's tooltip.
    @param viz The Geomap.
*/
export function installPointClusterEvents(viz: VizInstance): void {
  const on = viz.schema.on as Record<string, Handler | undefined>;
  const click = on["click.shape"];
  on["click.shape"] = (d, i, x, event) => {
    if (clusterClick(viz, d)) {
      event?.stopPropagation?.();
      return;
    }
    return click?.(d, i, x, event);
  };
  const move = on["mousemove.shape"];
  on["mousemove.shape"] = (d, i, x, event) => {
    move?.(d, i, x, event);
    if (!geoClusterMeta(d)) return;
    setCursor(viz, "pointer");
    if (viz._tooltipClass && tooltipEnabled(viz, d, i))
      viz._tooltipClass
        .footer(viz.schema.translate("Click to Expand") as string)
        .render();
  };
}

/**
    Points the chart's zoom hook at its clusters, unless `hexbin` has it.
    Runs before each draw.
    @param viz The Geomap.
*/
export function syncPointCluster(viz: VizInstance): void {
  viz._zoomRescale ??= (zoom, duration) => reclusterOnZoom(viz, zoom, duration);
}
