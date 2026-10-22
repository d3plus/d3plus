/**
    Reads each chart's `ChartDefinition` from source so the docs generator can
    document `makeChart(...)` charts — which TypeDoc only sees as opaque
    `VizCtor` values. Extracts the base class a chart extends and the config
    it declares: each `def.fields` key, each `def.defaults` key, and each
    setter its `setup` calls, with its default and its JSDoc comment.
*/

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/** Renders a simple literal/expression node to a short string, or null. */
function renderDefault(node) {
  if (!node) return null;
  switch (node.kind) {
    case ts.SyntaxKind.NumericLiteral:
      return String(Number(node.text));
    case ts.SyntaxKind.StringLiteral:
      return `"${node.text}"`;
    case ts.SyntaxKind.TrueKeyword:
      return "true";
    case ts.SyntaxKind.FalseKeyword:
      return "false";
    case ts.SyntaxKind.NullKeyword:
      return "null";
    case ts.SyntaxKind.ArrayLiteralExpression:
      return "[]";
    case ts.SyntaxKind.PrefixUnaryExpression:
      return node.operator === ts.SyntaxKind.MinusToken &&
        ts.isNumericLiteral(node.operand)
        ? `-${Number(node.operand.text)}`
        : null;
    case ts.SyntaxKind.ObjectLiteralExpression:
      return "{…}";
    case ts.SyntaxKind.CallExpression: {
      const callee = ts.isIdentifier(node.expression)
        ? node.expression.text
        : null;
      // `constant(x)` is the idiomatic "constant default" wrapper — unwrap it.
      if (callee === "constant" && node.arguments.length) {
        const inner = renderDefault(node.arguments[0]);
        if (inner != null) return inner;
      }
      return callee ? `${callee}(…)` : null;
    }
    default:
      return null;
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
  if (
    ts.isArrowFunction(expr) &&
    !ts.isBlock(expr.body) &&
    expr.parameters.length <= 1
  ) {
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
  const doc = ranges
    .reverse()
    .find(r => text.slice(r.pos, r.pos + 3) === "/**");
  if (!doc) return "";
  return (
    text
      .slice(doc.pos + 3, doc.end - 2)
      .split("\n")
      // Strip a ` * ` gutter, but not the `*` that opens `*emphasis*`.
      .map(line => line.replace(/^\s*(\*(?!\S))?/, "").trim())
      .join("\n")
      .trim()
      .split(/\n{2,}/)
      .map(p => p.replace(/\n/g, " "))
      .join("\n\n")
  );
}

/**
 * Splits a doc comment into its description, an optional `@type {…}` tag,
 * which documents the values a config key accepts (TypeScript syntax), and an
 * optional `@default …` tag, which names a default the source can't show
 * plainly (a factory's result). The `@default` text runs to the next tag or
 * the end of the comment.
 */
export function splitDoc(text) {
  const tag = /(^|\s)@default\s+([^@]*?)\s*(?=\s@\w|$)/s.exec(text);
  const defaultTag = tag ? tag[2].replace(/\s+/g, " ") : null;
  if (tag)
    text = (
      text.slice(0, tag.index) + text.slice(tag.index + tag[0].length)
    ).trim();
  return {...splitType(text), defaultTag};
}

/** Splits a doc comment into its description and an optional `@type {…}` tag. */
function splitType(text) {
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
    type: text
      .slice(open + 1, close)
      .replace(/\s+/g, " ")
      .trim(),
  };
}

/**
 * The value of a plain literal node (number, string, boolean, null, or an
 * array of those), or undefined for anything else.
 */
function literalValue(node) {
  if (!node) return undefined;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text);
  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map(literalValue);
    return items.includes(undefined) ? undefined : items;
  }
  return undefined;
}

/**
 * A config default set outside `def.fields` (a `def.defaults` entry or a
 * setter call in `setup`): its key, rendered default, literal value, and the
 * JSDoc comment above it. `inherited` marks it as a key the def doesn't
 * declare, which `publicChartDefs` keeps only when the chart has an accessor
 * for it (`defaults` also seeds internal flags, like Calendar's
 * `hoverOutline`).
 */
function defaultEntry(key, valueNode, docNode, src) {
  const entry = {
    key,
    inherited: true,
    default: renderDefault(valueNode),
    defaultText: renderSource(valueNode, src),
    ...splitDoc(leadingDoc(docNode, src)),
  };
  const value = literalValue(valueNode);
  if (value !== undefined) entry.value = value;
  return entry;
}

/** The `{key: value}` entries of a def's `defaults` object literal. */
function parseDefaults(obj, src) {
  if (!obj || !ts.isObjectLiteralExpression(obj)) return [];
  return obj.properties
    .filter(p => ts.isPropertyAssignment(p) && propKey(p))
    .map(p => defaultEntry(propKey(p), p.initializer, p, src));
}

/**
 * The defaults a def's `setup(viz)` sets for inherited keys at its top level:
 * a setter call with one argument (`viz.stackOffset("expand")`), or a private
 * field set through that setter's normalizer
 * (`viz._stackOffset = resolveStackOffset("expand")`), which is what the
 * setter does with its argument. Other private assignments are internal
 * state, not documented defaults.
 */
function parseSetup(def, src) {
  const prop = def.properties.find(
    p =>
      propKey(p) === "setup" &&
      (ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p)),
  );
  if (!prop) return [];
  const fn = ts.isPropertyAssignment(prop) ? prop.initializer : prop;
  if (!fn || !fn.body || !ts.isBlock(fn.body)) return [];
  const param = fn.parameters?.[0];
  if (!param || !ts.isIdentifier(param.name)) return [];
  const onViz = node =>
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === param.name.text;
  const entries = [];
  for (const stmt of fn.body.statements) {
    if (!ts.isExpressionStatement(stmt)) continue;
    const expr = stmt.expression;
    if (
      ts.isCallExpression(expr) &&
      expr.arguments.length === 1 &&
      onViz(expr.expression) &&
      !expr.expression.name.text.startsWith("_")
    )
      entries.push(
        defaultEntry(expr.expression.name.text, expr.arguments[0], stmt, src),
      );
    else if (
      ts.isBinaryExpression(expr) &&
      expr.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      onViz(expr.left) &&
      expr.left.name.text.startsWith("_") &&
      ts.isCallExpression(expr.right) &&
      ts.isIdentifier(expr.right.expression) &&
      /^resolve[A-Z]/.test(expr.right.expression.text) &&
      expr.right.arguments.length === 1
    )
      entries.push(
        defaultEntry(
          expr.left.name.text.slice(1),
          expr.right.arguments[0],
          stmt,
          src,
        ),
      );
  }
  return entries;
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
  if (!ts.isCallExpression(expr) || !ts.isIdentifier(expr.expression))
    return [];
  const name = expr.expression.text;
  let from = null;
  for (const stmt of src.statements) {
    if (
      !ts.isImportDeclaration(stmt) ||
      !ts.isStringLiteral(stmt.moduleSpecifier)
    )
      continue;
    const named = stmt.importClause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    if (named.elements.some(e => e.name.text === name && !e.propertyName))
      from = stmt.moduleSpecifier.text;
  }
  if (!from || !from.startsWith(".")) return [];
  const helperPath = path
    .resolve(path.dirname(filePath), from)
    .replace(/\.js$/, ".ts");
  let code;
  try {
    code = fs.readFileSync(helperPath, "utf8");
  } catch {
    return [];
  }
  const helperSrc = ts.createSourceFile(
    helperPath,
    code,
    ts.ScriptTarget.Latest,
    true,
  );
  const fn = helperSrc.statements.find(
    s => ts.isFunctionDeclaration(s) && s.name?.text === name && s.body,
  );
  const ret = fn?.body.statements.find(s => ts.isReturnStatement(s));
  if (!ret || !ret.expression || !ts.isArrayLiteralExpression(ret.expression))
    return [];
  return parseFields(ret.expression.elements, helperSrc, helperPath);
}

/**
 * Parses one chart `index.ts` →
 * `{base, fields: [{key, default, defaultText, defaultTag, description, type,
 * value?}], accessors}` or null. `fields` lists the def's `fields`, then the
 * keys its `defaults` and `setup` set; `value` is a plain literal default.
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
      if (!d.initializer || !ts.isObjectLiteralExpression(d.initializer))
        continue;
      const fieldsProp = findProp(d.initializer, "fields");
      if (fieldsProp && ts.isArrayLiteralExpression(fieldsProp.initializer))
        fields.push(
          ...parseFields(fieldsProp.initializer.elements, src, filePath),
        );
      // Defaults set outside `fields`: `defaults` seeds `viz._<key>`, and
      // `setup` may call inherited setters. A field wins over either.
      const declared = new Set(fields.map(f => f.key));
      for (const entry of [
        ...parseDefaults(findProp(d.initializer, "defaults")?.initializer, src),
        ...parseSetup(d.initializer, src),
      ])
        if (!declared.has(entry.key)) {
          declared.add(entry.key);
          fields.push(entry);
        }
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

/**
 * Drops the `defaults`/`setup` entries of each chart in `defMap` that name no
 * accessor on the chart, read from the package's built module `mod` (a chart
 * that can't be built keeps only its declared fields). Returns a new map.
 */
export function publicChartDefs(defMap, mod) {
  const out = {};
  for (const [name, def] of Object.entries(defMap)) {
    let inst = null;
    try {
      inst = typeof mod?.[name] === "function" ? new mod[name]() : null;
    } catch {
      inst = null;
    }
    const fields = def.fields.filter(
      f =>
        !f.inherited ||
        (inst && !f.key.startsWith("_") && typeof inst[f.key] === "function"),
    );
    out[name] = {...def, fields};
  }
  return out;
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

/**
 * Replaces each chart's type line (TypeDoc's view of a `makeChart(...)` value)
 * with the base class it extends plus a table of the chart-specific config
 * declared in its ChartDefinition. The line reads `> **Name**: \`VizCtor\``
 * when TypeDoc reads the chart's source, or `> \`const\` **Name**: () =>
 * \`any\`` when it reads the chart's declaration file (the @d3plus/types
 * README), where `makeChart` returns `new () => any` and the section also
 * lists that constructor's `any` return.
 */
export function injectChartConfig(readme, defMap) {
  for (const [name, def] of Object.entries(defMap)) {
    const anchor = def.base.toLowerCase();
    let block = `Extends [\`${def.base}\`](#${anchor}) — accepts all of its configuration.`;
    if (def.fields.length) {
      block +=
        " Adds or overrides these defaults:\n\n| Method | Default |\n| --- | --- |\n";
      for (const f of def.fields) {
        const shown = f.defaultTag ?? f.default;
        block += `| \`${f.key}\` | ${shown != null ? `\`${shown}\`` : "—"} |\n`;
      }
    }
    const typeLine = `> (?:\`const\` )?\\*\\*${name}\\*\\*: (?:\`[^\\n]*\`|\\(\\) => \`any\`)`;
    // A declaration-file section: drop the constructor's `Returns any` block.
    const returns =
      "((?:(?!\\n\\*\\*\\*\\n|\\n#{1,3} )[\\s\\S])*?)\\n#### Returns\\n\\n`any`\\n";
    readme = readme
      .replace(
        new RegExp(`${typeLine}${returns}`),
        (_, rest) => `${block}${rest}`,
      )
      .replace(new RegExp(typeLine), block);
  }
  return readme;
}
