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

/** The segment mid-transition: growing forward (dir +1) or retracting back (dir -1). */
interface Anim {
  seg: TrailSeg;
  dir: 1 | -1;
}

interface Entry {
  lastPos: Pt;
  lastDims: number[];
  color: string;
  /** The timeline value at the last commit; null until the first sequenced draw. */
  lastSeq: number | null;
  /** Committed forward segments, oldest → newest. */
  committed: TrailSeg[];
  animating: Anim | null;
}

export class TrailLog {
  private map = new Map<string | number, Entry>();

  /**
      Fold a mark's current geometry into its history, keyed by the timeline value
      `seq`. Trails only grow as time moves FORWARD (`seq` increases): each forward
      step commits the segment that was growing and starts the new one. Moving
      BACKWARD retracts instead — the most recent segment animates away and is
      dropped, rewinding the trail without drawing new history. Without a `seq`
      (no timeline) nothing accumulates; a repaint at the same `seq` (e.g. a resize
      or hover) just tracks the current position.
  */
  commit(key: string | number, parts: TrailParts, persist: number | boolean, seq?: number): void {
    const pos: Pt = [parts.x, parts.y];
    const dims = parts.dims, color = parts.color ?? "#000000";
    const e = this.map.get(key);
    if (!e) {
      this.map.set(key, {lastPos: pos, lastDims: dims, color, lastSeq: seq ?? null, committed: [], animating: null});
      return;
    }
    e.color = color;
    // Persistence is a timeline feature — with no sequence, or before the first
    // one, or on a same-time repaint, just keep the current position in sync.
    if (seq == null || e.lastSeq == null || seq === e.lastSeq) {
      e.lastPos = pos;
      e.lastDims = dims;
      if (e.lastSeq == null && seq != null) e.lastSeq = seq;
      return;
    }
    const moved = Math.hypot(pos[0] - e.lastPos[0], pos[1] - e.lastPos[1]) >= TRAIL_MIN_DISTANCE;
    if (seq > e.lastSeq) {
      // Forward: the segment that was growing has arrived — commit it; a retract
      // that was in flight is discarded. Start growing the new move.
      if (e.animating?.dir === 1) e.committed.push(e.animating.seg);
      e.animating = moved
        ? {seg: {A: e.lastPos, B: pos, aDims: e.lastDims, bDims: dims, shape: parts.shape, rotate: parts.rotate, color}, dir: 1}
        : null;
      const keep = Math.max(0, persistFadeLength(persist) - 1);
      if (e.committed.length > keep) e.committed.splice(0, e.committed.length - keep);
    } else {
      // Backward: retract the newest segment (the one just grown, else pop the
      // stack). It animates away over this transition and is then gone.
      const retract = e.animating?.dir === 1 ? e.animating.seg : e.committed.pop() ?? null;
      e.animating = retract ? {seg: retract, dir: -1} : null;
    }
    e.lastPos = pos;
    e.lastDims = dims;
    e.lastSeq = seq;
  }

  /** Drop history for keys no longer present, so the log tracks the live marks. */
  prune(seen: Set<string | number>): void {
    for (const key of this.map.keys()) if (!seen.has(key)) this.map.delete(key);
  }

  /** The live segments for a mark: the animating one (or null) and committed ones. */
  segments(key: string | number): {animating: Anim | null; committed: TrailSeg[]} {
    const e = this.map.get(key);
    return e ? {animating: e.animating, committed: e.committed} : {animating: null, committed: []};
  }
}

/**
    A mark's persistent-trail segments, ordered oldest → newest (paint order).
    Committed segments are fully drawn; the animating one carries its direction so
    the caller can grow it forward (dir +1) or retract it backward (dir -1).
*/
export function persistRenderSegs(
  log: TrailLog, key: string | number,
): {seg: TrailSeg; animating: boolean; dir: number}[] {
  const {animating, committed} = log.segments(key);
  const out: {seg: TrailSeg; animating: boolean; dir: number}[] = [];
  for (const seg of committed) out.push({seg, animating: false, dir: 1});
  if (animating) out.push({seg: animating.seg, animating: true, dir: animating.dir});
  return out;
}

/**
    A mark's whole persistent trail at progress `t` as ONE path (the cone of every
    segment concatenated) plus its bbox and overall tail→head direction. Painting
    the trail as a single fill is what keeps overlapping segments from compositing
    twice (the double-dark at turns); the direction drives a single gradient that
    fades from transparent at the oldest tail to the mark's color at the head.
*/
export function persistTrailPath(
  log: TrailLog, key: string | number, t: number,
): {d: string; box: {x: number; y: number; w: number; h: number}; dx: number; dy: number; color: string} | null {
  const segs = persistRenderSegs(log, key);
  if (!segs.length) return null;
  // A growing segment sweeps its head out (t); a retracting one draws in reverse
  // (1 - t), so scrubbing back pulls the newest segment away over the transition.
  const param = (animating: boolean, dir: number): number => (animating ? (dir > 0 ? t : 1 - t) : 1);
  let d = "", minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const {seg, animating, dir} of segs) {
    const c = coneAt(seg.shape, seg.A, seg.aDims, seg.B, seg.bDims, seg.rotate, param(animating, dir));
    d += c.d;
    minX = Math.min(minX, c.box.x); minY = Math.min(minY, c.box.y);
    maxX = Math.max(maxX, c.box.x + c.box.w); maxY = Math.max(maxY, c.box.y + c.box.h);
  }
  const first = segs[0].seg, tail = segs[segs.length - 1], last = tail.seg;
  const u = param(tail.animating, tail.dir);
  const hx = last.A[0] + (last.B[0] - last.A[0]) * u;
  const hy = last.A[1] + (last.B[1] - last.A[1]) * u;
  return {
    d, box: {x: minX, y: minY, w: maxX - minX || 1, h: maxY - minY || 1},
    dx: hx - first.A[0], dy: hy - first.A[1], color: last.color,
  };
}

/** The gradient fill for a mark's persistent trail (transparent tail → colored head). */
export function persistTrailFill(dx: number, dy: number, color: string, persist: number | boolean): string {
  return trailGradient(dx, dy, color, 0, persistAlpha(0, persist));
}

/** Builds a mark's persistent-trail scene node (Canvas backend) at progress `t`. */
export function persistTrailNode(
  log: TrailLog, key: string | number, persist: number | boolean, t: number,
): SceneNode | null {
  const p = persistTrailPath(log, key, t);
  if (!p) return null;
  return {
    type: "path",
    key: `${key}__trail`,
    interactive: false,
    d: p.d,
    gradientBounds: p.box,
    paint: {fill: persistTrailFill(p.dx, p.dy, p.color, persist), opacity: 1},
  } as unknown as SceneNode;
}

/** Whether a node opts into a persistent trail (a positive count or `true`). */
export function isPersistTrail(node: SceneNode): boolean {
  const p = node.trailPersist;
  return p === true || (typeof p === "number" && p > 0);
}

/**
    Fold every trailed-persist node in a scene into the log (once per draw) at the
    timeline value `seq`, pruning stale keys. Returns whether any persistent-trail
    node was present, so a backend can skip the trail-injection path on the common
    case. `seq` orders the trail in time: forward grows it, backward rewinds it.
*/
export function commitTrailScene(log: TrailLog, scene: Scene, seq?: number): boolean {
  const seen = new Set<string | number>();
  const visit = (nodes: SceneNode[]): void => {
    for (const n of nodes) {
      if (isPersistTrail(n) && (n.type === "circle" || n.type === "rect")) {
        const parts = trailPartsFromNode(n);
        if (parts) {
          log.commit(n.key, parts, n.trailPersist as number | boolean, seq);
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
