/**
  A deep copy of a parsed response: the plain objects, Arrays and primitives
  that `JSON.parse` and d3-dsv produce, including a parsed file's `columns`
  list. Matches `structuredClone` on those values at a fraction of its cost.
  @param value The parsed payload.
  @private
*/
export default function copyPayload<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const n = value.length;
    const out = new Array(n) as unknown[] & {columns?: unknown};
    for (let i = 0; i < n; i++) out[i] = copyPayload(value[i]);
    if (Object.prototype.hasOwnProperty.call(value, "columns"))
      out.columns = copyPayload((value as {columns?: unknown}).columns);
    return out as T;
  }
  const out: Record<string, unknown> = {};
  const source = value as Record<string, unknown>;
  for (const k in source) {
    const v = copyPayload(source[k]);
    // An own "__proto__" key (JSON.parse makes one) stays a plain property.
    if (k === "__proto__")
      Object.defineProperty(out, k, {
        value: v,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    else out[k] = v;
  }
  return out as T;
}
