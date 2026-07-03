import type {CircleNode, GroupNode, Scene, SceneNode} from "../scene.js";
import {collapse, interpolateNode} from "./interpolate.js";
import type {Interp} from "./interpolate.js";
import {trailNode, TRAIL_MIN_DISTANCE} from "./trail.js";
import type {TrailSpec} from "./trail.js";

/**
    Reads a motion-trail spec off a moving update-pair of trailed circle nodes,
    or null when it doesn't move enough or lacks a usable radius/color. Point
    positions live in the node transform (circles are origin-centered), so the
    trail is drawn in the parent's coordinate space. See `./trail.ts` for the
    cone geometry the two backends share.
*/
function trailSpec(a: SceneNode, b: SceneNode): TrailSpec | null {
  const ax = a.transform?.x ?? 0, ay = a.transform?.y ?? 0;
  const bx = b.transform?.x ?? 0, by = b.transform?.y ?? 0;
  if (Math.hypot(bx - ax, by - ay) < TRAIL_MIN_DISTANCE) return null;
  const color = b.paint?.fill ?? a.paint?.fill;
  const bR = (b as CircleNode).r, aR = (a as CircleNode).r;
  if (typeof color !== "string" || (!bR && !aR)) return null;
  return {key: b.key, ax, ay, aR: aR || bR, bx, by, bR: bR || aR, color};
}

/**
    @interface GroupDiff
    The result of matching two child lists by key: nodes to add (enter), nodes
    present in both (update, as [previous, next] pairs), and nodes to remove (exit).
*/
export interface GroupDiff {
  enter: SceneNode[];
  update: [SceneNode, SceneNode][];
  exit: SceneNode[];
}

/**
    Matches two sibling node lists by their stable `key`, classifying each into
    enter/update/exit. This is the shared classification both backends rely on —
    the SVG backend feeds it to a keyed d3 join; the Canvas backend feeds it to
    interpolateScene.
    @param prev The previously drawn children.
    @param next The target children.
*/
export function diffChildren(prev: SceneNode[], next: SceneNode[]): GroupDiff {
  const prevByKey = new Map(prev.map(n => [n.key, n]));
  const nextKeys = new Set(next.map(n => n.key));
  const enter: SceneNode[] = [];
  const update: [SceneNode, SceneNode][] = [];
  for (const n of next) {
    const p = prevByKey.get(n.key);
    if (p) update.push([p, n]);
    else enter.push(n);
  }
  const exit = prev.filter(n => !nextKeys.has(n.key));
  return {enter, update, exit};
}

/** Recursively interpolates a list of sibling nodes between two frames. */
function interpolateChildren(
  prev: SceneNode[],
  next: SceneNode[],
): Interp<SceneNode[]> {
  const {enter, update, exit} = diffChildren(prev, next);

  const wrapGroup = (
    nodeInterp: Interp<SceneNode>,
    childInterp: Interp<SceneNode[]>,
  ): Interp<SceneNode> => t =>
    ({...(nodeInterp(t) as GroupNode), children: childInterp(t)}) as SceneNode;

  const trailSpecs: TrailSpec[] = [];
  const updaters: Interp<SceneNode>[] = update.map(([a, b]) => {
    if (a.type === "group" && b.type === "group") {
      return wrapGroup(interpolateNode(a, b), interpolateChildren(a.children, b.children));
    }
    if (b.type === "circle" && b.trail && a.type === "circle") {
      const spec = trailSpec(a, b);
      if (spec) trailSpecs.push(spec);
    }
    return interpolateNode(a, b);
  });

  const enters: Interp<SceneNode>[] = enter.map(n => {
    const interp = interpolateNode(collapse(n), n);
    if (n.type === "group") {
      return wrapGroup(interp, interpolateChildren([], n.children));
    }
    return interp;
  });

  const exits: Interp<SceneNode>[] = exit.map(n => {
    const interp = interpolateNode(n, collapse(n));
    if (n.type === "group") {
      return wrapGroup(interp, interpolateChildren(n.children, []));
    }
    return interp;
  });

  return t => {
    const out: SceneNode[] = [];
    // Trails first so they paint beneath the marks that cast them.
    if (t < 1) {
      for (const spec of trailSpecs) {
        const n = trailNode(spec, t);
        if (n) out.push(n);
      }
    }
    for (const u of updaters) out.push(u(t));
    for (const e of enters) out.push(e(t));
    if (t < 1) for (const x of exits) out.push(x(t));
    return out;
  };
}

/**
    Builds a function that returns the interpolated scene at a given time, driving
    the Canvas backend's requestAnimationFrame loop. Entering nodes grow/fade in,
    exiting nodes shrink/fade out and are dropped at t === 1.
    @param prev The previously drawn scene, or null for the first frame.
    @param next The target scene.
*/
export function interpolateScene(prev: Scene | null, next: Scene): Interp<Scene> {
  const rootInterp = interpolateChildren(prev ? prev.root.children : [], next.root.children);
  return t => ({...next, root: {...next.root, children: rootInterp(t)}});
}
