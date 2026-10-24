/**
    d3plus's computed share (a row's fraction of its total) for Pie, Treemap,
    and stacked Plot charts. It lives under its own key so a data field named
    `share` is never overwritten; the plain `share` key mirrors it only on rows
    without their own `share` field.
*/

/** The row key d3plus writes its computed share under. */
export const SHARE_KEY = "__d3plusShare";

/** Prefix of every key d3plus writes onto a data row for its own use. */
export const INTERNAL_KEY_PREFIX = "__d3plus";

/** Rows whose `share` d3plus wrote, so a redraw updates its own value. */
const stampedRows = new WeakSet<object>();

/**
    Writes `share` onto `row` under `SHARE_KEY`, and as `share` too unless the
    row already has a `share` of its own.
*/
export function stampShare(row: Record<string, unknown>, share: number): void {
  row[SHARE_KEY] = share;
  if (row.share === undefined || stampedRows.has(row)) {
    row.share = share;
    stampedRows.add(row);
  }
}

/** d3plus's share on `row`: a number, or an array of member shares for a merged row. */
export function shareOf(row: Record<string, unknown> | undefined): unknown {
  return row ? row[SHARE_KEY] : undefined;
}

/**
    d3plus's share on `row`, summing a merged row's member shares. NaN when
    the row carries none.
*/
export function summedShare(row: Record<string, unknown> | undefined): number {
  const share = shareOf(row);
  if (Array.isArray(share))
    return (share as number[]).reduce((a, b) => a + b, 0);
  return typeof share === "number" ? share : NaN;
}

/** The data row under a shape or legend wrapper (`{__d3plus__, data}`). */
export function unwrapRow<T>(d: T): T {
  let row = d as T & {__d3plus__?: boolean; data?: T};
  while (row && row.__d3plus__ && row.data) row = row.data as typeof row;
  return row;
}

/**
    `d`'s share of every row's total: the size of its `value` over the summed
    size of every row's. NaN when that total is 0. A legend entry, which
    merges a series over every position, reads its share of the whole chart
    this way.
*/
export function shareOfRows(
  d: Record<string, unknown>,
  rows: Record<string, unknown>[],
  value: (d: Record<string, unknown>) => unknown,
): number {
  let total = 0;
  for (const row of rows) total += Math.abs(+(value(row) as number)) || 0;
  return total > 0 ? Math.abs(+(value(d) as number)) / total : NaN;
}

/** Whether `key` is one d3plus writes onto data rows for its own use. */
export function isInternalKey(key: string): boolean {
  return key.startsWith(INTERNAL_KEY_PREFIX);
}
