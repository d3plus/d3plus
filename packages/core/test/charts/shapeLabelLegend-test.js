import {it} from "vitest";
import assert from "assert";
import {
  alongLegendAuto,
  emptyAlongStats,
} from "../../src/charts/Plot/alongLegend.ts";
import {Plot, Network} from "../../index.ts";
import {
  countShapeLabels,
  shapeLabelsPossible,
} from "../../src/charts/Plot/shapeLabelLegend.ts";

const defaultLegend = () => true;
const rows = [{id: "a"}, {id: "b"}];
const viz = (schema = {}, extra = {}) => ({
  _defaultLegend: defaultLegend,
  _filteredData: rows,
  _legendDepth: 0,
  _drawLabel: d => `${(d.data ?? d).id}`,
  _alongStats: emptyAlongStats(),
  schema: {
    legend: defaultLegend,
    shape: () => "Circle",
    shapeConfig: {},
    ...schema,
  },
  ...extra,
});

it("shapeLabelsPossible — only Circles, Rects, and Bars that keep their labels", () => {
  assert.strictEqual(shapeLabelsPossible(viz()), true);
  assert.strictEqual(shapeLabelsPossible(viz({shape: "Rect"})), true);
  assert.strictEqual(
    shapeLabelsPossible(viz({shape: (d, i) => (i ? "Bar" : "Circle")})),
    true,
  );
  assert.strictEqual(
    shapeLabelsPossible(viz({shape: (d, i) => (i ? "Line" : "Circle")})),
    false,
    "a Line is named by lineLabels",
  );
  assert.strictEqual(shapeLabelsPossible(viz({shape: "Area"})), false);
  assert.strictEqual(
    shapeLabelsPossible(viz({shapeConfig: {Circle: {label: false}}})),
    false,
  );
  assert.strictEqual(
    shapeLabelsPossible(viz({shapeConfig: {label: false}})),
    false,
  );
  assert.strictEqual(shapeLabelsPossible(viz({}, {_filteredData: []})), false);
});

it("alongLegendAuto — a Plot's shape labels that could name every entry", () => {
  const plot = (schema, extra) =>
    viz(schema, {_alongLabelsPossible: shapeLabelsPossible, ...extra});
  assert.strictEqual(alongLegendAuto(plot()), true);
  assert.strictEqual(
    alongLegendAuto(plot({legend: () => true})),
    false,
    "a user's legend wins",
  );
  assert.strictEqual(alongLegendAuto(plot({}, {_hidden: ["a"]})), false);
  assert.strictEqual(alongLegendAuto(viz()), false, "only a Plot's shapes");
  assert.strictEqual(new Plot()._alongLabelsPossible, shapeLabelsPossible);
  assert.strictEqual(new Network()._alongLabelsPossible, undefined);
});

/** A shape node and its label node, the label carrying the shape's datum as `data`. */
const shape = (id, text) => {
  const datum = {__d3plus__: true, data: {id}, i: 0, id};
  const nodes = [{type: "circle", key: id, shapeType: "Circle", datum}];
  if (text !== undefined)
    nodes.push({
      type: "text",
      key: `${id}_0`,
      datum: {data: datum},
      lines: text.split("|").map(t => ({text: t})),
    });
  return nodes;
};

it("countShapeLabels — counts the shapes whose label reads as their legend entry", () => {
  const all = viz();
  countShapeLabels(all, [...shape("a", "a"), ...shape("b", "b")]);
  assert.deepStrictEqual(all._alongStats, {series: 2, requested: 2, placed: 2});

  const missing = viz();
  countShapeLabels(missing, [...shape("a", "a"), ...shape("b")]);
  assert.deepStrictEqual(missing._alongStats, {
    series: 2,
    requested: 1,
    placed: 1,
  });

  const differs = viz();
  countShapeLabels(differs, [...shape("a", "a"), ...shape("b", "b…")]);
  assert.strictEqual(differs._alongStats.placed, 1, "a cut-short label");

  const wrapped = viz({}, {_drawLabel: d => `long ${(d.data ?? d).id}`});
  countShapeLabels(wrapped, [
    {type: "group", key: "g", children: shape("a", "long|a")},
    ...shape("b", "long b"),
  ]);
  assert.strictEqual(wrapped._alongStats.placed, 2, "lines read as one");

  const categories = viz({}, {_legendCategories: new WeakMap()});
  countShapeLabels(categories, [...shape("a", "a"), ...shape("b", "b")]);
  assert.strictEqual(categories._alongStats.placed, 0);

  const lines = viz({shape: "Line"});
  countShapeLabels(lines, [...shape("a", "a"), ...shape("b", "b")]);
  assert.deepStrictEqual(lines._alongStats, emptyAlongStats(), "not counted");
});
