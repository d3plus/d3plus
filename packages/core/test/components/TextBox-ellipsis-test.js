import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {TextBox} from "../../index.ts";
import textWidth from "../../../dom/src/textWidth.ts";
import fontExists from "../../../dom/src/fontExists.ts";

useJsdom();

/** TextBox's default `ellipsis`. */
const ellipsis = new TextBox().ellipsis();

it("ellipsis keeps the periods inside the line", () => {
  assert.strictEqual(ellipsis("Ages 0.5 to 4.5", 1), "Ages 0.5 to 4.5...");
  assert.strictEqual(ellipsis("U.S. and E.U", 2), "U.S. and E.U...");
});

it("ellipsis drops a trailing period", () => {
  assert.strictEqual(ellipsis("Ages 0.5 to 4.5.", 1), "Ages 0.5 to 4.5...");
  assert.strictEqual(ellipsis("Wait...", 1), "Wait...");
});

it("ellipsis drops a trailing comma", () => {
  assert.strictEqual(ellipsis("Ages 0.5, 1.5,", 1), "Ages 0.5, 1.5...");
});

it("ellipsis drops trailing spaces", () => {
  assert.strictEqual(ellipsis("Ages 0.5 ", 1), "Ages 0.5...");
  assert.strictEqual(ellipsis("Ages 0.5, ", 1), "Ages 0.5...");
});

it("ellipsis of empty text", () => {
  // A line left with nothing but its ellipsis.
  assert.strictEqual(ellipsis("", 1), "...");
  // A first word that cannot fit draws nothing.
  assert.strictEqual(ellipsis("", 0), "");
});

it("TextBox keeps the decimals in a cut line", () => {
  const font = "DejaVu Sans";
  const style = {"font-family": fontExists(font), "font-size": 14};
  const kept = "Ages 0.5 to 4.5...";
  const width = Math.ceil(textWidth(kept, style)) + 1;
  const box = new TextBox()
    .data([{text: "Ages 0.5 to 4.5, then 5.5 to 9.5 years"}])
    .fontFamily(font)
    .fontSize(14)
    .maxLines(1)
    .width(width)
    .height(100);
  const [line] = box.toScene().children[0].lines;
  assert.strictEqual(line.text, kept);
  assert.ok(textWidth(line.text, style) <= width);
});
