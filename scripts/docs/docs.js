/**
    Generates the README.md documentation based on the JSDoc comments in the codebase. This script will overwrite README.md, but will not do any interaction with Github (commit, push, etc).
    @module d3plus-docs
    @summary Generates documentation based on code comments.
*/

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {Application, ReflectionKind} from "typedoc";

import Logger from "../utils/log.js";
const log = Logger("documentation");

import readmeHeader from "./stubs/README.js";
import argsStub from "./stubs/args.js";
import storiesStub from "./stubs/stories.js";
import {buildPublicDocs} from "./typedoc.js";

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

  // Group by kind, preserving a stable order
  const kindOrder = [
    ReflectionKind.Class,
    ReflectionKind.Function,
    ReflectionKind.Variable,
    ReflectionKind.Interface,
    ReflectionKind.Enum,
    ReflectionKind.TypeAlias,
  ];

  const groups = new Map();
  for (const child of children) {
    const kind = child.kind;
    if (!groups.has(kind)) groups.set(kind, []);
    groups.get(kind).push(child);
  }

  let md = "";
  for (const kind of kindOrder) {
    const items = groups.get(kind);
    if (!items?.length) continue;
    const label = kindLabels[kind] || "Other";
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

    stories.forEach(story => {
      const {meta, name} = story;
      const regex = new RegExp(/packages\/([a-z][^/]+)\/src(\/.*)?/g);
      const match = regex.exec(meta.path);
      if (!match) return;
      const [, packageName, filePath] = match;

      const argsPath = path.join(
        folder,
        `../docs/args/${packageName}${filePath || ""}/${name}.args.jsx`,
      );
      const argsContent = argsStub(story, publicDocs, stories);
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
