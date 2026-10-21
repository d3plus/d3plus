import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Waffle} from "../../index.ts";
import {applyWaffleLayout, waffleFillOptions} from "../../src/charts/Waffle/applyLayout.ts";
import {waffleCellGeometryNode, waffleCellShape, waffleEmit} from "../../src/charts/Waffle/emit.ts";
import {formatShare, waffleShare, waffleTooltipRows} from "../../src/charts/Waffle/tooltip.ts";
import {waffleDef} from "../../src/charts/Waffle/index.ts";
import {SHARE_KEY} from "../../src/charts/features/shareKey.ts";

useJsdom();

const rows = () => [
  {id: "alpha", value: 20},
  {id: "beta", value: 50},
  {id: "gamma", value: 30},
];

/** A Waffle laid out by hand over `data` in a `width × height` chart area. */
function laidOut(data, config = {}, {width = 220, height = 220} = {}) {
  const viz = new Waffle().config({groupBy: "id", ...config}).width(width).height(height);
  viz._filteredData = data;
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._ids = d => [d.id];
  viz._drawLabel = d => d.id;
  return {viz, shapeData: applyWaffleLayout({viz}).shapeData};
}

it("waffleFillOptions: reads the fill settings, falling back to the defaults", () => {
  const options = schema => waffleFillOptions({schema});
  assert.deepStrictEqual(options({}), {fillDirection: "row", fillStart: "top-left", unit: undefined});
  assert.deepStrictEqual(
    options({fillDirection: "column", fillStart: "bottom-right", unit: 25}),
    {fillDirection: "column", fillStart: "bottom-right", unit: 25},
  );
  assert.deepStrictEqual(
    options({fillDirection: "diagonal", fillStart: "middle", unit: -1}),
    {fillDirection: "row", fillStart: "top-left", unit: undefined},
  );
  assert.strictEqual(options({unit: "4"}).unit, 4, "a numeric string counts");
});

it("applyWaffleLayout: fills 100 cells in descending order, keyed per category", () => {
  const {viz, shapeData} = laidOut(rows());
  assert.strictEqual(shapeData.length, 100);
  const ids = shapeData.map(c => c.data.id);
  assert.deepStrictEqual(
    [ids.indexOf("beta"), ids.indexOf("gamma"), ids.indexOf("alpha")],
    [0, 50, 80],
    "the largest category fills first",
  );
  assert.strictEqual(shapeData[0].id, "beta-0");
  assert.strictEqual(shapeData[49].id, "beta-49");
  assert.strictEqual(shapeData[50].n, 0, "each category counts its own cells");
  assert.strictEqual(shapeData[0].i, 1, "the index of the row in the drawn data");
  assert.strictEqual(new Set(shapeData.map(c => `${c.row},${c.column}`)).size, 100, "no two cells overlap");
  assert.strictEqual(viz.ctx.waffleTotal, 100);
  assert.deepStrictEqual(viz.ctx.waffleGrid, {rows: 10, columns: 10});
});

it("applyWaffleLayout: places cells on a centered square grid", () => {
  const {shapeData} = laidOut(rows(), {cellPadding: 2}, {width: 400, height: 218});
  const first = shapeData[0], last = shapeData[99];
  assert.strictEqual(first.size, 20);
  assert.deepStrictEqual([first.x, first.y], [91, 0]);
  assert.deepStrictEqual([last.x, last.y], [91 + 9 * 22, 9 * 22]);
});

it("applyWaffleLayout: stamps each row's share", () => {
  const data = rows();
  const {shapeData} = laidOut(data);
  assert.deepStrictEqual(data.map(d => d[SHARE_KEY]), [0.2, 0.5, 0.3]);
  assert.strictEqual(shapeData[0].share, 0.5);
});

it("applyWaffleLayout: honors sort, unit, direction, and starting corner", () => {
  const {viz, shapeData} = laidOut(rows(), {
    sort: false,
    unit: 10,
    columns: 4,
    fillDirection: "row",
    fillStart: "bottom-right",
  });
  assert.strictEqual(shapeData.length, 10, "100 / 10");
  assert.deepStrictEqual(viz.ctx.waffleGrid, {rows: 3, columns: 4});
  assert.deepStrictEqual(shapeData.map(c => c.data.id).slice(0, 3), ["alpha", "alpha", "beta"], "data order");
  assert.deepStrictEqual([shapeData[0].row, shapeData[0].column], [2, 3]);
});

it("applyWaffleLayout: sorts a threshold bucket last", () => {
  const data = [...rows(), {id: "Values", value: 90, _isAggregation: true}];
  const {shapeData} = laidOut(data);
  assert.strictEqual(shapeData[shapeData.length - 1].data.id, "Values");
});

it("applyWaffleLayout: returns no cells without data", () => {
  assert.deepStrictEqual(laidOut([]).shapeData, []);
});

it("waffleCellShape: accepts the three shapes, defaulting to square", () => {
  assert.strictEqual(waffleCellShape("rounded"), "rounded");
  assert.strictEqual(waffleCellShape("circle"), "circle");
  assert.strictEqual(waffleCellShape("square"), "square");
  assert.strictEqual(waffleCellShape("hexagon"), "square");
  assert.strictEqual(waffleCellShape(undefined), "square");
});

it("waffleCellGeometryNode: draws squares, rounded squares, and circles", () => {
  const cell = {x: 10, y: 20, size: 40};
  assert.deepStrictEqual(waffleCellGeometryNode(cell, "square"), {type: "rect", x: 10, y: 20, width: 40, height: 40});
  assert.deepStrictEqual(
    waffleCellGeometryNode(cell, "rounded"),
    {type: "rect", x: 10, y: 20, width: 40, height: 40, rx: 10, ry: 10},
  );
  assert.deepStrictEqual(waffleCellGeometryNode(cell, "circle"), {type: "circle", cx: 30, cy: 40, r: 20});
});

it("waffleEmit: one node per cell carrying its category's row", () => {
  const {viz, shapeData} = laidOut(rows(), {cellShape: "circle"});
  const nodes = waffleEmit({viz, shapeData});
  assert.strictEqual(nodes.length, 100);
  assert.ok(nodes.every(n => n.type === "circle"));
  assert.strictEqual(nodes[0].key, "waffle-beta-0");
  assert.strictEqual(nodes[0].datum, shapeData[0].data);
  assert.strictEqual(nodes[0].index, 1);
  const fills = new Set(nodes.filter(n => n.datum.id === "beta").map(n => n.paint.fill));
  assert.strictEqual(fills.size, 1, "a category shares one fill");
  assert.strictEqual(nodes[0].aria.label, "beta, 50, 50%", "the first cell names its category");
  assert.strictEqual(nodes[1].aria.hidden, true, "the rest stay out of the accessibility tree");
});

it("waffleEmit: draws an icon over a transparent cell", () => {
  const {viz, shapeData} = laidOut(rows(), {icon: d => `./${d.id}.svg`});
  const nodes = waffleEmit({viz, shapeData});
  const cells = nodes.filter(n => n.type === "rect");
  const images = nodes.filter(n => n.type === "group");
  assert.strictEqual(cells.length, 100);
  assert.strictEqual(images.length, 100, "one icon per cell");
  assert.ok(cells.every(n => n.paint.fill === "transparent"));
  const image = images[0].children.find(n => n.type === "image");
  assert.strictEqual(image.href, "./beta.svg");
  assert.strictEqual(image.preserveAspectRatio, "xMidYMid meet", "icons fit inside their cell");
  assert.strictEqual(images[0].datum, cells[0].datum, "the icon dims with its cell");
});

it("waffleEmit: draws shapeConfig.backgroundImage over the fill", () => {
  const {viz, shapeData} = laidOut(rows(), {shapeConfig: {backgroundImage: "./pattern.png"}});
  const nodes = waffleEmit({viz, shapeData});
  assert.strictEqual(nodes.filter(n => n.type === "group").length, 100);
  assert.notStrictEqual(nodes[0].paint.fill, "transparent");
});

it("waffleEmit: emits nothing without cells", () => {
  const {viz} = laidOut([]);
  assert.deepStrictEqual(waffleEmit({viz, shapeData: []}), []);
});

it("formatShare: formats a share as a percentage", () => {
  assert.strictEqual(formatShare(0.5, "en-US"), "50%");
  assert.strictEqual(formatShare(0.1234, "en-US"), "12.3%");
  assert.strictEqual(formatShare(NaN, "en-US"), "");
  assert.strictEqual(formatShare(null, "en-US"), "");
});

const fakeViz = (extra = {}) => ({
  schema: {
    sum: d => d.value,
    locale: "en-US",
    translate: s => `[${s}]`,
    colorScale: d => d.value,
    ...extra.schema,
  },
  _colorScaleClass: {
    _data: rows(),
    _colorScale: v => (v >= 30 ? "dark" : "light"),
  },
});

it("waffleShare: reads a row's stamped share, summing merged rows", () => {
  const viz = fakeViz();
  assert.strictEqual(waffleShare(viz, {[SHARE_KEY]: 0.25}), 0.25);
  assert.strictEqual(waffleShare(viz, {[SHARE_KEY]: [0.25, 0.5]}), 0.75);
  assert.ok(Number.isNaN(waffleShare(viz, {})));
});

it("waffleShare: sums the share of a colorScale swatch's range", () => {
  const viz = fakeViz();
  assert.strictEqual(waffleShare(viz, {_isColorScaleBucket: true, color: "dark"}), 0.8);
  assert.strictEqual(waffleShare(viz, {_isColorScaleBucket: true, color: "light"}), 0.2);
});

it("waffleTooltipRows: a translated Value row and Share row", () => {
  const viz = fakeViz();
  const [[valueLabel, value], [shareLabel, share]] = waffleTooltipRows(viz);
  assert.strictEqual(valueLabel(), "[Value]");
  assert.strictEqual(shareLabel(), "[Share]");
  const row = {id: "beta", value: 1500, [SHARE_KEY]: 0.5};
  assert.strictEqual(value(row, 0, row), "1.5k");
  assert.strictEqual(share(row, 0, row), "50%");
  const bucket = {_isColorScaleBucket: true, color: "dark"};
  assert.strictEqual(value(bucket, 0, bucket), "", "a swatch has no single value");
  assert.strictEqual(share(bucket, 0, bucket), "80%");
  assert.strictEqual(value({id: "x"}, 0, {id: "x"}), "", "a missing value is blank");
});

it("waffleDef: ctx and fields are the last two keys", () => {
  const keys = Object.keys(waffleDef);
  assert.deepStrictEqual(keys.slice(-2), ["ctx", "fields"]);
  assert.strictEqual(waffleDef.facet.aspect, 1);
});

it("Waffle: exposes its options with their defaults", () => {
  const viz = new Waffle();
  assert.strictEqual(viz.rows(), 10);
  assert.strictEqual(viz.columns(), 10);
  assert.strictEqual(viz.cellPadding(), 2);
  assert.strictEqual(viz.cellShape(), "square");
  assert.strictEqual(viz.fillDirection(), "row");
  assert.strictEqual(viz.fillStart(), "top-left");
  assert.strictEqual(viz.unit(), undefined);
  assert.strictEqual(viz.icon(), undefined);
  assert.strictEqual(viz.zoom(), false);
  assert.strictEqual(viz.sum()({value: 7}), 7);
  assert.strictEqual(viz.sum("n").sum()({n: 3}), 3);
});

it("Waffle: the legend lists categories in fill order", () => {
  const viz = new Waffle();
  const [a, b] = [{value: 1}, {value: 9}];
  assert.ok(viz.legendSort()(a, b) > 0, "descending by sum by default");
  assert.ok(viz.legendSort()({value: 99, _isAggregation: true}, b) > 0, "a threshold bucket last");
  viz.sort(false);
  assert.strictEqual(viz.legendSort()(a, b), 0, "data order without a sort");
  viz.sort((x, y) => x.value - y.value);
  assert.ok(viz.legendSort()(a, b) < 0, "a custom sort");
});
