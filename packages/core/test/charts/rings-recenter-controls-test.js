import assert from "assert";

import {closeBrowser, render} from "../playwright.js";

/**
    Clicking a Rings node re-centers the chart by re-running `_draw()`
    outside the render pipeline. `_draw()` resets the feature panels, so it
    used to drop the post-draw overlays (zoom controls, the top-left
    back/table/search panel, attribution) until the next full render. The
    click handler now re-runs them via `runPostDrawFeatures`.
*/

after(async () => {
  await closeBrowser();
});

const panelsAfter = click =>
  render('<div id="viz" style="width:800px;height:600px"></div>', clickId =>
    new Promise((resolve, reject) => {
      const viz = new window.d3plus.Rings()
        .links([
          {source: "a", target: "b"}, {source: "a", target: "c"}, {source: "a", target: "d"},
          {source: "b", target: "e"}, {source: "c", target: "f"},
        ])
        .center("a")
        .duration(0)
        .select("#viz");
      viz.render(() => {
        try {
          if (clickId) viz.schema.on["click.shape"]({id: clickId});
          resolve({center: viz.schema.center, panels: viz._featurePanels.map(p => p.key)});
        } catch (e) {
          reject(e);
        }
      });
    }), click);

it("Rings: re-centering on click keeps the zoom and top-left controls", async () => {
  const before = await panelsAfter();
  const after = await panelsAfter("b");
  assert.strictEqual(after.center, "b");
  ["viz-zoom-controls", "viz-top-left-controls"].forEach(key => {
    assert.ok(before.panels.includes(key), `${key} present after render`);
    assert.ok(after.panels.includes(key), `${key} still present after the click`);
  });
});
