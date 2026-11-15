import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  BarChart,
  Beeswarm,
  BoxWhisker,
  BubbleChart,
  LinePlot,
  Plot,
  Scatter,
} from "../../index.ts";
import {
  hasCategoryValues,
  inferDiscrete,
  resolveDiscrete,
} from "../../src/charts/Plot/inferDiscrete.ts";
import {vizDiscrete} from "../../src/charts/viz/discrete.ts";

useJsdom();

const rows = [
  {id: "a", fruit: "Apples", value: 4, year: "2020", day: "2020-01-01"},
  {id: "b", fruit: "Pears", value: 7, year: "2021", day: "2020-01-02"},
];

it("hasCategoryValues — text that doesn't read as a number", () => {
  assert.strictEqual(hasCategoryValues(["Apples", "Pears"]), true);
  assert.strictEqual(hasCategoryValues([1, 2, "Other"]), true, "any text");
  assert.strictEqual(hasCategoryValues([1, 2.5, 3]), false);
  assert.strictEqual(hasCategoryValues(["2019", "1.5", "-3"]), false);
  assert.strictEqual(hasCategoryValues([new Date(), undefined, null]), false);
  assert.strictEqual(hasCategoryValues([]), false);
});

it("inferDiscrete — the axis of text values; with both, the fewer distinct values", () => {
  const scatter = () => new Scatter().data(rows);
  assert.strictEqual(inferDiscrete(scatter().x("fruit").y("value")), "x");
  assert.strictEqual(inferDiscrete(scatter().x("value").y("fruit")), "y");
  assert.strictEqual(inferDiscrete(scatter().x("fruit").y("id")), "x", "a tie");
  const grid = ["a", "b", "c"].flatMap(name =>
    ["Low", "High"].map(level => ({name, level})),
  );
  const both = () => new Scatter().data(grid);
  assert.strictEqual(inferDiscrete(both().x("name").y("level")), "y");
  assert.strictEqual(inferDiscrete(both().x("level").y("name")), "x");
  assert.strictEqual(inferDiscrete(scatter().x("value").y("value")), undefined);
  assert.strictEqual(
    inferDiscrete(scatter().x("year").y("value")),
    undefined,
    "numeric strings",
  );
  assert.strictEqual(
    inferDiscrete(new Scatter().x("fruit")),
    undefined,
    "no data",
  );
  for (const Chart of [Plot, BubbleChart])
    assert.strictEqual(
      inferDiscrete(new Chart().data(rows).x("fruit").y("value")),
      "x",
    );
});

it("inferDiscrete — none when discrete is set, for a swarm, or on a time axis", () => {
  const scatter = () => new Scatter().data(rows).x("fruit").y("value");
  assert.strictEqual(inferDiscrete(scatter().discrete("y")), undefined);
  assert.strictEqual(inferDiscrete(scatter().swarm(true)), undefined);
  assert.strictEqual(inferDiscrete(scatter().swarm("y")), undefined);
  assert.strictEqual(inferDiscrete(scatter().swarm("auto")), "x");
  assert.strictEqual(
    inferDiscrete(new Beeswarm().data(rows).x("value").y("fruit")),
    undefined,
  );
  assert.strictEqual(
    inferDiscrete(new Scatter().data(rows).x("day").y("value").time("day")),
    undefined,
    "the time axis",
  );
  assert.strictEqual(
    inferDiscrete(
      new Scatter().data(rows).x("day").y("value").xConfig({scale: "time"}),
    ),
    undefined,
    "date strings on a time scale",
  );
});

it("inferDiscrete — bars, areas, and boxes on two axes of numbers stand on x", () => {
  const plot = () => new Plot().data(rows).x("value").y("value");
  for (const shape of ["Bar", "Area", "Box"])
    assert.strictEqual(inferDiscrete(plot().shape(shape)), "x", shape);
  assert.strictEqual(
    inferDiscrete(plot().shape(d => (d.id === "b" ? "Bar" : "Line"))),
    "x",
    "any row's bar",
  );
  assert.strictEqual(inferDiscrete(plot().shape("Circle")), undefined);
  assert.strictEqual(
    inferDiscrete(plot().shape("Bar").discrete("y")),
    undefined,
  );
  // Text still picks the axis.
  assert.strictEqual(
    inferDiscrete(new Plot().data(rows).x("value").y("fruit").shape("Bar")),
    "y",
  );
  assert.strictEqual(
    inferDiscrete(
      new Plot().data(rows).x("day").y("value").time("day").shape("Bar"),
    ),
    "x",
    "bars on a time axis",
  );
});

it("inferDiscrete — a swarm a Plot's bars turn off doesn't stop it", () => {
  const plot = new Plot().data(rows).x("value").y("value").shape("Bar");
  assert.strictEqual(inferDiscrete(plot.swarm(true)), "x");
  assert.strictEqual(inferDiscrete(plot.swarm("y")), "x");
});

it("resolveDiscrete — notes the inferred axis; the setting wins at once", () => {
  const scatter = new Scatter().data(rows).x("fruit").y("value");
  resolveDiscrete(scatter);
  assert.strictEqual(scatter._discrete, "x");
  assert.strictEqual(vizDiscrete(scatter), "x");
  assert.strictEqual(scatter.discrete(), undefined, "the setting is untouched");
  // A setting made after the draw wins before the next one.
  scatter.discrete("y");
  assert.strictEqual(vizDiscrete(scatter), "y");
  resolveDiscrete(scatter);
  assert.strictEqual(scatter._discrete, undefined, "nothing inferred");
  scatter.discrete(undefined).x("value");
  resolveDiscrete(scatter);
  assert.strictEqual(vizDiscrete(scatter), undefined, "nothing to infer");
  // Bars with no baseline grow from 0.
  const bars = new Plot().data(rows).x("value").y("value").shape("Bar");
  resolveDiscrete(bars);
  assert.strictEqual(bars._barBaseline, 0);
  resolveDiscrete(bars.baseline(5));
  assert.strictEqual(bars._barBaseline, undefined, "the user's baseline");
  // Charts that set discrete themselves keep it, whatever their values.
  for (const Chart of [BarChart, LinePlot, BoxWhisker]) {
    const viz = new Chart().data(rows).x("value").y("fruit");
    resolveDiscrete(viz);
    assert.strictEqual(viz._discrete, undefined, Chart.name);
    assert.strictEqual(vizDiscrete(viz), "x", Chart.name);
  }
});

it("vizDiscrete — the setting, else the inferred axis", () => {
  assert.strictEqual(vizDiscrete({schema: {discrete: "y"}}), "y");
  assert.strictEqual(vizDiscrete({schema: {}, _discrete: "x"}), "x");
  assert.strictEqual(
    vizDiscrete({schema: {discrete: "y"}, _discrete: "x"}),
    "y",
  );
  assert.strictEqual(vizDiscrete({schema: {}}), undefined);
});
