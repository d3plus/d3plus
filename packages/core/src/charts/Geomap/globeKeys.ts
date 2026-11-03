/**
    Keyboard rotation for Geomap globes (projections that clip to a circle):
    while the chart has keyboard focus, Shift and an arrow key turns the
    globe a step of longitude (left and right) or latitude (up and down),
    easing there unless motion is reduced. Holding the keys repeats the
    step. Plain arrow keys still move between marks (`keyboardNav`).

    @module
*/

import type {KeyboardGesture} from "../viz/keyboardNavHost.js";
import {effectiveDuration} from "../viz/reducedMotion.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {globeHome, globeRotates} from "./globeRotate.js";
import type {RotatingProjection, Rotation} from "./globeRotate.js";

/** The degrees one key press turns a globe. */
export const GLOBE_KEY_STEP = 10;
/** The longest a key press eases for, in milliseconds. */
export const GLOBE_KEY_DURATION = 200;
/** The keys that turn a globe, as `aria-keyshortcuts` lists them. */
export const GLOBE_KEY_SHORTCUTS =
  "Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown";
/** The instructions read for a globe, after the mark-navigation ones. */
export const GLOBE_KEY_INSTRUCTIONS =
  "Hold Shift and use the arrow keys to rotate the globe.";

/** Arrow keys and the way each moves the view: `[east, north]`. */
const GLOBE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/** A longitude in [-180, 180). */
const wrap = (l: number): number => ((((l + 180) % 360) + 360) % 360) - 180;

/**
    The rotation that moves a globe's view `east` degrees of longitude and
    `north` degrees of latitude. The view centers on `[-lambda, -phi]`, and
    phi is clamped to ±90 so the view stops at a pole rather than flipping
    over it.
*/
export function rotateByStep(
  rotation: number[],
  east: number,
  north: number,
): Rotation {
  const [l = 0, p = 0, g = 0] = rotation;
  return [wrap(l - east), Math.max(-90, Math.min(90, p - north)), g];
}

/** The rotation a fraction `t` of the way from `a` to `b`, the short way round. */
export function rotationBetween(a: number[], b: number[], t: number): Rotation {
  const [al = 0, ap = 0, ag = 0] = a;
  const [bl = 0, bp = 0, bg = 0] = b;
  return [wrap(al + wrap(bl - al) * t), ap + (bp - ap) * t, ag + (bg - ag) * t];
}

/**
    How far a key moves a globe's view, `[east, north]` in degrees: Shift
    and an arrow key, with no other modifier. Null for any other key.
*/
export function globeKeyStep(
  event: Pick<
    KeyboardEvent,
    "key" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey"
  >,
): [number, number] | null {
  if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey)
    return null;
  const way = GLOBE_KEYS[event.key];
  return way ? [way[0] * GLOBE_KEY_STEP, way[1] * GLOBE_KEY_STEP] : null;
}

const ease = (t: number): number => 1 - (1 - t) ** 3;
const sameRotation = (a: number[], b: number[]): boolean =>
  a.every((v, i) => Math.abs(v - (b[i] ?? 0)) < 1e-6);

/**
    Installs the globe's keys on a Geomap as `viz._keyboardGesture`, which
    keyboard navigation consults before moving between marks. A press
    during an eased step adds to where that step is headed; a drag or the
    zoom controls' reset turning the globe meanwhile ends it.
    @param relayout Re-runs the map's layout and emit for the current projection.
*/
export function installGlobeKeys(viz: VizInstance, relayout: () => void): void {
  let turn: {
    from: number[];
    to: Rotation;
    start: number;
    duration: number;
    last: number[];
    frame?: number;
  } | null = null;
  const projection = () => viz.schema.projection as RotatingProjection;
  const show = (r: Rotation): number[] => {
    projection().rotate(r);
    relayout();
    viz._drawSceneToTarget?.(0);
    return projection().rotate();
  };
  const stop = () => {
    if (turn?.frame !== undefined) cancelAnimationFrame(turn.frame);
    turn = null;
  };
  const frame = (now: number) => {
    if (!turn) return;
    turn.frame = undefined;
    if (!sameRotation(projection().rotate(), turn.last)) return stop();
    const t = Math.max(0, Math.min(1, (now - turn.start) / turn.duration));
    turn.last = show(
      t < 1 ? rotationBetween(turn.from, turn.to, ease(t)) : turn.to,
    );
    if (t < 1) turn.frame = requestAnimationFrame(frame);
    else turn = null;
  };
  const gesture: KeyboardGesture = {
    keydown(event) {
      const by = globeKeyStep(event);
      if (!by || !globeRotates(viz)) return false;
      const p = projection();
      if (!globeHome(viz)) viz._globeHome = {projection: p, rotate: p.rotate()};
      const current = p.rotate();
      const base = turn && sameRotation(current, turn.last) ? turn.to : current;
      const to = rotateByStep(base, ...by);
      const duration = Math.min(GLOBE_KEY_DURATION, effectiveDuration(viz));
      stop();
      if (!duration || typeof requestAnimationFrame !== "function") {
        show(to);
        return true;
      }
      turn = {
        from: current,
        to,
        start: performance.now(),
        duration,
        last: current,
      };
      turn.frame = requestAnimationFrame(frame);
      return true;
    },
    keys: () =>
      globeRotates(viz)
        ? {
            shortcuts: GLOBE_KEY_SHORTCUTS,
            instructions: viz.schema.translate(GLOBE_KEY_INSTRUCTIONS),
          }
        : null,
  };
  viz._keyboardGesture = gesture;
}
