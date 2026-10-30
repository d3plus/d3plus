import {parse} from "acorn";
import type {Expression, Node, ObjectExpression, Property} from "acorn";

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** The object literal assigned to the top-level `const config`, if any. */
export function findConfig(code: string): ObjectExpression | null {
  let program;
  try {
    program = parse(code, {ecmaVersion: "latest", sourceType: "module"});
  } catch {
    return null;
  }
  for (const statement of program.body) {
    if (statement.type !== "VariableDeclaration") continue;
    for (const d of statement.declarations)
      if (
        d.id.type === "Identifier" &&
        d.id.name === "config" &&
        d.init &&
        d.init.type === "ObjectExpression"
      )
        return d.init;
  }
  return null;
}

/** A property's key as written (`sum`, `"sum"` and `["sum"]` all read `sum`). */
function keyName(property: Node): string | null {
  if (property.type !== "Property") return null;
  const {key, computed} = property as Property;
  if (key.type === "Identifier" && !computed) return key.name;
  if (key.type === "Literal") return String(key.value);
  return null;
}

/** The top-level keys of `config`, in source order. */
export function configKeys(code: string): string[] {
  const config = findConfig(code);
  if (!config) return [];
  return config.properties.map(keyName).filter((k): k is string => k !== null);
}

/** The whitespace a line starts with, for the line holding `index`. */
function lineIndent(code: string, index: number): string {
  const start = code.lastIndexOf("\n", index - 1) + 1;
  return code.slice(start).match(/^[ \t]*/)?.[0] ?? "";
}

/**
 * Sets `config[key]` to `value` in the code: rewrites the property's value
 * when it is there, or adds the property after the last one. Values print as
 * JSON, which covers every scalar a control produces. Returns the code as is
 * when it has no `const config = {…}` to patch.
 */
export function patchConfig(code: string, key: string, value: unknown): string {
  const config = findConfig(code);
  if (!config) return code;
  const printed = value === undefined ? "undefined" : JSON.stringify(value);
  const existing = config.properties.find(p => keyName(p) === key) as
    Property | undefined;
  if (existing) {
    const node = existing.value as Expression;
    const prefix = existing.shorthand ? `${key}: ` : "";
    return code.slice(0, node.start) + prefix + printed + code.slice(node.end);
  }

  const property = `${IDENTIFIER.test(key) ? key : JSON.stringify(key)}: ${printed}`;
  const last = config.properties[config.properties.length - 1];
  if (!last) {
    const pad = lineIndent(code, config.start);
    return `${code.slice(0, config.start)}{\n${pad}  ${property},\n${pad}}${code.slice(config.end)}`;
  }
  const pad = lineIndent(code, last.start);
  const after = code.slice(last.end);
  const comma = after.match(/^\s*,/);
  const at = last.end + (comma ? comma[0].length : 0);
  return `${code.slice(0, at)}${comma ? "" : ","}\n${pad}${property}${comma ? "," : ""}${code.slice(at)}`;
}
