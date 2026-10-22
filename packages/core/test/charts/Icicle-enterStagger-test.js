import {it} from "vitest";
import assert from "assert";
import {cubicInOut} from "@d3plus/render";
import {
  icicleRootEdge,
  icicleStagger,
} from "../../src/charts/Icicle/enterStagger.ts";

const rect = {x: 100, y: 40, width: 50, height: 80};

/** A parent-before-child node list: a → (ab, ac → acd). */
function tree() {
  const a = {id: "a", x: 0, y: 0, width: 10, height: 100};
  const ab = {id: "ab", x: 10, y: 0, width: 10, height: 40, parent: a};
  const ac = {id: "ac", x: 10, y: 40, width: 10, height: 60, parent: a};
  const acd = {id: "acd", x: 20, y: 40, width: 10, height: 60, parent: ac};
  return [a, ab, ac, acd];
}

it("icicleRootEdge collapses a rect onto the midpoint of its root-side edge", () => {
  assert.deepStrictEqual(
    icicleRootEdge(rect, "horizontal"),
    {x: 100, y: 80, width: 0, height: 0},
    "the left edge",
  );
  assert.deepStrictEqual(
    icicleRootEdge(rect, "vertical"),
    {x: 125, y: 40, width: 0, height: 0},
    "the top edge",
  );
});

it("icicleStagger gives each entering level the next window of the transition", () => {
  const nodes = tree();
  const {rects, windows} = icicleStagger(
    nodes,
    new Set(nodes.map(n => n.id)),
    "horizontal",
  );
  assert.deepStrictEqual(windows.get("a"), {start: 0, end: cubicInOut(1 / 3)});
  assert.deepStrictEqual(windows.get("ab"), {
    start: cubicInOut(1 / 3),
    end: cubicInOut(2 / 3),
  });
  assert.deepStrictEqual(
    windows.get("ac"),
    windows.get("ab"),
    "siblings share a window",
  );
  assert.deepStrictEqual(windows.get("acd"), {
    start: cubicInOut(2 / 3),
    end: 1,
  });
  assert.deepStrictEqual(rects.get("acd"), {x: 20, y: 70, width: 0, height: 0});
  assert.deepStrictEqual(
    icicleStagger(nodes, new Set(nodes.map(n => n.id)), "vertical").rects.get(
      "a",
    ),
    {x: 5, y: 0, width: 0, height: 0},
  );
});

it("icicleStagger counts only entering levels, and leaves drawn nodes alone", () => {
  const nodes = tree();
  const {rects, windows} = icicleStagger(
    nodes,
    new Set(["ac", "acd"]),
    "horizontal",
  );
  assert.ok(
    !windows.has("a") && !rects.has("a") && !windows.has("ab"),
    "drawn nodes keep their update",
  );
  assert.deepStrictEqual(
    windows.get("ac"),
    {start: 0, end: 0.5},
    "a child of a drawn node starts at once",
  );
  assert.deepStrictEqual(windows.get("acd"), {start: 0.5, end: 1});
  assert.deepStrictEqual(
    icicleStagger(nodes, new Set(["acd"]), "horizontal").windows.get("acd"),
    {start: 0, end: 1},
  );
  assert.strictEqual(
    icicleStagger(nodes, new Set(), "horizontal").windows.size,
    0,
  );
});
