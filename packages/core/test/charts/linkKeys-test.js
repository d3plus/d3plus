import {it} from "vitest";
import assert from "assert";

import {ringsLinkKeys, sankeyLinkIds, uniqueLinkKeys} from "../../internal.ts";

it("uniqueLinkKeys keeps unique bases and numbers later repeats", () => {
  assert.deepStrictEqual(uniqueLinkKeys(["a-b", "a-c", "b-c"]), [
    "a-b",
    "a-c",
    "b-c",
  ]);
  assert.deepStrictEqual(uniqueLinkKeys(["a-b", "a-c", "a-b", "a-b"]), [
    "a-b",
    "a-c",
    "a-b-1",
    "a-b-2",
  ]);
  assert.deepStrictEqual(uniqueLinkKeys([]), []);
});

it("uniqueLinkKeys never repeats a key, even when a base looks numbered", () => {
  const cases = [
    ["a-b", "a-b-1", "a-b"],
    ["a-b-1", "a-b", "a-b"],
    ["a-b", "a-b", "a-b-1", "a-b-1"],
  ];
  for (const bases of cases) {
    const keys = uniqueLinkKeys(bases);
    assert.strictEqual(new Set(keys).size, bases.length, keys.join(", "));
    keys.forEach((k, i) => assert.ok(k.startsWith(bases[i])));
  }
  assert.deepStrictEqual(uniqueLinkKeys(["a-b", "a-b-1", "a-b"]), [
    "a-b",
    "a-b-1",
    "a-b-2",
  ]);
});

it("uniqueLinkKeys gives the same keys on every call", () => {
  const bases = ["x", "y", "x", "x", "y"];
  assert.deepStrictEqual(uniqueLinkKeys(bases), uniqueLinkKeys([...bases]));
});

const sankeyLink = (source, target) => ({
  source: {id: source},
  target: {id: target},
  value: 1,
  datum: {},
});

it("sankeyLinkIds names a link by its ends, numbering parallel links", () => {
  const links = [
    sankeyLink("A", "B"),
    sankeyLink("A", "C"),
    sankeyLink("A", "B"),
    sankeyLink("B", "A"),
  ];
  assert.deepStrictEqual(sankeyLinkIds(links), ["A-B", "A-C", "A-B-1", "B-A"]);
  assert.deepStrictEqual(sankeyLinkIds(links), sankeyLinkIds(links.slice()));
  assert.deepStrictEqual(sankeyLinkIds([sankeyLink(0, 1)]), ["0-1"]);
});

it("ringsLinkKeys numbers parallel edges and keeps loops by their index", () => {
  const edge = (source, target, loop) => ({
    source: {id: source},
    target: {id: target},
    datum: {},
    ...(loop ? {loop: {}} : {}),
  });
  const edges = [
    edge("A", "B"),
    edge("B", "C"),
    edge("B", "C"),
    edge("C", "C", true),
  ];
  assert.deepStrictEqual(ringsLinkKeys(edges), [
    "rings-link-A-B",
    "rings-link-B-C",
    "rings-link-B-C-1",
    "rings-link-C-C-0",
  ]);
  assert.deepStrictEqual(ringsLinkKeys(edges), ringsLinkKeys(edges.slice()));
});
