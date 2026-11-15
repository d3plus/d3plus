import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A LinePlot over thousands of numeric x values (a point axis that lists
    every value as a tick) draws, keeping only the ticks spread far enough
    apart to not collide, in order along the axis.
*/

for (const renderer of ["svg", "canvas"]) {
  it(`LinePlot ${renderer} — a dense numeric x axis keeps spaced-out ticks`, async () => {
    const out = await render(
      '<div id="viz" style="width:800px;height:400px"></div>',
      renderer =>
        new Promise(resolve => {
          const data = Array.from({length: 4000}, (_, i) => ({
            id: "a",
            x: i,
            y: Math.sin(i / 50),
          }));
          const viz = new window.d3plus.LinePlot()
            .data(data)
            .groupBy("id")
            .x("x")
            .y("y")
            .renderer(renderer)
            .duration(0)
            .select("#viz");
          viz.render(() => {
            const axis = viz._xAxis;
            resolve({
              available: axis._availableTicks.length,
              positions: axis._visibleTicks.map(d => axis._getPosition(d)),
            });
          });
        }),
      renderer,
    );
    assert.strictEqual(out.available, 4000);
    assert.ok(out.positions.length > 1, "draws more than one tick");
    assert.ok(out.positions.length < 100, "thins the ticks");
    out.positions.slice(1).forEach((p, i) => {
      assert.ok(p - out.positions[i] > 2, "ticks sit apart, in order");
    });
  });
}
