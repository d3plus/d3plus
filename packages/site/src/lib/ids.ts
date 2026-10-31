let count = 0;

/** An id no other call returns, for elements that must be unique on a page. */
export function uniqueId(prefix: string): string {
  return `${prefix}-${++count}`;
}
