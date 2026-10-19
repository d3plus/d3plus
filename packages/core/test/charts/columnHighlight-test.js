import assert from "assert";
import {columnHighlight} from "../../es/src/charts/Plot/columnHighlight.js";
import {applyInteractionOpacity} from "../../es/src/charts/viz/interactionOpacity.js";

/**
    Lollipop and Dumbbell's column emphasis: the predicate Plot's snapped
    hover sets for a hovered column, and the interaction walk dimming a
    connector (a node with points but no datum of its own) with its points.
*/

const wrap = (data, extra = {}) => ({__d3plus__: true, data, ...extra});
const a = {id: "A", year: "2000"};
const b = {id: "B", year: "2000"};
const c = {id: "C", year: "2021"};
const mark = (key, row) => ({type: "circle", key, datum: wrap(row), paint: {fill: "#4c6ef5"}});

const viz = (extra = {}) => ({
  _id: d => d.id,
  _chartScene: [mark("a", a), mark("b", b), mark("c", c)],
  ...extra,
});

it("columnHighlight — matches the hovered column's plotted rows only", () => {
  const predicate = columnHighlight(viz())(new Set([a]));
  assert.strictEqual(predicate(a, 0), true);
  assert.strictEqual(predicate(b, 1), false);
  assert.strictEqual(predicate(c, 2), false);
});

it("columnHighlight — a row the chart doesn't plot matches by id", () => {
  const predicate = columnHighlight(viz())(new Set([a, c]));
  assert.strictEqual(predicate({id: "A"}, 0), true, "a legend row sharing a hovered id");
  assert.strictEqual(predicate({id: ["B", "C"]}, 0), true, "or merging one");
  assert.strictEqual(predicate({id: "B"}, 0), false, "another id's legend row");
});

it("columnHighlight — a wrapped datum defers to the row it wraps", () => {
  const predicate = columnHighlight(viz())(new Set([a]));
  assert.strictEqual(predicate(wrap(a), 0), false);
});

it("columnHighlight — every small-multiples panel's rows count as plotted", () => {
  const other = {id: "A", year: "2021"};
  const panels = [{scene: [mark("a", a)]}, {scene: [mark("o", other)]}];
  const predicate = columnHighlight(viz({_facetPanels: panels, _chartScene: [mark("a", a)]}))(new Set([a]));
  assert.strictEqual(predicate(other, 0), false, "the other panel's row with the same id dims");
});

it("applyInteractionOpacity — a node with points but no datum follows its points", () => {
  const point = (row, x) => ({x, y: 0, datum: wrap(wrap(row), {i: 0})});
  const connector = (key, ...rows) => ({type: "path", key, interactive: false, paint: {stroke: "#adb5bd", strokeWidth: 3}, interactionPoints: rows.map(point)});
  const nodes = [connector("ab", a, b), connector("c", c), {type: "rect", key: "plain", paint: {fill: "#eee"}}];
  const byKey = list => Object.fromEntries(list.map(n => [n.key, n]));
  const out = byKey(applyInteractionOpacity(nodes, {_hover: d => d === b, schema: {shapeConfig: {}}}));
  assert.strictEqual(out.ab.paint.opacity, undefined, "a connector with a hovered end stays bright");
  assert.strictEqual(out.ab.paint.strokeWidth, 6, "with its stroke emphasized");
  assert.strictEqual(out.c.paint.opacity, 0.5, "a connector with no hovered end dims");
  assert.strictEqual(out.plain, nodes[2], "a node with neither a datum nor points is left as is");
});
