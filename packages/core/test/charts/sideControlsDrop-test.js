import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Treemap} from "../../index.ts";
import {
  sideControlsDrop,
  zoomControlsInset,
} from "../../src/charts/features/features.ts";
import {getTopLeftContributions} from "../../src/charts/drawSteps/topLeftControls.ts";
import {topLeftControlsReach} from "../../src/charts/drawSteps/topLeftControlsMarkup.ts";
import {zoomControlsReach} from "../../src/charts/drawSteps/zoomControlsMarkup.ts";

useJsdom();

/**
    `sideControlsDrop` is how far a left/right legend or colorScale drops to
    start below the corner control panel on its own side.
*/

const chart = ({zoom = false, tableView = false} = {}) =>
  new Treemap()
    .zoom(zoom)
    .tableView(tableView)
    .search(false)
    .saveControl(false);

const leftReach = viz =>
  topLeftControlsReach(viz, getTopLeftContributions(viz));

it("a right element drops below the zoom controls", () => {
  const viz = chart({zoom: true});
  const reach = zoomControlsReach(viz);
  assert.ok(reach > 0, "the zoom controls reach down the chart");
  assert.strictEqual(sideControlsDrop(viz, "right", 0, 0), reach);
  assert.strictEqual(sideControlsDrop(viz, "right", 10, 0), reach - 10);
});

it("a left element drops below the top-left controls", () => {
  const viz = chart({tableView: true});
  const reach = leftReach(viz);
  assert.ok(reach > 0, "the top-left controls reach down the chart");
  assert.strictEqual(sideControlsDrop(viz, "left", 0, 0), reach);
  assert.strictEqual(sideControlsDrop(viz, "left", 5, 0), reach - 5);
});

it("only the panel on the element's own side counts", () => {
  assert.strictEqual(sideControlsDrop(chart({zoom: true}), "left", 0, 0), 0);
  assert.strictEqual(
    sideControlsDrop(chart({tableView: true}), "right", 0, 0),
    0,
  );
});

it("nothing drops once the top claims already clear the panel", () => {
  const right = chart({zoom: true});
  assert.strictEqual(
    sideControlsDrop(right, "right", zoomControlsReach(right), 0),
    0,
  );
  const left = chart({tableView: true});
  assert.strictEqual(sideControlsDrop(left, "left", leftReach(left), 0), 0);
});

it("nothing drops when the element sits inside a margin wider than the panel", () => {
  const viz = chart({zoom: true});
  assert.ok(zoomControlsInset(viz, 0, 0) > 0);
  assert.strictEqual(sideControlsDrop(viz, "right", 0, 1000), 0);
  const left = chart({tableView: true});
  assert.strictEqual(sideControlsDrop(left, "left", 0, 1000), 0);
});

it("top and bottom elements never drop", () => {
  const viz = chart({zoom: true, tableView: true});
  for (const position of ["top", "bottom", false])
    assert.strictEqual(sideControlsDrop(viz, position, 0, 0), 0);
});
