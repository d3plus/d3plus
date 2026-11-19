import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  dendrogram,
  elbow,
  indented,
  OUTLINE_BELOW,
  outline,
  placeTree,
} from "../src/components/ChartChooser/layout.ts";

const leaf = id => ({id, label: id, chart: id, rules: []});
const tree = {
  id: "root",
  label: "root",
  rules: [],
  children: [
    {id: "a", label: "a", rules: [], children: [leaf("A1"), leaf("A2")]},
    {
      id: "b",
      label: "b",
      rules: [],
      children: [
        {id: "c", label: "c", rules: [], children: [leaf("C1")]},
        leaf("B1"),
      ],
    },
  ],
};
const byKey = layout => Object.fromEntries(layout.nodes.map(n => [n.key, n]));

describe("dendrogram", () => {
  const layout = dendrogram(tree, {
    columns: [0, 50, 100, 200],
    row: 20,
    gap: 10,
    width: 400,
  });
  const n = byKey(layout);
  it("puts every leaf in the last column, a row apart, with a gap between branches", () => {
    assert.deepEqual(
      ["root/a/A1", "root/a/A2", "root/b/c/C1", "root/b/B1"].map(k => [
        n[k].x,
        n[k].y,
      ]),
      [
        [200, 10],
        [200, 30],
        [200, 60],
        [200, 80],
      ],
    );
  });
  it("puts branches in their depth's column, beside their children's middle", () => {
    assert.deepEqual([n["root/a"].x, n["root/a"].y], [50, 20]);
    assert.deepEqual([n["root/b/c"].x, n["root/b/c"].y], [100, 60]);
    assert.equal(n["root/b"].y, 70);
    assert.equal(n.root.y, 45);
    assert.equal(n["root/b/c/C1"].parent, "root/b/c");
  });
  it("is as tall as its rows and gaps", () => {
    assert.equal(layout.height, 90);
    assert.equal(layout.width, 400);
  });
});

describe("indented", () => {
  it("gives each node its own row, indented by depth", () => {
    const layout = indented(tree, {row: 30, indent: 18, width: 300});
    const n = byKey(layout);
    assert.equal(layout.nodes.length, 8);
    assert.equal(layout.height, 240);
    assert.deepEqual([n.root.x, n.root.y], [0, 15]);
    assert.deepEqual([n["root/a/A1"].x, n["root/a/A1"].y], [36, 75]);
    assert.deepEqual([n["root/b/c/C1"].x, n["root/b/c/C1"].depth], [54, 3]);
  });
});

describe("elbow", () => {
  it("is a straight line between rows at the same height", () => {
    assert.equal(elbow(0, 10, 100, 10, 50), "M0,10H100");
  });
  it("turns at a column with rounded corners", () => {
    assert.equal(
      elbow(0, 0, 100, 40, 50, 6),
      "M0,0H44Q50,0 50,6V34Q50,40 56,40H100",
    );
    assert.equal(
      elbow(0, 40, 100, 0, 50, 6),
      "M0,40H44Q50,40 50,34V6Q50,0 56,0H100",
    );
  });
  it("shrinks corners to fit", () => {
    assert.equal(
      elbow(0, 0, 100, 4, 50, 6),
      "M0,0H48Q50,0 50,2V2Q50,4 52,4H100",
    );
  });
});

describe("placeTree", () => {
  it("outlines the tree when narrow", () => {
    const layout = placeTree(tree, OUTLINE_BELOW - 1);
    assert.equal(byKey(layout)["root/a"].x, 18);
  });
  it("draws a dendrogram when wide, its leaves as far right as fits", () => {
    const leafX = width => byKey(placeTree(tree, width))["root/a/A1"].x;
    assert.equal(leafX(OUTLINE_BELOW), 410);
    assert.equal(leafX(640), 470);
    assert.equal(leafX(1200), 660);
  });
  it("spreads the branch columns as the leaves move right", () => {
    const x = (width, key) => byKey(placeTree(tree, width))[key].x;
    assert.equal(x(OUTLINE_BELOW, "root/a"), 96);
    assert.equal(x(1200, "root/a"), 121);
    assert.equal(x(1200, "root/b/c"), 362);
  });
});

describe("outline", () => {
  it("drops from beneath the parent and turns toward the child", () => {
    assert.equal(outline(10, 0, 30, 40, 6), "M10,0V34Q10,40 16,40H30");
  });
});
