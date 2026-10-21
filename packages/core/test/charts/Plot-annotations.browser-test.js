import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    Locks annotation z-order: back/front annotations route through the scene
    (renderMode("compute") + absorbShapeIntoChartScene); the front layer
    absorbs AFTER the main shape loop so it paints above shapes (back below).
    The deferred-absorb queue in `Plot._paint` is what keeps this working;
    this test fails loud if a future refactor breaks it.
*/

it("Plot back annotations render below shapes; front annotations render above", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.BarChart()
          .select("#s")
          .data([
            {id: "a", x: 1, y: 10},
            {id: "b", x: 2, y: 20},
            {id: "c", x: 3, y: 15},
          ])
          .annotations([
            // Back layer (implicit — no `layer`): a horizontal Line drawn
            // BEHIND the bars.
            {
              shape: "Line",
              data: [{x: 0, y: 5}, {x: 4, y: 5}],
              stroke: "red",
              strokeWidth: 1,
            },
            // Front layer: an explicit overlay drawn ABOVE the bars.
            {
              shape: "Line",
              layer: "front",
              data: [{x: 0, y: 12}, {x: 4, y: 12}],
              stroke: "blue",
              strokeWidth: 2,
            },
          ])
          .render(() => {
            // Find all line paths in document order. The scene path puts
            // back annotations before bar rects, and front annotations
            // after. The DOM render order is z-order under the scene
            // renderer (later = drawn on top).
            const lines = Array.from(
              document.querySelectorAll("path.d3plus-render-path"),
            ).map(p => p.getAttribute("stroke"));
            const rects = document.querySelectorAll("rect.d3plus-render-rect").length;
            // Position of red (back) and blue (front) relative to first bar.
            const allShapes = Array.from(
              document.querySelectorAll(
                "rect.d3plus-render-rect, path.d3plus-render-path",
              ),
            );
            const redIdx = allShapes.findIndex(
              n => n.tagName === "path" && n.getAttribute("stroke") === "red",
            );
            const blueIdx = allShapes.findIndex(
              n => n.tagName === "path" && n.getAttribute("stroke") === "blue",
            );
            const firstRectIdx = allShapes.findIndex(
              n => n.tagName === "rect",
            );
            resolve({lines, rects, redIdx, blueIdx, firstRectIdx});
          });
      }),
  );

  assert.ok(out.rects >= 3, `expected at least 3 bars, got ${out.rects}`);
  assert.ok(out.redIdx >= 0, "back annotation (red line) rendered");
  assert.ok(out.blueIdx >= 0, "front annotation (blue line) rendered");
  assert.ok(
    out.redIdx < out.firstRectIdx,
    `back annotation should precede first bar in document order: redIdx=${out.redIdx}, firstRectIdx=${out.firstRectIdx}`,
  );
  assert.ok(
    out.blueIdx > out.firstRectIdx,
    `front annotation should follow first bar in document order: blueIdx=${out.blueIdx}, firstRectIdx=${out.firstRectIdx}`,
  );
});
