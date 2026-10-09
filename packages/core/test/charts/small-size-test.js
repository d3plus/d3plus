import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Regression coverage for d3plus/d3plus#515 — charts rendered into a very
    small width/height must degrade gracefully rather than throw.

    Two failure modes at tiny sizes:
    - The legend is handed a negative width, so labels wrap to zero lines and
      measured as `NaN`. Row packing then left holes in its row array, and
      `Legend._rowHeight` threw reading `.map` of `undefined`.
    - Below `xCutoff`/`yCutoff` the axes are hidden and never measured, so the
      axis offsets reduced over all-`undefined` inputs and `viz._padding`
      became `NaN`, leaking `translate(NaN, …)` into the rendered SVG.
*/

after(async () => {
  await closeBrowser();
});

const charts = ["BarChart", "LinePlot", "StackedArea", "BumpChart", "Treemap", "Pie"];
const sizes = [
  [1, 1],
  [10, 10],
  [20, 20],
  [15, 200],
  [40, 200],
  [200, 15],
];

it("charts render at very small sizes without errors or NaN attributes", async function () {
  this.timeout(120000);

  const results = await render(
    "",
    ({charts, sizes}) => {
      const data = [];
      for (const id of ["alpha", "beta", "gamma", "delta", "epsilon"])
        for (let year = 2000; year < 2010; year++) data.push({id, year, value: year});

      const run = (name, width, height) =>
        new Promise(resolve => {
          // A throw inside the render pipeline never reaches the callback, so
          // settle on it here; `render` then fails the test with the message.
          const onError = () => resolve({chart: `${name} ${width}x${height}`, error: true});
          window.addEventListener("error", onError, {once: true});
          window.addEventListener("unhandledrejection", onError, {once: true});
          const el = document.createElement("div");
          document.body.appendChild(el);
          const viz = new window.d3plus[name]()
            .select(el)
            .data(data)
            .groupBy("id")
            .duration(0)
            .width(width)
            .height(height);
          if (viz.x) viz.x("year").y("value");
          else if (viz.sum) viz.sum("value");
          else viz.value("value");
          viz.render(() => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onError);
            const nan = [...el.querySelectorAll("*")].filter(n =>
              [...n.attributes].some(a => a.value.includes("NaN")),
            ).length;
            resolve({chart: `${name} ${width}x${height}`, nan});
          });
        });

      return (async () => {
        const out = [];
        for (const name of charts)
          for (const [width, height] of sizes) out.push(await run(name, width, height));
        return out;
      })();
    },
    {charts, sizes},
  );

  // `render` rejects on any uncaught page error, so reaching here means no
  // chart threw; every chart must also have completed its render callback.
  assert.strictEqual(results.length, charts.length * sizes.length);
  const withNaN = results.filter(r => r.nan).map(r => `${r.chart} (${r.nan})`);
  assert.deepStrictEqual(withNaN, [], "no rendered attribute contains NaN");
});
