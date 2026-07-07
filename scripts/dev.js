import fs from "node:fs";
import {join} from "node:path";
import {spawn} from "node:child_process";
import http from "node:http";
import chokidar from "chokidar";
import rollup from "./utils/rollup.js";
import Logger from "./utils/log.js";
const log = Logger("development environment");
const port = 4000;

process.on("SIGINT", () => {
  process.stdout.write("\x1B[?25h"); // restore cursor visibility
  process.exit(0);
});

const name = JSON.parse(fs.readFileSync("package.json", "utf8")).name.split("/")[1];

const activeBuilds = new Map();

// Connected browser tabs listening for live-reload events (Server-Sent Events).
// Each entry: {res, path} — `path` is the URL the tab is showing, so the
// HTML-only reload signal can skip tabs viewing unrelated pages.
const reloadClients = new Set();

/**
    Tells every connected dev page to reload itself. Pass `htmlPath` to
    target ONLY tabs viewing that exact HTML file (used when an .html /
    .css file changes — no point reloading unrelated tabs). Omit to
    broadcast (used when the UMD bundle rebuilds — every tab loads it).
    @private
*/
function triggerReload(htmlPath) {
  for (const c of reloadClients) {
    if (htmlPath && c.path !== htmlPath) continue;
    c.res.write("data: reload\n\n");
  }
}

// Snippet injected into served HTML so pages reconnect and reload on rebuild.
// `?p=<pathname>` lets the server scope HTML/CSS reloads to just the
// matching tab. `visibilitychange` closes the SSE while the tab is hidden
// — Chrome enforces a 6-connection-per-host limit on HTTP/1.1, so 6+
// open tabs each holding an SSE would block new requests for tab loads.
// Closing while hidden frees the slot; the connection re-opens when the
// tab is visible again (or before the user navigates away).
const liveReloadSnippet = `
<script>
(function () {
  var es = null;
  var connect = function () {
    if (es || document.hidden) return;
    es = new EventSource("/__livereload?p=" + encodeURIComponent(location.pathname));
    es.onmessage = function () { location.reload(); };
    es.onerror = function () { es && es.close(); es = null; setTimeout(connect, 1000); };
  };
  var disconnect = function () {
    if (es) { es.close(); es = null; }
  };
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) disconnect();
    else connect();
  });
  window.addEventListener("pagehide", disconnect);
  connect();
})();
</script>`;

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
          {env: {...process.env, FORCE_COLOR: "1", SUBPROCESS: "true"}, shell: true, stdio: "pipe"},
        );
        activeBuilds.set(folder, child);
        let buildErr = "";
        child.stderr.on("data", d => buildErr += d);
        child.on("close", code => {
          if (activeBuilds.get(folder) === child) activeBuilds.delete(folder);
          if (code !== 0 && buildErr) log.fail(`@d3plus/${folder} build failed\n${buildErr.trim()}`);
          else log.done();
          log.timer("watching for changes...");
        });
      }
    }
  });

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

if (name === "react") {
  log.timer(`running Vite on port ${port}`);
  pipeServer(spawn("vite", ["serve", "dev", `--port=${port}`], {stdio: "pipe", shell: true}));
} else if (name === "docs") {
  log.timer(`running Storybook on port ${port}`);
  pipeServer(spawn(
    "storybook",
    ["dev", "--docs", "--ci", "--no-version-updates", `--port=${port}`],
    {stdio: "pipe", shell: true},
  ));
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

  /**
      Appends the live-reload snippet to an HTML buffer before sending.
      @private
  */
  const sendHtml = (res, data) => {
    let html = data.toString();
    html = html.includes("</body>")
      ? html.replace("</body>", `${liveReloadSnippet}\n</body>`)
      : html + liveReloadSnippet;
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(html);
  };

  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url);

    // live-reload event stream: held open, written to on each rebuild.
    // The `?p=...` query is the tab's pathname so HTML/CSS-change
    // reloads can be scoped to the matching tab(s) only.
    if (url.startsWith("/__livereload")) {
      const qIdx = url.indexOf("?");
      const path = qIdx >= 0
        ? new URLSearchParams(url.slice(qIdx + 1)).get("p") || null
        : null;
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        // Tell intermediaries (and proxies in dev setups) that this
        // response isn't compressible.
        "X-Accel-Buffering": "no",
      });
      res.write("retry: 1000\n\n");
      const client = {res, path};
      reloadClients.add(client);
      req.on("close", () => reloadClients.delete(client));
      return;
    }

    const filePath = join("dev", url);

    // serve file if it exists
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const ext = filePath.slice(filePath.lastIndexOf("."));
        if (ext === ".html") return sendHtml(res, fs.readFileSync(filePath));
        res.writeHead(200, {"Content-Type": mimeTypes[ext] || "application/octet-stream"});
        res.end(fs.readFileSync(filePath));
        return;
      }
    } catch { /* fall through */ }

    // serve index.html inside directory if it exists
    try {
      const indexPath = join(filePath, "index.html");
      const data = fs.readFileSync(indexPath);
      sendHtml(res, data);
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

  // reload the browser whenever a dev page (HTML/CSS) is edited directly.
  // Only the tab(s) viewing that exact path (or the CSS-importing page)
  // get the reload signal, so editing dev/charts/Treemap/Simple.html
  // doesn't unnecessarily reload every other open chart dev page.
  chokidar
    .watch("dev", {
      ignoreInitial: true,
      ignored: (path, stats) =>
        path.includes("/umd/") ||
        (stats?.isFile() && !/\.(html|css)$/.test(path)),
    })
    .on("all", (event, path) => {
      log.update(`change detected in ${path}`);
      // Normalize disk path → URL path. Files live under `dev/`; the URL
      // is the path relative to dev/. CSS changes don't carry a clean
      // "which HTML page imports this" hint so they still broadcast.
      const isCss = path.endsWith(".css");
      if (isCss) {
        triggerReload();
      } else {
        const rel = path.replace(/^dev/, "");
        triggerReload(rel);
      }
      log.timer("watching for changes...");
    });

  server.listen(port, () => {
    log.done();
    // bump the maxConnections + keep-alive so multiple open dev tabs
    // (each holding an EventSource) don't exhaust the per-host
    // connection budget. Chrome limits HTTP/1.1 to 6 connections per
    // host; we can't lift that browser-side, but keep-alive timeouts
    // long enough that pending requests resolve before SSE eats the
    // budget helps. The server itself has unlimited maxConnections by
    // default but some sysctl defaults clamp inbound listen backlogs.
    server.keepAliveTimeout = 60_000;
    server.headersTimeout = 65_000;
    // reload the browser whenever the UMD bundle finishes rebuilding —
    // every tab loads the UMD, so this stays a broadcast.
    rollup({deps: true, watch: true, env: "development", log, onBuild: () => triggerReload()});
  });
}
