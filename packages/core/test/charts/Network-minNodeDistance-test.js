import {it} from "vitest";
import assert from "assert";
import {max, merge, min} from "d3-array";

import {pointDistance} from "@d3plus/math";
import {minNodeDistance} from "../../src/charts/Network/minNodeDistance.ts";

/**
    `minNodeDistance` gives the same minimum as every pairwise distance
    (the n × n array Network's radius fit took the minimum of).
*/

const reference = nodes =>
  min(
    merge(
      nodes.map(n1 =>
        nodes.map(n2 =>
          n1 === n2
            ? null
            : pointDistance([n1.x ?? 0, n1.y ?? 0], [n2.x ?? 0, n2.y ?? 0]),
        ),
      ),
    ),
  );

/** The radius cap Network derives from it. */
const cap = d => max([1, d / 2]);

const seeded = seed => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const same = (nodes, label) => {
  const expected = reference(nodes);
  const actual = minNodeDistance(nodes);
  assert.ok(Object.is(actual, expected), `${label}: ${actual} !== ${expected}`);
  assert.ok(Object.is(cap(actual), cap(expected)), `${label}: cap`);
};

it("minNodeDistance: matches every pairwise distance on random layouts", () => {
  const random = seeded(7);
  for (let trial = 0; trial < 200; trial++) {
    const n = 2 + Math.floor(random() * 120);
    const spread = [1, 50, 1200, 1e6][trial % 4];
    const nodes = Array.from({length: n}, () => ({
      x: random() * spread,
      y: random() * spread,
    }));
    same(nodes, `trial ${trial}`);
  }
});

it("minNodeDistance: matches on grids, clusters, and coincident nodes", () => {
  const random = seeded(11);
  const grid = [];
  for (let i = 0; i < 20; i++)
    for (let j = 0; j < 20; j++) grid.push({x: i * 7.3, y: j * 7.3});
  same(grid, "grid");
  same(
    Array.from({length: 50}, (_, i) => ({x: 5, y: i * 3})),
    "vertical line",
  );
  same(
    Array.from({length: 50}, (_, i) => ({x: i * 0.1, y: 4})),
    "horizontal line",
  );
  const clusters = Array.from({length: 300}, (_, i) => ({
    x: (i % 3) * 400 + random() * 2,
    y: Math.floor(i / 100) * 300 + random() * 2,
  }));
  same(clusters, "clusters");
  same(
    [
      {x: 1, y: 1},
      {x: 1, y: 1},
      {x: 9, y: 9},
    ],
    "coincident",
  );
  same(
    [
      {x: -3.5, y: 2},
      {x: -0, y: 0},
      {x: 0, y: -0},
    ],
    "signed zeros",
  );
});

it("minNodeDistance: matches on degenerate input", () => {
  same([], "empty");
  same([{x: 3, y: 4}], "one node");
  const a = {x: 1, y: 2};
  same([a, a], "one node listed twice");
  same([a, a, {x: 4, y: 6}], "a repeat and another node");
  same([{}, {x: 3, y: 4}, {x: undefined, y: null}], "missing coordinates");
  same(
    [
      {x: NaN, y: 1},
      {x: 2, y: 2},
      {x: 5, y: 6},
    ],
    "NaN",
  );
  same(
    [
      {x: NaN, y: 1},
      {x: 2, y: 2},
    ],
    "NaN leaves one pair-less node",
  );
  same(
    [
      {x: Infinity, y: 1},
      {x: 2, y: 2},
    ],
    "one infinite node",
  );
  same(
    [
      {x: Infinity, y: 1},
      {x: -Infinity, y: 1},
      {x: 2, y: 2},
    ],
    "infinite nodes",
  );
  same(
    [
      {x: Infinity, y: 1},
      {x: 2, y: 2},
      {x: 3, y: 2},
    ],
    "an infinite node and a finite pair",
  );
  same(
    [
      {x: 1e200, y: 0},
      {x: -1e200, y: 0},
    ],
    "overflowing distance",
  );
});
