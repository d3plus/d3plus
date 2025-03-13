import fs from "node:fs";
import shell from "shelljs";
import rollup from "./utils/rollup.js";
import {minify} from "uglify-js";

import Logger from "./utils/log.js";
const log = Logger("compiling UMD files");

const {name} = JSON.parse(shell.cat("package.json"));
const fileName = name.slice(1).replace("/", "-");

shell.config.silent = true;

shell.rm("-rf", "umd");
shell.mkdir("-p", "umd");

log.timer(`compiling /umd/${fileName}.js`);
rollup({log})
  .then(() => {
    log.timer(`compiling /umd/${fileName}.full.js`);
    return rollup({deps: true, log});
  })
  .then(() => {

    const params = {
      output: {
        comments: true,
        indent_level: 2
      }
    }

    log.timer(`minifying umd/${fileName}.min.js`);
    const soloCode = fs.readFileSync(`umd/${fileName}.js`, "utf8");
    const soloResult = minify(soloCode, params);
    if (soloResult.error) throw soloResult.error;
    fs.writeFileSync(`umd/${fileName}.min.js`, soloResult.code);

    log.timer(`minifying umd/${fileName}.full.min.js`);
    const fullCode = fs.readFileSync(`umd/${fileName}.full.js`, "utf8");
    const fullResult = minify(fullCode, params);
    if (fullResult.error) throw fullResult.error;
    fs.writeFileSync(`umd/${fileName}.full.min.js`, fullResult.code);

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
