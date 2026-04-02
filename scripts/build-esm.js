import fs from "node:fs";
import path from "node:path";
import {transformFileSync} from "@swc/core";
import shell from "shelljs";

import Logger from "./utils/log.js";
const log = Logger("transpiling ESM modules");

const {name} = JSON.parse(shell.cat("package.json"));
const isReact = name === "@d3plus/react";
shell.config.silent = true;

shell.rm("-rf", "es");
shell.mkdir("-p", "es");

const ext = isReact ? "tsx" : "ts";
const srcGlob = isReact ? "src/**/*.@(ts|tsx)" : "src/**/*.ts";

shell
  .ls("-R", srcGlob)
  .concat([`index.${ext}`])
  .filter(file => !file.endsWith(".d.ts"))
  .forEach(file => {
    log.timer(`transpiling /es/${file}`);
    const parser = isReact
      ? {syntax: "typescript", tsx: true}
      : {syntax: "typescript", tsx: false};
    const transform = isReact ? {react: {runtime: "automatic"}} : {};
    const {code} = transformFileSync(file, {jsc: {parser, transform}});

    // .tsx → .jsx for react, .ts → .js for everything else
    const outFile = file.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js");

    outFile
      .split("/")
      .filter(folder => !folder.includes("."))
      .reduce((dir, folder) => {
        dir = path.join(dir, folder);
        !fs.existsSync(dir) && fs.mkdirSync(dir);
        return dir;
      }, "es/");

    fs.writeFileSync(`es/${outFile}`, code);
    log.done();
  });

log.exit();
shell.exit(0);
