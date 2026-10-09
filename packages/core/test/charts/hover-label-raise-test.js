import assert from "assert";
import {applyInteractionOpacity} from "../../es/src/charts/viz/interactionOpacity.js";

/**
    A hovered mark is raised above its siblings, and its data label must come
    with it. The label's datum is wrapped one level deeper than its mark's
    (label → mark datum → row), so matching only one level down left the label
    unmatched: it was dimmed and stayed underneath the raised mark (a hovered
    BarChart bar hid its own label).
*/
const brazil = {country: "Brazil"};
const chile = {country: "Chile"};
const wrap = data => ({__d3plus__: true, data});

function scene() {
  return [
    {type: "rect", key: "b", datum: wrap(brazil), paint: {fill: "#4c6ef5"}},
    {type: "rect", key: "c", datum: wrap(chile), paint: {fill: "#4c6ef5"}},
    {type: "text", key: "b-label", datum: wrap(wrap(brazil)), paint: {fill: "#fff"}},
    {type: "text", key: "c-label", datum: wrap(wrap(chile)), paint: {fill: "#fff"}},
  ];
}

const byKey = nodes => Object.fromEntries(nodes.map(n => [n.key, n]));

it("raises a hovered mark's label with it and leaves it undimmed", () => {
  const viz = {_hover: d => d.country === "Brazil", schema: {shapeConfig: {}}};
  const out = byKey(applyInteractionOpacity(scene(), viz));
  assert.strictEqual(out.b.z, out["b-label"].z, "label shares its mark's raised z");
  assert.ok(out.b.z > 0);
  assert.strictEqual(out["b-label"].paint.opacity, undefined, "matched label isn't dimmed");
  assert.strictEqual(out["c-label"].paint.opacity, 0.5, "other labels still dim");
  assert.strictEqual(out["c-label"].z, undefined);
});

it("keeps a highlighted mark's label in color", () => {
  const viz = {_highlight: d => d.country === "Brazil", schema: {shapeConfig: {}}};
  const out = byKey(applyInteractionOpacity(scene(), viz));
  assert.strictEqual(out["b-label"].paint.fill, "#fff", "matched label keeps its color");
  assert.notStrictEqual(out.c.paint.fill, "#4c6ef5", "unmatched mark is grayed");
});
