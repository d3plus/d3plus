/**
    Fresh pages for browser tests that drive a page in steps, as Playwright's
    `page` did: each is an iframe covering the viewport with its own copy of
    d3plus, so nothing carries over from other tests, and can run on a fake
    clock installed before d3plus loads.
*/
import FakeTimers from "@sinonjs/fake-timers";
import {commands} from "vitest/browser";

import {toEvaluateResult} from "./serialize.js";

const entry = new URL("../../packages/core/umd-entry.ts", import.meta.url).href;

// The same functions Playwright's clock fakes.
const toFake = [
  "Date",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "requestIdleCallback",
  "cancelIdleCallback",
  "performance",
];

/**
 * Prepares a window as a test page: deterministic element ids, a log of its
 * uncaught errors, and IntersectionObservers rooted in its own viewport.
 * @param {Window} win
 * @returns {{errors: String[], resetIds: Function}}
 */
export function setUpPage(win) {
  // Element ids come from crypto.randomUUID; a counter that restarts with
  // each page keeps them the same from run to run.
  let ids = 0;
  win.crypto.randomUUID = () =>
    `00000000-0000-4000-8000-${String(ids++).padStart(12, "0")}`;

  const errors = [];
  win.addEventListener("error", e => errors.push(e.message));
  win.addEventListener("unhandledrejection", e =>
    errors.push(String(e.reason?.message ?? e.reason)),
  );

  // In an iframe the implicit root is the top page's viewport, clipped to the
  // iframe, so a rootMargin never reaches past the iframe's edge. The page's
  // own viewport behaves as a top-level page's does.
  const Native = win.IntersectionObserver;
  win.IntersectionObserver = class IntersectionObserver extends Native {
    constructor(callback, options = {}) {
      super(callback, {...options, root: options.root ?? win.document});
    }
  };

  return {errors, resetIds: () => (ids = 0)};
}

/**
 * Opens a fresh page with d3plus loaded, for tests that drive it in steps.
 * `page.evaluate(fn, arg)` runs `fn` (compiled from its source) in the page,
 * `page.mouse` moves Playwright's real pointer, and with `{clock: true}`
 * `page.clock.runFor(ms)` steps every timer, animation frame and
 * `performance.now()` together.
 * @param {String} bodyHtml Markup placed inside <body>.
 * @param {Object} [options]
 * @param {Boolean} [options.clock] Installs a paused fake clock before
 *   d3plus loads.
 */
export async function openPage(bodyHtml, {clock = false} = {}) {
  const frame = document.createElement("iframe");
  frame.style.cssText =
    "position:fixed;left:0;top:0;width:100vw;height:100vh;border:0;background:#fff";
  frame.srcdoc = `<!doctype html><html><head></head><body>${bodyHtml}</body></html>`;
  await new Promise(resolve => {
    frame.addEventListener("load", resolve, {once: true});
    document.body.appendChild(frame);
  });
  const win = frame.contentWindow;
  const {errors} = setUpPage(win);
  // Vitest rewrites each `import()` into a call on its runner, which only the
  // tester page defines.
  win.__vitest_browser_runner__ = {wrapDynamicImport: load => load()};
  const fake = clock
    ? FakeTimers.withGlobal(win).install({now: 0, toFake})
    : undefined;
  const close = async () => {
    fake?.uninstall();
    frame.remove();
  };
  const page = {
    evaluate: async (fn, arg) =>
      toEvaluateResult(await win.eval(`(${fn})`)(toEvaluateResult(arg))),
    // Imports a module into the page as the global `name`.
    loadModule: async (name, url) => {
      win[name] = {...(await win.eval(`import(${JSON.stringify(url)})`))};
    },
    waitForTimeout: ms => new Promise(resolve => setTimeout(resolve, ms)),
    mouse: {
      move: (x, y, options) => commands.mouseMove(x, y, options),
      click: (x, y, options) => commands.mouseClick(x, y, options),
      down: options => commands.mouseDown(options),
      up: options => commands.mouseUp(options),
    },
    clock: fake && {
      runFor: ms => fake.tickAsync(ms),
      // Jumps ahead, firing each due timer at most once, as Playwright does.
      pauseAt: async time => {
        fake.jump(Math.max(0, time - fake.now));
      },
    },
  };
  try {
    await page.loadModule("d3plus", entry);
    // A moment past loading, as Playwright's clock paused there.
    if (fake) fake.jump(1000);
  } catch (err) {
    await close();
    throw err;
  }
  return {page, errors, close};
}

/**
 * Opens a page (see `openPage`), hands it to `run`, and closes it once `run`
 * settles.
 * @param {String} bodyHtml
 * @param {Function} run Receives the page; may return a Promise.
 * @param {{clock?: boolean}} [options]
 */
export async function withPage(bodyHtml, run, options = {}) {
  const {page, errors, close} = await openPage(bodyHtml, options);
  try {
    const result = await run(page);
    if (errors.length) throw new Error(`page error: ${errors.join("; ")}`);
    return result;
  } finally {
    await close();
  }
}
