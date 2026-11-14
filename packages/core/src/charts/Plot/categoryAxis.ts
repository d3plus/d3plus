/**
    Category axes: a Plot axis that isn't the `discrete` axis, but whose
    values include text (`x: "fruit"` on a Scatter), places its values as
    categories on a point scale, the way a discrete axis does, rather than
    reading them as numbers.
*/
import type {VizInstance} from "../viz/vizTypes.js";

/**
    Whether any of an axis's values is text: a string that doesn't read as a
    number (`"2019"` and `"1.5"` read as numbers).
    @param values The axis's values.
*/
export function hasCategoryValues(values: readonly unknown[]): boolean {
  return values.some(v => typeof v === "string" && isNaN(Number(v)));
}

/**
    The axes of a Plot draw that place their values as categories: those,
    other than the `discrete` axis, `xSort`/`ySort` axes and time axes, whose
    values (see `hasCategoryValues`) include text. A secondary axis follows
    its primary axis.
    @param viz The Plot.
    @param values Each axis's values.
*/
export function categoryAxes(
  viz: VizInstance,
  values: Partial<Record<"x" | "y", readonly unknown[]>>,
): string[] {
  const text = (axis: "x" | "y") =>
    viz.schema.discrete !== axis &&
    !viz.schema[`${axis}Sort`] &&
    !viz[`_${axis}Time`] &&
    hasCategoryValues(values[axis] ?? []);
  return (["x", "y"] as const).filter(text).flatMap(axis => [axis, `${axis}2`]);
}

/**
    Whether a Plot axis (`"x"`, `"x2"`, `"y"` or `"y2"`) places its values as
    categories this draw (see `categoryAxes`).
    @param viz The Plot.
    @param axis The axis.
*/
export const isCategoryAxis = (viz: VizInstance, axis: string): boolean =>
  Boolean(viz._categoryAxes?.includes(axis));
