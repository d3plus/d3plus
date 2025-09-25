import fs from "node:fs";
import path from "node:path";
import {parseSync, printSync} from "@swc/core";

const hiddenMethods = {
  AreaPlot: ["shape", "zoom"],
  BarChart: ["shape", "zoom"],
  BoxWhisker: ["shape", "zoom"],
  BumpChart: ["shape", "zoom"],
  Donut: ["shape", "zoom"],
  LinePlot: ["shape", "zoom"],
  Pack: ["zoom"],
  Pie: ["zoom"],
  Plot: ["zoom"],
  Priestley: ["zoom"],
  Priestley: ["zoom"],
  Radar: ["zoom"],
  RadialMatrix: ["zoom"],
  Rings: ["zoom"],
  Sankey: ["zoom"],
  StackedArea: ["shape", "zoom"],
  Tree: ["zoom"],
  Treemap: ["shape", "zoom"]
};

function isWrappedInQuotes(str) {
  // Matches a string starting and ending with either single or double quotes
  // The \1 backreference ensures the closing quote matches the opening one
  const regex = /^(['"]).*\1$/;
  return regex.test(str);
}

function removeStartEndQuotes(str) {
  return str.replace(/^['"]|['"]$/g, '');
}

const hasParent = ({augments}) => augments && augments.length ? augments[0] : false;

export default function(story, allMethods, stories) {
  const {kind, name, meta} = story;
  const regex = new RegExp(/packages\/([a-z].+)\/src(\/.*)?/g);
  const [, moduleName, filePath] = regex.exec(meta.path);
  const parentClass = hasParent(story);
  let overrides = {}, parentRelativePath;
  const ancestorClasses = [];
  if (parentClass) {
    const parent = stories.find(d => d.name === parentClass);
    const regex2 = new RegExp(/packages\/([a-z].+)\/src(\/.*)?/g);
    const [, parentModule, parentPath] = regex2.exec(parent.meta.path);
    parentRelativePath = moduleName === parentModule && filePath === parentPath ? `.` :
      moduleName === parentModule ? `${filePath.split("/").slice(1).map(() => "..").join("/")}${parentPath}` :
      `${filePath.split("/").map(() => "..").join("/")}/../${parentModule}/${parentPath}`;

    const storyPath = path.join(story.meta.path, story.meta.filename);
    const fileContent = fs.readFileSync(storyPath, {encoding: "utf8"});
    const {body} = parseSync(fileContent);
    const statements = body.find(d => d.type === "ExportDefaultDeclaration").decl.body
      .find(d => d.type === "Constructor").body.stmts
      .filter(d => d.type === "ExpressionStatement")
      .map(d => d.expression)
      .filter(d => d.type !== "CallExpression" || d.arguments.length);

    let ancestor = story, parentMethods = [];
    while (ancestor) {
      const ancestorMethods = allMethods.filter(d => d.memberof === ancestor.name && d.params.length).map(d => d.name);
      parentMethods = parentMethods.concat(ancestorMethods);
      ancestor = stories.find(d => d.name === hasParent(ancestor));
      if (ancestor) ancestorClasses.push(ancestor.name);
    }

    statements.forEach(statement => {
      depth = 0;
      let method, value;
      if (statement.type === "AssignmentExpression") {
        const {left, right} = statement;
        method = formatAst(left.property);
        if (left.object.type !== "ThisExpression") method = `${formatAst(left.object.property)}.${method}`;
        method = method.replace(/^_/, "");
        value = right;
      }
      else if (statement.type === "CallExpression") {
        const {callee} = statement;
        if (callee.type !== "Super") {
          method = callee.property.value;
          value = statement;
        }
      }
      if (method && parentMethods.includes(method.split(".")[0])) {
        if (method.includes(".")) {
          const [key, subkey] = method.split(/\.(.*)/s);
          if (!overrides[key]) overrides[key] = {}
          overrides[key][subkey] = formatAst(value)
        }
        else {
          overrides[method] = formatAst(value);
        }
      }
    });
  }

  const lower = str => str.charAt(0).toLowerCase() + str.slice(1);

  const disabledMethods = hiddenMethods[name] || [];

  const myMethods = story.kind === "class" 
    ? allMethods.filter(d => d.params && d.params.length && ((overrides.hasOwnProperty(d.name) && ancestorClasses.includes(d.memberof)) || d.memberof === name)).map(d => ({...d.params[0], name: d.name, description: d.description}))
    : story.params;

  const formattedMethods = (myMethods || [])
      .reduce((obj, d) => {

        const {name, optional, type} = d;
        const defaultvalue = overrides.hasOwnProperty(name) ? overrides[name] : d.defaultvalue;

        const types = type.names.map(t => t.toLowerCase());

        const argObject = {
          type: {required: !optional, summary: types.join(" | ")},
          control: { type: undefined },
          description: d.description
        }

        if (type.names.some(isWrappedInQuotes)) {
          const evals = [undefined, null, true, false].map(String);
          argObject.options = type.names.map(name => {
            if (isWrappedInQuotes(name)) return removeStartEndQuotes(name);
            else if (evals.includes(name)) return eval(name);
            return false;
          }).filter(Boolean);
          argObject.control.type = argObject.options.length < 5 ? "radio" : "select";
        }
        else {
          if (types.includes("object") || types.includes("array")) argObject.control.type = "object";
          else if (types.includes("number")) argObject.control.type = "number";
          else if (types.includes("string")) argObject.control.type = "text";
          else if (types.includes("boolean")) argObject.control.type = "boolean";
        }

        if (defaultvalue !== undefined) {
          argObject.defaultValue = defaultvalue;
          const funcDefault = typeof defaultvalue === "string" && defaultvalue.includes("=>");
          argObject.table = {defaultValue: {summary: funcDefault ? "function" : defaultvalue}};
          if (funcDefault) argObject.table.defaultValue.detail = defaultvalue;
        }
        else {
          argObject.table = {
            defaultValue: {summary: "undefined"}
          };
        }
        obj[name.replace(/\*/g, "")] = argObject;

        return obj;

      }, {});

  const methodJSON = JSONstringifyOrder(formattedMethods, 2)
    .replace(/"([^"^.]+)":/g, '$1:');

  return `// WARNING: do not edit this file directly, it is generated dynamically from
// the source JSDOC comments using the npm run docs script.

import React from "react";
${parentClass ? `import {argTypes as ${lower(parentClass)}ArgTypes} from "${parentRelativePath}/${parentClass}.args.jsx";
import {assign} from "@d3plus/dom";
` : ""}
${kind === "class" ? `import {${name} as D3plus${name}} from "@d3plus/react";
export const ${name} = ({ config }) => <D3plus${name} config={config} />;` : ""}

${parentClass ? `export const argTypes = assign(

  /**
   * Filters out unused argTypes from the ${parentClass} primitive and
   * overrides any defaults that have been changed in ${name}
   */
  Object.keys(${lower(parentClass)}ArgTypes)${disabledMethods.length ? `
    .filter(k => !k.match(/^(${disabledMethods.join('|')}.*)$/))` : ""}
    .reduce((obj, k) => (obj[k] = ${lower(parentClass)}ArgTypes[k], obj), {}),

  /**
   * ${name}-specific methods
   */
  
${methodJSON.replace(/^/gm, "  ")}
);`
: `export const argTypes = ${methodJSON};`}
`;

}

const JSONstringifyOrder = (obj, space) => {
  const allKeys = new Set();
  JSON.stringify(obj, (key, value) => (allKeys.add(key), value));
  return JSON.stringify(obj, Array.from(allKeys).sort(), space);
}

const printAst = body => {
  const ast = {type: "Module", body, span: {start: 0, end: 0, ctxt: 0}};
  return printSync(ast).code;
}

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
          return `d => d["${key}"]${def ? ` || ${def}`: ""}`;
        default:
          if (depth === 1) {
            const values = ast.arguments.map(d => formatAst(d.expression));
            return values.length === 1 ? values[0] : values;
          }
          else {
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
        str += i === expressions.length ? `${value}\`` : `${value}\$\{${formatAst(expressions[i])}\}`;
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
      return ast.elements.length > 1 ? `[
  ${ast.elements.map(d => formatAst(d.expression)).join(",\n")}
]` : `[ ${ast.elements.map(d => formatAst(d.expression)).join(",\n")} ]`;
    case "BinaryExpression":
      return `${formatAst(ast.left)} ${ast.operator} ${formatAst(ast.right)}`;
    case "Computed":
      return formatAst(ast.expression);
    default:
      return printAst(ast);
  } 
}