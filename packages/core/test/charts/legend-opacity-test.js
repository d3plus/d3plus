import {it} from "vitest";
import assert from "assert";
import {applyLegendOpacity} from "../../src/charts/viz/interactionOpacity.ts";

/**
    The legend dims with the chart's hover, keeping lit each entry the hover
    matches and each entry a lit chart mark belongs to: a chart whose hover
    matches its own laid-out rows (a nested node, a merged group row) still
    lights the legend entry its group falls under.
*/
const rows = [
  {group: "P", id: "a"},
  {group: "P", id: "b"},
  {group: "Q", id: "c"},
];
const pGroup = {group: "P", id: ["a", "b"]};
const wrap = data => ({__d3plus__: true, data});

function fakeViz(hover, extra = {}) {
  return {
    _hover: hover,
    _legendDepth: 0,
    _chartScene: [
      ...rows.map(d => ({type: "rect", key: d.id, datum: wrap(d)})),
      {type: "rect", key: "P", datum: wrap(pGroup)},
      {
        type: "group",
        key: "axis",
        interactionGroup: "axis",
        children: [
          {type: "rect", key: "tick", datum: {group: "Q", tick: true}},
        ],
      },
    ],
    schema: {
      groupBy: [d => d.group, d => d.id],
      shapeConfig: {},
    },
    ...extra,
  };
}

const legend = () => ({
  type: "group",
  key: "legend",
  children: [
    {type: "rect", key: "P", datum: {group: "P", id: ["a", "b"]}},
    {type: "rect", key: "Q", datum: {group: "Q", id: "c"}},
    {type: "text", key: "Q-label", datum: wrap({group: "Q", id: "c"})},
  ],
});

const opacities = node =>
  Object.fromEntries(
    node.children.map(n => [n.key, n.paint ? n.paint.opacity : undefined]),
  );

it("lights the entry a hovered nested row belongs to", () => {
  const out = applyLegendOpacity(
    legend(),
    fakeViz(d => d === rows[1]),
  );
  assert.deepStrictEqual(opacities(out), {
    P: undefined,
    Q: 0.5,
    "Q-label": 0.5,
  });
});

it("lights the entry a hovered group row belongs to", () => {
  const out = applyLegendOpacity(
    legend(),
    fakeViz(d => d === pGroup),
  );
  assert.deepStrictEqual(opacities(out), {
    P: undefined,
    Q: 0.5,
    "Q-label": 0.5,
  });
});

it("keeps an entry the hover matches directly", () => {
  const out = applyLegendOpacity(
    legend(),
    fakeViz(d => d.group === "Q"),
  );
  assert.strictEqual(opacities(out).Q, undefined);
  assert.strictEqual(opacities(out)["Q-label"], undefined);
});

it("follows the active and highlight predicates too", () => {
  const active = applyLegendOpacity(
    legend(),
    fakeViz(undefined, {_active: d => d === rows[2]}),
  );
  assert.deepStrictEqual(opacities(active), {
    P: 0.25,
    Q: undefined,
    "Q-label": undefined,
  });
});

it("ignores axis chrome and leaves the legend alone without a predicate", () => {
  const out = applyLegendOpacity(
    legend(),
    fakeViz(d => d.tick === true),
  );
  assert.deepStrictEqual(opacities(out), {P: 0.5, Q: 0.5, "Q-label": 0.5});
  const idle = legend();
  assert.strictEqual(applyLegendOpacity(idle, fakeViz(undefined)), idle);
});

it("compares groups at the legend's depth", () => {
  const viz = fakeViz(d => d === rows[1], {_legendDepth: 1});
  const out = applyLegendOpacity(
    {
      type: "group",
      key: "legend",
      children: [
        {type: "rect", key: "a", datum: {group: "P", id: "a"}},
        {type: "rect", key: "b", datum: {group: "P", id: "b"}},
      ],
    },
    viz,
  );
  assert.deepStrictEqual(opacities(out), {a: 0.5, b: undefined});
});
