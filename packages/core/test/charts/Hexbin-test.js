import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Hexbin, Plot} from "../../index.ts";
import {
  BIN_SIZE,
  binArea,
  binBounds,
  binMeasure,
  binPath,
  binPoints,
  binRows,
  computeFilteredData,
  contourLevels,
  contourPath,
  contourRows,
  densityContours,
  HEXBIN_META,
  HEXBIN_SHAPE,
  hexbinDef,
  hexbinMeta,
  hexbinRow,
  hexbinSettings,
  hexbinValue,
  keepNumericRows,
  resolveBinValue,
  unwrapHexbinRow,
  vizPreDraw,
} from "../../internal.ts";

useJsdom();

const pt = (x, y, weight) => ({x, y, row: {x, y}, weight});
const count = bins =>
  Object.fromEntries(bins.map(b => [b.key, b.points.length]));

it("Hexbin — a Plot of observations drawn as bins, with a colorScale and no legend", () => {
  const viz = new Hexbin();
  assert.ok(viz instanceof Plot);
  assert.strictEqual(hexbinDef.name, "Hexbin");
  assert.strictEqual(viz.shape()({}, 0), HEXBIN_SHAPE);
  assert.strictEqual(viz.binShape(), "hex");
  assert.strictEqual(viz.binSize(), BIN_SIZE);
  assert.strictEqual(viz.binValue(), "count");
  assert.strictEqual(viz.contours(), false);
  assert.strictEqual(viz.points(), false);
  assert.strictEqual(viz.legend()(), false);
  assert.strictEqual(viz.colorScale(), hexbinValue);
  assert.deepStrictEqual(viz.contourConfig(), {
    bandwidth: 20,
    thresholds: 8,
    strokeWidth: 1.5,
    fillOpacity: 0.8,
  });
  assert.strictEqual(
    viz.colorScaleConfig().scale,
    "linear",
    "a continuous colorScale",
  );
  assert.deepStrictEqual(viz.colorScaleConfig().axisConfig, {
    rounding: "inside",
  });
  assert.strictEqual(
    new Hexbin().colorScaleConfig({scale: "jenks"}).colorScaleConfig().scale,
    "jenks",
    "a user scale wins",
  );
  viz.contourConfig({bandwidth: 10});
  assert.strictEqual(viz.contourConfig().bandwidth, 10, "merges");
  assert.strictEqual(viz.contourConfig().thresholds, 8);
});

it("binPoints: hexagons hold the points nearest their centers", () => {
  // Radius 10: centers sit √3·10 ≈ 17.3px apart in a row, rows 15px apart.
  const bins = binPoints(
    [pt(0, 0), pt(2, 1), pt(17, 0), pt(9, 15), pt(-1, -2)],
    {shape: "hex", size: 10},
  );
  assert.deepStrictEqual(count(bins), {h0_0: 3, h2_0: 1, h1_1: 1});
  const first = bins.find(b => b.key === "h0_0");
  assert.deepStrictEqual([first.cx, first.cy], [0, 0]);
});

it("binPoints: squares, anchored at the origin, skip points without coordinates", () => {
  const bins = binPoints(
    [pt(5, 5), pt(9, 1), pt(10, 0), pt(25, 31), pt(NaN, 3), pt(4, Infinity)],
    {shape: "square", size: 10, origin: [0, 0]},
  );
  assert.deepStrictEqual(count(bins), {s0_0: 2, s1_0: 1, s2_3: 1});
  const shifted = binPoints([pt(5, 5), pt(9, 1)], {
    shape: "square",
    size: 10,
    origin: [6, 0],
  });
  assert.deepStrictEqual(count(shifted), {"s-1_0": 1, s0_0: 1});
  assert.deepStrictEqual(
    [shifted[0].cx, shifted[0].cy],
    [1, 5],
    "centers follow the origin",
  );
});

it("binPoints: only bins holding a point, and none without points or size", () => {
  const bins = binPoints([pt(0, 0), pt(100, 100)], {shape: "hex", size: 5});
  assert.strictEqual(bins.length, 2, "the empty bins between are left out");
  assert.deepStrictEqual(binPoints([], {shape: "hex", size: 5}), []);
  assert.deepStrictEqual(binPoints([pt(1, 1)], {shape: "hex", size: 0}), []);
});

it("binBounds / binPath / binArea: a bin's box, outline and area", () => {
  assert.deepStrictEqual(binBounds({cx: 10, cy: 20}, "square", 4), {
    x0: 8,
    x1: 12,
    y0: 18,
    y1: 22,
  });
  const hex = binBounds({cx: 0, cy: 0}, "hex", 10);
  assert.ok(Math.abs(hex.x1 - 5 * Math.sqrt(3)) < 1e-9);
  assert.deepStrictEqual([hex.y0, hex.y1], [-10, 10]);
  assert.strictEqual(binPath({cx: 10, cy: 20}, "square", 4), "M8,18H12V22H8Z");
  assert.strictEqual(
    binPath({cx: 0, cy: 0}, "hex", 10),
    "M0,-10L8.66,-5L8.66,5L0,10L-8.66,5L-8.66,-5Z",
  );
  assert.strictEqual(binArea("square", 4), 16);
  assert.ok(Math.abs(binArea("hex", 10) - 259.8076) < 1e-3);
});

it("binMeasure: counts, sums and means finite weights", () => {
  const points = [pt(0, 0, 2), pt(0, 0, 4), pt(0, 0, "x"), pt(0, 0)];
  assert.strictEqual(binMeasure(points, "count"), 4);
  assert.strictEqual(binMeasure(points, "sum"), 6);
  assert.strictEqual(binMeasure(points, "mean"), 3);
  assert.ok(Number.isNaN(binMeasure([pt(0, 0)], "mean")));
  assert.strictEqual(binMeasure([pt(0, 0)], "sum"), 0);
});

it("binRows: one row per bin, with its measure, data bounds and points", () => {
  const bins = binPoints([pt(5, 5, 1), pt(6, 6, 3), pt(25, 5)], {
    shape: "square",
    size: 10,
  });
  const invert = {x: px => px / 10, y: px => 100 - px};
  const rows = binRows(bins, {shape: "square", size: 10, agg: "count"}, invert);
  assert.deepStrictEqual(
    rows.map(r => r.id),
    ["bin-s0_0", "bin-s2_0"],
  );
  const meta = hexbinMeta(rows[0]);
  assert.strictEqual(meta.kind, "bin");
  assert.strictEqual(meta.count, 2);
  assert.strictEqual(meta.value, 2);
  assert.deepStrictEqual(
    [meta.x0, meta.x1, meta.y0, meta.y1],
    [0, 1, 90, 100],
    "bounds in data units, ascending",
  );
  assert.strictEqual(meta.path, "M0,0H10V10H0Z");
  assert.deepStrictEqual(meta.rows, [
    bins[0].points[0].row,
    bins[0].points[1].row,
  ]);
  const means = binRows(bins, {shape: "square", size: 10, agg: "mean"}, invert);
  assert.deepStrictEqual(
    means.map(r => hexbinValue(r)),
    [2],
    "a mean with nothing to average is left out",
  );
});

it("contourLevels: given levels above zero, or nice levels under the peak", () => {
  assert.deepStrictEqual(contourLevels(10, [5, 0, -1, 2]), [2, 5]);
  assert.deepStrictEqual(contourLevels(10, 5), [2, 4, 6, 8]);
  assert.deepStrictEqual(contourLevels(0, 5), []);
  assert.deepStrictEqual(contourLevels(10, 0), []);
});

it("contourPath: a MultiPolygon's rings as one shifted path", () => {
  assert.strictEqual(
    contourPath(
      [
        [
          [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
        ],
        [
          [
            [5, 5],
            [6, 5],
            [6, 6],
          ],
        ],
      ],
      [10, 20],
    ),
    "M10,20L11,20L11,21ZM15,25L16,25L16,26Z",
  );
  assert.strictEqual(contourPath([]), "");
});

it("densityContours: nested levels in points per bin, none for no points", () => {
  const points = [];
  for (let i = 0; i < 200; i++)
    points.push(pt(100 + ((i * 7) % 21) - 10, 80 + ((i * 11) % 21) - 10));
  const options = {
    left: 20,
    top: 10,
    width: 200,
    height: 160,
    bandwidth: 10,
    thresholds: 4,
    unit: 100,
  };
  const levels = densityContours(points, options);
  assert.ok(levels.length >= 2, `${levels.length} levels`);
  assert.deepStrictEqual(
    levels.map(l => l.level),
    [...levels.map(l => l.level)].sort((a, b) => a - b),
    "lowest first",
  );
  assert.ok(levels.every(l => l.path.startsWith("M")));
  // Shifted into the plot: the outline sits around (100, 80) + the origin.
  const xs = levels[0].path.match(/M([\d.]+)/)[1];
  assert.ok(+xs > 20, "shifted by left");
  const explicit = densityContours(points, {
    ...options,
    thresholds: [0.5, 1, 2],
  });
  assert.deepStrictEqual(
    explicit.map(l => l.level),
    [0.5, 1, 2],
  );
  assert.deepStrictEqual(densityContours([], options), []);
  assert.deepStrictEqual(
    densityContours([pt(NaN, 1)], options),
    [],
    "no placed points",
  );
  assert.deepStrictEqual(densityContours(points, {...options, width: 0}), []);
});

it("contourRows: one row per level, each knowing the next", () => {
  const points = [];
  for (let i = 0; i < 100; i++) points.push(pt(50 + (i % 10), 50 + (i % 7)));
  const rows = contourRows(
    points,
    {left: 0, top: 0, width: 100, height: 100},
    {
      shape: "hex",
      size: 10,
      agg: "count",
      contourConfig: {bandwidth: 8, thresholds: [1, 2, 3]},
    },
  );
  const metas = rows.map(hexbinMeta);
  assert.deepStrictEqual(
    metas.map(m => [m.kind, m.level, m.next, m.index, m.levels]),
    [
      ["contour", 1, 2, 0, 3],
      ["contour", 2, 3, 1, 3],
      ["contour", 3, undefined, 2, 3],
    ],
  );
  assert.deepStrictEqual(
    rows.map(r => r.id),
    ["contour-0", "contour-1", "contour-2"],
  );
});

it("hexbinRow / hexbinMeta / hexbinValue / unwrapHexbinRow", () => {
  const row = hexbinRow("bin-a", {kind: "bin", value: 7});
  assert.strictEqual(row.id, "bin-a");
  assert.deepStrictEqual(row[HEXBIN_META], {kind: "bin", value: 7});
  const wrapped = {__d3plus__: true, data: {__d3plus__: true, data: row}};
  assert.strictEqual(unwrapHexbinRow(wrapped), row);
  assert.strictEqual(hexbinMeta(wrapped).value, 7);
  assert.strictEqual(hexbinValue(wrapped), 7);
  assert.strictEqual(
    hexbinValue(hexbinRow("c", {kind: "contour", level: 3})),
    3,
  );
  assert.strictEqual(hexbinValue({x: 1}), undefined);
  assert.strictEqual(hexbinMeta(undefined), undefined);
});

it("resolveBinValue: a count, or a field's sum or mean", () => {
  const t = s => s;
  assert.deepStrictEqual(resolveBinValue("count", t), {
    agg: "count",
    measure: "Count",
  });
  assert.deepStrictEqual(resolveBinValue({value: 4}, t), {
    agg: "count",
    measure: "Count",
  });
  const sum = resolveBinValue({value: "sales"}, t);
  assert.strictEqual(sum.agg, "sum");
  assert.strictEqual(sum.measure, "Total sales");
  assert.strictEqual(sum.weight({sales: 3}), 3);
  const fn = d => d.v * 2;
  const mean = resolveBinValue({value: fn, agg: "mean"}, t);
  assert.deepStrictEqual([mean.agg, mean.measure], ["mean", "Mean"]);
  assert.strictEqual(mean.weight, fn);
  assert.strictEqual(
    resolveBinValue({value: "v", agg: "mean", label: "Avg"}, t).measure,
    "Avg",
  );
});

it("hexbinSettings: resolves the chart's options with defaults", () => {
  const viz = new Hexbin();
  let s = hexbinSettings(viz);
  assert.deepStrictEqual(
    [s.shape, s.size, s.agg, s.contours, s.points],
    ["hex", 12, "count", false, false],
  );
  viz
    .binShape("square")
    .binSize(-3)
    .contours(true)
    .points(true)
    .pointConfig({r: 3});
  s = hexbinSettings(viz);
  assert.deepStrictEqual(
    [s.shape, s.size, s.contours, s.points, s.pointConfig.r],
    ["square", 12, "lines", true, 3],
  );
  assert.strictEqual(s.pointConfig.fillOpacity, 0.35);
  viz.binShape(false).contours("filled");
  s = hexbinSettings(viz);
  assert.deepStrictEqual([s.shape, s.contours], [false, "filled"]);
});

it("keepNumericRows: rows without numeric x and y are skipped, the user's rows kept as the source", () => {
  const rows = [
    {x: 1, y: 2},
    {x: "a", y: 2},
    {x: 3, y: null},
    {x: 4, y: 5},
  ];
  const viz = new Hexbin().data(rows).x("x").y("y");
  keepNumericRows(viz);
  assert.deepStrictEqual(viz._data, [rows[0], rows[3]]);
  assert.strictEqual(viz._sourceData, rows);
  keepNumericRows(viz);
  assert.deepStrictEqual(viz._data, [rows[0], rows[3]], "stable on redraw");
  const clean = [{x: 1, y: 2}];
  viz.data(clean);
  keepNumericRows(viz);
  assert.strictEqual(viz._data, clean, "all numeric: the same array");
});

it("_unmergedShapes: the pipeline keeps a shape's rows one by one", () => {
  const rows = [
    {id: "a", x: 1, y: 1},
    {id: "a", x: 2, y: 2},
    {id: "b", x: 3, y: 3},
  ];
  const viz = new Hexbin().data(rows).x("x").y("y");
  vizPreDraw(viz);
  assert.strictEqual(viz._filteredData.length, 3);
  assert.strictEqual(viz._legendData.length, 2, "the legend still groups");
  viz._unmergedShapes = [];
  const out = {};
  computeFilteredData(viz, out, viz._drawDepth, viz._id, undefined);
  assert.strictEqual(out.filteredData.length, 2, "merged without the hook");
});
