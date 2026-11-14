import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Tree} from "../../index.ts";
import {
  emitSpokeLabels,
  fitSpokeFont,
  polarPoint,
  radialFit,
  shrinkToWord,
  SPOKE_LABEL_FONT_MIN,
  SPOKE_LABEL_LINES,
  SPOKE_LABEL_PADDING,
  spokeFlipped,
  spokeLines,
  spokePlacement,
  widestWord,
} from "../../internal.ts";

useJsdom();

/**
    Labels along the spokes of a circular layout: placed from the center
    outward or inward, turned along the spoke, and flipped upright on the
    left half.
*/

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

it("polarPoint: angles run clockwise from 12 o'clock", () => {
  const at = angle => polarPoint(100, 50, angle, 10);
  const [x0, y0] = at(0);
  close(x0, 100, "12 o'clock x");
  close(y0, 40, "12 o'clock y");
  const [x1, y1] = at(Math.PI / 2);
  close(x1, 110, "3 o'clock x");
  close(y1, 50, "3 o'clock y");
  const [x2, y2] = at(Math.PI);
  close(x2, 100, "6 o'clock x");
  close(y2, 60, "6 o'clock y");
});

it("spokeFlipped: only the left half, strictly between 6 and 12 o'clock", () => {
  assert.strictEqual(spokeFlipped(0), false);
  assert.strictEqual(spokeFlipped(Math.PI / 2), false);
  assert.strictEqual(spokeFlipped(Math.PI), false);
  assert.strictEqual(spokeFlipped(Math.PI * 1.5), true);
  assert.strictEqual(spokeFlipped(-Math.PI / 2), true, "wraps negative angles");
  assert.strictEqual(spokeFlipped(Math.PI * 2.5), false, "wraps past a turn");
});

it("spokePlacement: an outward label on the right half starts at its point", () => {
  const p = spokePlacement(0, 0, Math.PI / 2, 20, 50, 12);
  close(p.x, 20, "x");
  close(p.y, 0, "y");
  close(p.rotate, 0, "3 o'clock reads left to right");
  assert.deepStrictEqual(p.box, {x: 0, y: -6, width: 50, height: 12});
  assert.strictEqual(p.anchor, "start");
});

it("spokePlacement: an outward label on the left half flips and ends at its point", () => {
  const p = spokePlacement(0, 0, Math.PI * 1.5, 20, 50, 12);
  close(p.x, -20, "x");
  close(p.y, 0, "y");
  close(p.rotate, 360, "9 o'clock turns a full half and flips back upright");
  assert.deepStrictEqual(p.box, {x: -50, y: -6, width: 50, height: 12});
  assert.strictEqual(p.anchor, "end");
});

it("spokePlacement: an inward label runs back toward the center", () => {
  const right = spokePlacement(0, 0, Math.PI / 2, 20, 15, 12, true);
  assert.deepStrictEqual(right.box, {x: -15, y: -6, width: 15, height: 12});
  assert.strictEqual(right.anchor, "end");
  const left = spokePlacement(0, 0, Math.PI * 1.5, 20, 15, 12, true);
  assert.deepStrictEqual(left.box, {x: 0, y: -6, width: 15, height: 12});
  assert.strictEqual(left.anchor, "start");
  close(
    spokePlacement(0, 0, 0, 20, 15, 12).rotate,
    -90,
    "12 o'clock reads upward",
  );
});

it("radialFit: labels come off the radius, down to half the room", () => {
  const pad = SPOKE_LABEL_PADDING;
  assert.deepStrictEqual(radialFit(200, 40, 5), {
    radius: 200 - 40 - pad - 5,
    labelWidth: 40,
  });
  const long = radialFit(200, 300, 5);
  assert.strictEqual(long.radius, 100, "the circle keeps half the room");
  assert.strictEqual(long.labelWidth, 200 - 100 - 5 - pad);
  assert.deepStrictEqual(radialFit(200, 0, 5), {radius: 195, labelWidth: 0});
  assert.deepStrictEqual(radialFit(-10, 20, 5), {radius: 0, labelWidth: 0});
});

it("spokeLines: as many lines as fit across the gap, from 1 to the cap", () => {
  assert.strictEqual(spokeLines(0, 100, 12), 1, "no gap still takes a line");
  assert.strictEqual(spokeLines(0.25, 100, 12), 2);
  assert.strictEqual(spokeLines(Math.PI, 100, 12), SPOKE_LABEL_LINES);
  assert.strictEqual(spokeLines(1, -5, 12), 1, "a negative distance");
});

it("shrinkToWord: shrinks until the widest word fits, down to the minimum", () => {
  const font = {size: 10, family: "sans-serif"};
  assert.strictEqual(shrinkToWord("a b", font, 500), 10, "fits as it is");
  const narrow = shrinkToWord("Northern Africa", font, 30);
  assert.ok(narrow < 10 && narrow >= SPOKE_LABEL_FONT_MIN, `${narrow}`);
  assert.strictEqual(
    shrinkToWord("Supercalifragilistic", font, 5),
    SPOKE_LABEL_FONT_MIN,
  );
  assert.strictEqual(shrinkToWord("", font, 5), 10, "no words");
  assert.strictEqual(
    shrinkToWord("Supercalifragilistic", {size: 6}, 5),
    6,
    "never grows a font under the minimum",
  );
});

it("widestWord: the widest word's measured width", () => {
  const font = {size: 10, family: "sans-serif"};
  assert.ok(widestWord("a bbbbbbbb c", font) > widestWord("a b c", font));
  assert.strictEqual(widestWord("", font), 0);
  assert.strictEqual(widestWord("  ", font), 0);
});

it("emitSpokeLabels: one rotated text node per label, haloed on request", () => {
  const viz = new Tree();
  const labels = [
    {
      ...spokePlacement(0, 0, Math.PI / 2, 20, 80, 14),
      id: "a",
      text: "Alpha",
      datum: {id: "a"},
    },
    {
      ...spokePlacement(0, 0, Math.PI * 1.5, 20, 80, 14),
      id: "b",
      text: "Beta",
      datum: {id: "b"},
      fontSize: 9,
    },
  ];
  const plain = emitSpokeLabels(viz, labels, {fontSize: 11});
  const flat = list =>
    list.flatMap(n => (n.type === "group" ? flat(n.children) : [n]));
  const texts = flat(plain).filter(n => n.type === "text");
  assert.deepStrictEqual(
    texts.map(n => n.lines.map(l => l.text).join(" ")),
    ["Alpha", "Beta"],
  );
  assert.deepStrictEqual(
    texts.map(n => n.fontSize ?? n.font?.size),
    [11, 9],
    "a label's own size wins",
  );
  assert.ok(texts.every(n => !n.halo));
  const haloed = flat(emitSpokeLabels(viz, labels, {fontSize: 11, halo: true}));
  assert.ok(haloed.filter(n => n.type === "text").every(n => n.halo));
  assert.deepStrictEqual(emitSpokeLabels(viz, [], {fontSize: 11}), []);
});

it("shrinkToWord: a shrunk word measures within the width", () => {
  const font = {size: 10, family: "sans-serif"};
  for (const width of [30, 34, 41, 47]) {
    const size = shrinkToWord("Northern Europe", font, width);
    if (size > SPOKE_LABEL_FONT_MIN)
      assert.ok(
        widestWord("Northern Europe", {...font, size}) <= width,
        `${width}: ${size}`,
      );
  }
});

it("fitSpokeFont: the largest size the whole text wraps into, or none", () => {
  const font = {size: 10, family: "sans-serif"};
  assert.strictEqual(fitSpokeFont("Alpha", font, 200, 13), 10, "fits as it is");
  const two = fitSpokeFont("Northern Europe", font, 50, 26);
  assert.ok(two !== null && two <= 10, `two lines: ${two}`);
  const shrunk = fitSpokeFont("Northern Europe", font, 40, 13);
  assert.ok(
    shrunk === null || shrunk < 10,
    `one short line shrinks or drops: ${shrunk}`,
  );
  assert.strictEqual(
    fitSpokeFont("Supercalifragilistic expialidocious", font, 20, 13),
    null,
    "left out rather than cut to an ellipsis",
  );
  assert.strictEqual(fitSpokeFont("tiny", {size: 6}, 200, 13), 6);
});
