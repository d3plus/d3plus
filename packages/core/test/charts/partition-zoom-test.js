import {it} from "vitest";
import assert from "assert";
import {
  partitionFocus,
  partitionRemoved,
  partitionRenderBase,
  partitionReturning,
  partitionZoomOutFocus,
} from "../../src/charts/partition/zoom.ts";

const key = k => d => d[k];

function mockViz(extra = {}) {
  return {
    schema: {groupBy: [key("group"), key("item")]},
    _filteredData: [
      {group: "A", item: "a1", value: 30},
      {group: "A", item: "a2", value: 10},
    ],
    _drawDepth: 1,
    _history: [],
    ctx: {},
    ...extra,
  };
}

it("partition zoom: partitionFocus is unfocused without history, else reads the clicked level and path", () => {
  assert.deepStrictEqual(partitionFocus(mockViz()), {level: -1, path: []});
  assert.deepStrictEqual(
    partitionFocus(mockViz({_history: [{groupDepth: 0}]})),
    {level: 0, path: ["A"]},
  );
  assert.deepStrictEqual(
    partitionFocus(mockViz({_history: [{groupDepth: 1}], _drawDepth: 0})),
    {level: -1, path: []},
    "never focuses at or past the deepest drawn level",
  );
  assert.deepStrictEqual(
    partitionFocus(mockViz({_history: [{groupDepth: 0}], _filteredData: []})),
    {level: -1, path: []},
  );
});

it("partition zoom: partitionRenderBase reads once per render and reuses it across passes", () => {
  const viz = mockViz();
  let reads = 0;
  const read = () => ({n: ++reads});
  assert.deepStrictEqual(partitionRenderBase(viz, "testPass", read), {n: 1});
  assert.deepStrictEqual(partitionRenderBase(viz, "testPass", read), {n: 1});
  viz._filteredData = viz._filteredData.slice();
  assert.deepStrictEqual(partitionRenderBase(viz, "testPass", read), {n: 2});
  assert.strictEqual(viz.ctx.testPass.base.n, 2);
});

it("partition zoom: partitionRemoved keeps the nodes the next layout drops", () => {
  const prev = [{id: "a"}, {id: "b"}, {id: "c"}];
  assert.deepStrictEqual(
    partitionRemoved(prev, [{id: "b"}]).map(n => n.id),
    ["a", "c"],
  );
  assert.deepStrictEqual(partitionRemoved([], [{id: "b"}]), []);
});

it("partition zoom: partitionZoomOutFocus finds the old focus, or its nearest drawn ancestor", () => {
  const previous = [
    {depth: 0, path: ["A", "m"]},
    {depth: 1, path: ["A", "m", "f"]},
  ];
  const next = [
    {id: "A", depth: 1, path: ["A"]},
    {id: "Am", depth: 2, path: ["A", "m"]},
    {id: "B", depth: 1, path: ["B"]},
  ];
  assert.strictEqual(partitionZoomOutFocus(previous, next).id, "Am");
  assert.strictEqual(partitionZoomOutFocus(previous, next.slice(0, 1)).id, "A");
  assert.strictEqual(partitionZoomOutFocus(previous.slice(1), next), undefined);
});

it("partition zoom: partitionReturning collapses each returning node through the focus", () => {
  const previous = [
    {id: "Am", depth: 0, path: ["A", "m"]},
    {id: "Amf", depth: 1, path: ["A", "m", "f"]},
  ];
  const next = [
    {id: "A", depth: 1, path: ["A"]},
    {id: "Am", depth: 2, path: ["A", "m"]},
    {id: "Amf", depth: 3, path: ["A", "m", "f"]},
    {id: "B", depth: 1, path: ["B"]},
  ];
  const enter = partitionReturning(
    previous,
    next,
    (n, focus) => `${n.id}@${focus.id}`,
  );
  assert.deepStrictEqual(
    [...enter],
    [
      ["A", "A@Am"],
      ["B", "B@Am"],
    ],
  );
  assert.strictEqual(partitionReturning([], next, () => 0).size, 0);
});
