import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    `zoomFeature` returns its four zoom-control buttons as an `htmlOverlay`
    panel from `layout()` (the FeatureModule contract: no direct
    `viz._featurePanels` mutation). `runVizPipeline` appends the returned
    panels to `viz._featurePanels`, which `Viz.toScene()` walks into the
    scene graph. This renders a zoom-enabled Network in a real browser and
    asserts the buttons reach the DOM — locking the returned-panel path
    (nothing else in the suite exercises the zoom-control overlay).
*/
after(async () => {
  await closeBrowser();
});

it("Network zoom controls render via the returned feature panel", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Network()
          .select("#s")
          .nodes([
            {id: "a", x: 0, y: 0},
            {id: "b", x: 100, y: 100},
          ])
          .links([{source: "a", target: "b"}])
          .render(() =>
            resolve({
              controls: document.querySelectorAll(".zoom-control").length,
              zoomIn: document.querySelectorAll(".zoom-control.zoom-in").length,
            }),
          );
      }),
  );

  assert.strictEqual(
    out.controls,
    4,
    "four zoom-control buttons rendered (in/out/reset/brush)",
  );
  assert.strictEqual(out.zoomIn, 1, "zoom-in button present");
});
