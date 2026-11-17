import {describe, it} from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";

import {profileData} from "../src/components/ChartChooser/columns.ts";
import {parseData} from "../src/components/ChartChooser/parse.ts";
import {SAMPLES} from "../src/components/ChartChooser/samples.ts";
import {
  evaluate,
  explain,
  leaves,
} from "../src/components/ChartChooser/states.ts";
import {analyze} from "../src/components/ChartChooser/traits.ts";
import {nodeKey, TREE} from "../src/components/ChartChooser/tree.ts";

const traits = text => analyze(profileData(parseData(text).rows));
/** The keys of a state map's lit nodes one level below the root. */
const litBranches = states =>
  [...states]
    .filter(([key, s]) => s.lit && key.split("/").length === 2)
    .map(([key]) => key.split("/")[1]);

describe("TREE", () => {
  it("has a leaf for every chart @d3plus/core exports", () => {
    const source = fs.readFileSync(
      new URL("../../core/src/charts/index.ts", import.meta.url),
      "utf8",
    );
    const exported = [...source.matchAll(/export \{default as (\w+)\}/g)]
      .map(m => m[1])
      .filter(name => !["Plot", "Viz"].includes(name))
      .sort();
    const charted = [...new Set(leaves(TREE).map(l => l.node.chart))].sort();
    assert.deepEqual(charted, exported);
  });
  it("gives every node a unique key", () => {
    const keys = [];
    const visit = (node, path) => {
      keys.push(nodeKey([...path, node.id]));
      node.children?.forEach(c => visit(c, [...path, node.id]));
    };
    visit(TREE, []);
    assert.equal(new Set(keys).size, keys.length);
  });
});

describe("nodeKey", () => {
  it("joins a node's path", () => {
    assert.equal(nodeKey(["root", "time", "LinePlot"]), "root/time/LinePlot");
  });
});

describe("leaves", () => {
  it("lists every chart leaf with its key", () => {
    const all = leaves(TREE);
    assert.ok(all.every(l => l.node.chart && !l.node.children));
    assert.ok(all.some(l => l.key === "root/time/trend/LinePlot"));
    // Treemap sits under both part-to-whole and nested categories.
    assert.equal(all.filter(l => l.node.chart === "Treemap").length, 2);
  });
});

describe("evaluate", () => {
  it("lights the branches and charts the data fits", () => {
    const states = evaluate(TREE, traits("party,seats\nA,10\nB,20\nC,5"));
    assert.deepEqual(litBranches(states), ["headline", "compare"]);
    assert.equal(states.get("root/compare/part/Pie").lit, true);
    assert.equal(states.get("root/time/trend/LinePlot").lit, false);
  });
  it("dims a branch whose rules pass but whose charts don't", () => {
    // A year of quarters: finer than years, but too short for a cycle plot.
    const states = evaluate(
      TREE,
      traits("q,v\n2024 Q1,1\n2024 Q2,2\n2024 Q3,3"),
    );
    const cycles = states.get("root/time/cycles");
    assert.equal(cycles.fits, true);
    assert.equal(cycles.lit, false);
    assert.equal(states.get("root/time").lit, true);
  });
  it("carries each node's ancestors' checks", () => {
    const states = evaluate(TREE, traits("a,b\nx,1\ny,2"));
    const leaf = states.get("root/time/trend/LinePlot");
    assert.ok(leaf.checks.some(c => !c.ok && /date column/.test(c.text)));
  });
});

describe("explain", () => {
  it("splits a node's checks into what the data has and what it needs", () => {
    const state = {
      lit: false,
      fits: false,
      checks: [
        {ok: true, text: "has a"},
        {ok: false, text: "needs b"},
        {ok: false, text: "needs b"},
      ],
    };
    assert.deepEqual(explain(state), {found: ["has a"], missing: ["needs b"]});
    assert.deepEqual(explain(undefined), {found: [], missing: []});
  });
});

describe("samples", () => {
  const expected = {
    headline: ["headline"],
    categories: ["compare"],
    hierarchy: ["compare", "hierarchy"],
    pyramid: ["crosstab"],
    "time-series": ["headline", "time"],
    "before-after": ["time"],
    distribution: ["relations", "distribution"],
    measures: ["compare", "hierarchy", "relations"],
    flows: ["crosstab", "flows"],
    countries: ["compare", "distribution", "geo"],
    states: ["compare", "distribution", "geo"],
    schedule: ["hierarchy", "time"],
    prices: ["headline", "time", "relations"],
    sets: ["sets"],
  };
  for (const sample of SAMPLES)
    it(`${sample.id} lights its own branches`, () => {
      const parsed = parseData(sample.text);
      assert.equal(parsed.error, undefined);
      assert.deepEqual(
        litBranches(evaluate(TREE, traits(sample.text))),
        expected[sample.id],
      );
    });
  it("light every chart but FanChart between them", () => {
    const lit = new Set();
    for (const sample of SAMPLES) {
      const states = evaluate(TREE, traits(sample.text));
      for (const l of leaves(TREE))
        if (states.get(l.key).lit) lit.add(l.node.chart);
    }
    const unlit = leaves(TREE)
      .map(l => l.node.chart)
      .filter(c => !lit.has(c));
    assert.deepEqual([...new Set(unlit)], ["FanChart"]);
  });
});
