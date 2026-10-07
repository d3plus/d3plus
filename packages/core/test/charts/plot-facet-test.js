/* global describe */
import assert from "assert";
import {scaleLinear, scalePoint} from "d3-scale";
import {
  applyPaddedDomains,
  listAxis,
  panelAxisConfig,
  plotFacetHooks,
  plotFacetInsets,
  plotFacetPanel,
  unionExtent,
} from "../../es/internal.js";

/**
    Plot's small-multiple hooks: which axes share a value list vs an extent,
    the shared domain union, per-panel axis labels, and the plot-area insets
    the outer-label gutter is measured from.
*/

describe("Plot facet helpers", () => {
  it("listAxis: category axes (discrete, non-time) and sorted axes list values; others are extents", () => {
    const viz = (schema, extra = {}) => ({schema: {discrete: "x", ...schema}, ...extra});
    assert.strictEqual(listAxis(viz({}), "x"), true);
    assert.strictEqual(listAxis(viz({}), "x2"), true, "the secondary axis follows its primary");
    assert.strictEqual(listAxis(viz({}), "y"), false);
    assert.strictEqual(listAxis(viz({}, {_xTime: true}), "x"), false, "a time axis is an extent");
    assert.strictEqual(listAxis(viz({ySort: () => 0}), "y"), true);
    assert.strictEqual(listAxis(viz({}, {_discreteExtent: () => [0, 1]}), "x"), false, "a span axis is an extent");
  });

  it("unionExtent: spans every extent, skipping non-numeric values and keeping dates", () => {
    assert.deepStrictEqual(unionExtent([[5, 10], [0, 7], [NaN, 12]]), [0, 12]);
    const a = new Date(2020, 0, 1), b = new Date(2021, 0, 1), c = new Date(2022, 0, 1);
    assert.deepStrictEqual(unionExtent([[b, c], [a, b]]), [a, c]);
    assert.strictEqual(unionExtent([[], [undefined]]), undefined);
  });

  it("panelAxisConfig: hides labels and title, always setting both keys", () => {
    const config = {title: "Sales", ticks: [1]};
    assert.deepStrictEqual(panelAxisConfig(config, false), {title: false, ticks: [1], labels: []});
    assert.deepStrictEqual(panelAxisConfig(config, true), {title: "Sales", ticks: [1], labels: undefined});
    assert.deepStrictEqual(panelAxisConfig(undefined, false), {labels: [], title: false});
  });

  it("plotFacetPanel: applies shared scales and label visibility, and undoes them", () => {
    const resets = [];
    const axis = name => ({config: c => resets.push([name, c])});
    const viz = {_xConfig: {title: "Year"}, _yConfig: {title: "Sales"}, _xAxis: axis("x"), _yAxis: axis("y")};
    const scales = {domains: {y: [0, 9]}, padded: {}};
    const undo = plotFacetPanel(viz, {shared: true, scales, labels: {x: true, y: false}});
    assert.strictEqual(viz._plotFacetScales, scales);
    assert.deepStrictEqual(viz._xConfig, {title: "Year", labels: undefined});
    assert.deepStrictEqual(viz._yConfig, {title: false, labels: []});
    undo();
    assert.strictEqual(viz._plotFacetScales, undefined);
    assert.deepStrictEqual(viz._yConfig, {title: "Sales"});
    assert.deepStrictEqual(resets, [["x", {labels: undefined, title: "Year"}], ["y", {labels: undefined, title: "Sales"}]]);
    plotFacetPanel(viz, {shared: false, scales, labels: {x: true, y: true}});
    assert.strictEqual(viz._plotFacetScales, undefined, "independent scales share nothing");
  });

  it("plotFacetInsets: the plot area's insets from the chart area on every side", () => {
    const viz = {
      schema: {width: 400, height: 300},
      _margin: {top: 10, left: 20, right: 30, bottom: 30},
      _chartTransform: {x: 20, y: 10},
      _plotArea: {x: 40, y: 5, width: 100, height: 200},
    };
    assert.deepStrictEqual(plotFacetInsets(viz), {top: 5, right: 400 - 30 - 160, bottom: 300 - 30 - 215, left: 40});
    assert.deepStrictEqual(plotFacetInsets({_margin: {}}), {top: 0, right: 0, bottom: 0, left: 0});
  });

  it("plotFacetHooks: square-ish panels a little wider than tall, sharing scales and measuring insets", () => {
    assert.strictEqual(plotFacetHooks.aspect, 4 / 3);
    assert.strictEqual(plotFacetHooks.insets, plotFacetInsets);
    assert.strictEqual(plotFacetHooks.panel, plotFacetPanel);
    assert.strictEqual(plotFacetHooks.gutter, undefined);
  });

  it("plotFacetHooks.capture: the per-panel state Plot's hover reads", () => {
    const viz = {_plotArea: 1, _plotAxisDomains: 2, _xFunc: 3, _yFunc: 4, _trendFits: 5, _other: 6};
    assert.deepStrictEqual(plotFacetHooks.capture(viz), {_plotArea: 1, _plotAxisDomains: 2, _xFunc: 3, _yFunc: 4, _trendFits: 5});
  });

  it("applyPaddedDomains: continuous scales take the shared padded domain; others are untouched", () => {
    const x = scalePoint().domain(["a", "b"]);
    const y = scaleLinear().domain([0, 5]);
    const scales = {x, y, xScale: "Point"};
    assert.strictEqual(applyPaddedDomains({}, scales), scales, "no shared scales: unchanged");
    const out = applyPaddedDomains({_plotFacetScales: {padded: {x: [0, 1], y: [10, -2]}}}, scales);
    assert.strictEqual(out.x, x, "a point scale keeps its own domain");
    assert.deepStrictEqual(out.y.domain(), [10, -2]);
    assert.deepStrictEqual(y.domain(), [0, 5], "the panel's scale is copied, not mutated");
    assert.strictEqual(out.xScale, "Point");
  });
});
