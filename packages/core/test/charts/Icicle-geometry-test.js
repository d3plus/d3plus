import {it} from "vitest";
import assert from "assert";
import {
  icicleBands,
  icicleCollapse,
  icicleExtent,
  icicleRect,
} from "../../src/charts/Icicle/geometry.ts";

const horizontal = {width: 400, height: 300, orient: "horizontal"};
const vertical = {width: 400, height: 300, orient: "vertical"};

it("Icicle geometry: icicleExtent picks the depth and breadth axes by orient", () => {
  assert.deepStrictEqual(icicleExtent(horizontal), {depth: 400, breadth: 300});
  assert.deepStrictEqual(icicleExtent(vertical), {depth: 300, breadth: 400});
  assert.deepStrictEqual(
    icicleExtent({width: -5, height: 10, orient: "horizontal"}),
    {depth: 0, breadth: 10},
  );
});

it("Icicle geometry: icicleBands splits the depth axis evenly, collapsing an unfocused root", () => {
  assert.deepStrictEqual(icicleBands(300, 3, false), [
    [0, 0],
    [0, 100],
    [100, 200],
    [200, 300],
  ]);
  assert.deepStrictEqual(icicleBands(300, 2, true), [
    [0, 100],
    [100, 200],
    [200, 300],
  ]);
  assert.deepStrictEqual(icicleBands(300, 0, true), [[0, 300]]);
  assert.deepStrictEqual(icicleBands(300, 0, false), [[0, 0]]);
  assert.deepStrictEqual(icicleBands(-10, 1, false), [
    [0, 0],
    [0, 0],
  ]);
});

it("Icicle geometry: icicleRect places the band and breadth on the orient's axes", () => {
  const span = {x0: 0.25, x1: 0.75};
  assert.deepStrictEqual(icicleRect(span, [100, 200], horizontal), {
    x: 100,
    y: 75,
    width: 100,
    height: 150,
  });
  assert.deepStrictEqual(icicleRect(span, [100, 200], vertical), {
    x: 100,
    y: 100,
    width: 200,
    height: 100,
  });
});

it("Icicle geometry: icicleCollapse maps through the zoom pivot, folding outsiders to the edges", () => {
  const bands = icicleBands(400, 2, true);
  const origin = {x0: 0.5, x1: 1, depth: 1};
  // A child of the pivot fills its share of the whole, one band out.
  const child = icicleCollapse(
    {x0: 0.5, x1: 0.75},
    2,
    origin,
    bands,
    horizontal,
  );
  assert.deepStrictEqual(
    [child.x, child.y, child.width, child.height].map(
      v => Math.round(v * 1000) / 1000,
    ),
    [133.333, 0, 133.333, 150],
  );
  // A sibling before the pivot folds to a zero-height sliver at the near edge.
  const before = icicleCollapse({x0: 0, x1: 0.5}, 1, origin, bands, horizontal);
  assert.deepStrictEqual([before.y, before.height], [0, 0]);
  // A node above the pivot folds to a zero-length sliver at the root edge.
  const above = icicleCollapse({x0: 0, x1: 1}, 0, origin, bands, vertical);
  assert.deepStrictEqual([above.y, above.height], [0, 0]);
  // Past the last band, a node folds onto the far end.
  const deep = icicleCollapse({x0: 0.5, x1: 1}, 9, origin, bands, horizontal);
  assert.deepStrictEqual([deep.x, deep.width], [400, 0]);
  // A zero-width pivot never divides by zero.
  const flat = icicleCollapse(
    {x0: 0, x1: 1},
    1,
    {x0: 0.5, x1: 0.5, depth: 1},
    bands,
    horizontal,
  );
  assert.ok(Number.isFinite(flat.y) && Number.isFinite(flat.height));
});
