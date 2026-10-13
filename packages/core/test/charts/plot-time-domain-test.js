import assert from "assert";
import it from "../jsdom.js";
import {AxisBottom, BarChart, LinePlot} from "../../es/index.js";
import {runStages} from "../../es/internal.js";
import {axisScaleData} from "../../es/src/components/Axis/timeValues.js";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  computePlotScales,
  formatPlotData,
} from "../../es/src/charts/Plot/pipeline.js";

/**
    A user domain on a time axis (`xDomain` on a LinePlot or BarChart with
    `time` on x, `yDomain` on a horizontal one) takes Dates, timestamps,
    years or date strings, and either end may be left undefined. The axis
    scale reads only the data inside its domain, so its ticks stop at the
    domain's ends instead of running on to the data's.
*/

const data = ["a", "b"].flatMap((id, j) =>
  [2015, 2016, 2017, 2018, 2019, 2020].map((year, i) => ({id, year, value: (i + 1) * (j + 2)})),
);

/** Runs Plot's data → scale stages and returns the given axis's scale domain as years. */
function domainYears(viz, axis = "x") {
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  const ctx = runStages({viz}, [formatPlotData, computePlotAxisValues, computePlotInitialDomains, computePlotScales]);
  const domain = ctx.plotScales[axis].domain();
  assert.ok(domain.every(d => d instanceof Date && !isNaN(d)), `valid Dates: ${domain}`);
  return domain.map(d => d.getFullYear()).sort();
}

const line = () => new LinePlot().data(data).groupBy("id").x("year").time("year").y("value").width(600).height(300);

it("time xDomain: Dates, years, date strings and timestamps all set the scale's domain", () => {
  const forms = {
    Dates: [new Date(2016, 0, 1), new Date(2019, 0, 1)],
    years: [2016, 2019],
    "date strings": ["2016-01-01", "2019-01-01"],
    "quarter strings": ["Q1 2016", "Q1 2019"],
    "year strings": ["2016", "2019"],
    timestamps: [+new Date(2016, 0, 1), +new Date(2019, 0, 1)],
  };
  for (const [name, domain] of Object.entries(forms))
    assert.deepStrictEqual(domainYears(line().xDomain(domain)), [2016, 2019], name);
});

it("time xDomain: an undefined end comes from the data", () => {
  assert.deepStrictEqual(domainYears(line().xDomain([2017])), [2017, 2020], "[start]");
  assert.deepStrictEqual(domainYears(line().xDomain([undefined, 2018])), [2015, 2018], "[undefined, end]");
});

it("time xDomain does not change the user's array", () => {
  const domain = ["2016", "2019"];
  domainYears(line().xDomain(domain));
  assert.deepStrictEqual(domain, ["2016", "2019"]);
});

it("time yDomain on a horizontal BarChart parses its ends", () => {
  const viz = new BarChart().data(data).groupBy("id").discrete("y").x("value").y("year").time("year")
    .yDomain(["2016", "2018"]).width(600).height(300);
  assert.deepStrictEqual(domainYears(viz, "y"), [2016, 2018]);
});

it("axisScaleData: a time axis keeps only the data inside its domain", () => {
  const years = [2015, 2016, 2017, 2018, 2019, 2020].map(y => new Date(y, 0, 1));
  const axis = new AxisBottom().scale("time").data(years).domain([new Date(2016, 0, 1), new Date(2019, 0, 1)]);
  assert.deepStrictEqual(axisScaleData(axis).map(d => d.getFullYear()), [2016, 2017, 2018, 2019]);
  axis.domain([new Date(2019, 0, 1), new Date(2016, 0, 1)]);
  assert.strictEqual(axisScaleData(axis).length, 4, "an inverted domain works too");
  axis.domain(["2017", "2018"]);
  assert.deepStrictEqual(axisScaleData(axis).map(d => d.getFullYear()), [2017, 2018], "string ends");
});

it("axisScaleData: a time axis with an unparseable domain end keeps every value", () => {
  const years = [2015, 2016, 2017].map(y => new Date(y, 0, 1));
  const axis = new AxisBottom().scale("time").data(years).domain([new Date(2016, 0, 1), "not a date"]);
  assert.strictEqual(axisScaleData(axis).length, 3);
});

it("axisScaleData: a linear axis returns its data as given", () => {
  const axis = new AxisBottom().scale("linear").data([1, 5, 10]).domain([2, 6]);
  assert.deepStrictEqual(axisScaleData(axis), [1, 5, 10]);
});

it("a standalone time axis ticks only inside its domain", () => {
  const years = [2015, 2016, 2017, 2018, 2019, 2020].map(y => new Date(y, 0, 1));
  const axis = new AxisBottom().scale("time").width(500).height(100).duration(0)
    .data(years).domain([new Date(2016, 0, 1), new Date(2019, 0, 1)]);
  axis.render();
  assert.deepStrictEqual(axis._visibleTicks.map(d => new Date(d).getFullYear()), [2016, 2017, 2018, 2019]);
});
