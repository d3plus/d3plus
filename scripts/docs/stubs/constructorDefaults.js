import fs from "node:fs";
import path from "node:path";
import {parseSync} from "@swc/core";

const parse = file =>
  parseSync(fs.readFileSync(file, {encoding: "utf8"}), {syntax: "typescript"})
    .body;

const isThis = node => node?.type === "ThisExpression";

/** The object a member chain (`a.b.c`, `a.b(…)`) starts from. */
function rootObject(node) {
  let current = node;
  while (current) {
    if (current.type === "CallExpression") current = current.callee;
    else if (current.type === "MemberExpression") current = current.object;
    else return current;
  }
  return current;
}

/**
 * A copy of `node` with every reference to the identifier `name` replaced by
 * `this` (property names and object keys that happen to match are kept).
 */
function asThis(node, name) {
  if (Array.isArray(node)) return node.map(n => asThis(n, name));
  if (!node || typeof node !== "object") return node;
  if (node.type === "Identifier" && node.value === name)
    return {type: "ThisExpression", span: node.span};
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    const isName =
      (key === "property" && node.type === "MemberExpression") ||
      (key === "key" && node.type === "KeyValueProperty");
    out[key] = isName ? value : asThis(value, name);
  }
  return out;
}

/**
 * The function an identifier names in a module's body: one declared there, or
 * one it imports from a relative `.js` path (resolved to the `.ts` source).
 * @returns {{fn: object, file: string} | undefined}
 */
function resolveFunction(body, file, name) {
  for (const node of body) {
    const decl = node.type === "ExportDeclaration" ? node.declaration : node;
    if (decl.type === "FunctionDeclaration" && decl.identifier.value === name)
      return {fn: decl, file};
  }
  for (const node of body) {
    if (node.type !== "ImportDeclaration" || node.typeOnly) continue;
    const spec = node.specifiers.find(
      s => s.type === "ImportSpecifier" && s.local.value === name,
    );
    if (!spec || !node.source.value.startsWith(".")) continue;
    const target = path
      .resolve(path.dirname(file), node.source.value)
      .replace(/\.js$/, ".ts");
    if (!fs.existsSync(target)) return undefined;
    const imported = spec.imported ? spec.imported.value : name;
    return resolveFunction(parse(target), target, imported);
  }
  return undefined;
}

/**
 * The expressions a statement list runs on `this`, following calls that hand
 * `this` to a helper function (`initDefaults(this)`) into that helper's body,
 * where the helper's parameter reads as `this`.
 */
function selfExpressions(stmts, body, file, depth) {
  const out = [];
  for (const stmt of stmts) {
    if (stmt.type !== "ExpressionStatement") continue;
    const expr = stmt.expression;
    const [first] = expr.arguments || [];
    if (
      depth < 3 &&
      expr.type === "CallExpression" &&
      expr.callee.type === "Identifier" &&
      first &&
      isThis(first.expression)
    ) {
      const helper = resolveFunction(body, file, expr.callee.value);
      const param = helper && helper.fn.params[0];
      if (param && param.pat.type === "Identifier") {
        out.push(
          ...selfExpressions(
            asThis(helper.fn.body.stmts, param.pat.value),
            helper.file === file ? body : parse(helper.file),
            helper.file,
            depth + 1,
          ),
        );
      }
      continue;
    }
    const target = expr.type === "AssignmentExpression" ? expr.left : expr;
    if (isThis(rootObject(target))) out.push(expr);
  }
  return out;
}

/**
 * The expressions a class's constructor runs on its instance — its own
 * `this.x = …` / `this.method(…)` statements, and those of any helper it
 * passes `this` to — in the order they run.
 * @param {string} file the class's source file
 * @returns {object[]} swc expression nodes
 */
export function constructorExpressions(file) {
  const body = parse(file);
  const ctor = body
    .find(d => d.type === "ExportDefaultDeclaration")
    .decl.body.find(d => d.type === "Constructor");
  return selfExpressions(ctor.body.stmts, body, file, 0);
}
