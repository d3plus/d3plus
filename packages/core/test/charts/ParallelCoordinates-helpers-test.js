import assert from "assert";
import {linePoints, parallelPath} from "../../es/src/charts/ParallelCoordinates/paths.js";
import {applyLineStates, grayscale, INACTIVE_SHARE} from "../../es/src/charts/ParallelCoordinates/lineStates.js";
import {lineAriaLabel, resolveLineOpacity} from "../../es/src/charts/ParallelCoordinates/emit.js";
import {dimensionTooltipRows, formatDimensionValue} from "../../es/src/charts/ParallelCoordinates/format.js";
import {axisDomain, dimensionAxisConfig, dimensionTitleStyle} from "../../es/src/charts/ParallelCoordinates/axes.js";
import {
  brushTarget,
  parallelDimensionKeys,
  parallelOrient,
} from "../../es/src/charts/ParallelCoordinates/applyLayout.js";
import {stripLength, stripSelection} from "../../es/src/charts/ParallelCoordinates/brushDom.js";
import {resolveBrushStyle} from "../../es/src/charts/ParallelCoordinates/index.js";

const axes = [
  {key: "a", offset: 0, position: v => 100 - v},
  {key: "b", offset: 50, position: v => ({x: 10, y: 90})[v] ?? NaN},
  {key: "c", offset: 100, position: v => v * 2},
];

const dims = [
  {key: "mpg", title: "MPG", type: "numeric", domain: [10, 40], reverse: false},
  {key: "origin", title: "Origin", type: "categorical", domain: ["Japan", "USA"], reverse: false},
];

const fakeViz = (extra = {}) => ({
  schema: {locale: "en-US", dimensionConfig: {}, ...extra},
  ctx: {dimensions: dims},
  _drawLabel: d => d.name,
});

it("ParallelCoordinates paths: linePoints places a row on each axis, null where it has no value", () => {
  assert.deepStrictEqual(linePoints({a: 30, b: "y", c: 5}, axes), [[0, 70], [50, 90], [100, 10]]);
  assert.deepStrictEqual(linePoints({a: 30, b: "y", c: 5}, axes, "vertical"), [[70, 0], [90, 50], [10, 100]]);
  assert.deepStrictEqual(linePoints({a: null, b: "z", c: 5}, axes), [null, null, [100, 10]]);
});

it("ParallelCoordinates paths: parallelPath draws straight or bump segments and breaks at gaps", () => {
  const pts = [[0, 70], [50, 90], [100, 10]];
  assert.strictEqual(parallelPath(pts), "M0,70L50,90L100,10");
  assert.ok(/C/.test(parallelPath(pts, "bump")), "bump draws cubic curves");
  assert.ok(/C/.test(parallelPath([[70, 0], [90, 50]], "bump", "vertical")));
  const gap = parallelPath([[0, 1], null, [100, 3], [150, 4]]);
  assert.strictEqual((gap.match(/M/g) || []).length, 2, "a missing value starts a new segment");
  assert.strictEqual(parallelPath([]), "");
});

const line = (key, datum, extra = {}) => ({type: "path", key, d: "M0,0L1,1", datum, paint: {stroke: "#ff0000", strokeOpacity: 0.5}, ...extra});

it("ParallelCoordinates lineStates: grayscale strips chroma but keeps lightness", () => {
  assert.strictEqual(grayscale("#ff0000"), "rgb(128, 128, 128)");
  assert.strictEqual(grayscale("none"), "none");
  assert.strictEqual(grayscale(undefined), undefined);
});

it("ParallelCoordinates lineStates: applyLineStates fades and grays the lines outside the brushes", () => {
  const root = {type: "group", key: "root", children: [
    line("pc-line-a", {mpg: 20}),
    line("pc-line-a::hit", {mpg: 20}, {paint: {stroke: "transparent", strokeWidth: 8}}),
    line("pc-line-b", {mpg: 35}),
    {type: "text", key: "title", text: "x"},
  ]};
  const out = applyLineStates(root, {brushes: {mpg: [30, 40]}});
  const [a, aHit, b, text] = out.children;
  assert.strictEqual(a.paint.strokeOpacity, 0.5 * INACTIVE_SHARE);
  assert.strictEqual(a.paint.stroke, "rgb(128, 128, 128)");
  assert.strictEqual(a.interactive, false);
  assert.strictEqual(aHit.interactive, false, "the hit path stops taking the pointer");
  assert.strictEqual(aHit.paint.stroke, "transparent");
  assert.strictEqual(b, root.children[2], "a passing line is untouched");
  assert.strictEqual(text, root.children[3]);
  const fixed = applyLineStates(root, {brushes: {mpg: [30, 40]}, inactiveOpacity: 0.02});
  assert.strictEqual(fixed.children[0].paint.strokeOpacity, 0.02);
});

it("ParallelCoordinates lineStates: applyLineStates draws a single hovered line fully opaque", () => {
  const root = {type: "group", key: "root", children: [
    line("facet-x/pc-line-a", {mpg: 20}, {z: 1e6}),
    line("facet-x/pc-line-b", {mpg: 35}),
  ]};
  const out = applyLineStates(root, {});
  assert.strictEqual(out.children[0].paint.strokeOpacity, 1);
  assert.strictEqual(out.children[1], root.children[1]);
  const two = {...root, children: [root.children[0], {...root.children[1], z: 1e6}]};
  assert.strictEqual(applyLineStates(two, {}), two, "a multi-line hover (legend) keeps the line opacity");
  const plain = {type: "group", key: "root", children: [line("pc-line-a", {})]};
  assert.strictEqual(applyLineStates(plain, {}), plain, "nothing to do returns the same tree");
});

it("ParallelCoordinates emit: resolveLineOpacity clamps numbers and falls back to the automatic fade", () => {
  assert.strictEqual(resolveLineOpacity(0.4, 10), 0.4);
  assert.strictEqual(resolveLineOpacity(2, 10), 1);
  assert.strictEqual(resolveLineOpacity("auto", 10), 1);
  assert.strictEqual(resolveLineOpacity("auto", 200), 0.5);
});

it("ParallelCoordinates emit: lineAriaLabel names the row and lists its values", () => {
  const viz = fakeViz();
  assert.strictEqual(lineAriaLabel(viz, {name: "Car", mpg: 21.25, origin: "USA"}, 0, dims), "Car: MPG 21.3, Origin USA.");
  assert.strictEqual(lineAriaLabel(viz, {name: "Car"}, 0, []), "Car.");
});

it("ParallelCoordinates format: formatDimensionValue uses the dimension's tickFormat, else abbreviates numbers", () => {
  const viz = fakeViz({dimensionConfig: {mpg: {tickFormat: d => `${d} mpg`}}});
  assert.strictEqual(formatDimensionValue(viz, "mpg", 30), "30 mpg");
  assert.strictEqual(formatDimensionValue(viz, "weight", 3500), "3.5k");
  assert.strictEqual(formatDimensionValue(viz, "origin", "USA"), "USA");
  assert.strictEqual(formatDimensionValue(viz, "mpg", null), "");
});

it("ParallelCoordinates format: dimensionTooltipRows lists each dimension's title and value", () => {
  assert.deepStrictEqual(dimensionTooltipRows(fakeViz(), {mpg: 30, origin: "Japan"}), [["MPG", "30"], ["Origin", "Japan"]]);
});

it("ParallelCoordinates axes: axisDomain puts a horizontal layout's largest value on top and honors reverse", () => {
  const num = {key: "n", type: "numeric", domain: [0, 10], reverse: false};
  const cat = {key: "c", type: "categorical", domain: ["a", "b"], reverse: false};
  assert.deepStrictEqual(axisDomain(num, "horizontal"), [10, 0]);
  assert.deepStrictEqual(axisDomain({...num, reverse: true}, "horizontal"), [0, 10]);
  assert.deepStrictEqual(axisDomain(num, "vertical"), [0, 10]);
  assert.deepStrictEqual(axisDomain({...num, reverse: true}, "vertical"), [10, 0]);
  assert.deepStrictEqual(axisDomain(cat, "horizontal"), ["a", "b"]);
  assert.deepStrictEqual(axisDomain({...cat, reverse: true}, "vertical"), ["b", "a"]);
  assert.deepStrictEqual(num.domain, [0, 10], "the dimension's domain is not mutated");
});

it("ParallelCoordinates axes: dimensionAxisConfig drops the keys the chart reads itself", () => {
  const fmt = d => d;
  assert.deepStrictEqual(
    dimensionAxisConfig({domain: [0, 1], reverse: true, title: "T", tickFormat: fmt, ticks: [0, 1]}),
    {tickFormat: fmt, ticks: [0, 1]},
  );
  assert.deepStrictEqual(dimensionAxisConfig(undefined), {});
});

it("ParallelCoordinates axes: dimensionTitleStyle layers axisConfig.titleConfig over the chart's ink", () => {
  const style = dimensionTitleStyle({schema: {axisConfig: {titleConfig: {fontSize: 14}}}}, "horizontal");
  assert.strictEqual(style.fontSize, 14);
  assert.strictEqual(style.textAnchor, "middle");
  assert.strictEqual(style.verticalAlign, "bottom");
  assert.ok(typeof style.fontColor === "string");
  const vertical = dimensionTitleStyle({schema: {}}, "vertical");
  assert.strictEqual(vertical.textAnchor, "end");
  assert.strictEqual(vertical.fontSize, 12);
});

it("ParallelCoordinates layout: parallelDimensionKeys uses dimensions, else numeric keys minus groupBy and id", () => {
  const data = [{id: 1, name: "a", rank: 2, mpg: 20}, {id: 2, name: "b", rank: 1, mpg: 30}];
  assert.deepStrictEqual(parallelDimensionKeys({schema: {dimensions: ["mpg", "name"]}, _data: data}), ["mpg", "name"]);
  assert.deepStrictEqual(parallelDimensionKeys({schema: {}, _data: data, _groupByRaw: ["rank"]}), ["mpg"]);
  assert.deepStrictEqual(parallelDimensionKeys({schema: {}, _data: data, _groupByRaw: "name"}), ["rank", "mpg"]);
});

it("ParallelCoordinates layout: parallelOrient only recognizes vertical", () => {
  assert.strictEqual(parallelOrient("vertical"), "vertical");
  assert.strictEqual(parallelOrient("horizontal"), "horizontal");
  assert.strictEqual(parallelOrient(undefined), "horizontal");
});

it("ParallelCoordinates layout: brushTarget centers a strip over the axis, in surface pixels", () => {
  const placed = {dim: dims[0], offset: 100, start: 30, end: 230, position: v => v, invert: v => v};
  const h = brushTarget(placed, "horizontal", {left: 10, top: 20}, 20);
  assert.deepStrictEqual([h.x, h.y, h.width, h.height], [100, 50, 20, 200]);
  assert.strictEqual(h.alongStart, 30);
  assert.strictEqual(h.key, "mpg");
  assert.strictEqual(h.id, "10,20|horizontal|mpg");
  const v = brushTarget(placed, "vertical", {left: 10, top: 20}, 20);
  assert.deepStrictEqual([v.x, v.y, v.width, v.height], [40, 110, 200, 20]);
});

it("ParallelCoordinates brushDom: stripLength and stripSelection map a filter into strip pixels", () => {
  const target = {
    orient: "horizontal", width: 20, height: 200, alongStart: 30,
    type: "numeric", domain: [0, 100], position: v => 230 - v * 2, invert: px => (230 - px) / 2,
  };
  assert.strictEqual(stripLength(target), 200);
  assert.strictEqual(stripLength({orient: "vertical", width: 300, height: 20}), 300);
  assert.deepStrictEqual(stripSelection([50, 80], target), [40, 100]);
  assert.deepStrictEqual(stripSelection([-50, 80], target), [40, 200], "clamped to the strip");
  assert.strictEqual(stripSelection(undefined, target), null);
  assert.strictEqual(stripSelection(["a"], target), null);
});

it("ParallelCoordinates index: resolveBrushStyle calls function values", () => {
  assert.deepStrictEqual(resolveBrushStyle({fill: () => "red", width: 20}), {fill: "red", width: 20});
});
