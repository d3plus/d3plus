import assert from "assert";
import {
  noteMeasured,
  onFontsLoaded,
  watchFonts,
} from "../es/src/fontLoading.js";
import it from "./jsdom.js";

/**
 * Installs a fake FontFaceSet on the current jsdom document (jsdom has none)
 * that counts how many "loadingdone" listeners are attached to it.
 */
function fakeFonts() {
  const fonts = new window.EventTarget();
  const add = fonts.addEventListener.bind(fonts);
  fonts.listenerCount = 0;
  fonts.addEventListener = (type, fn) => {
    if (type === "loadingdone") fonts.listenerCount++;
    add(type, fn);
  };
  fonts.loaded = (...families) => {
    const event = new window.Event("loadingdone");
    event.fontfaces = families.map(family => ({family}));
    fonts.dispatchEvent(event);
  };
  Object.defineProperty(document, "fonts", {value: fonts});
  return fonts;
}

it("fontLoading: is a no-op without document.fonts", () => {
  assert.strictEqual(watchFonts(), undefined, "jsdom document");
  noteMeasured("NoFontsFace");
  const off = onFontsLoaded(() => {});
  assert.strictEqual(typeof off, "function", "still returns an unsubscribe");
  off();
});

it("fontLoading: is a no-op without a document", () => {
  const saved = global.document;
  delete global.document;
  try {
    assert.strictEqual(watchFonts(), undefined);
    noteMeasured("NoDocumentFace");
    onFontsLoaded(() => {})();
  } finally {
    global.document = saved;
  }
});

it("fontLoading: listens once per FontFaceSet", () => {
  const fonts = fakeFonts();
  assert.strictEqual(watchFonts(), fonts, "returns the document's set");
  watchFonts();
  noteMeasured("OnceFace");
  onFontsLoaded(() => {})();
  assert.strictEqual(fonts.listenerCount, 1);
});

it("fontLoading: notifies only for measured families", () => {
  const fonts = fakeFonts();
  let calls = 0;
  const off = onFontsLoaded(() => calls++);

  fonts.loaded("UnmeasuredFace");
  assert.strictEqual(calls, 0, "family never measured");

  noteMeasured("MeasuredFace, serif");
  fonts.loaded("MeasuredFace");
  assert.strictEqual(calls, 1, "family measured");

  fonts.loaded("UnmeasuredFace", "MeasuredFace", "MeasuredFace");
  assert.strictEqual(calls, 2, "once per event, however many faces match");

  fonts.dispatchEvent(new window.Event("loadingdone"));
  assert.strictEqual(calls, 2, "event without fontfaces");
  off();
});

it("fontLoading: matches families regardless of quotes, case, and spacing", () => {
  const fonts = fakeFonts();
  let calls = 0;
  const off = onFontsLoaded(() => calls++);
  noteMeasured("'Single Quoted',   \"Double Quoted\" ,MixedCase");

  fonts.loaded('"Single Quoted"');
  fonts.loaded("Double Quoted");
  fonts.loaded("mixedcase");
  assert.strictEqual(calls, 3);
  off();
});

it("fontLoading: unsubscribing removes only that callback", () => {
  const fonts = fakeFonts();
  noteMeasured("UnsubscribeFace");
  const calls = {a: 0, b: 0};
  const offA = onFontsLoaded(() => calls.a++);
  const offB = onFontsLoaded(() => calls.b++);

  fonts.loaded("UnsubscribeFace");
  assert.deepStrictEqual(calls, {a: 1, b: 1}, "both subscribed");

  offA();
  fonts.loaded("UnsubscribeFace");
  assert.deepStrictEqual(calls, {a: 1, b: 2}, "a unsubscribed");

  offB();
  fonts.loaded("UnsubscribeFace");
  assert.deepStrictEqual(calls, {a: 1, b: 2}, "both unsubscribed");
});
