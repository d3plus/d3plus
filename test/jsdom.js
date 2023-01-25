import {JSDOM} from "jsdom";

const defaultHTML = "<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>";

/**
 * 
 * @param {String} message Test message to pass as first argument to the "it" functoin.
 * @param {String} [html = ""] Optional HTML string to render on the page.
 * @param {Function} run Callback function that is run once the "window" and "document" are ready.
 * @returns 
 */
export default function jsdomit(message, html, run) {
  if (arguments.length < 3) run = html, html = defaultHTML;
  return it(message, async() => {
    try {
      const dom = new JSDOM(html);
      global.window = dom.window;
      global.document = dom.window.document;
      KEYS.forEach(function (key) {
        global[key] = window[key];
      });
      await run();
    }
    finally {
      delete global.window;
      delete global.document;
      KEYS.forEach(function (key) { delete global[key] });
    }
  });
}  

// See jsdom's lib/jsdom/living/index.js
var LIVING_KEYS = [
  'DOMParser',
  'DOMException',
  'NamedNodeMap',
  'Attr',
  'Node',
  'Element',
  'DocumentFragment',
  'HTMLDocument',
  'Document',
  'CharacterData',
  'Comment',
  'DocumentType',
  'DOMImplementation',
  'ProcessingInstruction',
  'Image',
  'Text',
  'Event',
  'CustomEvent',
  'MessageEvent',
  'ErrorEvent',
  'HashChangeEvent',
  'PopStateEvent',
  'UIEvent',
  'MouseEvent',
  'KeyboardEvent',
  'TouchEvent',
  'ProgressEvent',
  'EventTarget',
  'Location',
  'History',
  'HTMLElement',
  'HTMLAnchorElement',
  'HTMLAppletElement',
  'HTMLAreaElement',
  'HTMLAudioElement',
  'HTMLBaseElement',
  'HTMLBodyElement',
  'HTMLBRElement',
  'HTMLButtonElement',
  'HTMLCanvasElement',
  'HTMLDataElement',
  'HTMLDataListElement',
  'HTMLDialogElement',
  'HTMLDirectoryElement',
  'HTMLDivElement',
  'HTMLDListElement',
  'HTMLEmbedElement',
  'HTMLFieldSetElement',
  'HTMLFontElement',
  'HTMLFormElement',
  'HTMLFrameElement',
  'HTMLFrameSetElement',
  'HTMLHeadingElement',
  'HTMLHeadElement',
  'HTMLHRElement',
  'HTMLHtmlElement',
  'HTMLIFrameElement',
  'HTMLImageElement',
  'HTMLInputElement',
  'HTMLLabelElement',
  'HTMLLegendElement',
  'HTMLLIElement',
  'HTMLLinkElement',
  'HTMLMapElement',
  'HTMLMediaElement',
  'HTMLMenuElement',
  'HTMLMetaElement',
  'HTMLMeterElement',
  'HTMLModElement',
  'HTMLObjectElement',
  'HTMLOListElement',
  'HTMLOptGroupElement',
  'HTMLOptionElement',
  'HTMLOutputElement',
  'HTMLParagraphElement',
  'HTMLParamElement',
  'HTMLPreElement',
  'HTMLProgressElement',
  'HTMLQuoteElement',
  'HTMLScriptElement',
  'HTMLSelectElement',
  'HTMLSourceElement',
  'HTMLSpanElement',
  'HTMLStyleElement',
  'HTMLTableCaptionElement',
  'HTMLTableCellElement',
  'HTMLTableColElement',
  'HTMLTableDataCellElement',
  'HTMLTableElement',
  'HTMLTableHeaderCellElement',
  'HTMLTimeElement',
  'HTMLTitleElement',
  'HTMLTableRowElement',
  'HTMLTableSectionElement',
  'HTMLTemplateElement',
  'HTMLTextAreaElement',
  'HTMLTrackElement',
  'HTMLUListElement',
  'HTMLUnknownElement',
  'HTMLVideoElement',
  'StyleSheet',
  'MediaList',
  'CSSStyleSheet',
  'CSSRule',
  'CSSStyleRule',
  'CSSMediaRule',
  'CSSImportRule',
  'CSSStyleDeclaration',
  'StyleSheetList',
  'XPathException',
  'XPathExpression',
  'XPathResult',
  'XPathEvaluator',
  'HTMLCollection',
  'NodeFilter',
  'NodeIterator',
  'NodeList',
  'Blob',
  'File',
  'FileList',
  'FormData',
  'XMLHttpRequest',
  'XMLHttpRequestEventTarget',
  'XMLHttpRequestUpload',
  'DOMTokenList',
  'URL'
]

var OTHER_KEYS = [
  'addEventListener',
  'alert',
  'atob',
  'blur',
  'btoa',
  /* 'clearInterval', */
  /* 'clearTimeout', */
  'close',
  'confirm',
  /* 'console', */
  'createPopup',
  'dispatchEvent',
  'document',
  'focus',
  'frames',
  'getComputedStyle',
  'history',
  'innerHeight',
  'innerWidth',
  'length',
  'location',
  'moveBy',
  'moveTo',
  'name',
  'navigator',
  'open',
  'outerHeight',
  'outerWidth',
  'pageXOffset',
  'pageYOffset',
  'parent',
  'postMessage',
  'print',
  'prompt',
  'removeEventListener',
  'resizeBy',
  'resizeTo',
  'screen',
  'screenLeft',
  'screenTop',
  'screenX',
  'screenY',
  'scroll',
  'scrollBy',
  'scrollLeft',
  'scrollTo',
  'scrollTop',
  'scrollX',
  'scrollY',
  'self',
  /* 'setInterval', */
  /* 'setTimeout', */
  'stop',
  /* 'toString', */
  'top',
  'window'
]

const KEYS = LIVING_KEYS.concat(OTHER_KEYS);  
