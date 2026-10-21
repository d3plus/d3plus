#!/usr/bin/env node
/**
    One-off codemod: ports mocha test files to Vitest.

      node scripts/migration/mocha-to-vitest.cjs [--browser] [--timeout=N] <file…>

    - `../es/<path>.js(x)` imports → the TypeScript source they were built from
    - `import it from "<…>/jsdom.js"` → `useJsdom()` (files that mix jsdom and
      plain tests get the `jsdomit` wrapper instead)
    - `<…>/playwright.js` → `~test/browser/render.js` (with --browser, also the
      browser `assert` shim), dropping the closeBrowser/bundle hooks
    - `before`/`after` → `beforeAll`/`afterAll`
    - `this.timeout(N)` → a `{timeout: N}` option when N exceeds --timeout,
      otherwise removed
    - explicit `vitest` imports
    Prints what still needs a hand edit.
*/
const fs = require("node:fs");
const path = require("node:path");
const {createRequire} = require("node:module");

const espree = createRequire(require.resolve("eslint"))("espree");

const args = process.argv.slice(2);
const browser = args.includes("--browser");
const noAugment = args.includes("--no-augment");
const timeoutArg = args.find(a => a.startsWith("--timeout="));
const defaultTimeout = timeoutArg ? Number(timeoutArg.split("=")[1]) : 5000;
const files = args.filter(a => !a.startsWith("--"));

const VITEST_NAMES = ["describe", "it", "test", "beforeAll", "afterAll", "beforeEach", "afterEach", "expect", "vi"];

function walk(node, visit, parent) {
  if (!node || typeof node.type !== "string") return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach(c => walk(c, visit, node));
    else if (child && typeof child.type === "string") walk(child, visit, node);
  }
}

/** Maps an `es/` import specifier to the source file it was built from. */
function sourceFor(file, spec) {
  if (!/^\.\.?\//.test(spec) || !/(^|\/)es\//.test(spec)) return null;
  const abs = path.resolve(path.dirname(file), spec);
  const match = abs.match(/^(.*\/packages\/[^/]+)\/es\/(.*)\.jsx?$/);
  if (!match) return null;
  const base = path.join(match[1], match[2]);
  const target = [".ts", ".tsx"].map(ext => base + ext).find(f => fs.existsSync(f));
  if (!target) return null;
  let rel = path.relative(path.dirname(file), target);
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function transform(file) {
  let src = fs.readFileSync(file, "utf8");
  const notes = [];
  const edits = [];
  const ast = espree.parse(src, {ecmaVersion: "latest", sourceType: "module", range: true});

  let jsdomLocal = null;
  let usesPlaywright = false;
  const dropNames = new Set();

  for (const node of ast.body) {
    if (node.type !== "ImportDeclaration") continue;
    const spec = node.source.value;
    const mapped = sourceFor(file, spec);
    if (mapped) edits.push([node.source.range[0], node.source.range[1], JSON.stringify(mapped)]);
    if (/(^|\/)jsdom\.js$/.test(spec) && spec.startsWith(".")) {
      jsdomLocal = node.specifiers[0].local.name;
      edits.push([node.range[0], node.range[1], "@@JSDOM@@"]);
    }
    if (/(^|\/)playwright\.js$/.test(spec) && spec.startsWith(".")) {
      usesPlaywright = true;
      const keep = [];
      for (const s of node.specifiers) {
        const name = s.imported ? s.imported.name : s.local.name;
        if (name === "closeBrowser" || name === "bundle") dropNames.add(s.local.name);
        else if (name === "render") keep.push(s.local.name === "render" ? "render" : `render as ${s.local.name}`);
        else {
          keep.push(name);
          notes.push(`imports ${name} from playwright.js`);
        }
      }
      edits.push([node.range[0], node.range[1], keep.length ? `import {${keep.join(", ")}} from "~test/browser/render.js";` : ""]);
    }
    if (browser && (spec === "assert" || spec === "node:assert")) {
      edits.push([node.source.range[0], node.source.range[1], JSON.stringify("~test/browser/assert.js")]);
    }
  }

  walk(ast, (node, parent) => {
    // Dynamic imports of es/ modules.
    if (node.type === "ImportExpression" && node.source.type === "Literal") {
      const mapped = sourceFor(file, node.source.value);
      if (mapped) edits.push([node.source.range[0], node.source.range[1], JSON.stringify(mapped)]);
    }
    if (node.type !== "CallExpression" || node.callee.type !== "Identifier") return;
    const name = node.callee.name;
    const fn = node.arguments[node.arguments.length - 1];

    // after(closeBrowser) / after(async () => { await closeBrowser(); })
    if ((name === "after" || name === "before") && parent && parent.type === "ExpressionStatement") {
      const body = fn && (fn.type === "Identifier" ? [fn] : fn.body && fn.body.body);
      const onlyHarness = fn && (fn.type === "Identifier"
        ? dropNames.has(fn.name)
        : Array.isArray(body) && body.every(stmt => {
          const text = src.slice(stmt.range[0], stmt.range[1]);
          return /^(await )?(closeBrowser|bundle)\(\);?$/.test(text) || /^this\.timeout\(\d+\);?$/.test(text);
        }));
      if (onlyHarness) {
        let [start, end] = parent.range;
        while (src[end] === "\n") end++;
        edits.push([start, end, ""]);
        return;
      }
    }
    if (name === "before") edits.push([node.callee.range[0], node.callee.range[1], "beforeAll"]);
    if (name === "after") edits.push([node.callee.range[0], node.callee.range[1], "afterAll"]);

    const isTest = name === "it" || name === jsdomLocal;
    const isHook = ["before", "after", "beforeEach", "afterEach"].includes(name);
    if (!(isTest || isHook) || !fn || !/Function/.test(fn.type)) return;
    if (fn.generator) notes.push(`generator body: ${src.slice(node.range[0], node.range[0] + 60).split("\n")[0]}`);
    if (fn.params.length) notes.push(`callback parameter (${src.slice(fn.params[0].range[0], fn.params[0].range[1])}) at offset ${fn.range[0]}`);
    if (fn.body.type !== "BlockStatement") return;
    for (const stmt of fn.body.body) {
      const text = src.slice(stmt.range[0], stmt.range[1]);
      const m = text.match(/^this\.timeout\((\d+(?:\s*\*\s*\d+)*)\);?$/);
      if (!m) continue;
      const ms = eval(m[1]);
      let start = stmt.range[0];
      while (start > 0 && /[ \t]/.test(src[start - 1])) start--;
      let end = stmt.range[1];
      if (src[end] === "\n") end++;
      edits.push([start, end, ""]);
      if (ms > defaultTimeout) {
        if (isTest) edits.push([fn.range[0], fn.range[0], `{timeout: ${ms}}, `]);
        else edits.push([fn.range[1], fn.range[1], `, ${ms}`]);
      }
    }
  });

  edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  for (const [start, end, text] of edits) src = src.slice(0, start) + text + src.slice(end);

  if (jsdomLocal) {
    const callsIt = new RegExp(`(^|[^.\\w])it(\\.only|\\.skip)?\\(`).test(src);
    const mixed = jsdomLocal !== "it" && callsIt;
    if (mixed) {
      src = src.replace("@@JSDOM@@", 'import {jsdomit} from "~test/jsdom.js";');
      if (jsdomLocal !== "jsdomit") src = src.replace(new RegExp(`\\b${jsdomLocal}\\(`, "g"), "jsdomit(");
      if (noAugment) notes.push("mixed jsdom file: pass {augment: false} to jsdomit");
    } else {
      src = src.replace("@@JSDOM@@", 'import {useJsdom} from "~test/jsdom.js";');
      if (jsdomLocal !== "it") src = src.replace(new RegExp(`\\b${jsdomLocal}\\(`, "g"), "it(");
      // useJsdom() goes after the last import.
      const lines = src.split("\n");
      let last = -1;
      let inImport = false;
      lines.forEach((line, i) => {
        if (/^import\b/.test(line)) inImport = true;
        if (inImport && /;\s*$/.test(line)) {
          last = i;
          inImport = false;
        }
      });
      lines.splice(last + 1, 0, "", `useJsdom(${noAugment ? "{augment: false}" : ""});`);
      src = lines.join("\n");
    }
  }

  const used = VITEST_NAMES.filter(n => new RegExp(`(^|[^.\\w$])${n}(\\.\\w+)*\\(`, "m").test(src.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, "")));
  // `/* global … */` comments no longer name the test functions.
  src = src.replace(/^\/\* global ([^*]*)\*\/\n/m, (line, names) => {
    const rest = names.split(",").map(n => n.trim()).filter(n => n && !VITEST_NAMES.includes(n) && n !== "before" && n !== "after");
    return rest.length ? `/* global ${rest.join(", ")} */\n` : "";
  });
  if (used.length) {
    const line = `import {${used.join(", ")}} from "vitest";\n`;
    const first = src.search(/^import\b/m);
    src = first < 0 ? line + src : src.slice(0, first) + line + src.slice(first);
  }
  src = src.replace(/\n{3,}/g, "\n\n");

  if (/\bthis\.(timeout|slow|retries|skip|test|currentTest)\b/.test(src)) notes.push("remaining mocha `this.`");
  if (browser && /from "node:|from "(fs|path|url)"|\bprocess\./.test(src)) notes.push("node APIs in a browser file");
  if (/UPDATE_SNAPSHOTS/.test(src)) notes.push("UPDATE_SNAPSHOTS");
  if (/\bfunction\s*\*/.test(src)) notes.push("generator function");
  if (usesPlaywright && !browser) notes.push("uses playwright.js but not run with --browser");

  fs.writeFileSync(file, src);
  return notes;
}

let flagged = 0;
for (const file of files) {
  const notes = transform(path.resolve(file));
  if (notes.length) {
    flagged++;
    console.log(`${file}\n  ${[...new Set(notes)].join("\n  ")}`);
  }
}
console.log(`${files.length} file(s), ${flagged} need a hand edit`);
