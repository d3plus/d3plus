import {it} from "vitest";
import assert from "assert";
import {
  cuttableWord,
  ellipsisKeep,
  ellipsisLine,
  joinBase,
  longestFit,
} from "../src/textTruncate.ts";
import {softHyphen} from "../src/softHyphen.ts";

// One unit of width per character (grapheme), so fits are easy to reason about.
const measure = text => [...new Intl.Segmenter().segment(text)].length;
const dots = text => `${text}...`;

it("longestFit — the most leading parts that fit", () => {
  const parts = ["a", "b", "c", "d"];
  assert.strictEqual(
    longestFit(parts, t => t.length <= 2),
    2,
  );
  assert.strictEqual(
    longestFit(parts, () => true),
    4,
  );
  assert.strictEqual(
    longestFit(parts, () => false),
    0,
  );
  assert.strictEqual(
    longestFit([], () => true),
    0,
  );
});

it("ellipsisLine — keeps a line whose ellipsis fits", () => {
  assert.strictEqual(
    ellipsisLine("one two", 1, 10, dots, measure),
    "one two...",
  );
});

it("ellipsisLine — drops whole words until the ellipsis fits", () => {
  // "one two three..." is 16 wide; "one two..." is 10.
  assert.strictEqual(
    ellipsisLine("one two three", 1, 12, dots, measure),
    "one two...",
  );
  // Nothing but the ellipsis fits.
  assert.strictEqual(ellipsisLine("one two", 1, 4, dots, measure), "...");
});

it("ellipsisLine — with truncateWord, cuts characters instead of words", () => {
  assert.strictEqual(
    ellipsisLine("one two three", 1, 12, dots, measure, true),
    "one two t...",
  );
});

it("ellipsisLine — never splits an emoji", () => {
  // The family emoji is one grapheme, so it is kept or dropped whole.
  const out = ellipsisLine("ab👨‍👩‍👧cd", 1, 6, dots, measure, true);
  assert.strictEqual(out, "ab👨‍👩‍👧...");
});

it("ellipsisLine — passes the line number to the ellipsis", () => {
  const numbered = (text, line) => `${text}[${line}]`;
  assert.strictEqual(
    ellipsisLine("one two", 3, 20, numbered, measure),
    "one two[3]",
  );
});

it("cuttableWord — strips soft hyphens, newlines, and trailing spaces", () => {
  assert.strictEqual(cuttableWord(`syl${softHyphen}`), "syl");
  assert.strictEqual(cuttableWord("word \n"), "word");
  assert.strictEqual(cuttableWord("word"), "word");
});

it("joinBase — joins the next word with a space, a rejoined syllable, or directly", () => {
  assert.strictEqual(joinBase("one", "one "), "one ");
  assert.strictEqual(joinBase("extra-", `extra${softHyphen}`), "extra");
  assert.strictEqual(joinBase("中", "中"), "中");
  assert.strictEqual(joinBase("", "x "), "");
  assert.strictEqual(joinBase("pre-", "pre-"), "pre-");
});

it("ellipsisKeep — the part of the line kept before the ellipsis", () => {
  assert.strictEqual(ellipsisKeep("one two", 1, 10, dots, measure), "one two");
  assert.strictEqual(
    ellipsisKeep("one two three", 1, 12, dots, measure),
    "one two",
  );
  assert.strictEqual(
    ellipsisKeep("one two three", 1, 12, dots, measure, true),
    "one two t",
  );
  assert.strictEqual(ellipsisKeep("one two", 1, 4, dots, measure), "");
});
