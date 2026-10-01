import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

it("Viz redraws when a measured web font loads, until destroyed", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const loaded = family =>
          document.fonts.dispatchEvent(
            new window.FontFaceSetLoadEvent("loadingdone", {
              fontfaces: [new window.FontFace(family, "url(x)")],
            }),
          );
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .data([
            {id: "alpha", value: 10},
            {id: "beta", value: 20},
          ]);
        viz.render(() =>
          window.setTimeout(() => {
            let renders = 0;
            const original = viz.render.bind(viz);
            viz.render = cb => (renders++, original(cb));
            const counts = {};
            loaded("Unmeasured Font");
            counts.unrelated = renders;
            // Inter heads the default label font stack, so labels measured it.
            loaded("Inter");
            counts.measured = renders;
            viz.destroy();
            loaded("Inter");
            counts.destroyed = renders;
            resolve(counts);
          }),
        );
      }),
  );

  assert.strictEqual(out.unrelated, 0, "ignores fonts d3plus never measured");
  assert.strictEqual(out.measured, 1, "redraws when a measured font loads");
  assert.strictEqual(out.destroyed, 1, "stops listening after destroy()");
});
