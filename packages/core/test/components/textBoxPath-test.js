import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {TextBox} from "../../index.ts";
import {ownBoxes, textLineBoxes} from "../../internal.ts";
import {
  hitboxPadding,
  resolveOffset,
  textBoxPath,
  textBoxRoom,
} from "../../src/components/textBoxPath.ts";
import {
  textBoxHitbox,
  textBoxNode,
  textBoxNodes,
} from "../../src/components/textBoxScene.ts";

useJsdom();

const sides = (top, right, bottom, left) => ({top, right, bottom, left});

it("resolveOffset — pixels or a percentage of the path, clamped", () => {
  assert.strictEqual(resolveOffset(30, 200), 30);
  assert.strictEqual(resolveOffset("25%", 200), 50);
  assert.strictEqual(resolveOffset("40", 200), 40);
  assert.strictEqual(resolveOffset(500, 200), 200);
  assert.strictEqual(resolveOffset(-5, 200), 0);
  assert.strictEqual(resolveOffset("nope", 200), 0);
  assert.strictEqual(resolveOffset(undefined, 200), 0);
});

it("textBoxPath — the datum's path, side, and offset", () => {
  const box = new TextBox()
    .textPath(d => d.path)
    .startOffset("50%")
    .side(d => d.side);
  assert.deepStrictEqual(textBoxPath(box, {path: "M0,0 L100,0"}, 0), {
    d: "M0,0 L100,0",
    side: "left",
    offset: 50,
    length: 100,
  });
  assert.strictEqual(
    textBoxPath(box, {path: "M0,0 L100,0", side: "right"}, 0).side,
    "right",
  );
  assert.strictEqual(textBoxPath(box, {path: false}, 0), null);
  assert.strictEqual(textBoxPath(box, {path: "  "}, 0), null);
  assert.strictEqual(textBoxPath(box, {path: "M5,5"}, 0), null, "no length");
});

it("textBoxRoom — the padded box, or the path past its offset", () => {
  const box = new TextBox().width(200).height(100);
  const pad = sides(5, 10, 5, 10);
  assert.deepStrictEqual(textBoxRoom(box, {}, 0, pad, null, 12), {
    w: 180,
    h: 90,
  });
  const path = {d: "M0,0 L300,0", side: "left", offset: 40, length: 300};
  assert.deepStrictEqual(textBoxRoom(box, {}, 0, pad, path, 12), {
    w: 260,
    h: 90,
  });
  const short = new TextBox().height(10);
  assert.strictEqual(textBoxRoom(short, {}, 0, pad, path, 12).h, 13);
});

it("hitboxPadding — none, zero, or the configured padding", () => {
  assert.strictEqual(hitboxPadding(false), null);
  assert.strictEqual(hitboxPadding(undefined), null);
  assert.deepStrictEqual(hitboxPadding(true), sides(0, 0, 0, 0));
  assert.deepStrictEqual(hitboxPadding({padding: 4}), sides(4, 4, 4, 4));
  assert.deepStrictEqual(hitboxPadding({padding: "2 6"}), sides(2, 6, 2, 6));
  assert.deepStrictEqual(hitboxPadding({}), sides(0, 0, 0, 0));
});

const datum = overrides => ({
  aH: "false",
  data: {id: "a"},
  i: 0,
  id: "a",
  lines: ["one two"],
  lineRuns: null,
  lineWords: null,
  hardBreaks: [false],
  widths: [40],
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
  x: 15,
  y: 24,
  path: null,
  pad: sides(5, 5, 5, 5),
  yP: 9,
  hit: null,
  ...overrides,
});

it("textBoxHitbox — a transparent rect over the padded box", () => {
  assert.strictEqual(textBoxHitbox(datum(), [0, 0]), null);
  const rect = textBoxHitbox(datum({hit: sides(1, 2, 3, 4)}), [50, 25]);
  assert.deepStrictEqual(rect, {
    type: "rect",
    key: "a::hit",
    datum: {id: "a"},
    index: 0,
    x: -5 - 4,
    y: -(9 + 5) - 1,
    width: 110 + 4 + 2,
    height: 60 + 1 + 3,
    paint: {fill: "transparent"},
    transform: {x: 15, y: 24, rotate: 0, rotateAnchor: [50, 25]},
    aria: {hidden: true},
    interactive: true,
  });
  assert.strictEqual(
    textBoxHitbox(datum({hit: sides(0, 0, 0, 0), pE: "none"}), [0, 0])
      .interactive,
    false,
  );
});

it("textBoxHitbox — text on a path covers the path's bounds and a font size", () => {
  const rect = textBoxHitbox(
    datum({
      hit: sides(0, 0, 0, 0),
      path: {d: "M10,40 L110,20", side: "left", offset: 0},
    }),
    [0, 0],
  );
  assert.deepStrictEqual(
    [rect.x, rect.y, rect.width, rect.height],
    [0, 10, 120, 40],
  );
});

it("textBoxNode — text on a path carries it, its lines at their offset", () => {
  const node = textBoxNode(
    datum({tA: "middle", path: {d: "M0,0 L200,0", side: "right", offset: 20}}),
    [0, 0],
    false,
  );
  assert.deepStrictEqual(node.path, {d: "M0,0 L200,0", side: "right"});
  assert.strictEqual(node.font.anchor, "middle");
  assert.deepStrictEqual(
    [node.lines[0].x, node.lines[0].y],
    [70, 0],
    "centered in the 100px past the offset",
  );
  assert.strictEqual(textBoxNode(datum(), [0, 0], false).path, undefined);
});

it("textBoxNodes — the hitbox goes behind the text", () => {
  assert.deepStrictEqual(
    textBoxNodes(datum(), [0, 0], false).map(n => n.type),
    ["text"],
  );
  assert.deepStrictEqual(
    textBoxNodes(datum({hit: sides(0, 0, 0, 0)}), [0, 0], false).map(
      n => n.key,
    ),
    ["a::hit", "a"],
  );
});

const font = "DejaVu Sans";
const sentence =
  "This sentence is much too long for the short path it has to follow";

it("TextBox wraps path text to the path's length as one line", () => {
  const node = new TextBox()
    .data([{text: sentence}])
    .fontFamily(font)
    .fontSize(14)
    .textPath("M0,50 L160,50")
    .startOffset(20)
    .x(10)
    .y(5)
    .toScene().children[0];
  assert.strictEqual(node.lines.length, 1);
  assert.ok(node.lines[0].text.endsWith("..."), node.lines[0].text);
  assert.ok(node.lines[0].width <= 140, `${node.lines[0].width} fits`);
  assert.strictEqual(node.lines[0].x, 20, "start-aligned at the offset");
  assert.deepStrictEqual(node.path, {d: "M0,50 L160,50", side: "left"});
  // Path coordinates are relative to the box's x and y.
  assert.strictEqual(node.transform.x, 10);
  assert.strictEqual(node.transform.y, 5);
});

it("TextBox path text: justify reads as start, a percentage places it along", () => {
  const draw = textAnchor =>
    new TextBox()
      .data([{text: "short"}])
      .fontFamily(font)
      .fontSize(14)
      .textPath("M0,0 L300,0")
      .textAnchor(textAnchor)
      .toScene().children[0];
  const start = draw("start").lines[0];
  assert.strictEqual(draw("justify").lines[0].x, start.x);
  assert.strictEqual(draw("justify").font.anchor, "start");
  const quarter = draw("25%").lines[0];
  assert.ok(Math.abs(quarter.x - 0.25 * (300 - quarter.width)) < 1e-9);
});

it("textLineBoxes and ownBoxes follow text on a path", () => {
  const node = new TextBox()
    .data([{text: "along"}])
    .fontFamily(font)
    .fontSize(10)
    .textPath("M0,0 L0,200")
    .x(100)
    .toScene().children[0];
  const boxes = textLineBoxes([node]);
  assert.ok(boxes.length >= 2);
  for (const box of boxes) {
    // A downward path turns the text 90°; it sits to the path's left (+x).
    assert.strictEqual(box.angle, 90);
    assert.ok(Math.abs(box.x - 103) < 1e-9, `x ${box.x}`);
  }
  const own = ownBoxes(node);
  assert.strictEqual(own.length, boxes.length);
  assert.ok(
    own.every(b => Math.abs(b.width - 10) < 1e-9 && Math.abs(b.x + 2) < 1e-9),
  );
});
