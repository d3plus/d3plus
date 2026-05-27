import {JSDOM} from "jsdom";

const defaultHTML =
  "<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>";

/**
 * Resolves a single value yielded from a test generator. Tests yield "thunks"
 * — functions that take a completion callback (e.g. `cb => viz.render(cb)`) —
 * so each yield is turned into a Promise that resolves when that callback runs.
 * Non-function yields (a Promise or plain value) are awaited directly.
 * @param {*} yielded
 * @private
 */
function resolveYield(yielded) {
  if (typeof yielded === "function") {
    return new Promise((resolve, reject) => {
      try {
        yielded(err => (err instanceof Error ? reject(err) : resolve(err)));
      } catch (err) {
        reject(err);
      }
    });
  }
  return Promise.resolve(yielded);
}

/**
 * Runs the test body. A generator body is driven to completion, awaiting each
 * yielded thunk before resuming (co-style); a plain or async body is awaited.
 * Without this, `await generatorFunction()` would resolve to the un-iterated
 * generator object and the test body would never execute.
 * @param {Function} run
 * @private
 */
async function runBody(run) {
  const result = run();
  const isGenerator =
    result &&
    typeof result.next === "function" &&
    typeof result.throw === "function";
  if (!isGenerator) return result;

  let step = result.next();
  while (!step.done) {
    try {
      step = result.next(await resolveYield(step.value));
    } catch (err) {
      step = result.throw(err);
    }
  }
  return step.value;
}

/**
 * Adds browser APIs that jsdom does not implement but d3plus needs while
 * rendering, so component tests can actually run. SVG path/geometry methods
 * return inert values (jsdom has no layout engine) and ResizeObserver is a
 * no-op; they only need to exist without throwing.
 * @param {Window} window
 * @private
 */
function augmentWindow(window) {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  const proto = window.SVGElement.prototype;
  if (!proto.getTotalLength) proto.getTotalLength = () => 0;
  if (!proto.getPointAtLength) proto.getPointAtLength = () => ({x: 0, y: 0});
  if (!proto.getComputedTextLength) proto.getComputedTextLength = () => 0;
  if (!proto.getBBox)
    proto.getBBox = () => ({x: 0, y: 0, width: 0, height: 0});
}

// Globals (beyond KEYS) that some dependencies read off the global scope.
const EXTRA_KEYS = ["navigator", "ResizeObserver"];

/**
 * Registers a mocha test that runs inside a fresh JSDOM document.
 * @param {String} message Test name passed to mocha's "it".
 * @param {String} [html] Optional HTML to seed the page with.
 * @param {Function} run Test body; may be a plain, async, or generator function.
 * @returns
 */
export default function jsdomit(message, html, run) {
  if (arguments.length < 3) ((run = html), (html = defaultHTML));
  const allKeys = ["window", "document", ...KEYS, ...EXTRA_KEYS];
  return it(message, async () => {
    // Save any pre-existing globals (Node has natives like URL/navigator) so we
    // can restore them afterwards rather than deleting them, which would break
    // later code in the same process (e.g. Playwright needs Node's URL).
    const saved = {};
    allKeys.forEach(function (key) {
      saved[key] = global[key];
    });
    try {
      const dom = new JSDOM(html);
      augmentWindow(dom.window);
      global.window = dom.window;
      global.document = dom.window.document;
      KEYS.concat(EXTRA_KEYS).forEach(function (key) {
        global[key] = dom.window[key];
      });
      await runBody(run);
    } finally {
      allKeys.forEach(function (key) {
        if (saved[key] === undefined) delete global[key];
        else global[key] = saved[key];
      });
    }
  });
}

/**
 * Registers a pending (skipped) test, mirroring mocha's `it.skip`. Used for
 * tests that cannot run under jsdom (e.g. they need a real layout engine).
 * @param {String} message
 * @private
 */
jsdomit.skip = function (message) {
  return it.skip(message, () => {});
};

// See jsdom's lib/jsdom/living/index.js
var LIVING_KEYS = [
  "DOMParser",
  "DOMException",
  "NamedNodeMap",
  "Attr",
  "Node",
  "Element",
  "DocumentFragment",
  "HTMLDocument",
  "Document",
  "CharacterData",
  "Comment",
  "DocumentType",
  "DOMImplementation",
  "ProcessingInstruction",
  "Image",
  "Text",
  "Event",
  "CustomEvent",
  "MessageEvent",
  "ErrorEvent",
  "HashChangeEvent",
  "PopStateEvent",
  "UIEvent",
  "MouseEvent",
  "KeyboardEvent",
  "TouchEvent",
  "ProgressEvent",
  "EventTarget",
  "Location",
  "History",
  "HTMLElement",
  "HTMLAnchorElement",
  "HTMLAppletElement",
  "HTMLAreaElement",
  "HTMLAudioElement",
  "HTMLBaseElement",
  "HTMLBodyElement",
  "HTMLBRElement",
  "HTMLButtonElement",
  "HTMLCanvasElement",
  "HTMLDataElement",
  "HTMLDataListElement",
  "HTMLDialogElement",
  "HTMLDirectoryElement",
  "HTMLDivElement",
  "HTMLDListElement",
  "HTMLEmbedElement",
  "HTMLFieldSetElement",
  "HTMLFontElement",
  "HTMLFormElement",
  "HTMLFrameElement",
  "HTMLFrameSetElement",
  "HTMLHeadingElement",
  "HTMLHeadElement",
  "HTMLHRElement",
  "HTMLHtmlElement",
  "HTMLIFrameElement",
  "HTMLImageElement",
  "HTMLInputElement",
  "HTMLLabelElement",
  "HTMLLegendElement",
  "HTMLLIElement",
  "HTMLLinkElement",
  "HTMLMapElement",
  "HTMLMediaElement",
  "HTMLMenuElement",
  "HTMLMetaElement",
  "HTMLMeterElement",
  "HTMLModElement",
  "HTMLObjectElement",
  "HTMLOListElement",
  "HTMLOptGroupElement",
  "HTMLOptionElement",
  "HTMLOutputElement",
  "HTMLParagraphElement",
  "HTMLParamElement",
  "HTMLPreElement",
  "HTMLProgressElement",
  "HTMLQuoteElement",
  "HTMLScriptElement",
  "HTMLSelectElement",
  "HTMLSourceElement",
  "HTMLSpanElement",
  "HTMLStyleElement",
  "HTMLTableCaptionElement",
  "HTMLTableCellElement",
  "HTMLTableColElement",
  "HTMLTableDataCellElement",
  "HTMLTableElement",
  "HTMLTableHeaderCellElement",
  "HTMLTimeElement",
  "HTMLTitleElement",
  "HTMLTableRowElement",
  "HTMLTableSectionElement",
  "HTMLTemplateElement",
  "HTMLTextAreaElement",
  "HTMLTrackElement",
  "HTMLUListElement",
  "HTMLUnknownElement",
  "HTMLVideoElement",
  "StyleSheet",
  "MediaList",
  "CSSStyleSheet",
  "CSSRule",
  "CSSStyleRule",
  "CSSMediaRule",
  "CSSImportRule",
  "CSSStyleDeclaration",
  "StyleSheetList",
  "XPathException",
  "XPathExpression",
  "XPathResult",
  "XPathEvaluator",
  "HTMLCollection",
  "NodeFilter",
  "NodeIterator",
  "NodeList",
  "Blob",
  "File",
  "FileList",
  "FormData",
  "XMLHttpRequest",
  "XMLHttpRequestEventTarget",
  "XMLHttpRequestUpload",
  "DOMTokenList",
  "URL",
];

var OTHER_KEYS = [
  "addEventListener",
  "alert",
  "atob",
  "blur",
  "btoa",
  /* 'clearInterval', */
  /* 'clearTimeout', */
  "close",
  "confirm",
  /* 'console', */
  "createPopup",
  "dispatchEvent",
  "document",
  "focus",
  "frames",
  "getComputedStyle",
  "history",
  "innerHeight",
  "innerWidth",
  "length",
  "location",
  "moveBy",
  "moveTo",
  "name",
  /* 'navigator', */
  "open",
  "outerHeight",
  "outerWidth",
  "pageXOffset",
  "pageYOffset",
  "parent",
  "postMessage",
  "print",
  "prompt",
  "removeEventListener",
  "resizeBy",
  "resizeTo",
  "screen",
  "screenLeft",
  "screenTop",
  "screenX",
  "screenY",
  "scroll",
  "scrollBy",
  "scrollLeft",
  "scrollTo",
  "scrollTop",
  "scrollX",
  "scrollY",
  "self",
  /* 'setInterval', */
  /* 'setTimeout', */
  "stop",
  /* 'toString', */
  "top",
  "window",
];

const KEYS = LIVING_KEYS.concat(OTHER_KEYS);
