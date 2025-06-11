/**
 * converts d3plus config to pretty string output
 */
export default function(config, indent = 2) {

  return JSON.stringify(config, replacer, indent)
    // "data" cleanup
    .replace(/\"(\{[^\}]+\})\"/g, "$1")
    .replace(/\\"([A-z0-9]+)\\"\:/g, "$1:")
    .replace(/([^\s]):([^\s^\/])/g, "$1: $2")
    .replace(/([^\s]),([^\s])/g, "$1, $2")
    .replace(/\[([^\]^\{]+)\]/g, str => str.replace(/ /gm, "").replace(/\n/gm, " "))

    // remove parentheses from keys
    .replace(/\"([A-z0-9]+)\"\:/g, "$1:")

    // cleans up funcitons
    .replace(/\"([^=].+=)> ([^\"].+)\"/g, "$1> $2")
    .replace(/\:\s\"function\(([^\"].+)\"/g, "($1")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, "\"");

}

const replacer = (key, value) => {
  if (!["annotations"].includes(key) && value instanceof Array && typeof value[0] === "object") {
    return value.map(d => JSON.stringify(d));
  }
  return value;
}