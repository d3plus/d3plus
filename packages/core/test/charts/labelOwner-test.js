import {it} from "vitest";
import assert from "assert";
import {labelOwner, labelOwnerPick} from "../../src/charts/viz/labelOwner.ts";

/**
    A mark's label is a text node whose datum wraps the mark's datum; the
    pointer bridge reads a pick on it as a pick on the mark.
*/

const row = {id: "a", value: 8};
const wrapped = {__d3plus__: true, data: row, i: 2};
const labelOf = (key, data) => ({
  type: "text",
  key,
  text: "8",
  datum: {__d3plus__: true, data, l: 0, text: "8"},
  index: 0,
});

const scene = (cells, extra = []) => ({
  width: 400,
  height: 300,
  root: {
    type: "group",
    key: "root",
    children: [
      {type: "group", key: "viz-chart-cells", children: cells},
      ...extra,
    ],
  },
});

it("labelOwner: a label whose datum wraps a mark's datum belongs to that mark", () => {
  const bar = {type: "rect", key: "bar-a", datum: wrapped, index: 2};
  const label = labelOf("bar-a_0", wrapped);
  const cells = {type: "group", key: "viz-chart-cells", children: [bar, label]};
  assert.strictEqual(labelOwner(cells, label), bar);
});

it("labelOwner: follows the label's datum down to a mark drawn from the row it wraps", () => {
  // A Pie wedge's datum is the row; its label wraps the arc ({data: row}).
  const wedge = {type: "path", key: "pie-a", datum: row, index: 0};
  const label = labelOf("pie-label-a_0", {data: row, i: 0, startAngle: 0});
  const cells = {
    type: "group",
    key: "viz-chart-cells",
    children: [wedge, label],
  };
  assert.strictEqual(labelOwner(cells, label), wedge);
});

it("labelOwner: matches a mark that wraps the row a label points at", () => {
  const bar = {type: "rect", key: "bar-a", datum: wrapped, index: 2};
  const label = {type: "text", key: "t", datum: row};
  const cells = {type: "group", key: "viz-chart-cells", children: [bar, label]};
  assert.strictEqual(labelOwner(cells, label), bar);
});

it("labelOwner: a line's label belongs to the line holding the point it names", () => {
  const last = {__d3plus__: true, data: {id: "a", x: 2}, i: 1};
  const line = {
    type: "line",
    key: "line-a",
    datum: {__d3plus__: true, data: {id: "a"}, i: 0},
    interactionPoints: [
      {x: 0, y: 0, datum: {__d3plus__: true, data: {id: "a", x: 1}, i: 0}},
      {x: 10, y: 0, datum: last},
    ],
  };
  const label = labelOf("a_0", last);
  const cells = {
    type: "group",
    key: "viz-chart-cells",
    children: [line, label],
  };
  assert.strictEqual(labelOwner(cells, label), line);
});

it("labelOwner: finds marks nested in groups, and skips hit areas, inert nodes, and chrome", () => {
  const hit = {type: "rect", key: "bar-a::hit", datum: wrapped};
  const inert = {
    type: "rect",
    key: "ghost",
    datum: wrapped,
    interactive: false,
  };
  const axis = {
    type: "rect",
    key: "tick",
    datum: wrapped,
    interactionGroup: "axis",
  };
  const bar = {type: "rect", key: "bar-a", datum: wrapped};
  const label = labelOf("bar-a_0", wrapped);
  const cells = {
    type: "group",
    key: "viz-chart-cells",
    children: [
      hit,
      inert,
      axis,
      {type: "group", key: "panel", children: [bar]},
      label,
    ],
  };
  assert.strictEqual(labelOwner(cells, label), bar);
});

it("labelOwner: undefined for a label of no mark, and for a node that is not text", () => {
  const bar = {type: "rect", key: "bar-a", datum: wrapped};
  const stray = labelOf("stray", {id: "z"});
  const cells = {type: "group", key: "viz-chart-cells", children: [bar, stray]};
  assert.strictEqual(labelOwner(cells, stray), undefined);
  assert.strictEqual(labelOwner(cells, bar), undefined);
});

it("labelOwnerPick: a pick on a chart label becomes a pick on its mark", () => {
  const bar = {type: "rect", key: "bar-a", datum: wrapped, index: 2};
  const label = labelOf("bar-a_0", wrapped);
  const s = scene([bar, label]);
  const pick = labelOwnerPick(s, {node: label, datum: label.datum, index: 0});
  assert.deepStrictEqual(pick, {node: bar, datum: wrapped, index: 2});
  assert.strictEqual(pick.node, bar);
  assert.strictEqual(pick.datum, wrapped);
});

it("labelOwnerPick: marks, labels outside the chart cells, and labels of nothing are kept as picked", () => {
  const bar = {type: "rect", key: "bar-a", datum: wrapped, index: 2};
  const legendLabel = labelOf("legend-a_0", wrapped);
  const stray = labelOf("stray", {id: "z"});
  const s = scene(
    [bar, stray],
    [{type: "group", key: "viz-legend", children: [legendLabel]}],
  );
  for (const node of [bar, legendLabel, stray]) {
    const pick = {node, datum: node.datum, index: 0};
    assert.strictEqual(labelOwnerPick(s, pick), pick, String(node.key));
  }
  assert.strictEqual(labelOwnerPick(s, null), null);
  const pick = {node: legendLabel, datum: legendLabel.datum};
  assert.strictEqual(labelOwnerPick(undefined, pick), pick, "no painted scene");
});

it("labelOwnerPick: reads each painted scene's own marks", () => {
  const label = labelOf("bar-a_0", wrapped);
  const first = {type: "rect", key: "bar-a", datum: wrapped, index: 2};
  const second = {type: "rect", key: "bar-a", datum: wrapped, index: 2};
  const pick = {node: label, datum: label.datum};
  assert.strictEqual(labelOwnerPick(scene([first, label]), pick).node, first);
  assert.strictEqual(labelOwnerPick(scene([second, label]), pick).node, second);
});
