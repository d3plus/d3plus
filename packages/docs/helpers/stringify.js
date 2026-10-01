/**
 * converts d3plus config to pretty string output
 */
export default function (config, indent = 2) {
  // Values built with `datafy` print as their generator source, swapped in
  // after the cleanup below so it can't rewrite the code itself.
  const sources = [];
  const replacer = (key, value) => {
    if (value && typeof value.__source === "string") {
      sources.push(value.__source);
      return `__d3plus_source_${sources.length - 1}__`;
    }
    return rowReplacer(key, value);
  };
  return (
    JSON.stringify(config, replacer, indent)
      // "data" cleanup
      .replace(/\"(\{[^\}]+\})\"/g, "$1")
      .replace(/\\"([A-z0-9]+)\\"\:/g, "$1:")
      .replace(/([^\s]):([^\s^\/])/g, "$1: $2")
      .replace(/([^\s]),([^\s])/g, "$1, $2")
      .replace(/\[([^\]^\{]+)\]/g, str =>
        str.replace(/ /gm, "").replace(/\n/gm, " "),
      )

      // remove parentheses from keys
      .replace(/\"([A-z0-9]+)\"\:/g, "$1:")

      // cleans up funcitons
      .replace(/\"([^=].+=)> ([^\"].+)\"/g, "$1> $2")
      .replace(/\:\s\"function\(([^\"].+)\"/g, "($1")
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/( *)(.*)"__d3plus_source_(\d+)__"/g, (_, pad, before, i) =>
        pad + before + sources[i].replace(/\n/g, `\n${pad}`),
      )
  );
}

const rowReplacer = (key, value) => {
  if (
    !["annotations"].includes(key) &&
    value instanceof Array &&
    typeof value[0] === "object"
  ) {
    return value.map(d => JSON.stringify(d));
  }
  return value;
};
