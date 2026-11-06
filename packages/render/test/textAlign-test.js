import {it} from "vitest";
import assert from "assert";
import {
  alignLines,
  alignShare,
  anchorSide,
  lineLeft,
  visualOrder,
} from "../src/textAlign.ts";
import {hitText} from "../src/canvas/canvasHit.ts";
import {textVisualCenter} from "../src/scene.ts";

it("anchorSide — start and end flip in right-to-left text", () => {
  assert.strictEqual(anchorSide("start"), "left");
  assert.strictEqual(anchorSide(undefined), "left");
  assert.strictEqual(anchorSide("middle"), "center");
  assert.strictEqual(anchorSide("end"), "right");
  assert.strictEqual(anchorSide("start", "rtl"), "right");
  assert.strictEqual(anchorSide("end", "rtl"), "left");
  assert.strictEqual(anchorSide("middle", "rtl"), "center");
});

it("lineLeft — a line's left edge from its anchor and direction", () => {
  const line = {x: 100, width: 40};
  assert.strictEqual(lineLeft(line, {anchor: "start"}), 100);
  assert.strictEqual(lineLeft(line, {anchor: "middle"}), 80);
  assert.strictEqual(lineLeft(line, {anchor: "end"}), 60);
  assert.strictEqual(lineLeft(line, {anchor: "start", dir: "rtl"}), 60);
  assert.strictEqual(lineLeft(line, {anchor: "end", dir: "rtl"}), 100);
  assert.strictEqual(lineLeft(line), 100);
});

it("alignShare — reads percentages, clamped to 0–1", () => {
  assert.strictEqual(alignShare("25%"), 0.25);
  assert.strictEqual(alignShare(" 12.5 % "), 0.125);
  assert.strictEqual(alignShare("0%"), 0);
  assert.strictEqual(alignShare("150%"), 1);
  assert.strictEqual(alignShare("-10%"), 0);
  assert.strictEqual(alignShare("start"), null);
  assert.strictEqual(alignShare("25"), null);
  assert.strictEqual(alignShare(25), null);
});

it("visualOrder — words run in the line's direction", () => {
  assert.deepStrictEqual(visualOrder(["a ", "b ", "c"], false), [0, 1, 2]);
  assert.deepStrictEqual(visualOrder(["ا ", "ب ", "ت"], true), [2, 1, 0]);
});

it("visualOrder — a run in the other direction keeps its own order", () => {
  // Arabic, "New York", Arabic: the English pair still reads left to right.
  assert.deepStrictEqual(
    visualOrder(["في ", "New ", "York ", "اليوم"], true),
    [3, 1, 2, 0],
  );
  // Hebrew words inside English text read right to left.
  assert.deepStrictEqual(
    visualOrder(["say ", "שלום ", "עולם ", "now"], false),
    [0, 2, 1, 3],
  );
  // A number between two English words joins them; between mixed words it
  // takes the line's direction.
  assert.deepStrictEqual(
    visualOrder(["في ", "Route ", "66 ", "East ", "اليوم"], true),
    [4, 1, 2, 3, 0],
  );
  assert.deepStrictEqual(
    visualOrder(["في ", "Route ", "66 ", "اليوم"], true),
    [3, 2, 1, 0],
  );
});

const lines = [{width: 40}, {width: 60}];

it("alignLines — start, middle, and end", () => {
  assert.deepStrictEqual(alignLines("start", 100, lines), {
    anchor: "start",
    lines: [
      {x: 0, width: 40},
      {x: 0, width: 60},
    ],
  });
  assert.deepStrictEqual(alignLines("middle", 100, lines), {
    anchor: "middle",
    lines: [
      {x: 50, width: 40},
      {x: 50, width: 60},
    ],
  });
  assert.deepStrictEqual(alignLines("end", 100, lines).lines[0], {
    x: 100,
    width: 40,
  });
  assert.strictEqual(alignLines("end", 100, lines).anchor, "end");
  // An unknown alignment reads as start.
  assert.strictEqual(alignLines("left", 100, lines).lines[1].x, 0);
});

it("alignLines — right-to-left start and end", () => {
  assert.strictEqual(alignLines("start", 100, lines, true).lines[0].x, 100);
  assert.strictEqual(alignLines("end", 100, lines, true).lines[0].x, 0);
  assert.strictEqual(alignLines("middle", 100, lines, true).lines[0].x, 50);
});

it("alignLines — a percentage places each line that share across", () => {
  const out = alignLines("25%", 100, lines);
  assert.strictEqual(out.anchor, "start");
  assert.deepStrictEqual(
    out.lines.map(l => l.x),
    [15, 10],
  );
  // 0%, 50%, 100% put each line's left edge where start, middle, end do.
  const left = (align, rtl = false) => {
    const placed = alignLines(align, 100, lines, rtl);
    const font = {anchor: placed.anchor, dir: rtl ? "rtl" : "ltr"};
    return placed.lines.map(l => lineLeft(l, font));
  };
  assert.deepStrictEqual(left("0%"), left("start"));
  assert.deepStrictEqual(left("50%"), left("middle"));
  assert.deepStrictEqual(left("100%"), left("end"));
  assert.deepStrictEqual(left("0%", true), left("start", true));
  assert.deepStrictEqual(left("50%", true), left("middle", true));
  assert.deepStrictEqual(left("100%", true), left("end", true));
});

it("alignLines — percentages follow the writing direction", () => {
  // 25% from the right edge: the line's right edge sits at 100 − 25% × 60.
  const [line] = alignLines("25%", 100, [{width: 40}], true).lines;
  assert.strictEqual(line.x, 85);
  assert.strictEqual(lineLeft(line, {anchor: "start", dir: "rtl"}), 45);
});

const words = [
  {text: "aa ", width: 20},
  {text: "bb ", width: 20},
  {text: "cc", width: 20},
];

it("alignLines — justify spreads a line's words across the box", () => {
  const out = alignLines("justify", 100, [
    {width: 70, words},
    {width: 70, words, paragraphEnd: true},
  ]);
  assert.strictEqual(out.anchor, "start");
  // 40px spare split between two gaps.
  assert.deepStrictEqual(out.lines[0], {x: 0, width: 100, wordX: [0, 40, 80]});
  // A paragraph's last line stays start-aligned.
  assert.deepStrictEqual(out.lines[1], {x: 0, width: 70});
});

it("alignLines — justify places right-to-left words from the right edge", () => {
  const arabic = [
    {text: "في ", width: 20},
    {text: "كل ", width: 20},
    {text: "يوم", width: 20},
  ];
  const out = alignLines("justify", 100, [{width: 70, words: arabic}], true);
  // Each word's x is its right edge (its start in right-to-left text).
  assert.deepStrictEqual(out.lines[0], {
    x: 100,
    width: 100,
    wordX: [100, 60, 20],
  });
  // English words in right-to-left text keep their left-to-right order.
  const english = alignLines("justify", 100, [{width: 70, words}], true);
  assert.deepStrictEqual(english.lines[0].wordX, [20, 60, 100]);
});

it("alignLines — justify leaves single words and overfull lines start-aligned", () => {
  const one = alignLines("justify", 100, [
    {width: 20, words: [{text: "aa", width: 20}]},
  ]);
  assert.deepStrictEqual(one.lines[0], {x: 0, width: 20});
  const over = alignLines("justify", 50, [{width: 70, words}]);
  assert.deepStrictEqual(over.lines[0], {x: 0, width: 70});
  const plain = alignLines("justify", 100, [{width: 70}]);
  assert.deepStrictEqual(plain.lines[0], {x: 0, width: 70});
});

const textNode = (font, lines) => ({
  type: "text",
  key: "t",
  x: 0,
  y: 0,
  font: {size: 10, ...font},
  lines,
});

it("hitText — follows the line's anchor and direction", () => {
  const ltr = textNode({anchor: "start"}, [
    {text: "ab", x: 100, y: 20, width: 40},
  ]);
  assert.ok(hitText(ltr, 120, 15));
  assert.ok(!hitText(ltr, 80, 15));
  const rtl = textNode({anchor: "start", dir: "rtl"}, [
    {text: "ab", x: 100, y: 20, width: 40},
  ]);
  assert.ok(hitText(rtl, 80, 15), "right-to-left start text extends left");
  assert.ok(!hitText(rtl, 120, 15));
});

it("textVisualCenter — follows the line's anchor and direction", () => {
  const lines = [{text: "ab", x: 100, y: 20, width: 40}];
  assert.strictEqual(
    textVisualCenter(textNode({anchor: "start"}, lines))[0],
    120,
  );
  assert.strictEqual(
    textVisualCenter(textNode({anchor: "start", dir: "rtl"}, lines))[0],
    80,
  );
  assert.strictEqual(
    textVisualCenter(textNode({anchor: "middle"}, lines))[0],
    100,
  );
});
