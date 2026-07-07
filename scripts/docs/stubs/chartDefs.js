/**
    Reads each chart's `ChartDefinition` from source so the README generator can
    document `makeChart(...)` charts — which TypeDoc only sees as opaque
    `VizCtor` values. Extracts the base class a chart extends and the
    chart-specific default-overrides declared in `def.fields`.
*/

import fs from "node:fs";
import path from "node:path";
import {parseSync} from "@swc/core";

/** Renders a simple SWC literal/expression node to a short string, or null. */
function renderDefault(node) {
  if (!node) return null;
  switch (node.type) {
    case "NumericLiteral": return String(node.value);
    case "StringLiteral": return `"${node.value}"`;
    case "BooleanLiteral": return String(node.value);
    case "NullLiteral": return "null";
    case "ArrayExpression": return "[]";
    case "ObjectExpression": return "{…}";
    case "CallExpression": {
      const callee = node.callee?.value;
      // `constant(x)` is the idiomatic "constant default" wrapper — unwrap it.
      if (callee === "constant" && node.arguments?.length) {
        const inner = renderDefault(node.arguments[0].expression);
        if (inner != null) return inner;
      }
      return callee ? `${callee}(…)` : null;
    }
    default: return null;
  }
}

const propKey = prop =>
  prop?.key?.value ?? ((prop?.key?.raw || "").replace(/['"]/g, "") || null);

/** Parses one chart `index.ts` → `{base, fields: [{key, default}]}` or null. */
export function parseChartDef(filePath) {
  let src;
  try {
    src = fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
  let ast;
  try {
    ast = parseSync(src, {syntax: "typescript"});
  } catch {
    return null;
  }
  const body = ast.body || [];

  // export default makeChart(<defId>, <BaseId>)
  let defId = null;
  let base = "Viz";
  for (const stmt of body) {
    if (
      stmt.type !== "ExportDefaultExpression" &&
      stmt.type !== "ExportDefaultDeclaration"
    )
      continue;
    const expr = stmt.expression || stmt.decl;
    if (expr?.type === "CallExpression" && expr.callee?.value === "makeChart") {
      const args = expr.arguments || [];
      if (args[0]?.expression?.type === "Identifier") defId = args[0].expression.value;
      if (args[1]?.expression?.type === "Identifier") base = args[1].expression.value;
    }
  }
  if (!defId) return null;

  // const <defId> = { …, fields: [ {key, default}, … ] }
  const fields = [];
  for (const stmt of body) {
    const decls =
      stmt.type === "VariableDeclaration"
        ? stmt.declarations
        : stmt.type === "ExportDeclaration" &&
            stmt.declaration?.type === "VariableDeclaration"
          ? stmt.declaration.declarations
          : null;
    if (!decls) continue;
    for (const d of decls) {
      if (d.id?.value !== defId || d.init?.type !== "ObjectExpression") continue;
      const fieldsProp = d.init.properties.find(p => propKey(p) === "fields");
      if (fieldsProp?.value?.type !== "ArrayExpression") continue;
      for (const el of fieldsProp.value.elements) {
        const obj = el?.expression;
        if (obj?.type !== "ObjectExpression") continue;
        const keyProp = obj.properties.find(p => propKey(p) === "key");
        const defProp = obj.properties.find(p => propKey(p) === "default");
        const key = keyProp?.value?.value;
        if (!key) continue;
        fields.push({key, default: defProp ? renderDefault(defProp.value) : null});
      }
    }
  }
  return {base, fields};
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
