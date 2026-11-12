import {describe, it} from "vitest";
import assert from "assert";
import {hierarchy} from "d3-hierarchy";

import {nestGroups} from "@d3plus/data";

import {attachGroupRows, packDatum} from "../../src/charts/Pack/groupRows.ts";
import {MEMBERS_KEY} from "../../src/charts/features/thresholdMembers.ts";
import {
  GROUP_DEPTH_KEY,
  groupDepthOf,
  groupNarrows,
  groupPath,
} from "../../src/charts/viz/groupRow.ts";

const rows = [
  {region: "East", country: "A", value: 30},
  {region: "East", country: "B", value: 20},
  {region: "West", country: "C", value: 22},
  {region: "West", country: "D", value: 12},
];
const groupBy = [d => d.region, d => d.country];

/** The hierarchy Pack lays out: a root over `rows` nested by region. */
function packTree(data = rows) {
  const nested = nestGroups(data, [d => d.region]);
  const root = hierarchy({key: undefined, values: nested}, d => d.values);
  attachGroupRows(root, {});
  return root;
}

const child = (node, key) => node.children.find(c => c.data.key === key);

describe("attachGroupRows", () => {
  it("gives each group its rows merged, at its groupBy level", () => {
    const east = packDatum(child(packTree(), "East"));
    assert.deepStrictEqual(
      {...east},
      {
        region: "East",
        country: ["A", "B"],
        value: 50,
        [GROUP_DEPTH_KEY]: 0,
      },
    );
    assert.strictEqual(groupDepthOf(east), 0);
  });

  it("gives the outermost circle every row, at the level above the first", () => {
    const root = packDatum(packTree());
    assert.strictEqual(root.value, 84);
    assert.deepStrictEqual(root.region, ["East", "West"]);
    assert.strictEqual(groupDepthOf(root), -1);
    assert.deepStrictEqual(groupPath(groupBy, root, -1), []);
    assert.strictEqual(
      groupNarrows(groupBy, groupPath(groupBy, root, -1), rows),
      false,
      "zooming into it changes nothing",
    );
  });

  it("keeps each leaf's own row", () => {
    const east = child(packTree(), "East");
    const leaf = east.children[0];
    assert.strictEqual(leaf.groupRow, undefined);
    assert.strictEqual(packDatum(leaf), rows[0]);
  });

  it("links each row to the datums inside it, out of its fields", () => {
    const tree = packTree();
    const root = packDatum(tree);
    const east = packDatum(child(tree, "East"));
    assert.strictEqual(east.key, "East");
    assert.deepStrictEqual(east.values, [rows[0], rows[1]]);
    assert.deepStrictEqual(root.values, [east, packDatum(child(tree, "West"))]);
    assert.ok(!Object.keys(east).includes("key"));
    assert.ok(!Object.keys(east).includes("values"));
  });

  it("drops the threshold bucket's flags from a group holding it", () => {
    const bucket = {
      region: "West",
      country: ["C", "D"],
      value: 34,
      _isAggregation: true,
      _threshold: 0.1,
      [MEMBERS_KEY]: ["C", "D"],
    };
    const west = packDatum(child(packTree([rows[0], bucket]), "West"));
    assert.strictEqual(west._isAggregation, undefined);
    assert.strictEqual(west._threshold, undefined);
    assert.strictEqual(west[MEMBERS_KEY], undefined);
    assert.strictEqual(west.value, 34);
  });
});
