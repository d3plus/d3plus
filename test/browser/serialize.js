const tag = value => Object.prototype.toString.call(value).slice(8, -1);

/**
 * Copies a value the way Playwright returns `page.evaluate` results: Dates,
 * RegExps, URLs, Errors and typed arrays survive; other objects (class
 * instances included) become plain objects of their own enumerable
 * properties; functions and symbols become `undefined`; DOM nodes become
 * "ref: <Node>". Works on values from any frame.
 * @param {*} value
 * @param {WeakMap} [seen]
 */
export function toEvaluateResult(value, seen = new WeakMap()) {
  if (typeof value === "function" || typeof value === "symbol") return undefined;
  if (!value || typeof value !== "object") return value;
  if (value.window === value) return "ref: <Window>";
  if (typeof value.nodeType === "number" && typeof value.nodeName === "string") {
    return value.nodeType === 9 ? "ref: <Document>" : "ref: <Node>";
  }
  const type = tag(value);
  if (type === "Error") {
    const error = new Error(value.message);
    error.name = value.name;
    error.stack = value.stack;
    return error;
  }
  if (type === "Date") return new Date(value.getTime());
  if (type === "URL") return new URL(value.href);
  if (type === "RegExp") return new RegExp(value.source, value.flags);
  if (ArrayBuffer.isView(value) && type !== "DataView") return new globalThis[type](value);
  if (type === "ArrayBuffer") return value.slice(0);
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    for (let i = 0; i < value.length; i++) out.push(toEvaluateResult(value[i], seen));
    return out;
  }
  const out = {};
  seen.set(value, out);
  const keys = Object.keys(value);
  for (const key of keys) {
    let item;
    try {
      item = value[key];
    } catch {
      continue;
    }
    out[key] = key === "toJSON" && typeof item === "function" ? {} : toEvaluateResult(item, seen);
  }
  if (!keys.length && typeof value.toJSON === "function") {
    seen.delete(value);
    return toEvaluateResult(value.toJSON(), seen);
  }
  return out;
}
