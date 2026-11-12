import {describe, it} from "vitest";
import assert from "assert";

import {GROUP_DEPTH_KEY} from "../../src/charts/viz/groupRow.ts";
import {
  tooltipEnabled,
  tooltipLevels,
} from "../../src/charts/viz/tooltipEnabled.ts";
import {partitionShapeDepth} from "../../src/charts/partition/chartFields.ts";
import {treeDef} from "../../src/charts/Tree/index.ts";

const groupBy = [d => d.region, d => d.state];
const row = {region: "West", state: "Oregon"};

/** A chart stand-in: `groupBy`, a `tooltip` setting, and the drawn levels. */
const host = (tooltip, rest = {}) => ({
  schema: {groupBy, tooltip},
  _drawDepth: 0,
  ...rest,
});

describe("tooltipLevels", () => {
  it("reports the level the chart draws and the deepest level", () => {
    assert.deepStrictEqual(tooltipLevels(host(), row), {
      depth: 0,
      maxDepth: 1,
      legend: false,
    });
    assert.deepStrictEqual(tooltipLevels(host(null, {_drawDepth: 1}), row), {
      depth: 1,
      maxDepth: 1,
      legend: false,
    });
  });

  it("is 0 of 0 with a single groupBy level, or none", () => {
    const single = {schema: {groupBy: [groupBy[0]]}, _drawDepth: 0};
    assert.deepStrictEqual(tooltipLevels(single, row), {
      depth: 0,
      maxDepth: 0,
      legend: false,
    });
    assert.deepStrictEqual(tooltipLevels({schema: {}}, row), {
      depth: 0,
      maxDepth: 0,
      legend: false,
    });
  });

  it("prefers a group row's own level over the drawn one", () => {
    const viz = host(null, {_drawDepth: 1});
    const header = {region: "West", [GROUP_DEPTH_KEY]: 0};
    assert.strictEqual(tooltipLevels(viz, header).depth, 0);
    const label = {__d3plus__: true, data: header};
    assert.strictEqual(tooltipLevels(viz, label).depth, 0);
  });

  it("prefers the level the chart reports for a shape", () => {
    const parent = {region: "West"};
    const viz = host(null, {
      _drawDepth: 1,
      _shapeDepth: d => (d === parent ? 0 : undefined),
    });
    assert.strictEqual(tooltipLevels(viz, parent).depth, 0);
    assert.strictEqual(tooltipLevels(viz, row).depth, 1, "falls back");
  });

  it("gives a legend entry the level its label is read at", () => {
    const viz = host(null, {
      _drawDepth: 1,
      _legendDepth: 0,
      _shapeDepth: () => 1,
    });
    assert.strictEqual(tooltipLevels(viz, row, true).depth, 0);
    assert.strictEqual(tooltipLevels(viz, row).depth, 1);
    const unset = host(null, {_drawDepth: 1});
    assert.strictEqual(tooltipLevels(unset, row, true).depth, 1, "falls back");
  });

  it("says whether the item is a legend entry", () => {
    const viz = host(null, {_legendDepth: 0});
    assert.strictEqual(tooltipLevels(viz, row, true).legend, true);
    assert.strictEqual(tooltipLevels(viz, row, false).legend, false);
    assert.strictEqual(tooltipLevels(viz, row).legend, false);
  });

  it("keeps depth within 0 and maxDepth", () => {
    assert.strictEqual(
      tooltipLevels(host(null, {_shapeDepth: () => -1}), row).depth,
      0,
    );
    assert.strictEqual(
      tooltipLevels(host(null, {_shapeDepth: () => 5}), row).depth,
      1,
    );
  });

  it("handles a missing datum", () => {
    const viz = host(null, {
      _shapeDepth: () => assert.fail("not asked without a datum"),
    });
    assert.deepStrictEqual(tooltipLevels(viz, undefined), {
      depth: 0,
      maxDepth: 1,
      legend: false,
    });
  });
});

describe("tooltipEnabled", () => {
  it("returns a boolean setting as-is", () => {
    assert.strictEqual(tooltipEnabled(host(true), row, 0), true);
    assert.strictEqual(tooltipEnabled(host(false), row, 0), false);
    assert.strictEqual(tooltipEnabled(host(undefined), row, 0), false);
  });

  it("calls the accessor with the datum, index, and levels", () => {
    const calls = [];
    const viz = host((...args) => (calls.push(args), true), {_drawDepth: 1});
    assert.strictEqual(tooltipEnabled(viz, row, 3), true);
    assert.deepStrictEqual(calls, [
      [row, 3, {depth: 1, maxDepth: 1, legend: false}],
    ]);
    assert.strictEqual(tooltipEnabled(viz, row, 3, true), true);
    assert.deepStrictEqual(calls[1], [
      row,
      3,
      {depth: 1, maxDepth: 1, legend: true},
    ]);
  });

  it("leaves a two-argument accessor's result unchanged", () => {
    const viz = host((d, i) => d.state === "Oregon" && i === 2);
    assert.strictEqual(tooltipEnabled(viz, row, 2), true);
    assert.strictEqual(tooltipEnabled(viz, row, 1), false);
    assert.strictEqual(tooltipEnabled(viz, {state: "Utah"}, 2), false);
  });

  it("coerces the accessor's result to a boolean", () => {
    assert.strictEqual(
      tooltipEnabled(
        host(() => "yes"),
        row,
        0,
      ),
      true,
    );
    assert.strictEqual(
      tooltipEnabled(
        host(() => 0),
        row,
        0,
      ),
      false,
    );
  });

  it("shows only the deepest level with depth === maxDepth", () => {
    const deepest = (d, i, {depth, maxDepth}) => depth === maxDepth;
    assert.strictEqual(tooltipEnabled(host(deepest), row, 0), false);
    assert.strictEqual(
      tooltipEnabled(host(deepest, {_drawDepth: 1}), row, 0),
      true,
    );
  });

  it("passes a legend entry's own level", () => {
    const deepest = (d, i, {depth, maxDepth}) => depth === maxDepth;
    const viz = host(deepest, {_drawDepth: 1, _legendDepth: 0});
    assert.strictEqual(tooltipEnabled(viz, row, 0, true), false);
    assert.strictEqual(tooltipEnabled(viz, row, 0), true);
  });
});

describe("partitionShapeDepth", () => {
  const leaf = {region: "West", state: "Oregon"};
  const parent = {region: "West"};
  const viz = {
    ctx: {
      sunburstNodes: new Map([
        [leaf, {level: 1}],
        [parent, {level: 0}],
      ]),
    },
  };
  const shapeDepth = partitionShapeDepth({prefix: "sunburst"});

  it("reads the level of the node a row is laid out as", () => {
    assert.strictEqual(shapeDepth(viz, leaf), 1);
    assert.strictEqual(shapeDepth(viz, parent), 0);
    assert.strictEqual(shapeDepth(viz, {__d3plus__: true, data: parent}), 0);
  });

  it("is undefined for a row that is not a node", () => {
    assert.strictEqual(shapeDepth(viz, {region: "East"}), undefined);
    assert.strictEqual(shapeDepth({ctx: {}}, leaf), undefined);
  });
});

describe("Tree shapeDepth", () => {
  it("turns a row's stamped hierarchy depth into its groupBy level", () => {
    assert.strictEqual(treeDef.shapeDepth({}, {__d3plusDepth: 1}), 0);
    assert.strictEqual(treeDef.shapeDepth({}, {__d3plusDepth: 2}), 1);
    assert.strictEqual(
      treeDef.shapeDepth({}, {__d3plus__: true, data: {__d3plusDepth: 2}}),
      1,
    );
  });

  it("reads past a depth field of the row's own", () => {
    assert.strictEqual(
      treeDef.shapeDepth({}, {depth: 300, __d3plusDepth: 2}),
      1,
    );
  });

  it("is undefined for a row without one", () => {
    assert.strictEqual(treeDef.shapeDepth({}, {id: "a"}), undefined);
    assert.strictEqual(treeDef.shapeDepth({}, {id: "a", depth: 2}), undefined);
  });
});
