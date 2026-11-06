import {it} from "vitest";
import assert from "assert";
import {default as textWrap} from "../src/textWrap.ts";
import {default as textWidth} from "../../dom/src/textWidth.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom({augment: false});

const font = "Verdana, DejaVu Sans, Liberation Sans";
const style = {"font-family": font, "font-size": 14};
const wrap = () => textWrap().fontFamily(font).fontSize(14);
const dots = (text, line) => (line ? `${text}...` : "");

it("textWrap reports each line's words with their widths", () => {
  const result = wrap().width(400)("The quick brown fox");
  assert.deepStrictEqual(
    result.lineWords[0].map(w => w.text),
    ["The ", "quick ", "brown ", "fox"],
  );
  result.lineWords[0].forEach(w =>
    assert.strictEqual(w.width, textWidth(w.text.trimEnd(), style)),
  );
});

it("textWrap splits CJK lines into single characters for justification", () => {
  const result = wrap().width(400)("这是句子");
  assert.deepStrictEqual(
    result.lineWords[0].map(w => w.text),
    ["这", "是", "句", "子"],
  );
});

it("textWrap marks lines that end at a newline", () => {
  const result = wrap().width(400)("First line\nSecond line that wraps");
  assert.deepStrictEqual(result.lines, [
    "First line",
    "Second line that wraps",
  ]);
  assert.deepStrictEqual(result.hardBreaks, [true, false]);
  const wrapped = wrap().width(60)("one two three four");
  assert.ok(wrapped.lines.length > 1);
  assert.ok(wrapped.hardBreaks.every(b => b === false));
});

it("textWrap reports the first word that did not fit", () => {
  const words = "one two three four five six".split(" ");
  const all = wrap().width(400)(words.join(" "));
  assert.strictEqual(all.nextWord, all.words.length, "every word fit");
  const cut = wrap().width(400).maxLines(1).width(80)(words.join(" "));
  assert.strictEqual(cut.truncated, true);
  const placed = cut.lines[0].split(" ").length;
  assert.strictEqual(cut.nextWord, placed, "stops at the first unplaced word");
});

it("textWrap measures the ellipsis so a truncated line fits its width", () => {
  const sentence = "Supercalifragilistic expialidocious words keep going";
  const width = 180;
  const result = wrap().width(width).maxLines(1).ellipsis(dots)(sentence);
  assert.strictEqual(result.truncated, true);
  assert.ok(result.lines[0].endsWith("..."), result.lines[0]);
  const measured = textWidth(result.lines[0], style);
  assert.ok(measured <= width, `${measured} <= ${width}`);
  assert.strictEqual(result.widths[0], measured, "reports the ended width");
});

it("textWrap takes a string ellipsis and leaves lines alone without one", () => {
  const sentence = "one two three four five six seven";
  const plain = wrap().width(90).maxLines(1)(sentence);
  assert.ok(!plain.lines[0].endsWith("…"));
  const ended = wrap().width(90).maxLines(1).ellipsis("…")(sentence);
  assert.ok(ended.lines[0].endsWith("…"), ended.lines[0]);
  assert.ok(textWidth(ended.lines[0], style) <= 90);
});

it("textWrap truncateWord cuts the next word to fit with the ellipsis", () => {
  // Capitals inside a word keep it from being hyphenated.
  const sentence = "Short ABCDEFGHIJKLMNOP";
  const width = textWidth("Short ABCDE...", style) + 1;
  const off = wrap().width(width).maxLines(1).ellipsis(dots)(sentence);
  assert.strictEqual(off.lines[0], "Short...");
  const on = wrap().width(width).maxLines(1).ellipsis(dots).truncateWord(true)(
    sentence,
  );
  assert.ok(on.lines[0].startsWith("Short ABCDE"), on.lines[0]);
  assert.ok(on.lines[0].endsWith("..."));
  assert.ok(textWidth(on.lines[0], style) <= width);
  // The longest prefix: one more character would not fit.
  const prefix = on.lines[0].slice(0, -3);
  const next = sentence.slice(0, prefix.length + 1);
  assert.ok(textWidth(`${next}...`, style) > width);
});

it("textWrap truncateWord draws the start of a first word wider than the line", () => {
  // Capitals inside a word keep it from being hyphenated.
  const word = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const off = wrap().width(100).ellipsis(dots)(word);
  assert.deepStrictEqual(off.lines, [], "without it, nothing fits");
  assert.strictEqual(off.truncated, true);
  const on = wrap().width(100).ellipsis(dots).truncateWord(true)(word);
  assert.strictEqual(on.lines.length, 1);
  assert.ok(on.lines[0].startsWith("ABCD"), on.lines[0]);
  assert.ok(on.lines[0].endsWith("..."));
  assert.ok(textWidth(on.lines[0], style) <= 100);
  assert.strictEqual(on.truncated, true);
});

it("textWrap truncateWord gives a too-wide later word a line of its own", () => {
  const sentence = "Hi ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const on = wrap().width(120).ellipsis(dots).truncateWord(true)(sentence);
  assert.strictEqual(on.lines.length, 2);
  assert.strictEqual(on.lines[0], "Hi");
  assert.ok(on.lines[1].startsWith("ABCD"), on.lines[1]);
  assert.ok(textWidth(on.lines[1], style) <= 120);
});

it("textWrap truncateWord never splits an emoji", () => {
  const sentence = "Go 👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧";
  const result = wrap().width(80).maxLines(1).ellipsis(dots).truncateWord(true)(
    sentence,
  );
  const body = result.lines[0].replace(/\.\.\.$/, "");
  // Every family emoji drawn is whole: no stray joiners or partial sequences.
  const family = "👨‍👩‍👧";
  const rest = body.replace(/^Go ?/, "").split(family).join("");
  assert.strictEqual(rest, "", `only whole emoji remain: ${body}`);
});

it("textWrap truncateWord leaves a CJK line to its whole characters", () => {
  const sentence = "这是一个很长的句子需要被截断";
  const result = wrap()
    .width(100)
    .maxLines(1)
    .ellipsis(dots)
    .truncateWord(true)(sentence);
  assert.ok(result.lines[0].endsWith("..."));
  assert.ok(textWidth(result.lines[0], style) <= 100);
  assert.ok(sentence.startsWith(result.lines[0].slice(0, -3)));
});

it("textWrap drops a syllable break's hyphen before the ellipsis", () => {
  const sentence = "Wonderful extraordinary sentences";
  const result = wrap()
    .width(textWidth("Wonderful extraordinary", style) + 1)
    .maxLines(1)
    .ellipsis(dots)(sentence);
  assert.ok(result.lines[0].endsWith("..."), result.lines[0]);
  assert.ok(!result.lines[0].includes("-..."), result.lines[0]);
});

it("textWrap moves the ellipsis up when a line keeps nothing else", () => {
  const width = textWidth("ABCDEFGHIJ", style) + 1;
  const result = wrap().width(width).maxLines(2).ellipsis(dots)(
    "Hi ABCDEFGHIJ more words",
  );
  assert.deepStrictEqual(result.lines, ["Hi..."]);
  assert.deepStrictEqual(result.hardBreaks, [false]);
  assert.strictEqual(result.widths.length, 1);
});
