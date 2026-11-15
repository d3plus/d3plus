/**
    Label measurements shared across one chart draw. A draw lays its axes out
    several times (test axes, then the final ones, each pass thinning labels
    again), measuring the same labels in the same room over and over; within
    a session each distinct label measures once. A measurement's key holds
    everything it reads (see `calculateLabelSize`), so sharing it is exact.
*/
import type {LabelSize} from "./axisLabelSize.js";

let session: Map<string, LabelSize> | undefined;

/**
    Runs `fn` inside a label measurement session, opening one unless one is
    open already, and closes it after.
    @param fn The work that measures labels.
*/
export function labelSizeSession<T>(fn: () => T): T {
  if (session) return fn();
  session = new Map();
  try {
    return fn();
  } finally {
    session = undefined;
  }
}

/** The open session's measurements, or a fresh map outside one. */
export function labelSizes(): Map<string, LabelSize> {
  return session ?? new Map();
}
