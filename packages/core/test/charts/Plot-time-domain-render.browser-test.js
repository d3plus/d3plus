import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A user domain on a time axis takes effect on both backends: the axis
    spans the domain and ticks only inside it, and a BarChart draws only the
    bars the domain reaches, spaced as if the others weren't there.
*/

/** Renders the chart `src` builds (a `(lib, data) => chart` function source) and reports its time axis and bars. */
const draw = ([src, renderer]) =>
  new Promise((resolve, reject) => {
    const data = ["a", "b"].flatMap((id, j) =>
      [2015, 2016, 2017, 2018, 2019, 2020].map((year, i) => ({
        id,
        year,
        value: (i + 1) * (j + 2),
      })),
    );
    const viz = new Function("lib", "data", `return (${src})(lib, data);`)(
      window.d3plus,
      data,
    )
      .groupBy("id")
      .legend(false)
      .timeline(false)
      .duration(0)
      .renderer(renderer)
      .select("#viz");
    viz.render(() => {
      try {
        const flat = nodes =>
          nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
        const nodes = flat(viz._chartScene);
        const horizontal = viz.schema.discrete === "y";
        const axis = horizontal ? viz._yAxis : viz._xAxis;
        const year = d => new Date(+d).getFullYear();
        const bars = nodes
          .filter(
            n =>
              n.type === "rect" &&
              n.shapeType === "Bar" &&
              !String(n.key).endsWith("::hit"),
          )
          .map(n => ({
            key: `${n.datum.data.id}_${year(n.datum[horizontal ? "y" : "x"])}`,
            size: horizontal ? n.height : n.width,
          }));
        resolve({
          domain: axis._d3Scale
            .domain()
            .map(d => [year(d), new Date(d).getMonth()]),
          ticks: axis._visibleTicks.map(year),
          bars,
          canvas: Boolean(document.querySelector("#viz canvas")),
        });
      } catch (e) {
        reject(e);
      }
    });
  });

const run = (src, renderer) =>
  render("<div id='viz' style='width:600px;height:300px'></div>", draw, [
    src,
    renderer,
  ]);

const line = "new lib.LinePlot().data(data).x('year').time('year').y('value')";

for (const renderer of ["svg", "canvas"]) {
  it(`LinePlot time xDomain spans and ticks only the domain (${renderer})`, async () => {
    const r = await run(
      `(lib, data) => ${line}.xDomain([new Date(2016, 0, 1), new Date(2019, 0, 1)])`,
      renderer,
    );
    assert.strictEqual(r.canvas, renderer === "canvas");
    assert.deepStrictEqual(r.domain, [
      [2016, 0],
      [2019, 0],
    ]);
    assert.deepStrictEqual(r.ticks, [2016, 2017, 2018, 2019]);
  });

  it(`LinePlot time xDomain with one end set (${renderer})`, async () => {
    const start = await run(
      `(lib, data) => ${line}.xDomain(["2017"])`,
      renderer,
    );
    assert.deepStrictEqual(start.ticks, [2017, 2018, 2019, 2020]);
    const end = await run(
      `(lib, data) => ${line}.xDomain([undefined, "2018"])`,
      renderer,
    );
    assert.deepStrictEqual(end.ticks, [2015, 2016, 2017, 2018]);
  });

  it(`BarChart time xDomain draws only the bars inside it (${renderer})`, async () => {
    const all = await run(
      "(lib, data) => new lib.BarChart().data(data).x('year').time('year').y('value')",
      renderer,
    );
    const r = await run(
      "(lib, data) => new lib.BarChart().data(data).x('year').time('year').y('value').xDomain([2016, 2019])",
      renderer,
    );
    assert.deepStrictEqual(r.ticks, [2016, 2017, 2018, 2019]);
    assert.deepStrictEqual(r.bars.map(b => b.key).sort(), [
      "a_2016",
      "a_2017",
      "a_2018",
      "a_2019",
      "b_2016",
      "b_2017",
      "b_2018",
      "b_2019",
    ]);
    // Four years share the width six did, so each bar is wider.
    assert.ok(
      r.bars[0].size > all.bars[0].size * 1.3,
      `bars widen: ${r.bars[0].size} vs ${all.bars[0].size}`,
    );
  });

  it(`horizontal BarChart time yDomain (${renderer})`, async () => {
    const r = await run(
      "(lib, data) => new lib.BarChart().data(data).discrete('y').x('value').y('year').time('year').yDomain(['2016', '2018'])",
      renderer,
    );
    assert.deepStrictEqual(r.ticks.slice().sort(), [2016, 2017, 2018]);
    assert.deepStrictEqual(r.bars.map(b => b.key).sort(), [
      "a_2016",
      "a_2017",
      "a_2018",
      "b_2016",
      "b_2017",
      "b_2018",
    ]);
  });
}
