/** Every `toBlob`/`toSvg` call, in order. */
export const calls = [];

/** What the next `toBlob`/`toSvg` call resolves with, or rejects with when `error` is set. */
export const results = {toBlob: null, toSvg: "", error: null};

const settle = value =>
  results.error ? Promise.reject(results.error) : Promise.resolve(value);

export function toBlob(node, options) {
  calls.push({fn: "toBlob", node, options});
  return settle(results.toBlob);
}

export function toSvg(node, options) {
  calls.push({fn: "toSvg", node, options});
  return settle(results.toSvg);
}
