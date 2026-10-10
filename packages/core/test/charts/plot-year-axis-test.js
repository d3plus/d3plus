import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    A numeric year column on a continuous Plot axis labels its ticks as
    years ("1990"), while a value axis of thousands that reaches a zero
    baseline still abbreviates ("1.5k").
*/

after(async () => {
  await closeBrowser();
});

/** Renders the chart built by `src` (a `(lib, data) => chart` function source) and reports its axes' tick labels. */
const axisLabels = src =>
  render(
    "<div id='viz' style='width:600px;height:300px'></div>",
    src =>
      new Promise((resolve, reject) => {
        const lib = window.d3plus;
        const data = [];
        for (let year = 1990; year <= 2020; year++)
          data.push({id: `p${year}`, group: year % 2 ? "A" : "B", year, value: (year - 1980) * 50});
        const viz = new Function("lib", "data", `return (${src})(lib, data);`)(lib, data);
        viz
          .legend(false)
          .duration(0)
          .select("#viz")
          .render(() => {
            try {
              const labels = axis => axis._visibleTicks.map(axis._labelFormat);
              resolve({x: labels(viz._xAxis), y: labels(viz._yAxis)});
            } catch (e) {
              reject(e);
            }
          });
      }),
    src.toString(),
  );

it("Plot — a continuous year axis labels ticks as years", async () => {
  const {x} = await axisLabels(
    (lib, data) => new lib.Plot().data(data).groupBy("id").x("year").y("value"),
  );
  assert.ok(x.length > 2, `draws ticks: ${x}`);
  assert.ok(x.every(d => /^(19|20)\d\d$/.test(d)), `year labels: ${x}`);
});

it("Plot — a year axis beside a discrete axis labels ticks as years", async () => {
  const {x, y} = await axisLabels(
    (lib, data) =>
      new lib.Plot().data(data).groupBy("id").x("year").y("group").discrete("y"),
  );
  assert.ok(x.every(d => /^(19|20)\d\d$/.test(d)), `year labels: ${x}`);
  assert.strictEqual(new Set(x).size, x.length, `no repeated labels: ${x}`);
  assert.deepStrictEqual([...y].sort(), ["A", "B"]);
});

it("BarChart — a zero-based value axis still abbreviates thousands", async () => {
  const {y} = await axisLabels(
    (lib, data) => new lib.BarChart().data(data).groupBy("id").x("year").y("value"),
  );
  assert.ok(y.some(d => /^\d+(\.\d+)?k$/.test(d)), `abbreviated labels: ${y}`);
});
