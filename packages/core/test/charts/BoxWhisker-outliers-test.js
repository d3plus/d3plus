import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {BoxWhisker} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {
  computePlotAxisValues,
  formatPlotData,
} from "../../src/charts/Plot/pipeline.ts";
import {
  boxAxisRows,
  chartOutlierShape,
  drawsRowOutliers,
} from "../../src/charts/BoxWhisker/outliers.ts";
import {
  boxAxisValues,
  boxWhiskerBuffer,
} from "../../src/charts/BoxWhisker/summary.ts";

useJsdom();

/**
    BoxWhisker with `shapeConfig: {Box: {outlier: false}}` draws no outlier
    points, and its value axis leaves the hidden outliers out, reaching only
    as far as the whisker ends.
*/

// alpha's Tukey whiskers end at 20 and 313.5; 900 is an outlier.
const observations = {
  alpha: [300, 150, 160, 140, 20, 180, 40, 170, 125, 74, 80, 900],
  beta: [180, 30, 120, 50, 140, 115],
};
const data = Object.entries(observations).flatMap(([id, values]) =>
  values.map((value, n) => ({id, n, value})),
);

const chart = shapeConfig =>
  new BoxWhisker()
    .data(data)
    .groupBy(["id", "n"])
    .x("id")
    .y("value")
    .shapeConfig(shapeConfig ? {Box: shapeConfig} : {});

/** Plotted rows, as Plot hands them to its hooks. */
const plotted = viz => {
  viz._preDraw();
  return runStages({viz}, [formatPlotData]).plotFormattedData;
};

const extent = values => [Math.min(...values), Math.max(...values)];

it("chartOutlierShape: null unless the Box's outlier setting hides some points", () => {
  assert.strictEqual(chartOutlierShape(chart()), null);
  assert.strictEqual(chartOutlierShape(chart({outlier: "Rect"})), null);
  assert.strictEqual(chartOutlierShape(chart({outlier: false}))(), false);
  // A top-level shapeConfig setting reaches the Box too.
  const top = new BoxWhisker().shapeConfig({outlier: false});
  assert.strictEqual(chartOutlierShape(top)(), false);
  // An accessor receives the source row, through Plot's wrapper.
  const fn = chartOutlierShape(chart({outlier: d => d.id !== "alpha"}));
  assert.strictEqual(fn({__d3plus__: true, data: {id: "alpha"}, i: 0}), false);
});

it("drawsRowOutliers: whether each plotted row's box draws its outliers", () => {
  const row = id => ({__d3plus__: true, data: {id}, i: 0});
  assert.strictEqual(drawsRowOutliers(chart())(row("alpha")), true);
  assert.strictEqual(
    drawsRowOutliers(chart({outlier: false}))(row("alpha")),
    false,
  );
  const some = drawsRowOutliers(
    chart({outlier: d => (d.id === "alpha" ? false : "Circle")}),
  );
  assert.deepStrictEqual(
    [some(row("alpha")), some(row("beta"))],
    [false, true],
  );
});

it("boxAxisRows: drops hidden outliers and adds the whisker ends", () => {
  const shown = chart();
  const rows = plotted(shown);
  assert.strictEqual(boxAxisRows(shown, rows, "y"), rows);

  const hidden = chart({outlier: false});
  const out = boxAxisRows(hidden, plotted(hidden), "y");
  const alpha = out.filter(d => d.x === "alpha").map(d => d.y);
  assert.ok(!alpha.includes(900), "the outlier is left out");
  assert.deepStrictEqual(extent(alpha), [20, 313.5]);
  // beta has no outliers: its rows pass through, with no whisker rows.
  const beta = out.filter(d => d.x === "beta");
  assert.strictEqual(beta.length, observations.beta.length);
  // The category axis keeps every row.
  const all = plotted(hidden);
  assert.strictEqual(boxAxisRows(hidden, all, "x"), all);
});

it("boxAxisRows: an accessor hides one box's outliers only", () => {
  const viz = chart({
    outlier: d => (d.id === "alpha" && d.value > 500 ? false : "Circle"),
  });
  const ys = boxAxisRows(viz, plotted(viz), "y").map(d => d.y);
  assert.deepStrictEqual(extent(ys), [20, 313.5]);
});

it("boxAxisRows: boxes split by facet panel", () => {
  // Alone, the left panel's 100 is an outlier; pooled with the right
  // panel's values, it would not be.
  const panels = {left: [1, 2, 3, 4, 5, 100], right: [90, 95, 100, 105, 110]};
  const rows = Object.entries(panels).flatMap(([panel, values]) =>
    values.map((value, n) => ({id: "a", panel, n, value})),
  );
  const viz = new BoxWhisker()
    .data(rows)
    .groupBy(["id", "panel", "n"])
    .x("id")
    .y("value")
    .facet("panel")
    .shapeConfig({Box: {outlier: false}});
  const out = boxAxisRows(viz, plotted(viz), "y");
  const left = out.filter(d => d.data.panel === "left").map(d => d.y);
  assert.ok(!left.includes(100), `${left}`);
  const right = out.filter(d => d.data.panel === "right").map(d => d.y);
  assert.deepStrictEqual(
    right.sort((a, b) => a - b),
    panels.right,
  );
});

it("boxAxisRows: whisker ends on a date axis stay dates", () => {
  const day = n => new Date(2020, 0, n);
  const rows = [1, 2, 3, 4, 5, 90].map((n, i) => ({
    __d3plus__: true,
    data: {id: "a"},
    i,
    discrete: "a",
    y: day(n),
  }));
  const viz = new BoxWhisker().shapeConfig({Box: {outlier: false}});
  const out = boxAxisRows(viz, rows, "y");
  assert.ok(out.every(d => d.y instanceof Date));
  assert.ok(!out.some(d => +d.y === +day(90)));
});

it("boxAxisRows: precomputed boxes leave their rows alone", () => {
  const viz = chart({outlier: false}).boxMedian("value");
  const rows = [{x: "a", y: 1}];
  assert.strictEqual(boxAxisRows(viz, rows, "y"), rows);
});

it("computePlotAxisValues: hidden outliers leave the value axis, whiskers stay on it", () => {
  const values = viz => {
    viz._preDraw();
    return runStages({viz}, [formatPlotData, computePlotAxisValues]).yData;
  };
  assert.deepStrictEqual(extent(values(chart())), [20, 900]);
  assert.deepStrictEqual(extent(values(chart({outlier: false}))), [20, 313.5]);
});

it("boxWhiskerBuffer: the raw path pads past the whisker ends, not hidden outliers", () => {
  const viz = chart({outlier: false});
  const rows = plotted(viz);
  const y = scaleLinear().domain([313.5, 20]).range([0, 300]);
  const x = scalePoint().domain(["alpha", "beta"]).range([0, 400]);
  boxWhiskerBuffer.call(viz, {data: rows, x, y});
  const [hi, lo] = y.domain();
  assert.ok(hi > 313.5 && hi < 400 && lo < 20, `${y.domain()}`);
});

it("boxAxisValues / boxWhiskerBuffer: precomputed boxes leave out hidden outliers", () => {
  const summary = [
    {id: "alpha", min: 20, q1: 78, med: 145, q3: 172, max: 300, out: [900]},
  ];
  const viz = new BoxWhisker()
    .data(summary)
    .x("id")
    .boxMin("min")
    .boxQ1("q1")
    .boxMedian("med")
    .boxQ3("q3")
    .boxMax("max")
    .boxOutliers("out");
  const rows = [{__d3plus__: true, data: summary[0], i: 0, x: "alpha"}];
  assert.strictEqual(Math.max(...boxAxisValues(viz, rows, "y")), 900);
  viz.shapeConfig({Box: {outlier: false}});
  assert.strictEqual(Math.max(...boxAxisValues(viz, rows, "y")), 300);
  const y = scaleLinear().domain([300, 20]).range([0, 300]);
  boxWhiskerBuffer.call(viz, {
    data: rows,
    x: scalePoint().domain(["alpha"]),
    y,
  });
  assert.ok(y.domain()[0] < 400, `${y.domain()}`);
});
