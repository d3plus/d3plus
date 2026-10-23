import {describe, it} from "vitest";
import assert from "assert";

import {
  GROUP_DEPTH_KEY,
  groupDepthOf,
  groupNarrows,
  groupPath,
  inGroup,
} from "../../src/charts/viz/groupRow.ts";

const groupBy = [d => d.sector, d => d.industry, d => d.company];

const rows = [
  {sector: "Tech", industry: "Software", company: "A"},
  {sector: "Tech", industry: "Software", company: "B"},
  {sector: "Tech", industry: "Chips", company: "C"},
  {sector: "Energy", industry: "Oil", company: "D"},
];

const header = {
  sector: "Tech",
  industry: "Software",
  company: ["A", "B"],
  [GROUP_DEPTH_KEY]: 1,
};

describe("groupDepthOf", () => {
  it("reads a group row's level", () => {
    assert.strictEqual(groupDepthOf(header), 1);
    assert.strictEqual(groupDepthOf({[GROUP_DEPTH_KEY]: 0}), 0);
  });

  it("unwraps a label record or laid-out node to its row", () => {
    const label = {__d3plus__: true, data: {__d3plus__: true, data: header}};
    assert.strictEqual(groupDepthOf(label), 1);
  });

  it("is undefined for any other row", () => {
    assert.strictEqual(groupDepthOf(rows[0]), undefined);
    assert.strictEqual(groupDepthOf(undefined), undefined);
    assert.strictEqual(groupDepthOf(null), undefined);
  });
});

describe("groupPath", () => {
  it("lists the group's key at each level down to its own", () => {
    assert.deepStrictEqual(groupPath(groupBy, header, 1), ["Tech", "Software"]);
    assert.deepStrictEqual(groupPath(groupBy, header, 0), ["Tech"]);
  });

  it("reads through a wrapped datum", () => {
    assert.deepStrictEqual(
      groupPath(groupBy, {__d3plus__: true, data: header}, 0),
      ["Tech"],
    );
  });
});

describe("inGroup", () => {
  it("matches rows whose keys equal the group's at every level", () => {
    const path = ["Tech", "Software"];
    assert.deepStrictEqual(
      rows.map((d, i) => inGroup(groupBy, path, d, i)),
      [true, true, false, false],
    );
  });

  it("matches a merged row holding the group's key", () => {
    const sector = {sector: "Tech", industry: ["Software", "Chips"]};
    assert.ok(inGroup(groupBy, ["Tech", "Chips"], sector, 0));
    assert.ok(!inGroup(groupBy, ["Energy", "Oil"], sector, 0));
  });

  it("is false without a row", () => {
    assert.ok(!inGroup(groupBy, ["Tech"], undefined, 0));
  });
});

describe("groupNarrows", () => {
  it("is true when rows fall outside the group", () => {
    assert.ok(groupNarrows(groupBy, ["Tech"], rows));
  });

  it("is false when the group is everything drawn", () => {
    assert.ok(!groupNarrows(groupBy, ["Tech"], rows.slice(0, 3)));
    assert.ok(!groupNarrows(groupBy, ["Tech"], []));
  });
});
