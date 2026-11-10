import {it} from "vitest";
import assert from "assert";
import {placeLoneNodes} from "../../internal.ts";

/**
    Nodes no link pulls on sit out Network's force layout and are placed in
    rows under the rest, as far apart as the linked nodes typically sit from
    their nearest neighbor.
*/

const at = (id, fx, fy) => ({id, fx, fy});

it("placeLoneNodes: a centered row one step under the placed nodes", () => {
  const placed = [at("a", 0, 0), at("b", 10, 0), at("c", 20, 4)];
  const lone = [at("x"), at("y")];
  placeLoneNodes(placed, lone);
  // Nearest-neighbor distances 10, 10 and ~10.8: the median is 10.
  assert.deepStrictEqual(
    lone.map(n => [n.fx, n.fy]),
    [
      [5, 14],
      [15, 14],
    ],
  );
});

it("placeLoneNodes: wraps to more rows, at least √n nodes wide", () => {
  const placed = [at("a", 0, 0), at("b", 10, 0)];
  const lone = ["p", "q", "r", "s", "t"].map(id => at(id));
  placeLoneNodes(placed, lone);
  const rows = new Map();
  for (const n of lone) rows.set(n.fy, [...(rows.get(n.fy) ?? []), n.fx]);
  assert.deepStrictEqual([...rows.keys()], [10, 20], "rows a step apart");
  assert.deepStrictEqual(rows.get(10), [-5, 5, 15]);
  assert.deepStrictEqual(rows.get(20), [0, 10], "a short row is centered");
});

it("placeLoneNodes: without placed nodes, a square-ish grid", () => {
  const lone = ["a", "b", "c", "d", "e"].map(id => at(id));
  placeLoneNodes([], lone);
  assert.deepStrictEqual(
    lone.map(n => [n.fx, n.fy]),
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [-0.5, 1],
      [0.5, 1],
    ],
  );
  const none = [];
  placeLoneNodes([at("a", 0, 0)], none);
  assert.deepStrictEqual(none, []);
});
