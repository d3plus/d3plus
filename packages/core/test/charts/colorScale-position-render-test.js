import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A colorScale at its default position is laid out twice (once as an inset
    candidate, then in its margin), and the second placement must be the one
    painted, even on an animated chart.
*/

after(async () => {
  await closeBrowser();
});

it("a default-position colorScale paints in its own margin band", async function () {
  this.timeout(60000);
  const out = await render(
    "<div id='viz' style='width:500px;height:700px'></div>",
    async () => {
      const data = Array.from({length: 40}, (_, i) => ({id: `n${i}`, value: i + 1}));
      const viz = new window.d3plus.Treemap()
        .select("#viz")
        .data(data)
        .sum("value")
        .colorScale("value")
        .title("Title");
      await new Promise(r => viz.render(r));
      const svg = document.querySelector("#viz svg");
      const top = svg.getBoundingClientRect().top;
      const swatches = [...svg.querySelectorAll("text")]
        .filter(t => / - |\+$/.test(t.textContent))
        .map(t => t.getBoundingClientRect().top - top);
      return {
        position: viz.schema.colorScalePosition(viz),
        bandTop: viz.schema.height - viz._margin.bottom,
        swatchTop: Math.min(...swatches),
      };
    },
  );
  assert.strictEqual(out.position, "bottom");
  assert.ok(
    out.swatchTop >= out.bandTop - 1,
    `colorScale (${out.swatchTop}) sits below the chart area (${out.bandTop})`,
  );
});
