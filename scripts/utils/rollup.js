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

  const plugins = [
    tsExtensions,
    replace({"process.env.NODE_ENV": JSON.stringify(env)}),
    swc(),
  ];

  if (opts.deps) {
    plugins.push(commonjs());
    plugins.push(nodeResolve());
  }

  const input = {
    input: "index.ts",
    plugins,
    onwarn: () => {},
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
    file: filePath,
    format: "umd",
    name: "d3plus",
    sourcemap: true,
    sourcemapFile: filePath,
    strict: !opts.deps,
  };

  /**
      Custom event handler for rollup watch bundle.
      @private
  */
  function onwarn(e) {
    switch (e.code) {
      case "BUNDLE_START":
        log.update(`bundling ${output.file}`);
        return undefined;
      case "BUNDLE_END":
        log.done(`bundled ${output.file} in ${e.duration}ms`);
        if (opts.watch) log.timer("watching for changes...");
        return undefined;
      case "CIRCULAR_DEPENDENCY":
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
    return watch(Object.assign(input, {output: [output]})).on("event", onwarn);
  else return rollup(input).then(bundle => bundle.write(output));
}
