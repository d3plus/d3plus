import {describe, it} from "vitest";
import assert from "assert";

import {
  GROUP_DEPTH_KEY,
  groupDepthOf,
  groupNarrows,
  groupPath,
  inGroup,
  sharesGroup,
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

describe("sharesGroup", () => {
  const legend = [
    {sector: "Tech", industry: ["Software", "Chips"]},
    {sector: "Energy", industry: "Oil"},
  ];

  it("matches the entries holding a row's key at every level down to the depth", () => {
    const lit = sharesGroup(groupBy, 0, [rows[2]]);
    assert.deepStrictEqual(
      legend.map((d, i) => lit(d, i)),
      [true, false],
    );
  });

  it("matches through a merged row's keys, on either side", () => {
    const lit = sharesGroup(groupBy, 1, [header]);
    assert.ok(lit(legend[0], 0));
    assert.ok(!lit(legend[1], 1));
    const merged = sharesGroup(groupBy, 0, [{sector: ["Tech", "Energy"]}]);
    assert.ok(merged(legend[0], 0) && merged(legend[1], 1));
  });

  it("compares every level down to the depth", () => {
    const lit = sharesGroup(groupBy, 1, [rows[3]]);
    assert.ok(!lit({sector: "Energy", industry: "Gas"}, 0));
    assert.ok(lit({sector: "Energy", industry: "Oil"}, 0));
  });

  it("unwraps a label record or laid-out node", () => {
    const lit = sharesGroup(groupBy, 0, [{__d3plus__: true, data: rows[3]}]);
    assert.ok(lit({__d3plus__: true, data: legend[1]}, 0));
  });

  it("matches nothing without a key or without rows", () => {
    assert.ok(!sharesGroup(groupBy, 0, [rows[0]])({industry: "Software"}, 0));
    assert.ok(!sharesGroup(groupBy, 0, [{}])({}, 0));
    assert.ok(!sharesGroup(groupBy, 0, [])(legend[0], 0));
    assert.ok(!sharesGroup(groupBy, 0, [rows[0]])(undefined, 0));
  });
});
