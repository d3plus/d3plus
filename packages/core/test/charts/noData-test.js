import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Treemap} from "../../index.ts";
import {showsNoData} from "../../src/charts/viz/noData.ts";
import {showsZoomControls} from "../../src/charts/drawSteps/zoomControlsMarkup.ts";
import {getTopLeftContributions} from "../../src/charts/drawSteps/topLeftControls.ts";
import {moveFocusFromTableView} from "../../src/charts/drawSteps/tableView.ts";

useJsdom();

/**
    `showsNoData`: whether a chart shows its no-data message, which hides its
    zoom and top-left controls and closes its table view.
*/

it("showsNoData: noDataMessage on and nothing left to draw", () => {
  const on = {noDataMessage: true};
  assert.strictEqual(showsNoData({schema: on, _filteredData: []}), true);
  assert.strictEqual(showsNoData({schema: on, _filteredData: [{}]}), false);
  assert.strictEqual(
    showsNoData({schema: on}),
    false,
    "not before the data is filtered",
  );
  assert.strictEqual(
    showsNoData({schema: {noDataMessage: false}, _filteredData: []}),
    false,
    "the message is off",
  );
});

it("showsZoomControls and getTopLeftContributions drop the controls without data, keeping back", () => {
  const viz = new Treemap().zoom(true);
  viz._filteredData = [{}];
  assert.strictEqual(showsZoomControls(viz), true);
  const withData = getTopLeftContributions(viz).length;
  assert.ok(withData > 0, "controls with data");
  viz._filteredData = [];
  assert.strictEqual(showsZoomControls(viz), false);
  assert.strictEqual(getTopLeftContributions(viz).length, 0);
  viz._history = [{}];
  assert.strictEqual(
    getTopLeftContributions(viz).length,
    1,
    "the back button stays",
  );
});

/** A chart container holding a root svg and an open table view's button. */
function tableViewPage(keyboardNav) {
  const container = document.body.appendChild(document.createElement("div"));
  const svg = container.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "svg"),
  );
  const table = container.appendChild(document.createElement("div"));
  table.className = "d3plus-table-view";
  const button = table.appendChild(document.createElement("button"));
  const host = keyboardNav
    ? container.appendChild(document.createElement("div"))
    : undefined;
  host?.setAttribute("tabindex", "0");
  const viz = {
    _select: {node: () => svg},
    _keyboardNav: host ? {host} : undefined,
  };
  return {button, host, svg, viz};
}

it("moveFocusFromTableView moves focus inside the table view to the chart", () => {
  const withNav = tableViewPage(true);
  withNav.button.focus();
  moveFocusFromTableView(withNav.viz);
  assert.strictEqual(document.activeElement, withNav.host, "the keyboard host");

  const without = tableViewPage(false);
  without.button.focus();
  moveFocusFromTableView(without.viz);
  assert.strictEqual(document.activeElement, without.svg, "the root svg");
  assert.strictEqual(without.svg.getAttribute("tabindex"), "-1");
});

it("moveFocusFromTableView leaves focus elsewhere alone", () => {
  const {viz} = tableViewPage(true);
  const outside = document.body.appendChild(document.createElement("button"));
  outside.focus();
  moveFocusFromTableView(viz);
  assert.strictEqual(document.activeElement, outside);
});
