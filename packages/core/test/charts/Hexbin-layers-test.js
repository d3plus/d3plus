import {it} from "vitest";
import assert from "assert";
import {scaleLinear} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {Hexbin} from "../../index.ts";
import {
  binAriaLabel,
  binPoints,
  binsInView,
  colorRows,
  colorScaleRows,
  contourAriaLabel,
  estimatedColorRows,
  hexbinBuffer,
  hexbinMeta,
  hexbinRow,
  hexbinSettings,
  hexbinState,
  hexbinTooltipRows,
  hexbinTooltipTitle,
  hexbinValue,
  noteDrawRows,
  pixelPoints,
  plotFrame,
  pointPath,
  refreshColorScale,
  sharedColorRows,
} from "../../internal.ts";

useJsdom();

const pt = (x, y) => ({x, y, row: {x, y}});
const frame = {left: 0, top: 0, width: 200, height: 200};

/** A Hexbin with its draw-time rows set, as the pipeline leaves them. */
const chart = (rows, config = {}) => {
  const viz = new Hexbin().data(rows).x("x").y("y").config(config);
  viz._filteredData = rows;
  return viz;
};

it("plotFrame: the plot area in shape coordinates", () => {
  assert.deepStrictEqual(
    plotFrame({xRange: [10, 110], yRange: [5, 105], x2Height: 5}),
    {left: 10, top: 0, width: 100, height: 100},
  );
  assert.deepStrictEqual(plotFrame({xRange: [0, 50], yRange: [0, 40]}), {
    left: 0,
    top: 0,
    width: 50,
    height: 40,
  });
});

it("binsInView: the bins reaching into the plot area", () => {
  const bins = binPoints([pt(5, 5), pt(55, 55), pt(250, 20), pt(-30, 20)], {
    shape: "square",
    size: 10,
  });
  const inView = binsInView(
    bins,
    {left: 0, top: 0, width: 100, height: 100},
    {shape: "square", size: 10},
  );
  assert.deepStrictEqual(inView.map(b => b.key).sort(), ["s0_0", "s5_5"]);
  // Row 1's hexagons sit at x = 8.66 ± 17.32k: one centered at -8.66
  // reaches 8.66px right of its center, past a plot edge at -5.
  const edge = binPoints([pt(-8.66, 15)], {shape: "hex", size: 10});
  assert.strictEqual(edge[0].cx.toFixed(2), "-8.66");
  assert.strictEqual(
    binsInView(
      edge,
      {left: -5, top: 0, width: 100, height: 100},
      {shape: "hex", size: 10},
    ).length,
    1,
    "a hexagon centered outside still reaches in",
  );
});

it("pointPath: one dot per placed point", () => {
  assert.strictEqual(
    pointPath([pt(10, 10), pt(NaN, 4)], 2),
    "M8,10a2,2 0 1,0 4,0a2,2 0 1,0 -4,0",
  );
  assert.strictEqual(pointPath([], 2), "");
});

it("pixelPoints: a shape group's rows placed in pixels, with their weights", () => {
  const rows = [
    {x: 1, y: 2, i: 0, data: {v: 5}},
    {x: 3, y: 4, i: 1, data: {v: "x"}},
  ];
  const ctx = {values: rows, x: v => v * 10, y: v => 100 - v};
  assert.deepStrictEqual(pixelPoints(ctx, {}), [
    {x: 10, y: 98, row: {v: 5}, weight: undefined},
    {x: 30, y: 96, row: {v: "x"}, weight: undefined},
  ]);
  const weighted = pixelPoints(ctx, {weight: d => d.v});
  assert.strictEqual(weighted[0].weight, 5);
  assert.ok(Number.isNaN(weighted[1].weight));
});

it("colorRows: bins, or contour levels when no bins are drawn", () => {
  const points = [];
  for (let i = 0; i < 60; i++) points.push(pt(100 + (i % 6), 100 + (i % 5)));
  const viz = new Hexbin();
  const bins = colorRows(points, frame, [0, 0], hexbinSettings(viz));
  assert.ok(bins.length > 0);
  assert.ok(bins.every(r => hexbinMeta(r).kind === "bin"));
  assert.strictEqual(
    bins.reduce((s, r) => s + hexbinValue(r), 0),
    60,
    "every point in a bin",
  );
  viz
    .binShape(false)
    .contours(true)
    .contourConfig({thresholds: [1, 2]});
  const levels = colorRows(points, frame, [0, 0], hexbinSettings(viz));
  assert.deepStrictEqual(levels.map(hexbinValue), [1, 2]);
  viz.contours(false);
  assert.deepStrictEqual(
    colorRows(points, frame, [0, 0], hexbinSettings(viz)),
    [],
  );
});

it("noteDrawRows: the grid anchor, and each panel's rows with small multiples", () => {
  const rows = [
    {x: 4, y: 9, g: "a"},
    {x: 2, y: 12, g: "b"},
    {x: "?", y: 1, g: "a"},
  ];
  const viz = chart(rows);
  noteDrawRows(viz);
  assert.deepStrictEqual(hexbinState(viz).anchor, [2, 1]);
  assert.strictEqual(hexbinState(viz).panels, undefined);
  viz.facet("g");
  noteDrawRows(viz);
  assert.deepStrictEqual(
    hexbinState(viz).panels.map(p => p.length),
    [2, 1],
  );
  viz._filteredData = [];
  noteDrawRows(viz);
  assert.strictEqual(hexbinState(viz).anchor, undefined);
});

it("sharedColorRows: a panel's colorScale rows cover every panel", () => {
  const rows = [
    {x: 1, y: 1, g: "a"},
    {x: 1, y: 1, g: "a"},
    {x: 50, y: 50, g: "b"},
  ];
  const viz = chart(rows).facet("g");
  noteDrawRows(viz);
  const own = [hexbinRow("bin-x", {kind: "bin", value: 2})];
  const ctx = {viz, x: v => v, y: v => v};
  const settings = hexbinSettings(viz);
  assert.strictEqual(
    sharedColorRows(ctx, own, frame, [0, 0], settings),
    own,
    "outside a panel draw: the panel's own rows",
  );
  viz._facetStep = "panel";
  const shared = sharedColorRows(ctx, own, frame, [0, 0], settings);
  assert.deepStrictEqual(shared.map(hexbinValue).sort(), [1, 2]);
  hexbinState(viz).panels = undefined;
  assert.strictEqual(sharedColorRows(ctx, own, frame, [0, 0], settings), own);
});

it("estimatedColorRows: bins measured in a plot area estimated from the chart's size", () => {
  const rows = [];
  for (let i = 0; i < 50; i++) rows.push({x: i % 5, y: Math.floor(i / 10)});
  const viz = chart(rows).width(500).height(400);
  const est = estimatedColorRows(viz, hexbinSettings(viz));
  assert.ok(est.length > 0);
  assert.strictEqual(
    est.reduce((s, r) => s + hexbinValue(r), 0),
    50,
  );
  viz.facet(d => d.x % 2);
  const faceted = estimatedColorRows(viz, hexbinSettings(viz));
  assert.strictEqual(
    faceted.reduce((s, r) => s + hexbinValue(r), 0),
    50,
  );
  viz._filteredData = [{x: "a", y: 1}];
  assert.deepStrictEqual(estimatedColorRows(viz, hexbinSettings(viz)), []);
});

it("colorScaleRows: this draw's measured rows, else an estimate", () => {
  const rows = [];
  for (let i = 0; i < 20; i++) rows.push({x: i % 4, y: i % 5});
  const viz = chart(rows).width(400).height(300);
  noteDrawRows(viz);
  const estimate = colorScaleRows(viz);
  assert.strictEqual(
    estimate.reduce((s, r) => s + hexbinValue(r), 0),
    20,
  );
  const measured = [hexbinRow("bin-a", {kind: "bin", value: 20})];
  viz.colorScale(false);
  refreshColorScale(viz, measured);
  assert.strictEqual(colorScaleRows(viz), measured);
  noteDrawRows(viz);
  assert.notStrictEqual(colorScaleRows(viz), measured, "a new draw drops them");
});

it("refreshColorScale: lays the colorScale out again with the rows given", () => {
  const viz = new Hexbin();
  const calls = [];
  viz._colorScaleClass = {
    data(rows) {
      calls.push(["data", rows]);
      return this;
    },
    render() {
      calls.push(["render"]);
      return this;
    },
  };
  const rows = [hexbinRow("bin-a", {kind: "bin", value: 1})];
  refreshColorScale(viz, rows);
  assert.deepStrictEqual(calls, [["data", rows], ["render"]]);
  viz.colorScale(false);
  refreshColorScale(viz, rows);
  assert.strictEqual(calls.length, 2, "nothing without a colorScale");
});

it("hexbinBuffer: fits each axis to its numbers, padded by a bin", () => {
  const viz = new Hexbin().binSize(10);
  const x = scaleLinear().domain([0, 100]).range([0, 200]);
  const y = scaleLinear().domain([100, 0]).range([0, 200]);
  const [bx, by] = hexbinBuffer.call(viz, {
    data: [
      {x: 0, y: 0},
      {x: 100, y: 100},
      {x: "skip", y: null},
    ],
    x,
    y,
  });
  const [x0, x1] = bx.domain();
  assert.ok(x0 < 0 && x1 > 100, `x ${bx.domain()}`);
  const [y1, y0] = by.domain();
  assert.ok(y0 < 0 && y1 > 100, `y ${by.domain()}`);
  assert.deepStrictEqual(x.domain(), [0, 100], "the scales are copied");
  const same = hexbinBuffer.call(viz, {data: [], x, y, x2: true});
  assert.deepStrictEqual(same, [x, y], "secondary axes are left alone");
});

it("tooltips and aria labels: a bin's measure and ranges, a contour's density range", () => {
  const viz = new Hexbin().x("weight").y("height");
  const bin = hexbinRow("bin-a", {
    kind: "bin",
    count: 42,
    value: 42,
    x0: 1,
    x1: 2,
    y0: 10,
    y1: 15,
  });
  assert.strictEqual(hexbinTooltipTitle(viz, bin), "Count: 42");
  assert.deepStrictEqual(hexbinTooltipRows(viz, bin), [
    ["weight", "1 – 2"],
    ["height", "10 – 15"],
  ]);
  assert.strictEqual(
    binAriaLabel(viz, bin),
    "Count: 42, weight 1 – 2, height 10 – 15",
  );
  viz.binValue({value: "score", agg: "mean"});
  assert.deepStrictEqual(hexbinTooltipRows(viz, bin).at(-1), ["Count", "42"]);
  assert.strictEqual(hexbinTooltipTitle(viz, bin), "Mean score: 42");

  const top = hexbinRow("c", {kind: "contour", level: 30, index: 2});
  const mid = hexbinRow("c", {kind: "contour", level: 10, next: 20});
  assert.strictEqual(hexbinTooltipTitle(viz, top), "Density");
  assert.deepStrictEqual(hexbinTooltipRows(viz, top), [["Range", "≥ 30"]]);
  assert.deepStrictEqual(hexbinTooltipRows(viz, mid), [["Range", "10 – 20"]]);
  assert.strictEqual(contourAriaLabel(viz, mid), "Density: 10 – 20");
  assert.strictEqual(contourAriaLabel(viz, bin), "");

  assert.strictEqual(hexbinTooltipTitle(viz, {}), "");
  assert.deepStrictEqual(hexbinTooltipRows(viz, {}), []);
  assert.strictEqual(binAriaLabel(viz, {}), "");
  const unnamed = new Hexbin().x(d => d.a).y(d => d.b);
  assert.strictEqual(
    hexbinTooltipRows(unnamed, bin)[0][0],
    "x",
    "an accessor without a key goes by its axis",
  );
});
