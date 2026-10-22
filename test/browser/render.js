/**
    Runs d3plus in the browser test page, in place of opening a fresh
    Playwright page per test. `window.d3plus` holds everything the UMD bundle
    exposes, loaded from source through Vite.
*/
import {setUpPage, withPage} from "./page.js";
import {toEvaluateResult} from "./serialize.js";

// The tester page resets the body's margin and stretches it to the viewport,
// and declares a language; a blank page does neither, so layout matches one.
for (const style of document.head.querySelectorAll("style")) {
  if (/min-height:\s*100vh/.test(style.textContent)) style.remove();
}
document.documentElement.removeAttribute("lang");

const initialHead = new Set(document.head.childNodes);
const initialBody = new Set(document.body.childNodes);
const bodyAttributes = [...document.body.attributes].map(a => [a.name, a.value]);

const {errors, resetIds} = setUpPage(window);

/**
 * Loads d3plus onto `window.d3plus` (once per test file).
 */
export async function loadD3plus() {
  if (!window.d3plus) window.d3plus = {...(await import("../../packages/core/umd-entry.ts"))};
  return window.d3plus;
}

/**
 * Restores the page to an empty document holding `bodyHtml`: removes every
 * node added since the file loaded, resets the body's attributes, scroll
 * position and the element id counter.
 * @param {String} [bodyHtml]
 */
export function resetPage(bodyHtml = "") {
  for (const node of [...document.head.childNodes]) if (!initialHead.has(node)) node.remove();
  for (const node of [...document.body.childNodes]) if (!initialBody.has(node)) node.remove();
  for (const {name} of [...document.body.attributes]) document.body.removeAttribute(name);
  for (const [name, value] of bodyAttributes) document.body.setAttribute(name, value);
  document.body.insertAdjacentHTML("beforeend", bodyHtml);
  window.scrollTo(0, 0);
  resetIds();
  errors.length = 0;
}

/**
 * The page's uncaught errors since the last `resetPage`.
 * @returns {String[]}
 */
export function pageErrors() {
  return [...errors];
}

/**
 * Renders d3plus in the test page and returns serializable data.
 * @param {String} bodyHtml Markup placed inside <body> (e.g. an <svg> target).
 * @param {Function} pageFunction May return a Promise. d3plus is available as
 *   the global `d3plus`.
 * @param {*} [arg] Optional argument passed to pageFunction (as a copy).
 * @returns {Promise<*>} Whatever pageFunction resolves with.
 */
export async function render(bodyHtml, pageFunction, arg) {
  await loadD3plus();
  resetPage(bodyHtml);
  const result = await pageFunction(toEvaluateResult(arg));
  if (errors.length) throw new Error(`page error: ${errors.join("; ")}`);
  return toEvaluateResult(result);
}

/**
 * Like `render`, but in a fresh page with its own copy of d3plus (see
 * `openPage`), for tests that change d3plus itself (e.g. a chart definition).
 * @param {String} bodyHtml
 * @param {Function} pageFunction
 * @param {*} [arg]
 */
render.isolated = (bodyHtml, pageFunction, arg) =>
  withPage(bodyHtml, page => page.evaluate(pageFunction, arg));
