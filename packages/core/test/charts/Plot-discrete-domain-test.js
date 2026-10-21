import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, LinePlot} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {formatPlotData} from "../../src/charts/Plot/pipeline.ts";
import {discreteDomainCategories} from "../../src/charts/Plot/discreteDomain.ts";

useJsdom();

/**
    A user domain on a discrete axis (`xDomain`, or `xConfig.domain`, on a
    LinePlot or vertical BarChart) lists the categories the axis shows. The
    rows whose category it leaves out are dropped before anything is laid
    out, so they can't reach the point scale, which has no position for them
    (a LinePlot's path `d` used to read `MNaN,…`, a bar `translate(NaN,…)`).
*/

const data = ["a", "b"].flatMap((id, j) =>
  [2015, 2016, 2017, 2018, 2019, 2020].map((year, i) => ({id, year, value: (i + 1) * (j + 2)})),
);

/** Runs Plot's data stage and returns the categories it kept, in order. */
function keptYears(viz) {
  viz._preDraw();
  const ctx = runStages({viz}, [formatPlotData]);
  return [...new Set(ctx.plotFormattedData.map(d => (d.x instanceof Date ? d.x.getFullYear() : d.x)))];
}

const lineChart = () => new LinePlot().data(data).groupBy("id").x("year").y("value");

it("discreteDomainCategories: reads xDomain on the discrete axis", () => {
  const viz = lineChart().xDomain([2016, 2019]);
  viz._preDraw();
  runStages({viz}, [formatPlotData]);
  assert.deepStrictEqual([...discreteDomainCategories(viz)], [2016, 2019]);
});

it("discreteDomainCategories: xConfig.domain wins over xDomain, like on the axis", () => {
  const viz = lineChart().xDomain([2016, 2019]).xConfig({domain: [2017, 2018]});
  viz._preDraw();
  runStages({viz}, [formatPlotData]);
  assert.deepStrictEqual([...discreteDomainCategories(viz)], [2017, 2018]);
});

it("discreteDomainCategories: null without a domain, for an empty one, or on a time axis", () => {
  const none = lineChart();
  const empty = lineChart().xDomain([]);
  const time = lineChart().time("year").xDomain([2016, 2019]);
  for (const viz of [none, empty, time]) {
    viz._preDraw();
    runStages({viz}, [formatPlotData]);
    assert.strictEqual(discreteDomainCategories(viz), null);
  }
});

it("discreteDomainCategories: reads yDomain on a horizontal chart's discrete y axis", () => {
  const viz = new BarChart().data(data).groupBy("id").discrete("y").x("value").y("year")
    .yDomain([2017]).xDomain([0, 100]);
  viz._preDraw();
  runStages({viz}, [formatPlotData]);
  assert.deepStrictEqual([...discreteDomainCategories(viz)], [2017]);
});

it("formatPlotData drops the rows whose category a discrete xDomain leaves out", () => {
  assert.deepStrictEqual(keptYears(lineChart().xDomain([2016, 2019])), [2016, 2019]);
  assert.deepStrictEqual(keptYears(lineChart().xConfig({domain: [2017, 2018, 2021]})), [2017, 2018]);
  assert.deepStrictEqual(keptYears(lineChart()), [2015, 2016, 2017, 2018, 2019, 2020], "no domain keeps every row");
});

it("formatPlotData keeps every row when the x axis is a time axis", () => {
  const viz = lineChart().time("year").xDomain([2016, 2019]);
  assert.deepStrictEqual(keptYears(viz), [2015, 2016, 2017, 2018, 2019, 2020]);
});

it("formatPlotData drops categories outside a horizontal BarChart's yDomain", () => {
  const viz = new BarChart().data(data).groupBy("id").discrete("y").x("value").y("year").yDomain([2016, 2018]);
  assert.deepStrictEqual(
    [...new Set((viz._preDraw(), runStages({viz}, [formatPlotData])).plotFormattedData.map(d => d.y))],
    [2016, 2018],
  );
});
