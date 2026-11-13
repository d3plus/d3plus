import {it} from "vitest";
import assert from "assert";

import {simpleHover} from "../../src/charts/viz/simpleHover.ts";

function fakeViz({renderer = true} = {}) {
  const log = {repaints: 0};
  return {
    schema: {},
    _sceneRenderer: renderer ? {} : undefined,
    _scheduleSceneRepaint: () => log.repaints++,
    log,
  };
}

it("simpleHover stores the predicate and repaints", () => {
  const viz = fakeViz();
  const pred = d => d.id === "a";
  assert.strictEqual(
    simpleHover.call(viz, pred),
    viz,
    "returns the chart for chaining",
  );
  assert.strictEqual(viz._hover, pred);
  assert.strictEqual(viz.log.repaints, 1);
  simpleHover.call(viz, false);
  assert.strictEqual(viz._hover, false, "false clears the hover");
  assert.strictEqual(viz.log.repaints, 2);
});

it("simpleHover skips the repaint on an unmounted chart", () => {
  const viz = fakeViz({renderer: false});
  simpleHover.call(viz, () => true);
  assert.strictEqual(viz.log.repaints, 0);
});
