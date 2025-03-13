import fs from "node:fs";
import path from "node:path";
import {transformFileSync} from "@swc/core";
import shell from "shelljs";

import Logger from "./utils/log.js";
const log = Logger("transpiling ESM modules");

const {name} = JSON.parse(shell.cat("package.json"));
const jsx = name === "@d3plus/react";
shell.config.silent = true;

shell.rm("-rf", "es");
shell.mkdir("-p", "es");

shell.ls("-R", "src/**/*.@(js|jsx)").concat([`index.${jsx ? "jsx" : "js"}`])
  .forEach(file => {

    log.timer(`transpiling /es/${file}`);
    const {code} = transformFileSync(file, {jsc: {parser: {jsx}}});

    file.split("/")
      .filter(folder => !folder.includes("."))
      .reduce((dir, folder) => {
        dir = path.join(dir, folder);
        !fs.existsSync(dir) && fs.mkdirSync(dir);
        return dir;
      }, "es/");

    fs.writeFileSync(`es/${file}`, code);
    log.done();

  });

log.exit();
shell.exit(0);
