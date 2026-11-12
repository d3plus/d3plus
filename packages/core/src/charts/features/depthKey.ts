/**
    The hierarchy depth Tree records on a node's row (1 for a top-level
    node), so code handed the row alone, like a tooltip's title, knows the
    node's level. It lives under its own key so a data field named `depth` is
    never overwritten; the plain `depth` key mirrors it only on rows without
    their own `depth` field.
*/

import {INTERNAL_KEY_PREFIX, unwrapRow} from "./shareKey.js";

/** The row key d3plus writes a node's hierarchy depth under. */
export const DEPTH_KEY = `${INTERNAL_KEY_PREFIX}Depth`;

/** Rows whose `depth` d3plus wrote, so a restamp updates its own value. */
const stampedRows = new WeakSet<object>();

/**
    Writes `depth` onto `row` under `DEPTH_KEY`, and as `depth` too unless the
    row already has a `depth` of its own.
*/
export function stampDepth(row: Record<string, unknown>, depth: number): void {
  row[DEPTH_KEY] = depth;
  if (row.depth === undefined || stampedRows.has(row)) {
    row.depth = depth;
    stampedRows.add(row);
  }
}

/**
    The hierarchy depth d3plus wrote on a row, or on the row under a shape or
    legend wrapper. Undefined when it carries none.
*/
export function depthOf(
  d: Record<string, unknown> | undefined | null,
): number | undefined {
  const depth = d ? unwrapRow(d)[DEPTH_KEY] : undefined;
  return typeof depth === "number" ? depth : undefined;
}
