import assert from "assert";
import {onFontsLoaded} from "../es/src/fontLoading.js";
import {default as textWidth} from "../es/src/textWidth.js";
import it from "./jsdom.js";

it("textWidth", () => {
  const font = "Verdana";

  const base = textWidth("Test", {"font-family": font, "font-size": 14}),
    bigger = textWidth("Test", {"font-family": font, "font-size": 28}),
    bolder = textWidth("Test", {
      "font-family": font,
      "font-size": 14,
      "font-weight": "bold",
    }),
    longer = textWidth("TestTest", {"font-family": font, "font-size": 14});

  assert.ok(base * 2 === longer, "string length");
  assert.ok(base < bigger, "font-size");
  assert.ok(base < bolder, "font-weight");

  const arrayResult = textWidth(["Test", "TestTest"], {"font-family": font, "font-size": 14});
  assert.ok(Array.isArray(arrayResult), "array input returns array");
  assert.strictEqual(arrayResult.length, 2, "array result has correct length");
  assert.ok(arrayResult[0] < arrayResult[1], "array widths reflect string lengths");

  assert.strictEqual(textWidth("", {"font-family": font, "font-size": 14}), 0, "empty string returns 0");

  const htmlWidth = textWidth("Test &amp; More", {"font-family": font, "font-size": 14});
  assert.ok(htmlWidth > 0, "HTML entities are decoded");

  const noStyle = textWidth("Test");
  assert.ok(noStyle > 0, "works without style parameter");

  const whitespace = textWidth("   ", {"font-family": font, "font-size": 14});
  assert.ok(typeof whitespace === "number", "whitespace-only string returns a number");
});

/** Installs a fake FontFaceSet (jsdom has none) that can announce font loads. */
function fakeFonts() {
  const fonts = new window.EventTarget();
  fonts.loaded = family => {
    const event = new window.Event("loadingdone");
    event.fontfaces = [{family}];
    fonts.dispatchEvent(event);
  };
  Object.defineProperty(document, "fonts", {value: fonts});
  return fonts;
}

it("textWidth records the families it measures", () => {
  const fonts = fakeFonts();
  let calls = 0;
  const off = onFontsLoaded(() => calls++);

  fonts.loaded("RecordedFace");
  assert.strictEqual(calls, 0, "not yet measured");
  textWidth("Test", {"font-family": "RecordedFace, serif"});
  fonts.loaded("RecordedFace");
  assert.strictEqual(calls, 1, "explicit font-family");

  textWidth("Test");
  fonts.loaded("sans-serif");
  assert.strictEqual(calls, 2, "default font-family");
  off();
});

it("textWidth re-measures text after a measured web font loads", () => {
  const fonts = fakeFonts();
  const proto = Object.getPrototypeOf(
    document.createElement("canvas").getContext("2d"),
  );
  const measureText = proto.measureText;
  let measured = 0;
  proto.measureText = function (...args) {
    measured++;
    return measureText.apply(this, args);
  };

  try {
    const style = {"font-family": "CacheFace", "font-size": 14};
    const before = textWidth("Cache probe", style);
    assert.ok(measured > 0, "first measurement hits the canvas");

    measured = 0;
    assert.strictEqual(textWidth("Cache probe", style), before);
    assert.strictEqual(measured, 0, "repeat measurement is cached");

    fonts.loaded("UnrelatedFace");
    textWidth("Cache probe", style);
    assert.strictEqual(measured, 0, "unmeasured font load keeps the cache");

    fonts.loaded("CacheFace");
    textWidth("Cache probe", style);
    assert.ok(measured > 0, "measured font load clears the cache");
  } finally {
    proto.measureText = measureText;
  }
});
