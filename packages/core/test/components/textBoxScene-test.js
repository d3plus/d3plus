import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {TextBox} from "../../index.ts";
import {
  textBoxFont,
  textBoxLineY,
  textBoxLines,
  textBoxNode,
  textBoxPaint,
} from "../../src/components/textBoxScene.ts";
import textWidth from "../../../dom/src/textWidth.ts";
import fontExists from "../../../dom/src/fontExists.ts";

useJsdom();

/** A laid-out box with the fields the scene builders read. */
const datum = overrides => ({
  aH: "false",
  data: {},
  i: 0,
  id: "a",
  lines: ["one two three", "four"],
  lineRuns: null,
  lineWords: null,
  hardBreaks: [false, false],
  widths: [60, 20],
  fC: "black",
  fStroke: "transparent",
  fSW: 0,
  fF: "sans-serif",
  fO: 1,
  fW: 400,
  pE: "auto",
  tA: "start",
  vA: "top",
  truncated: false,
  fS: 10,
  lH: 12,
  w: 100,
  h: 50,
  r: 0,
  x: 0,
  y: 0,
  ...overrides,
});

it("textBoxLineY — baselines for top, middle, and bottom alignment", () => {
  assert.strictEqual(textBoxLineY(datum(), 0), 10);
  assert.strictEqual(textBoxLineY(datum(), 1), 22);
  // Unrotated boxes are moved into place by their y, so lines stack from the top.
  assert.strictEqual(textBoxLineY(datum({vA: "bottom"}), 0), 10);
  const rotated = datum({r: 90, vA: "middle"});
  assert.strictEqual(textBoxLineY(rotated, 0), 30 - 2 + -0.5 * 12);
});

it("textBoxLines — start, middle, end, and percentages", () => {
  const x = (tA, rtl = false) =>
    textBoxLines(datum({tA}), 100, rtl).lines.map(l => l.x);
  assert.deepStrictEqual(x("start"), [0, 0]);
  assert.deepStrictEqual(x("middle"), [50, 50]);
  assert.deepStrictEqual(x("end"), [100, 100]);
  assert.deepStrictEqual(x("50%"), [20, 40]);
  assert.deepStrictEqual(x("start", true), [100, 100]);
  assert.deepStrictEqual(x("25%", true), [90, 80]);
  assert.strictEqual(
    textBoxLines(datum({tA: "75%"}), 100, false).anchor,
    "start",
  );
});

it("textBoxLines — justify gives each word a positioned run, except the last line", () => {
  const lineWords = [
    [
      {text: "one ", width: 20},
      {text: "two ", width: 20},
      {text: "three", width: 20},
    ],
    [{text: "four", width: 20}],
  ];
  const {anchor, lines} = textBoxLines(
    datum({tA: "justify", lineWords}),
    100,
    false,
  );
  assert.strictEqual(anchor, "start");
  assert.deepStrictEqual(lines[0], {
    text: "one two three",
    x: 0,
    width: 100,
    runs: [
      {text: "one ", x: 0},
      {text: "two ", x: 40},
      {text: "three", x: 80},
    ],
  });
  assert.deepStrictEqual(lines[1], {text: "four", x: 0, width: 20});
});

it("textBoxLines — justify leaves lines that end at a newline start-aligned", () => {
  const words = [
    {text: "a ", width: 10},
    {text: "b", width: 10},
  ];
  const {lines} = textBoxLines(
    datum({
      tA: "justify",
      lines: ["a b", "a b", "a b"],
      widths: [25, 25, 25],
      hardBreaks: [true, false, false],
      lineWords: [words, words, words],
    }),
    100,
    false,
  );
  assert.strictEqual(lines[0].runs, undefined, "hard break");
  assert.deepStrictEqual(
    lines[1].runs.map(r => r.x),
    [0, 90],
  );
  assert.strictEqual(lines[2].runs, undefined, "last line");
});

it("textBoxLines — justified styled words keep their runs", () => {
  const bold = {weight: 700};
  const lineWords = [
    [
      {text: "a ", width: 10, runs: [{text: "a "}]},
      {text: "<b>b</b>", width: 10, runs: [{text: "b", style: bold}]},
    ],
    [{text: "c", width: 10}],
  ];
  const {lines} = textBoxLines(
    datum({tA: "justify", lines: ["a <b>b</b>", "c"], lineWords}),
    100,
    false,
  );
  assert.deepStrictEqual(lines[0].runs, [
    {text: "a ", x: 0},
    {text: "b", style: bold, x: 90},
  ]);
});

it("textBoxFont and textBoxPaint — the box's font and paint", () => {
  assert.deepStrictEqual(textBoxFont(datum(), "end", true), {
    family: "sans-serif",
    size: 10,
    weight: 400,
    anchor: "end",
    baseline: "alphabetic",
    dir: "rtl",
  });
  assert.deepStrictEqual(textBoxPaint(datum()), {fill: "black", opacity: 1});
  assert.deepStrictEqual(textBoxPaint(datum({fStroke: "red", fSW: 2})), {
    fill: "black",
    opacity: 1,
    stroke: "red",
    strokeWidth: 2,
  });
});

it("textBoxNode — positions lines and nudges rotated start text", () => {
  const node = textBoxNode(datum({tA: "justify", r: 90}), [50, 25], false);
  assert.strictEqual(node.type, "text");
  assert.strictEqual(node.font.anchor, "start");
  assert.strictEqual(node.lines[0].x, 2, "2·sin(90°) nudge");
  assert.deepStrictEqual(node.transform, {
    x: 0,
    y: 0,
    rotate: 90,
    rotateAnchor: [50, 25],
  });
  assert.strictEqual(node.interactive, true);
  const quiet = textBoxNode(datum({pE: "none", aH: "true"}), [0, 0], false);
  assert.strictEqual(quiet.interactive, false);
  assert.deepStrictEqual(quiet.aria, {hidden: true});
});

const font = "DejaVu Sans";
// Measured the way TextBox measures: with the family fontExists finds.
const style = {"font-family": fontExists(font), "font-size": 14};

it("TextBox justifies every line but the last to the box width", () => {
  const box = new TextBox()
    .data([
      {
        text: "The quick brown fox jumps over the lazy dog and keeps running far away",
      },
    ])
    .fontFamily(font)
    .fontSize(14)
    .width(160)
    .height(300)
    .textAnchor("justify");
  const node = box.toScene().children[0];
  assert.ok(node.lines.length > 2);
  const last = node.lines.length - 1;
  node.lines.forEach((line, i) => {
    if (i === last) {
      assert.strictEqual(
        line.runs,
        undefined,
        "the last line is not justified",
      );
      return;
    }
    const first = line.runs[0];
    const end = line.runs[line.runs.length - 1];
    assert.strictEqual(first.x, 0, "starts at the left edge");
    const right = end.x + textWidth(end.text.trimEnd(), style);
    assert.ok(Math.abs(right - 160) < 0.5, `line ${i} ends at ${right}`);
  });
});

it("TextBox truncateWord draws the start of a word too long for the box", () => {
  const box = new TextBox()
    .data([{text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"}])
    .fontFamily(font)
    .fontSize(14)
    .width(100)
    .height(20);
  assert.strictEqual(box.toScene().children[0].lines[0].text, "");
  box.truncateWord(true);
  const [line] = box.toScene().children[0].lines;
  assert.ok(/^ABC\w*\.\.\.$/.test(line.text), line.text);
  assert.ok(textWidth(line.text, style) <= 100);
  assert.strictEqual(line.width, textWidth(line.text, style));
});

it("TextBox measures the ellipsis so a truncated line fits the box", () => {
  // The first line fits the box exactly, with no room for an ellipsis.
  const width = Math.ceil(textWidth("Fine words", style)) + 1;
  const box = new TextBox()
    .data([{text: "Fine words keep going"}])
    .fontFamily(font)
    .fontSize(14)
    .width(width)
    .height(20);
  const [line] = box.toScene().children[0].lines;
  assert.strictEqual(line.text, "Fine...");
  assert.ok(textWidth(line.text, style) <= width);
});
