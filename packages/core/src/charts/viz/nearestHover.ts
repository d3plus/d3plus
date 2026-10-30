/**
    Nearest-point hover (`hoverDistance`): a pointer over empty space, or over
    something other than a point mark, acts on the closest point mark within
    `hoverDistance` pixels, read off the painted scene through a Voronoi
    diagram.

    @module
*/

import type {PickResult, SceneEvent, SceneNode} from "@d3plus/render";

import {facetPanelAt} from "../facet/facetPanel.js";
import {focusTargets} from "./focusTargets.js";
import type {FocusTarget} from "./focusTargets.js";
import {pointVoronoi} from "./pointVoronoi.js";
import type {PointVoronoi, VoronoiPoint} from "./pointVoronoi.js";
import {nodeShapeType} from "./shapeClassTargets.js";
import type {VizInstance} from "./vizTypes.js";

/** The shape classes that draw a point. */
const POINT_SHAPES = ["Circle", "Rect"];

/** A chart's point-mark Voronoi diagrams, built from one painted scene. */
interface PointIndex {
  scene: unknown;
  /** One diagram per small-multiples panel (keyed by panel key; `""` without panels). */
  panels: Map<string, PointVoronoi<FocusTarget>>;
  /** Every point mark's target, by node key. */
  byKey: Map<string, FocusTarget>;
}

/** Per-chart nearest-hover state: the cached diagrams and the mark the pointer acts on. */
export interface NearestHoverState {
  index?: PointIndex;
  /** The key of the node the pointer resolves to, or null over nothing. */
  key: string | null;
  /** The outer `<svg>` `nearestHoverSurface` listens on, while it does. */
  surface?: {
    el: Element;
    /** Whether an element lies in the empty space around the SVG scene. */
    aroundScene: (el: EventTarget | null) => boolean;
    /** Removes the listeners. */
    unbind: () => void;
  };
}

/**
    Whether a scene node draws a point: a Circle or Rect shape (or another of
    `shapes`) that isn't part of a composite (a Box's rect).
*/
export function isPointShape(
  node: SceneNode,
  shapes: readonly string[] = POINT_SHAPES,
): boolean {
  const shape = nodeShapeType(node);
  return !!shape && shapes.includes(shape) && !node.owners?.length;
}

/**
    The point marks of a painted scene, as Voronoi points: every chart mark
    keyboard navigation could visit (so `::hit` duplicates, inert nodes, and
    marks clipped out by a zoom are left out) that `isPoint` accepts, at its
    surface-space center with its inscribed radius.
    @param nodes The scene root's children (`viz._paintedScene.root.children`).
    @param isPoint Which nodes count as point marks.
*/
export function pointMarkTargets(
  nodes: SceneNode[],
  isPoint: (node: SceneNode) => boolean,
): VoronoiPoint<FocusTarget>[] {
  return focusTargets(nodes)
    .filter(
      t => t.group === "shape" && t.pointIndex === undefined && isPoint(t.node),
    )
    .map(t => ({
      x: t.center[0],
      y: t.center[1],
      r: Math.min(t.box.width, t.box.height) / 2,
      item: t,
    }));
}

/** The pixel reach of nearest-point hover, or 0 when it is off for this chart. */
export function hoverReach(viz: VizInstance): number {
  const distance = Number(viz.schema.hoverDistance);
  if (!(distance > 0) || !viz._pointMark) return 0;
  // Plot's shared tooltip already snaps to the nearest discrete position.
  const discrete = viz.schema.discrete === "x" || viz.schema.discrete === "y";
  if (viz.schema.tooltipShared && discrete) return 0;
  return distance;
}

/** The chart's diagrams for its current painted scene, rebuilt once per paint. */
function pointIndex(viz: VizInstance, state: NearestHoverState): PointIndex {
  const scene = viz._paintedScene;
  if (state.index && state.index.scene === scene) return state.index;
  const isPoint = (node: SceneNode): boolean => !!viz._pointMark?.(node);
  const points = pointMarkTargets(scene?.root.children ?? [], isPoint);
  const groups = new Map<string, VoronoiPoint<FocusTarget>[]>();
  for (const p of points) {
    const key = facetPanelAt(viz, [p.x, p.y])?.key ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const bounds = {
    x: 0,
    y: 0,
    width: Number(viz.schema.width) || 0,
    height: Number(viz.schema.height) || 0,
  };
  const panels = new Map(
    [...groups].map(([key, list]) => [key, pointVoronoi(list, bounds)]),
  );
  const byKey = new Map(points.map(p => [String(p.item.node.key), p.item]));
  state.index = {scene, panels, byKey};
  return state.index;
}

/**
    The painted point mark a picked node stands for, while nearest-point
    hover applies: the mark itself, or the one its `::hit` duplicate
    widens. Undefined for anything else (bars, lines, legend items).
*/
export function pointTarget(
  viz: VizInstance,
  node: SceneNode | null | undefined,
): FocusTarget | undefined {
  if (!node || !hoverReach(viz) || !viz._pointMark!(node)) return undefined;
  const state = (viz._nearestHover ??= {key: null});
  const key = String(node.key).replace(/::hit$/, "");
  return pointIndex(viz, state).byKey.get(key);
}

/**
    The pick the pointer at `point` acts on, in place of `pick`: the nearest
    point mark within `hoverDistance` (in the same small-multiples panel),
    when `pick` is empty or something other than a point mark. A point mark,
    a legend or timeline item, a trend line, or a mark's own label is kept as
    picked, as is everything when nearest-point hover is off.
*/
export function nearestPick(
  viz: VizInstance,
  pick: PickResult | null,
  point: [number, number] | undefined,
): PickResult | null {
  const reach = hoverReach(viz);
  if (!reach || !point) return pick;
  if (pick) {
    const node = pick.node as SceneNode & {interactionGroup?: string};
    if (viz._pointMark!(node)) return pick;
    if (node.interactionGroup && node.interactionGroup !== "axis") return pick;
    if (node.type === "text" && node.datum !== undefined) return pick;
  }
  const state = (viz._nearestHover ??= {key: null});
  const index = pointIndex(viz, state);
  const panel = viz._facetPanels?.length ? facetPanelAt(viz, point) : null;
  if (panel === undefined) return pick;
  const voronoi = index.panels.get(panel?.key ?? "");
  const match = voronoi?.nearest(point[0], point[1], reach);
  if (!match) return pick;
  const node = match.point.item.node;
  return {node, datum: node.datum, index: node.index};
}

/**
    The renderer's pointer bridge: resolves each event's pick through
    `nearestPick` and hands it to `viz._routeSceneEvent`, firing
    mouseleave/mouseenter whenever the mark the pointer resolves to changes
    (in place of the renderer's own, which follow the raw pick). Events that
    don't come from the renderer's pointer listeners pass through unchanged
    apart from the pick.
*/
export function routePointerEvent(viz: VizInstance, event: SceneEvent): void {
  const route = (e: SceneEvent): void => viz._routeSceneEvent?.(e);
  const state = (viz._nearestHover ??= {key: null});
  const native = (event.nativeEvent as Event | undefined)?.type;
  const fromMove = native === "mousemove";
  if (event.type === "mouseenter" || event.type === "mouseleave") {
    // The renderer's own crossing between picks: replaced below.
    if (fromMove) return;
    // Leaving the SVG scene for the empty space around it, which routes its
    // own moves (see `nearestHoverSurface`): not leaving the chart.
    const to = (event.nativeEvent as MouseEvent | undefined)?.relatedTarget;
    if (
      event.type === "mouseleave" &&
      state.surface?.aroundScene(to ?? null) &&
      hoverReach(viz)
    )
      return;
    state.key =
      event.type === "mouseenter" && event.pick
        ? String(event.pick.node.key)
        : null;
    route(event);
    return;
  }
  const pick = nearestPick(viz, event.pick, event.point);
  const resolved = pick === event.pick ? event : {...event, pick};
  if (event.type === "mousemove" && fromMove) {
    const key = pick ? String(pick.node.key) : null;
    if (key !== state.key) {
      const {point, nativeEvent} = event;
      if (state.key !== null)
        route({type: "mouseleave", point, pick: null, nativeEvent});
      state.key = key;
      if (pick) route({type: "mouseenter", point, pick, nativeEvent});
    }
  }
  route(resolved);
}
