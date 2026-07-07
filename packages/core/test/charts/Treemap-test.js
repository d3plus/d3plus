import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

// The Viz render pipeline awaits browser layout that never resolves under
// jsdom, so the chart is rendered in a headless browser instead.
after(async () => {
  await closeBrowser();
});

it("Treemap", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Treemap()
          .select("#s")
          .data([
            {id: "a", value: 10},
            {id: "b", value: 20},
            {id: "c", value: 5},
          ])
          .render(() =>
            resolve({
              renderSvgs: document.querySelectorAll("svg.d3plus-render-svg").length,
              rects: document.querySelectorAll("rect.d3plus-render-rect").length,
            }),
          );
      }),
  );

  assert.strictEqual(out.renderSvgs, 1, "rendered through @d3plus/render into the target");
  assert.strictEqual(out.rects, 3, "scene drew a rect for each datum");
});
