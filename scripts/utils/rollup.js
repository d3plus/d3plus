import swc from "@rollup/plugin-swc";
import commonjs from "@rollup/plugin-commonjs";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import {rollup, watch} from "rollup";

import fs from "node:fs";
import path from "node:path";

const {description, homepage, license, name, version} = JSON.parse(
  fs.readFileSync("package.json", "utf8"),
);
const fileName = name.slice(1).replace("/", "-");

// The browser globals that the standalone (non-full) bundle reads its
// dependencies from: d3's own bundle exposes every d3-* module as `d3`.
const globals = {
  "@chenglou/pretext": "pretext",
  "@floating-ui/dom": "FloatingUIDOM",
  "html-to-image": "htmlToImage",
  hyphenated: "hyphenated",
  textures: "textures",
  "topojson-client": "topojson",
};

const browserGlobal = id => {
  if (id.startsWith("d3-")) return "d3";
  if (id.startsWith("@d3plus/")) return "d3plus";
  return globals[id];
};

export default async function (opts = {}) {
  const env = opts.env || "production";
  const log = opts.log;

  const tsExtensions = {
    name: "resolve-ts-extensions",
    resolveId(source, importer) {
      if (!importer || !source.endsWith(".js")) return null;
      const tsPath = path.resolve(
        path.dirname(importer),
        source.replace(/\.js$/, ".ts"),
      );
      if (fs.existsSync(tsPath)) return tsPath;
      const tsxPath = path.resolve(
        path.dirname(importer),
        source.replace(/\.js$/, ".tsx"),
      );
      if (fs.existsSync(tsxPath)) return tsxPath;
      return null;
    },
  };

  // A UMD bundle is a single file, so a lazily imported package (e.g.
  // html-to-image in @d3plus/export) is imported up front instead.
  const staticDynamicImports = {
    name: "static-dynamic-imports",
    transform(code) {
      const specifiers = [];
      const out = code.replace(
        /\bimport\((["'])([^."'][^"']*)\1\)/g,
        (match, quote, specifier) => {
          specifiers.push(specifier);
          return `Promise.resolve(__dynamicImport${specifiers.length - 1})`;
        },
      );
      if (!specifiers.length) return null;
      const imports = specifiers.map(
        (s, i) => `import * as __dynamicImport${i} from "${s}";`,
      );
      return {code: `${imports.join("\n")}\n${out}`, map: null};
    },
  };

  // The full bundle compiles the other @d3plus packages from their source
  // rather than their es/ output, so it never picks up a stale build.
  const packagesDir = path.resolve(import.meta.dirname, "../../packages");
  const workspaceSources = {
    name: "workspace-sources",
    resolveId(source) {
      const match = source.match(/^@d3plus\/([a-z]+)$/);
      if (!match) return null;
      return (
        ["index.ts", "index.tsx"]
          .map(file => path.join(packagesDir, match[1], file))
          .find(file => fs.existsSync(file)) ?? null
      );
    },
  };

  const plugins = [
    workspaceSources,
    tsExtensions,
    replace({
      "process.env.NODE_ENV": JSON.stringify(env),
      preventAssignment: true,
    }),
    swc(),
    // After swc, so TypeScript's `import("…").Type` annotations are gone.
    staticDynamicImports,
  ];

  if (opts.deps) {
    plugins.push(commonjs());
    plugins.push(nodeResolve());
  }

  // A package may provide a `umd-entry.ts` to bundle a superset of its ESM
  // entry into the standalone UMD global (e.g. core ships its curated public
  // API via `index.ts` but exposes the pipeline through the UMD global too).
  const entry = fs.existsSync("umd-entry.ts") ? "umd-entry.ts" : "index.ts";

  const input = {
    input: entry,
    plugins,
    // The standalone bundle leaves every package import to the page.
    external: opts.deps
      ? undefined
      : id => !id.startsWith(".") && !path.isAbsolute(id),
    onwarn(warning, warn) {
      if (warning.code !== "CIRCULAR_DEPENDENCY") warn(warning);
    },
  };

  const folder = `${env === "development" ? "dev/" : ""}umd/`;
  const filePath = `${folder}${fileName}${opts.deps ? ".full" : ""}.js`;

  const output = {
    amd: {id: name},
    banner: `/*
  ${name} v${version}
  ${description}
  Copyright (c) ${new Date().getFullYear()} D3plus - ${homepage}
  @license ${license}
*/`,
    extend: true,
    file: filePath,
    format: "umd",
    globals: browserGlobal,
    name: "d3plus",
    sourcemap: true,
    sourcemapFile: filePath,
    strict: !opts.deps,
  };

  /**
      Custom event handler for rollup watch bundle.
      @private
  */
  function onWatchEvent(e) {
    switch (e.code) {
      case "BUNDLE_START":
        log.update(`bundling ${output.file}`);
        return undefined;
      case "BUNDLE_END":
        log.done(`bundled ${output.file} in ${e.duration}ms`);
        if (opts.onBuild) opts.onBuild();
        if (opts.watch) log.timer("watching for changes...");
        return undefined;
      case "ERROR":
      case "FATAL":
        log.fail();
        console.error(`bundle error in '${e.error.id}':`);
        console.error(e.error);
        return undefined;
      default:
        return undefined;
    }
  }

  log.timer(`bundling ${output.file}`);
  fs.mkdirSync(folder, {recursive: true});
  if (opts.watch)
    return watch(Object.assign(input, {output: [output]})).on(
      "event",
      onWatchEvent,
    );
  else return rollup(input).then(bundle => bundle.write(output));
}
