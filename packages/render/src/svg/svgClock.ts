/**
    Keeps a draw's transitions starting from their beginning after a long
    synchronous task.

    d3-timer reads the clock once per animation frame and caches it until the
    next frame. When a task runs long before creating its transitions — a chart
    that lays itself out several times, say — every transition is stamped with
    the clock as it read early in that task, so at the first frame afterward it
    looks like that whole task's time has already elapsed, and the animation
    starts partway through (or already finished).

    A d3 timer, created just before the draw's transitions and so stamped with
    the same cached time, measures that lag at the first frame: the elapsed
    time it reports, minus the real time that actually passed since the draw.
    d3 runs timers in creation order, so it fires before any of the draw's
    transitions are scheduled, and can still push their start back by the lag
    through the public `delay()`.
*/

import type {BaseType} from "d3-selection";
import {timer} from "d3-timer";
import {transition, type Transition} from "d3-transition";

/** The transition a draw threads through its reconcile pass. */
export type RenderTransition = Transition<BaseType, unknown, null, undefined>;

/** Anything whose start can still be pushed back before it begins. */
interface Delayable {
  delay(value: number): unknown;
}

/** A lag shorter than a frame is the ordinary cost of drawing, not a stall. */
const FRAME = 17;

const tracked = new WeakMap<object, Delayable[]>();

/**
    Registers a per-element transition created from a draw's shared
    transition, so a stalled clock can delay it with the rest of the draw.
    @param child The transition created from `root` (e.g. `sel.transition(root)`).
    @param root The draw's shared transition.
*/
export function trackTransition<T extends Delayable>(
  child: T,
  root: object,
): T {
  const list = tracked.get(root);
  if (list) list.push(child);
  return child;
}

/**
    Delays every transition in `group` by `lag` milliseconds. One that has
    already started (it can't be rescheduled) is left as it is.
*/
export function delayTransitions(group: Delayable[], lag: number): void {
  for (const t of group) {
    try {
      t.delay(lag);
    } catch {
      // Already scheduled: nothing to correct.
    }
  }
}

/**
    Creates a draw's shared transition, guarded against a stale d3 clock (see
    the module docs). Without a duration, or outside a browser, it is a plain
    `transition().duration(duration)`.
    @param duration The draw's transition duration in milliseconds.
*/
export function clockedTransition(duration: number): RenderTransition {
  const now =
    typeof performance !== "undefined" ? () => performance.now() : null;
  if (!duration || !now || typeof document === "undefined")
    return transition().duration(duration);

  const created = now();
  const group: Delayable[] = [];
  const probe = timer(elapsed => {
    probe.stop();
    const lag = elapsed - (now() - created);
    if (lag > FRAME) delayTransitions(group, lag);
  });

  const t = transition().duration(duration);
  group.push(t);
  tracked.set(t, group);
  return t;
}
