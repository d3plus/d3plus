/**
    Generates the README.md documentation based on the JSDoc comments in the codebase. This script will overwrite README.md, but will not do any interaction with Github (commit, push, etc).
    @module d3plus-docs
    @summary Generates documentation based on code comments.
*/

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import * as prettier from "prettier";
import {Application, Converter, ReflectionKind} from "typedoc";

import Logger from "../utils/log.js";
const log = Logger("documentation");
// `--manifest=<dir>` writes only the site's API manifest (<dir>/api.json),
// leaving the committed API.md and README untouched.
const manifestDir = (
  process.argv.find(arg => arg.startsWith("--manifest=")) || ""
).slice("--manifest=".length);
const manifestArgs = {};
const manifestStories = [];

import readmeHeader, {apiHeader} from "./stubs/README.js";
import {injectConfigAccessors} from "./stubs/accessors.js";
import {buildArgTypes} from "./stubs/args.js";
import {
  flattenArgTypes,
  lineage,
  manifestEntry,
  readWrappers,
} from "./stubs/manifest.js";
import {
  chartDefMap,
  injectChartConfig,
  publicChartDefs,
} from "./stubs/chartDefs.js";
import {
  buildPublicDocs,
  getCommentText,
  tocSummary,
  typeToNames,
} from "./typedoc.js";

/**
 * Documents each `makeChart(...)` chart as the class it constructs. TypeDoc
 * sees the export as a variable typed `VizCtor` (kind "member"), with no
 * members and no superclass, so it would get no config reference.
 * Marks it a class extending its ChartDefinition's base and attaches the def,
 * whose `fields` supply the chart's own config.
 */
function promoteCharts(docs, defMap) {
  for (const doc of docs) {
    const def = defMap[doc.name];
    if (doc.memberof || doc.kind !== "member" || !def) continue;
    if (!/[/\\]charts[/\\]/.test(doc.meta.path)) continue;
    doc.kind = "class";
    doc.augments = [def.base];
    doc.chartDef = def;
  }
}

/**
 * Imports a package's built ESM entry for constructing its charts, with the
 * ResizeObserver stub Viz needs in Node; null when the build is missing.
 */
async function loadChartModule(folder) {
  const entry = path.resolve(folder, "es/index.js");
  if (!fs.existsSync(entry)) return null;
  stubResizeObserver();
  try {
    return await import(pathToFileURL(entry).href);
  } catch {
    return null;
  }
}

/** Viz's constructor wires a ResizeObserver; stub it so charts construct in Node. */
function stubResizeObserver() {
  if (typeof globalThis.ResizeObserver === "undefined")
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
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
  stubResizeObserver();
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
        inst.schema &&
        typeof inst.schema === "object" &&
        !Array.isArray(inst.schema)
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
      // A chart's `setup` can install accessors on the instance itself, which
      // `config()` doesn't reflect. Read each through its getter; skip
      // instance overrides of prototype methods (e.g. `toScene`).
      if (story.chartDef)
        for (const key of Object.keys(inst)) {
          if (key.startsWith("_") || key in surface) continue;
          if (key in Object.getPrototypeOf(inst)) continue;
          if (typeof inst[key] !== "function") continue;
          try {
            const val = inst[key]();
            if (val !== inst) surface[key] = val;
          } catch {
            // Not a zero-argument getter.
          }
        }
      out[story.name] = surface;
    } catch {
      // Class can't be constructed headless — skip; its args stay JSDoc-only.
    }
  }
  return out;
}

/**
 * Builds type+description lookups from every config interface in the project
 * (`D3plusConfig`, `AxisConfig`, the shape configs, …). installFluent
 * accessors have no declared member for TypeDoc to read, so their generated
 * argTypes borrow the type (→ control) and description from these typed
 * interfaces — important for keys whose runtime default is `undefined` (e.g.
 * Axis `title`/`ticks`), which can't be typed from the value alone.
 *
 * Returns `{byName, merged}`:
 *   - `byName[InterfaceName][prop]` lets a class prefer its own config
 *     interface (e.g. Axis → `AxisConfig`), so `title` reads the axis meaning
 *     rather than the chart one.
 *   - `merged[prop]` is the cross-interface fallback (first entry wins; a later
 *     one carrying a description upgrades it), covering inherited/shared keys.
 */
function collectInterfaceDocs(project) {
  const byName = {};
  const merged = {};
  const walk = node => {
    for (const child of node.children || []) {
      if (child.kind === ReflectionKind.Interface) {
        const props = (byName[child.name] = byName[child.name] || {});
        for (const prop of child.children || []) {
          if (prop.kind !== ReflectionKind.Property) continue;
          const entry = {
            names: typeToNames(prop.type),
            description: getCommentText(prop.comment),
          };
          props[prop.name] = entry;
          const existing = merged[prop.name];
          if (!existing || (!existing.description && entry.description))
            merged[prop.name] = entry;
        }
      }
      walk(child);
    }
  };
  walk(project);
  return {byName, merged};
}

// Framework wrapper packages. These ship curated READMEs and are documented in
// the Frameworks guide, so the generator skips them: a TypeDoc API dump doesn't
// capture wrapper usage. (@d3plus/angular has no index.ts, so it is skipped
// below regardless, but is listed here to make the intent explicit.)
const FRAMEWORK_WRAPPERS = new Set([
  "@d3plus/react",
  "@d3plus/vue",
  "@d3plus/svelte",
  "@d3plus/element",
  "@d3plus/angular",
]);

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
      const summary = tocSummary(comment?.summary?.map(c => c.text).join(""));
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
  // Source links point at a stable branch instead of the current commit SHA
  // (see sourceLinks below), so regenerating the docs doesn't churn every
  // "Defined in" link each commit.
  disableGit: true,
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
  // Info lines are one per package and output; keep warnings and errors.
  logLevel: "Warn",
  excludePrivate: true,
  excludeInternal: true,
};

async function generateMarkdown() {
  const folders = fs
    .readdirSync("packages", {withFileTypes: true})
    .filter(d => d.isDirectory())
    .map(d => path.join("packages", d.name));

  const failed = [];
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];

    const packageJSON = JSON.parse(
      fs.readFileSync(`${folder}/package.json`, "utf8"),
    );
    const {name} = packageJSON;

    // Skip the framework wrappers, whose READMEs are written by hand.
    if (FRAMEWORK_WRAPPERS.has(name)) continue;

    // Find the entry point
    const indexFile = fs.existsSync(`${folder}/index.ts`)
      ? `${folder}/index.ts`
      : fs.existsSync(`${folder}/index.tsx`)
        ? `${folder}/index.tsx`
        : null;

    if (!indexFile) continue;

    // Use TypeDoc + typedoc-plugin-markdown to generate README
    log.timer(`generating docs for ${name}`);

    const tempDir = path.join(os.tmpdir(), `d3plus-docs-${Date.now()}`);

    const app = await Application.bootstrapWithPlugins({
      entryPoints: [indexFile],
      tsconfig: `${folder}/tsconfig.json`,
      outputs: [{name: "markdown", path: tempDir}],
      ...markdownOptions,
      // {path} is relative to the package; links are shown relative to src/.
      // @d3plus/types documents other packages' generated declarations, which
      // aren't in the repo, so it names them without a link. Git stays on for
      // it: with neither git nor a link template, TypeDoc logs an error.
      ...(name === "@d3plus/types"
        ? {basePath: "packages", disableGit: false}
        : {
            basePath: `${folder}/src`,
            sourceLinkTemplate: `https://github.com/d3plus/d3plus/blob/main/${folder}/{path}#L{line}`,
          }),
    });

    // Members named with a leading underscore are internal by convention
    // (see AGENTS.md), whatever their TypeScript visibility. Drop them before
    // rendering so neither the README nor the site documents them.
    app.converter.on(Converter.EVENT_RESOLVE_BEGIN, context => {
      for (const reflection of Object.values(context.project.reflections)) {
        if (
          reflection.name.startsWith("_") &&
          reflection.parent &&
          reflection.parent.kind === ReflectionKind.Class
        )
          context.project.removeReflection(reflection);
      }
    });

    // The generated accessors' typed declaration (a mapped type over
    // `D3plusConfig`, see VizBase) gives class members with no source; the
    // "Config accessors" tables document those keys, so they aren't repeated
    // as undocumented properties.
    app.converter.on(Converter.EVENT_RESOLVE_END, context => {
      for (const reflection of Object.values(context.project.reflections)) {
        if (
          reflection.kind === ReflectionKind.Property &&
          reflection.parent?.kind === ReflectionKind.Class &&
          !reflection.sources?.length
        )
          context.project.removeReflection(reflection);
      }
    });

    const project = await app.convert();
    if (!project) {
      log.fail(`TypeDoc conversion failed for ${name}`);
      failed.push(name);
      continue;
    }

    // Charts are `makeChart(...)` values, so TypeDoc sees opaque `VizCtor`
    // variables with no config; each chart's ChartDefinition supplies the base
    // it extends and its declared config fields.
    // @d3plus/types re-exports core's charts from their declaration files.
    const chartsFrom = name === "@d3plus/types" ? "packages/core" : folder;
    const chartDefs = publicChartDefs(
      chartDefMap(`${chartsFrom}/src/charts`),
      await loadChartModule(chartsFrom),
    );

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
    promoteCharts(publicDocs, chartDefs);
    const stories = publicDocs.filter(d => !d.memberof);

    // Runtime config surface per class (installFluent accessors TypeDoc misses).
    const configDefaults = await collectConfigDefaults(folder, stories);
    // Types + descriptions for those accessors, borrowed from the config interfaces.
    const interfaceDocs = collectInterfaceDocs(project);

    if (manifestDir) {
      for (const story of stories) {
        const where = documentedStory(story, folder);
        if (!where) continue;
        const {packageName, filePath} = where;
        if (story.kind === "class")
          manifestArgs[story.name] = buildArgTypes(
            story,
            publicDocs,
            stories,
            configDefaults,
            interfaceDocs,
          );
        manifestStories.push({
          story,
          pkg: packageName,
          category: filePath.slice(1),
        });
      }
      fs.rmSync(tempDir, {recursive: true, force: true});
      log.done();
      continue;
    }

    await writeApiDocs(app, project, {
      folder,
      packageJSON,
      tempDir,
      chartDefs,
      stories,
      configDefaults,
      interfaceDocs,
    });

    log.done();
  }
  if (manifestDir) writeManifest();
  log.exit();
  if (failed.length)
    throw new Error(`docs generation failed for ${failed.join(", ")}`);
}

/**
 * Where a documented export's page goes on the docs site: its package folder
 * name and category (`/charts`), or null when it gets none. The site documents
 * the public chart/component/shape CLASSES and small utility FUNCTIONS — not
 * the internal helpers (pipeline stages, feature modules, fluent installers,
 * axis math, renderer internals) that @d3plus/core also exports for advanced
 * use. Document those in the README only. The render package is an internal
 * layer with no pages.
 */
function documentedStory(story, folder) {
  const {meta, name} = story;
  if (name === "default") {
    log.warn(
      `${meta.path}: anonymous default export reached the generator as "default"; re-export it by name from ${folder}/index.ts`,
    );
    return null;
  }
  const src = meta.path || "";
  if (/[/\\]packages[/\\]render[/\\]/.test(src)) return null;
  const isCore = /[/\\]packages[/\\]core[/\\]/.test(src);
  const isUtil = /[/\\]utils([/\\]|$)/.test(src);
  if (isCore && story.kind !== "class" && !isUtil) return null;

  const regex = new RegExp(/packages\/([a-z][^/]+)\/src(\/.*)?/g);
  const match = regex.exec(meta.path);
  if (!match) return null;
  const [, packageName, rawFilePath] = match;
  // Charts/components live in per-export subfolders (charts/viz/Viz.ts),
  // but the site groups them by category alone. Collapse to the first path
  // segment, the category.
  const filePath = rawFilePath
    ? `/${rawFilePath.split("/").filter(Boolean)[0]}`
    : "";
  return {packageName, filePath};
}

/**
 * Renders a package's TypeDoc project to API.md, with the chart configs and
 * config accessors injected, and writes its README.
 */
async function writeApiDocs(app, project, options) {
  const {folder, packageJSON, tempDir, chartDefs} = options;

  // Inject the heading and TOC before the API reference
  const toc = buildTableOfContents(project);
  const header = apiHeader(packageJSON);
  app.renderer.markdownHooks.on("index.page.begin", () => header + toc);

  await app.generateOutputs(project);

  // Post-process: replace "Default value" column with "Default" and
  // mark required params with a dash instead of "undefined"
  let readme = fs.readFileSync(path.join(tempDir, "README.md"), "utf8");
  readme = readme.replace(/\| Default value \|/g, "| Default |");
  readme = readme.replace(/\| `undefined` \|/g, "| *required* |");

  // Replace each chart's useless `VizCtor` type line with the base it extends
  // + its declared config fields (full inherited config stays documented on
  // the base class).
  readme = injectChartConfig(readme, chartDefs);
  readme = injectConfigAccessors(readme, options);

  // The reference goes to API.md, which stays out of the published files;
  // the README (always published to npm) only links to it.
  await writeFormatted(`${folder}/API.md`, readme);
  await writeFormatted(`${folder}/README.md`, readmeHeader(packageJSON));
  fs.rmSync(tempDir, {recursive: true, force: true});
}

/**
 * Writes the site's API manifest: one entry per documented export, each class
 * with its full config (inherited keys included) and the code-panel flavors
 * that can render it.
 */
function writeManifest() {
  log.timer("writing the site's API manifest");
  const wrappers = readWrappers();
  const entries = manifestStories.map(({story, pkg, category}) =>
    manifestEntry(story, {
      pkg,
      category,
      argTypes: flattenArgTypes(story.name, manifestArgs),
      ancestors: lineage(story.name, manifestArgs),
      wrappers,
    }),
  );
  fs.mkdirSync(manifestDir, {recursive: true});
  const file = path.join(manifestDir, "api.json");
  fs.writeFileSync(file, `${JSON.stringify(entries, null, 2)}\n`);
  log.done(`wrote ${entries.length} manifest entries to ${file}`);
}

/**
 * Writes a generated file as Prettier formats it, so a docs run leaves
 * `pnpm format:check` passing.
 */
async function writeFormatted(file, content) {
  const options = await prettier.resolveConfig(file);
  fs.writeFileSync(
    file,
    await prettier.format(content, {...options, filepath: file}),
  );
}

generateMarkdown().catch(err => {
  console.error(err);
  process.exit(1);
});
