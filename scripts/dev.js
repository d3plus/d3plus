import fs from "node:fs";
import {join} from "node:path";
import {spawn} from "node:child_process";
import http from "node:http";
import chokidar from "chokidar";
import rollup from "./utils/rollup.js";
import Logger from "./utils/log.js";
const log = Logger("development environment");
const port = 4000;

process.on("SIGINT", () => process.exit(0));

const name = JSON.parse(fs.readFileSync("package.json", "utf8")).name.split("/")[1];

const activeBuilds = new Map();

chokidar
  .watch(join(process.env.INIT_CWD, "packages"), {
    ignored: (path, stats) =>
      path.includes("node_modules") ||
      (stats?.isFile() &&
      !path.match(/packages\/[a-z]+\/src\//) &&
      !path.match(/packages\/[a-z]+\/index\.(js|ts|tsx)/)), // only watch js/ts files
  })
  .on("all", (event, path) => {
    if (event === "change") {
      const folder = path.match(/packages\/([a-z]+)\//)[1];
      if (folder !== name) {
        const filename = path.split("d3plus/packages/")[1];
        log.update(`change detected in ${filename}`);

        const prev = activeBuilds.get(folder);
        if (prev) prev.kill();

        const child = spawn(
          "pnpm", ["--filter", `@d3plus/${folder}`, "run", "build:esm"],
          {env: {...process.env, FORCE_COLOR: "1", SUBPROCESS: "true"}, shell: true, stdio: "inherit"},
        );
        activeBuilds.set(folder, child);
        child.on("close", () => {
          if (activeBuilds.get(folder) === child) activeBuilds.delete(folder);
          log.done();
          log.timer("watching for changes...");
        });
      }
    }
  });

if (name === "react") {
  log.timer(`running Vite on port ${port}`);
  spawn("vite", ["serve", "dev", `--port=${port}`], {stdio: "inherit", shell: true});
  log.done();
  log.timer("watching for changes...");
} else if (name === "docs") {
  log.timer(`running Storybook on port ${port}`);
  spawn(
    "storybook",
    ["dev", "--docs", "--ci", "--no-version-updates", `--port=${port}`],
    {stdio: "inherit", shell: true},
  );
  log.done();
  log.timer("watching for changes...");
} else {
  log.timer(`running dev server on port ${port}`);

  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".map": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
  };

  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url);
    const filePath = join("dev", url);

    // serve file if it exists
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const data = fs.readFileSync(filePath);
        const ext = filePath.slice(filePath.lastIndexOf("."));
        res.writeHead(200, {"Content-Type": mimeTypes[ext] || "application/octet-stream"});
        res.end(data);
        return;
      }
    } catch { /* fall through */ }

    // serve index.html inside directory if it exists
    try {
      const indexPath = join(filePath, "index.html");
      const data = fs.readFileSync(indexPath);
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(data);
      return;
    } catch { /* fall through */ }

    // generate directory listing if path is a directory
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(filePath, {withFileTypes: true})
          .sort((a, b) => a.name.localeCompare(b.name));
        const dirs = entries.filter(e => e.isDirectory());
        const files = entries.filter(e => e.isFile());
        const parent = url === "/" ? "" : `<li><a href="..">..</a></li>`;
        const items = [
          ...dirs.map(e => `<li><a href="${e.name}/">${e.name}/</a></li>`),
          ...files.map(e => `<li><a href="${e.name}">${e.name}</a></li>`),
        ].join("\n        ");
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(`<!doctype html>
<html><head><meta charset="utf-8"><title>Index of ${url}</title>
<style>body{font-family:monospace;max-width:800px;margin:2rem auto}a{text-decoration:none;color:#0366d6}a:hover{text-decoration:underline}ul{list-style:none;padding:0}li{padding:0.15rem 0}</style>
</head><body><h2>Index of ${url}</h2><ul>
        ${parent}
        ${items}
</ul></body></html>`);
        return;
      }
    } catch { /* fall through */ }

    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(port, () => {
    log.done();
    rollup({deps: true, watch: true, env: "development", log});
  });
}
