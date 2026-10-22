import {JSDOM} from "jsdom";
import {afterEach, beforeEach, it} from "vitest";

import {installCanvas} from "./canvas.js";

const defaultHTML =
  "<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>";

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
  if (!proto.getBBox) proto.getBBox = () => ({x: 0, y: 0, width: 0, height: 0});
}

// Globals (beyond KEYS) that some dependencies read off the global scope.
const EXTRA_KEYS = ["navigator", "ResizeObserver"];

/**
 * Creates a fresh JSDOM document and mirrors its window onto Node's global
 * scope. Returns a function that restores every global exactly as it was.
 * @param {Object} [options]
 * @param {Boolean} [options.augment = true] Adds the stubs in `augmentWindow`.
 * @private
 */
function installJsdom({augment = true} = {}) {
  const dom = new JSDOM(defaultHTML);
  installCanvas(dom.window);
  if (augment) augmentWindow(dom.window);

  // Deduplicated because "window"/"document" also appear in KEYS, and setting
  // a key twice would corrupt the save/restore bookkeeping.
  const globalKeys = [
    ...new Set(["window", "document", ...KEYS, ...(augment ? EXTRA_KEYS : [])]),
  ];

  // Each global's original state, so it is restored exactly rather than
  // deleted: deleting would remove Node natives (e.g. `URL`, `Event`) that
  // later code relies on.
  const originals = globalKeys.map(key => ({
    key,
    had: Object.prototype.hasOwnProperty.call(global, key),
    value: global[key],
  }));

  globalKeys.forEach(key => {
    // Some globals are read-only natives on newer Node (e.g. `navigator`);
    // those can't be assigned, so the native stays in place.
    try {
      global[key] = dom.window[key];
    } catch {
      /* read-only native global; leave as-is */
    }
  });

  return () => {
    originals.forEach(({key, had, value}) => {
      if (!had) delete global[key];
      else {
        try {
          global[key] = value;
        } catch {
          /* read-only native; leave as-is */
        }
      }
    });
  };
}

/**
 * Runs every test in the current file (or `describe` block) inside its own
 * fresh JSDOM document, with the window's globals mirrored onto Node's.
 * @param {Object} [options] See `installJsdom`.
 */
export function useJsdom(options) {
  let restore;
  beforeEach(() => {
    restore = installJsdom(options);
  });
  afterEach(async () => {
    // Work a test left queued (e.g. a tooltip's async positioning) settles
    // against the document it started in.
    await new Promise(resolve => setTimeout(resolve));
    restore?.();
    restore = undefined;
  });
}

/**
 * Registers one test that runs inside a fresh JSDOM document, for files that
 * mix jsdom tests with plain Node ones.
 * @param {String} name
 * @param {Function} run
 * @param {Object} [options] See `installJsdom`.
 */
export function jsdomit(name, run, options) {
  return it(name, async () => {
    const restore = installJsdom(options);
    try {
      await run();
    } finally {
      restore();
    }
  });
}

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

// `atob`, `btoa` and the timer functions stay Node's natives: jsdom's versions
// call the global ones, so mirroring them would make each call itself.
var OTHER_KEYS = [
  "addEventListener",
  "alert",
  /* 'atob', */
  "blur",
  /* 'btoa', */
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
