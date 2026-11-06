import {it} from "vitest";
import assert from "assert";
import {
  hitPathText,
  pathFont,
  pathGlyphs,
  pathLineStart,
  pathTextBoxes,
  placeGlyphs,
  pointAtLength,
  rotatedBoxBounds,
  samplePath,
  textPathD,
  textPathSamples,
} from "../src/textPath.ts";
import {hitText} from "../src/canvas/canvasHit.ts";
import {textVisualCenter} from "../src/scene.ts";

const close = (a, b, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

// Every character is 10px wide.
const measure = text => [...new Intl.Segmenter().segment(text)].length * 10;

it("samplePath — measures a path's points and length", () => {
  const line = samplePath("M0,0 L30,40 L30,100");
  assert.deepStrictEqual(line.points, [
    [0, 0],
    [30, 40],
    [30, 100],
  ]);
  assert.deepStrictEqual(line.lengths, [0, 50, 110]);
  assert.strictEqual(line.total, 110);
  // A closing Z returns to the start.
  assert.strictEqual(
    samplePath("M0,0 L10,0 L10,10 Z").total,
    10 + 10 + Math.SQRT2 * 10,
  );
  // A half circle of radius 50 is about 50π long.
  close(samplePath("M0,50 A50,50 0 0 1 100,50").total, 50 * Math.PI, 0.5);
  assert.strictEqual(
    samplePath("M0,0 L30,40"),
    samplePath("M0,0 L30,40"),
    "cached",
  );
});

it("textPathSamples and textPathD — side: right runs the path backwards", () => {
  const path = {d: "M0,0 L100,0"};
  assert.deepStrictEqual(textPathSamples(path).points, [
    [0, 0],
    [100, 0],
  ]);
  assert.strictEqual(textPathD(path), "M0,0 L100,0");
  const right = {...path, side: "right"};
  assert.deepStrictEqual(textPathSamples(right).points, [
    [100, 0],
    [0, 0],
  ]);
  assert.strictEqual(textPathD(right), "M100,0L0,0");
});

it("pointAtLength — a point and direction along the path, null off it", () => {
  const s = samplePath("M0,0 L100,0 L100,100");
  assert.deepStrictEqual(pointAtLength(s, 50), {x: 50, y: 0, angle: 0});
  const down = pointAtLength(s, 150);
  close(down.x, 100);
  close(down.y, 50);
  close(down.angle, Math.PI / 2);
  assert.strictEqual(pointAtLength(s, -1), null);
  assert.strictEqual(pointAtLength(s, 201), null);
});

it("pathGlyphs — characters in order, with a gap for each space", () => {
  const glyphs = pathGlyphs([{text: "ab cd"}], false, measure);
  assert.deepStrictEqual(
    glyphs.map(g => [g.text, g.advance]),
    [
      ["a", 10],
      ["b", 10],
      ["", 10],
      ["c", 10],
      ["d", 10],
    ],
  );
  assert.ok(glyphs.filter(g => g.text).every(g => g.dir === "ltr"));
});

it("pathGlyphs — keeps emoji whole and joining scripts as whole words", () => {
  const emoji = pathGlyphs([{text: "a👨‍👩‍👧"}], false, measure);
  assert.deepStrictEqual(
    emoji.map(g => g.text),
    ["a", "👨‍👩‍👧"],
  );
  const arabic = pathGlyphs([{text: "مرحبا بكم"}], true, measure);
  // Right to left: the second word is drawn first (leftmost), each whole.
  assert.deepStrictEqual(
    arabic.map(g => g.text),
    ["بكم", "", "مرحبا"],
  );
  assert.strictEqual(arabic[0].dir, "rtl");
});

it("pathGlyphs — right-to-left words reverse, left-to-right runs keep order", () => {
  const glyphs = pathGlyphs([{text: "שלום New York"}], true, measure);
  assert.deepStrictEqual(
    glyphs.filter(g => g.text).map(g => g.text),
    ["N", "e", "w", "Y", "o", "r", "k", "ם", "ו", "ל", "ש"],
  );
});

it("pathGlyphs — keeps each run's font", () => {
  const glyphs = pathGlyphs(
    [
      {text: "a ", font: "normal"},
      {text: "b", font: "bold"},
    ],
    false,
    (text, font) => (font === "bold" ? 20 : 10) * text.length,
  );
  assert.deepStrictEqual(
    glyphs.map(g => [g.text, g.advance, g.font]),
    [
      ["a", 10, "normal"],
      ["", 10, undefined],
      ["b", 20, "bold"],
    ],
  );
});

it("placeGlyphs — each piece at its midpoint on the path, turned to it", () => {
  const s = samplePath("M0,0 L100,0 L100,100");
  const placed = placeGlyphs(s, 85, [
    {text: "a", advance: 10},
    {text: "", advance: 10},
    {text: "b", advance: 10},
    {text: "c", advance: 200},
  ]);
  assert.strictEqual(placed.length, 2, "the piece off the end is left out");
  assert.deepStrictEqual(placed[0], {
    text: "a",
    x: 90,
    y: 0,
    angle: 0,
    font: undefined,
    dir: undefined,
  });
  close(placed[1].x, 100);
  close(placed[1].y, 10);
  close(placed[1].angle, Math.PI / 2);
});

const pathNode = (font = {}, line = {}) => ({
  type: "text",
  key: "t",
  x: 0,
  y: 0,
  font: {size: 10, anchor: "start", ...font},
  lines: [{text: "abcdefghij", x: 20, y: 0, width: 40, ...line}],
  path: {d: "M0,100 L200,100"},
});

it("pathLineStart — the line's left edge along the path", () => {
  assert.strictEqual(pathLineStart(pathNode()).start, 20);
  assert.strictEqual(pathLineStart(pathNode({anchor: "middle"})).start, 0);
  assert.strictEqual(
    pathLineStart(pathNode({anchor: "start", dir: "rtl"})).start,
    -20,
  );
});

it("pathTextBoxes — boxes along the covered stretch, above the path", () => {
  const boxes = pathTextBoxes(pathNode());
  assert.strictEqual(boxes.length, 4, "40px of text in 10px pieces");
  assert.deepStrictEqual(boxes[0], {
    x: 25,
    y: 97,
    width: 10,
    height: 10,
    angle: 0,
  });
  close(boxes[3].x, 55);
  assert.deepStrictEqual(pathTextBoxes({...pathNode(), path: undefined}), []);
});

it("hitPathText, hitText, and textVisualCenter follow the path", () => {
  const node = pathNode();
  assert.ok(hitPathText(node, 40, 96));
  assert.ok(hitText(node, 40, 96));
  assert.ok(!hitText(node, 40, 80), "above the glyphs");
  assert.ok(!hitText(node, 80, 96), "past the line's end");
  assert.ok(!hitText(node, 10, 96), "before its start");
  assert.deepStrictEqual(textVisualCenter(node), [45, 97]);
});

it("rotatedBoxBounds — the axis-aligned box around a turned box", () => {
  assert.deepStrictEqual(
    rotatedBoxBounds({x: 10, y: 10, width: 20, height: 10, angle: 0}),
    {x: 0, y: 5, width: 20, height: 10},
  );
  const turned = rotatedBoxBounds({
    x: 0,
    y: 0,
    width: 20,
    height: 10,
    angle: 90,
  });
  close(turned.width, 10);
  close(turned.height, 20);
});

it("pathFont — a CSS font for the node, or one of its runs", () => {
  const font = {size: 12, family: "Arial", weight: 400};
  assert.strictEqual(pathFont(font), "normal 400 12px Arial");
  assert.strictEqual(
    pathFont(font, {weight: 700, style: "italic"}),
    "italic 700 12px Arial",
  );
});

it("drawText — paints each character at its point on the path, turned", async () => {
  const {drawText} = await import("../src/canvas/canvasDraw.ts");
  const calls = [];
  let frame = {x: 0, y: 0, angle: 0};
  const stack = [];
  const ctx = {
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    direction: "inherit",
    globalAlpha: 1,
    fillStyle: "",
    measureText: text => ({width: measure(text)}),
    save: () => stack.push({...frame}),
    restore: () => (frame = stack.pop()),
    translate: (x, y) => (frame = {...frame, x: frame.x + x, y: frame.y + y}),
    rotate: a => (frame = {...frame, angle: frame.angle + a}),
    fillText(text, x, y) {
      calls.push({
        text,
        x: frame.x + x,
        y: frame.y + y,
        angle: frame.angle,
        align: this.textAlign,
      });
    },
  };
  drawText(
    ctx,
    {
      type: "text",
      key: "t",
      x: 0,
      y: 0,
      font: {size: 10, anchor: "start"},
      paint: {fill: "#000"},
      lines: [{text: "ab c", x: 95, y: 0, width: 40}],
      path: {d: "M0,0 L100,0 L100,100"},
    },
    1,
  );
  assert.deepStrictEqual(
    calls.map(c => [c.text, Math.round(c.x), Math.round(c.y), c.align]),
    [
      ["a", 100, 0, "center"],
      ["b", 100, 10, "center"],
      ["c", 100, 30, "center"],
    ],
  );
  close(calls[1].angle, Math.PI / 2);
  assert.strictEqual(ctx.direction, "inherit", "restores the direction");
});
