import {it} from "vitest";
import assert from "assert";
import {textSplit} from "@d3plus/text";
import {
  wholeWordFit,
  wholeWords,
  wholeWordSplit,
} from "../../src/utils/wholeWords.ts";
import {jsdomit} from "~test/jsdom.js";

jsdomit("wholeWordSplit — keeps hyphenatable words whole", () => {
  const sentence = "Kinshasa Democratic Republic";
  assert.ok(
    textSplit(sentence).some(w => w.endsWith("­")),
    "TextBox's split breaks words into syllables",
  );
  const words = wholeWordSplit(sentence);
  assert.ok(
    words.every(w => !w.includes("­")),
    `no soft hyphens (${JSON.stringify(words)})`,
  );
  assert.deepStrictEqual(
    words.map(w => w.trim()),
    ["Kinshasa", "Democratic", "Republic"],
  );
  assert.deepStrictEqual(
    wholeWordSplit("Tokyo").map(w => w.trim()),
    ["Tokyo"],
  );
});

it("wholeWords — joins the syllables of any split function, passing its index through", () => {
  const calls = [];
  const split = (sentence, i) => {
    calls.push(i);
    return ["Un­", "em­", "ploy­", "ment ", "rate"];
  };
  assert.deepStrictEqual(wholeWords(split)("Unemployment rate", 3), [
    "Unemployment ",
    "rate",
  ]);
  assert.deepStrictEqual(calls, [3]);
  assert.deepStrictEqual(
    wholeWords(() => ["well-", "known"])("well-known"),
    ["well-", "known"],
    "real hyphens stay breakable",
  );
});

it("wholeWordFit — truncated text doesn't fit and is never re-wrapped", () => {
  let rewrapped = false;
  const result = {lines: ["Unem-"], truncated: true};
  const out = wholeWordFit(result, () => ((rewrapped = true), result));
  assert.deepStrictEqual(out, {fits: false, result});
  assert.strictEqual(rewrapped, false);
});

it("wholeWordFit — text with no hyphenated line break fits as wrapped", () => {
  let rewrapped = false;
  const result = {lines: ["Quarterly", "Rate-"], truncated: false};
  const out = wholeWordFit(result, () => ((rewrapped = true), result));
  assert.deepStrictEqual(
    out,
    {fits: true, result},
    "a hyphen on the last line is not a break",
  );
  assert.strictEqual(rewrapped, false);
});

it("wholeWordFit — a word only hyphenated to pack a line fits, drawn whole", () => {
  const result = {lines: ["(New De-", "fault)"], truncated: false};
  const whole = {lines: ["(New", "Default)"], truncated: false};
  assert.deepStrictEqual(
    wholeWordFit(result, () => whole),
    {fits: true, result: whole},
  );
});

it("wholeWordFit — a word wider than its line doesn't fit", () => {
  const result = {lines: ["Unem-", "ploy-", "ment"], truncated: false};
  const out = wholeWordFit(result, () => ({lines: [], truncated: true}));
  assert.deepStrictEqual(out, {fits: false, result});
});
