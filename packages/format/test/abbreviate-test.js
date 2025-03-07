import assert from "assert";
import {default as abbreviate} from "../src/formatAbbreviate.js";

it("abbreviate", () => {

  assert.strictEqual("1.23Q", abbreviate(1234567890000000000), "quintillion");
  assert.strictEqual("1.23q", abbreviate(1234567890000000), "quadrillion");
  assert.strictEqual("1.23T", abbreviate(1234567890000), "trillion");
  assert.strictEqual("1.23B", abbreviate(1234567890), "billion");
  assert.strictEqual("1.23M", abbreviate(1234567), "million");
  assert.strictEqual("123k",  abbreviate(123456), "hundred thousand");
  assert.strictEqual("12.3k", abbreviate(12345), "ten thousand");
  assert.strictEqual("1.23k", abbreviate(1234), "thousand");
  assert.strictEqual("123",   abbreviate(123), "hundred");
  assert.strictEqual("12",    abbreviate(12), "ten");
  assert.strictEqual("1",     abbreviate(1), "single");
  assert.strictEqual("0.12",  abbreviate(0.12), "tenths");
  assert.strictEqual("0.012", abbreviate(0.0123), "hundredths");

  assert.strictEqual("-12.3k", abbreviate("-12345"), "string parsing");
  assert.strictEqual("-12.3k", abbreviate(-12345), "bigs negatives");
  assert.strictEqual("-12",    abbreviate(-12), "small negatives");

  assert.strictEqual("1B",   abbreviate(1000000009), "large - removes trailing zeros and period");
  assert.strictEqual("0.1",  abbreviate(0.1), "small - removes trailing zeros");
  assert.strictEqual("0.01", abbreviate(0.01), "small - removes trailing zeros");

  assert.strictEqual("10 miljonit",    abbreviate(10000000, "et-EE"), "estonian locale");
  assert.strictEqual("1,23 triljonit", abbreviate(1234567890000, "et-EE"), "trillion in estonian");
  assert.strictEqual("1mm",            abbreviate(1000000, "es-ES"), "spanish locale");
  assert.strictEqual("1,23t",          abbreviate(1234567890000, "es-ES"), "trillion in spanish");

  assert.strictEqual("0.12",  abbreviate(0.12, "en-US"), "decimal format in english");
  assert.strictEqual("0,12",  abbreviate(0.12, "et-EE"), "decimal format in estonian");
  assert.strictEqual("1,000", abbreviate(1000, "en-US", ",.4r"), "trillion in english");
  assert.strictEqual("1 000", abbreviate(1000, "et-EE", ",.4r"), "trillion in estonian");

});
