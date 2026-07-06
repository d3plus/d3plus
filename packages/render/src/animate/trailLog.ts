import type {Scene, SceneNode} from "../scene.js";
import {coneAt, persistAlpha, persistFadeLength, trailGradient, trailPartsFromNode, TRAIL_MIN_DISTANCE} from "./trail.js";
import type {Pt, TrailParts, TrailShape} from "./trail.js";

/**
    Persistent motion trails. The ephemeral trail (see `./trail.ts`) shows only
    the current move and vanishes on arrival; a persistent trail remembers a
    mark's past moves and draws them as a chain of cone segments, so the path
    curves through the mark's history and fades continuously from the head back
    to the oldest kept step.

    A `TrailLog` (one per renderer) keeps, per mark key, the segment currently
    animating plus the committed older segments (most-recent first). Each move
    commits the previous animating segment and starts a new one; segments that
    have fully faded past the persist length are dropped. The segments are pure
    data — each backend renders them (Canvas via scene nodes, SVG via paths),
    reusing `coneAt` so every segment keeps the tapered/hull geometry and rounded
    tail cap, and `persistAlpha` so adjacent segments meet at equal opacity where
    they turn.
*/

/** One step's move: from A (older) to B (newer), at the mark's size at each end. */
export interface TrailSeg {
  A: Pt;
  B: Pt;
  aDims: number[];
  bDims: number[];
  shape: TrailShape;
  rotate: number;
  color: string;
}

interface Entry {
  lastPos: Pt;
  lastDims: number[];
  color: string;
  animating: TrailSeg | null;
  committed: TrailSeg[];
}

export class TrailLog {
  private map = new Map<string | number, Entry>();

  /**
      Fold a mark's current geometry into its history. The first call seeds the
      position; each later call that clears `TRAIL_MIN_DISTANCE` commits the move
      that was animating and starts a new one, then drops fully-faded segments.
  */
  commit(key: string | number, parts: TrailParts, persist: number | boolean): void {
    const pos: Pt = [parts.x, parts.y];
    const color = parts.color ?? "#000000";
    const e = this.map.get(key);
    if (!e) {
      this.map.set(key, {lastPos: pos, lastDims: parts.dims, color, animating: null, committed: []});
      return;
    }
    if (Math.hypot(pos[0] - e.lastPos[0], pos[1] - e.lastPos[1]) < TRAIL_MIN_DISTANCE) return;
    if (e.animating) e.committed.unshift(e.animating);
    e.animating = {
      A: e.lastPos, B: pos, aDims: e.lastDims, bDims: parts.dims,
      shape: parts.shape, rotate: parts.rotate, color,
    };
    e.lastPos = pos;
    e.lastDims = parts.dims;
    e.color = color;
    // committed[i]'s head sits i+1 steps behind the animating head, so keep only
    // while it hasn't faded out (i + 1 < fade length).
    const keep = Math.max(0, persistFadeLength(persist) - 1);
    if (e.committed.length > keep) e.committed.length = keep;
  }

  /** Drop history for keys no longer present, so the log tracks the live marks. */
  prune(seen: Set<string | number>): void {
    for (const key of this.map.keys()) if (!seen.has(key)) this.map.delete(key);
  }

  /** The live segments for a mark: the animating one (or null) and older ones. */
  segments(key: string | number): {animating: TrailSeg | null; committed: TrailSeg[]} {
    const e = this.map.get(key);
    return e ? {animating: e.animating, committed: e.committed} : {animating: null, committed: []};
  }
}

/**
    A mark's persistent-trail segments at progress `t`, ordered oldest → newest
    (paint order) with the step-distance of each end from the head. The animating
    segment's head follows the mark (`t`); committed segments are fully drawn.
*/
export function persistRenderSegs(
  log: TrailLog, key: string | number,
): {seg: TrailSeg; pHead: number; pTail: number; animating: boolean}[] {
  const {animating, committed} = log.segments(key);
  const out: {seg: TrailSeg; pHead: number; pTail: number; animating: boolean}[] = [];
  for (let i = committed.length - 1; i >= 0; i--) {
    out.push({seg: committed[i], pHead: i + 1, pTail: i + 2, animating: false});
  }
  if (animating) out.push({seg: animating, pHead: 0, pTail: 1, animating: true});
  return out;
}

/** The gradient fill for one persistent segment (its endpoint alphas by age). */
export function persistSegFill(seg: TrailSeg, pHead: number, pTail: number, persist: number | boolean): string {
  return trailGradient(
    seg.B[0] - seg.A[0], seg.B[1] - seg.A[1], seg.color,
    persistAlpha(pTail, persist), persistAlpha(pHead, persist),
  );
}

/** Builds a mark's persistent-trail scene nodes (Canvas backend) at progress `t`. */
export function persistTrailNodes(
  log: TrailLog, key: string | number, persist: number | boolean, t: number,
): SceneNode[] {
  return persistRenderSegs(log, key).map(({seg, pHead, pTail, animating}) => {
    const {d, box} = coneAt(seg.shape, seg.A, seg.aDims, seg.B, seg.bDims, seg.rotate, animating ? t : 1);
    return {
      type: "path",
      key: `${key}__trail${animating ? 0 : pHead}`,
      interactive: false,
      d,
      gradientBounds: box,
      paint: {fill: persistSegFill(seg, pHead, pTail, persist), opacity: 1},
    } as unknown as SceneNode;
  });
}

/** Whether a node opts into a persistent trail (a positive count or `true`). */
export function isPersistTrail(node: SceneNode): boolean {
  const p = node.trailPersist;
  return p === true || (typeof p === "number" && p > 0);
}

/**
    Fold every trailed-persist node in a scene into the log (once per draw),
    pruning stale keys. Returns whether any persistent-trail node was present, so
    a backend can skip the trail-injection path entirely on the common case.
*/
export function commitTrailScene(log: TrailLog, scene: Scene): boolean {
  const seen = new Set<string | number>();
  const visit = (nodes: SceneNode[]): void => {
    for (const n of nodes) {
      if (isPersistTrail(n) && (n.type === "circle" || n.type === "rect")) {
        const parts = trailPartsFromNode(n);
        if (parts) {
          log.commit(n.key, parts, n.trailPersist as number | boolean);
          seen.add(n.key);
        }
      }
      if (n.type === "group") visit((n as {children: SceneNode[]}).children);
    }
  };
  visit(scene.root.children);
  log.prune(seen);
  return seen.size > 0;
}
