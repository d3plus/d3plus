import fs from "node:fs";
import path from "node:path";
import {parseSync, printSync} from "@swc/core";

// Inherited config each chart fixes for itself, left out of its args. Each
// entry is matched against the whole key (it may be a regex, e.g. "zoom.*").
const hiddenMethods = {
  AreaPlot: ["shape"],
  BarChart: ["shape"],
  Beeswarm: [
    "shape",
    "discrete",
    "discreteCutoff",
    "barPadding",
    "groupPadding",
    "stacked",
    "stackOffset",
    "stackOrder",
    "lineLabels",
    "lineMarkers",
    "lineMarkerConfig",
    "labelConnectorConfig",
    "confidence",
    "confidenceConfig",
  ],
  BoxWhisker: ["shape"],
  BumpChart: ["shape"],
  Chord: ["shape"],
  Donut: ["shape"],
  Histogram: ["shape", "x", "x2", "y", "y2", "discrete"],
  LinePlot: ["shape"],
  Pyramid: ["shape", "discrete", "stacked"],
  StackedArea: ["shape"],
  Sunburst: ["shape"],
  Treemap: ["shape"],
};

function isWrappedInQuotes(str) {
  // Matches a string starting and ending with either single or double quotes
  // The \1 backreference ensures the closing quote matches the opening one
  const regex = /^(['"]).*\1$/;
  return regex.test(str);
}

function removeStartEndQuotes(str) {
  return str.replace(/^['"]|['"]$/g, "");
}

const hasParent = ({augments}) =>
  augments && augments.length ? augments[0] : false;

// Charts/components live in per-export subfolders (e.g. charts/viz/Viz.ts,
// components/Axis/Axis.ts), but the Storybook args/stories are organized flat by
// category. Collapse a source path to its first segment (the category) so the
// generated paths match the flat layout the stories import.
const collapseCategory = p => (p ? `/${p.split("/").filter(Boolean)[0]}` : "");

export default function (
  story,
  allMethods,
  stories,
  configDefaults = {},
  interfaceDocs = {},
) {
  const {kind, name, meta} = story;
  const regex = new RegExp(/packages\/([a-z].+)\/src(\/.*)?/g);
  const [, moduleName, rawFilePath] = regex.exec(meta.path);
  const filePath = collapseCategory(rawFilePath);
  const parentClass = hasParent(story);
  let overrides = {},
    parentRelativePath;
  const ancestorClasses = [];
  if (parentClass) {
    const parent = stories.find(d => d.name === parentClass);
    const regex2 = new RegExp(/packages\/([a-z].+)\/src(\/.*)?/g);
    const [, parentModule, rawParentPath] = regex2.exec(parent.meta.path);
    const parentPath = collapseCategory(rawParentPath);
    parentRelativePath =
      moduleName === parentModule && filePath === parentPath
        ? `.`
        : moduleName === parentModule
          ? `${filePath
              .split("/")
              .slice(1)
              .map(() => "..")
              .join("/")}${parentPath}`
          : `${filePath
              .split("/")
              .map(() => "..")
              .join("/")}/../${parentModule}/${parentPath}`;
  }

  // A class's default overrides come from the `this.method(value)` calls in
  // its constructor; a makeChart chart has no constructor (its overrides are
  // def fields, handled below).
  if (parentClass && !story.chartDef) {
    const storyPath = path.join(story.meta.path, story.meta.filename);
    const fileContent = fs.readFileSync(storyPath, {encoding: "utf8"});
    const {body} = parseSync(fileContent, {
      syntax: "typescript",
    });
    const statements = body
      .find(d => d.type === "ExportDefaultDeclaration")
      .decl.body.find(d => d.type === "Constructor")
      .body.stmts.filter(d => d.type === "ExpressionStatement")
      .map(d => d.expression)
      .filter(d => d.type !== "CallExpression" || d.arguments.length);

    let ancestor = story,
      parentMethods = [];
    while (ancestor) {
      const ancestorMethods = allMethods
        .filter(d => d.memberof === ancestor.name && d.params.length)
        .map(d => d.name);
      parentMethods = parentMethods.concat(ancestorMethods);
      ancestor = stories.find(d => d.name === hasParent(ancestor));
      if (ancestor) ancestorClasses.push(ancestor.name);
    }

    statements.forEach(statement => {
      depth = 0;
      let method, value;
      try {
        if (statement.type === "AssignmentExpression") {
          const {left, right} = statement;
          if (left.type !== "MemberExpression") return;
          method = formatAst(left.property);
          if (left.object.type !== "ThisExpression" && left.object.property)
            method = `${formatAst(left.object.property)}.${method}`;
          method = method.replace(/^_/, "");
          value = right;
        } else if (statement.type === "CallExpression") {
          const {callee} = statement;
          // Only `this.method(default)`-style calls set arg defaults. Skip
          // `super(...)` and bare helper calls like `installFluent(...)`,
          // whose callee is not a member expression (and has no `.property`).
          if (callee.type === "MemberExpression" && callee.property) {
            method = callee.property.value;
            value = statement;
          }
        }
      } catch {
        // Not a recognizable arg-default statement — skip rather than crash
        // the whole docs build on an unexpected constructor shape.
        return;
      }
      if (method && parentMethods.includes(method.split(".")[0])) {
        if (method.includes(".")) {
          const [key, subkey] = method.split(/\.(.*)/s);
          if (!overrides[key]) overrides[key] = {};
          overrides[key][subkey] = formatAst(value);
        } else {
          overrides[method] = formatAst(value);
        }
      }
    });
  }

  const lower = str => str.charAt(0).toLowerCase() + str.slice(1);

  const disabledMethods = hiddenMethods[name] || [];

  const myMethods = story.chartDef
    ? []
    : story.kind === "class"
      ? allMethods
          .filter(
            d =>
              d.params &&
              d.params.length &&
              ((overrides.hasOwnProperty(d.name) &&
                ancestorClasses.includes(d.memberof)) ||
                d.memberof === name ||
                // BaseClass is the universal root every viz/shape/component
                // extends; TypeDoc doesn't always flatten its methods (on,
                // locale, …) into subclasses, so include them explicitly.
                d.memberof === "BaseClass"),
          )
          .map(d => ({
            ...d.params[0],
            name: d.name,
            description: d.description,
          }))
      : story.params;

  const formattedMethods = (myMethods || []).reduce((obj, d) => {
    const {name, optional, type} = d;
    const defaultvalue = overrides.hasOwnProperty(name)
      ? overrides[name]
      : d.defaultvalue;

    const types = type.names.map(t => t.toLowerCase());

    const argObject = {
      type: {required: !optional, summary: types.join(" | ")},
      control: {type: undefined},
      description: d.description,
    };

    if (type.names.some(isWrappedInQuotes)) {
      const evals = [undefined, null, true, false].map(String);
      argObject.options = type.names
        .map(name => {
          if (isWrappedInQuotes(name)) return removeStartEndQuotes(name);
          else if (evals.includes(name)) return eval(name);
          return false;
        })
        .filter(Boolean);
      argObject.control.type =
        argObject.options.length < 5 ? "radio" : "select";
    } else {
      if (types.includes("object") || types.includes("array"))
        argObject.control.type = "object";
      else if (types.includes("number")) argObject.control.type = "number";
      else if (types.includes("string")) argObject.control.type = "text";
      else if (types.includes("boolean")) argObject.control.type = "boolean";
    }

    if (defaultvalue !== undefined) {
      argObject.defaultValue = defaultvalue;
      const funcDefault =
        typeof defaultvalue === "string" && defaultvalue.includes("=>");
      argObject.table = {
        defaultValue: {summary: funcDefault ? "function" : defaultvalue},
      };
      if (funcDefault) argObject.table.defaultValue.detail = defaultvalue;
    } else {
      argObject.table = {
        defaultValue: {summary: "undefined"},
      };
    }
    obj[name.replace(/\*/g, "")] = argObject;

    return obj;
  }, {});

  // Merge in runtime config-accessor keys. Most component/shape/chart config
  // (width, height, x, domain, title, ticks, …) is installed by `installFluent`
  // at runtime, so TypeDoc never sees it as a class member and it's missing
  // from the JSDoc-derived methods above. `configDefaults` maps each class to
  // its `config()` surface (BaseClass's getAllMethods reflection). Add only the
  // keys this class INTRODUCES (absent from its parent's surface) that aren't
  // already documented JSDoc methods or hidden — parent keys arrive through the
  // generated `assign(parentArgTypes, …)` import.
  const ownConfig = configDefaults[name] || {};
  const parentConfig = (parentClass && configDefaults[parentClass]) || {};
  // Prefer this class's own config interface (Axis → AxisConfig) so shared key
  // names like `title` read the right meaning; fall back to the cross-interface
  // merge for inherited/universal keys (shape configs, D3plusConfig).
  const ifaceSpecific =
    (interfaceDocs.byName && interfaceDocs.byName[`${name}Config`]) || {};
  const ifaceMerged = interfaceDocs.merged || {};
  const hideRe = disabledMethods.length
    ? new RegExp(`^(${disabledMethods.join("|")})$`)
    : null;
  if (story.chartDef)
    Object.assign(
      formattedMethods,
      chartArgTypes(story, {
        allMethods,
        stories,
        ownConfig,
        parentConfig,
        interfaceDocs,
        hideRe,
      }),
    );
  else
    for (const key of Object.keys(ownConfig)) {
      const cleanKey = key.replace(/\*/g, "");
      if (cleanKey in parentConfig) continue;
      if (formattedMethods[cleanKey]) continue;
      if (hideRe && hideRe.test(cleanKey)) continue;
      const doc = ifaceSpecific[cleanKey] || ifaceMerged[cleanKey];
      formattedMethods[cleanKey] = configArgType(ownConfig[key], doc);
    }

  const methodJSON = JSONstringifyOrder(formattedMethods, 2).replace(
    /"([^"^.]+)":/g,
    "$1:",
  );

  return `// WARNING: do not edit this file directly, it is generated dynamically from
// the source JSDOC comments using the npm run docs script.

import React from "react";
${
  parentClass
    ? `import {argTypes as ${lower(parentClass)}ArgTypes} from "${parentRelativePath}/${parentClass}.args.jsx";
import {assign} from "@d3plus/dom";
`
    : ""
}
${
  kind === "class"
    ? `import {${name} as D3plus${name}} from "@d3plus/react";
export const ${name} = ({ config }) => <D3plus${name} config={config} />;`
    : ""
}

${
  parentClass
    ? `export const argTypes = assign(

  /**
   * Filters out unused argTypes from the ${parentClass} primitive and
   * overrides any defaults that have been changed in ${name}
   */
  Object.keys(${lower(parentClass)}ArgTypes)${
    disabledMethods.length
      ? `
    .filter(k => !k.match(/^(${disabledMethods.join("|")})$/))`
      : ""
  }
    .reduce((obj, k) => (obj[k] = ${lower(parentClass)}ArgTypes[k], obj), {}),

  /**
   * ${name}-specific methods
   */
  
${methodJSON.replace(/^/gm, "  ")}
);`
    : `export const argTypes = ${methodJSON};`
}
`;
}

/**
 * Renders a runtime default for a docs table: primitives, arrays, and plain
 * objects built from them (e.g. `{step: 0.22, max: 0.6}`). Returns null for
 * anything holding a function or class instance, or that renders too long.
 */
function renderValue(value) {
  const render = v => {
    if (v === null || ["number", "string", "boolean"].includes(typeof v))
      return JSON.stringify(v);
    if (Array.isArray(v)) {
      const items = v.map(render);
      return items.includes(null) ? null : `[${items.join(", ")}]`;
    }
    if (v && Object.getPrototypeOf(v) === Object.prototype) {
      const entries = Object.entries(v).map(([k, x]) => {
        const r = render(x);
        return r == null ? null : `${k}: ${r}`;
      });
      return entries.includes(null) ? null : `{${entries.join(", ")}}`;
    }
    return null;
  };
  const out = render(value);
  return out && out.length <= 80 ? out : null;
}

const isPlainDefault = v =>
  v !== undefined &&
  (Array.isArray(v) || ["number", "string", "boolean"].includes(typeof v));

/** Splits a TypeScript type on its top-level `|`s. */
function typeUnion(type) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < type.length; i++) {
    const c = type[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if ("{[(<".includes(c)) depth++;
    else if ("}])>".includes(c)) depth--;
    else if (c === "|" && !depth) {
      parts.push(type.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(type.slice(start).trim());
  return parts.filter(Boolean);
}

/**
 * The type, control, and options for a config key documented with an
 * `@type {…}` tag. Literal members (`"area"`, `true`, `false`) become the
 * options of a radio/select control.
 */
function typedArg(type) {
  const names = typeUnion(type);
  const arg = {
    type: {required: false, summary: names.join(" | ")},
    control: {type: undefined},
  };
  if (names.some(isWrappedInQuotes)) {
    const literal = n =>
      n === "boolean"
        ? [true, false]
        : n === "true" || n === "false"
          ? [n === "true"]
          : isWrappedInQuotes(n)
            ? [removeStartEndQuotes(n)]
            : [];
    arg.options = names.flatMap(literal);
    arg.control.type = arg.options.length < 5 ? "radio" : "select";
  } else {
    const lower = names.map(n => n.toLowerCase());
    const structured = n =>
      n === "object" || n.startsWith("{") || n.startsWith("[") || n.endsWith("[]");
    if (lower.some(structured)) arg.control.type = "object";
    else if (lower.includes("number")) arg.control.type = "number";
    else if (lower.includes("string")) arg.control.type = "text";
    else if (lower.includes("boolean")) arg.control.type = "boolean";
  }
  return arg;
}

/**
 * A docs-table summary for a chart's default: its runtime value when that
 * renders plainly, else its source (`"value"` for `accessor("value")`).
 */
function defaultSummary(value, field) {
  if (value !== undefined) {
    const rendered = renderValue(value);
    if (rendered) return rendered;
  }
  if (field && field.defaultText) return field.defaultText;
  return typeof value === "function" ? "function" : null;
}

/**
 * Builds the argTypes for a makeChart chart's own config: its ChartDefinition
 * `fields` plus any accessors its `setup` installs. Each is documented by the
 * JSDoc comment above it, whose optional `@type {…}` tag sets the type and
 * control; otherwise both come from `D3plusConfig` (else the runtime default).
 *
 * A key the parent chart doesn't have becomes a full argType. A field that
 * overrides an inherited key becomes a partial argType that `assign` merges
 * over the parent's: its new default, its own `@type`, and its comment
 * appended to the inherited description.
 */
function chartArgTypes(
  story,
  {allMethods, stories, ownConfig, parentConfig, interfaceDocs, hideRe},
) {
  const {fields, accessors} = story.chartDef;
  const typed = (interfaceDocs.byName && interfaceDocs.byName.D3plusConfig) || {};
  const merged = interfaceDocs.merged || {};
  const inheritedDescription = key => {
    let ancestor = stories.find(d => d.name === hasParent(story));
    while (ancestor) {
      const method = allMethods.find(
        d => d.memberof === ancestor.name && d.name === key,
      );
      if (method && method.description) return method.description;
      ancestor = stories.find(d => d.name === hasParent(ancestor));
    }
    return (typed[key] || merged[key] || {}).description || "";
  };

  const fieldsByKey = Object.fromEntries(fields.map(f => [f.key, f]));
  const keys = [...new Set([...fields.map(f => f.key), ...Object.keys(ownConfig)])];
  const out = {};
  for (const key of keys) {
    if (hideRe && hideRe.test(key)) continue;
    const field = fieldsByKey[key];
    const doc = {...(accessors[key] || {})};
    if (field && field.description) doc.description = field.description;
    if (field && field.type) doc.type = field.type;
    const value = ownConfig[key];

    if (key in parentConfig) {
      if (!field && !doc.description) continue;
      const arg = doc.type ? typedArg(doc.type) : {};
      if (doc.description) {
        const inherited = inheritedDescription(key);
        arg.description = inherited
          ? `${inherited}\n\n${doc.description}`
          : doc.description;
      }
      const rendered = renderValue(value);
      const inheritsDefault =
        value === parentConfig[key] ||
        (rendered !== null && rendered === renderValue(parentConfig[key]));
      if (!inheritsDefault) {
        if (isPlainDefault(value)) withDefault(arg, value);
        else {
          const summary = defaultSummary(value, field);
          if (summary) arg.table = {defaultValue: {summary}};
        }
      }
      if (Object.keys(arg).length) out[key] = arg;
      continue;
    }

    const iface = typed[key] || merged[key];
    const arg = doc.type
      ? withDefault(typedArg(doc.type), value)
      : configArgType(value, iface);
    arg.description = doc.description || (iface && iface.description) || "";
    if (arg.defaultValue === undefined) {
      const summary = defaultSummary(value, field);
      if (summary) arg.table = {defaultValue: {summary}};
    }
    out[key] = arg;
  }
  return out;
}

/**
 * Attaches the runtime default of an installFluent accessor (primitives +
 * arrays only — functions/objects aren't editable defaults) to an argType.
 */
function withDefault(arg, value) {
  const vt = Array.isArray(value) ? "array" : typeof value;
  if (
    value !== undefined &&
    (vt === "number" || vt === "string" || vt === "boolean" || vt === "array")
  ) {
    arg.defaultValue = value;
    arg.table = {
      defaultValue: {
        summary: vt === "array" ? JSON.stringify(value) : String(value),
      },
    };
  } else {
    arg.table = {defaultValue: {summary: "undefined"}};
  }
  return arg;
}

/**
 * Builds a Storybook argType for an installFluent accessor.
 *
 * Prefers the typed config interface (`D3plusConfig`, `AxisConfig`, shape
 * configs) when it documents the key (`doc.names` + `doc.description`): that
 * yields a real control + description even when the runtime default is
 * `undefined` (e.g. Axis `title`/`ticks`), reusing the same name→control
 * mapping as JSDoc methods (incl. radio/select for string-literal unions).
 * Otherwise it infers the control purely from the runtime value's type;
 * functions/unset values get no control but are still listed so `configify`
 * keeps story-set values and the key shows in the Code view.
 */
function configArgType(value, doc) {
  if (doc && doc.names && doc.names.length) {
    const types = doc.names.map(t => t.toLowerCase());
    const arg = {
      type: {required: false, summary: types.join(" | ")},
      control: {type: undefined},
      description: doc.description || "",
    };
    if (doc.names.some(isWrappedInQuotes)) {
      const evals = [undefined, null, true, false].map(String);
      arg.options = doc.names
        .map(n =>
          isWrappedInQuotes(n)
            ? removeStartEndQuotes(n)
            : evals.includes(n)
              ? eval(n)
              : false,
        )
        .filter(Boolean);
      arg.control.type = arg.options.length < 5 ? "radio" : "select";
    } else if (
      types.some(
        t =>
          t === "object" ||
          t.startsWith("record") ||
          t.startsWith("array") ||
          t.endsWith("[]"),
      )
    )
      arg.control.type = "object";
    else if (types.includes("number")) arg.control.type = "number";
    else if (types.includes("string")) arg.control.type = "text";
    else if (types.includes("boolean")) arg.control.type = "boolean";
    // If the interface type didn't resolve to a control (e.g. an unexpanded
    // type alias like `AxisScale`) but the runtime default is a primitive,
    // infer the control from the value so it stays editable.
    if (!arg.control.type) {
      const vt = Array.isArray(value) ? "array" : typeof value;
      if (vt === "number") arg.control.type = "number";
      else if (vt === "string") arg.control.type = "text";
      else if (vt === "boolean") arg.control.type = "boolean";
      else if (vt === "array") arg.control.type = "object";
    }
    return withDefault(arg, value);
  }

  const t = Array.isArray(value)
    ? "array"
    : value === null
      ? "null"
      : typeof value;
  const summary =
    t === "array"
      ? "array"
      : t === "object"
        ? "record"
        : t === "undefined" || t === "null"
          ? "unknown"
          : t;
  const arg = {
    type: {required: false, summary},
    control: {type: undefined},
    description: "",
  };
  if (t === "number") arg.control.type = "number";
  else if (t === "string") arg.control.type = "text";
  else if (t === "boolean") arg.control.type = "boolean";
  else if (t === "array" || t === "object") arg.control.type = "object";
  return withDefault(arg, value);
}

const JSONstringifyOrder = (obj, space) => {
  const allKeys = new Set();
  JSON.stringify(obj, (key, value) => (allKeys.add(key), value));
  return JSON.stringify(obj, Array.from(allKeys).sort(), space);
};

const printAst = body => {
  try {
    const ast = {type: "Module", body, span: {start: 0, end: 0, ctxt: 0}};
    return printSync(ast).code;
  } catch {
    return "unknown";
  }
};

let depth = 0;
const formatAst = ast => {
  depth = depth + 1;
  if (!ast) return "unknown format";
  switch (ast.type) {
    case "Identifier":
      return ast.value;
    case "VariableDeclaration":
      return printAst(ast);
    case "ThisExpression":
      return "this";
    case "MemberExpression":
      return `${formatAst(ast.object)}.${formatAst(ast.property)}`;
    case "ObjectExpression":
      const properties = ast.properties.map(formatAst);
      return `{${properties.length === 1 ? properties[0] : properties.join(", ")}}`;
    case "BlockStatement":
      return `{\n  ${printAst(ast.stmts).replaceAll(/\n(?=.*\n)/g, "\n  ")}}`;
    case "KeyValueProperty":
      return `${ast.key.value}: ${formatAst(ast.value)}`;
    case "MethodProperty":
      return `${formatAst(ast.key)}(${ast.params.map(d => d.value).join(", ")}) {\n${formatAst(ast.body)}\n}`;
    case "ArrowFunctionExpression":
      return `(${ast.params.map(d => d.value).join(", ")}) => ${formatAst(ast.body)}`;
    case "CallExpression":
      switch (ast.callee.value) {
        case "constant":
          const constants = ast.arguments.map(d => formatAst(d.expression));
          return constants.length === 1 ? constants[0] : constants;
        case "accessor":
          const [key, def] = ast.arguments.map(d => formatAst(d.expression));
          return `d => d["${key}"]${def ? ` || ${def}` : ""}`;
        default:
          if (depth === 1) {
            const values = ast.arguments.map(d => formatAst(d.expression));
            return values.length === 1 ? values[0] : values;
          } else {
            const values = ast.arguments.map(d => formatAst(d.expression));
            return `${formatAst(ast.callee)}(${values.join(", ")})`;
          }
      }
    case "ConditionalExpression":
      const {test, consequent, alternate} = ast;
      return `${formatAst(test)} ? ${formatAst(consequent)} : ${formatAst(alternate)}`;
    case "NumericLiteral":
    case "StringLiteral":
      return ast.value;
    case "SpreadElement":
      return `...${formatAst(ast.arguments)}`;
    case "RegExpLiteral":
      return `/${ast.pattern}/${ast.flags}`;
    case "TemplateLiteral":
      const expressions = ast.expressions;
      return ast.quasis.reduce((str, d, i) => {
        const value = d.cooked;
        str +=
          i === expressions.length
            ? `${value}\``
            : `${value}\$\{${formatAst(expressions[i])}\}`;
        return str;
      }, "`");
    case "BooleanLiteral":
      return ast.value;
    case "NullLiteral":
      return "null";
    case "NewExpression":
      return `new ${formatAst(ast.callee)}()`;
    case "UnaryExpression":
    case "UpdateExpression":
      return `${ast.operator}${formatAst(ast.argument)}`;
    case "ParenthesisExpression":
      return `(${formatAst(ast.expression)})`;
    case "ArrayExpression":
      return ast.elements.length > 1
        ? `[
  ${ast.elements.map(d => formatAst(d.expression)).join(",\n")}
]`
        : `[ ${ast.elements.map(d => formatAst(d.expression)).join(",\n")} ]`;
    case "BinaryExpression":
      return `${formatAst(ast.left)} ${ast.operator} ${formatAst(ast.right)}`;
    case "Computed":
      return formatAst(ast.expression);
    default:
      return printAst(ast);
  }
};
