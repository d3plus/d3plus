import {it} from "vitest";
import assert from "assert";
import {
  mergeStackOrder,
  plotSeriesIds,
  poolStackPositions,
  recordStackLegendOrder,
  stackLegendSort,
  stackPositions,
  stackReadingOrder,
} from "../../src/charts/Plot/stackLegendOrder.ts";
import {plotFacetChrome} from "../../src/charts/Plot/plotFacet.ts";

const byId = (a, b) => a.id.localeCompare(b.id);

/** A minimal chart: groupBy accessors per level, drawn at `depth`. */
const viz = ({groupBy = ["id"], depth = 0, stacked = true, ...rest} = {}) => ({
  _drawDepth: depth,
  schema: {groupBy: groupBy.map(key => d => d[key]), stacked},
  ...rest,
});

/** Plain positions as `[series, mean]` pairs. */
const means = positions =>
  Array.from(positions, ([s, {total, count}]) => [s, total / count]);

it("stackPositions — a vertical stack reads top first", () => {
  // Two groups; A on the bottom, B in the middle, C on top.
  const data = [
    [
      [0, 10],
      [0, 5],
    ],
    [
      [10, 15],
      [5, 20],
    ],
    [
      [15, 16],
      [20, 30],
    ],
  ];
  const positions = stackPositions(data, ["A", "B", "C"], k => k, false);
  assert.deepStrictEqual(means(positions), [
    ["C", 1 / 6],
    ["B", 0.5],
    ["A", 5 / 6],
  ]);
});

it("stackPositions — a horizontal stack reads left first", () => {
  const data = [[[0, 10]], [[10, 15]], [[15, 16]]];
  const positions = stackPositions(data, ["A", "B", "C"], k => k, true);
  assert.deepStrictEqual(stackReadingOrder(positions), ["A", "B", "C"]);
});

it("stackPositions — reads where segments sit, not their stack index", () => {
  // A diverging stack: B is negative and sits below the baseline.
  const data = [[[0, 10]], [[-8, 0]], [[10, 12]]];
  const positions = stackPositions(data, ["A", "B", "C"], k => k, false);
  assert.deepStrictEqual(stackReadingOrder(positions), ["C", "A", "B"]);
});

it("stackPositions — skips empty and unplaced segments", () => {
  const data = [
    [
      [0, 0],
      [0, 4],
    ],
    [
      [0, 3],
      [4, NaN],
    ],
    [
      [3, 5],
      [4, 6],
    ],
  ];
  const positions = stackPositions(
    data,
    ["A", "B", "C"],
    k => (k === "C" ? undefined : k),
    false,
  );
  // Group 0: B alone (A is empty); group 1: A alone (B isn't finite).
  assert.deepStrictEqual(means(positions), [
    ["B", 0.5],
    ["A", 0.5],
  ]);
});

it("stackPositions — maps each stack key to its series", () => {
  // Bar segments are keyed per bar; both belong to series A.
  const data = [[[0, 2]], [[2, 3]], [[3, 4]]];
  const series = {A_1: "A", B_1: "B", A_2: "A"};
  const positions = stackPositions(
    data,
    ["A_1", "B_1", "A_2"],
    k => series[k],
    false,
  );
  assert.deepStrictEqual(means(positions), [
    ["A", (1 / 6 + 5 / 6) / 2],
    ["B", 0.5],
  ]);
  assert.deepStrictEqual(stackPositions([], [], k => k, false).size, 0);
});

it("poolStackPositions — sums each series across sets", () => {
  const a = new Map([
    ["A", {total: 0.25, count: 1}],
    ["B", {total: 0.75, count: 1}],
  ]);
  const b = new Map([["B", {total: 0.25, count: 2}]]);
  assert.deepStrictEqual(means(poolStackPositions([a, b])), [
    ["A", 0.25],
    ["B", 1 / 3],
  ]);
  assert.strictEqual(poolStackPositions([]).size, 0);
});

it("stackReadingOrder — by mean position, ties in listed order", () => {
  const positions = new Map([
    ["A", {total: 1.5, count: 2}],
    ["B", {total: 0.25, count: 1}],
    ["C", {total: 0.75, count: 1}],
  ]);
  assert.deepStrictEqual(stackReadingOrder(positions), ["B", "A", "C"]);
});

it("mergeStackOrder — keeps left-out series after the series they followed", () => {
  const previous = ["A", "B", "C", "D"];
  assert.deepStrictEqual(
    mergeStackOrder(previous, ["A", "C", "D"], new Set(previous)),
    ["A", "B", "C", "D"],
  );
  assert.deepStrictEqual(
    mergeStackOrder(previous, ["C"], new Set(previous)),
    ["A", "B", "C", "D"],
    "the series before the first drawn one lead",
  );
  assert.deepStrictEqual(
    mergeStackOrder(previous, ["D", "A", "C"], new Set(previous)),
    ["D", "A", "B", "C"],
    "the drawn order wins for drawn series",
  );
  assert.deepStrictEqual(
    mergeStackOrder(previous, ["A", "C"], new Set(["A", "C", "D"])),
    ["A", "C", "D"],
    "series no longer in the legend drop out",
  );
  assert.deepStrictEqual(mergeStackOrder([], ["B", "A"], new Set()), [
    "B",
    "A",
  ]);
});

it("plotSeriesIds — joins groupBy values to the drawn depth", () => {
  const chart = viz({groupBy: ["region", "country"], depth: 1});
  assert.deepStrictEqual(
    plotSeriesIds(chart, {region: "Asia", country: "India"}, 0),
    ["Asia_India"],
  );
  assert.deepStrictEqual(
    plotSeriesIds(chart, {region: "Asia", country: ["China", "India"]}, 0),
    ["Asia_China", "Asia_India"],
    "a merged entry stands for each of its series",
  );
  assert.deepStrictEqual(
    plotSeriesIds(
      viz({groupBy: ["region", "country"]}),
      {region: "Asia", country: "India"},
      0,
    ),
    ["Asia"],
    "levels below the drawn depth don't count",
  );
  assert.deepStrictEqual(plotSeriesIds(viz(), {}, 0), ["undefined"]);
  assert.deepStrictEqual(plotSeriesIds(viz({groupBy: []}), {}, 0), [""]);
});

it("recordStackLegendOrder — records, merges, and clears the order", () => {
  const chart = viz({
    _legendData: ["A", "B", "C"].map(id => ({id})),
  });
  const positions = order =>
    new Map(order.map((s, i) => [s, {total: i, count: 1}]));
  recordStackLegendOrder(chart, positions(["B", "A", "C"]));
  assert.deepStrictEqual(chart._stackLegendOrder, ["B", "A", "C"]);
  // A hidden: it keeps its place after B.
  recordStackLegendOrder(chart, positions(["B", "C"]));
  assert.deepStrictEqual(chart._stackLegendOrder, ["B", "A", "C"]);
  recordStackLegendOrder(chart, undefined);
  assert.strictEqual(chart._stackLegendOrder, undefined);
  recordStackLegendOrder(chart, new Map());
  assert.strictEqual(chart._stackLegendOrder, undefined);
});

it("stackLegendSort — the stack order first, then the fallback", () => {
  const chart = viz({_stackLegendOrder: ["C", "A", "B"]});
  const sort = stackLegendSort(chart, byId);
  const entries = ["A", "B", "C", "D"].map(id => ({id}));
  assert.deepStrictEqual(
    entries
      .slice()
      .sort(sort)
      .map(d => d.id),
    ["C", "A", "B", "D"],
    "an entry the stacks don't place comes last",
  );
  chart._stackLegendOrder = ["B", "A"];
  assert.deepStrictEqual(
    entries
      .slice()
      .sort(sort)
      .map(d => d.id),
    ["B", "A", "C", "D"],
    "a new order replaces the cached one",
  );
  chart.schema.stacked = false;
  assert.deepStrictEqual(
    entries
      .slice()
      .sort(sort)
      .map(d => d.id),
    ["A", "B", "C", "D"],
    "an unstacked chart sorts by the fallback alone",
  );
});

it("stackLegendSort — a merged entry sits at its series' mean place", () => {
  const chart = viz({
    groupBy: ["side", "id"],
    depth: 1,
    _stackLegendOrder: ["L_Rural", "L_Urban", "R_Urban", "R_Rural", "R_Other"],
  });
  const sort = stackLegendSort(chart, byId);
  const rural = {side: ["L", "R"], id: "Rural"};
  const urban = {side: ["L", "R"], id: "Urban"};
  const other = {side: "R", id: "Other"};
  assert.strictEqual(
    sort(rural, urban),
    -1,
    "tied at 1.5: the fallback decides",
  );
  assert.ok(sort(urban, other) < 0);
  assert.ok(sort(other, urban) > 0);
});

it("plotFacetChrome — clears the order of an unstacked chart", () => {
  const chart = viz({stacked: false, _stackLegendOrder: ["A"]});
  plotFacetChrome(chart, [[{id: "A"}]]);
  assert.strictEqual(chart._stackLegendOrder, undefined);
});
