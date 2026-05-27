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
    '<svg id="s" width="400" height="300"></svg>',
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
              svgs: document.getElementsByTagName("svg").length,
              treemaps: document.getElementsByClassName("d3plus-Treemap").length,
              rects: document.querySelectorAll("rect.d3plus-Rect").length,
            }),
          );
      }),
  );

  assert.strictEqual(out.svgs, 1, "renders into a single <svg>");
  assert.strictEqual(out.treemaps, 1, "created the Treemap container group");
  assert.strictEqual(out.rects, 3, "drew a rectangle for each datum");
});
