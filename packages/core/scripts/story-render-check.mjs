/**
    Render-checks every Storybook story in the built docs (packages/docs/build).
    Serves the static build, navigates Chromium to each story's iframe, waits for
    async render, and reports stories that error or render blank.

    Build first:  pnpm --filter @d3plus/docs run build
    Then run:     node packages/core/scripts/story-render-check.mjs
                  node packages/core/scripts/story-render-check.mjs Core/Shapes   # filter by title prefix
*/

import {chromium} from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const buildDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../docs/build",
);
const filter = process.argv[2] || "";

const index = JSON.parse(fs.readFileSync(path.join(buildDir, "index.json"), "utf8"));
const stories = Object.values(index.entries || index.stories || {})
  .filter(e => e.type === "story")
  .filter(e => !filter || e.title.startsWith(filter));

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".css": "text/css", ".png": "image/png",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".map": "application/json",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".ico": "image/x-icon",
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(buildDir, p);
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"});
    res.end(data);
  });
});
await new Promise(r => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
const results = [];
for (const s of stories) {
  const page = await browser.newPage({viewport: {width: 600, height: 400}});
  const errors = [];
  page.on("pageerror", e => errors.push(e.message.split("\n")[0].slice(0, 140)));
  page.on("console", m => {
    if (m.type() === "error") errors.push("console: " + m.text().split("\n")[0].slice(0, 140));
  });
  let status = {};
  try {
    await page.goto(`${base}/iframe.html?id=${s.id}&viewMode=story`, {waitUntil: "load", timeout: 25000});
    await page.waitForTimeout(2500); // let async data/render settle
    status = await page.evaluate(() => {
      const root = document.querySelector("#storybook-root") || document.querySelector("#root");
      if (!root) return {hasContent: false, reason: "no #storybook-root"};
      // Storybook keeps a hidden error template in the DOM at all times; only
      // treat it as a real error when actually shown (body gets this class).
      const shownError = document.body.classList.contains("sb-show-errordisplay");
      const svgShapes = root.querySelectorAll("svg rect, svg circle, svg path, svg line, svg image, svg polygon").length;
      const hasCanvas = !!root.querySelector("canvas");
      const text = (root.innerText || "").trim();
      return {
        svgShapes, hasCanvas, childCount: root.childElementCount,
        textLen: text.length, shownError,
        hasContent: svgShapes > 0 || hasCanvas || (root.childElementCount > 0 && text.length > 0),
      };
    });
  } catch (e) {
    status = {hasContent: false, reason: "nav: " + e.message.split("\n")[0].slice(0, 120)};
  }
  const ok = status.hasContent && !status.shownError && errors.length === 0;
  results.push({id: s.id, title: s.title, name: s.name, ok, errors, status});
  await page.close();
}
await browser.close();
server.close();

const fails = results.filter(r => !r.ok);
console.log(`\n=== ${results.length} stories checked · ${fails.length} FAILING · ${results.length - fails.length} ok ===\n`);
const bySection = {};
for (const f of fails) (bySection[f.title] ??= []).push(f);
for (const title of Object.keys(bySection).sort()) {
  console.log(title);
  for (const it of bySection[title]) {
    const why = it.errors[0] || (it.status.shownError ? "storybook error overlay shown" : null) || it.status.reason ||
      `blank (shapes=${it.status.svgShapes} canvas=${it.status.hasCanvas} children=${it.status.childCount} text=${it.status.textLen})`;
    console.log(`  ✗ ${it.name} — ${why}`);
  }
  console.log("");
}
process.exit(0);
