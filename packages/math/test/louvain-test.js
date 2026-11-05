import {readFileSync} from "node:fs";
import {describe, it} from "vitest";
import assert from "assert";
import louvain from "../src/louvain.ts";

/** The groups a result forms, as sorted arrays of ids, largest first. */
const groupsOf = result => {
  const groups = new Map();
  for (const [id, c] of result) {
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(id);
  }
  return [...groups.keys()]
    .sort((a, b) => a - b)
    .map(c => groups.get(c).sort());
};

/** Two triangles joined by one bridge link. */
const twoTriangles = {
  nodes: ["a", "b", "c", "d", "e", "f"],
  links: [
    {source: "a", target: "b"},
    {source: "b", target: "c"},
    {source: "c", target: "a"},
    {source: "d", target: "e"},
    {source: "e", target: "f"},
    {source: "f", target: "d"},
    {source: "c", target: "d"},
  ],
};

describe("louvain", () => {
  it("splits two triangles joined by a bridge", () => {
    assert.deepStrictEqual(groupsOf(louvain(twoTriangles)), [
      ["a", "b", "c"],
      ["d", "e", "f"],
    ]);
  });

  it("finds the four cliques of a ring of cliques", () => {
    const nodes = [];
    const links = [];
    for (let q = 0; q < 4; q++) {
      const ids = [0, 1, 2, 3, 4].map(k => `${q}-${k}`);
      nodes.push(...ids);
      ids.forEach((a, i) =>
        ids.slice(i + 1).forEach(b => links.push({source: a, target: b})),
      );
      links.push({source: `${q}-0`, target: `${(q + 1) % 4}-4`});
    }
    const groups = groupsOf(louvain({nodes, links}));
    assert.strictEqual(groups.length, 4);
    groups.forEach(g =>
      assert.ok(
        g.every(id => id[0] === g[0][0]),
        `mixed clique: ${g}`,
      ),
    );
  });

  it("numbers communities by size, largest first", () => {
    const result = louvain({
      nodes: ["x", "y", "a", "b", "c", "d"],
      links: [
        {source: "x", target: "y"},
        {source: "a", target: "b"},
        {source: "b", target: "c"},
        {source: "c", target: "d"},
        {source: "d", target: "a"},
        {source: "a", target: "c"},
      ],
    });
    assert.strictEqual(result.get("a"), 0);
    assert.strictEqual(result.get("x"), 1);
    assert.strictEqual(result.get("x"), result.get("y"));
  });

  it("returns the same result on every run", () => {
    const a = [...louvain(twoTriangles)];
    for (let k = 0; k < 5; k++)
      assert.deepStrictEqual([...louvain(twoTriangles)], a);
  });

  it("keeps disconnected parts apart, and a node with no links alone", () => {
    const result = louvain({
      nodes: ["a", "b", "c", "d", "lonely"],
      links: [
        {source: "a", target: "b"},
        {source: "c", target: "d"},
      ],
    });
    assert.deepStrictEqual(groupsOf(result), [
      ["a", "b"],
      ["c", "d"],
      ["lonely"],
    ]);
  });

  it("gives every node its own community when there are no links", () => {
    const result = louvain({nodes: [1, 2, 3], links: []});
    assert.deepStrictEqual(
      [...result],
      [
        [1, 0],
        [2, 1],
        [3, 2],
      ],
    );
  });

  it("follows the link weights", () => {
    // A square: heavy a–b and c–d sides pair those nodes up.
    const square = w => ({
      nodes: ["a", "b", "c", "d"],
      links: [
        {source: "a", target: "b", weight: w.ab},
        {source: "b", target: "c", weight: w.bc},
        {source: "c", target: "d", weight: w.ab},
        {source: "d", target: "a", weight: w.bc},
      ],
    });
    assert.deepStrictEqual(groupsOf(louvain(square({ab: 10, bc: 1}))), [
      ["a", "b"],
      ["c", "d"],
    ]);
    assert.deepStrictEqual(groupsOf(louvain(square({ab: 1, bc: 10}))), [
      ["a", "d"],
      ["b", "c"],
    ]);
  });

  it("ignores links with a missing end or a weight that isn't positive", () => {
    const result = louvain({
      nodes: ["a", "b", "c", "d"],
      links: [
        {source: "a", target: "b"},
        {source: "c", target: "d"},
        {source: "a", target: "zzz"},
        {source: "b", target: "c", weight: 0},
        {source: "a", target: "d", weight: -5},
        {source: "a", target: "c", weight: NaN},
      ],
    });
    assert.deepStrictEqual(groupsOf(result), [
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("sums duplicate links and counts self-loops", () => {
    const result = louvain({
      nodes: ["a", "b", "c"],
      links: [
        {source: "a", target: "b"},
        {source: "b", target: "a"},
        {source: "b", target: "c"},
        {source: "c", target: "c", weight: 3},
      ],
    });
    assert.deepStrictEqual(groupsOf(result), [["a", "b"], ["c"]]);
  });

  it("makes more, smaller communities at a higher resolution", () => {
    const nodes = ["a", "b", "c", "d"];
    const links = [
      {source: "a", target: "b"},
      {source: "b", target: "c"},
      {source: "c", target: "d"},
      {source: "d", target: "a"},
      {source: "a", target: "c"},
      {source: "b", target: "d"},
    ];
    assert.strictEqual(new Set(louvain({nodes, links}).values()).size, 1);
    assert.ok(
      new Set(louvain({nodes, links}, {resolution: 3}).values()).size > 1,
    );
  });

  it("partitions the 866-node product space quickly", () => {
    const file = new URL(
      "../../core/dev/charts/Network/network_hs4.json",
      import.meta.url,
    );
    const {nodes, edges} = JSON.parse(readFileSync(file, "utf8"));
    const graph = {
      nodes: nodes.map(n => n.id),
      links: edges.map(e => ({
        source: e.source,
        target: e.target,
        weight: e.strength,
      })),
    };
    const start = performance.now();
    const result = louvain(graph);
    const elapsed = performance.now() - start;
    assert.strictEqual(result.size, 866);
    const sizes = groupsOf(result).map(g => g.length);
    assert.ok(sizes.length > 5 && sizes.length < 100, `${sizes.length}`);
    assert.ok(sizes[0] < 866 / 2, `largest: ${sizes[0]}`);
    assert.ok(elapsed < 500, `took ${elapsed}ms`);
    assert.deepStrictEqual([...louvain(graph)], [...result]);
  });
});
