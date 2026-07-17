import assert from "assert";
import textWidth, {decodeEntities} from "../es/src/textWidth.js";
import jsdomit from "./jsdom.js";

// `decodeEntities` is DOM-free, so these run without a jsdom document.
it("decodeEntities decodes named entities", () => {
  assert.strictEqual(decodeEntities("Tom &amp; Jerry"), "Tom & Jerry");
  assert.strictEqual(decodeEntities("&lt;tag&gt;"), "<tag>");
  assert.strictEqual(decodeEntities("a&nbsp;b"), "a b");
  assert.strictEqual(decodeEntities("2&ndash;3&mdash;4"), "2–3—4");
});

it("decodeEntities decodes decimal and hex numeric references", () => {
  assert.strictEqual(decodeEntities("caf&#233;"), "café"); // decimal é
  assert.strictEqual(decodeEntities("caf&#xE9;"), "café"); // hex é
  assert.strictEqual(decodeEntities("&#38;"), "&");
  assert.strictEqual(decodeEntities("&#x26;"), "&");
});

it("decodeEntities leaves unknown or out-of-range entities untouched", () => {
  assert.strictEqual(decodeEntities("&notareal;"), "&notareal;", "unknown named entity");
  assert.strictEqual(
    decodeEntities("&#99999999999;"),
    "&#99999999999;",
    "code point beyond U+10FFFF is left as-is",
  );
  assert.strictEqual(decodeEntities("plain text"), "plain text", "no entities");
});

jsdomit("textWidth accepts a string font-size", () => {
  const style = {"font-family": "Verdana", "font-size": "14px"};
  assert.ok(textWidth("Test", style) > 0, "measures with a string font-size");
});

// Forces htmlDecode's DOM-free branch by removing DOMParser while keeping the
// jsdom document (so pretext can still measure). Restored by the jsdom teardown.
jsdomit("textWidth falls back to the DOM-free decoder when DOMParser is absent", () => {
  assert.ok(typeof DOMParser !== "undefined", "precondition: jsdom provides DOMParser");
  delete global.DOMParser;
  assert.strictEqual(typeof DOMParser, "undefined", "DOMParser removed");

  const style = {"font-family": "Verdana", "font-size": 14};
  const decoded = textWidth("A &amp; B", style);
  const literal = textWidth("A & B", style);
  assert.ok(decoded > 0, "measures a non-zero width via the fallback");
  assert.strictEqual(decoded, literal, "&amp; is decoded to & (same measured width)");
});
