import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot whose series run over time draws one point per row on both
    backends: rows of a series at different times stay apart instead of
    merging into one point, whether the x values are Dates or date strings
    and whether the axis gets a time scale, a utc scale, or none.
*/

/** Renders the chart `src` builds (a `(lib, data) => chart` function source) over two series of five months, and reports its circles and x axis. */
const draw = ([src, strings, renderer]) =>
  new Promise((resolve, reject) => {
    const data = ["a", "b"].flatMap((id, j) =>
      [0, 1, 2, 3, 4].map(i => ({
        id,
        date: strings ? `2020-0${i + 1}-01` : new Date(2020, i, 1),
        value: (i + 1) * (j + 2),
      })),
    );
    const viz = new Function("lib", "data", `return (${src})(lib, data);`)(
      window.d3plus,
      data,
    )
      .groupBy("id")
      .legend(false)
      .duration(0)
      .renderer(renderer)
      .select("#viz");
    viz.render(() => {
      try {
        const flat = nodes =>
          nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
        const circles = flat(viz._chartScene)
          .filter(n => n.type === "circle" && !String(n.key).endsWith("::hit"))
          .map(n => ({
            id: n.datum.data.id,
            month: new Date(n.datum.x).getMonth(),
            x: n.transform.x,
            y: n.transform.y,
          }));
        resolve({
          circles,
          domain: viz._xAxis._d3Scale.domain().map(Number),
          canvas: Boolean(document.querySelector("#viz canvas")),
        });
      } catch (e) {
        reject(e);
      }
    });
  });

const run = (src, renderer, strings = false) =>
  render("<div id='viz' style='width:600px;height:300px'></div>", draw, [
    src,
    strings,
    renderer,
  ]);

/** Asserts a point per row, at finite positions, each series running left to right by month. */
const assertPoints = (r, label) => {
  assert.strictEqual(r.circles.length, 10, `${label}: a point per row`);
  r.circles.forEach(c => {
    assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y), `${label}: finite`);
  });
  assert.ok(r.domain.every(Number.isFinite), `${label}: a valid domain`);
  for (const id of ["a", "b"]) {
    const series = r.circles
      .filter(c => c.id === id)
      .sort((a, b) => a.month - b.month);
    assert.deepStrictEqual(
      series.map(c => c.month),
      [0, 1, 2, 3, 4],
      `${label}: every month of ${id}`,
    );
    series.slice(1).forEach((c, i) => {
      assert.ok(c.x > series[i].x, `${label}: ${id} runs left to right`);
    });
  }
};

const plot = "new lib.Plot().data(data).x('date').y('value')";

for (const renderer of ["svg", "canvas"]) {
  it(`Plot ${renderer} — Dates on a time scale draw a point per row`, async () => {
    const r = await run(
      `(lib, data) => ${plot}.xConfig({scale: 'time'})`,
      renderer,
    );
    assert.strictEqual(r.canvas, renderer === "canvas");
    assertPoints(r, "time");
    assert.ok(r.domain[0] <= +new Date(2020, 0, 1));
    assert.ok(r.domain[1] >= +new Date(2020, 4, 1));
  });

  it(`Plot ${renderer} — Dates on a utc scale, or with no scale set, draw a point per row`, async () => {
    assertPoints(
      await run(`(lib, data) => ${plot}.xConfig({scale: 'utc'})`, renderer),
      "utc",
    );
    assertPoints(await run(`(lib, data) => ${plot}`, renderer), "no scale");
  });

  it(`Plot ${renderer} — date strings on a time scale draw a point per row`, async () => {
    assertPoints(
      await run(
        `(lib, data) => ${plot}.xConfig({scale: 'time'})`,
        renderer,
        true,
      ),
      "strings",
    );
  });

  it(`Scatter ${renderer} — a timeline spanning several periods of the x axis's time keeps each period's point`, async () => {
    const r = await run(
      `(lib, data) => new lib.Scatter().data(data).x('date').y('value').time('date')
        .timelineDefault([new Date(2020, 0, 1), new Date(2020, 4, 1)])`,
      renderer,
    );
    assertPoints(r, "timeline");
  });

  it(`LinePlot ${renderer} — date strings on a time scale draw the line`, async () => {
    const r = await render(
      "<div id='viz' style='width:600px;height:300px'></div>",
      renderer =>
        new Promise(resolve => {
          const data = [0, 1, 2, 3, 4].map(i => ({
            id: "a",
            date: `2020-0${i + 1}-01`,
            value: i + 1,
          }));
          const viz = new window.d3plus.LinePlot()
            .data(data)
            .groupBy("id")
            .x("date")
            .y("value")
            .xConfig({scale: "time"})
            .duration(0)
            .renderer(renderer)
            .select("#viz");
          viz.render(() => {
            const flat = nodes =>
              nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
            const line = flat(viz._chartScene).find(
              n => n.shapeType === "Line" && !String(n.key).endsWith("::hit"),
            );
            resolve(line ? `${line.d || ""}${line.points || ""}` : null);
          });
        }),
      renderer,
    );
    assert.ok(r && /\d/.test(r), "draws a line");
    assert.ok(!r.includes("NaN"), "at finite points");
  });
}
