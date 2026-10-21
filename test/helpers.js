/**
    Assertion helpers shared by the Node and browser test projects.
*/
import {expect, vi} from "vitest";

/**
 * Asserts `a` is within `tolerance` of `b`.
 * @param {Number} a
 * @param {Number} b
 * @param {Number} tolerance
 * @param {String} [message]
 */
export function near(a, b, tolerance, message = "") {
  expect(Math.abs(a - b) <= tolerance, `${message}: ${a} vs ${b} (±${tolerance})`).toBe(true);
}

/** A box's edges, from `{left, right, top, bottom}` or `{x, y, width, height}`. */
const edges = box =>
  "left" in box ? box : {left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height};

/**
 * Whether two boxes overlap by more than `tolerance` on both axes. Each box
 * is `{left, right, top, bottom}` (a DOMRect) or `{x, y, width, height}`;
 * boxes that only touch don't overlap.
 * @param {Object} a
 * @param {Object} b
 * @param {Number} [tolerance = 0]
 * @returns {Boolean}
 */
export function overlaps(a, b, tolerance = 0) {
  const p = edges(a), q = edges(b);
  return (
    p.left < q.right - tolerance && q.left < p.right - tolerance &&
    p.top < q.bottom - tolerance && q.top < p.bottom - tolerance
  );
}

/**
 * Whether any two of `boxes` overlap (see `overlaps`).
 * @param {Object[]} boxes
 * @param {Number} [tolerance = 0]
 */
export function anyOverlap(boxes, tolerance = 0) {
  return boxes.some((a, i) => boxes.slice(i + 1).some(b => overlaps(a, b, tolerance)));
}

/**
 * Runs `fn` with `console.warn` captured and returns each warning's first
 * argument, in order (or a Promise of them when `fn` returns one).
 * @param {Function} fn
 * @returns {Array|Promise<Array>}
 */
export function captureWarnings(fn) {
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const done = () => {
    const warnings = spy.mock.calls.map(args => args[0]);
    spy.mockRestore();
    return warnings;
  };
  let result;
  try {
    result = fn();
  } catch (err) {
    spy.mockRestore();
    throw err;
  }
  return result && typeof result.then === "function"
    ? result.then(done, err => {
      spy.mockRestore();
      throw err;
    })
    : done();
}
