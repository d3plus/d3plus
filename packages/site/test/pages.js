import {it} from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {check, labels, open} from "./browser.js";

/**
    Loads every page of the built site in headless Chromium, scrolls each
    playground into view so its chart draws, and fails on any console error or
    warning, uncaught exception, or failed local request. Then drives one
    playground: a control, a code edit, and the Canvas renderer.

    Requests that leave the site are answered with empty stand-ins, so the
    check never needs the network.

    Run with `pnpm test:site` (it builds the site first, so it is not part of
    `test`).
*/

const siteDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const distDir = path.join(siteDir, "dist");
const concurrency = 6;

const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

/**
 * Serves dist/ as GitHub Pages does: folders by their index.html, and a
 * missing file with 404.html.
 */
function serve() {
  const server = http.createServer((req, res) => {
    let file = path.join(distDir, decodeURIComponent(req.url.split("?")[0]));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, "index.html");
    if (!file.startsWith(distDir) || !fs.existsSync(file)) {
      res.writeHead(404, {"Content-Type": "text/html"});
      return res.end(fs.readFileSync(path.join(distDir, "404.html")));
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

/** Every built page, as its URL path. */
function pages() {
  return fs
    .readdirSync(distDir, {recursive: true})
    .filter(file => file.endsWith("index.html"))
    .map(file => `/${path.dirname(file)}/`.replace(/^\/\.\/$/, "/"))
    .sort();
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

/** The ids on a built page, which its `#…` links can land on. */
const ids = html =>
  new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

it("every internal link leads to a page, and its #anchor to an element there", () => {
  const html = new Map(
    pages().map(url => [
      url,
      fs.readFileSync(path.join(distDir, url, "index.html"), "utf8"),
    ]),
  );
  const anchors = new Map([...html].map(([url, text]) => [url, ids(text)]));
  const broken = new Set();
  for (const [url, text] of html)
    for (const [, href] of text.matchAll(/\shref="(\/[^"]*|#[^"]*)"/g)) {
      const [target, hash] = href.startsWith("#")
        ? [url, href.slice(1)]
        : href.split("#");
      const pathname = target.split("?")[0];
      if (pathname.startsWith("//")) continue;
      const known =
        anchors.has(pathname) ||
        fs.existsSync(path.join(distDir, decodeURIComponent(pathname)));
      if (!known) broken.add(`${url} → ${href}`);
      else if (hash && anchors.has(pathname))
        if (!anchors.get(pathname).has(decodeURIComponent(hash)))
          broken.add(`${url} → ${href} (no #${hash})`);
    }
  assert.deepEqual([...broken], []);
});

it(
  "links to the old Storybook site land on their new pages",
  {timeout: 2 * 60 * 1000},
  async () => {
    const server = await serve();
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch();
    try {
      const tab = await browser.newPage();
      for (const [from, to] of [
        ["/?path=/docs/core-charts-treemap--docs", "/core/charts/treemap/"],
        ["/?path=/docs/guides-legends--docs", "/guides/legends/"],
        [
          "/?path=/story/core-charts-barchart--stacked-bars",
          "/core/charts/bar-chart/#stacked-bars",
        ],
        [
          "/?path=/docs/guides-migration-v3-%E2%86%92-v4--docs",
          "/guides/migration/",
        ],
        [
          "/iframe.html?id=core-charts-treemap--basic-example&viewMode=story",
          "/core/charts/treemap/#basic-example",
        ],
        [
          "/?path=/docs/format-formatabbreviate--docs",
          "/format/format-abbreviate/",
        ],
      ]) {
        await tab.goto(`${origin}${from}`);
        await tab.waitForURL(`${origin}${to}`, {timeout: 10000});
        if (to.includes("#")) {
          const id = decodeURIComponent(to.split("#")[1]);
          assert.ok(
            await tab.locator(`[id="${id}"]`).count(),
            `${to} has its heading`,
          );
        }
      }
    } finally {
      await browser.close();
      server.close();
    }
  },
);

it(
  "every page fits a phone screen, scrolling wide code sideways",
  {timeout: 10 * 60 * 1000},
  async () => {
    const server = await serve();
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({
        viewport: {width: 390, height: 844},
        isMobile: true,
      });
      const tab = await context.newPage();
      const wide = [];
      for (const url of pages()) {
        await tab.goto(`${origin}${url}`, {waitUntil: "load"});
        // What sticks out past the screen's edge, other than content inside
        // something that scrolls or clips it.
        const overflow = await tab.evaluate(() => {
          const width = document.documentElement.clientWidth;
          if (document.documentElement.scrollWidth <= width) return [];
          const contained = el => {
            for (let a = el.parentElement; a; a = a.parentElement)
              if (/auto|hidden|scroll|clip/.test(getComputedStyle(a).overflowX))
                return true;
            return false;
          };
          return [...document.querySelectorAll("body *")]
            .filter(
              el =>
                el.getBoundingClientRect().right > width + 1 && !contained(el),
            )
            .map(el => `${el.tagName.toLowerCase()}.${el.className}`);
        });
        if (overflow.length)
          wide.push(`${url}: ${[...new Set(overflow)].join(", ")}`);
      }
      await context.close();
      assert.deepEqual(wide, []);
    } finally {
      await browser.close();
      server.close();
    }
  },
);

it(
  "every page renders without errors or warnings",
  {timeout: 10 * 60 * 1000},
  async () => {
    const server = await serve();
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch();
    try {
      const urls = pages();
      assert.ok(urls.includes("/core/charts/treemap/"), "the site built");
      const results = await pool(urls, concurrency, url =>
        check(browser, origin, url),
      );
      const failures = urls
        .map((url, i) => [url, [...new Set(results[i])]])
        .filter(([, problems]) => problems.length)
        .map(([url, problems]) => `${url}\n    ${problems.join("\n    ")}`);
      assert.equal(failures.length, 0, `\n  ${failures.join("\n  ")}`);
    } finally {
      await browser.close();
      server.close();
    }
  },
);

it(
  "a playground redraws from its controls, its code, and either renderer",
  {timeout: 2 * 60 * 1000},
  async () => {
    const server = await serve();
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch();
    try {
      const {context, tab, problems} = await open(
        browser,
        origin,
        "/core/charts/bar-chart/",
      );
      // The "Stacked bars" example: the first with a `stacked` control. Found
      // once, by index, since its controls unmount when the code tab opens.
      const index = await tab
        .locator(".d3p")
        .evaluateAll(els =>
          els.findIndex(el =>
            [...el.querySelectorAll(".d3p-control-key")].some(
              key => key.textContent === "stacked",
            ),
          ),
        );
      const playground = tab.locator(".d3p").nth(index);
      await playground.scrollIntoViewIfNeeded();
      await playground
        .locator(".d3p-chart svg rect")
        .first()
        .waitFor({state: "attached"});
      const bars = () => playground.locator(".d3p-chart svg rect").count();

      // A control rewrites the code and redraws.
      const before = await bars();
      await playground.getByLabel("stacked", {exact: true}).uncheck();
      await tab.waitForTimeout(1500);
      await playground.getByRole("tab", {name: "Edit code"}).click();
      const editor = playground.locator(".cm-content");
      await editor.waitFor();
      assert.match(await editor.innerText(), /stacked: false/);

      // A code edit redraws.
      await editor.click();
      await tab.keyboard.press("ControlOrMeta+a");
      await tab.keyboard.insertText(
        'const config = {data: [{id: "omega", x: 1, y: 2}], groupBy: "id", x: "x", y: "y"};',
      );
      await tab.waitForTimeout(1500);
      assert.ok((await labels(playground)).join(" ").includes("omega"));

      // Canvas paints the chart instead of SVG, and back.
      await playground
        .getByRole("button", {name: "Canvas", exact: true})
        .click();
      await playground
        .locator(".d3p-chart canvas")
        .first()
        .waitFor({state: "attached"});
      await playground.getByRole("button", {name: "SVG", exact: true}).click();
      await playground
        .locator(".d3p-chart svg rect")
        .first()
        .waitFor({state: "attached"});

      // Reset restores the example.
      await playground
        .getByRole("button", {name: "Reset", exact: true})
        .click();
      await tab.waitForTimeout(1500);
      assert.equal(await bars(), before);
      await context.close();
      assert.deepEqual(problems, []);
    } finally {
      await browser.close();
      server.close();
    }
  },
);
