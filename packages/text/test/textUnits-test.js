import {it} from "vitest";
import assert from "assert";
import {graphemes, isBreakable, lineUnits} from "../src/textUnits.ts";

it("isBreakable — CJK characters and emoji, not Latin or Arabic letters", () => {
  assert.strictEqual(isBreakable("中"), true);
  assert.strictEqual(isBreakable("か"), true);
  assert.strictEqual(isBreakable("😀"), true);
  assert.strictEqual(isBreakable("a"), false);
  assert.strictEqual(isBreakable("ع"), false);
  assert.strictEqual(isBreakable(" "), false);
});

it("graphemes — keeps emoji sequences and combining marks whole", () => {
  assert.deepStrictEqual(graphemes("abc"), ["a", "b", "c"]);
  // A family emoji is several code points joined by zero-width joiners.
  assert.deepStrictEqual(graphemes("a👨‍👩‍👧b"), ["a", "👨‍👩‍👧", "b"]);
  // A flag is two regional indicators.
  assert.deepStrictEqual(graphemes("🇺🇸!"), ["🇺🇸", "!"]);
  // "e" followed by a combining acute accent.
  assert.deepStrictEqual(graphemes("éx"), ["é", "x"]);
  assert.deepStrictEqual(graphemes(""), []);
});

it("lineUnits — words keep the spaces after them", () => {
  assert.deepStrictEqual(lineUnits("The quick  brown fox"), [
    "The ",
    "quick  ",
    "brown ",
    "fox",
  ]);
  assert.deepStrictEqual(lineUnits("one"), ["one"]);
  assert.deepStrictEqual(lineUnits(""), []);
});

it("lineUnits — leading spaces join the first word", () => {
  assert.deepStrictEqual(lineUnits("  lead on"), ["  lead ", "on"]);
});

it("lineUnits — CJK characters and emoji are units of their own", () => {
  assert.deepStrictEqual(lineUnits("这是句子"), ["这", "是", "句", "子"]);
  assert.deepStrictEqual(lineUnits("中文 text"), ["中", "文 ", "text"]);
  assert.deepStrictEqual(lineUnits("hi😀👍🏽"), ["hi", "😀", "👍🏽"]);
});

it("lineUnits — markup stays inside the word it touches", () => {
  assert.deepStrictEqual(lineUnits("Hello <b>bold</b> text"), [
    "Hello ",
    "<b>bold</b> ",
    "text",
  ]);
});
