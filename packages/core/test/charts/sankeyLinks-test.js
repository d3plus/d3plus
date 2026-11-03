import {it} from "vitest";
import assert from "assert";

import {
  sankeyDrawableLinks,
  sankeyLoopWarning,
  unlinkedNodeValue,
} from "../../internal.ts";

it("sankeyDrawableLinks keeps links between two different nodes", () => {
  const links = [
    {source: 0, target: 1},
    {source: 2, target: 2},
    {source: 0, target: undefined},
    {source: undefined, target: 1},
    {source: 1, target: 0},
  ];
  const {drawn, unresolved, selfLinks} = sankeyDrawableLinks(links);
  assert.deepStrictEqual(drawn, [links[0], links[4]]);
  assert.deepStrictEqual(unresolved, [links[2], links[3]]);
  assert.deepStrictEqual(selfLinks, [links[1]]);
  assert.deepStrictEqual(sankeyDrawableLinks([]), {
    drawn: [],
    unresolved: [],
    selfLinks: [],
  });
});

it("unlinkedNodeValue reads the node's own value, else the smallest link value, else 1", () => {
  assert.strictEqual(unlinkedNodeValue(4, [10, 2]), 4);
  assert.strictEqual(unlinkedNodeValue("7", [10, 2]), 7);
  assert.strictEqual(unlinkedNodeValue(undefined, [10, 2, 0, NaN]), 2);
  assert.strictEqual(unlinkedNodeValue(0, [10, 3]), 3);
  assert.strictEqual(unlinkedNodeValue(-5, [10, 3]), 3);
  assert.strictEqual(unlinkedNodeValue("", [3]), 3);
  assert.strictEqual(unlinkedNodeValue(null, []), 1);
  assert.strictEqual(unlinkedNodeValue("n/a", [0]), 1);
});

it("sankeyLoopWarning counts the links and names each one once", () => {
  assert.strictEqual(
    sankeyLoopWarning([["a", "a"]]),
    "Sankey can't draw a flow that loops back into a node it left, so it leaves out 1 link (a → a).",
  );
  assert.strictEqual(
    sankeyLoopWarning([
      ["a", "a"],
      ["c", "a"],
      ["a", "a"],
    ]),
    "Sankey can't draw a flow that loops back into a node it left, so it leaves out 3 links (a → a, c → a).",
  );
});

it("sankeyLoopWarning names ten links and sums up the rest", () => {
  const ends = Array.from({length: 13}, (_, i) => [`n${i + 1}`, "n0"]);
  const message = sankeyLoopWarning(ends);
  assert.ok(message.startsWith("Sankey can't draw a flow that loops back"));
  assert.ok(message.includes("leaves out 13 links (n1 → n0, n2 → n0,"));
  assert.ok(message.endsWith("n10 → n0, and 3 more)."), message);
  assert.ok(!message.includes("n11"));
});
