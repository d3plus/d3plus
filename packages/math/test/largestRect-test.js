import assert from "assert";
import {default as largestRect} from "../es/src/largestRect.js";

it("geom/largestRect", () => {
  const poly = [
    [40, 0],
    [80, 40],
    [40, 80],
    [0, 40],
    [40, 0],
  ];

  let rect = largestRect(poly);
  assert.strictEqual(
    JSON.stringify([
      [40, 1],
      [79, 40],
      [40, 79],
      [1, 40],
      [40, 1],
    ]),
    JSON.stringify(rect.points.map(d => d.map(Math.round))),
    "default options",
  );

  rect = largestRect(poly, {angle: 0});
  assert.strictEqual(
    JSON.stringify([
      [21, 21],
      [59, 21],
      [59, 59],
      [21, 59],
      [21, 21],
    ]),
    JSON.stringify(rect.points.map(d => d.map(Math.round))),
    "angle option",
  );

  assert.strictEqual(largestRect([[0, 0], [1, 1]]), null, "less than 3 points");
  assert.strictEqual(largestRect([[0, 0], [1, 1]], {verbose: true}), null, "less than 3 points verbose");

  assert.strictEqual(largestRect([[0, 0], [0, 0], [0, 0]]), null, "zero area polygon");

  rect = largestRect(poly, {angle: "45"});
  assert.ok(rect && rect.area > 0, "string angle option");

  rect = largestRect(poly, {aspectRatio: 1});
  assert.ok(rect && rect.area > 0, "fixed aspect ratio");

  rect = largestRect(poly, {aspectRatio: "2"});
  assert.ok(rect && rect.area > 0, "string aspect ratio");

  rect = largestRect(poly, {origin: [40, 40]});
  assert.ok(rect && rect.area > 0, "single origin point");

  rect = largestRect(poly, {origin: [[40, 40], [30, 30]]});
  assert.ok(rect && rect.area > 0, "multiple origin points");

  rect = largestRect(poly, {events: true, cache: false});
  assert.ok(rect && rect.events && rect.events.length > 0, "events tracking");

  rect = largestRect(poly, {cache: false});
  assert.ok(rect && rect.area > 0, "cache disabled");
});

it("geom/largestRect is deterministic", () => {
  // A donut-like ring segment: concave, so the sampled origins matter.
  const ring = [];
  for (let a = 0; a <= 72; a += 6) {
    const r = (a * Math.PI) / 180;
    ring.push([100 * Math.sin(r), -100 * Math.cos(r)]);
  }
  for (let a = 72; a >= 0; a -= 6) {
    const r = (a * Math.PI) / 180;
    ring.push([50 * Math.sin(r), -50 * Math.cos(r)]);
  }

  const random = Math.random;
  Math.random = () => {
    throw new Error("largestRect sampled Math.random");
  };
  let first, second;
  try {
    first = largestRect(ring, {angle: 0, cache: false});
    second = largestRect(ring, {angle: 0, cache: false});
  } finally {
    Math.random = random;
  }
  assert.ok(first && first.area > 0, "finds a rectangle");
  assert.deepStrictEqual(second, first, "the same polygon yields the same rectangle");
});
