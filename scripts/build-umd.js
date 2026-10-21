import fs from "node:fs";
import {minify} from "terser";
import rollup from "./utils/rollup.js";

import Logger from "./utils/log.js";
const log = Logger("compiling UMD files");

const {name} = JSON.parse(fs.readFileSync("package.json", "utf8"));
const fileName = name.slice(1).replace("/", "-");

fs.rmSync("umd", {recursive: true, force: true});
fs.mkdirSync("umd", {recursive: true});

rollup({log})
  .then(() => rollup({deps: true, log}))
  .then(async () => {
    // Keep only license banners; the JSDoc blocks are a quarter of the file.
    const params = {
      format: {
        comments: /@license|@preserve|^!/,
      },
    };

    log.timer(`minifying umd/${fileName}.min.js and umd/${fileName}.full.min.js`);
    const soloCode = fs.readFileSync(`umd/${fileName}.js`, "utf8");
    const soloResult = await minify(soloCode, params);
    fs.writeFileSync(`umd/${fileName}.min.js`, soloResult.code);

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
