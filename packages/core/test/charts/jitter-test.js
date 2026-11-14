import {it} from "vitest";
import assert from "assert";
import {
  DEFAULT_TICK_LENGTH,
  jitterAccessor,
  plotBand,
} from "../../src/charts/Plot/jitter.ts";
import {jitterOffset} from "../../src/utils/jitter.ts";

/**
    Plot's band (across its `discrete` axis) and the jittered positions
    of point marks within it.
*/

const positions = {A: 100, B: 200, C: 300};
const inputs = (discrete, values, extra = {}) => ({
  viz: {schema: {discrete}},
  values,
  x: v => (typeof v === "string" ? positions[v] : v * 10),
  y: v => (typeof v === "string" ? positions[v] : 500 - v * 10),
  xDomain: ["A", "B", "C"],
  yDomain: [0, 50],
  xRange: [0, 400],
  yRange: [0, 500],
  ...extra,
});
const rows = [
  {id: "a1", x: "A", y: 10},
  {id: "b1", x: "B", y: 20},
];

it("plotBand: the gap between neighboring categories on the discrete axis", () => {
  assert.deepStrictEqual(plotBand(inputs("x", rows)), {axis: "x", step: 100});
  // Without a discrete axis there is no band.
  assert.strictEqual(plotBand(inputs(undefined, rows)), null);
  // One category spans the axis.
  assert.deepStrictEqual(plotBand(inputs("x", [rows[0]], {xDomain: ["A"]})), {
    axis: "x",
    step: 400,
  });
});

it("plotBand: a continuous discrete axis steps between its rows' values", () => {
  const values = [
    {id: "1", x: 1, y: "A"},
    {id: "2", x: 3, y: "B"},
    {id: "3", x: 4, y: "A"},
  ];
  const band = plotBand(inputs("x", values, {xDomain: [1, 4], x: v => v * 10}));
  assert.deepStrictEqual(band, {axis: "x", step: 10});
});

it("jitterAccessor: each point sits at its category plus its seeded share of the band", () => {
  assert.strictEqual(jitterAccessor(inputs("x", rows), false), null);
  assert.strictEqual(jitterAccessor(inputs(undefined, rows), true), null);
  const j = jitterAccessor(inputs("x", rows), true);
  assert.strictEqual(j.axis, "x");
  assert.strictEqual(j.at(rows[0]), 100 + jitterOffset("a1") * 0.6 * 100);
  const narrow = jitterAccessor(inputs("x", rows), 0.2);
  assert.strictEqual(narrow.at(rows[1]), 200 + jitterOffset("b1") * 20);
  // Filtering the rows leaves the others where they were.
  const filtered = jitterAccessor(inputs("x", [rows[1]]), 0.2);
  assert.strictEqual(filtered.at(rows[1]), narrow.at(rows[1]));
  // Every offset stays inside its share of the band.
  for (let i = 0; i < 200; i++) {
    const at = j.at({id: `p${i}`, x: "B"});
    assert.ok(Math.abs(at - 200) <= 30, `${at}`);
  }
});

it("jitterAccessor: a discrete y axis jitters along y", () => {
  const values = [{id: "a1", x: 10, y: "C"}];
  const j = jitterAccessor(
    inputs("y", values, {yDomain: ["A", "B", "C"]}),
    true,
  );
  assert.strictEqual(j.axis, "y");
  assert.strictEqual(j.at(values[0]), 300 + jitterOffset("a1") * 60);
});

it("DEFAULT_TICK_LENGTH: a tick spans 0.6 of its band", () => {
  assert.strictEqual(DEFAULT_TICK_LENGTH, 0.6);
});
