import {spawn} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

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
  try {
    await page.setContent(`<!doctype html><html><body>${bodyHtml}</body></html>`);
    await page.addScriptTag({content: cryptoPolyfill});
    await page.addScriptTag({content: umd});
    const result = await page.evaluate(pageFunction, arg);
    if (errors.length) throw new Error(`page error: ${errors.join("; ")}`);
    return result;
  } finally {
    await page.close();
  }
}
