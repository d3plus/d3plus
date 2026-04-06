import fs from "node:fs";
import path from "node:path";
import {transformFileSync} from "@swc/core";

import Logger from "./utils/log.js";
const log = Logger("transpiling ESM modules");

const {name} = JSON.parse(fs.readFileSync("package.json", "utf8"));
const isReact = name === "@d3plus/react";

fs.rmSync("es", {recursive: true, force: true, maxRetries: 3, retryDelay: 100});
fs.mkdirSync("es", {recursive: true});

const ext = isReact ? "tsx" : "ts";

function collectFiles(dir, pattern) {
  const results = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true, recursive: true})) {
    const full = path.join(entry.parentPath || entry.path, entry.name);
    if (entry.isFile() && pattern.test(full) && !full.endsWith(".d.ts")) {
      results.push(path.relative(".", full));
    }
  }
  return results;
}

const srcPattern = isReact ? /\.(ts|tsx)$/ : /\.ts$/;
const srcFiles = fs.existsSync("src") ? collectFiles("src", srcPattern) : [];
const files = srcFiles.concat([`index.${ext}`]);

files.forEach(file => {
  log.timer(`transpiling /es/${file}`);
  const parser = isReact
    ? {syntax: "typescript", tsx: true}
    : {syntax: "typescript", tsx: false};
  const transform = isReact ? {react: {runtime: "automatic"}} : {};
  const {code} = transformFileSync(file, {jsc: {parser, transform}});

  // .tsx → .jsx for react, .ts → .js for everything else
  const outFile = file.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js");

  const outDir = path.join("es", path.dirname(outFile));
  fs.mkdirSync(outDir, {recursive: true});

  fs.writeFileSync(`es/${outFile}`, code);
  log.done();
});

log.exit();
