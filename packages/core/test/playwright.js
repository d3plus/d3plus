import {spawn} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {mergeProcessCovs} from "@bcoe/v8-coverage";
import {chromium} from "playwright";

// Tests that need a real layout engine (getBBox, the Viz render pipeline, …)
// run in headless Chromium. d3plus is loaded as its UMD bundle, which we build
// fresh from the current source so the tests exercise local changes.
const coreDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildScript = path.resolve(coreDir, "../../scripts/build-umd.js");
const umdPath = path.join(coreDir, "umd", "d3plus-core.full.js");

// crypto.randomUUID (used by d3plus for element ids) only exists in secure
// contexts; page.setContent serves about:blank, which is not one, so polyfill.
const cryptoPolyfill =
  'if(typeof crypto!=="undefined"&&!crypto.randomUUID){' +
  'let n=0;crypto.randomUUID=()=>' +
  '"00000000-0000-4000-8000-"+String(n++).padStart(12,"0");}';

// Under c8, NODE_V8_COVERAGE names the directory c8 collects raw V8 coverage
// from. Browser coverage of the UMD bundle is merged across pages in memory
// and written there as if the bundle had run in Node, so c8 remaps it through
// the bundle's sourcemap onto src/ alongside the Node-side coverage.
const coverageDir = process.env.NODE_V8_COVERAGE;
let coverage;
let coverageFiles = 0;
let coverageUrl;

let bundlePromise;
let browserPromise;

/**
 * Builds the full UMD bundle (once) and returns its source.
 * @private
 */
function bundle() {
  if (!bundlePromise) {
    bundlePromise = new Promise((resolve, reject) => {
      const child = spawn("node", [buildScript], {cwd: coreDir, stdio: "ignore"});
      child.on("error", reject);
      child.on("close", code =>
        code === 0
          ? resolve(fs.readFileSync(umdPath, "utf8"))
          : reject(new Error(`UMD build exited with code ${code}`)),
      );
    });
  }
  return bundlePromise;
}

/**
 * Launches a shared headless Chromium (once).
 * @private
 */
function browser() {
  if (!browserPromise) browserPromise = chromium.launch();
  return browserPromise;
}

/**
 * Closes the shared browser. Call from an `after` hook so mocha can exit.
 */
export async function closeBrowser() {
  flushCoverage();
  if (browserPromise) {
    const b = await browserPromise;
    browserPromise = undefined;
    await b.close();
  }
}

/**
 * Renders d3plus inside a real browser page and returns serializable data.
 * @param {String} bodyHtml Markup placed inside <body> (e.g. an <svg> target).
 * @param {Function} pageFunction Runs in the page; may return a Promise. d3plus
 *   is available as the global `d3plus`.
 * @param {*} [arg] Optional serializable argument passed to pageFunction.
 * @returns {Promise<*>} Whatever pageFunction resolves with.
 */
export async function render(bodyHtml, pageFunction, arg) {
  const [b, umd] = await Promise.all([browser(), bundle()]);
  const page = await b.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  // Tests render real map tile URLs (Geomap's default basemap, or a custom
  // one) without asserting on the fetched image bytes — only on attributes/
  // computed style set before the network round trip resolves. Abort those
  // requests instead of letting them actually hit the network: keeps tests
  // hermetic and avoids flakiness under a long run's accumulated load.
  await page.route(/^https?:\/\//, route => route.abort());
  await startCoverage(page);
  try {
    await page.setContent(`<!doctype html><html><body>${bodyHtml}</body></html>`);
    await page.addScriptTag({content: cryptoPolyfill});
    await page.addScriptTag({content: umd});
    const result = await page.evaluate(pageFunction, arg);
    if (errors.length) throw new Error(`page error: ${errors.join("; ")}`);
    return result;
  } finally {
    await stopCoverage(page, umd);
    await page.close();
  }
}

/**
 * Starts recording a page's JS coverage when running under c8. Call before the
 * UMD bundle is added to the page.
 * @param {import("playwright").Page} page
 */
export async function startCoverage(page) {
  if (coverageDir) await page.coverage.startJSCoverage({reportAnonymousScripts: true});
}

/**
 * Stops recording a page's coverage and folds its coverage of the UMD bundle
 * into the running total.
 * @param {import("playwright").Page} page
 * @param {String} umd The UMD bundle source the page ran.
 */
export async function stopCoverage(page, umd) {
  if (!coverageDir) return;
  const entry = (await page.coverage.stopJSCoverage()).find(e => e.source === umd);
  if (!entry) return;
  const result = [{scriptId: "0", url: bundleCopy(), functions: entry.functions}];
  coverage = coverage ? mergeProcessCovs([coverage, {result}]) : {result};
}

/**
 * Writes the coverage collected so far to c8's coverage directory.
 */
export function flushCoverage() {
  if (!coverage) return;
  fs.mkdirSync(coverageDir, {recursive: true});
  const file = `coverage-browser-${process.pid}-${coverageFiles++}.json`;
  fs.writeFileSync(path.join(coverageDir, file), JSON.stringify(coverage));
  coverage = undefined;
}

/**
 * Writes a copy of the UMD bundle whose sourcemap lists absolute source paths,
 * and returns its file URL. c8 filters remapped files by their sourcemap path
 * as written, and the published map's relative paths (`../src/…`) read as
 * outside the package, so coverage is attributed to this copy instead.
 * @private
 */
function bundleCopy() {
  if (!coverageUrl) {
    const dir = path.join(coverageDir, "..", "umd");
    const map = JSON.parse(fs.readFileSync(`${umdPath}.map`, "utf8"));
    map.sources = map.sources.map(s => path.resolve(path.dirname(umdPath), s));
    fs.mkdirSync(dir, {recursive: true});
    const copy = path.join(dir, path.basename(umdPath));
    fs.copyFileSync(umdPath, copy);
    fs.writeFileSync(`${copy}.map`, JSON.stringify(map));
    coverageUrl = pathToFileURL(copy).href;
  }
  return coverageUrl;
}
