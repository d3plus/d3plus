import assert from "assert";
import it from "../jsdom.js";
import {Pyramid} from "../../es/index.js";
import {
  absoluteFormat,
  finite,
  frameTotals,
  pyramidExtent,
  pyramidSides,
  pyramidTotal,
  sideSign,
  symmetricDomain,
} from "../../es/src/charts/Pyramid/pyramidData.js";
import {pyramidStackOrder} from "../../es/src/charts/Pyramid/stackOrder.js";
import {
  bandStep,
  comparisonNodes,
  comparisonOutline,
  dashArray,
  sideTitleBoxes,
  withPyramidNodes,
} from "../../es/src/charts/Pyramid/scene.js";

const key = k => d => d[k];

it("Pyramid finite keeps only finite numbers", () => {
  assert.strictEqual(finite(3), 3);
  assert.strictEqual(finite(-2.5), -2.5);
  [NaN, Infinity, "3", null, undefined, [1]].forEach(v => assert.strictEqual(finite(v), undefined));
});

it("Pyramid pyramidSides orders configured sides first, then by first appearance", () => {
  const data = [{s: "F"}, {s: "M"}, {s: "X"}, {s: "F"}];
  assert.deepStrictEqual(pyramidSides(data, key("s")), ["F", "M", "X"]);
  assert.deepStrictEqual(pyramidSides(data, key("s"), ["M"]), ["M", "F", "X"]);
  assert.deepStrictEqual(pyramidSides(data, key("s"), ["M", "Q"]), ["M", "Q", "F", "X"]);
  assert.deepStrictEqual(pyramidSides(data, key("s"), "M"), ["F", "M", "X"], "a non-array is ignored");
  assert.deepStrictEqual(pyramidSides([{s: 1}, {s: 2}], key("s"), [2]), ["2", "1"], "values compare as strings");
});

it("Pyramid sideSign mirrors only the first side", () => {
  assert.strictEqual(sideSign(["M", "F"], "M"), -1);
  assert.strictEqual(sideSign(["M", "F"], "F"), 1);
  assert.strictEqual(sideSign(["M", "F"], "X"), 1, "unlisted sides draw on the right");
  assert.strictEqual(sideSign([], "M"), 1);
  assert.strictEqual(sideSign(["1"], 1), -1);
});

it("Pyramid pyramidTotal and frameTotals sum finite values", () => {
  const data = [{v: 2, t: 1}, {v: 3, t: 2}, {v: NaN, t: 2}, {v: "x", t: 1}, {v: 5, t: 2}];
  assert.strictEqual(pyramidTotal(data, key("v")), 10);
  assert.strictEqual(pyramidTotal([], key("v")), 0);
  const totals = frameTotals(data, key("v"), key("t"));
  assert.strictEqual(totals.get("1"), 2);
  assert.strictEqual(totals.get("2"), 8);
});

it("Pyramid pyramidExtent is the largest single-side category total", () => {
  const data = [
    {c: "a", s: "M", v: 3}, {c: "a", s: "M", v: 4}, {c: "a", s: "F", v: 6},
    {c: "b", s: "F", v: -9, cmp: 2},
  ];
  const base = {category: key("c"), side: key("s"), value: key("v")};
  assert.strictEqual(pyramidExtent(data, base), 9, "magnitudes, summed per side and category");
  assert.strictEqual(
    pyramidExtent(data, {...base, comparison: d => (d.c === "a" ? 12 : undefined)}),
    24,
    "comparison values count too",
  );
  const framed = [{c: "a", s: "M", v: 3, t: 1}, {c: "a", s: "M", v: 4, t: 2}];
  assert.strictEqual(pyramidExtent(framed, {...base, frame: key("t")}), 4, "frames never stack");
  assert.strictEqual(pyramidExtent(framed, base), 7);
  assert.strictEqual(pyramidExtent([], base), 0);
});

it("Pyramid symmetricDomain centers on zero", () => {
  assert.deepStrictEqual(symmetricDomain(5), [-5, 5]);
  assert.deepStrictEqual(symmetricDomain(0), [-1, 1]);
});

it("Pyramid absoluteFormat reads both sides as magnitudes", () => {
  const fmt = absoluteFormat(d => `<${d}>`);
  assert.strictEqual(fmt(-300), "<300>");
  assert.strictEqual(fmt(300), "<300>");
  assert.strictEqual(fmt(-0), "<0>");
  assert.strictEqual(fmt("a"), "<a>", "non-numbers pass through");
});

/** A d3-stack series before the offset: one [0, value] point per discrete group. */
const series = (id, value, sub) => {
  const point = Object.assign([0, value], {data: [{id, i: 0, data: {sub}}]});
  return Object.assign([point], {key: id, index: 0});
};

it("Pyramid pyramidStackOrder mirrors sub-groups, largest nearest the center", () => {
  const order = pyramidStackOrder(d => d.sub);
  assert.strictEqual(order.__d3plusStackOrder, true, "tagged as a resolved order");
  const stack = [
    series("M_rural", -2, "rural"),
    series("F_urban", 6, "urban"),
    series("M_urban", -5, "urban"),
    series("F_rural", 3, "rural"),
  ];
  // urban totals 11, rural 5: urban stacks first on both sides.
  assert.deepStrictEqual(order(stack), [1, 2, 0, 3]);
  const tie = [series("a", 1, "x"), series("b", -1, "y"), series("c", 1, "x")];
  assert.deepStrictEqual(order(tie), [0, 2, 1], "ties keep first-seen order");
});

it("Pyramid comparisonOutline steps around each row from the center line", () => {
  const points = comparisonOutline([{y: 30, x: 80}, {y: 10, x: 60}], 100, 20);
  assert.deepStrictEqual(points, [
    [100, 0], [60, 0], [60, 20], [80, 20], [80, 40], [100, 40],
  ]);
  assert.deepStrictEqual(comparisonOutline([], 100, 20), []);
});

it("Pyramid bandStep is the smallest gap between positions", () => {
  assert.strictEqual(bandStep([40, 10, 20, 20], 99), 10);
  assert.strictEqual(bandStep([5], 99), 99, "falls back for one position");
  assert.strictEqual(bandStep([], 99), 99);
});

it("Pyramid dashArray normalizes strings and numbers", () => {
  assert.deepStrictEqual(dashArray("4 2"), [4, 2]);
  assert.deepStrictEqual(dashArray("4,2"), [4, 2]);
  assert.deepStrictEqual(dashArray([3, "1"]), [3, 1]);
  assert.deepStrictEqual(dashArray(5), [5]);
  assert.strictEqual(dashArray(""), undefined);
  assert.strictEqual(dashArray(undefined), undefined);
});

it("Pyramid sideTitleBoxes centers a box over each half", () => {
  const boxes = sideTitleBoxes(["Male", "Female", "Extra"], {left: 10, right: 110, inner: [70, 70], top: -20, height: 18});
  assert.deepStrictEqual(boxes, [
    {text: "Male", x: 10, y: -20, width: 60, height: 18},
    {text: "Female", x: 70, y: -20, width: 40, height: 18},
  ]);
  const gutter = sideTitleBoxes(["Male", "Female"], {left: 0, right: 100, inner: [40, 60], top: 0, height: 10});
  assert.deepStrictEqual(gutter.map(b => [b.x, b.width]), [[0, 40], [60, 40]], "each half ends at its gutter edge");
  const clamped = sideTitleBoxes(["A", "B"], {left: 0, right: 100, inner: [150, 150], top: 0, height: 10});
  assert.deepStrictEqual(clamped.map(b => b.width), [100, 0], "the center is clamped to the axis");
});

it("Pyramid comparisonNodes traces each side's comparison totals", () => {
  const data = [
    {c: "a", s: "M", cmp: 2}, {c: "a", s: "M", cmp: 1}, {c: "b", s: "M", cmp: 4},
    {c: "a", s: "F", cmp: 5},
  ];
  const nodes = comparisonNodes({
    sides: ["M", "F"],
    categories: ["a", "b"],
    data,
    category: key("c"),
    side: key("s"),
    comparison: key("cmp"),
    divisor: 1,
    x: v => 100 + v * 10,
    y: c => (c === "a" ? 10 : 30),
    fallbackStep: 50,
    config: {stroke: (side, i) => `${side}${i}`, strokeWidth: 2, strokeDasharray: "4 3"},
  });
  assert.strictEqual(nodes.length, 2);
  assert.deepStrictEqual(nodes[0].points, [[100, 0], [70, 0], [70, 20], [60, 20], [60, 40], [100, 40]]);
  assert.deepStrictEqual(nodes[1].points, [[100, 0], [150, 0], [150, 20], [100, 20], [100, 40], [100, 40]]);
  assert.strictEqual(nodes[0].paint.stroke, "M0");
  assert.strictEqual(nodes[1].paint.stroke, "F1");
  assert.deepStrictEqual(nodes[0].paint.strokeDasharray, [4, 3]);
  assert.strictEqual(nodes[0].interactive, false);
  const empty = comparisonNodes({
    sides: ["M"], categories: ["a"], data: [{c: "a", s: "M"}], category: key("c"), side: key("s"),
    comparison: key("cmp"), divisor: 1, x: v => v, y: () => 0, fallbackStep: 10, config: {},
  });
  assert.deepStrictEqual(empty, [], "a side with no comparison values draws nothing");
});

/** A minimal painted scene: chart cells → zoom → body. */
const sceneWith = bodyChildren => ({
  root: {type: "group", key: "root", children: [{
    type: "group", key: "viz-chart-cells", children: [{
      type: "group", key: "viz-zoom", children: [{type: "group", key: "viz-chart-body", children: bodyChildren}],
    }],
  }]},
});
const bodyOf = scene => scene.root.children[0].children[0].children[0];

it("Pyramid withPyramidNodes layers the outline and titles into the chart body", () => {
  const outline = {type: "line", key: "outline"};
  const title = {type: "group", key: "titles"};
  const bars = [{type: "rect", key: "bar"}];
  const plain = withPyramidNodes(sceneWith(bars), [outline], [title]);
  assert.deepStrictEqual(bodyOf(plain).children.map(n => n.key), ["bar", "outline", "titles"]);
  assert.strictEqual(bars.length, 1, "the chart scene array is not mutated");

  const content = {type: "group", key: "plot-zoom-content", children: [{type: "rect", key: "bar"}]};
  const zoomable = withPyramidNodes(sceneWith([content, {type: "group", key: "axis"}]), [outline], [title]);
  const body = bodyOf(zoomable);
  assert.deepStrictEqual(body.children.map(n => n.key), ["plot-zoom-content", "axis", "titles"]);
  assert.deepStrictEqual(body.children[0].children.map(n => n.key), ["bar", "outline"], "outline clips with the plot");
  assert.strictEqual(content.children.length, 1, "the content group is copied, not mutated");

  const untouched = sceneWith(bars);
  assert.strictEqual(withPyramidNodes(untouched, [], []), untouched);
  const noBody = {root: {type: "group", key: "root", children: []}};
  assert.strictEqual(withPyramidNodes(noBody, [outline], []), noBody);
});

it("Pyramid declares its defaults", () => {
  const viz = new Pyramid();
  assert.strictEqual(viz.discrete(), "y");
  assert.strictEqual(viz.stacked(), true);
  assert.strictEqual(viz.symmetric(), true);
  assert.strictEqual(viz.percent(), false);
  assert.strictEqual(viz.sideTitles(), true);
  assert.strictEqual(viz.sides(), undefined);
  assert.strictEqual(viz.comparison(), undefined);
  assert.strictEqual(viz.groupPadding(), 1);
  assert.strictEqual(viz.baselineBreak(), false, "the halves always meet at zero");
  assert.strictEqual(viz.sideTitleConfig().fontSize, 14);
  assert.strictEqual(viz.comparisonConfig().strokeDasharray, "4 3");
  assert.strictEqual(viz.shapeConfig().Bar.label, false, "rows are read off the axis, not bar labels");
});

it("Pyramid mirrors the left side's values and keeps x() as the source accessor", () => {
  const viz = new Pyramid().groupBy("sex").x("pop");
  viz.ctx.pyramid.sides = ["M", "F"];
  assert.strictEqual(viz._x({sex: "M", pop: 5}, 0), -5);
  assert.strictEqual(viz._x({sex: "F", pop: 5}, 0), 5);
  assert.strictEqual(viz._x({sex: "M", pop: -5}, 0), -5, "negative input data still draws left");
  assert.strictEqual(viz._x({sex: "M", pop: "n/a"}, 0), "n/a", "non-numbers pass through");
  viz.x(viz.x());
  assert.strictEqual(viz._x({sex: "M", pop: 5}, 0), -5, "re-setting the mirrored getter is a no-op");
  viz.x("other");
  assert.strictEqual(viz._x({sex: "F", other: 7}, 0), 7);
  viz.percent(true);
  viz.ctx.pyramid.total = 20;
  assert.strictEqual(viz._x({sex: "M", other: 5}, 0), -0.25, "percent mode divides by the total");
  viz.ctx.pyramid.total = 0;
  assert.strictEqual(viz._x({sex: "M", other: 5}, 0), -0, "an empty total maps to zero");
});

it("Pyramid comparison accepts a data key or an accessor", () => {
  const viz = new Pyramid().comparison("before");
  assert.strictEqual(viz.comparison()({before: 3}), 3);
  const fn = d => d.x;
  assert.strictEqual(viz.comparison(fn).comparison(), fn);
  assert.strictEqual(viz.comparison(false).comparison(), undefined);
});

it("Pyramid tooltip rows show the share of the total, or the value in percent mode", () => {
  const viz = new Pyramid().groupBy("sex").x("pop").comparison("before");
  Object.assign(viz.ctx.pyramid, {sides: ["M", "F"], total: 200, comparisonTotal: 100});
  const tbody = viz.tooltipConfig().tbody;
  assert.deepStrictEqual(tbody({sex: "M", pop: 50, before: 40}, 0), [
    ["Percent of Total", "25%"],
    ["before", "40"],
  ]);
  viz.percent(true);
  assert.deepStrictEqual(tbody({sex: "M", pop: 50, before: 40}, 0), [
    ["pop", "50"],
    ["before", "40%"],
  ]);
  assert.deepStrictEqual(tbody({sex: "M", pop: [1, 2]}, 0), [], "legend aggregates get no rows");
  viz.comparison(d => d.before);
  assert.strictEqual(tbody({sex: "M", pop: 50, before: 40}, 0)[1][0], "Comparison");
});
