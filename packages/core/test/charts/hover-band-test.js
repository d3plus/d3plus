import {it} from "vitest";
import assert from "assert";
import {applyInteractionOpacity} from "../../src/charts/viz/interactionOpacity.ts";

/**
    A node with a `hoverPaint` (a bar's hit area) takes it while the chart
    is hovered through its own row (the one the pointer or keyboard picked),
    and is never dimmed or raised: the band stays behind the marks. Other
    rows the hover lights, and a chart with nothing hovered, keep it unseen.
*/

const band = {fill: "#212529", fillOpacity: 0.1};
const rows = {a: {id: "a"}, b: {id: "b"}, a2: {id: "a"}};
const hit = name => ({
  type: "rect",
  key: `${name}::hit`,
  shapeType: "Bar",
  datum: {data: rows[name]},
  index: 0,
  paint: {fill: "transparent"},
  hoverPaint: band,
  z: 2,
});
const bar = name => ({
  type: "rect",
  key: name,
  shapeType: "Bar",
  datum: {data: rows[name]},
  index: 0,
  paint: {fill: "#f00"},
});
const viz = extra => ({
  _hover: null,
  _active: null,
  _highlight: null,
  schema: {shapeConfig: {}},
  ...extra,
});

it("hoverPaint: the picked bar's hit area takes its band", () => {
  const nodes = [hit("a"), hit("b"), bar("a"), bar("b")];
  const out = applyInteractionOpacity(
    nodes,
    viz({_hover: d => d.id === "a", _lastScenePick: {d: rows.a}}),
  );
  assert.deepStrictEqual(out[0].paint, band);
  assert.strictEqual(out[0].z, 2, "not raised");
  assert.deepStrictEqual(out[1].paint, {fill: "transparent"}, "not dimmed");
  assert.ok(out[2].z > 2, "the bar rises");
});

it("hoverPaint: only the picked row, not every row the hover lights", () => {
  // A series' two bars share an id; the pointer rests on one.
  const out = applyInteractionOpacity(
    [hit("a"), hit("a2")],
    viz({_hover: d => d.id === "a", _lastScenePick: {d: rows.a2}}),
  );
  assert.deepStrictEqual(out[0].paint, {fill: "transparent"});
  assert.deepStrictEqual(out[1].paint, band);
});

it("hoverPaint: nothing hovered leaves the band unseen", () => {
  const nodes = [hit("a"), bar("a")];
  assert.strictEqual(
    applyInteractionOpacity(nodes, viz({_lastScenePick: {d: rows.a}})),
    nodes,
  );
  const active = applyInteractionOpacity(
    nodes,
    viz({_active: d => d.id === "a", _lastScenePick: {d: rows.a}}),
  );
  assert.deepStrictEqual(active[0].paint, {fill: "transparent"}, "active");
  const left = applyInteractionOpacity(
    nodes,
    viz({_hover: d => d.id === "a", _lastScenePick: null}),
  );
  assert.deepStrictEqual(left[0].paint, {fill: "transparent"}, "no pick");
});

it("hoverPaint: a picked bar shows its band under a selection too", () => {
  const out = applyInteractionOpacity(
    [hit("a"), bar("a")],
    viz({
      _hover: d => d.id === "a",
      _selection: () => false,
      _lastScenePick: {d: rows.a},
    }),
  );
  assert.deepStrictEqual(out[0].paint, band);
});
