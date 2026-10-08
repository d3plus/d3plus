import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A Plot's plot area (`_plotArea`, in content space under `_chartTransform`)
    lines up with its axes when the chart area starts right of the surface's
    left edge — a left legend, or a small-multiples panel — so the shared
    tooltip's hover surface covers the plot, not a box shifted left by the
    left margin.
*/

after(async () => {
  await closeBrowser();
});

it("the plot area and hover surface sit over the plot with a left legend", async function () {
  this.timeout(60000);
  const out = await render("<div id='viz' style='width:600px;height:400px'></div>", () => new Promise(resolve => {
    const data = [];
    ["a", "b"].forEach(id => [1, 2, 3].forEach(x => data.push({id, x, y: x * (id === "a" ? 2 : 3)})));
    const chart = new window.d3plus.LinePlot().select("#viz").data(data).groupBy("id")
      .legendPosition("left").duration(0);
    chart.render(() => {
      let surface;
      const walk = nodes => nodes.forEach(n => {
        if (n.key === "plot-hover-surface") surface = n;
        if (n.children) walk(n.children);
      });
      walk(chart._paintedScene.root.children);
      resolve({margin: chart._margin.left, area: chart._plotArea, body: chart._bodyRect, surface: surface && surface.x});
    });
  }));
  assert.ok(out.margin > 0, "the legend claims a left margin");
  assert.strictEqual(out.area.x, out.body.x, "the plot area starts where the plot does");
  assert.strictEqual(out.surface, out.area.x, "the hover surface covers the plot area");
});
