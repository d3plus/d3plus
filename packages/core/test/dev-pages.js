import assert from "assert";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {buildIndex, devPages, pageMeta} from "../../../scripts/dev-index.js";
import {bundle} from "./playwright.js";

/**
    Loads every page under packages/core/dev in headless Chromium (as the dev
    server serves it, with /umd/ backed by a fresh UMD build), hovers a spread
    of shapes, clicks a legend entry, and fails on any console error or
    warning (including config warnings), uncaught exception or failed local
    request. Chart pages are checked again with ?renderer=canvas.

    Requests that leave localhost (basemap tiles, web fonts, framework CSS)
    are answered with empty stand-ins, so the check never needs the network:
    a page that depends on remote data shows up as an error.

    Run with `pnpm --filter @d3plus/core run test:dev-pages` (it takes a few
    minutes, so it is not part of `test`).
*/

const coreDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const devDir = path.join(coreDir, "dev");

// Pages to leave out of the check, each with the reason why.
const skip = {};

const wait = 3000;
const concurrency = 6;

const mime = {
  ".css": "text/css",
  ".csv": "text/csv",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

/** Serves dev/ like scripts/dev.js does, with /umd/ from the given bundle. */
function serve(umd) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    if (url === "/umd/d3plus-core.full.js") {
      res.writeHead(200, {"Content-Type": mime[".js"]});
      return res.end(umd);
    }
    let file = path.join(devDir, url);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, "index.html");
    if (!file.startsWith(devDir) || !fs.existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    return res.end(fs.readFileSync(file));
  });
  return new Promise(resolve =>
    server.listen(0, "127.0.0.1", () => resolve(server)),
  );
}

/** Answers a request that leaves the dev server with an empty stand-in. */
function stub(route) {
  const type = route.request().resourceType();
  if (type === "image")
    return route.fulfill({contentType: "image/png", body: pixel});
  if (type === "stylesheet")
    return route.fulfill({contentType: "text/css", body: ""});
  return route.abort();
}

/** Opens one page, interacts with it, and returns every problem it logged. */
async function check(browser, origin, page, query = "") {
  const context = await browser.newContext({
    viewport: {width: 1200, height: 800},
  });
  const tab = await context.newPage();
  const problems = [];
  tab.on("console", msg => {
    if (["error", "warning"].includes(msg.type()))
      problems.push(`console.${msg.type()}: ${msg.text()}`);
  });
  tab.on("pageerror", err => problems.push(`uncaught: ${err.message}`));
  tab.on("requestfailed", req => {
    if (req.url().startsWith(origin)) problems.push(`failed: ${req.url()}`);
  });
  tab.on("response", res => {
    if (res.status() >= 400) problems.push(`${res.status()}: ${res.url()}`);
  });
  await context.route(url => !url.href.startsWith(origin), stub);
  try {
    await tab.goto(`${origin}/${page}${query}`, {waitUntil: "load"});
    await tab.waitForTimeout(1000);
    const points = await tab.evaluate(() => {
      const boxes = [
        ...document.querySelectorAll("svg rect, svg path, svg circle, canvas"),
      ]
        .map(el => el.getBoundingClientRect())
        .filter(
          b =>
            b.width > 4 &&
            b.height > 4 &&
            b.top >= 0 &&
            b.left >= 0 &&
            b.top < 800 &&
            b.left < 1200,
        );
      const step = Math.max(1, Math.floor(boxes.length / 6));
      return boxes
        .filter((b, i) => i % step === 0)
        .slice(0, 6)
        .map(b => [b.left + b.width / 2, b.top + b.height / 2]);
    });
    for (const [x, y] of points) {
      await tab.mouse.move(x, y);
      await tab.waitForTimeout(50);
    }
    const legend = await tab.evaluate(() => {
      const el = document.querySelector(
        "[class*=Legend] rect, [class*=legend] rect",
      );
      const b = el && el.getBoundingClientRect();
      return b && b.width ? [b.left + b.width / 2, b.top + b.height / 2] : null;
    });
    if (legend) await tab.mouse.click(...legend);
    await tab.mouse.move(1, 1);
    await tab.waitForTimeout(wait);
  } catch (err) {
    problems.push(`navigation: ${err.message}`);
  }
  await context.close();
  return problems;
}

/** Runs `fn` over `items`, `limit` at a time. */
async function pool(items, limit, fn) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({length: limit}, worker));
  return results;
}

const pages = devPages(devDir).sort();
// DEV_PAGES=Treemap limits the render check to pages whose path contains it.
const only = process.env.DEV_PAGES;

it("every dev page has a title and description, and dev/index.html is current", () => {
  const missing = pages.filter(page => {
    const {title, description} = pageMeta(path.join(devDir, page));
    return !title || !description;
  });
  assert.deepStrictEqual(
    missing,
    [],
    'pages without a <title> or <meta name="description">',
  );
  const index = fs.readFileSync(path.join(devDir, "index.html"), "utf8");
  assert.ok(
    index === buildIndex(coreDir),
    "dev/index.html is stale; run `pnpm run dev:index`",
  );
});

it("every dev page renders without errors or warnings", async function () {
  this.timeout(10 * 60 * 1000);
  const umd = await bundle();
  const server = await serve(umd);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    const checked = pages.filter(
      page => !skip[page] && (!only || page.includes(only)),
    );
    const runs = checked.map(page => [page, ""]);
    for (const page of checked) {
      if (page.startsWith("charts/")) runs.push([page, "?renderer=canvas"]);
    }
    const results = await pool(runs, concurrency, ([page, query]) =>
      check(browser, origin, page, query),
    );
    const failures = runs
      .map(([page, query], i) => [`${page}${query}`, [...new Set(results[i])]])
      .filter(([, problems]) => problems.length)
      .map(([page, problems]) => `${page}\n    ${problems.join("\n    ")}`);
    assert.strictEqual(failures.length, 0, `\n  ${failures.join("\n  ")}`);
  } finally {
    await browser.close();
    server.close();
  }
});
