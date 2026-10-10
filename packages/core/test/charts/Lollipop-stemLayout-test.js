import assert from "assert";
import {scaleLinear, scalePoint} from "d3-scale";
import it from "../jsdom.js";
import {Lollipop} from "../../es/index.js";
import {lollipopDef} from "../../es/internal.js";
import {lollipopEmit} from "../../es/src/charts/Lollipop/emit.js";
import {emitShape} from "../../es/src/charts/features/shapeEmit.js";
import {nodeColor, ownerNode} from "../../es/src/charts/features/tooltipSwatch.js";
import {
  largestRadius,
  lollipopBuffer,
  STEM_KEY_SUFFIX,
  stemFromBar,
  stemPoints,
} from "../../es/src/charts/Lollipop/stemLayout.js";

it("stemFromBar — a vertical bar's head sits at the end nearer its value", () => {
  const bar = {x: -4, y: 0, width: 8, height: 60, transform: {x: 100, y: 40}};
  assert.deepStrictEqual(stemFromBar(bar, "x", 40), {x: 100, y: 40, x0: 100, y0: 100}, "a positive value: the top");
  assert.deepStrictEqual(stemFromBar(bar, "x", 100), {x: 100, y: 100, x0: 100, y0: 40}, "a negative value: the bottom");
  assert.deepStrictEqual(stemFromBar(bar, "x", 30), {x: 100, y: 40, x0: 100, y0: 100}, "a value clamped past the axis");
  assert.deepStrictEqual(stemFromBar(bar, "x", NaN), {x: 100, y: 40, x0: 100, y0: 100}, "no value: the top");
});

it("stemFromBar — a horizontal bar's head sits at the end nearer its value", () => {
  const bar = {x: 0, y: -5, width: 80, height: 10, transform: {x: 20, y: 50}};
  assert.deepStrictEqual(stemFromBar(bar, "y", 100), {x: 100, y: 50, x0: 20, y0: 50}, "a positive value: the right");
  assert.deepStrictEqual(stemFromBar(bar, "y", 20), {x: 20, y: 50, x0: 100, y0: 50}, "a negative value: the left");
  assert.deepStrictEqual(stemFromBar({x: 0, y: 0, width: 0, height: 10}, "y", 0), {x: 0, y: 5, x0: 0, y0: 5}, "a zero-length bar");
});

it("stemPoints — two ends per row, base first, each wrapping its row", () => {
  const rows = [{id: "a", i: 0}, {id: "b", i: 3}];
  const points = stemPoints(rows);
  assert.strictEqual(points.length, 4);
  assert.deepStrictEqual(points.map(p => [p.data.id, p.end, p.i]), [["a", false, 0], ["a", true, 0], ["b", false, 3], ["b", true, 3]]);
  assert.ok(points.every(p => p.__d3plus__ === true), "style accessors unwrap to the row");
  assert.strictEqual(points[0].data, rows[0]);
  assert.deepStrictEqual(stemPoints([]), []);
});

it("largestRadius — a number, or an accessor of the source row", () => {
  const rows = [{data: {s: 3}, i: 0}, {data: {s: 8}, i: 1}];
  assert.strictEqual(largestRadius(rows, 6), 6);
  assert.strictEqual(largestRadius(rows, d => d.s), 8);
  assert.strictEqual(largestRadius(rows, (d, i) => i * 10), 10, "with the row's index");
  assert.strictEqual(largestRadius(rows, () => NaN), 0, "ignores non-finite radii");
  assert.strictEqual(largestRadius([], 6), 0, "no rows");
  assert.strictEqual(largestRadius(rows, undefined), 0, "no radius");
});

it("lollipopBuffer — widens the value axis by the largest head's radius", () => {
  const plot = r => ({schema: {discrete: "x", stacked: false, shapeConfig: {Circle: {r}}}});
  const args = () => ({
    data: [{x: "a", y: 100, data: {}, i: 0}],
    x: scalePoint().domain(["a"]).range([0, 200]),
    y: scaleLinear().domain([100, 0]).range([0, 100]),
  });
  const small = args();
  lollipopBuffer.call(plot(3), small);
  const large = args();
  lollipopBuffer.call(plot(18), large);
  assert.ok(small.y.domain()[0] > 100, "the top value gets room");
  assert.ok(large.y.domain()[0] > small.y.domain()[0], "a larger head gets more");
  assert.ok(Math.abs(large.y.domain()[0] - 120) < 1e-6, "by the radius plus 2px, in the original scale's units");
});

it("Lollipop — draws its Bar rows with lollipopEmit, laid out as bars", () => {
  const viz = new Lollipop();
  assert.strictEqual(viz._plotShapeEmitters.Bar, lollipopEmit);
  assert.strictEqual(viz._buffer.Bar, lollipopBuffer);
  assert.strictEqual(viz.shape()({}, 0), "Bar");
  assert.strictEqual(viz.discrete(), "x");
  assert.strictEqual(viz.baseline(), 0);
  assert.strictEqual(viz.baselineBreak(), true);
  assert.strictEqual(viz.legendConfig().shape, "Circle");
  assert.strictEqual(new Lollipop().legendConfig({padding: 4}).legendConfig().shape, "Circle", "kept when the legend is configured");
  const {Bar, Circle, Line} = viz.shapeConfig();
  assert.strictEqual(Bar.label, false);
  assert.strictEqual(Circle.label, false);
  assert.strictEqual(Line.label, false);
  assert.strictEqual(Line.stroke({id: "a"}, 0), viz.shapeConfig().fill({id: "a"}, 0), "stems take the head's color");
  assert.strictEqual(lollipopDef.name, "Lollipop");
  assert.strictEqual(STEM_KEY_SUFFIX, "::stem");
});

it("Lollipop — instances keep their own emitters and buffers", () => {
  const a = new Lollipop();
  const b = new Lollipop();
  assert.notStrictEqual(a._buffer, b._buffer);
  assert.notStrictEqual(a._plotShapeEmitters, b._plotShapeEmitters);
  b.buffer(false);
  assert.strictEqual(a._buffer.Bar, lollipopBuffer);
});

it("ownerNode — a stem (and its hover target) stands in for its head", () => {
  const head = {type: "circle", key: "a", paint: {fill: "#ff0000"}};
  const stem = {type: "path", key: "a::stem", paint: {stroke: "#00ff00"}};
  const hit = {type: "path", key: "a::stem::hit", paint: {stroke: "transparent"}};
  const viz = {_chartScene: [{type: "group", key: "plot", children: [stem, hit, head]}]};
  assert.strictEqual(ownerNode(viz, stem), head);
  assert.strictEqual(ownerNode(viz, hit), head);
  assert.strictEqual(nodeColor(viz, stem), "#ff0000", "a stem's swatch is its head's color");
});

it("emitShape — a chart's own emitter overrides the registry for its key", () => {
  const calls = [];
  const override = (ctx, key) => (calls.push(key), [{type: "group", key: "custom", children: []}]);
  const ctx = {viz: {_plotShapeEmitters: {Bar: override}}, values: []};
  assert.deepStrictEqual(emitShape(ctx, "Bar"), [{type: "group", key: "custom", children: []}]);
  assert.deepStrictEqual(calls, ["Bar"]);
});
