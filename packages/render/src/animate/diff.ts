import type {GroupNode, Scene, SceneNode} from "../scene.js";
import {collapse, interpolateNode} from "./interpolate.js";
import type {Interp} from "./interpolate.js";
import {trailNode, trailPartsFromNode, TRAIL_MIN_DISTANCE} from "./trail.js";
import type {TrailSpec} from "./trail.js";
import {isPersistTrail, persistTrailNode} from "./trailLog.js";
import type {TrailLog} from "./trailLog.js";

/**
    Reads a motion-trail spec off a moving update-pair of trailed mark nodes,
    or null when it doesn't move enough, changes shape, or lacks a usable color.
    Point positions live in the node transform (marks are origin-centered), so
    the trail is drawn in the parent's coordinate space. See `./trail.ts` for the
    cone geometry the two backends share.
*/
function trailSpec(a: SceneNode, b: SceneNode): TrailSpec | null {
  const pa = trailPartsFromNode(a), pb = trailPartsFromNode(b);
  if (!pa || !pb || pa.shape !== pb.shape) return null;
  if (Math.hypot(pb.x - pa.x, pb.y - pa.y) < TRAIL_MIN_DISTANCE) return null;
  const color = pb.color ?? pa.color;
  if (typeof color !== "string") return null;
  return {
    key: b.key, shape: pb.shape, color,
    A: [pa.x, pa.y], B: [pb.x, pb.y],
    aDims: pa.dims, bDims: pb.dims, rotate: pb.rotate,
  };
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
  log?: TrailLog,
): Interp<SceneNode[]> {
  const {enter, update, exit} = diffChildren(prev, next);

  const wrapGroup = (
    nodeInterp: Interp<SceneNode>,
    childInterp: Interp<SceneNode[]>,
  ): Interp<SceneNode> => t =>
    ({...(nodeInterp(t) as GroupNode), children: childInterp(t)}) as SceneNode;

  const trailSpecs: TrailSpec[] = [];
  const persist: {key: string | number; persist: number | boolean}[] = [];
  const updaters: Interp<SceneNode>[] = update.map(([a, b]) => {
    if (a.type === "group" && b.type === "group") {
      return wrapGroup(interpolateNode(a, b), interpolateChildren(a.children, b.children, log));
    }
    if (b.trail && (b.type === "circle" || b.type === "rect")) {
      // A persistent trail draws its whole history from the log; the plain
      // ephemeral trail draws only this move and fades out on arrival.
      if (log && isPersistTrail(b)) persist.push({key: b.key, persist: b.trailPersist as number | boolean});
      else {
        const spec = trailSpec(a, b);
        if (spec) trailSpecs.push(spec);
      }
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
    // Trails first so they paint beneath the marks that cast them. Ephemeral
    // trails show only while moving; persistent trails stay drawn at rest too.
    if (t < 1) {
      for (const spec of trailSpecs) {
        const n = trailNode(spec, t);
        if (n) out.push(n);
      }
    }
    if (log) for (const p of persist) {
      const n = persistTrailNode(log, p.key, t);
      if (n) out.push(n);
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
export function interpolateScene(prev: Scene | null, next: Scene, log?: TrailLog): Interp<Scene> {
  const rootInterp = interpolateChildren(prev ? prev.root.children : [], next.root.children, log);
  return t => ({...next, root: {...next.root, children: rootInterp(t)}});
}
