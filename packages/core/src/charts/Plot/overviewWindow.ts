/**
    The window math behind an overview chart's band (see
    `drawSteps/overview.ts`): moving, resizing, drawing, and scaling a
    window of axis values, always inside the overview's domain.

    @module
*/
import type {ZoomWindow} from "./zoomWindow.js";

/**
    A window moved, without changing its length, to lie inside `domain`; the
    whole domain when it's longer than that.
    @param window The window.
    @param domain The domain, low end first.
*/
export function clampWindow(
  [a, b]: ZoomWindow,
  [lo, hi]: ZoomWindow,
): ZoomWindow {
  const length = b - a;
  if (length >= hi - lo) return [lo, hi];
  if (a < lo) return [lo, lo + length];
  if (b > hi) return [hi - length, hi];
  return [a, b];
}

/**
    A window moved by `delta`, kept inside `domain`.
    @param window The window.
    @param delta How far to move it.
    @param domain The domain.
*/
export function moveWindow(
  [a, b]: ZoomWindow,
  delta: number,
  domain: ZoomWindow,
): ZoomWindow {
  return clampWindow([a + delta, b + delta], domain);
}

/**
    A window with one edge dragged to `value`: kept at least `minSpan` long
    and inside `domain`; dragging an edge past the other swaps them.
    @param window The window.
    @param edge The edge dragged.
    @param value Where it was dragged to.
    @param domain The domain.
    @param minSpan The shortest window allowed.
*/
export function resizeWindow(
  [a, b]: ZoomWindow,
  edge: "start" | "end",
  value: number,
  domain: ZoomWindow,
  minSpan = 0,
): ZoomWindow {
  const fixed = edge === "start" ? b : a;
  return spanWindow(fixed, value, domain, minSpan);
}

/**
    The window between two values, either way round: inside `domain`, and
    grown about its middle to at least `minSpan`.
    @param from One end.
    @param to The other end.
    @param domain The domain.
    @param minSpan The shortest window allowed.
*/
export function spanWindow(
  from: number,
  to: number,
  [lo, hi]: ZoomWindow,
  minSpan = 0,
): ZoomWindow {
  let a = Math.max(lo, Math.min(from, to)),
    b = Math.min(hi, Math.max(from, to));
  if (b - a < minSpan) {
    const mid = (a + b) / 2;
    a = mid - minSpan / 2;
    b = mid + minSpan / 2;
  }
  return clampWindow([a, b], [lo, hi]);
}

/**
    A window scaled about `anchor` (a value inside it, which stays put):
    `factor` 2 halves it, 0.5 doubles it. At least `minSpan` long, and
    inside `domain`.
    @param window The window.
    @param factor How many times narrower to make it.
    @param anchor The value that stays put.
    @param domain The domain.
    @param minSpan The shortest window allowed.
*/
export function scaleWindow(
  [a, b]: ZoomWindow,
  factor: number,
  anchor: number,
  domain: ZoomWindow,
  minSpan = 0,
): ZoomWindow {
  const length = Math.max(minSpan, (b - a) / factor);
  const share = b > a ? (anchor - a) / (b - a) : 0.5;
  const start = anchor - share * length;
  return clampWindow([start, start + length], domain);
}

/**
    The window a key press on the band asks for, or null for a key it
    doesn't handle: the arrow keys move it a tenth of its length (Shift, or
    Page Up/Down, a whole length), Home and End take it to either end, and
    + and − narrow and widen it by `factor` about its middle.
    @param window The window.
    @param key The `KeyboardEvent.key`.
    @param shift Whether Shift is held.
    @param domain The domain.
    @param factor How much + and − scale the window.
    @param minSpan The shortest window allowed.
*/
export function keyWindow(
  window: ZoomWindow,
  key: string,
  shift: boolean,
  domain: ZoomWindow,
  factor = 2,
  minSpan = 0,
): ZoomWindow | null {
  const length = window[1] - window[0];
  const step = shift ? length : length / 10;
  const mid = (window[0] + window[1]) / 2;
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return moveWindow(window, -step, domain);
    case "ArrowRight":
    case "ArrowUp":
      return moveWindow(window, step, domain);
    case "PageDown":
      return moveWindow(window, -length, domain);
    case "PageUp":
      return moveWindow(window, length, domain);
    case "Home":
      return clampWindow([domain[0], domain[0] + length], domain);
    case "End":
      return clampWindow([domain[1] - length, domain[1]], domain);
    case "+":
    case "=":
      return scaleWindow(window, factor, mid, domain, minSpan);
    case "-":
    case "_":
      return scaleWindow(window, 1 / factor, mid, domain, minSpan);
    default:
      return null;
  }
}
