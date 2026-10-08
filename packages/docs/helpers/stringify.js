/**
 * converts d3plus config to pretty string output
 */
export default function (config, indent = 2) {
  // Functions, values built with `datafy`, and rows (one per line) print as
  // code, swapped in after the cleanup below so it can't rewrite them. The
  // holder's raw value is checked because JSON.stringify applies a
  // function's `toJSON` (see `funcify`) before the replacer sees it.
  const sources = [];
  const placeholder = (code, kind = "source") => {
    sources.push(code);
    return `__d3plus_${kind}_${sources.length - 1}__`;
  };
  const replacer = function (key, value) {
    const raw = this[key];
    if (typeof raw === "function") return placeholder(String(raw));
    if (value && typeof value.__source === "string") return placeholder(value.__source);
    if (
      !["annotations"].includes(key) &&
      value instanceof Array &&
      typeof value[0] === "object"
    ) {
      return value.map(d => placeholder(inline(d), "row"));
    }
    return value;
  };
  return (
    JSON.stringify(config, replacer, indent)
      // "data" cleanup
      .replace(/"(\{[^}]+\})"/g, "$1")
      .replace(/\\"([A-z0-9]+)\\":/g, "$1:")
      .replace(/([^\s]):([^\s^/])/g, "$1: $2")
      .replace(/([^\s]),([^\s])/g, "$1, $2")
      .replace(/\[([^\]^{]+)\]/g, str =>
        str.includes("__d3plus_row_") ? str : str.replace(/ /gm, "").replace(/\n/gm, " "),
      )

      // remove parentheses from keys
      .replace(/"([A-z0-9]+)":/g, "$1:")

      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/^( *).*$/gm, (line, pad) =>
        line.replace(/"__d3plus_(?:source|row)_(\d+)__"/g, (_, i) =>
          sources[i].replace(/\n/g, `\n${pad}`),
        ),
      )
  );
}

const identifier = /^[A-Za-z_$][\w$]*$/;

/** One row (or nested value) as a single line of code. */
const inline = value => {
  if (typeof value === "function") return String(value);
  if (value && typeof value.__source === "string") return value.__source;
  if (Array.isArray(value)) return `[${value.map(inline).join(", ")}]`;
  if (value && typeof value === "object") {
    if (typeof value.toJSON === "function") return inline(value.toJSON());
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    return `{${entries
      .map(([k, v]) => `${identifier.test(k) ? k : JSON.stringify(k)}: ${inline(v)}`)
      .join(", ")}}`;
  }
  return value === undefined ? "undefined" : JSON.stringify(value);
};
