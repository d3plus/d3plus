import assert from "assert";

import {buildLegendData} from "../../es/src/charts/features/featuresLegend.js";
import {
  colorCategory,
  legendCategories,
  legendCategoryOf,
  legendMergesIds,
} from "../../es/src/charts/features/legendCategory.js";
import {legendLabel} from "../../es/src/charts/features/legendLabel.js";

/**
    Legend entries that stand for a color category: `color` is a categorical
    key no groupBy level matches, so each entry merges several ids and is
    labelled by its color value.
*/

const countries = [
  {country: "Brazil", region: "Americas"},
  {country: "Chile", region: "Americas"},
  {country: "France", region: "Europe"},
  {country: "Germany", region: "Europe"},
  {country: "Kenya", region: "Africa"},
];

/** A minimal viz grouped by country, colored by `color`. */
function fakeViz(color, data = countries) {
  return {
    _drawDepth: 0,
    _legendData: data,
    _ids: d => [`${d.country}`],
    _drawLabel: d => `${d.country}`,
    schema: {
      aggs: {},
      colorScale: false,
      color,
      groupBy: [d => d.country],
      shape: () => "Circle",
      shapeConfig: {opacity: 1, texture: false},
      legendSort: () => 0,
    },
  };
}

it("colorCategory names categorical values and skips CSS colors", () => {
  assert.strictEqual(colorCategory("Americas"), "Americas");
  assert.strictEqual(colorCategory(3), "3");
  assert.strictEqual(colorCategory(false), "false");
  for (const css of ["#ff0000", "red", "rgb(1, 2, 3)", "hsl(120, 50%, 50%)", "transparent"])
    assert.strictEqual(colorCategory(css), undefined, css);
  for (const none of ["", undefined, null, {a: 1}, ["x"]])
    assert.strictEqual(colorCategory(none), undefined, JSON.stringify(none));
});

it("legendMergesIds is true only when an entry merges several ids", () => {
  const viz = {_legendDepth: 0, schema: {groupBy: [d => d.country]}};
  assert.strictEqual(legendMergesIds(viz, [{country: ["Brazil", "Chile"]}, {country: "France"}]), true);
  assert.strictEqual(legendMergesIds(viz, [{country: "Brazil"}, {country: "France"}]), false);
  assert.strictEqual(legendMergesIds(viz, [{country: ["Brazil"]}]), false, "a one-id array merges nothing");
  assert.strictEqual(legendMergesIds({schema: {groupBy: []}}, [{country: ["a", "b"]}]), false);
});

it("legendCategories maps each entry to its category, or returns undefined", () => {
  const a = {id: 1}, b = {id: 2};
  const map = legendCategories([{datum: a, color: "Americas"}, {datum: b, color: "Europe"}]);
  assert.strictEqual(map.get(a), "Americas");
  assert.strictEqual(map.get(b), "Europe");
  assert.strictEqual(
    legendCategories([{datum: a, color: "#ff0000"}, {datum: b, color: "Europe"}]),
    undefined,
    "a CSS color names no category",
  );
  assert.strictEqual(
    legendCategories([{datum: a, color: "Europe"}, {datum: b, color: "Europe"}]),
    undefined,
    "two entries can't share a category label",
  );
  assert.strictEqual(legendCategories([{datum: a, color: undefined}]), undefined);
});

it("legendCategoryOf unwraps legend wrappers and needs a category map", () => {
  const d = {region: "Americas"};
  const viz = {_legendCategories: new WeakMap([[d, "Americas"]])};
  assert.strictEqual(legendCategoryOf(viz, d), "Americas");
  const wrapped = {__d3plus__: true, data: {__d3plus__: true, data: d}};
  assert.strictEqual(legendCategoryOf(viz, wrapped), "Americas");
  assert.strictEqual(legendCategoryOf(viz, {region: "Europe"}), undefined);
  assert.strictEqual(legendCategoryOf(viz, undefined), undefined);
  assert.strictEqual(legendCategoryOf({}, d), undefined);
});

it("legendLabel reads a category entry as its category, and others by groupBy", () => {
  const d = {country: ["Brazil", "Chile"], region: "Americas"};
  const viz = {
    _legendDepth: 0,
    _legendCategories: new WeakMap([[d, "Americas"]]),
    _drawLabel: x => `label:${x.country}`,
  };
  assert.strictEqual(legendLabel.call(viz, d, 0), "Americas");
  assert.strictEqual(legendLabel.call(viz, {country: "France"}, 1), "label:France");
});

it("buildLegendData labels entries by a color key outside groupBy", () => {
  const viz = fakeViz(d => d.region);
  const {legendData} = buildLegendData(viz);
  assert.strictEqual(legendData.length, 3);
  assert.ok(viz._legendCategories, "category entries");
  assert.deepStrictEqual(
    legendData.map(d => viz._legendCategories.get(d)).sort(),
    ["Africa", "Americas", "Europe"],
  );
});

it("buildLegendData sorts category entries with the categories in hand", () => {
  const viz = fakeViz(d => d.region);
  viz.schema.legendSort = (a, b) =>
    viz._legendCategories.get(a).localeCompare(viz._legendCategories.get(b));
  const {legendData} = buildLegendData(viz);
  assert.deepStrictEqual(
    legendData.map(d => d.region),
    ["Africa", "Americas", "Europe"],
  );
});

it("buildLegendData keeps groupBy labels when the color matches a groupBy level", () => {
  const viz = fakeViz(d => d.country);
  buildLegendData(viz);
  assert.strictEqual(viz._legendCategories, undefined);
});

it("buildLegendData names no category for CSS color values", () => {
  const hex = {Americas: "#ff0000", Europe: "#0000ff", Africa: "#00ff00"};
  const viz = fakeViz(d => hex[d.region]);
  const {legendData} = buildLegendData(viz);
  assert.strictEqual(legendData.length, 3, "still one entry per color");
  assert.strictEqual(viz._legendCategories, undefined);
});
