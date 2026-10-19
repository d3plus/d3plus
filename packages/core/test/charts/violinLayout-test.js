import assert from "assert";
import {
  categoryStep,
  violinEdges,
  violinOutline,
  violinSlots,
} from "../../es/src/charts/Violin/violinLayout.js";
import {innerSet} from "../../es/src/charts/Violin/inner.js";
import {ridgelinePadding, ridgeOverlap} from "../../es/src/charts/Ridgeline/emit.js";

it("categoryStep: matches a d3 point scale's step", () => {
  assert.strictEqual(categoryStep(600, 3, 0.5), 200);
  assert.strictEqual(categoryStep(600, 4, 0), 200);
  assert.strictEqual(categoryStep(-600, 3, 0.5), 200, "reversed range");
  assert.strictEqual(categoryStep(400, 1, 0.5), 400, "one category fills the range");
  assert.strictEqual(categoryStep(400, 1, 0), 400, "never divides by less than 1");
  assert.strictEqual(categoryStep(500, 5, 1.5), 500 / 7, "wider padding");
});

const position = c => ({a: 100, b: 300, c: 500})[c];

it("violinSlots: one violin fills its band less the gap", () => {
  const slots = violinSlots(["a", "b", "c"], {position, step: 200, gap: 20, split: false});
  assert.deepStrictEqual(slots, [
    {center: 100, half: 90, side: "both"},
    {center: 300, half: 90, side: "both"},
    {center: 500, half: 90, side: "both"},
  ]);
});

it("violinSlots: ignores a gap wider than the band", () => {
  const [slot] = violinSlots(["a"], {position, step: 10, gap: 20, split: false});
  assert.strictEqual(slot.half, 5);
});

it("violinSlots: violins sharing a category sit side by side", () => {
  const slots = violinSlots(["a", "a", "b"], {position, step: 200, gap: 0, split: false});
  assert.strictEqual(slots[0].center, 50);
  assert.strictEqual(slots[1].center, 150);
  assert.strictEqual(slots[0].side, "both");
  assert.ok(slots[0].half < 50 && slots[0].half > 45, "a small gap between neighbors");
  assert.strictEqual(slots[0].center + slots[0].half <= slots[1].center - slots[1].half, true, "no overlap");
  assert.deepStrictEqual(slots[2], {center: 300, half: 100, side: "both"});
});

it("violinSlots: split draws exactly two violins as halves of one", () => {
  const slots = violinSlots(["a", "a", "b", "b", "b"], {position, step: 200, gap: 0, split: true});
  assert.deepStrictEqual(slots[0], {center: 100, half: 100, side: "start"});
  assert.deepStrictEqual(slots[1], {center: 100, half: 100, side: "end"});
  assert.ok(slots.slice(2).every(s => s.side === "both"), "three violins can't split");
});

it("violinSlots: keeps the input order for interleaved categories", () => {
  const slots = violinSlots(["a", "b", "a"], {position, step: 200, gap: 0, split: true});
  assert.strictEqual(slots[0].side, "start");
  assert.strictEqual(slots[1].side, "both");
  assert.strictEqual(slots[2].side, "end");
  assert.deepStrictEqual(violinSlots([], {position, step: 200, gap: 0, split: false}), []);
});

it("violinOutline: scales densities into pixel extents", () => {
  const outline = violinOutline([[1, 0], [2, 0.5], [3, 0.25]], 2, 40);
  assert.deepStrictEqual(outline, [
    {value: 1, extent: 0},
    {value: 2, extent: 40},
    {value: 3, extent: 20},
  ]);
  assert.deepStrictEqual(violinOutline([], 1, 10), []);
});

it("violinEdges: both sides, or one half of a split", () => {
  assert.deepStrictEqual(violinEdges({center: 100, half: 50, side: "both"}, 20), [80, 120]);
  assert.deepStrictEqual(violinEdges({center: 100, half: 50, side: "start"}, 20), [80, 100]);
  assert.deepStrictEqual(violinEdges({center: 100, half: 50, side: "end"}, 20), [100, 120]);
});

it("innerSet: reads a single overlay, a list, or nothing", () => {
  assert.deepStrictEqual([...innerSet("box")], ["box"]);
  assert.deepStrictEqual([...innerSet(["points", "quartiles", "nope"])], ["points", "quartiles"]);
  assert.strictEqual(innerSet(false).size, 0);
  assert.strictEqual(innerSet(undefined).size, 0);
});

it("ridgeOverlap: a non-negative number", () => {
  const viz = overlap => ({schema: {overlap}});
  assert.strictEqual(ridgeOverlap(viz(1.5)), 1.5);
  assert.strictEqual(ridgeOverlap(viz("2")), 2);
  assert.strictEqual(ridgeOverlap(viz(-1)), 0);
  assert.strictEqual(ridgeOverlap(viz(NaN)), 0);
  assert.strictEqual(ridgeOverlap(viz(undefined)), 0);
});

it("ridgelinePadding: headroom for the top ridge only", () => {
  assert.deepStrictEqual(ridgelinePadding(1.5), [0.75, 1]);
  assert.deepStrictEqual(ridgelinePadding(1), [0.5, 1]);
  assert.deepStrictEqual(ridgelinePadding(0), [0, 0.5]);
});
