import {it} from "vitest";
import assert from "assert";

import {simpleHover} from "../../src/charts/viz/simpleHover.ts";

function fakeViz({legend = true, renderer = true} = {}) {
  const log = {legend: [], repaints: 0};
  return {
    schema: {legend},
    _legendClass: {hover: fn => log.legend.push(fn)},
    _sceneRenderer: renderer ? {} : undefined,
    _scheduleSceneRepaint: () => log.repaints++,
    log,
  };
}

it("simpleHover stores the predicate, forwards it to the legend, and repaints", () => {
  const viz = fakeViz();
  const pred = d => d.id === "a";
  assert.strictEqual(simpleHover.call(viz, pred), viz, "returns the chart for chaining");
  assert.strictEqual(viz._hover, pred);
  assert.deepStrictEqual(viz.log.legend, [pred]);
  assert.strictEqual(viz.log.repaints, 1);
  simpleHover.call(viz, false);
  assert.strictEqual(viz._hover, false, "false clears the hover");
  assert.strictEqual(viz.log.repaints, 2);
});

it("simpleHover skips a hidden legend and an unmounted chart", () => {
  const viz = fakeViz({legend: false, renderer: false});
  simpleHover.call(viz, () => true);
  assert.deepStrictEqual(viz.log.legend, []);
  assert.strictEqual(viz.log.repaints, 0);
});
