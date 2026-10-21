import assert from "assert";
import {date} from "@d3plus/dom";
import {closeBrowser, render} from "../playwright.js";

/**
    Plot parses time values before handing them to its axes, so its x axis
    receives Dates whether the data holds date strings or Date objects, and
    both draw the same axis.
*/

after(async () => {
  await closeBrowser();
});

/** Renders a LinePlot whose time x values come from `xs` (a `lib => values` source) and reports its x axis. */
const xAxisOf = xs =>
  render(
    "<div id='viz' style='width:600px;height:300px'></div>",
    src =>
      new Promise((resolve, reject) => {
        const lib = window.d3plus;
        const values = new Function("lib", `return (${src})(lib);`)(lib);
        const viz = new lib.LinePlot()
          .data(values.map((x, i) => ({id: "a", x, y: i * 3})))
          .groupBy("id")
          .x("x")
          .time("x")
          .y("y")
          .legend(false)
          .duration(0)
          .select("#viz");
        viz.render(() => {
          try {
            const walk = (node, fn, path = []) => {
              fn(node, path);
              (node.children || []).forEach(c =>
                walk(c, fn, path.concat(node.key)),
              );
            };
            const text = [];
            walk(viz._paintedScene.root, (n, path) => {
              if (n.type === "text" && path.includes("plot-x-axis"))
                text.push({
                  label: n.lines.map(l => l.text).join(" "),
                  x: n.transform.x,
                });
            });
            const axis = viz._xAxis;
            resolve({
              text,
              ticks: axis._visibleTicks.map(Number),
              positions: axis._visibleTicks.map(d => axis._getPosition(d)),
              scale: axis.scale(),
              allDates: axis._data.every(d => d instanceof Date),
              nan: [...document.querySelectorAll("#viz *")].filter(n =>
                [...n.attributes].some(a => a.value.includes("NaN")),
              ).length,
            });
          } catch (e) {
            reject(e);
          }
        });
      }),
    xs,
  );

const cases = {
  quarters: ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025"],
  "ISO days": [
    "2024-01-01",
    "2024-02-01",
    "2024-03-01",
    "2024-04-01",
    "2024-05-01",
  ],
};

for (const [name, strings] of Object.entries(cases)) {
  it(`Plot time x axis: ${name} as strings draw the same as Dates`, async () => {
    const list = JSON.stringify(strings);
    const asStrings = await xAxisOf(`() => ${list}`);
    const stamps = JSON.stringify(strings.map(d => +date(d)));
    const asDates = await xAxisOf(`() => ${stamps}.map(t => new Date(t))`);
    assert.strictEqual(asStrings.scale, "time", "the x axis is a time scale");
    assert.ok(asStrings.allDates, "the axis receives parsed Dates");
    assert.strictEqual(asStrings.nan, 0, "no NaN in the chart");
    assert.ok(asStrings.text.length > 0, "the x axis draws labels");
    assert.ok(
      asStrings.positions.every(Number.isFinite),
      "tick positions are finite",
    );
    assert.deepStrictEqual(asStrings, asDates);
  });
}
