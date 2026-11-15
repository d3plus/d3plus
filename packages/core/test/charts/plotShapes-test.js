import {afterEach, it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AreaPlot, BarChart, Plot} from "../../index.ts";
import {
  shapeBaseline,
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

it("shapeBaseline — 0 under bars or areas when neither the chart nor the user sets one", () => {
  assert.strictEqual(shapeBaseline(plot("Bar"), rows), 0);
  assert.strictEqual(shapeBaseline(plot("Area"), rows), 0);
  assert.strictEqual(shapeBaseline(plot(mixed), rows), 0, "any row's bar");
  for (const shape of ["Box", "Circle", "Line"])
    assert.strictEqual(shapeBaseline(plot(shape), rows), undefined, shape);
  assert.strictEqual(shapeBaseline(plot("Bar").baseline(5), rows), undefined);
  assert.strictEqual(shapeBaseline(plot("Area").baseline(5), rows), undefined);
  assert.strictEqual(
    shapeBaseline(new AreaPlot().data(rows).shape("Bar"), rows),
    undefined,
    "the chart's own baseline",
  );
});

it("plotBaseline — the chart's baseline, else the bars'", () => {
  assert.strictEqual(plotBaseline(new BarChart()), 0);
  assert.strictEqual(plotBaseline(new Plot()), undefined);
  const bars = plot("Bar");
  bars._shapeBaseline = 0;
  assert.strictEqual(plotBaseline(bars), 0);
  assert.strictEqual(baselineValue(bars), 0);
  assert.strictEqual(baselineValue(bars.baseline(5)), 5, "the user's wins");
});

it("plotSwarm — the setting while circles draw; off, with one note, without them", () => {
  const warnings = [];
  console.warn = message => warnings.push(message);
  const circlesAndBars = d => (d.id === "b" ? "Bar" : "Circle");
  for (const swarm of [true, "x", "y"]) {
    assert.strictEqual(plotSwarm(plot(circlesAndBars).swarm(swarm)), swarm);
    assert.strictEqual(plotSwarm(plot("Circle").swarm(swarm)), swarm);
  }
  assert.strictEqual(warnings.length, 0, "nothing lost, nothing said");
  for (const swarm of [true, "x", "y"]) {
    const viz = plot("Bar").swarm(swarm);
    assert.strictEqual(plotSwarm(viz), false, `${swarm}`);
    assert.strictEqual(plotSwarm(viz), false, "again");
  }
  assert.strictEqual(warnings.length, 3, "once per chart");
  assert.match(warnings[0], /swarm/);
  for (const shape of ["Area", "Box", mixed])
    assert.strictEqual(plotSwarm(plot(shape).swarm(true)), false);
  assert.strictEqual(plotSwarm(plot("Bar").swarm("auto")), "auto");
  assert.strictEqual(plotSwarm(plot("Bar").swarm(false)), false);
  assert.strictEqual(warnings.length, 6);
});
