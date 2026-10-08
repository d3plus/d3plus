import assert from "assert";
import {default as negativeSpace} from "../es/src/negativeSpace.js";

const bounds = {x: 0, y: 0, width: 100, height: 100};
const overlaps = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

it("negativeSpace", () => {
  assert.deepStrictEqual(negativeSpace(bounds, []), [bounds], "no obstacles returns the bounds");
  assert.deepStrictEqual(negativeSpace({x: 0, y: 0, width: 0, height: 10}, []), [], "empty bounds");

  // A single obstacle in the top-left leaves an L-shaped space: the two
  // maximal strips beside and below it.
  const tl = negativeSpace(bounds, [{x: 0, y: 0, width: 40, height: 40}]);
  assert.strictEqual(tl.length, 2, "two maximal boxes around a corner obstacle");
  assert.deepStrictEqual(tl[0], {x: 40, y: 0, width: 60, height: 100}, "largest first");
  assert.deepStrictEqual(tl[1], {x: 0, y: 40, width: 100, height: 60});

  // Marks in the top half and bottom-left: the bottom-right stays open.
  const marks = [
    {x: 5, y: 5, width: 10, height: 10},
    {x: 80, y: 5, width: 10, height: 10},
    {x: 5, y: 80, width: 10, height: 10},
  ];
  const open = negativeSpace(bounds, marks, {padding: 2});
  assert.ok(open.length, "finds open space");
  const corner = open.find(b => b.x + b.width === 100 && b.y + b.height === 100);
  assert.ok(corner && corner.width > 20 && corner.height > 20, "bottom-right corner is open");
  for (const b of open) for (const m of marks) assert.ok(!overlaps(b, m), "never overlaps a mark");
  for (let i = 1; i < open.length; i++) {
    assert.ok(
      open[i - 1].width * open[i - 1].height >= open[i].width * open[i].height,
      "sorted by area",
    );
  }

  // A ring of points with an empty center: nothing inside the ring's hull.
  const ring = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    ring.push({x: 50 + Math.cos(a) * 30 - 1, y: 50 + Math.sin(a) * 30 - 1, width: 2, height: 2});
  }
  const around = negativeSpace(bounds, ring);
  assert.ok(around.length, "finds space around the ring");
  const center = {x: 45, y: 45, width: 10, height: 10};
  for (const b of around) assert.ok(!overlaps(b, center), "never returns the hole inside the marks");

  assert.deepStrictEqual(negativeSpace(bounds, marks, {padding: 2}), open, "deterministic");
  assert.ok(
    negativeSpace(bounds, marks, {minWidth: 60, minHeight: 60}).every(b => b.width >= 60 && b.height >= 60),
    "minimum size",
  );

  // Excluded boxes are kept clear on their own, not merged into the marks' hull.
  const withControls = negativeSpace(bounds, [{x: 0, y: 0, width: 10, height: 10}], {exclude: [{x: 90, y: 90, width: 10, height: 10}]});
  for (const b of withControls) assert.ok(!overlaps(b, {x: 90, y: 90, width: 10, height: 10}), "never overlaps an excluded box");
  assert.ok(withControls.some(b => b.x === 10 && b.y === 0 && b.width === 90 && b.height === 90), "the space between them stays open");
  assert.ok(negativeSpace(bounds, [], {exclude: [{x: 0, y: 0, width: 100, height: 50}]}).every(b => b.y >= 50), "excludes without marks");
});

it("negativeSpace stays exact and fast around a many-sided hull", () => {
  // The bounding boxes of 120 arcs around a circle hull into a many-sided
  // polygon — the shape a Pie or Sunburst hands the inset legend search.
  const area = {x: 0, y: 0, width: 600, height: 600};
  const arcs = Array.from({length: 120}, (_, i) => {
    const a = (i / 120) * Math.PI * 2;
    return {x: 300 + 220 * Math.cos(a) - 8, y: 300 + 220 * Math.sin(a) - 8, width: 16, height: 16};
  });
  const start = Date.now();
  const rects = negativeSpace(area, arcs, {padding: 4});
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 500, `searched in ${elapsed}ms`);
  assert.ok(rects.length >= 4, "an open box in every corner");
  for (const corner of [{x: 0, y: 0}, {x: 590, y: 0}, {x: 0, y: 590}, {x: 590, y: 590}])
    assert.ok(rects.some(r => overlaps(r, {...corner, width: 10, height: 10})), `corner ${corner.x},${corner.y} is open`);
  for (const r of rects)
    assert.ok(!overlaps(r, {x: 290, y: 290, width: 20, height: 20}), "nothing inside the ring");
});
