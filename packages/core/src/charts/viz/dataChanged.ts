/**
    Whether a new `data` value differs from the one it replaces. The same
    value, or arrays of the same rows, are unchanged; arrays of different
    lengths differ without comparing their rows, and others compare row by
    row (as JSON) until one differs, so a stream of updates rarely reads
    more than its first row.
    @param next The new value.
    @param prev The value it replaces.
    @private
*/
export function dataChanged(next: unknown, prev: unknown): boolean {
  if (next === prev) return false;
  if (!Array.isArray(next) || !Array.isArray(prev))
    return JSON.stringify(next) !== JSON.stringify(prev);
  if (next.length !== prev.length) return true;
  for (let i = 0; i < next.length; i++) {
    if (next[i] === prev[i]) continue;
    if (JSON.stringify(next[i]) !== JSON.stringify(prev[i])) return true;
  }
  return false;
}
