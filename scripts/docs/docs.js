/**
    Generates the README.md documentation based on the JSDoc comments in the codebase. This script will overwrite README.md, but will not do any interaction with Github (commit, push, etc).
    @module d3plus-docs
    @summary Generates documentation based on code comments.
*/

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {Application, ReflectionKind} from "typedoc";

import Logger from "../utils/log.js";
const log = Logger("documentation");

import readmeHeader from "./stubs/README.js";
import argsStub from "./stubs/args.js";
import storiesStub from "./stubs/stories.js";
import {chartDefMap} from "./stubs/chartDefs.js";
import {buildPublicDocs} from "./typedoc.js";

/**
 * Replaces each chart's `> **Name**: VizCtor` line (TypeDoc's view of a
 * `makeChart(...)` value) with the base class it extends plus a table of the
 * chart-specific config declared in its ChartDefinition `fields`.
 */
function injectChartConfig(readme, defMap) {
  for (const [name, def] of Object.entries(defMap)) {
    const anchor = def.base.toLowerCase();
    let block = `Extends [\`${def.base}\`](#${anchor}) — accepts all of its configuration.`;
    if (def.fields.length) {
      block += " Adds or overrides these defaults:\n\n| Method | Default |\n| --- | --- |\n";
      for (const f of def.fields)
        block += `| \`${f.key}\` | ${f.default != null ? `\`${f.default}\`` : "—"} |\n`;
    }
    const re = new RegExp(`> \\*\\*${name}\\*\\*: \`[^\\n]*\``);
    readme = readme.replace(re, block);
  }
  return readme;
}

/**
 * Reads the runtime config surface of each class story by instantiating it
 * from the package's built ESM and calling `instance.config()`.
 *
 * Most component/shape/chart config (`width`, `height`, `x`, `domain`, `title`,
 * `ticks`, …) is installed by `installFluent` at runtime, so TypeDoc can't see
 * it as a class member and it never reaches the generated argTypes. The
 * `config()` reflection (BaseClass's `getAllMethods` walk) returns every config
 * accessor — including keys with no default — so it's the complete, uniform
 * source. Returns `{ClassName: {key: currentValue}}`; classes that need a real
 * DOM to construct are skipped (their args fall back to JSDoc-only).
 */
async function collectConfigDefaults(folder, stories) {
  const out = {};
  const entry = path.resolve(folder, "es/index.js");
  if (!fs.existsSync(entry)) {
    log.warn(
      `${folder}/es/index.js not found — run the build first to include schema-accessor argTypes`,
    );
    return out;
  }
  // Viz's constructor wires a ResizeObserver; stub it so charts construct in Node.
  if (typeof globalThis.ResizeObserver === "undefined")
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  let mod;
  try {
    mod = await import(pathToFileURL(entry).href);
  } catch (e) {
    log.warn(`could not import ${entry} for schema argTypes: ${e.message}`);
    return out;
  }
  for (const story of stories) {
    if (story.kind !== "class") continue;
    const Ctor = mod[story.name];
    if (typeof Ctor !== "function") continue;
    try {
      const inst = new Ctor();
      // `config()` reflects the whole accessor surface (BaseClass's
      // getAllMethods walk); a getter may throw if it needs the DOM, so guard.
      let cfg;
      try {
        cfg = inst.config();
      } catch {
        cfg = inst.schema;
      }
      if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) continue;
      const schema =
        inst.schema && typeof inst.schema === "object" && !Array.isArray(inst.schema)
          ? inst.schema
          : {};
      // Keep only genuine installFluent accessors: their getter returns
      // `this.schema[key]` (same reference). This drops read-only measurement
      // getters like `outerBounds` and `_`-backed config (already covered by the
      // JSDoc-method path) that `config()` also surfaces.
      const surface = {};
      for (const key of Object.keys(cfg)) {
        let val;
        try {
          val = inst[key]();
        } catch {
          continue;
        }
        if (val === schema[key]) surface[key] = val;
      }
      out[story.name] = surface;
    } catch {
      // Class can't be constructed headless — skip; its args stay JSDoc-only.
    }
  }
  return out;
}

const {version} = JSON.parse(fs.readFileSync("package.json", "utf8"));

const kindLabels = {
  [ReflectionKind.Class]: "Classes",
  [ReflectionKind.Function]: "Functions",
  [ReflectionKind.Variable]: "Variables",
  [ReflectionKind.Enum]: "Enums",
  [ReflectionKind.Interface]: "Interfaces",
  [ReflectionKind.TypeAlias]: "Type Aliases",
};

/**
 * Builds a markdown table of contents from a TypeDoc project's exports,
 * grouped by kind (Classes, Functions, Variables, etc.).
 */
function buildTableOfContents(project) {
  const children = project.children || [];
  if (!children.length) return "";

  // Chart types are exported as `makeChart(...)` values, so TypeDoc classifies
  // them as Variables. Group those under a dedicated "Charts" heading so they
  // aren't buried among unrelated module variables.
  const groupLabel = child => {
    if (
      child.kind === ReflectionKind.Variable &&
      /(^|[/\\])charts[/\\]/.test(child.sources?.[0]?.fileName || "")
    )
      return "Charts";
    return kindLabels[child.kind] || "Other";
  };
  const labelOrder = [
    "Charts",
    "Classes",
    "Functions",
    "Variables",
    "Interfaces",
    "Enums",
    "Type Aliases",
  ];

  const groups = new Map();
  for (const child of children) {
    const label = groupLabel(child);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(child);
  }

  let md = "";
  for (const label of labelOrder) {
    const items = groups.get(label);
    if (!items?.length) continue;
    md += `| ${label} | Description |\n`;
    md += `| --- | --- |\n`;
    for (const item of items) {
      const comment = item.comment || item.signatures?.[0]?.comment;
      const desc =
        comment?.summary
          ?.map(c => c.text)
          .join("")
          .trim() || "";
      const summary = desc.split("\n")[0].slice(0, 120);
      const anchor = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      md += `| [\`${item.name}\`](#${anchor}) | ${summary} |\n`;
    }
    md += "\n";
  }

  return md;
}

/** Shared typedoc-plugin-markdown options for all packages. */
const markdownOptions = {
  plugin: ["typedoc-plugin-markdown"],
  // Link source to a stable branch ref instead of the current commit SHA, so
  // regenerating the READMEs doesn't churn every "Defined in" link each commit.
  gitRevision: "main",
  router: "module",
  mergeReadme: true,
  readme: "none",
  hidePageHeader: true,
  hideBreadcrumbs: true,
  hidePageTitle: true,
  parametersFormat: "table",
  expandParameters: true,
  classPropertiesFormat: "table",
  interfacePropertiesFormat: "table",
  enumMembersFormat: "table",
  typeAliasPropertiesFormat: "table",
  typeDeclarationFormat: "table",
  propertyMembersFormat: "table",
  indexFormat: "table",
  useHTMLAnchors: true,
  groupOrder: [
    "Classes",
    "Functions",
    "Variables",
    "Interfaces",
    "Enumerations",
    "Type Aliases",
    "*",
  ],
  skipErrorChecking: true,
  excludePrivate: true,
  excludeInternal: true,
};

async function generateMarkdown() {
  const folders = fs
    .readdirSync("packages", {withFileTypes: true})
    .filter(d => d.isDirectory())
    .map(d => path.join("packages", d.name));

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];

    let packageJSON = JSON.parse(
      fs.readFileSync(`${folder}/package.json`, "utf8"),
    );
    const {name} = packageJSON;

    log.timer(`updating package.json for ${name}`);
    packageJSON.version = version;
    fs.writeFileSync(
      `${folder}/package.json`,
      JSON.stringify(packageJSON, null, 2),
    );

    if (name === "@d3plus/docs") {
      log.done();
      console.log("");
      continue;
    }

    // Find the entry point
    const indexFile = fs.existsSync(`${folder}/index.ts`)
      ? `${folder}/index.ts`
      : fs.existsSync(`${folder}/index.tsx`)
        ? `${folder}/index.tsx`
        : null;

    if (!indexFile) {
      log.done();
      console.log("");
      continue;
    }

    // Use TypeDoc + typedoc-plugin-markdown to generate README
    log.timer(`generating docs for ${name}`);

    const tempDir = path.join(os.tmpdir(), `d3plus-docs-${Date.now()}`);

    const app = await Application.bootstrapWithPlugins({
      entryPoints: [indexFile],
      tsconfig: `${folder}/tsconfig.json`,
      outputs: [{name: "markdown", path: tempDir}],
      ...markdownOptions,
    });

    const project = await app.convert();
    if (!project) {
      log.fail();
      console.error(`  TypeDoc conversion failed for ${name}`);
      console.log("");
      continue;
    }

    // Build a table of contents from the project's exports
    const toc = buildTableOfContents(project);

    // Inject the package header and TOC before the API reference
    const header = readmeHeader(packageJSON);
    app.renderer.markdownHooks.on("index.page.begin", () => header + toc);

    await app.generateOutputs(project);

    // Post-process: replace "Default value" column with "Default" and
    // mark required params with a dash instead of "undefined"
    let readme = fs.readFileSync(path.join(tempDir, "README.md"), "utf8");
    readme = readme.replace(/\| Default value \|/g, "| Default |");
    readme = readme.replace(/\| `undefined` \|/g, "| *required* |");

    // Charts are `makeChart(...)` values, so TypeDoc renders them as opaque
    // `VizCtor` variables with no config. Read each chart's ChartDefinition and
    // replace that useless type line with the base it extends + its declared
    // config fields (full inherited config stays documented on the base class).
    readme = injectChartConfig(readme, chartDefMap(`${folder}/src/charts`));

    // Copy the generated README back to the package folder
    fs.writeFileSync(`${folder}/README.md`, readme);
    fs.rmSync(tempDir, {recursive: true, force: true});

    // Generate Storybook args and stories from the same TypeDoc project
    log.timer(`writing TypeDoc comments to Storybook Args for ${name}`);

    const reflections = (project.children || []).filter(r => {
      if (
        r.kind === ReflectionKind.Interface ||
        r.kind === ReflectionKind.TypeAlias
      )
        return false;
      const comment = r.comment || r.signatures?.[0]?.comment;
      return comment || r.kind === ReflectionKind.Class;
    });

    const publicDocs = buildPublicDocs(reflections, folder);
    const stories = publicDocs.filter(d => !d.memberof);

    // Runtime config surface per class (installFluent accessors TypeDoc misses).
    const configDefaults = await collectConfigDefaults(folder, stories);

    stories.forEach(story => {
      const {meta, name} = story;
      // Storybook stories are for the public chart/component/shape CLASSES and
      // small utility FUNCTIONS — not the internal helpers (pipeline stages,
      // feature modules, fluent installers, axis math, renderer internals) that
      // @d3plus/core also exports for advanced use. Document those in the README
      // only. The render package is an internal layer with no stories.
      const src = meta.path || "";
      if (/[/\\]packages[/\\]render[/\\]/.test(src)) return;
      const isCore = /[/\\]packages[/\\]core[/\\]/.test(src);
      const isUtil = /[/\\]utils([/\\]|$)/.test(src);
      if (isCore && story.kind !== "class" && !isUtil) return;

      const regex = new RegExp(/packages\/([a-z][^/]+)\/src(\/.*)?/g);
      const match = regex.exec(meta.path);
      if (!match) return;
      const [, packageName, rawFilePath] = match;
      // Charts/components live in per-export subfolders (charts/viz/Viz.ts),
      // but the Storybook args/stories are flat by category. Collapse to the
      // first path segment so output paths match the story import paths.
      const filePath = rawFilePath
        ? `/${rawFilePath.split("/").filter(Boolean)[0]}`
        : "";

      const argsPath = path.join(
        folder,
        `../docs/args/${packageName}${filePath || ""}/${name}.args.jsx`,
      );
      const argsContent = argsStub(story, publicDocs, stories, configDefaults);
      const argsFolder = path.dirname(argsPath);
      fs.mkdirSync(argsFolder, {recursive: true});
      fs.writeFileSync(argsPath, argsContent);

      const storyPath = path.join(
        folder,
        `../docs/packages/${packageName}${filePath || ""}/${name}.stories.jsx`,
      );
      const existingContent = fs.existsSync(storyPath)
        ? fs.readFileSync(storyPath, {encoding: "utf8"})
        : "";
      const storyContent = storiesStub(
        story,
        packageName,
        filePath || "",
        existingContent,
      );
      const storyFolder = path.dirname(storyPath);
      fs.mkdirSync(storyFolder, {recursive: true});
      fs.writeFileSync(storyPath, storyContent);
    });

    log.done();
    console.log("");
  }
  log.exit();
}

generateMarkdown();
