/** Every `toBlob`/`toSvg` call, in order. */
export const calls = [];

/** What the next `toBlob`/`toSvg` call resolves with. */
export const results = {toBlob: null, toSvg: ""};

export function toBlob(node, options) {
  calls.push({fn: "toBlob", node, options});
  return Promise.resolve(results.toBlob);
}

export function toSvg(node, options) {
  calls.push({fn: "toSvg", node, options});
  return Promise.resolve(results.toSvg);
}
