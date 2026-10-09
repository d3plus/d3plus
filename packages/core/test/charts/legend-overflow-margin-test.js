import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    A Plot with more legend entries than its right-hand legend column can hold
    used to claim the legend's single-row fallback width (thousands of pixels)
    as its right margin, flipping the x range negative and drawing every point
    off-screen. The legend now hides instead, and the plot keeps its full width.
*/

const pageFn = ({count}) =>
  new Promise(resolve => {
    const data = Array.from({length: count}, (_, i) => ({
      id: `country ${i}`,
      x: i % 17,
      y: (i * 7) % 23,
    }));
    const chart = new window.d3plus.Plot()
      .select("#s")
      .data(data)
      .groupBy("id")
      .color(d => `hsl(${(Number(d.id.split(" ")[1]) * 360) / count}, 60%, 50%)`)
      .width(958)
      .height(350)
      // These cases cover the legend's margin claim, not placing it inside the plot.
      .legendInset(false)
      .duration(0);
    chart.render(() =>
      resolve({
        right: chart._margin.right,
        range: chart._xAxis._d3Scale.range(),
        legendHeight: chart._legendClass.outerBounds().height,
      }),
    );
  });

it("Plot: a legend too long for its column claims no margin", async function () {
  this.timeout(60000);
  const out = await render('<div id="s"></div>', pageFn, {count: 127});
  assert.strictEqual(out.legendHeight, 0, "legend hidden");
  assert.strictEqual(out.right, 0, "no right margin claimed");
  const [x0, x1] = out.range;
  assert.ok(x1 > x0 && x1 <= 958, `x range stays on-screen: [${x0}, ${x1}]`);
});

it("Plot: a legend that fits still claims its margin", async function () {
  this.timeout(60000);
  const out = await render('<div id="s"></div>', pageFn, {count: 8});
  assert.ok(out.legendHeight > 0, "legend shown");
  assert.ok(out.right > 0, `right margin claimed (${out.right})`);
});
