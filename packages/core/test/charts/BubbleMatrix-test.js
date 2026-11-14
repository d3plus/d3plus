import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BubbleMatrix, Matrix} from "../../index.ts";
import {
  bubbleMatrixDef,
  layoutMatrixBubbles,
  matrixCellIsCircle,
  matrixMaxRadius,
  matrixRadiusScale,
  matrixSizeLegendScale,
  matrixSizeTooltipRows,
  matrixSizeValue,
  matrixSizeValues,
} from "../../internal.ts";
import accessor from "../../src/utils/accessor.ts";
import constant from "../../src/utils/constant.ts";
import {fieldAccessor} from "../../src/utils/fieldAccessor.ts";

useJsdom();

/** A stand-in viz holding what the bubble helpers read. */
const fake = ({schema = {}, ...rest} = {}) => ({
  schema: {
    shape: constant("Circle"),
    cellPadding: 2,
    sizeScale: "sqrt",
    row: accessor("row"),
    column: accessor("column"),
    locale: "en-US",
    translate: d => d,
    ...schema,
  },
  ctx: {},
  _size: fieldAccessor("r"),
  _sizeKey: "r",
  _filteredData: [],
  ...rest,
});

it("matrixCellIsCircle reads the shape of the cell's source row", () => {
  const viz = fake({
    schema: {shape: d => (d.kind === "dot" ? "Circle" : "Rect")},
  });
  assert.strictEqual(
    matrixCellIsCircle(
      viz,
      {row: "a", column: "b", data: {kind: "dot"}, i: 0},
      0,
    ),
    true,
  );
  assert.strictEqual(
    matrixCellIsCircle(viz, {row: "a", column: "b", data: {kind: "box"}}, 0),
    false,
  );
  assert.strictEqual(
    matrixCellIsCircle(fake({schema: {shape: constant("Rect")}}), {row: 1}, 0),
    false,
  );
});

it("matrixSizeValue is the absolute value, NaN when missing or unsized", () => {
  const viz = fake();
  assert.strictEqual(matrixSizeValue(viz, {r: -0.5}, 0), 0.5);
  assert.strictEqual(matrixSizeValue(viz, {r: "0.25"}, 0), 0.25);
  assert.ok(Number.isNaN(matrixSizeValue(viz, {r: null}, 0)));
  assert.ok(Number.isNaN(matrixSizeValue(viz, {r: ""}, 0)));
  assert.ok(Number.isNaN(matrixSizeValue(viz, {r: "n/a"}, 0)));
  assert.ok(Number.isNaN(matrixSizeValue(viz, {}, 0)));
  assert.ok(Number.isNaN(matrixSizeValue(fake({_size: undefined}), {r: 1}, 0)));
});

it("matrixMaxRadius is half the cell's shorter side less the padding", () => {
  assert.strictEqual(matrixMaxRadius(40, 30, 2), 14);
  assert.strictEqual(matrixMaxRadius(20, 50, 0), 10);
  assert.strictEqual(matrixMaxRadius(1, 1, 4), 0);
  assert.strictEqual(matrixMaxRadius(NaN, 10, 0), 0);
});

it("matrixRadiusScale is anchored at zero, the largest value filling the cell", () => {
  const sqrt = matrixRadiusScale("sqrt", [0.25, 1, 0.5], 20);
  assert.deepStrictEqual(sqrt.domain(), [0.25, 1]);
  assert.strictEqual(sqrt(1), 20);
  assert.ok(Math.abs(sqrt(0.25) - 10) < 1e-9, "area follows the value");
  const linear = matrixRadiusScale("linear", [0.25, 1], 20);
  assert.ok(Math.abs(linear(0.25) - 5) < 1e-9, "radius follows the value");
  const one = matrixRadiusScale("sqrt", [3, 3], 12);
  assert.strictEqual(one(3), 12, "a single value fills the cell");
  const unknown = matrixRadiusScale("nope", [1, 4], 10);
  assert.strictEqual(unknown(1), 5, "an unknown scale falls back to sqrt");
  assert.strictEqual(matrixRadiusScale("sqrt", [0, 0], 10), null);
  assert.strictEqual(matrixRadiusScale("sqrt", [], 10), null);
  assert.strictEqual(matrixRadiusScale("sqrt", [1, 2], 0), null);
  assert.deepStrictEqual(
    matrixRadiusScale("sqrt", [NaN, 0, 2, 1], 10).domain(),
    [1, 2],
    "non-finite values and zeros are skipped",
  );
});

it("matrixSizeValues collects the magnitudes of circle rows", () => {
  const viz = fake({schema: {shape: d => (d.r > 0 ? "Circle" : "Rect")}});
  assert.deepStrictEqual(
    matrixSizeValues(viz, [{r: 2}, {r: -3}, {r: 0.5}, {}]),
    [2, 0.5],
  );
  assert.deepStrictEqual(
    matrixSizeValues(fake(), [{r: 2}, {r: -3}, {}]),
    [2, 3],
  );
});

it("matrixSizeLegendScale estimates each cell's share of the chart area", () => {
  const rows = [
    {row: "a", column: "x", r: 1},
    {row: "a", column: "y", r: -0.5},
    {row: "b", column: "x", r: 0.25},
    {row: "b", column: "y", r: 0.75},
  ];
  const viz = fake({_filteredData: rows});
  const scale = matrixSizeLegendScale(viz, {width: 200, height: 100});
  assert.deepStrictEqual(scale.domain(), [0.25, 1]);
  assert.strictEqual(scale(1), 24, "(min(100, 50) - 2) / 2");
  viz.ctx.sharedSizeValues = [2, 4];
  assert.deepStrictEqual(
    matrixSizeLegendScale(viz, {width: 200, height: 100}).domain(),
    [2, 4],
    "small multiples read the shared values",
  );
  assert.strictEqual(
    matrixSizeLegendScale(fake({_size: undefined, _filteredData: rows}), {
      width: 200,
      height: 100,
    }),
    null,
  );
  assert.strictEqual(
    matrixSizeLegendScale(
      fake({schema: {shape: constant("Rect")}, _filteredData: rows}),
      {width: 200, height: 100},
    ),
    null,
    "no circle rows",
  );
});

it("matrixSizeTooltipRows shows the signed size unless the colorScale does", () => {
  const viz = fake();
  assert.deepStrictEqual(matrixSizeTooltipRows(viz, {r: -0.5}, 0), [
    ["r", "-0.5"],
  ]);
  assert.deepStrictEqual(matrixSizeTooltipRows(viz, {}, 0), []);
  assert.deepStrictEqual(
    matrixSizeTooltipRows(fake({_size: undefined}), {r: 1}, 0),
    [],
  );
  assert.deepStrictEqual(
    matrixSizeTooltipRows(fake({schema: {shape: constant("Rect")}}), {r: 1}, 0),
    [],
  );
  const same = fake({schema: {colorScale: fieldAccessor("r")}});
  assert.deepStrictEqual(
    matrixSizeTooltipRows(same, {r: 1}, 0),
    [],
    "the colorScale row already shows it",
  );
  const other = fake({schema: {colorScale: fieldAccessor("growth")}});
  assert.deepStrictEqual(matrixSizeTooltipRows(other, {r: 1200}, 0), [
    ["r", "1.2k"],
  ]);
  const unnamed = fake({_size: d => d.r, _sizeKey: undefined});
  assert.deepStrictEqual(matrixSizeTooltipRows(unnamed, {r: 3}, 0), [
    ["Value", "3"],
  ]);
});

it("layoutMatrixBubbles stashes the radius scale for the cells and the size legend", () => {
  const cells = [
    {row: "a", column: "x", i: 0, data: {r: 1}},
    {row: "a", column: "y", i: 1, data: {r: -0.25}},
    {row: "b", column: "x", data: {row: "b", column: "x"}},
  ];
  const viz = fake();
  viz.ctx = {cellWidth: 42, cellHeight: 60};
  layoutMatrixBubbles(viz, cells);
  assert.strictEqual(viz.ctx.maxRadius, 20);
  assert.deepStrictEqual(viz.ctx.radiusScale.domain(), [0.25, 1]);
  assert.strictEqual(viz.ctx.radiusScale(1), 20);
  assert.strictEqual(viz._sizeLegendFinal, viz.ctx.radiusScale);

  viz.ctx.sharedSizeValues = [0.5, 2];
  layoutMatrixBubbles(viz, cells);
  assert.ok(Math.abs(viz.ctx.radiusScale(1) - 20 / Math.sqrt(2)) < 1e-9);

  const unsized = fake({_size: undefined});
  unsized.ctx = {cellWidth: 42, cellHeight: 60};
  layoutMatrixBubbles(unsized, cells);
  assert.strictEqual(unsized.ctx.maxRadius, 20, "circles still fill the cell");
  assert.strictEqual(unsized.ctx.radiusScale, null);
  assert.strictEqual(unsized._sizeLegendFinal, null);

  const rects = fake({schema: {shape: constant("Rect")}});
  rects.ctx = {cellWidth: 42, cellHeight: 60};
  layoutMatrixBubbles(rects, cells);
  assert.strictEqual(rects._sizeLegendFinal, null, "no circles, no legend");
});

it("Matrix size accepts a key or accessor and BubbleMatrix draws circles", () => {
  const matrix = new Matrix();
  assert.strictEqual(matrix.size(), undefined);
  assert.strictEqual(matrix.size("value"), matrix);
  assert.strictEqual(matrix._sizeKey, "value");
  assert.strictEqual(matrix.size()({value: 3}), 3);
  const fn = d => d.v;
  matrix.size(fn);
  assert.strictEqual(matrix.size(), fn);
  assert.strictEqual(matrix._sizeKey, undefined);
  assert.strictEqual(matrix.sizeScale(), "sqrt");
  assert.strictEqual(matrix.shape()({}, 0), "Rect");

  const bubbles = new BubbleMatrix();
  assert.strictEqual(bubbles.shape()({}, 0), "Circle");
  assert.strictEqual(typeof bubbles.size, "function");
  assert.strictEqual(bubbleMatrixDef.name, "BubbleMatrix");
});
