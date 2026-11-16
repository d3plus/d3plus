import {it} from "vitest";
import assert from "assert";

import {networkLinkSegments} from "../../internal.ts";

/**
    The links a Network's node labels keep clear of, as segments: a
    straight link from center to center, a bundled link along its points,
    and a self-loop along its curve.
*/

const node = (id, x, y) => ({id, x, y, r: 4});

it("networkLinkSegments: a straight link runs center to center", () => {
  const segments = networkLinkSegments([
    {source: node("a", 0, 0), target: node("b", 30, 40)},
  ]);
  assert.deepStrictEqual(segments, [{x1: 0, y1: 0, x2: 30, y2: 40}]);
});

it("networkLinkSegments: a bundled link follows its points", () => {
  const segments = networkLinkSegments([
    {
      source: node("a", 0, 0),
      target: node("b", 20, 0),
      points: [
        [0, 0],
        [10, 5],
        [20, 0],
      ],
    },
  ]);
  assert.deepStrictEqual(segments, [
    {x1: 0, y1: 0, x2: 10, y2: 5},
    {x1: 10, y1: 5, x2: 20, y2: 0},
  ]);
});

it("networkLinkSegments: a self-loop follows its curve", () => {
  const a = node("a", 50, 50);
  const segments = networkLinkSegments([
    {
      source: a,
      target: a,
      loop: {d: "M50,50C70,20 80,60 50,50", apex: [70, 40]},
    },
  ]);
  assert.ok(segments.length > 2, `${segments.length} segments`);
  const xs = segments.flatMap(s => [s.x1, s.x2]);
  assert.ok(Math.max(...xs) > 60, "reaches out along the loop");
  assert.deepStrictEqual([segments[0].x1, segments[0].y1], [50, 50]);
});

it("networkLinkSegments: a link without both ends adds nothing", () => {
  assert.deepStrictEqual(
    networkLinkSegments([{source: node("a", 0, 0), target: undefined}]),
    [],
  );
});
