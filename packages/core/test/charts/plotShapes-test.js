import {afterEach, it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AreaPlot, BarChart, Plot} from "../../index.ts";
import {
  barBaseline,
  drawsAnyShape,
  drawsDiscreteShapes,
  plotSwarm,
} from "../../src/charts/Plot/plotShapes.ts";
import {
  baselineValue,
  plotBaseline,
} from "../../src/charts/Plot/baselineDomain.ts";

useJsdom();

const rows = [
  {id: "a", value: 4},
  {id: "b", value: 7},
];
const plot = shape => new Plot().data(rows).shape(shape);
const mixed = d => (d.id === "b" ? "Bar" : "Line");

const warn = console.warn;
afterEach(() => {
  console.warn = warn;
});

it("drawsAnyShape — whether any row draws one of the shapes", () => {
  const shapes = new Set(["Bar", "Circle"]);
  assert.strictEqual(drawsAnyShape(plot("Circle"), rows, shapes), true);
  assert.strictEqual(drawsAnyShape(plot(mixed), rows, shapes), true);
  assert.strictEqual(drawsAnyShape(plot("Line"), rows, shapes), false);
  assert.strictEqual(drawsAnyShape(plot("Bar"), [], shapes), false, "no rows");
});

it("drawsDiscreteShapes — whether any row draws a Bar, Area, or Box", () => {
  for (const shape of ["Bar", "Area", "Box"])
    assert.strictEqual(drawsDiscreteShapes(plot(shape), rows), true, shape);
  for (const shape of ["Circle", "Line", "Rect"])
    assert.strictEqual(drawsDiscreteShapes(plot(shape), rows), false, shape);
  assert.strictEqual(drawsDiscreteShapes(plot(mixed), rows), true);
});

it("barBaseline — 0 under bars when neither the chart nor the user sets one", () => {
  assert.strictEqual(barBaseline(plot("Bar"), rows), 0);
  assert.strictEqual(barBaseline(plot(mixed), rows), 0, "any row's bar");
  for (const shape of ["Area", "Box", "Line"])
    assert.strictEqual(barBaseline(plot(shape), rows), undefined, shape);
  assert.strictEqual(barBaseline(plot("Bar").baseline(5), rows), undefined);
  assert.strictEqual(
    barBaseline(new AreaPlot().data(rows).shape("Bar"), rows),
    undefined,
    "the chart's own baseline",
  );
});

it("plotBaseline — the chart's baseline, else the bars'", () => {
  assert.strictEqual(plotBaseline(new BarChart()), 0);
  assert.strictEqual(plotBaseline(new Plot()), undefined);
  const bars = plot("Bar");
  bars._barBaseline = 0;
  assert.strictEqual(plotBaseline(bars), 0);
  assert.strictEqual(baselineValue(bars), 0);
  assert.strictEqual(baselineValue(bars.baseline(5)), 5, "the user's wins");
});

it("plotSwarm — off, with one warning, for bars, areas, and boxes", () => {
  const warnings = [];
  console.warn = message => warnings.push(message);
  for (const swarm of [true, "x", "y"]) {
    const viz = plot("Bar").swarm(swarm);
    assert.strictEqual(plotSwarm(viz), false, `${swarm}`);
    assert.strictEqual(plotSwarm(viz), false, "again");
  }
  assert.strictEqual(warnings.length, 3, "once per chart");
  assert.match(warnings[0], /swarm/);
  assert.strictEqual(plotSwarm(plot("Area").swarm(true)), false);
  assert.strictEqual(plotSwarm(plot("Circle").swarm("x")), "x");
  assert.strictEqual(plotSwarm(plot("Bar").swarm("auto")), "auto");
  assert.strictEqual(plotSwarm(plot("Bar").swarm(false)), false);
  assert.strictEqual(warnings.length, 4);
});
