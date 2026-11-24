import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {parseGradient} from "@d3plus/render";
import {BarChart, LinePlot, StackedArea} from "../../index.ts";
import {
  applyValueFill,
  legendSwatchFill,
  paintValueColors,
  plotValueScale,
  rowValue,
  setDatumColor,
  valueColored,
} from "../../src/charts/Plot/valueColorsScene.ts";
import {shiftStack} from "../../src/charts/Plot/stackHelpers.ts";
import {resolveTheme} from "../../src/utils/theme.ts";
import {barsInDomain} from "../../src/charts/Plot/barsInDomain.ts";
import {grayPaint} from "../../src/charts/viz/interactionOpacity.ts";
import {Rect} from "../../src/shapes/index.ts";

useJsdom();

// Painting value colors onto a Plot's marks.

const row = (y, extra = {}) => ({
  __d3plus__: true,
  data: {id: "a", y},
  i: 0,
  id: "a",
  shape: "Line",
  x: 1,
  y,
  ...extra,
});

const bands = {kind: "threshold", values: [50], colors: ["red", "green"]};

it("rowValue — a row's value, on its secondary axis when it has one", () => {
  assert.strictEqual(rowValue(row(5), "y"), 5);
  assert.strictEqual(rowValue(row(5, {y2: 9}), "y"), 9);
  assert.strictEqual(rowValue(row(5), "x"), 1);
  assert.ok(Number.isNaN(rowValue(row(null), "y")));
  assert.ok(Number.isNaN(rowValue(undefined, "y")));
});

it("plotValueScale — the chart's valueColors over its plotted values", () => {
  const rows = [row(10), row(30)];
  assert.strictEqual(plotValueScale(new LinePlot(), rows), undefined);
  assert.strictEqual(
    plotValueScale(new LinePlot().valueColors(false), rows),
    undefined,
  );
  const {off} = new LinePlot().schema.colorDefaults;
  const t = plotValueScale(new LinePlot().valueColors({values: 20}), rows);
  assert.deepStrictEqual(t.values, [20]);
  assert.strictEqual(t.colors[0], off, "colorDefaults.off below");
  const three = plotValueScale(
    new LinePlot().valueColors({values: [15, 25]}),
    rows,
  );
  assert.strictEqual(
    three.colors[1],
    "#f08c00",
    "colorDefaults.caution between",
  );
  const restyled = plotValueScale(
    new LinePlot()
      .valueColors({values: [15, 25]})
      .colorDefaults({caution: "#123456"}),
    rows,
  );
  assert.strictEqual(restyled.colors[1], "#123456", "a chart's own caution");
  const dark = new LinePlot().valueColors({values: [15, 25]});
  dark._theme = resolveTheme("dark");
  assert.strictEqual(
    plotValueScale(dark, rows).colors[1],
    "#f59f00",
    "a step brighter on a dark theme",
  );
  const ownOnDark = new LinePlot()
    .valueColors({values: [15, 25]})
    .colorDefaults({caution: "#123456"});
  ownOnDark._theme = resolveTheme("dark");
  assert.deepStrictEqual(
    plotValueScale(ownOnDark, rows).colors,
    ["#ff6b6b", "#123456", "#40c057"],
    "the chart's own caution beats the dark theme's; off and on follow it",
  );
  const g = plotValueScale(
    new LinePlot().valueColors({type: "gradient"}),
    rows,
  );
  assert.deepStrictEqual(g.values, [10, 30], "spans the plotted values");
  const cs = plotValueScale(
    new LinePlot()
      .valueColors({type: "gradient"})
      .colorScaleConfig({color: ["#111", "#222", "#333"]}),
    rows,
  );
  assert.deepStrictEqual(
    cs.colors,
    ["#111", "#222", "#333"],
    "colorScaleConfig colors",
  );
  const own = plotValueScale(
    new LinePlot()
      .valueColors({type: "gradient", colors: ["#a", "#b"]})
      .colorScaleConfig({color: ["#111", "#222", "#333"]}),
    rows,
  );
  assert.deepStrictEqual(own.colors, ["#a", "#b"], "its own colors win");
});

it("valueColored — stacked areas and bars keep series colors", () => {
  assert.strictEqual(valueColored(new LinePlot(), "Line"), true);
  assert.strictEqual(valueColored(new StackedArea(), "Area"), false);
  assert.strictEqual(valueColored(new StackedArea(), "Line"), true);
  assert.strictEqual(valueColored(new BarChart().stacked(true), "Bar"), false);
});

it("applyValueFill — each row in the color of its value", () => {
  const viz = new LinePlot();
  const s = new Rect().fill(() => "own");
  applyValueFill(viz, undefined, s);
  assert.strictEqual(s.fill()(row(80), 0), "own", "no scale, no change");
  applyValueFill(viz, bands, s);
  assert.strictEqual(s.fill()(row(80), 0), "green");
  assert.strictEqual(s.fill()(row(20), 0), "red");
  assert.strictEqual(s.fill()(row(null), 0), "own", "no value keeps its fill");
});

it("paintValueColors — gradients on lines and areas, a color on stems", () => {
  const viz = new LinePlot();
  const frame = {
    x: v => v,
    y: v => 200 - v * 2,
    xRange: [0, 300],
    yRange: [200, 0],
  };
  const line = {
    type: "path",
    key: "a",
    shapeType: "Line",
    datum: row(10),
    transform: {x: 0, y: 50},
    paint: {fill: "none", stroke: "blue"},
  };
  const area = {
    type: "path",
    key: "b",
    shapeType: "Area",
    datum: row(10),
    paint: {fill: "blue", stroke: "navy"},
  };
  const hit = {...line, key: "a::hit", paint: {stroke: "transparent"}};
  const stem = {
    type: "path",
    key: "c::stem",
    shapeType: "Circle",
    datum: row(20),
    paint: {stroke: "blue"},
  };
  const between = {
    type: "group",
    key: "fill-between-a-b-a::clip",
    children: [{...area, key: "fill-between-a-b-a", paint: {fill: "blue"}}],
  };
  const nodes = [line, area, hit, stem, between];
  assert.strictEqual(
    paintValueColors(viz, undefined, frame, nodes),
    nodes,
    "no scale",
  );
  assert.strictEqual(line.paint.stroke, "blue");
  paintValueColors(viz, bands, frame, nodes);
  const g = parseGradient(line.paint.stroke);
  assert.strictEqual(g.units, "userSpaceOnUse");
  assert.deepStrictEqual(g.from, [0, -50], "in the line's own coordinates");
  assert.deepStrictEqual(g.to, [0, 150]);
  assert.deepStrictEqual(
    g.stops.map(s => [s.offset, s.color]),
    [
      [0.5, "green"],
      [0.5, "red"],
    ],
  );
  assert.ok(area.paint.fill.startsWith("gradient:"), "an area's fill");
  assert.ok(area.paint.stroke.startsWith("gradient:"), "and its stroke");
  assert.strictEqual(hit.paint.stroke, "transparent", "hit areas left alone");
  assert.strictEqual(
    stem.paint.stroke,
    "red",
    "a stem takes its value's color",
  );
  assert.strictEqual(
    between.children[0].paint.fill,
    "blue",
    "fills between lines left alone",
  );
});

it("setDatumColor — the color a plotted datum draws in", () => {
  const viz = new LinePlot().shapeConfig({stroke: "blue", fill: "blue"});
  setDatumColor(viz, bands);
  assert.strictEqual(viz._datumColor(row(80)), "green");
  assert.strictEqual(viz._datumColor(row(10)), "red");
  assert.strictEqual(viz._datumColor({y: 80}), undefined, "not a plotted row");
  assert.strictEqual(viz._datumColor(undefined), undefined);
  setDatumColor(viz, undefined);
  assert.strictEqual(viz._datumColor, undefined, "cleared");
});

it("legendSwatchFill — a series' colors in equal steps", () => {
  const viz = new LinePlot();
  assert.strictEqual(legendSwatchFill(viz, {}, 0, "blue"), "blue", "off");
  viz.valueColors({values: [50], colors: ["red", null]});
  const line = parseGradient(legendSwatchFill(viz, {}, 0, "blue"));
  assert.deepStrictEqual(line.to, [1, 0], "a Line runs left to right");
  assert.deepStrictEqual(
    line.stops.map(s => s.color),
    ["red", "red", "blue", "blue"],
    "null is the series' own color",
  );
  const bars = new BarChart().valueColors({values: [50]});
  const bar = parseGradient(legendSwatchFill(bars, {}, 0, "blue"));
  assert.deepStrictEqual(
    [bar.from, bar.to],
    [
      [0, 1],
      [0, 0],
    ],
  );
  assert.strictEqual(
    legendSwatchFill(
      new StackedArea().valueColors({values: [50]}),
      {},
      0,
      "blue",
    ),
    "blue",
    "a stack keeps its colors",
  );
  assert.strictEqual(
    legendSwatchFill(viz, {}, 0, "pattern:{}"),
    "pattern:{}",
    "a texture keeps its fill",
  );
});

it("grayPaint — a color, or each of a gradient's stops, in gray", () => {
  assert.strictEqual(grayPaint("#ff0000"), "rgb(128, 128, 128)");
  const g = parseGradient(
    grayPaint(
      'gradient:{"type":"linear","from":[0,0],"to":[0,1],"stops":[{"offset":0,"color":"#ff0000"}]}',
    ),
  );
  assert.deepStrictEqual(g.stops, [{offset: 0, color: "rgb(128, 128, 128)"}]);
  assert.strictEqual(grayPaint("none"), "none");
});

it("barsInDomain — a time axis's bars inside its domain", () => {
  const values = [{x: 1}, {x: 5}, {x: 9}];
  const ctx = {
    viz: {schema: {discrete: "x"}},
    values,
    xScale: "Time",
    yScale: "Linear",
    xDomain: [2, 9],
    yDomain: [0, 1],
    x: v => v * 10,
    y: v => v,
  };
  assert.deepStrictEqual(barsInDomain(ctx), [{x: 5}, {x: 9}]);
  assert.strictEqual(
    barsInDomain({...ctx, xScale: "Linear"}),
    values,
    "every bar on another axis",
  );
  assert.deepStrictEqual(
    barsInDomain({...ctx, zoomRanges: {x: [0, 60]}}),
    [{x: 1}, {x: 5}],
    "zoomed, the unzoomed range",
  );
});

it("shiftStack — moves every band of a stack by growFrom", () => {
  const stack = [
    [
      [0, 2],
      [0, 3],
    ],
    [
      [2, 5],
      [-1, 0],
    ],
  ];
  shiftStack(stack, 10);
  assert.deepStrictEqual(stack, [
    [
      [10, 12],
      [10, 13],
    ],
    [
      [12, 15],
      [9, 10],
    ],
  ]);
  shiftStack(stack, 0);
  assert.deepStrictEqual(stack[0][0], [10, 12], "0 leaves it");
});
