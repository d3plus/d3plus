import {it} from "vitest";
import assert from "assert";
import {fitsBox, icicleLabelBox} from "../../src/charts/Icicle/labelFit.ts";
import {icicleLabel} from "../../src/charts/Icicle/emit.ts";

// Two words, 4 and 6 units wide at 1px, with a 1-unit space.
const metrics = {words: [4, 6], space: 1};

it("Icicle labelFit: fitsBox wraps between words within the line limit", () => {
  // 11px line at 1px font plus 2px padding each side.
  assert.strictEqual(fitsBox(metrics, 1, 15, 10), true);
  assert.strictEqual(
    fitsBox(metrics, 2, 15, 30),
    false,
    "a word wider than the line",
  );
  assert.strictEqual(
    fitsBox(metrics, 2, 18, 8),
    false,
    "two lines don't fit 8px",
  );
  assert.strictEqual(fitsBox(metrics, 2, 18, 20), true, "wrapped to two lines");
  assert.strictEqual(fitsBox(metrics, 2, 18, 30, {maxLines: 1}), false);
  assert.strictEqual(
    fitsBox(metrics, 1, 4, 30),
    false,
    "no room inside the padding",
  );
});

it("Icicle labelFit: icicleLabelBox keeps the label upright when it fits best that way", () => {
  const box = icicleLabelBox({x: 10, y: 20, width: 200, height: 40}, metrics);
  assert.strictEqual(box.orientation, "upright");
  assert.deepStrictEqual(
    [box.x, box.y, box.width, box.height, box.rotate],
    [110, 40, 200, 40, 0],
  );
  assert.ok(box.fontSize >= 8 && box.fontSize <= 24);
});

it("Icicle labelFit: icicleLabelBox turns the label up a tall, narrow rectangle", () => {
  const box = icicleLabelBox({x: 0, y: 0, width: 20, height: 200}, metrics);
  assert.strictEqual(box.orientation, "rotated");
  assert.strictEqual(box.rotate, -90);
  assert.deepStrictEqual(
    [box.width, box.height],
    [200, 20],
    "the box turns with the text",
  );
  assert.deepStrictEqual([box.x, box.y], [10, 100]);
});

it("Icicle labelFit: icicleLabelBox returns null without room or words", () => {
  assert.strictEqual(
    icicleLabelBox({x: 0, y: 0, width: 30, height: 5}, metrics),
    null,
  );
  assert.strictEqual(
    icicleLabelBox({x: 0, y: 0, width: 0, height: 50}, metrics),
    null,
  );
  assert.strictEqual(
    icicleLabelBox({x: 0, y: 0, width: 200, height: 50}, {words: [], space: 0}),
    null,
  );
  const fontMin = icicleLabelBox(
    {x: 0, y: 0, width: 200, height: 40},
    metrics,
    {fontMin: 30, fontMax: 40},
  );
  assert.strictEqual(fontMin, null, "no fit at fontMin");
});

it("Icicle emit: icicleLabel reads the label at the node's own level", () => {
  const viz = {_drawLabel: (d, i, level) => `${d.name}#${i}@${level}`};
  assert.strictEqual(
    icicleLabel(viz, {datum: {name: "A"}, i: 3, level: 1}),
    "A#3@1",
  );
  assert.strictEqual(
    icicleLabel(viz, {datum: {name: "B"}, i: undefined, level: 0}),
    "B#0@0",
  );
});
