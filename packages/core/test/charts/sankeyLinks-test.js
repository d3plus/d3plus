import {it} from "vitest";
import assert from "assert";

import {
  sankeyDrawableLinks,
  sankeySelfLinkWarning,
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

it("sankeySelfLinkWarning counts the links and names each node once", () => {
  assert.strictEqual(
    sankeySelfLinkWarning(["a"]),
    "Sankey can't draw a flow from a node back into itself, so it leaves out 1 link (a).",
  );
  assert.strictEqual(
    sankeySelfLinkWarning(["a", "b", "a"]),
    "Sankey can't draw a flow from a node back into itself, so it leaves out 3 links (a, b).",
  );
});
