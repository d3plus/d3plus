import {describe, it} from "vitest";
import assert from "assert";

import {
  BoxGrid,
  polylineSegments,
  segmentBox,
  segmentHitsBox,
  slideBox,
  slotOrder,
} from "../../internal.ts";

/**
    The geometry of slid circle labels: a label's box slid along a side of
    its circle, the order slots are tried in, the segments (links) a label
    crosses, and the grid that keeps those tests local.
*/

describe("charts/labelSlots slideBox", () => {
  const box = {x: 100, y: 50, width: 40, height: 14};
  it("leaves a centered or diagonal box where it is", () => {
    assert.strictEqual(slideBox(box, {side: "top", slide: 0}), box);
    assert.strictEqual(slideBox(box, {side: "top-right", slide: 1}), box);
  });
  it("slides a top or bottom box sideways by half its width", () => {
    assert.deepStrictEqual(slideBox(box, {side: "top", slide: -1}), {
      ...box,
      x: 80,
    });
    assert.deepStrictEqual(slideBox(box, {side: "bottom", slide: 0.5}), {
      ...box,
      x: 110,
    });
  });
  it("slides a left or right box up and down by half its height", () => {
    assert.deepStrictEqual(slideBox(box, {side: "right", slide: -1}), {
      ...box,
      y: 43,
    });
    assert.deepStrictEqual(slideBox(box, {side: "left", slide: 1}), {
      ...box,
      y: 57,
    });
  });
});

describe("charts/labelSlots slotOrder", () => {
  it("tries each straight side centered, then slid out to each end", () => {
    assert.deepStrictEqual(slotOrder(["bottom"]), [
      {side: "bottom", slide: 0},
      {side: "bottom", slide: -0.5},
      {side: "bottom", slide: 0.5},
      {side: "bottom", slide: -1},
      {side: "bottom", slide: 1},
    ]);
  });
  it("tries a diagonal side once, keeping the sides' order", () => {
    const order = slotOrder(["top-left", "right"]);
    assert.deepStrictEqual(order[0], {side: "top-left", slide: 0});
    assert.strictEqual(order.length, 6);
    assert.ok(order.slice(1).every(s => s.side === "right"));
  });
  it("covers every side of a circle in 24 slots", () => {
    const sides = [
      "right",
      "left",
      "top",
      "bottom",
      "top-right",
      "top-left",
      "bottom-right",
      "bottom-left",
    ];
    assert.strictEqual(slotOrder(sides).length, 24);
  });
});

describe("charts/labelSlots segmentHitsBox", () => {
  const box = {x: 10, y: 10, width: 20, height: 10};
  it("hits a segment crossing the box", () => {
    assert.ok(segmentHitsBox({x1: 0, y1: 15, x2: 40, y2: 15}, box));
    assert.ok(segmentHitsBox({x1: 0, y1: 0, x2: 40, y2: 30}, box));
  });
  it("hits a segment that starts or ends inside the box", () => {
    assert.ok(segmentHitsBox({x1: 15, y1: 15, x2: 15, y2: 100}, box));
    assert.ok(segmentHitsBox({x1: 20, y1: 12, x2: 22, y2: 14}, box));
  });
  it("misses a segment beside the box, or one whose line crosses it further on", () => {
    assert.ok(!segmentHitsBox({x1: 0, y1: 0, x2: 40, y2: 0}, box));
    assert.ok(!segmentHitsBox({x1: 0, y1: 0, x2: 5, y2: 5}, box));
    assert.ok(!segmentHitsBox({x1: 35, y1: 0, x2: 35, y2: 30}, box));
  });
});

describe("charts/labelSlots polylineSegments", () => {
  it("splits a polyline into its segments", () => {
    assert.deepStrictEqual(
      polylineSegments([
        [0, 0],
        [10, 0],
        [10, 5],
      ]),
      [
        {x1: 0, y1: 0, x2: 10, y2: 0},
        {x1: 10, y1: 0, x2: 10, y2: 5},
      ],
    );
  });
  it("drops segments with a point off the plane, and a lone point", () => {
    assert.deepStrictEqual(
      polylineSegments([
        [0, 0],
        [NaN, 3],
        [4, 4],
      ]),
      [],
    );
    assert.deepStrictEqual(polylineSegments([[1, 1]]), []);
  });
});

describe("charts/labelSlots segmentBox", () => {
  it("bounds a segment running either way", () => {
    assert.deepStrictEqual(segmentBox({x1: 10, y1: 2, x2: 4, y2: 8}), {
      x: 4,
      y: 2,
      width: 6,
      height: 6,
    });
  });
});

describe("charts/boxGrid BoxGrid", () => {
  it("finds the items near a box, once each", () => {
    const grid = new BoxGrid(10);
    const wide = {x: 0, y: 0, width: 35, height: 5};
    grid.add(wide, "wide");
    grid.add({x: 100, y: 100, width: 5, height: 5}, "far");
    assert.deepStrictEqual(
      [...grid.near({x: 12, y: 0, width: 25, height: 2})],
      ["wide"],
    );
    assert.deepStrictEqual(
      [...grid.near({x: 50, y: 50, width: 2, height: 2})],
      [],
    );
  });
  it("takes an item back out", () => {
    const grid = new BoxGrid(10);
    const box = {x: 0, y: 0, width: 25, height: 25};
    grid.add(box, "a");
    grid.add(box, "b");
    grid.remove(box, "a");
    assert.deepStrictEqual([...grid.near(box)], ["b"]);
  });
});
