import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {spawn} from "node:child_process";
import {createServer} from "vite";
import {writeIndex} from "./dev-index.js";
import rollup from "./utils/rollup.js";
import Logger from "./utils/log.js";
const log = Logger("development environment");
const port = Number(process.env.DEV_PORT) || 4000;
const packagesDir = fileURLToPath(new URL("../packages", import.meta.url));

process.on("SIGINT", () => {
  process.stdout.write("\x1B[?25h"); // restore cursor visibility
  process.exit(0);
});

const name = JSON.parse(fs.readFileSync("package.json", "utf8")).name.split(
  "/",
)[1];

const activeBuilds = new Map();
const pendingBuilds = new Map();

/**
    Rebuilds another package's ESM output, cancelling any build of it that is
    still running.
    @private
*/
function buildEsm(folder) {
  const prev = activeBuilds.get(folder);
  if (prev) prev.kill();

  const child = spawn(
    "pnpm",
    ["--filter", `@d3plus/${folder}`, "run", "build:esm"],
    {
      env: {...process.env, FORCE_COLOR: "1", SUBPROCESS: "true"},
      shell: true,
      stdio: "pipe",
    },
  );
  activeBuilds.set(folder, child);
  let buildErr = "";
  child.stderr.on("data", d => (buildErr += d));
  child.on("close", code => {
    if (activeBuilds.get(folder) === child) activeBuilds.delete(folder);
    if (code !== 0 && buildErr)
      log.fail(`@d3plus/${folder} build failed\n${buildErr.trim()}`);
    else log.done();
    log.timer("watching for changes...");
  });
}

/**
    Queues an ESM rebuild of `folder`, so the burst of events a single save
    fires starts one build.
    @private
*/
function onSourceChange(folder, file) {
  log.update(`change detected in ${path.join(folder, file)}`);
  clearTimeout(pendingBuilds.get(folder));
  pendingBuilds.set(
    folder,
    setTimeout(() => {
      pendingBuilds.delete(folder);
      buildEsm(folder);
    }, 100),
  );
}

// Every other package's ESM output is rebuilt when its source (`src/` or its
// `index` entry) changes.
for (const folder of fs.readdirSync(packagesDir)) {
  const dir = path.join(packagesDir, folder);
  if (folder === name || !fs.statSync(dir).isDirectory()) continue;
  const src = path.join(dir, "src");
  if (fs.existsSync(src))
    fs.watch(src, {recursive: true}, (event, file) => {
      if (file) onSourceChange(folder, path.join("src", file));
    });
  fs.watch(dir, (event, file) => {
    if (file && /^index\.(js|ts|tsx)$/.test(file)) onSourceChange(folder, file);
  });
}

function pipeServer(child) {
  let ready = false;
  const onData = d => {
    const text = d.toString();
    if (!ready && text.includes("Local:")) {
      ready = true;
      log.done();
      console.log(text);
      log.timer("watching for changes...");
    } else if (!ready) {
      const line = text.trim();
      if (line) log.update(line.split("\n").pop());
    }
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  child.on("close", code => {
    if (code !== 0) log.fail(`server exited with code ${code}`);
  });
}

/**
    Lists a dev/ folder that has no index.html of its own.
    @private
*/
function directoryListing(dir, url) {
  const entries = fs
    .readdirSync(dir, {withFileTypes: true})
    .sort((a, b) => a.name.localeCompare(b.name));
  const items = [
    ...(url === "/" ? [] : [`<li><a href="..">..</a></li>`]),
    ...entries
      .filter(e => e.isDirectory())
      .map(e => `<li><a href="${e.name}/">${e.name}/</a></li>`),
    ...entries
      .filter(e => e.isFile())
      .map(e => `<li><a href="${e.name}">${e.name}</a></li>`),
  ].join("\n        ");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Index of ${url}</title>
<style>body{font-family:monospace;max-width:800px;margin:2rem auto}a{text-decoration:none;color:#0366d6}a:hover{text-decoration:underline}ul{list-style:none;padding:0}li{padding:0.15rem 0}</style>
</head><body><h2>Index of ${url}</h2><ul>
        ${items}
</ul></body></html>`;
}

/**
    Serves a package's static dev/ pages with Vite. Pages load their scripts
    (the UMD bundles in dev/umd/ and core's dev.js) as classic scripts, so
    those are sent as they are on disk instead of through Vite's module
    transform, and a folder without an index.html gets a file listing.
    @private
*/
function staticDevPages(devDir) {
  return {
    name: "d3plus-dev-pages",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent(req.url.split("?")[0]);
        const file = path.join(devDir, url);
        if (!file.startsWith(devDir) || !fs.existsSync(file)) return next();
        const stat = fs.statSync(file);
        if (stat.isFile() && file.endsWith(".js")) {
          res.writeHead(200, {
            "Content-Type": "text/javascript",
            "Cache-Control": "no-cache",
          });
          return fs.createReadStream(file).pipe(res);
        }
        if (!stat.isDirectory() || fs.existsSync(path.join(file, "index.html")))
          return next();
        if (!url.endsWith("/")) {
          res.writeHead(301, {Location: `${url}/`});
          return res.end();
        }
        res.writeHead(200, {"Content-Type": "text/html"});
        return res.end(directoryListing(file, url));
      });
    },
  };
}

if (name === "docs") {
  log.timer(`running Storybook on port ${port}`);
  pipeServer(
    spawn(
      "storybook",
      ["dev", "--docs", "--ci", "--no-version-updates", `--port=${port}`],
      {stdio: "pipe", shell: true},
    ),
  );
} else if (fs.existsSync("vite.config.js")) {
  // Framework wrappers (react, element, svelte, vue, angular) serve their
  // dev/ harness through Vite; each package's vite.config.js loads whatever
  // framework plugin it needs. `--config` is passed explicitly because the
  // `dev` root arg would otherwise make Vite look for the config inside dev/.
  log.timer(`running Vite on port ${port}`);
  pipeServer(
    spawn(
      "vite",
      ["serve", "dev", "--config", "vite.config.js", `--port=${port}`],
      {stdio: "pipe", shell: true},
    ),
  );
} else {
  log.timer(`running dev server on port ${port}`);
  const devDir = path.resolve("dev");
  const indexFile = path.join(devDir, "index.html");

  // dev/index.html lists every page with its description; regenerate it now
  // and whenever a page is added, removed or edited.
  writeIndex(process.cwd());

  // Vite reloads the tabs viewing an edited dev page. The UMD bundles reload
  // every tab once Rollup finishes writing them, and the generated index is
  // left out so regenerating it doesn't reload every tab.
  const server = await createServer({
    configFile: false,
    root: devDir,
    publicDir: false,
    appType: "mpa",
    clearScreen: false,
    logLevel: "warn",
    optimizeDeps: {noDiscovery: true, entries: []},
    server: {
      port,
      strictPort: true,
      watch: {ignored: ["**/umd/**", indexFile]},
    },
    plugins: [staticDevPages(devDir)],
  });

  // Vite holds a reload sent while no tab is connected for the next one to
  // connect, which would reload a freshly opened page.
  const reloadAll = () => {
    if (server.ws.clients.size) server.ws.send({type: "full-reload"});
  };

  server.watcher.on("all", (event, file) => {
    if (!/\.(html|js)$/.test(file)) return;
    log.update(`change detected in ${path.relative(process.cwd(), file)}`);
    if (file.endsWith(".html")) writeIndex(process.cwd());
    // scripts bypass Vite's module graph, so every tab reloads for them
    else reloadAll();
    log.timer("watching for changes...");
  });

  await server.listen();
  log.done(`dev server running at ${server.resolvedUrls.local[0]}`);

  rollup({
    deps: true,
    watch: true,
    env: "development",
    log,
    onBuild: reloadAll,
  });
}
