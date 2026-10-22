import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `vizDraw(viz)` lays out the chart-shell chrome, adds each side's claim to
    `viz._margin`, and returns those claims with the panels and the
    sanitized legend/colorScale positions.
*/

it("vizDraw returns the margin it claims, its panels, and the sanitized positions", async function () {
  const res = await render("<div id='viz' style='width:400px;height:300px'></div>", async () => {
    const viz = new window.d3plus.Treemap()
      .select("#viz")
      .data([{id: "a", value: 1}, {id: "b", value: 2}])
      .groupBy("id")
      .title("Title")
      .duration(0);
    await new Promise(r => viz.render(r));
    const before = viz._margin.top;
    const out = window.d3plus.vizDraw(viz);
    return {
      delta: out.marginDelta.top,
      added: viz._margin.top - before,
      samePanels: JSON.stringify(out.featurePanels) === JSON.stringify(viz._featurePanels),
      copied: out.featurePanels !== viz._featurePanels,
      legendPosition: out.legendPosition,
    };
  });
  assert.ok(res.delta > 0, "the title claims top margin");
  assert.strictEqual(res.added, res.delta, "the claim is added to _margin");
  assert.ok(res.samePanels, "the panels it laid out");
  assert.ok(res.copied, "as a copy");
  assert.ok(["top", "bottom", "left", "right"].includes(res.legendPosition), "legendPosition resolved to a side");
});
