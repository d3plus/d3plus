import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A callback passed to `render()` runs again after redraws the chart starts
    itself (a legend click, reloading after scrolling back into view) and after
    a later `render()` that passes no callback, until another callback
    replaces it (#1088).
*/

const body = `<div id="viz" style="width: 600px; height: 400px"></div>`;

const drawCounts = () =>
  new Promise((resolve, reject) => {
    const calls = {first: 0, second: 0};
    const tick = ms => new Promise(r => setTimeout(r, ms));
    const viz = new window.d3plus.BarChart()
      .data([
        {id: "alpha", x: "A", y: 10},
        {id: "beta", x: "B", y: 20},
        {id: "gamma", x: "C", y: 15},
      ])
      .groupBy("id")
      .x("x")
      .y("y")
      .legend(true)
      .duration(0)
      .select("#viz");
    const counts = [];
    // Waits for the expected draw (a slow machine can take longer than any
    // fixed delay), then a little longer to catch any extra callback.
    const settle = done => {
      const start = Date.now();
      const poll = () =>
        done() || Date.now() - start > 10000 ? tick(250) : tick(25).then(poll);
      return poll().then(() => counts.push({...calls}));
    };
    viz.render(() => calls.first++);
    settle(() => calls.first >= 1)
      .then(() => {
        // a legend click filters the chart and redraws it
        const legend = viz._legendClass.data();
        viz.schema.on["click.legend"](legend[0], 0, undefined, {
          shiftKey: false,
        });
        return settle(() => calls.first >= 2);
      })
      .then(() => {
        // a redraw without a callback of its own doesn't block resize redraws
        viz.render();
        counts.push({inFlight: viz._callback !== undefined});
        return settle(() => calls.first >= 3);
      })
      .then(() => {
        viz.render(() => calls.second++);
        return settle(() => calls.second >= 1);
      })
      .then(() => {
        viz.render();
        return settle(() => calls.second >= 2);
      })
      .then(() => resolve(counts))
      .catch(reject);
  });

it("render callback: reruns after legend clicks and later redraws", async () => {
  const counts = await render(body, drawCounts);
  assert.deepStrictEqual(counts, [
    {first: 1, second: 0},
    {first: 2, second: 0},
    {inFlight: false},
    {first: 3, second: 0},
    {first: 3, second: 1},
    {first: 3, second: 2},
  ]);
});
