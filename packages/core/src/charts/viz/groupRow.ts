/**
    Group rows: a row a chart draws for a whole group at a shallower `groupBy`
    level than its marks (a Treemap's group header), merged from every row in
    that group and stamped with its level under `GROUP_DEPTH_KEY`. Labels,
    hover, and clicks read that level in place of the chart's drawn depth.
*/

import type {DataPoint} from "@d3plus/data";

/** The row key holding a group row's `groupBy` level. */
export const GROUP_DEPTH_KEY = "__d3plusGroupDepth";

type Wrapped = DataPoint & {__d3plus__?: boolean; data?: DataPoint};
type GroupKey = (d: DataPoint, i: number) => unknown;

/** The source row a datum wraps (a label record, or a laid-out node). */
function unwrap<T extends DataPoint | undefined | null>(d: T): T {
  let row = d as Wrapped | undefined | null;
  while (row && row.__d3plus__ && row.data) row = row.data as Wrapped;
  return row as T;
}

/** The `groupBy` level a group row stands for, or undefined for any other row. */
export function groupDepthOf(
  d: DataPoint | undefined | null,
): number | undefined {
  const row = unwrap(d);
  const depth = row ? row[GROUP_DEPTH_KEY] : undefined;
  return typeof depth === "number" ? depth : undefined;
}

/** A group row's key at each `groupBy` level, from the first down to its own. */
export function groupPath(
  groupBy: GroupKey[],
  d: DataPoint,
  depth: number,
): unknown[] {
  const row = unwrap(d);
  return groupBy.slice(0, depth + 1).map(g => g(row, 0));
}

/**
    Whether `d` belongs to the group at `path`: its key at each of the path's
    levels is the group's, or for a merged row holds it.
*/
export function inGroup(
  groupBy: GroupKey[],
  path: unknown[],
  d: DataPoint,
  i: number,
): boolean {
  const row = unwrap(d);
  if (!row) return false;
  return path.every((key, j) => {
    const value = groupBy[j](row, i);
    return value === key || (Array.isArray(value) && value.includes(key));
  });
}

/** Whether `rows` hold any row outside the group at `path`, so zooming into it narrows the view. */
export function groupNarrows(
  groupBy: GroupKey[],
  path: unknown[],
  rows: DataPoint[],
): boolean {
  return rows.some((d, i) => !inGroup(groupBy, path, d, i));
}
