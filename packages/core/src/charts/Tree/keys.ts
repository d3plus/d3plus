/**
    How a Tree reads a node's `groupBy` keys. A row that has no key at some
    level (`undefined`, `null` or `""`) is drawn as a leaf of the group above
    it, so it is named and keyed by the keys it does have.
*/

import type {DataPoint} from "@d3plus/data";

import {unwrapRow} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

type KeyAccessor = (d: DataPoint, i: number) => unknown;

/** Whether a `groupBy` value is no key: `undefined`, `null` or `""`. */
export function noKey(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/** The `groupBy` accessors of the levels a Tree draws. */
function drawnKeys(viz: VizInstance): KeyAccessor[] {
  return (viz.schema.groupBy as KeyAccessor[]).slice(0, viz._drawDepth + 1);
}

/**
    The `groupBy` level a Tree node is named at: its own `level` when its row
    has a key there, or else the deepest drawn level it has one at. Undefined
    when the row has no key at any drawn level.
*/
export function nameLevel(
  viz: VizInstance,
  d: DataPoint,
  i: number,
  level: number,
): number | undefined {
  const row = unwrapRow(d);
  const keys = drawnKeys(viz);
  if (level < keys.length && !noKey(keys[level](row, i))) return level;
  for (let l = keys.length - 1; l >= 0; l--)
    if (!noKey(keys[l](row, i))) return l;
  return undefined;
}

/**
    The id a Tree node's scene keys are built from: its `groupBy` value at its
    own level, or, for a row without a key there, every drawn key it has,
    missing ones included, joined with `/`, so it never matches the group it
    is drawn under.
*/
export function nodeId(
  viz: VizInstance,
  d: {data?: DataPoint; depth?: number},
  i: number,
): string {
  const row = d.data as DataPoint;
  const level = (d.depth ?? 1) - 1;
  if (nameLevel(viz, row, i, level) === level)
    return (viz._ids(row, i) as string[])[level];
  return drawnKeys(viz)
    .map(key => `${key(row, i)}`)
    .join("/");
}
