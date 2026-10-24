import Circle from "./Circle.js";
import Rect from "./Rect.js";

/** The shapes a Box can draw its outliers with, by name. */
const outlierShapes = new Map<unknown, typeof Circle | typeof Rect>([
  ["Circle", Circle],
  ["Rect", Rect],
]);

/**
    The shape class a Box's `outlier` setting names: `"Circle"` or `"Rect"`.
    Undefined for `false`, or any other value, which draws no point.
*/
export function outlierShape(
  value: unknown,
): typeof Circle | typeof Rect | undefined {
  return outlierShapes.get(value);
}

/** Whether a Box's `outlier` setting draws a point. */
export const drawsOutlier = (value: unknown): boolean =>
  outlierShapes.has(value);
