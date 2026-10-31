import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A chart whose container is only partly on screen: its top is scrolled above
    the viewport, so a new root <svg> (the browser's default 300×150, at the
    top of the container) starts out of view. Sizing the svg to the chart's
    explicit height brings it into view, and the render used to measure
    visibility both before and after that: it skipped measuring the width
    (off screen) yet went on to draw (on screen), with an undefined width that
    came out as NaN in every position.
*/
it("a chart with only a height, partly scrolled out of view, measures its width", async () => {
  const out = await render(
    '<div style="height:2000px"></div><div id="viz" style="width:600px;height:500px"></div><div style="height:2000px"></div>',
    () =>
      new Promise(resolve => {
        const host = document.querySelector("#viz");
        window.scrollTo(
          0,
          host.getBoundingClientRect().top + window.scrollY + 200,
        );
        const errors = [];
        const original = console.error;
        console.error = (...args) => errors.push(String(args[0]));
        const viz = new window.d3plus.BarChart()
          .config({
            data: [
              {id: "alpha", x: 1, y: 7},
              {id: "beta", x: 2, y: 4},
            ],
            groupBy: "id",
            x: "x",
            y: "y",
            height: 500,
          })
          .duration(0)
          .select(host);
        viz.render(() => {
          console.error = original;
          const svg = host.querySelector("svg.d3plus-viz");
          resolve({
            width: viz.width(),
            attr: svg.getAttribute("width"),
            nan: errors.filter(e => e.includes("NaN")).length,
          });
        });
      }),
  );
  assert.strictEqual(
    out.width,
    600,
    "the width is measured from the container",
  );
  assert.strictEqual(out.attr, "600px", "the svg takes that width");
  assert.strictEqual(out.nan, 0, "nothing is drawn at a NaN position");
});
