import swc from "@rollup/plugin-swc";
import commonjs from "@rollup/plugin-commonjs";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import {rollup, watch} from "rollup";
import shell from "shelljs";

import {fileURLToPath} from "node:url";
import path from "node:path";
const {dirname} = path;
import {existsSync} from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const {description, homepage, license, name, version} = JSON.parse(
  shell.cat("package.json"),
);
const fileName = name.slice(1).replace("/", "-");

shell.config.silent = true;
export default async function (opts = {}) {
  const env = opts.env || "production";
  const log = opts.log;

  const polyfillBuild = await rollup({
    input: `${__dirname}/polyfills.js`,
    plugins: [commonjs(), nodeResolve({preferBuiltins: false})],
    onwarn: () => {},
  });
  const polyfillBundle = await polyfillBuild.generate({format: "umd"});
  const polyfills = polyfillBundle.output[0].code;

  const tsExtensions = {
    name: "resolve-ts-extensions",
    resolveId(source, importer) {
      if (!importer || !source.endsWith(".js")) return null;
      const tsPath = path.resolve(
        path.dirname(importer),
        source.replace(/\.js$/, ".ts"),
      );
      if (existsSync(tsPath)) return tsPath;
      const tsxPath = path.resolve(
        path.dirname(importer),
        source.replace(/\.js$/, ".tsx"),
      );
      if (existsSync(tsxPath)) return tsxPath;
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
*/

${polyfills}`,
    file: filePath,
    format: "umd",
    name: "d3plus",
    sourcemap: true,
    sourcemapFile: filePath,
    strict: !opts.deps,
  };

  /**
      @function output
      @desc Custom event handler for rollup watch bundle.
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
        shell.echo(`bundle error in '${e.error.id}':`);
        return shell.echo(e.error);
      default:
        return undefined;
    }
  }

  log.timer(`bundling ${output.file}`);
  shell.mkdir("-p", folder);
  if (opts.watch)
    return watch(Object.assign(input, {output: [output]})).on("event", onwarn);
  else return rollup(input).then(bundle => bundle.write(output));
}
