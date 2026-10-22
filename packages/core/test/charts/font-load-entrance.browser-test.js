import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

it("Viz holds a font-load redraw until its entrance animation ends, and redraws once", async function () {
  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.BarChart()
          .select("#s")
          .data([
            {id: "a", x: "Q1", y: 10},
            {id: "b", x: "Q2", y: 20},
          ])
          .groupBy("id")
          .x("x")
          .y("y")
          .legend(false)
          .duration(600)
          .render();
        let renders = 0;
        const original = viz.render.bind(viz);
        viz.render = cb => (renders++, original(cb));
        // Inter heads the default label font stack, so labels measured it.
        const fontLoaded = () =>
          document.fonts.dispatchEvent(
            new window.FontFaceSetLoadEvent("loadingdone", {
              fontfaces: [new window.FontFace("Inter", "url(x)")],
            }),
          );
        const out = {};
        window.setTimeout(fontLoaded, 50);
        window.setTimeout(fontLoaded, 150);
        window.setTimeout(() => (out.during = renders), 400);
        window.setTimeout(() => {
          out.after = renders;
          resolve(out);
        }, viz.duration() + 400);
      }),
  );

  assert.strictEqual(out.during, 0, "defers the redraw while the entrance runs");
  assert.strictEqual(out.after, 1, "two fonts arriving mid-entrance share one redraw after it");
});
