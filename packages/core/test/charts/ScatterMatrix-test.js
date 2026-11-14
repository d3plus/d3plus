import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Scatter, ScatterMatrix} from "../../index.ts";
import {
  BIN_FILL,
  BIN_GAP,
  MATRIX_BIN,
  MATRIX_ID,
  MATRIX_META,
  binRect,
  cellIndex,
  inBin,
  matrixAxes,
  matrixBins,
  matrixColor,
  matrixDimensions,
  matrixDomains,
  matrixFacetHooks,
  matrixFacetPanel,
  matrixHoverFilter,
  matrixMeta,
  matrixObservation,
  matrixPoints,
  matrixState,
  matrixTooltipContext,
  matrixTooltipRows,
  matrixTooltipTitle,
  panelScales,
  prepareMatrix,
  scatterMatrixDef,
  unwrapMatrixRow,
} from "../../internal.ts";

useJsdom();

const rows = [
  {kind: "a", w: 1, h: 10, d: 100},
  {kind: "a", w: 2, h: 20, d: undefined},
  {kind: "b", w: 3, h: 30, d: 300},
  {kind: "b", w: 4, h: 40, d: 400},
];
const read = key => d => d[key];
const dims = [read("w"), read("h"), read("d")];

/** A ScatterMatrix over `data`, with its data prepared for a draw. */
const prepared = (data, config = {}) => {
  const viz = new ScatterMatrix().data(data).config(config);
  viz._preDraw();
  return viz;
};

it("ScatterMatrix — a Scatter on a grid of small multiples", () => {
  const viz = new ScatterMatrix();
  assert.ok(viz instanceof Scatter);
  assert.strictEqual(scatterMatrixDef.name, "ScatterMatrix");
  assert.strictEqual(scatterMatrixDef.facet, matrixFacetHooks);
  assert.strictEqual(viz.axisHover(), false);
  assert.strictEqual(viz.dataCutoff(), 2000);
  assert.strictEqual(viz.shapeConfig().Circle.r, 3);
  assert.strictEqual(viz.shapeConfig().Circle.label, false);
  assert.strictEqual(viz.xConfig().rounding, "none");
  assert.strictEqual(viz.yConfig().rounding, "none");
  assert.deepStrictEqual(viz.facetConfig(), {padding: 10, title: false});
  assert.strictEqual(viz._tooltipAxisRows, false);
  assert.ok(viz._plotShapeEmitters[MATRIX_BIN]);
  assert.strictEqual(matrixFacetHooks.align, true);
  assert.strictEqual(matrixFacetHooks.aspect, 1);
});

it("cellIndex + matrixMeta — a panel row's place in the matrix", () => {
  assert.strictEqual(cellIndex(0, 0, 4), 0);
  assert.strictEqual(cellIndex(2, 1, 4), 9);
  const meta = {kind: "point", i: 1, j: 0, row: 0, x: 1, y: 2};
  const row = {[MATRIX_META]: meta};
  assert.strictEqual(matrixMeta(row), meta);
  assert.strictEqual(matrixMeta({__d3plus__: true, data: row}), meta);
  assert.strictEqual(matrixMeta({}), undefined);
  assert.strictEqual(matrixMeta(undefined), undefined);
  assert.strictEqual(unwrapMatrixRow({__d3plus__: true, data: row}), row);
});

it("matrixPoints — an observation in every off-diagonal panel it has values for", () => {
  const points = matrixPoints(rows, dims, k => `R${k}`);
  // Rows with all three values: 3 × 2 panels; the row missing `d`: 2.
  assert.strictEqual(points.length, 6 * 3 + 2);
  const first = points.filter(p => p[MATRIX_ID] === "R0");
  assert.deepStrictEqual(
    first.map(p => [p[MATRIX_META].i, p[MATRIX_META].j]),
    [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 2],
      [2, 0],
      [2, 1],
    ],
  );
  const p = first.find(r => r[MATRIX_META].i === 1 && r[MATRIX_META].j === 0);
  assert.strictEqual(p[MATRIX_META].x, 1, "x is the column's dimension");
  assert.strictEqual(p[MATRIX_META].y, 10, "y is the row's");
  assert.strictEqual(p.kind, "a", "keeps the observation's fields");
  assert.notStrictEqual(p, rows[0]);
  assert.ok(
    points
      .filter(r => r[MATRIX_ID] === "R1")
      .every(r => r[MATRIX_META].i !== 2 && r[MATRIX_META].j !== 2),
  );
  assert.strictEqual(matrixPoints(rows, dims)[0][MATRIX_ID], "0");
});

it("matrixBins — stacked histogram bars per group, on edges every group shares", () => {
  const group = d => d.kind;
  const bins = matrixBins(rows, [read("w")], group, [2.5]);
  const meta = bins.map(b => b[MATRIX_META]);
  assert.deepStrictEqual(
    meta.map(m => [m.x0, m.x1, m.group, m.count, m.y0, m.max, m.last]),
    [
      [1, 2.5, "a", 2, 0, 2, false],
      [2.5, 4, "b", 2, 0, 2, true],
    ],
  );
  assert.ok(meta.every(m => m.kind === "bin" && m.i === 0 && m.j === 0));
  assert.strictEqual(meta[0].x, 1.75);
  assert.strictEqual(meta[0].y, 1, "sits at the lowest value");
  assert.strictEqual(bins[1].kind, "b", "a group's first observation's fields");
  assert.strictEqual(bins[0][MATRIX_ID], "bin 0 1 a");

  const one = matrixBins(rows, [read("w")], () => "", 1);
  assert.strictEqual(one.length, 1);
  assert.strictEqual(one[0][MATRIX_META].count, 4);

  const stacked = matrixBins(rows, [read("h")], group, [25, 100]);
  const low = stacked.map(b => b[MATRIX_META]).filter(m => m.x0 === 10);
  assert.deepStrictEqual(
    low.map(m => [m.group, m.count, m.y0]),
    [["a", 2]].map(([g, c]) => [g, c, 0]),
  );

  // Hidden observations aren't counted, but the edges stay put.
  const shown = matrixBins(
    rows,
    [read("w")],
    group,
    [2.5],
    d => d.kind === "b",
  );
  assert.deepStrictEqual(
    shown.map(b => [b[MATRIX_META].x0, b[MATRIX_META].group]),
    [[2.5, "b"]],
  );
  assert.deepStrictEqual(matrixBins([], dims, group), []);
});

it("matrixDomains — each dimension's padded, rounded extent", () => {
  const [w, h, d] = matrixDomains(rows, dims);
  assert.ok(w[0] <= 1 - 0.15 && w[1] >= 4 + 0.15, "padded");
  assert.ok(Number.isInteger(w[0] * 2) && Number.isInteger(w[1] * 2), "round");
  assert.ok(h[0] <= 10 && h[1] >= 40);
  assert.ok(d[0] <= 100 && d[1] >= 400);
  const [single] = matrixDomains([{v: 5}], [read("v")]);
  assert.deepStrictEqual(single, [4, 6]);
  assert.deepStrictEqual(matrixDomains([{v: "x"}], [read("v")]), [undefined]);
});

it("binRect — a bar from the panel's floor, stacked on the groups below", () => {
  const x = v => v * 10;
  const r = binRect({x0: 1, x1: 3, count: 2, y0: 1, max: 4}, x, 100, 0);
  const unit = (100 * BIN_FILL) / 4;
  assert.strictEqual(r.x, 20);
  assert.strictEqual(r.width, 20 - BIN_GAP);
  assert.strictEqual(r.height, 2 * unit);
  assert.strictEqual(r.y, 100 - unit - unit, "centered above the stack");
  const empty = binRect({x0: 0, x1: 0.05, count: 0, y0: 0, max: 0}, x, 50, 0);
  assert.strictEqual(empty.height, 0);
  assert.strictEqual(empty.width, 0, "never negative");
});

it("panelScales — a column's x domain and a row's y domain", () => {
  const axes = {
    titles: ["a", "b"],
    domains: [
      [0, 1],
      [10, 20],
    ],
  };
  assert.deepStrictEqual(panelScales(axes, 1, 0), {
    domains: {x: [0, 1], y: [20, 10]},
    padded: {x: [0, 1], y: [20, 10]},
  });
  assert.deepStrictEqual(
    panelScales({titles: [], domains: [undefined]}, 0, 0).domains,
    {},
  );
});

it("matrixFacetPanel — a panel's scales and axis titles, and their undo", () => {
  const viz = prepared(rows, {dimensions: ["w", "h", "d"]});
  const panelRows = viz._data.filter(
    d => d[MATRIX_META].i === 2 && d[MATRIX_META].j === 1,
  );
  viz._filteredData = panelRows;
  const saved = {x: viz._xConfig, y: viz._yConfig};
  const undo = matrixFacetPanel(
    viz,
    {cell: {}, shared: true, labels: {x: true, y: true}, scales: undefined},
    matrixAxes(viz),
  );
  assert.strictEqual(viz._xConfig.title, "h");
  assert.strictEqual(viz._yConfig.title, "d");
  const axes = matrixAxes(viz);
  assert.deepStrictEqual(viz._plotFacetScales.domains.x, axes.domains[1]);
  assert.deepStrictEqual(
    viz._plotFacetScales.domains.y,
    axes.domains[2].slice().reverse(),
  );
  undo();
  assert.strictEqual(viz._xConfig, saved.x);
  assert.strictEqual(viz._yConfig, saved.y);
  assert.deepStrictEqual(matrixAxes(new Scatter()), {titles: [], domains: []});
});

it("prepareMatrix — panel rows, the observation level, and the grid", () => {
  const viz = prepared(rows, {dimensions: ["w", "h"], groupBy: "kind"});
  const state = matrixState(viz);
  assert.strictEqual(state.raw.length, 4);
  assert.strictEqual(viz._sourceData, state.raw);
  assert.strictEqual(state.grouped, true);
  assert.strictEqual(viz.schema.groupBy.length, 2);
  assert.strictEqual(viz.schema.groupBy[1], state.observation);
  assert.deepStrictEqual(state.axes.titles, ["w", "h"]);
  const points = viz._data.filter(d => d[MATRIX_META].kind === "point");
  assert.strictEqual(points.length, 8);
  assert.strictEqual(points[0][MATRIX_ID], "Row 1");
  assert.ok(state.binned.size > 0);
  assert.ok(viz._filterApplied([...state.binned][0]));
  assert.ok(!viz._filterApplied(points[0]));
  assert.strictEqual(viz.schema.facet(points[0]), cellIndex(0, 1, 2));
  assert.strictEqual(viz.facetConfig().columns, 2);
  assert.strictEqual(viz.facetConfig().rows, 2);

  // A second draw keeps the user's observations and groupBy.
  prepareMatrix(viz);
  assert.strictEqual(viz.schema.groupBy.length, 2);
  viz._preDraw();
  assert.strictEqual(matrixState(viz).raw.length, 4);
  assert.strictEqual(viz.schema.groupBy.length, 2);

  // New data replaces the observations.
  viz.data(rows.slice(0, 2));
  viz._preDraw();
  assert.strictEqual(matrixState(viz).raw.length, 2);

  // Legend-hidden observations leave the histograms.
  const hidden = prepared(rows, {dimensions: ["w", "h"], groupBy: "kind"});
  hidden._hidden = ["Row 1", "Row 2"];
  hidden._preDraw();
  assert.ok(
    [...matrixState(hidden).binned].every(b => b[MATRIX_META].group === "b"),
  );
  hidden.locale("es-ES");
  hidden._hidden = [];
  hidden._preDraw();
  assert.strictEqual(hidden._data[0][MATRIX_ID], "Fila 1");
});

it("prepareMatrix — axes from every row, whatever is filtered or hidden", () => {
  const all = prepared(rows, {dimensions: ["w", "h"], groupBy: "kind"});
  const domains = matrixState(all).axes.domains;
  const filtered = prepared(rows, {
    dimensions: ["w", "h"],
    groupBy: "kind",
    filter: d => d.kind === "a",
  });
  assert.deepStrictEqual(matrixState(filtered).axes.domains, domains);
  assert.ok(
    [...matrixState(filtered).binned].every(b => b[MATRIX_META].group === "a"),
    "the histograms count what passes the filter",
  );
  const hidden = prepared(rows, {dimensions: ["w", "h"], groupBy: "kind"});
  hidden._hidden = ["Row 1", "Row 2"];
  hidden._preDraw();
  assert.deepStrictEqual(matrixState(hidden).axes.domains, domains);
  const timed = prepared(
    rows.map((d, k) => ({...d, year: 2020 + (k % 2)})),
    {dimensions: ["w", "h"], groupBy: "kind", time: "year"},
  );
  assert.deepStrictEqual(matrixState(timed).axes.domains, domains);
  // A bar carries a counted observation's fields, so it passes the time
  // filter too.
  assert.ok([...matrixState(timed).binned].every(b => b.year === 2021));
});

it("matrixDimensions — the configured dimensions, else every numeric key", () => {
  const viz = new ScatterMatrix().data(rows);
  assert.deepStrictEqual(
    matrixDimensions(viz, rows).map(d => d.title),
    ["w", "h", "d"],
  );
  viz.groupBy("kind").config({
    dimensions: ["h", {value: "w", title: "Width"}, d => d.d],
  });
  const dimsOut = matrixDimensions(viz, rows);
  assert.deepStrictEqual(
    dimsOut.map(d => d.title),
    ["h", "Width", ""],
  );
  assert.strictEqual(dimsOut[2].accessor(rows[2]), 300);
  const withId = new ScatterMatrix().groupBy("w");
  assert.deepStrictEqual(
    matrixDimensions(withId, [{id: 1, w: 2, h: 3}]).map(d => d.title),
    ["h"],
    "skips id and groupBy keys",
  );
});

it("matrixDimensions — fewer than two warns", () => {
  const warn = console.warn;
  const messages = [];
  console.warn = m => messages.push(m);
  try {
    prepared([{a: 1, b: "x"}]);
  } finally {
    console.warn = warn;
  }
  assert.ok(messages.some(m => /at least two numeric dimensions/.test(m)));
});

it("matrixColor + matrixObservation — colors and ids", () => {
  const plain = prepared(rows, {dimensions: ["w", "h"]});
  const first = plain.schema.colorDefaults.scale.range()[0];
  assert.strictEqual(matrixState(plain).grouped, false);
  assert.strictEqual(plain.schema.color(plain._data[0], 0), first);
  assert.strictEqual(plain.legend()(plain, []), false, "no groups, no legend");
  const grouped = prepared(rows, {dimensions: ["w", "h"], groupBy: "kind"});
  assert.strictEqual(grouped.schema.color(grouped._data[0], 0), "a");
  assert.strictEqual(matrixColor(grouped, () => "c")(grouped._data[0], 0), "c");
  assert.strictEqual(matrixObservation({[MATRIX_ID]: "Row 3"}), "Row 3");
});

it("inBin + matrixHoverFilter — linked hover", () => {
  const bin = {x0: 1, x1: 2, last: false};
  assert.ok(inBin(bin, 1));
  assert.ok(inBin(bin, 1.5));
  assert.ok(!inBin(bin, 2));
  assert.ok(inBin({...bin, last: true}, 2));
  assert.ok(!inBin(bin, "1"));
  assert.ok(!inBin(bin, NaN));

  const viz = prepared(rows, {dimensions: ["w", "h"], groupBy: "kind"});
  const state = matrixState(viz);
  const accessors = state.dims.map(d => d.accessor);
  const points = viz._data.filter(d => d[MATRIX_META].kind === "point");
  const point = points.find(d => d[MATRIX_ID] === "Row 3");
  const byPoint = matrixHoverFilter(point, accessors, state.group);
  assert.deepStrictEqual(
    [...new Set(points.filter((d, i) => byPoint(d, i)).map(d => d[MATRIX_ID]))],
    ["Row 3"],
  );
  assert.ok(!byPoint([...state.binned][0], 0));

  const bins = [...state.binned];
  const target = bins.find(
    b => b[MATRIX_META].i === 0 && b[MATRIX_META].group === "b",
  );
  const byBin = matrixHoverFilter(target, accessors, state.group);
  const lit = points.filter((d, i) => byBin({__d3plus__: true, data: d}, i));
  assert.ok(lit.length > 0);
  assert.ok(lit.every(d => d.kind === "b"));
  assert.ok(byBin(target, 0), "the bar itself");
  assert.ok(
    !byBin(
      bins.find(b => b !== target),
      0,
    ),
  );
  assert.ok(!byBin({}, 0));
  assert.strictEqual(matrixHoverFilter({}, accessors, state.group), undefined);
});

it("matrixTooltipTitle + matrixTooltipRows — the tooltip", () => {
  const viz = prepared(rows, {dimensions: ["w", "h"], groupBy: "kind"});
  const ctx = matrixTooltipContext(viz);
  assert.strictEqual(ctx.groupDepth, 1);
  const point = viz._data.find(d => d[MATRIX_ID] === "Row 3");
  const wrapped = {__d3plus__: true, data: point};
  assert.strictEqual(matrixTooltipTitle(viz, ctx, wrapped, 0), "b");
  assert.deepStrictEqual(matrixTooltipRows(viz, ctx, wrapped, 0), [
    ["w", "3"],
    ["h", "30"],
  ]);
  const bin = [...matrixState(viz).binned][0];
  const meta = bin[MATRIX_META];
  assert.strictEqual(
    matrixTooltipTitle(viz, ctx, bin, 0),
    `w: ${meta.x0} – ${meta.x1}`,
  );
  assert.deepStrictEqual(matrixTooltipRows(viz, ctx, bin, 0), [
    [meta.group, `${meta.count}`],
  ]);

  const plain = prepared(rows, {dimensions: ["w", "h"]});
  const pctx = matrixTooltipContext(plain);
  assert.strictEqual(pctx.groupDepth, 0);
  const p = plain._data[0];
  assert.strictEqual(matrixTooltipTitle(plain, pctx, p, 0), "Row 1");
  const pbin = [...matrixState(plain).binned][0];
  assert.strictEqual(matrixTooltipRows(plain, pctx, pbin, 0)[0][0], "Count");
  plain.label(d => `#${d.w}`);
  plain._preDraw();
  assert.strictEqual(matrixTooltipTitle(plain, pctx, p, 0), "#1");
});
