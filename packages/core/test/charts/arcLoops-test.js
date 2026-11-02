import {it} from "vitest";
import assert from "assert";

import {
  arcLoopReach,
  arcLoopRoom,
  crossLayout,
  loopAngle,
  loopSide,
  placeLoops,
  selfLoopReach,
} from "../../internal.ts";

it("loopSide puts loops on the arcs' side of the line", () => {
  assert.strictEqual(loopSide("above"), "above");
  assert.strictEqual(loopSide("both"), "above");
  assert.strictEqual(loopSide("below"), "below");
});

it("loopAngle points loops straight out from the line", () => {
  assert.strictEqual(loopAngle("above", "horizontal"), -Math.PI / 2);
  assert.strictEqual(loopAngle("below", "horizontal"), Math.PI / 2);
  assert.strictEqual(loopAngle("above", "vertical"), 0);
  assert.strictEqual(loopAngle("below", "vertical"), Math.PI);
});

it("arcLoopReach is a Network loop's reach, at least 30% of the spacing up to 40px", () => {
  assert.strictEqual(arcLoopReach(5, 1, 10), selfLoopReach(5, 1));
  assert.strictEqual(arcLoopReach(5, 1, 100), 30);
  assert.strictEqual(arcLoopReach(5, 1, 1000), 40);
  assert.strictEqual(arcLoopReach(40, 1, 1000), selfLoopReach(40, 1));
});

it("arcLoopRoom is how far the loops reach from the line, on their side", () => {
  const radii = new Map([
    ["a", 5],
    ["b", 8],
  ]);
  const loops = [
    {id: "a", size: 2},
    {id: "b", size: 1},
  ];
  const room = Math.max(
    5 + arcLoopReach(5, 2, 100) + 1,
    8 + arcLoopReach(8, 1, 100) + 0.5,
  );
  assert.deepStrictEqual(arcLoopRoom(loops, radii, 100, "both"), {
    above: room,
    below: 0,
  });
  assert.deepStrictEqual(arcLoopRoom(loops, radii, 100, "below"), {
    above: 0,
    below: room,
  });
  assert.deepStrictEqual(arcLoopRoom([], radii, 100, "above"), {
    above: 0,
    below: 0,
  });
});

it("placeLoops draws each loop on its node, out from the line", () => {
  const node = (id, x) => ({id, x, y: 100, r: 5});
  const nodes = [node("a", 50), node("b", 150)];
  const datum = {};
  const loops = [
    {index: 3, datum, size: 2, id: "a"},
    {index: 4, datum, size: 1, id: "a"},
    {index: 5, datum, size: 1, id: "gone"},
  ];
  const geometry = {
    base: 100,
    scale: 1,
    orient: "horizontal",
    side: "above",
    spacing: 100,
  };
  const out = placeLoops(loops, nodes, geometry);
  assert.deepStrictEqual(
    out.map(l => l.index),
    [3, 4],
    "a loop on a missing node draws nothing",
  );
  for (const l of out) {
    assert.strictEqual(l.source, nodes[0]);
    assert.strictEqual(l.target, nodes[0]);
    assert.strictEqual(l.d, l.loop.d);
    assert.strictEqual(l.arc.from, 50);
    assert.strictEqual(l.arc.to, 50);
    assert.strictEqual("spacing" in l.arc, false);
    assert.ok(l.loop.apex.y < 100 - 5, "above the line");
  }
  // The two loops lean to either side of straight up.
  const [a0, a1] = out.map(l => l.loop.angle + Math.PI / 2);
  assert.ok(Math.abs(a0 + a1) < 1e-9 && Math.abs(a0) > 0.1);
  const below = placeLoops(loops.slice(0, 1), nodes, {
    ...geometry,
    side: "below",
  });
  assert.ok(below[0].loop.apex.y > 105, "below the line");
});

it("crossLayout leaves room for loops on their side of the line", () => {
  const base = {
    cross: 400,
    spans: {above: 100, below: 0},
    labelSide: "below",
    labelBand: 30,
    rMax: 5,
    strokePad: 2,
    orient: "horizontal",
  };
  const plain = crossLayout(base);
  const looped = crossLayout({...base, loops: {above: 120, below: 0}});
  assert.strictEqual(looped.scale, plain.scale);
  // The arcs rise 50px; the loops' 120px push the line down.
  assert.ok(looped.base > plain.base);
  assert.ok(looped.base - 120 >= 0);
});
