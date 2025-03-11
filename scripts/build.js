/**
    @module d3plus-build
    @summary Compiles all files for distribution.
    @desc This script will compile 2 builds, one with all dependencies includes (full) and one with only the core code. Next, each of those builds is minified using uglifyjs. Finally, all those builds, along with the LICENSE and README, are compressed into a .zip file.
*/

import fs from "node:fs";
import path from "node:path";
import {transformFileSync} from "@swc/core";
import shell from "shelljs";
import rollup from "./utils/rollup.js";
import {minify} from "uglify-js";

import Logger from "./utils/log.js";
const log = Logger("build compile");

const {name} = JSON.parse(shell.cat("package.json"));
const fileName = name.slice(1).replace("/", "-");

shell.config.silent = true;

log.timer("transpiling ES6 for modules");
shell.rm("-rf", "build");
shell.mkdir("-p", "build");
shell.rm("-rf", "es");
shell.mkdir("-p", "es");

shell.ls("-R", "src/**/*.js").concat(["index.js"])
  .forEach(file => {
    const {code} = transformFileSync(file);
    file.split("/")
      .filter(folder => !folder.includes("."))
      .reduce((dir, folder) => {
        dir = path.join(dir, folder);
        !fs.existsSync(dir) && fs.mkdirSync(dir);
        return dir;
      }, "es/");
    fs.writeFileSync(`es/${file}`, code);
  });

rollup({log})
  .then(() => rollup({deps: true, log}))
  .then(() => {

    log.timer("uglifying builds");

    const params = {
      output: {
        comments: true,
        indent_level: 2
      }
    }

    const soloCode = fs.readFileSync(`build/${fileName}.js`, "utf8");
    const soloResult = minify(soloCode, params);
    if (soloResult.error) throw soloResult.error;
    fs.writeFileSync(`build/${fileName}.min.js`, soloResult.code);

    const fullCode = fs.readFileSync(`build/${fileName}.full.js`, "utf8");
    const fullResult = minify(fullCode, params);
    if (fullResult.error) throw fullResult.error;
    fs.writeFileSync(`build/${fileName}.full.min.js`, fullResult.code);

  })
  .then(() => {
    log.exit();
    shell.exit(0);
  })
  .catch(err => {
    log.fail(err);
    log.exit();
    shell.exit(1);
  });
