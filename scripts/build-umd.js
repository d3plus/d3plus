import fs from "node:fs";
import {minify} from "terser";
import rollup from "./utils/rollup.js";

import Logger from "./utils/log.js";
const log = Logger("compiling UMD files");

const {name} = JSON.parse(fs.readFileSync("package.json", "utf8"));
const fileName = name.slice(1).replace("/", "-");

fs.rmSync("umd", {recursive: true, force: true});
fs.mkdirSync("umd", {recursive: true});

log.timer(`compiling /umd/${fileName}.js`);
rollup({log})
  .then(() => {
    log.timer(`compiling /umd/${fileName}.full.js`);
    return rollup({deps: true, log});
  })
  .then(async () => {
    const params = {
      output: {
        comments: true,
        indent_level: 2,
      },
    };

    log.timer(`minifying umd/${fileName}.min.js`);
    const soloCode = fs.readFileSync(`umd/${fileName}.js`, "utf8");
    const soloResult = await minify(soloCode, params);
    fs.writeFileSync(`umd/${fileName}.min.js`, soloResult.code);

    log.timer(`minifying umd/${fileName}.full.min.js`);
    const fullCode = fs.readFileSync(`umd/${fileName}.full.js`, "utf8");
    const fullResult = await minify(fullCode, params);
    fs.writeFileSync(`umd/${fileName}.full.min.js`, fullResult.code);
  })
  .then(() => {
    log.exit();
  })
  .catch(err => {
    log.fail(err);
    log.exit();
    process.exit(1);
  });
