import {it} from "vitest";
import assert from "assert";

import VizBase from "../../src/charts/viz/VizBase.ts";

/**
    `hover(predicate)` expands the predicate to every id prefix of the rows it
    matches, then hands that expanded predicate to the legend. The rows come
    from the chart's data as well as the legend's, so a predicate that only
    matches a child row (one with no legend entry of its own) still lights up
    its parent's legend entry.
*/
const hover = VizBase.prototype.hover;

function fakeViz({filteredData, legendData}) {
  const legendHovers = [];
  return {
    _filteredData: filteredData,
    _legendClass: {
      data: () => legendData,
      hover(fn) {
        legendHovers.push(fn);
        return this;
      },
    },
    _ids: d => [d.group, d.id].filter(v => v !== undefined),
    schema: {shapeConfig: {hoverOpacity: 0.5}, legend: true},
    legendHovers,
  };
}

it("hover expands a predicate over chart rows that have no legend entry", () => {
  const viz = fakeViz({
    filteredData: [
      {group: "P", id: "a"},
      {group: "P", id: "b"},
      {group: "Q", id: "c"},
    ],
    legendData: [{group: "P"}, {group: "Q"}],
  });
  hover.call(viz, d => d.id === "a");

  assert.strictEqual(
    viz.legendHovers.length,
    1,
    "the legend received a predicate",
  );
  const fn = viz.legendHovers[0];
  assert.ok(
    fn({group: "P"}, 0),
    "the matched row's parent legend entry is highlighted",
  );
  assert.ok(!fn({group: "Q"}, 1), "an unrelated legend entry is not");
  assert.ok(
    fn({group: "P", id: "a"}, 0),
    "the matched row itself is highlighted",
  );
  assert.ok(!fn({group: "P", id: "b"}, 1), "its sibling is not");
});

it("hover still expands a predicate that matches a legend entry", () => {
  const viz = fakeViz({
    filteredData: [{group: "P", id: "a"}],
    legendData: [{group: "P"}, {group: "Q"}],
  });
  hover.call(viz, d => d.group === "Q" && d.id === undefined);
  const fn = viz.legendHovers[0];
  assert.ok(fn({group: "Q"}, 1));
  assert.ok(!fn({group: "P"}, 0));
});

it("hover passes the predicate through unchanged when nothing matches", () => {
  const predicate = d => d.id === "z";
  const viz = fakeViz({
    filteredData: [{group: "P", id: "a"}],
    legendData: [{group: "P"}],
  });
  hover.call(viz, predicate);
  assert.strictEqual(viz.legendHovers[0], predicate);
  assert.strictEqual(
    viz._hover,
    predicate,
    "_hover keeps the caller's predicate",
  );
});
