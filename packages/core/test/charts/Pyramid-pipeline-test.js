import assert from "assert";
import it from "../jsdom.js";
import {BarChart, Pyramid} from "../../es/index.js";
import {runStages} from "../../es/internal.js";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  formatPlotData,
} from "../../es/src/charts/Plot/pipeline.js";

/**
    Pyramid's pre-draw resolves its sides, totals, and value axis on top of
    Plot's; these drive `_preDraw` and the Plot data stages directly, without
    a layout pass.
*/

const rows = [
  {age: "0-9", sex: "Male", pop: 100, before: 90},
  {age: "0-9", sex: "Female", pop: 120, before: 150},
  {age: "10-19", sex: "Male", pop: 80, before: 70},
  {age: "10-19", sex: "Female", pop: 60, before: 50},
];

// The left layout keeps zero exact; the center gutter's own tests are below.
const pyramid = (data = rows) => new Pyramid().data(data).groupBy("sex").y("age").x("pop").categoryPosition("left");

it("Pyramid pre-draw assigns sides in data order, or as configured", () => {
  const viz = pyramid();
  viz._preDraw();
  assert.deepStrictEqual(viz.ctx.pyramid.sides, ["Male", "Female"]);
  viz.sides(["Female", "Male"])._preDraw();
  assert.deepStrictEqual(viz.ctx.pyramid.sides, ["Female", "Male"]);
  assert.strictEqual(viz._x(rows[1], 1), -120, "the configured left side mirrors");
  assert.strictEqual(viz._x(rows[0], 0), 100);
});

it("Pyramid keeps a hidden side on its own half", () => {
  const viz = pyramid();
  viz._hidden = ["Male"];
  viz._preDraw();
  assert.ok(viz._filteredData.every(d => d.sex === "Female"));
  assert.deepStrictEqual(viz.ctx.pyramid.sides, ["Male", "Female"], "sides come from every row");
  assert.ok(viz._filteredData.every((d, i) => viz._x(d, i) > 0), "Female stays on the right");
});

it("Pyramid centers the value axis on the largest side", () => {
  const viz = pyramid();
  viz._preDraw();
  assert.deepStrictEqual(viz._xConfig.domain, [-120, 120]);
  viz.comparison("before")._preDraw();
  assert.deepStrictEqual(viz._xConfig.domain, [-150, 150], "comparison values widen it");
  viz.symmetric(false)._preDraw();
  assert.strictEqual(viz._xConfig.domain, undefined, "symmetric(false) hands the domain back to Plot");
});

it("Pyramid leaves a user's domain alone", () => {
  const viz = pyramid().xConfig({domain: [-500, 500]});
  viz._preDraw();
  assert.deepStrictEqual(viz._xConfig.domain, [-500, 500]);
  const withXDomain = pyramid().xDomain([-300, 300]);
  withXDomain._preDraw();
  assert.strictEqual(withXDomain._xConfig.domain, undefined, "xDomain wins over the symmetric domain");
});

it("Pyramid sizes a persistent axis to every frame", () => {
  const data = [
    ...rows.map(d => ({...d, year: 2000})),
    {age: "0-9", sex: "Male", pop: 400, year: 2010},
    {age: "0-9", sex: "Female", pop: 100, year: 2010},
  ];
  const viz = pyramid(data).time("year");
  viz._preDraw();
  assert.deepStrictEqual(viz._xConfig.domain, [-400, 400], "the latest frame");
  const first = pyramid(data).time("year").timeFilter(d => d.year === 2000);
  first._preDraw();
  assert.deepStrictEqual(first._xConfig.domain, [-120, 120]);
  first.axisPersist(true)._preDraw();
  assert.deepStrictEqual(first._xConfig.domain, [-400, 400], "axisPersist fits every year");
  first.percent(true)._preDraw();
  assert.deepStrictEqual(first._xConfig.domain, [-0.8, 0.8], "percent mode divides each year by its own total");
});

it("Pyramid percent mode divides by the frame's total", () => {
  const viz = pyramid().percent(true);
  viz._preDraw();
  assert.strictEqual(viz.ctx.pyramid.total, 360);
  assert.strictEqual(viz._x(rows[0], 0), -100 / 360);
  assert.deepStrictEqual(viz._xConfig.domain, [-120 / 360, 120 / 360]);
});

it("Pyramid formats ticks as magnitudes, wrapping a user tickFormat once", () => {
  const viz = pyramid();
  viz._preDraw();
  const auto = viz._xConfig.tickFormat;
  assert.strictEqual(auto(-1200), "1.2k");
  assert.strictEqual(auto(1200), "1.2k");
  viz.percent(true)._preDraw();
  assert.strictEqual(viz._xConfig.tickFormat(-0.25), "25%", "percent mode reads percentages");
  const seen = [];
  viz.xConfig({tickFormat: d => (seen.push(d), `${d}!`)})._preDraw();
  assert.strictEqual(viz._xConfig.tickFormat(-3), "3!");
  const wrapped = viz._xConfig.tickFormat;
  viz._preDraw();
  assert.strictEqual(viz._xConfig.tickFormat, wrapped, "not wrapped twice");
  assert.deepStrictEqual(seen, [3]);
});

it("Pyramid titles the value axis in percent mode unless the user has", () => {
  const viz = pyramid();
  viz._preDraw();
  assert.strictEqual(viz._xConfig.title, "pop");
  viz.percent(true)._preDraw();
  assert.strictEqual(viz._xConfig.title, "Percent of Total");
  viz.percent(false)._preDraw();
  assert.strictEqual(viz._xConfig.title, "pop", "restored when percent mode ends");
  const titled = pyramid().percent(true).xConfig({title: "Share of people"});
  titled._preDraw();
  assert.strictEqual(titled._xConfig.title, "Share of people");
  const es = pyramid().percent(true).locale("es-ES");
  es._preDraw();
  assert.strictEqual(es._xConfig.title, "Porcentaje del Total");
});

it("Pyramid reserves room above the bars for side titles", () => {
  const viz = pyramid();
  viz._preDraw();
  assert.strictEqual(viz._plotInsetTop, Math.ceil(14 * 1.2 + 2 * 2));
  viz.sideTitleConfig({fontSize: 20, padding: 0})._preDraw();
  assert.strictEqual(viz._plotInsetTop, 24);
  viz.sideTitles(false)._preDraw();
  assert.strictEqual(viz._plotInsetTop, 0);
});

it("Pyramid colors by the deepest drawn level", () => {
  const viz = pyramid().groupBy(["sex", "area"]);
  viz._preDraw();
  assert.strictEqual(viz.schema.color({sex: "Male", area: "Urban"}, 0), "Urban");
  const flat = pyramid();
  flat._preDraw();
  assert.strictEqual(flat.schema.color({sex: "Male"}, 0), "Male");
});

const stages = viz => {
  viz._preDraw();
  return runStages({viz}, [formatPlotData, computePlotAxisValues, computePlotInitialDomains]);
};

const stacked = rows.flatMap(d => [
  {...d, area: "Urban", pop: d.pop * 0.75},
  {...d, area: "Rural", pop: d.pop * 0.25},
]);

it("Pyramid stacks both sides, and every sub-group, in one stack per row", () => {
  const ctx = stages(pyramid(stacked).groupBy(["sex", "area"]));
  const groups = new Set(ctx.plotFormattedData.map(d => d.group));
  assert.deepStrictEqual([...groups], ["time_group"]);
  assert.deepStrictEqual(ctx.plotInitialDomains.x, [-100, 120], "the left side stacks below zero");
  const bars = stages(new BarChart().data(stacked).groupBy(["sex", "area"]).discrete("y").y("age").x("pop").stacked(true));
  assert.deepStrictEqual(
    [...new Set(bars.plotFormattedData.map(d => d.group))].sort(),
    ["time_Female", "time_Male"],
    "other stacked charts still group by their parent level",
  );
});

it("Pyramid stacks the same sub-group nearest the center on both sides", () => {
  const ctx = stages(pyramid(stacked).groupBy(["sex", "area"]));
  const segment = (sex, area) => {
    const key = ctx.plotStackKeys.indexOf(`${sex}_${area}_0-9`);
    const discrete = ctx.plotDiscreteKeys.findIndex(k => `${k}`.startsWith("0-9"));
    const [lo, hi] = ctx.plotStackData[key][discrete];
    return [lo, hi];
  };
  assert.deepStrictEqual(segment("Male", "Urban"), [-75, 0], "Urban (larger) starts at the center");
  assert.deepStrictEqual(segment("Male", "Rural"), [-100, -75]);
  assert.deepStrictEqual(segment("Female", "Urban"), [0, 90]);
  assert.deepStrictEqual(segment("Female", "Rural"), [90, 120]);
});

it("Pyramid keeps updating its domain after another xConfig set", () => {
  const viz = pyramid();
  viz._preDraw();
  viz.xConfig({title: "People"});
  viz.data(rows.map(d => ({...d, pop: d.pop * 2})))._preDraw();
  assert.deepStrictEqual(viz._xConfig.domain, [-240, 240], "the copied domain is still the chart's");
  assert.strictEqual(viz._xConfig.title, "People");
  viz.xConfig({domain: [-500, 500]})._preDraw();
  assert.deepStrictEqual(viz._xConfig.domain, [-500, 500], "a user domain is left alone");
});
