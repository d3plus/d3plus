import {it} from "vitest";
import assert from "assert";
import {singleTooltipFooter} from "../../src/charts/Plot/sharedTooltip.ts";
import {setOwnClick} from "../../src/charts/viz/userClick.ts";

/**
    A Plot's single-mark tooltip offers "Click to Expand" only while the
    chart's own `click.shape` handler is installed and a deeper level exists.
*/

function clickShape() {}

/** A Plot stand-in drawn at `depth` of two `groupBy` levels, its own click installed. */
function plot(depth = 0) {
  const viz = {
    _drawDepth: depth,
    schema: {groupBy: [d => d.region, d => d.state], translate: s => `t:${s}`},
  };
  const own = clickShape.bind(viz);
  setOwnClick(viz, "click.shape", own);
  viz.schema.on = {"click.shape": own};
  return viz;
}

it("singleTooltipFooter offers a drill while the chart's own click is installed", () => {
  assert.strictEqual(singleTooltipFooter(plot()), "t:Click to Expand");
  const viz = plot();
  viz.schema.on = {...viz.schema.on, click: () => undefined};
  assert.strictEqual(
    singleTooltipFooter(viz),
    "t:Click to Expand",
    "a click handler runs beside it",
  );
});

it("singleTooltipFooter offers nothing at the deepest level", () => {
  assert.strictEqual(singleTooltipFooter(plot(1)), false);
});

it("singleTooltipFooter offers nothing once the chart's own click is replaced", () => {
  const viz = plot();
  viz.schema.on = {"click.shape": () => undefined};
  assert.strictEqual(
    singleTooltipFooter(viz),
    false,
    "a handler of the user's",
  );
  viz.schema.on = {"click.shape": clickShape.bind(viz)};
  assert.strictEqual(singleTooltipFooter(viz), false, "a bound one");
  viz.schema.on = {"click.shape": null};
  assert.strictEqual(singleTooltipFooter(viz), false, "none");
  viz.schema.on = {};
  assert.strictEqual(singleTooltipFooter(viz), false, "none");
});
