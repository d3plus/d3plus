/**
    Reads each chart's `ChartDefinition` from source so the docs generator can
    document `makeChart(...)` charts — which TypeDoc only sees as opaque
    `VizCtor` values. Extracts the base class a chart extends and the config
    declared in `def.fields`: each key, its default, and its JSDoc comment.
*/

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/** Renders a simple literal/expression node to a short string, or null. */
function renderDefault(node) {
  if (!node) return null;
  switch (node.kind) {
    case ts.SyntaxKind.NumericLiteral: return String(Number(node.text));
    case ts.SyntaxKind.StringLiteral: return `"${node.text}"`;
    case ts.SyntaxKind.TrueKeyword: return "true";
    case ts.SyntaxKind.FalseKeyword: return "false";
    case ts.SyntaxKind.NullKeyword: return "null";
    case ts.SyntaxKind.ArrayLiteralExpression: return "[]";
    case ts.SyntaxKind.PrefixUnaryExpression:
      return node.operator === ts.SyntaxKind.MinusToken &&
        ts.isNumericLiteral(node.operand)
        ? `-${Number(node.operand.text)}`
        : null;
    case ts.SyntaxKind.ObjectLiteralExpression: return "{…}";
    case ts.SyntaxKind.CallExpression: {
      const callee = ts.isIdentifier(node.expression) ? node.expression.text : null;
      // `constant(x)` is the idiomatic "constant default" wrapper — unwrap it.
      if (callee === "constant" && node.arguments.length) {
        const inner = renderDefault(node.arguments[0]);
        if (inner != null) return inner;
      }
      return callee ? `${callee}(…)` : null;
    }
    default: return null;
  }
}

/**
 * Renders the source of a field's `default` (or `factory` body) for a docs
 * table: `accessor("key")` reads as the key it looks up, `constant(x)` as `x`,
 * and anything longer than one short line as `"function"` when it is one.
 */
function renderSource(node, src) {
  if (!node) return null;
  let expr = node;
  while (ts.isAsExpression(expr) || ts.isParenthesizedExpression(expr))
    expr = expr.expression;
  if (ts.isArrowFunction(expr) && !ts.isBlock(expr.body) && expr.parameters.length <= 1) {
    // A factory: document what it returns.
    let body = expr.body;
    while (ts.isParenthesizedExpression(body)) body = body.expression;
    if (!ts.isArrowFunction(body) && !ts.isFunctionExpression(body))
      return renderSource(body, src);
  }
  if (
    ts.isCallExpression(expr) &&
    ts.isIdentifier(expr.expression) &&
    /^(constant|\w*[aA]ccessor)$/.test(expr.expression.text) &&
    expr.arguments.length === 1
  )
    return renderSource(expr.arguments[0], src);
  const text = expr
    .getText(src)
    .replace(/\s+/g, " ")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([{[])\s+/g, "$1")
    .replace(/\s+([}\]])/g, "$1");
  const isFn = ts.isArrowFunction(expr) || ts.isFunctionExpression(expr);
  if (isFn) return "function";
  // A config bag's literal is worth showing whole when it is short.
  const limit = ts.isObjectLiteralExpression(expr) ? 140 : 60;
  if (text.length > limit || text.includes("...")) return null;
  return text;
}

/**
 * The text of the `/** … *\/` comment directly above a node, with the comment
 * markers and indentation stripped. Lines within a paragraph are joined with
 * spaces; blank lines separate paragraphs.
 */
function leadingDoc(node, src) {
  const text = src.getFullText();
  const ranges = ts.getLeadingCommentRanges(text, node.pos) || [];
  const doc = ranges.reverse().find(r => text.slice(r.pos, r.pos + 3) === "/**");
  if (!doc) return "";
  return text
    .slice(doc.pos + 3, doc.end - 2)
    .split("\n")
    // Strip a ` * ` gutter, but not the `*` that opens `*emphasis*`.
    .map(line => line.replace(/^\s*(\*(?!\S))?/, "").trim())
    .join("\n")
    .trim()
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, " "))
    .join("\n\n");
}

/**
 * Splits a doc comment into its description and an optional `@type {…}` tag,
 * which documents the values a config key accepts (TypeScript syntax).
 */
function splitDoc(text) {
  const at = text.search(/(^|\s)@type\s*\{/);
  if (at < 0) return {description: text, type: null};
  const open = text.indexOf("{", at);
  let depth = 0;
  let close = open;
  for (; close < text.length; close++) {
    if (text[close] === "{") depth++;
    else if (text[close] === "}" && --depth === 0) break;
  }
  return {
    description: (text.slice(0, at) + text.slice(close + 1)).trim(),
    type: text.slice(open + 1, close).replace(/\s+/g, " ").trim(),
  };
}

const propKey = prop =>
  prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))
    ? prop.name.text
    : null;

const findProp = (obj, key) =>
  obj.properties.find(p => ts.isPropertyAssignment(p) && propKey(p) === key);

/** Parses the `{key, default}` objects of a `fields` array literal. */
function parseFields(elements, src, filePath) {
  const fields = [];
  for (const obj of elements) {
    if (ts.isSpreadElement(obj)) {
      fields.push(...spreadFields(obj.expression, src, filePath));
      continue;
    }
    if (!ts.isObjectLiteralExpression(obj)) continue;
    const keyProp = findProp(obj, "key");
    const key =
      keyProp && ts.isStringLiteral(keyProp.initializer)
        ? keyProp.initializer.text
        : null;
    if (!key) continue;
    const defProp = findProp(obj, "default");
    const factoryProp = findProp(obj, "factory");
    fields.push({
      key,
      default: defProp ? renderDefault(defProp.initializer) : null,
      defaultText: renderSource((defProp || factoryProp)?.initializer, src),
      ...splitDoc(leadingDoc(obj, src)),
    });
  }
  return fields;
}

/**
 * Follows a `...helperFields()` spread in `fields` to the helper it calls,
 * when that helper is imported from a relative module and returns an array
 * literal of fields, so shared fields keep their JSDoc comments.
 */
function spreadFields(expr, src, filePath) {
  if (!ts.isCallExpression(expr) || !ts.isIdentifier(expr.expression)) return [];
  const name = expr.expression.text;
  let from = null;
  for (const stmt of src.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const named = stmt.importClause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    if (named.elements.some(e => e.name.text === name && !e.propertyName))
      from = stmt.moduleSpecifier.text;
  }
  if (!from || !from.startsWith(".")) return [];
  const helperPath = path.resolve(path.dirname(filePath), from).replace(/\.js$/, ".ts");
  let code;
  try {
    code = fs.readFileSync(helperPath, "utf8");
  } catch {
    return [];
  }
  const helperSrc = ts.createSourceFile(helperPath, code, ts.ScriptTarget.Latest, true);
  const fn = helperSrc.statements.find(
    s => ts.isFunctionDeclaration(s) && s.name?.text === name && s.body,
  );
  const ret = fn?.body.statements.find(s => ts.isReturnStatement(s));
  if (!ret || !ret.expression || !ts.isArrayLiteralExpression(ret.expression)) return [];
  return parseFields(ret.expression.elements, helperSrc, helperPath);
}

/**
 * Parses one chart `index.ts` →
 * `{base, fields: [{key, default, defaultText, description}]}` or null.
 */
export function parseChartDef(filePath) {
  let code;
  try {
    code = fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
  const src = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);

  // export default makeChart(<defId>, <BaseId>)
  let defId = null;
  let base = "Viz";
  for (const stmt of src.statements) {
    if (!ts.isExportAssignment(stmt)) continue;
    const expr = stmt.expression;
    if (
      ts.isCallExpression(expr) &&
      ts.isIdentifier(expr.expression) &&
      expr.expression.text === "makeChart"
    ) {
      const [def, Base] = expr.arguments;
      if (def && ts.isIdentifier(def)) defId = def.text;
      if (Base && ts.isIdentifier(Base)) base = Base.text;
    }
  }
  if (!defId) return null;

  // const <defId> = { …, fields: [ {key, default}, … ] }
  const fields = [];
  for (const stmt of src.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const d of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || d.name.text !== defId) continue;
      if (!d.initializer || !ts.isObjectLiteralExpression(d.initializer)) continue;
      const fieldsProp = findProp(d.initializer, "fields");
      if (!fieldsProp || !ts.isArrayLiteralExpression(fieldsProp.initializer)) continue;
      fields.push(...parseFields(fieldsProp.initializer.elements, src, filePath));
    }
  }
  return {base, fields, accessors: accessorDocs(src)};
}

/**
 * Docs for the accessors a chart installs by hand in its `setup`
 * (`viz.<key> = function(…) {…}`), read from the JSDoc comment above each
 * assignment: `{key: {description, type}}`.
 */
function accessorDocs(src) {
  const docs = {};
  const visit = node => {
    if (
      ts.isExpressionStatement(node) &&
      ts.isBinaryExpression(node.expression) &&
      node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.expression.left) &&
      ts.isFunctionExpression(node.expression.right)
    ) {
      const doc = leadingDoc(node, src);
      if (doc) docs[node.expression.left.name.text] = splitDoc(doc);
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
  return docs;
}

/** Builds `{ChartName: {base, fields}}` for every chart under `chartsDir`. */
export function chartDefMap(chartsDir) {
  const map = {};
  let entries;
  try {
    entries = fs.readdirSync(chartsDir);
  } catch {
    return map;
  }
  for (const name of entries) {
    const idx = path.join(chartsDir, name, "index.ts");
    if (!fs.existsSync(idx)) continue;
    const def = parseChartDef(idx);
    if (def) map[name] = def;
  }
  return map;
}
