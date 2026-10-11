import assert from "assert";
import it from "../jsdom.js";
import {BarChart, Pyramid, TextBox} from "../../es/index.js";
import {
  pyramidNodes,
  pyramidPanelScene,
  withPyramidChildren,
} from "../../es/src/charts/Pyramid/scene.js";

/**
    The pieces a faceted Pyramid draws each panel's own chrome with: the
    nodes for the chart just drawn, layered into a panel's chart nodes by the
    `scene` facet hook.
*/

const key = k => d => d[k];

/** A drawn chart's state, as `pyramidNodes` reads it: a 200px-wide plot, rows at y 10 and 30. */
const drawn = (overrides = {}) => ({
  _xFunc: v => 100 + v * 10,
  _yFunc: c => (c === "a" ? 10 : 30),
  _plotArea: {x: 0, y: 0, width: 200, height: 40},
  _filteredData: [{c: "a", s: "M", cmp: 2}, {c: "b", s: "F", cmp: 3}],
  _yAxis: {domain: () => ["a", "b"]},
  _y: key("c"),
  _margin: {top: 20, left: 0, right: 0, bottom: 0},
  _chartTransform: {x: 0, y: 40},
  _plotInsetTop: 0,
  schema: {comparisonConfig: {}, sideTitleConfig: {}},
  ...overrides,
});

/** The comparison-free input with a gutter that echoes its edges. */
const input = (overrides = {}) => ({
  sides: ["M", "F"],
  labels: ["Male", "Female"],
  side: key("s"),
  divisor: 1,
  titleBox: new TextBox(),
  showTitles: false,
  inset: 1,
  gutter: edges => [{type: "group", key: `gutter-${edges.join("-")}`, children: []}],
  ...overrides,
});

it("Pyramid withPyramidChildren layers the outline and titles into a chart body's children", () => {
  const outline = {type: "line", key: "outline"};
  const title = {type: "group", key: "titles"};
  const bars = [{type: "rect", key: "bar"}];
  assert.deepStrictEqual(withPyramidChildren(bars, [outline], [title]).map(n => n.key), ["bar", "outline", "titles"]);
  assert.strictEqual(bars.length, 1, "the children are copied, not mutated");

  const content = {type: "group", key: "plot-zoom-content", children: [{type: "rect", key: "bar"}]};
  const zoomable = withPyramidChildren([content, {type: "group", key: "axis"}], [outline], [title]);
  assert.deepStrictEqual(zoomable.map(n => n.key), ["plot-zoom-content", "axis", "titles"]);
  assert.deepStrictEqual(zoomable[0].children.map(n => n.key), ["bar", "outline"], "the outline clips with the plot");
  assert.strictEqual(content.children.length, 1, "the content group is copied, not mutated");
  assert.deepStrictEqual(withPyramidChildren(bars, [], []), bars);
});

it("Pyramid pyramidNodes draws nothing before the chart has scales or rows", () => {
  const empty = {outlines: [], overlays: []};
  assert.deepStrictEqual(pyramidNodes(drawn({_xFunc: undefined}), input()), empty);
  assert.deepStrictEqual(pyramidNodes(drawn({_yFunc: undefined}), input()), empty);
  assert.deepStrictEqual(pyramidNodes(drawn({_plotArea: undefined}), input()), empty);
  assert.deepStrictEqual(pyramidNodes(drawn({_filteredData: []}), input()), empty);
});

it("Pyramid pyramidNodes reads the chart just drawn: gutter edges, outlines, and titles", () => {
  const plain = pyramidNodes(drawn(), input());
  assert.deepStrictEqual(plain.outlines, []);
  assert.deepStrictEqual(plain.overlays.map(n => n.key), ["gutter-90-110"], "the gutter spans x(-inset) to x(inset)");

  const compared = pyramidNodes(drawn(), input({comparison: key("cmp"), gutter: undefined}));
  assert.deepStrictEqual(compared.outlines.map(n => n.key), ["pyramid-comparison-0", "pyramid-comparison-1"]);
  assert.deepStrictEqual(compared.outlines[0].points[0], [90, 0], "the left outline starts at its gutter edge");
  assert.deepStrictEqual(compared.overlays, []);

  const titled = pyramidNodes(drawn({_plotInsetTop: 20}), input({showTitles: true}));
  assert.deepStrictEqual(titled.overlays.map(n => n.key), ["gutter-90-110", "pyramid-side-titles"], "titles draw above the labels");
  const texts = titled.overlays[1].children.map(n => n.lines.map(l => l.text).join(""));
  assert.deepStrictEqual(texts, ["Male", "Female"]);
  assert.ok(titled.overlays[1].children.every(n => n.transform.y < 0), "titles sit above the plot, in body coordinates");
  assert.strictEqual(pyramidNodes(drawn(), input({showTitles: true})).overlays.length, 1, "no title without room reserved for it");
});

it("Pyramid pyramidPanelScene adds the chart's nodes to a panel's nodes", () => {
  const nodes = [{type: "group", key: "plot-zoom-content", children: []}, {type: "group", key: "plot-x-axis", children: []}];
  const out = pyramidPanelScene(drawn(), nodes, input({comparison: key("cmp")}));
  assert.deepStrictEqual(out.map(n => n.key), ["plot-zoom-content", "plot-x-axis", "gutter-90-110"]);
  assert.deepStrictEqual(out[0].children.map(n => n.key), ["pyramid-comparison-0", "pyramid-comparison-1"]);
  assert.strictEqual(nodes[0].children.length, 0, "the panel's nodes are not mutated");
  assert.strictEqual(pyramidPanelScene(drawn({_xFunc: undefined}), nodes, input()), nodes, "nothing to add keeps the nodes");
});

it("Pyramid's facet hooks add its scene to each panel on top of Plot's", () => {
  const hooks = new Pyramid()._facetHooks();
  for (const hook of ["share", "panel", "insets", "capture", "scene"])
    assert.strictEqual(typeof hooks[hook], "function", `Pyramid has ${hook}`);
  assert.strictEqual(new BarChart()._facetHooks().scene, undefined, "BarChart draws its panels as-is");
});
