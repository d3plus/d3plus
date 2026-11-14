/**
    Multi-level category axes: `x: ["year", "quarter"]` plots each row at
    its quarter within its year. The axis labels each category with its
    innermost level and each outer group once across the categories it
    spans (see the Axis's `levels`), and tooltips name every level.
*/
import type {DataPoint} from "@d3plus/data";

import {levelText} from "../../components/Axis/axisLevels.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A row accessor for one level. */
export type LevelValue = (d: DataPoint, i: number) => unknown;

/** What a level is read with: a data key or an accessor. */
export type LevelInput = string | LevelValue;

/** A Plot axis. */
type PlotAxis = "x" | "y" | "x2" | "y2";

/** Joins a category's level values into the one value the axis places. */
const SEPARATOR = "\u001F";

/** Joins the level names, or values, a tooltip shows (outermost first). */
export const LEVEL_JOIN = " / ";

/**
    The accessor a multi-level axis plots: each row's level values joined
    into one category, which `values` reads back.
*/
export interface LevelAccessor {
  (d: DataPoint, i: number): string;
  /** The data keys the levels read, outermost first (undefined for an accessor). */
  keys: (string | undefined)[];
  /** A category's level values, outermost first. */
  values: (category: unknown) => unknown[];
}

/**
    The accessor for a multi-level axis (outermost level first): each row's
    category is its level values joined, so rows with the same quarter in
    different years are different categories.
    @param levels The data keys or accessors of each level, outermost first.
*/
export function levelAccessor(levels: LevelInput[]): LevelAccessor {
  const read: LevelValue[] = levels.map(level =>
    typeof level === "function" ? level : fieldAccessor(level),
  );
  const seen = new Map<string, unknown[]>();
  const category = ((d: DataPoint, i: number) => {
    const values = read.map(fn => fn(d, i));
    const key = values.map(levelText).join(SEPARATOR);
    if (!seen.has(key)) seen.set(key, values);
    return key;
  }) as LevelAccessor;
  category.keys = levels.map(level =>
    typeof level === "string" ? level : undefined,
  );
  category.values = (value: unknown) =>
    seen.get(`${value}`) ?? `${value}`.split(SEPARATOR);
  return category;
}

/** Whether a value is a multi-level axis accessor (see `levelAccessor`). */
export function isLevelAccessor(value: unknown): value is LevelAccessor {
  return (
    typeof value === "function" &&
    Array.isArray((value as Partial<LevelAccessor>).keys) &&
    typeof (value as Partial<LevelAccessor>).values === "function"
  );
}

/**
    The accessor a Plot's axis reads its levels with, when that axis has
    more than one (see `levelAccessor`).
    @param viz The Plot.
    @param axis The axis.
*/
export function plotLevels(
  viz: VizInstance,
  axis: string,
): LevelAccessor | undefined {
  const value = (viz as unknown as Record<string, unknown>)[`_${axis}`];
  return isLevelAccessor(value) ? value : undefined;
}

/**
    The accessor an `x`/`y` setting plots: the levels' joined categories for
    a list of two or more levels, else the one level's key or accessor.
    @param value The setting.
*/
export function axisAccessorInput(
  value: LevelInput | LevelInput[],
): LevelInput | LevelAccessor {
  if (!Array.isArray(value)) return value;
  return value.length > 1 ? levelAccessor(value) : value[0];
}

/**
    How rows merging into one category merge a level's values: the value
    they share, else every distinct one.
*/
export function sharedValue(
  rows: DataPoint[],
  value: (d: DataPoint) => unknown,
): unknown {
  const values = Array.from(new Set(rows.map(value)));
  return values.length === 1 ? values[0] : values;
}

/**
    Keeps each level a Plot's axes read by data key from being summed when
    rows merge (see `sharedValue`), unless `aggs` sets how it merges.
    @param viz The Plot.
*/
export function levelAggs(viz: VizInstance): void {
  for (const axis of ["x", "y"]) {
    const levels = plotLevels(viz, axis);
    if (!levels) continue;
    for (const key of levels.keys)
      if (key !== undefined && !viz.schema.aggs[key])
        viz.schema.aggs[key] = sharedValue;
  }
}

/** Whether every value can be ordered as a number (numbers and Dates). */
const ordered = (values: unknown[]): boolean =>
  values.every(v => (typeof v === "number" && !isNaN(v)) || v instanceof Date);

/**
    A multi-level axis's categories with each group's together: grouped by
    their outermost level, then within each group by the next, and so on.
    Groups keep the order their first category has in `categories`, except
    that, with `sort`, a level whose values are all numbers or Dates runs
    in ascending order.
    @param categories The categories, in order.
    @param values Reads a category's level values, outermost first.
    @param sort Whether to sort numeric levels.
*/
export function orderLevelCategories(
  categories: unknown[],
  values: (category: unknown) => unknown[],
  sort: boolean,
): unknown[] {
  const paths = categories.map(values);
  const depth = Math.max(0, ...paths.map(path => path.length));
  const order = (members: number[], level: number): number[] => {
    if (level >= depth || members.length < 2) return members;
    const groups = new Map<string, {value: unknown; members: number[]}>();
    for (const i of members) {
      const value = paths[i][level];
      const key = levelText(value);
      const group = groups.get(key);
      if (group) group.members.push(i);
      else groups.set(key, {value, members: [i]});
    }
    const list = Array.from(groups.values());
    if (sort && ordered(list.map(g => g.value)))
      list.sort((a, b) => +(a.value as number) - +(b.value as number));
    return list.flatMap(g => order(g.members, level + 1));
  };
  return order(
    categories.map((_, i) => i),
    0,
  ).map(i => categories[i]);
}

/**
    A Plot axis's values with a multi-level axis's groups together (see
    `orderLevelCategories`); numeric levels sort unless the axis has its own
    sort (`xSort`/`ySort`). Any other axis's values are returned as given.
    @param viz The Plot.
    @param axis The axis.
    @param categories Its values, in order.
*/
export function orderAxisLevels(
  viz: VizInstance,
  axis: string,
  categories: unknown[],
): unknown[] {
  const levels = plotLevels(viz, axis);
  return levels
    ? orderLevelCategories(
        categories,
        levels.values,
        !viz.schema[`${axis}Sort`],
      )
    : categories;
}

/**
    The axis config a Plot's axis draws its levels with: `levels` reading
    each category's level values, or `false` for an axis of one level.
    @param viz The Plot.
    @param axis The axis.
*/
export function levelAxisConfig(
  viz: VizInstance,
  axis: string,
): {levels: LevelAccessor["values"] | false} {
  const levels = plotLevels(viz, axis);
  return {levels: levels ? levels.values : false};
}

/**
    A multi-level category as text: its innermost level (formatted by the
    axis's `tickFormat`) when it `stands in` for a tick label, else every
    level, outermost first, joined by `LEVEL_JOIN`. Undefined for an axis
    of one level.
    @param viz The Plot.
    @param axis The axis.
    @param value The category.
    @param tick Whether the text stands in for the axis's tick label.
*/
export function levelAxisValue(
  viz: VizInstance,
  axis: PlotAxis,
  value: unknown,
  tick = false,
): string | undefined {
  const levels = plotLevels(viz, axis);
  if (!levels) return undefined;
  const path = levels.values(value);
  const config = viz[`_${axis}Config`] as
    {tickFormat?: (d: unknown) => unknown} | undefined;
  const inner = path[path.length - 1];
  const format = config?.tickFormat;
  const innerText =
    typeof format === "function" ? levelText(format(inner)) : levelText(inner);
  if (tick) return innerText;
  return [...path.slice(0, -1).map(levelText), innerText]
    .filter(text => text !== "")
    .join(LEVEL_JOIN);
}

/**
    A multi-level axis's name in a tooltip: the data keys of its levels,
    outermost first, joined by `LEVEL_JOIN` (an accessor level has no
    name). Undefined for an axis of one level.
    @param viz The Plot.
    @param axis The axis.
*/
export function levelAxisName(
  viz: VizInstance,
  axis: PlotAxis,
): string | undefined {
  const levels = plotLevels(viz, axis);
  if (!levels) return undefined;
  return levels.keys
    .filter((key): key is string => key !== undefined)
    .join(LEVEL_JOIN);
}
