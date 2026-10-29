/**
    The marks keyboard navigation moves between, read off a painted scene,
    and the spatial rules for moving from one to the next.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {Bounds} from "@d3plus/math";
import type {SceneNode, Transform} from "@d3plus/render";

import {mapBox, mapper, ownBoxes} from "../features/sceneBounds.js";
import {MARK_TYPES} from "./sceneRows.js";

/** A data mark (or one point of a Line/Area) keyboard focus can rest on. */
export interface FocusTarget {
  /** Unique within a scene: the node's key, plus `@<point>` for a series point. */
  id: string;
  /** The scene node an event over this target picks. */
  node: SceneNode;
  /** Which of the node's `interactionPoints` this target is, for a series point. */
  pointIndex?: number;
  /** The target's center, in surface coordinates. */
  center: [number, number];
  /** The target's bounding box, in surface coordinates (zero-size for a series point). */
  box: Bounds;
  /** Whether events over it route to the chart's shape or legend handlers. */
  group: "shape" | "legend";
  /** The transforms above the node, outermost first (not its own). */
  chain: Transform[];
}

/** The arrow-key directions. */
export type FocusDirection = "up" | "down" | "left" | "right";

/** Root groups that hold navigable marks, and the handler group each routes to. */
const ROOT_GROUPS: Record<string, FocusTarget["group"]> = {
  "viz-chart-cells": "shape",
  "viz-legend": "legend",
};

/** Interaction groups that are chart chrome rather than data marks. */
const CHROME_GROUPS = new Set(["axis", "timeline", "trend"]);

/** Whether a node (and everything inside it) is out of keyboard reach. */
function skipped(node: SceneNode): boolean {
  const n = node as SceneNode & {interactionGroup?: string};
  return (
    String(n.key).endsWith("::hit") ||
    n.interactive === false ||
    !!n.aria?.hidden ||
    (n.interactionGroup !== undefined && CHROME_GROUPS.has(n.interactionGroup))
  );
}

/** The source row a node's datum wraps, so a mark drawn twice counts once. */
function rowOf(datum: unknown): unknown {
  const raw = datum as {data?: unknown} | undefined;
  return raw && raw.data ? raw.data : raw;
}

/** The box around a list of boxes. */
function union(boxes: Bounds[]): Bounds {
  const x = Math.min(...boxes.map(b => b.x)),
    y = Math.min(...boxes.map(b => b.y));
  const x2 = Math.max(...boxes.map(b => b.x + b.width)),
    y2 = Math.max(...boxes.map(b => b.y + b.height));
  return {x, y, width: x2 - x, height: y2 - y};
}

/** Whether a point lies within a box, give or take a pixel. */
const inside = ([x, y]: [number, number], b: Bounds): boolean =>
  x >= b.x - 1 &&
  x <= b.x + b.width + 1 &&
  y >= b.y - 1 &&
  y <= b.y + b.height + 1;

const finite = (b: Bounds): boolean =>
  [b.x, b.y, b.width, b.height].every(Number.isFinite);

/** One target per series point of a Line/Area node. */
function pointTargets(
  node: SceneNode,
  chain: Transform[],
  group: FocusTarget["group"],
  seen: Set<unknown>,
): FocusTarget[] {
  const map = mapper(chain);
  const out: FocusTarget[] = [];
  (node.interactionPoints || []).forEach((p, pointIndex) => {
    if (seen.has(p.datum)) return;
    seen.add(p.datum);
    const center = map([p.x, p.y]);
    const box = {x: center[0], y: center[1], width: 0, height: 0};
    if (!finite(box)) return;
    const id = `${node.key}@${pointIndex}`;
    out.push({id, node, pointIndex, center, box, group, chain});
  });
  return out;
}

/** The target for a single mark, or null when it has no finite geometry. */
function markTarget(
  node: SceneNode,
  chain: Transform[],
  group: FocusTarget["group"],
): FocusTarget | null {
  const full = node.transform ? [...chain, node.transform] : chain;
  const map = mapper(full);
  const boxes = ownBoxes(node)
    .filter(finite)
    .map(b => mapBox(b, map));
  if (!boxes.length) return null;
  const box = union(boxes);
  // A path's boxes are its outline's vertices; their mean sits inside a
  // curved shape (a pie wedge) more often than its bounding box's center.
  const center: [number, number] =
    node.type === "path"
      ? [
          boxes.reduce((s, b) => s + b.x, 0) / boxes.length,
          boxes.reduce((s, b) => s + b.y, 0) / boxes.length,
        ]
      : [box.x + box.width / 2, box.y + box.height / 2];
  return {id: String(node.key), node, center, box, group, chain};
}

/**
    Sorts targets left to right by their left edge, then top to bottom: bars
    and series points read along the x axis, a stack or a vertical legend
    reads downward, and a treemap starts at its top-left cell.
*/
export function readingOrder(targets: FocusTarget[]): FocusTarget[] {
  return [...targets].sort(
    (a, b) =>
      Math.round(a.box.x) - Math.round(b.box.x) ||
      Math.round(a.box.y) - Math.round(b.box.y),
  );
}

/**
    Every mark keyboard focus can visit in a painted scene, chart marks first
    and then legend items, each in reading order (see `readingOrder`).
    Visits the chart cells and the legend only (not the colorScale, timeline,
    or chrome), skipping `::hit` duplicates, inert or aria-hidden nodes,
    text, axis/trend chrome, nodes without a datum, and marks a rectangular
    clip hides (a zoomed chart's off-screen marks). A Line or Area node
    becomes one target per point, and a row drawn by several nodes counts
    once.
    @param nodes The scene root's children (`viz._paintedScene.root.children`).
*/
export function focusTargets(nodes: SceneNode[]): FocusTarget[] {
  const lists: Record<FocusTarget["group"], FocusTarget[]> = {
    shape: [],
    legend: [],
  };
  for (const top of nodes) {
    const group = ROOT_GROUPS[String(top.key)];
    if (!group) continue;
    const seen = new Set<unknown>();
    const walk = (node: SceneNode, chain: Transform[], clips: Bounds[]) => {
      if (skipped(node)) return;
      if (node.type === "group") {
        const next = node.transform ? [...chain, node.transform] : chain;
        const clip = node.clip;
        const inner =
          clip && clip.type === "rect"
            ? [...clips, mapBox(clip, mapper(next))]
            : clips;
        for (const child of node.children) walk(child, next, inner);
        return;
      }
      if (!MARK_TYPES.has(node.type) || node.datum === undefined) return;
      if (node.paint?.opacity === 0) return;
      const visible = (t: FocusTarget): boolean =>
        clips.every(c => inside(t.center, c));
      if (node.interactionPoints?.length) {
        const points = pointTargets(node, chain, group, seen);
        lists[group].push(...points.filter(visible));
        return;
      }
      const row = rowOf(node.datum as DataPoint);
      if (seen.has(row)) return;
      const target = markTarget(node, chain, group);
      if (!target || !visible(target)) return;
      seen.add(row);
      lists[group].push(target);
    };
    walk(top, [], []);
  }
  return [...readingOrder(lists.shape), ...readingOrder(lists.legend)];
}

/** The vertical (or horizontal) overlap of two boxes, in pixels. */
function overlap(a: Bounds, b: Bounds, axis: "x" | "y"): number {
  const size = axis === "x" ? "width" : "height";
  return (
    Math.min(a[axis] + a[size], b[axis] + b[size]) - Math.max(a[axis], b[axis])
  );
}

/** The axis a Line/Area node's points run along: the one they spread farther across. */
function seriesAxis(node: SceneNode): "x" | "y" {
  const points = node.interactionPoints || [];
  const spread = (k: "x" | "y"): number =>
    Math.max(...points.map(p => p[k])) - Math.min(...points.map(p => p[k]));
  return spread("x") >= spread("y") ? "x" : "y";
}

/**
    The target an arrow key moves to from `current`: the nearest one in that
    direction whose center lies within a 45° cone of it, where two marks that
    overlap across the direction of travel (bars sharing a baseline, cells
    in one row) count as level with each other. Without one in the cone, the
    nearest center anywhere in that half-plane. Returns `current` when
    nothing lies that way, and the first target when there is no current
    one. Moving along a series (Line/Area points), its own next point counts
    as level, so the series is followed rather than a neighbor's point.
*/
export function nextTarget(
  targets: FocusTarget[],
  current: FocusTarget | null | undefined,
  direction: FocusDirection,
): FocusTarget | null {
  if (!current) return targets[0] ?? null;
  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "right" || direction === "down" ? 1 : -1;
  const across = horizontal ? "y" : "x";
  const alongSeries =
    current.pointIndex !== undefined &&
    seriesAxis(current.node) === (horizontal ? "x" : "y");
  let cone: FocusTarget | null = null,
    coneScore = Infinity;
  let plane: FocusTarget | null = null,
    planeScore = Infinity;
  for (const t of targets) {
    if (t.id === current.id) continue;
    const dx = t.center[0] - current.center[0],
      dy = t.center[1] - current.center[1];
    const ahead = sign * (horizontal ? dx : dy);
    if (ahead <= 0.5) continue;
    const level =
      (alongSeries && t.node === current.node) ||
      overlap(t.box, current.box, across) > 0;
    const side = level ? 0 : Math.abs(horizontal ? dy : dx);
    if (side <= ahead && ahead + 2 * side < coneScore) {
      cone = t;
      coneScore = ahead + 2 * side;
    }
    const dist = Math.hypot(dx, dy);
    if (dist < planeScore) {
      plane = t;
      planeScore = dist;
    }
  }
  return cone ?? plane ?? current;
}
