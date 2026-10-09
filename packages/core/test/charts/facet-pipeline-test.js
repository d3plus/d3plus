import assert from "assert";
import it from "../jsdom.js";
import {BarChart, Pie, RESET, Treemap} from "../../es/index.js";
import {
  computeFilteredData,
  computeTimeFilter,
  facetFilteredData,
  facetTimeFilter,
  vizDraw,
  vizPreDraw,
} from "../../es/internal.js";

/**
    The pipeline seams small multiples hook into: the `facet` / `facetConfig`
    accessors, per-panel data prep through the chart's own rollup and
    threshold, the shared time filter, the chrome-free panel step of
    `vizDraw`, and the chart hooks each chart family supplies.
*/

const rows = [
  {region: "East", id: "a", year: 2020, value: 1},
  {region: "East", id: "a", year: 2021, value: 2},
  {region: "East", id: "b", year: 2021, value: 3},
  {region: "West", id: "a", year: 2021, value: 4},
  {region: "West", id: "b", year: 2020, value: 5},
];

it("facet: a key or accessor turns small multiples on, false turns them off", () => {
  const chart = new BarChart();
  assert.strictEqual(chart.facet(), undefined);
  assert.strictEqual(chart.facet("region"), chart, "chains");
  assert.strictEqual(chart.facet()({region: "East"}), "East");
  const fn = d => d.id;
  assert.strictEqual(chart.facet(fn).facet(), fn);
  assert.strictEqual(chart.facet(false).facet(), undefined);
  assert.strictEqual(chart.config({facet: "id"}).facet()({id: "z"}), "z", "config() routes through the accessor");
});

it("facetConfig: merges into the current config", () => {
  const chart = new Treemap();
  assert.deepStrictEqual(chart.facetConfig(), {});
  chart.facetConfig({columns: 3, sort: ["b", "a"]}).facetConfig({padding: 8});
  assert.deepStrictEqual(chart.facetConfig(), {columns: 3, sort: ["b", "a"], padding: 8});
});

it("facetConfig: deep-merges into a fresh object, nested values keeping their siblings", () => {
  const chart = new Treemap().facetConfig({titleConfig: {fontSize: 20, fontWeight: 300}, sort: ["b", "a"]});
  const before = chart.facetConfig();
  chart.facetConfig({titleConfig: {fontSize: 9}, sort: ["c"]});
  const after = chart.facetConfig();
  assert.notStrictEqual(after, before, "a fresh object");
  assert.deepStrictEqual(after.titleConfig, {fontSize: 9, fontWeight: 300});
  assert.deepStrictEqual(after.sort, ["c"], "arrays replace");
  assert.deepStrictEqual(before.titleConfig, {fontSize: 20, fontWeight: 300}, "the old value is untouched");
});

it("facetConfig: RESET restores the default, at the top or at any depth", () => {
  const chart = new Treemap().config({facetConfig: {columns: 2, titleConfig: {fontSize: 20, fontWeight: 300}}});
  chart.config({facetConfig: {titleConfig: {fontSize: RESET}}});
  assert.deepStrictEqual(chart.facetConfig(), {columns: 2, titleConfig: {fontWeight: 300}});
  chart.config({facetConfig: {columns: RESET}});
  assert.deepStrictEqual(chart.facetConfig(), {titleConfig: {fontWeight: 300}});
  chart.config({facetConfig: RESET});
  assert.deepStrictEqual(chart.facetConfig(), {});
  chart.config({facet: "region"}).config({facet: RESET});
  assert.strictEqual(chart.facet(), undefined, "facet resets to off");
});

it("computeFilteredData: rolls up the rows it's given, indexing them in the chart's data", () => {
  const chart = new Treemap().data(rows).groupBy("id").sum("value");
  vizPreDraw(chart);
  const out = {};
  computeFilteredData(chart, out, chart._drawDepth, chart._id, undefined, rows.filter(d => d.region === "West"));
  assert.deepStrictEqual(out.filteredData.map(d => [d.id, d.value]).sort(), [["a", 4], ["b", 5]]);
  const all = {};
  computeFilteredData(chart, all, chart._drawDepth, chart._id, undefined);
  assert.deepStrictEqual(all.filteredData.map(d => [d.id, d.value]).sort(), [["a", 7], ["b", 8]], "defaults to the chart's data");
});

it("computeTimeFilter / facetTimeFilter: the latest period of the whole dataset", () => {
  const chart = new Treemap().data(rows).groupBy("id").sum("value").time("year");
  vizPreDraw(chart);
  for (const filter of [computeTimeFilter(chart), facetTimeFilter(chart)]) {
    assert.strictEqual(filter({year: 2021}, 0), true);
    assert.strictEqual(filter({year: 2020}, 0), false);
  }
  assert.strictEqual(computeTimeFilter(new Treemap().data(rows)), undefined, "no time accessor, no filter");
});

it("facetFilteredData: a panel's rows through the shared time filter, rollup, hide/solo, and threshold", () => {
  const chart = new Treemap().data(rows).groupBy("id").sum("value").time("year");
  vizPreDraw(chart);
  const filter = facetTimeFilter(chart);
  const west = facetFilteredData(chart, rows.filter(d => d.region === "West"), filter);
  assert.deepStrictEqual(west.map(d => [d.id, d.value]), [["a", 4]], "West has no 2021 b row");
  chart._hidden = ["a"];
  const east = facetFilteredData(chart, rows.filter(d => d.region === "East"), filter);
  assert.deepStrictEqual(east.map(d => [d.id, d.value]), [["b", 3]], "a hidden series leaves every panel");
  assert.deepStrictEqual(facetFilteredData(chart, [], filter), []);
});

it("vizDraw: a panel step resets the chart body and lays out no chrome", () => {
  const margin = {top: 30, right: 40, bottom: 50, left: 60};
  const panels = ["title-panel"];
  const viz = {
    _facetStep: "panel",
    _margin: margin,
    _featurePanels: panels,
    _chartScene: [{key: "old"}],
    _chartTransform: {x: 1, y: 1},
    _shapes: ["shape"],
  };
  vizDraw(viz);
  assert.strictEqual(viz._margin, margin, "margins are the panel's, untouched");
  assert.strictEqual(viz._featurePanels, panels, "the chrome panels are kept");
  assert.deepStrictEqual(viz._chartScene, []);
  assert.strictEqual(viz._chartTransform, undefined);
  assert.deepStrictEqual(viz._shapes, []);
});

it("chart hooks: Plot shares scales; radial charts ask for square panels; others draw as-is", () => {
  const bar = new BarChart()._facetHooks();
  assert.strictEqual(bar.aspect, 4 / 3);
  for (const hook of ["share", "panel", "insets", "capture"])
    assert.strictEqual(typeof bar[hook], "function", `BarChart has ${hook}`);
  assert.strictEqual(new Pie()._facetHooks().aspect, 1);
  assert.deepStrictEqual(new Treemap()._facetHooks(), {});
});
