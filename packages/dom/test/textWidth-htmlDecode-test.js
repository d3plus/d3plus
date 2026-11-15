import {it} from "vitest";
import assert from "assert";
import {htmlDecode} from "../src/textWidth.ts";
import {jsdomit} from "~test/jsdom.js";

/**
    `htmlDecode` skips the HTML parser for plain text and reuses one parser
    for the rest, decoding every label exactly as a fresh `DOMParser` does.
*/

/** What a fresh parser reads `input` as, the way `htmlDecode` reads it with one. */
const parsed = input => {
  if (input.replace(/\s+/g, "") === "") return input;
  const stripped = input.replace(/<[^>]+>/g, "");
  return new DOMParser().parseFromString(stripped, "text/html").documentElement
    .textContent;
};

/** Labels covering plain text, whitespace, entities, tags, and the characters the parser rewrites. */
const samples = () => {
  const pieces = [
    "a",
    "Z",
    "7",
    " ",
    "  ",
    "\t",
    "\n",
    "\f",
    "\r",
    "\r\n",
    "\0",
    " ",
    " ",
    "&",
    "&amp;",
    "&lt;b&gt;",
    "&#233;",
    "&nbsp;",
    "&bogus;",
    "<",
    ">",
    "<b>",
    "</i>",
    "<br/>",
    "a < b",
    "é",
    "中文",
    "😀",
    "-",
    ".",
    ",",
    "%",
    "$1,000",
    "2020",
    "Q1 2020",
    "'",
    '"',
    "=",
  ];
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const out = pieces.slice();
  for (let n = 0; n < 2000; n++) {
    const length = 1 + Math.floor(rand() * 6);
    out.push(
      Array.from(
        {length},
        () => pieces[Math.floor(rand() * pieces.length)],
      ).join(""),
    );
  }
  return out;
};

jsdomit("htmlDecode — reads every label as a fresh DOMParser does", () => {
  for (const input of samples())
    assert.strictEqual(htmlDecode(input), parsed(input), JSON.stringify(input));
});

jsdomit(
  "htmlDecode — plain text drops only its leading HTML whitespace",
  () => {
    assert.strictEqual(htmlDecode("  Apples "), "Apples ");
    assert.strictEqual(htmlDecode("\t\n\fPears"), "Pears");
    assert.strictEqual(htmlDecode(" Plums"), " Plums", "nbsp stays");
    assert.strictEqual(htmlDecode("   "), "   ", "blank text stays");
    assert.strictEqual(htmlDecode("Tom &amp; <b>Jerry</b>"), "Tom & Jerry");
  },
);

it("htmlDecode — decodes entities without a DOM", () => {
  assert.strictEqual(htmlDecode("Tom &amp; <b>Jerry</b>"), "Tom & Jerry");
  assert.strictEqual(htmlDecode("  Apples"), "  Apples");
});
