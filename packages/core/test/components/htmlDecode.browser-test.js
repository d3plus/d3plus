import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {htmlDecode} from "../../../dom/src/textWidth.ts";

/**
    In a real browser, `htmlDecode` reads every label as a fresh `DOMParser`
    does, though it skips the parser for plain text and reuses one for the
    rest.
*/

it("htmlDecode — reads every label as a fresh DOMParser does in Chromium", () => {
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
    "\ud800",
    "\udc00",
    "-",
    ".",
    "%",
    "$1,000",
    "2020",
    "Q1 2020",
    "'",
    '"',
  ];
  let seed = 5;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const samples = pieces.slice();
  for (let n = 0; n < 3000; n++)
    samples.push(
      Array.from(
        {length: 1 + Math.floor(rand() * 6)},
        () => pieces[Math.floor(rand() * pieces.length)],
      ).join(""),
    );
  const parsed = input => {
    if (input.replace(/\s+/g, "") === "") return input;
    const stripped = input.replace(/<[^>]+>/g, "");
    return new DOMParser().parseFromString(stripped, "text/html")
      .documentElement.textContent;
  };
  for (const input of samples)
    assert.strictEqual(htmlDecode(input), parsed(input), JSON.stringify(input));
});
