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
// Every root-level entry file (index, plus any subpath entries like
// `internal.ts` / `react.ts`) is transpiled; nested sources live under src/.
const rootFiles = fs
  .readdirSync(".", {withFileTypes: true})
  .filter(e => e.isFile() && srcPattern.test(e.name) && !e.name.endsWith(".d.ts"))
  .map(e => e.name);
const files = srcFiles.concat(rootFiles);

files.forEach(file => {
  log.timer(`transpiling /es/${file}`);
  const parser = isReact
    ? {syntax: "typescript", tsx: true}
    : {syntax: "typescript", tsx: false};
  const transform = isReact ? {react: {runtime: "automatic"}} : {};
  // .tsx → .jsx for react, .ts → .js for everything else
  const outFile = file.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js");
  const outPath = path.join("es", outFile);
  const sourceFileName = path.relative(path.dirname(outPath), file);

  const {code, map} = transformFileSync(file, {jsc: {parser, transform}, sourceMaps: true, sourceFileName});

  const outDir = path.join("es", path.dirname(outFile));
  fs.mkdirSync(outDir, {recursive: true});

  fs.writeFileSync(outPath, code + `\n//# sourceMappingURL=${path.basename(outFile)}.map`);
  fs.writeFileSync(`${outPath}.map`, map);
  log.done();
});

log.exit();
