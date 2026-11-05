import type {
  GroupNode,
  Scene,
  SceneNode,
  TextNode,
  TransitionRect,
} from "../scene.js";
import {
  arcEnterStart,
  pathEnterStart,
  rectEnterStart,
  collapse,
  collapseTo,
  enterWindowProgress,
  fadeSwapOpacity,
  groupEnterStart,
  interpolateNode,
  isFlipEligible,
  isWrapperGroup,
  sameTextLayout,
} from "./interpolate.js";
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
  const pa = trailPartsFromNode(a),
    pb = trailPartsFromNode(b);
  if (!pa || !pb || pa.shape !== pb.shape) return null;
  if (Math.hypot(pb.x - pa.x, pb.y - pa.y) < TRAIL_MIN_DISTANCE) return null;
  const color = pb.color ?? pa.color;
  if (typeof color !== "string") return null;
  return {
    key: b.key,
    shape: pb.shape,
    color,
    A: [pa.x, pa.y],
    B: [pb.x, pb.y],
    aDims: pa.dims,
    bDims: pb.dims,
    rotate: pb.rotate,
  };
}

/**
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

/**
    The order to paint a sibling list in while it transitions: the target's
    nodes in the target's order (so a node entering beneath its siblings,
    such as a background, stays beneath them), and each exiting node right
    after the nearest node before it in the previous list that is still
    drawn, or first when none is. This is the order SVG's keyed join leaves
    its elements in.
    @param prev The previously drawn children.
    @param next The target children.
*/
export function transitionOrder(
  prev: SceneNode[],
  next: SceneNode[],
): SceneNode[] {
  const nextKeys = new Set(next.map(n => n.key));
  const after = new Map<SceneNode["key"] | undefined, SceneNode[]>();
  let anchor: SceneNode["key"] | undefined;
  for (const n of prev) {
    if (nextKeys.has(n.key)) {
      anchor = n.key;
      continue;
    }
    const list = after.get(anchor) ?? [];
    list.push(n);
    after.set(anchor, list);
  }
  const out: SceneNode[] = [...(after.get(undefined) ?? [])];
  for (const n of next) {
    out.push(n);
    const exits = after.get(n.key);
    if (exits) {
      out.push(...exits);
      after.delete(n.key);
    }
  }
  return out;
}

/**
    The drill-morph override for one draw: the box entering nodes collapse
    FROM and/or exiting nodes collapse TO, in place of their own degenerate
    center. See `DrawOptions.enterFrom`/`exitTo`.
*/
export interface FlipTransition {
  enterFrom?: TransitionRect;
  enterFromBody?: TransitionRect;
  exitTo?: TransitionRect;
  exitToBody?: TransitionRect;
  /** See `DrawOptions.instantExitKey`. */
  instantExitKey?: string | number;
  /** See `DrawOptions.reunionEnterKey`. */
  reunionEnterKey?: string | number;
  /** See `DrawOptions.reunionEnterFrom`. */
  reunionEnterFrom?: TransitionRect;
  /** See `DrawOptions.instantExitAll`. */
  instantExitAll?: boolean;
}

/** A node's painted opacity. */
const opacityOf = (n: SceneNode): number => n.paint?.opacity ?? 1;

/**
    The interpolator for a `fadeSwap` text node (see `TextNode.fadeSwap`),
    or null when the node doesn't swap this draw: it has no `fadeSwap`, or
    an update leaves its layout unchanged.
*/
function fadeSwapInterp(
  from: SceneNode | undefined,
  to: SceneNode | undefined,
): Interp<SceneNode> | null {
  const node = (to ?? from) as TextNode | undefined;
  if (!node || node.type !== "text" || !node.fadeSwap) return null;
  const swap = node.fadeSwap;
  if (from && to) {
    if (
      from.type !== "text" ||
      sameTextLayout(from as TextNode, to as TextNode)
    )
      return null;
    return t => {
      const {opacity, swapped} = fadeSwapOpacity(
        t,
        swap,
        opacityOf(from),
        opacityOf(to),
        "update",
      );
      const base = swapped ? to : from;
      return {...base, paint: {...base.paint, opacity}} as SceneNode;
    };
  }
  const phase = to ? "enter" : "exit";
  return t => {
    const {opacity} = fadeSwapOpacity(
      t,
      swap,
      opacityOf(node),
      opacityOf(node),
      phase,
    );
    return {...node, paint: {...node.paint, opacity}} as SceneNode;
  };
}

/** Recursively interpolates a list of sibling nodes between two frames. */
function interpolateChildren(
  prev: SceneNode[],
  next: SceneNode[],
  log?: TrailLog,
  flip?: FlipTransition,
): Interp<SceneNode[]> {
  const {enter, update, exit} = diffChildren(prev, next);

  const wrapGroup =
    (
      nodeInterp: Interp<SceneNode>,
      childInterp: Interp<SceneNode[]>,
    ): Interp<SceneNode> =>
    t =>
      ({
        ...(nodeInterp(t) as GroupNode),
        children: childInterp(t),
      }) as SceneNode;

  const trailSpecs: TrailSpec[] = [];
  const persist: {key: string | number; persist: number | boolean}[] = [];
  // Each node's interpolator, by the node it draws (the target node for an
  // update or an enter, the previous one for an exit).
  const interps = new Map<SceneNode, Interp<SceneNode>>();
  const updaters: Interp<SceneNode>[] = update.map(([a, b]) => {
    const swap = fadeSwapInterp(a, b);
    if (swap) return swap;
    if (a.type === "group" && b.type === "group") {
      return wrapGroup(
        interpolateNode(a, b),
        interpolateChildren(a.children, b.children, log, flip),
      );
    }
    if (b.trail && (b.type === "circle" || b.type === "rect")) {
      // A persistent trail draws its whole history from the log; the plain
      // ephemeral trail draws only this move and fades out on arrival.
      if (log && isPersistTrail(b))
        persist.push({key: b.key, persist: b.trailPersist as number | boolean});
      else {
        const spec = trailSpec(a, b);
        if (spec) trailSpecs.push(spec);
      }
    }
    return interpolateNode(a, b);
  });
  update.forEach(([, b], k) => interps.set(b, updaters[k]));

  // An entering node with an `enterWindow` runs its own enter over that
  // share of the progress (a group's children keep their own timing).
  const windowed = (
    n: SceneNode,
    interp: Interp<SceneNode>,
  ): Interp<SceneNode> =>
    n.enterWindow ? t => interp(enterWindowProgress(t, n.enterWindow)) : interp;
  const enters: Interp<SceneNode>[] = enter.map(n => {
    const swap = fadeSwapInterp(undefined, n);
    if (swap) return windowed(n, swap);
    // The drill-up reunion node starts at the full size its former children
    // currently occupy and animates down to its own real target — see
    // `DrawOptions.reunionEnterKey`/`reunionEnterFrom`.
    const start =
      flip?.reunionEnterKey !== undefined && n.key === flip.reunionEnterKey
        ? collapseTo(n, flip.reunionEnterFrom!, undefined, true)
        : (arcEnterStart(n) ??
          pathEnterStart(n) ??
          rectEnterStart(n) ??
          groupEnterStart(n) ??
          (flip?.enterFrom && isFlipEligible(n)
            ? collapseTo(n, flip.enterFrom, flip.enterFromBody, true)
            : collapse(n)));
    const interp = windowed(n, interpolateNode(start, n));
    if (n.type === "group") {
      return wrapGroup(
        interp,
        interpolateChildren([], n.children, undefined, flip),
      );
    }
    return interp;
  });
  enter.forEach((n, k) => interps.set(n, enters[k]));

  // The clicked node's own exit is dropped from the animated set entirely —
  // it's never drawn again at any t, instead of collapsing on top of the
  // entering children that already fill its exact box. See
  // `DrawOptions.instantExitKey`. `instantExitAll` does the same for every
  // exiting node this draw — the drill-up counterpart, since a reunion's
  // former children all disappear together (no single key names them).
  // A wrapper group hides at once too, as on SVG (see `isWrapperGroup`).
  const animatedExit = flip?.instantExitAll
    ? []
    : exit.filter(n => n.key !== flip?.instantExitKey && !isWrapperGroup(n));

  const exits: Interp<SceneNode>[] = animatedExit.map(n => {
    const swap = fadeSwapInterp(n, undefined);
    if (swap) return swap;
    const end =
      flip?.exitTo && isFlipEligible(n)
        ? collapseTo(n, flip.exitTo, flip.exitToBody)
        : collapse(n);
    const interp = interpolateNode(n, end);
    // A group with its own opacity fades out over its children as they
    // stand, as SVG does, rather than also collapsing each of them.
    if (n.type === "group") return wrapGroup(interp, () => n.children);
    return interp;
  });
  animatedExit.forEach((n, k) => interps.set(n, exits[k]));

  return siblingFrame({
    order: transitionOrder(prev, next),
    interps,
    exiting: new Set(animatedExit),
    trailSpecs,
    persist,
    log,
  });
}

/**
    A sibling list's frame at `t`: its motion trails first, so they paint
    beneath the marks that cast them (ephemeral trails only while moving,
    persistent ones at rest too), then each node in `order`, exiting nodes
    dropped at t === 1.
*/
function siblingFrame({
  order,
  interps,
  exiting,
  trailSpecs,
  persist,
  log,
}: {
  order: SceneNode[];
  interps: Map<SceneNode, Interp<SceneNode>>;
  exiting: Set<SceneNode>;
  trailSpecs: TrailSpec[];
  persist: {key: string | number}[];
  log?: TrailLog;
}): Interp<SceneNode[]> {
  return t => {
    const out: SceneNode[] = [];
    if (t < 1) {
      for (const spec of trailSpecs) {
        const n = trailNode(spec, t);
        if (n) out.push(n);
      }
    }
    if (log)
      for (const p of persist) {
        const n = persistTrailNode(log, p.key, t);
        if (n) out.push(n);
      }
    for (const n of order) {
      const interp = interps.get(n);
      if (interp && (t < 1 || !exiting.has(n))) out.push(interp(t));
    }
    return out;
  };
}

/**
    Builds a function that returns the interpolated scene at a given time, driving
    the Canvas backend's requestAnimationFrame loop. Entering nodes grow/fade in,
    exiting nodes shrink/fade out and are dropped at t === 1.
    @param prev The previously drawn scene, or null for the first frame.
    @param next The target scene.
    @param flip The drill-morph enter/exit override for this draw, if any.
*/
export function interpolateScene(
  prev: Scene | null,
  next: Scene,
  log?: TrailLog,
  flip?: FlipTransition,
): Interp<Scene> {
  const rootInterp = interpolateChildren(
    prev ? prev.root.children : [],
    next.root.children,
    log,
    flip,
  );
  return t => ({...next, root: {...next.root, children: rootInterp(t)}});
}
