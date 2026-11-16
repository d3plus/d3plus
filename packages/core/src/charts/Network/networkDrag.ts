/**
    Dragging Network nodes (see `features/nodeDrag.ts`): the node follows the
    pointer, its links with it, and stays pinned where it is dropped. A live
    simulation reacts while it moves; without one only the node moves.
    Double-clicking a pinned node lets it go again.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {NodeDrag, Point} from "../features/nodeDrag.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {dragHeat, networkLive, reheat, scheduleRedraw} from "./liveForce.js";
import type {Bounds, Position} from "./livePositions.js";
import {isLinkDatum} from "../features/linkInteraction.js";
import {graphNodeId} from "./graph.js";

/** How long a click on a pinned node waits to see if it is a double-click. */
export const DOUBLE_CLICK_WAIT = 300;

/** The scene keys of a node's shape and label, which carry its id. */
const NODE_KEY = /^network-(?:Circle|Rect|label)-(.+)$/;

/**
    The id of the node a Network scene node draws (its shape or its label),
    or null for anything else.
    @param node The scene node.
    @param ids The ids of the chart's nodes.
*/
export function networkNodeId(
  node: Pick<SceneNode, "key">,
  ids: {has(id: string): boolean},
): string | null {
  const match = NODE_KEY.exec(String(node.key ?? ""));
  return match && ids.has(match[1]) ? match[1] : null;
}

/**
    Keeps a dragged point inside the chart area.
    @param point The point.
    @param bounds The chart area.
*/
export function clampToBounds([x, y]: Point, bounds?: Bounds): Position {
  if (!bounds) return {x, y};
  return {
    x: Math.max(0, Math.min(bounds.width, x)),
    y: Math.max(0, Math.min(bounds.height, y)),
  };
}

/** How a Network drags its nodes. */
export function networkNodeDrag(viz: VizInstance): NodeDrag {
  // Where the pointer took hold of the node, from its center.
  let grab: Point = [0, 0];
  const simNode = (id: string) =>
    networkLive(viz)
      .sim?.nodes()
      .find(n => n.id === id);
  return {
    nodeAt(node) {
      const lookup = (viz.ctx.nodeLookup ?? {}) as Record<string, unknown>;
      return networkNodeId(node, {has: id => id in lookup});
    },
    start(id, at) {
      const state = networkLive(viz);
      const p = state.positions.get(id) ?? {x: at[0], y: at[1]};
      grab = [p.x - at[0], p.y - at[1]];
      state.dragging = id;
      dragHeat(viz, true);
    },
    move(id, at) {
      const state = networkLive(viz);
      const p = clampToBounds([at[0] + grab[0], at[1] + grab[1]], state.bounds);
      state.pinned.set(id, p);
      state.positions.set(id, p);
      const n = simNode(id);
      if (n) {
        n.x = n.fx = p.x;
        n.y = n.fy = p.y;
      }
      scheduleRedraw(viz);
    },
    end() {
      networkLive(viz).dragging = undefined;
      dragHeat(viz, false);
    },
    dblclick(id) {
      const state = networkLive(viz);
      if (!state.pinned.delete(id)) return false;
      clearTimeout(state.clickTimer);
      const n = simNode(id);
      if (n) n.fx = n.fy = null;
      else {
        // Without a simulation to move it, the node goes back to its place.
        const home = state.laid?.get(id);
        if (home) state.positions.set(id, home);
      }
      reheat(viz);
      return true;
    },
  };
}

/**
    Holds a click on a pinned node until a double-click (which lets the node
    go) has had time to follow, so the double-click doesn't also focus the
    node. Clicks on other nodes and on links act at once.
    @param viz The chart, with its `click.shape` handler installed.
*/
export function deferPinnedClicks(viz: VizInstance): void {
  const click = viz.schema.on["click.shape"];
  if (typeof click !== "function") return;
  viz.schema.on["click.shape"] = function (
    this: unknown,
    d: DataPoint,
    i: number,
    x: unknown,
    event: MouseEvent,
  ) {
    const state = networkLive(viz);
    const pinned = !isLinkDatum(d) && state.pinned.has(graphNodeId(viz, d, i));
    if (!pinned) return click.call(this, d, i, x, event);
    clearTimeout(state.clickTimer);
    // The second click of a double-click.
    if ((event?.detail ?? 1) > 1) return;
    state.clickTimer = setTimeout(
      () => click.call(this, d, i, x, event),
      DOUBLE_CLICK_WAIT,
    );
  };
}
