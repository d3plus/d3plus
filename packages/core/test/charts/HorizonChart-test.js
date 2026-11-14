import {it} from "vitest";
import assert from "assert";
import {colorDefaults, colorRamp, colorRampDark} from "@d3plus/color";
import {useJsdom} from "~test/jsdom.js";
import HorizonChart, {
  bandCount,
  horizonChartDef,
  measureBands,
  rowLabelOpacity,
  shareHorizonScales,
} from "../../src/charts/HorizonChart/index.ts";
import {
  applyRowDomain,
  rowDomain,
} from "../../src/charts/HorizonChart/measure.ts";
import {
  hintKey,
  labelAnchor,
  rowChange,
  rowHidden,
  rowHints,
  rowLabelTabStop,
  rowToggle,
} from "../../src/charts/HorizonChart/rowFilter.ts";
import {
  horizonBandSize,
  niceCeil,
  horizonSlices,
} from "../../src/charts/HorizonChart/horizonBands.ts";
import {horizonPalette} from "../../src/charts/HorizonChart/horizonColors.ts";
import {
  HORIZON_ROW,
  horizonEmit,
  horizonRowBox,
  horizonSlicePath,
} from "../../src/charts/HorizonChart/emit.ts";
import {
  horizonHitRows,
  resolveHorizonHover,
} from "../../src/charts/HorizonChart/hover.ts";
import {
  HORIZON_BAND,
  bandKeyRows,
  bandLabel,
  bandMeta,
  horizonState,
  rowValue,
  seriesId,
  userRow,
  valueColor,
  valueFormat,
} from "../../src/charts/HorizonChart/state.ts";
import {resolveTheme} from "../../src/utils/theme.ts";

useJsdom();

/** A slice's points rounded to 1e-9, so float noise doesn't fail a match. */
const rounded = slice =>
  slice.points.map(p => p.map(n => Math.round(n * 1e9) / 1e9));
const third = Math.round((10 / 3) * 1e9) / 1e9;
const twoThirds = Math.round((20 / 3) * 1e9) / 1e9;

it("niceCeil: the next 1, 2, 2.5, or 5 times a power of ten", () => {
  const cases = [
    [1, 1],
    [1.2, 2],
    [2, 2],
    [2.1, 2.5],
    [2.6, 5],
    [5, 5],
    [5.01, 10],
    [9.9, 10],
    [13.7, 20],
    [31.9, 50],
    [0.3, 0.5],
    [0.24, 0.25],
    [1380, 2000],
    [0.000137, 0.0002],
  ];
  cases.forEach(([value, nice]) =>
    assert.ok(
      Math.abs(niceCeil(value) - nice) < nice * 1e-9,
      `${value} → ${niceCeil(value)}, not ${nice}`,
    ),
  );
  assert.strictEqual(niceCeil((0.1 + 0.2) / 0.1 / 10), 0.5, "float noise");
  assert.strictEqual(niceCeil(0.3 / 0.1), 5, "3 rounds up to 5");
  assert.strictEqual(niceCeil(0), 0);
  assert.strictEqual(niceCeil(-4), 0);
  assert.strictEqual(niceCeil(NaN), 0);
  assert.strictEqual(niceCeil(Infinity), 0);
});

it("horizonBandSize: the largest absolute value over the band count, rounded up nicely", () => {
  assert.strictEqual(horizonBandSize([1, -9, 6], 3), 5);
  assert.strictEqual(horizonBandSize([2, NaN, Infinity, 4], 2), 2);
  assert.strictEqual(horizonBandSize([41, 12], 3), 20);
  assert.strictEqual(horizonBandSize([75], 3), 25, "the key reads 25 – 50");
  assert.strictEqual(horizonBandSize([0, 0], 3), 0, "nothing to draw");
  assert.strictEqual(horizonBandSize([], 3), 0);
  assert.strictEqual(horizonBandSize([5], 0), 0, "no bands");
  assert.strictEqual(horizonBandSize([6], 2.7), 5, "whole bands");
});

it("horizonSlices: a rising series fills each band in turn", () => {
  const slices = horizonSlices(
    [
      [0, 0],
      [10, 30],
    ],
    3,
    10,
  );
  assert.deepStrictEqual(
    slices.map(s => [s.sign, s.band]),
    [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  );
  // Crossings at 10 and 20 are inserted, so each band runs straight.
  const [b0, b1, b2] = slices;
  assert.deepStrictEqual(rounded(b0), [
    [0, 0],
    [third, 1],
    [twoThirds, 1],
    [10, 1],
  ]);
  assert.deepStrictEqual(rounded(b1), [
    [third, 0],
    [twoThirds, 1],
    [10, 1],
  ]);
  assert.deepStrictEqual(rounded(b2), [
    [twoThirds, 0],
    [10, 1],
  ]);
});

it("horizonSlices: negatives are mirrored into bands of their own", () => {
  const slices = horizonSlices(
    [
      [0, 5],
      [10, -15],
    ],
    2,
    10,
  );
  const pos = slices.filter(s => s.sign === 1);
  const neg = slices.filter(s => s.sign === -1);
  assert.strictEqual(pos.length, 1);
  assert.deepStrictEqual(pos[0].points, [
    [0, 0.5],
    [2.5, 0],
  ]);
  assert.deepStrictEqual(
    neg.map(s => s.band),
    [0, 1],
  );
  // Zero crossing at x 2.5, the -10 edge at x 7.5.
  assert.deepStrictEqual(neg[0].points, [
    [2.5, 0],
    [7.5, 1],
    [10, 1],
  ]);
  assert.deepStrictEqual(neg[1].points, [
    [7.5, 0],
    [10, 0.5],
  ]);
});

it("horizonSlices: values past the top band fill it, flat runs make no crossings", () => {
  const [top] = horizonSlices(
    [
      [0, 50],
      [1, 50],
    ],
    1,
    10,
  );
  assert.deepStrictEqual(top.points, [
    [0, 1],
    [1, 1],
  ]);
});

it("horizonSlices: gaps break runs, and lone points draw nothing", () => {
  const slices = horizonSlices(
    [
      [0, 4],
      [1, 6],
      [2, NaN],
      [3, 8],
      [4, null],
      [5, 2],
      [6, 2],
    ],
    1,
    10,
  );
  assert.strictEqual(slices.length, 2, "two runs of two points");
  assert.deepStrictEqual(
    slices.map(s => s.points.map(p => p[0])),
    [
      [0, 1],
      [5, 6],
    ],
  );
  assert.deepStrictEqual(horizonSlices([[0, 1]], 3, 1), []);
  assert.deepStrictEqual(
    horizonSlices(
      [
        [0, 1],
        [1, 2],
      ],
      3,
      0,
    ),
    [],
    "no band size",
  );
});

it("horizonSlices: a band trims to one zero point either side of where it holds values", () => {
  const [, band1] = horizonSlices(
    [
      [0, 1],
      [1, 2],
      [2, 15],
      [3, 2],
      [4, 1],
    ],
    2,
    10,
  );
  assert.strictEqual(band1.band, 1);
  const xs = band1.points.map(p => p[0]);
  assert.ok(xs[0] > 1 && xs[0] < 2, "starts at the 10 crossing");
  assert.ok(xs[xs.length - 1] > 2 && xs[xs.length - 1] < 3);
  assert.strictEqual(band1.points[0][1], 0);
  assert.strictEqual(band1.points[band1.points.length - 1][1], 0);
});

it("horizonPalette: theme colorScale poles, ramped low to high", () => {
  const light = horizonPalette(undefined, 3, undefined);
  assert.deepStrictEqual(
    light.positive,
    colorRamp(colorDefaults.sequential, 3, {ordinal: true}),
  );
  assert.deepStrictEqual(
    light.negative,
    colorRamp(colorDefaults.off, 3, {ordinal: true}),
  );
  const dark = resolveTheme("dark");
  const night = horizonPalette(dark, 2, undefined);
  assert.deepStrictEqual(
    night.positive,
    colorRampDark(dark.colorScale.max, 2, {
      background: dark.background,
      ordinal: true,
    }),
  );
  assert.deepStrictEqual(
    night.negative,
    colorRampDark(dark.colorScale.min, 2, {
      background: dark.background,
      ordinal: true,
    }),
  );
});

it("horizonPalette: colors override either sign with a base or a list", () => {
  const p = horizonPalette(undefined, 3, {
    positive: "#e8590c",
    negative: ["#aaa", "#555"],
  });
  assert.deepStrictEqual(p.positive, colorRamp("#e8590c", 3, {ordinal: true}));
  assert.deepStrictEqual(
    p.negative,
    ["#aaa", "#555", "#555"],
    "the last repeats",
  );
  const empty = horizonPalette(undefined, 1, {positive: [], negative: ""});
  assert.deepStrictEqual(empty.positive, [colorDefaults.sequential]);
  assert.deepStrictEqual(empty.negative, [colorDefaults.off]);
});

it("horizonRowBox: rows split the step, gap capped at half a row", () => {
  assert.deepStrictEqual(horizonRowBox(50, 20, 2), {top: 41, bottom: 59});
  assert.deepStrictEqual(horizonRowBox(50, 20, 40), {top: 45, bottom: 55});
  assert.deepStrictEqual(horizonRowBox(50, 20, -3), {top: 40, bottom: 60});
});

it("horizonSlicePath: the topline over the row's baseline", () => {
  const d = horizonSlicePath(
    {
      band: 0,
      sign: 1,
      points: [
        [0, 0],
        [5, 1],
        [10, 0.5],
      ],
    },
    {top: 10, bottom: 30},
  );
  assert.strictEqual(d, "M0,30L0,30L5,10L10,20L10,30Z");
});

/** A chart with the state `measureBands` reads, over `rows`. */
function measured(rows, configure = v => v) {
  const viz = configure(
    new HorizonChart().data(rows).groupBy("id").x("x").y("v"),
  );
  viz._data = rows;
  viz._filteredData = rows;
  viz._drawDepth = 0;
  viz._ids = d => [d.id];
  viz._id = d => d.id;
  viz._drawLabel = d => `Series ${d.id}`;
  measureBands(viz);
  return viz;
}

const rows = [
  {id: "a", x: 1, v: 3},
  {id: "a", x: 2, v: 9},
  {id: "b", x: 1, v: -6},
  {id: "b", x: 2, v: null},
];

it("HorizonChart defaults and the y accessor it takes over", () => {
  const viz = new HorizonChart();
  assert.strictEqual(viz.bands(), 3);
  assert.strictEqual(viz.bandSize(), undefined);
  assert.strictEqual(viz.colors(), undefined);
  assert.strictEqual(viz.rowGap(), 1);
  assert.strictEqual(viz.discrete(), "x");
  assert.strictEqual(viz.shape()(), "Area");
  assert.strictEqual(viz._crosshairFullSpan, true);
  assert.strictEqual(horizonChartDef.name, "HorizonChart");
  assert.strictEqual(horizonChartDef.facet.aspect, 2);
  assert.deepStrictEqual(horizonChartDef.facet.axes, {y: "all"});

  assert.strictEqual(viz.y("v"), viz, "setter chains");
  assert.strictEqual(viz.y()({v: 4}), 4, "y reads the value");
  viz.y(d => d.w * 2);
  assert.strictEqual(viz.y()({w: 4}), 8);
  viz.config({y: "v"});
  assert.strictEqual(viz.y()({v: 7}), 7, "config sets it too");
  viz._ids = d => [d.id];
  viz._drawDepth = 0;
  assert.strictEqual(viz._y({id: "a", v: 7}, 0), "a", "_y places the row");
});

it("bandCount: whole bands, at least one", () => {
  const viz = new HorizonChart();
  assert.strictEqual(bandCount(viz.bands(4.6)), 4);
  assert.strictEqual(bandCount(viz.bands(0)), 1);
  assert.strictEqual(bandCount(viz.bands("x")), 1);
});

it("measureBands: series order and labels, shared band size, signs, the band key", () => {
  const viz = measured(rows);
  const state = horizonState(viz);
  assert.deepStrictEqual(
    [...state.order],
    [
      ["a", 0],
      ["b", 1],
    ],
  );
  assert.deepStrictEqual(
    [...state.labels],
    [
      ["a", "Series a"],
      ["b", "Series b"],
    ],
  );
  assert.strictEqual(state.size, 5, "9 / 3 rounded up");
  assert.deepStrictEqual(state.signs, {positive: true, negative: true});
  assert.strictEqual(state.palette.positive.length, 3);
  assert.strictEqual(viz._legendData.length, 6);
  assert.deepStrictEqual(
    viz._legendData.map(d => bandMeta(d).range),
    [
      [-15, -10],
      [-10, -5],
      [-5, -0],
      [0, 5],
      [5, 10],
      [10, 15],
    ],
  );

  const fixed = measured(rows, v => v.bandSize(4.5).bands(2));
  assert.strictEqual(horizonState(fixed).size, 4.5, "bandSize wins, unrounded");
  assert.strictEqual(fixed._legendData.length, 4);

  const positive = measured(rows.slice(0, 2));
  assert.deepStrictEqual(horizonState(positive).signs, {
    positive: true,
    negative: false,
  });
  assert.strictEqual(positive._legendData.length, 3, "no negative bands");
});

it("state helpers: series ids, rows, values, band meta, colors, labels", () => {
  const viz = measured(rows, v => v.bandSize(3));
  const state = horizonState(viz);
  assert.strictEqual(seriesId(viz, {id: "b"}, 0), "b");
  assert.strictEqual(seriesId({}, {id: "b"}, 0), "", "before pre-draw");
  const row = {id: "a", v: 2};
  const wrapped = {__d3plus__: true, data: {__d3plus__: true, data: row}};
  assert.strictEqual(userRow(wrapped), row);
  assert.strictEqual(rowValue(viz, wrapped, 0), 2);
  assert.ok(Number.isNaN(rowValue(viz, {v: null}, 0)));
  assert.ok(Number.isNaN(rowValue(viz, {v: ""}, 0)));
  assert.ok(Number.isNaN(rowValue(viz, {}, 0)));

  const meta = {band: 1, sign: 1, range: [3, 6], color: "red"};
  assert.strictEqual(bandMeta({[HORIZON_BAND]: meta}), meta);
  assert.strictEqual(
    bandMeta({__d3plus__: true, data: {[HORIZON_BAND]: meta}}),
    meta,
  );
  assert.strictEqual(bandMeta({id: "a"}), undefined);
  assert.strictEqual(bandMeta(undefined), undefined);

  assert.strictEqual(valueColor(state, 2), state.palette.positive[0]);
  assert.strictEqual(valueColor(state, 3), state.palette.positive[0]);
  assert.strictEqual(valueColor(state, 3.1), state.palette.positive[1]);
  assert.strictEqual(valueColor(state, 99), state.palette.positive[2]);
  assert.strictEqual(valueColor(state, -7), state.palette.negative[2]);
  assert.strictEqual(valueColor(state, 0), undefined);
  assert.strictEqual(valueColor(state, NaN), undefined);
  assert.strictEqual(valueColor({...state, size: 0}, 3), undefined);

  assert.strictEqual(bandLabel(meta, valueFormat(viz)), "3 – 6");
  assert.strictEqual(valueFormat(viz)(1500), "1.5k");
  assert.deepStrictEqual(bandKeyRows({...state, size: 0}, 3), []);
});

/** A HorizonChart emit context over two series rows on a 100px-tall plot. */
function emitContext(viz) {
  const wrap = (d, i) => ({
    __d3plus__: true,
    data: d,
    i,
    id: d.id,
    x: d.x,
    y: d.id,
  });
  const values = rows.map(wrap);
  const yPos = {a: 25, b: 75};
  return {
    viz,
    values,
    x: v => v * 100,
    y: c => yPos[c],
    xRange: [100, 200],
    yRange: [0, 100],
    yDomain: ["a", "b"],
  };
}

it("horizonEmit: a transparent row per series under its band polygons", () => {
  const viz = measured(rows, v => v.rowGap(4).bandSize(3));
  const nodes = horizonEmit(emitContext(viz), "Area");
  const row = nodes.filter(n => `${n.key}`.startsWith(HORIZON_ROW));
  assert.deepStrictEqual(
    row.map(n => [n.key, n.y, n.height, n.paint.fill]),
    [
      ["horizon-row-a", 2, 46, "transparent"],
      ["horizon-row-b", 52, 46, "transparent"],
    ],
  );
  assert.deepStrictEqual(
    row[0].interactionPoints.map(p => [p.x, p.y, p.datum.data.v]),
    [
      [100, 25, 3],
      [200, 25, 9],
    ],
  );
  assert.strictEqual(
    row[1].interactionPoints.length,
    1,
    "a missing value has no point",
  );
  assert.strictEqual(row[0].aria.label, "Series a");

  const bands = nodes.filter(n => n.type === "path");
  assert.deepStrictEqual(
    bands.map(n => n.key),
    ["horizon-a-p0", "horizon-a-p1", "horizon-a-p2"],
    "b's lone point draws nothing",
  );
  bands.forEach((n, band) => {
    assert.strictEqual(n.interactive, false);
    assert.strictEqual(n.aria.hidden, true);
    assert.strictEqual(n.paint.fill, horizonState(viz).palette.positive[band]);
    assert.strictEqual(bandMeta(n.datum).band, band);
    assert.strictEqual(n.datum.id, "a");
    assert.ok(n.enterD, "grows from the baseline");
  });
});

it("horizonHitRows and resolveHorizonHover: every row at the nearest x", () => {
  const viz = measured(rows);
  const scene = [
    {type: "group", key: "g", children: horizonEmit(emitContext(viz))},
  ];
  const hit = horizonHitRows(scene);
  assert.deepStrictEqual(
    hit.map(r => [r.id, r.label, r.top, r.bottom, r.points.length]),
    [
      ["a", "Series a", 0.5, 49.5, 2],
      ["b", "Series b", 50.5, 99.5, 1],
    ],
  );

  const shared = resolveHorizonHover(viz, hit, [110, 10], true);
  assert.strictEqual(shared.px, 100);
  assert.strictEqual(shared.value, 1);
  assert.deepStrictEqual(
    shared.rows.map(r => [r.id, r.value]),
    [
      ["a", 3],
      ["b", -6],
    ],
  );
  const later = resolveHorizonHover(viz, hit, [190, 10], true);
  assert.deepStrictEqual(
    later.rows.map(r => r.id),
    ["a"],
    "b has no value at x 2",
  );
  const single = resolveHorizonHover(viz, hit, [110, 80], false);
  assert.deepStrictEqual(
    single.rows.map(r => r.id),
    ["b"],
    "only the row under the pointer",
  );
  viz.tooltip(false);
  assert.strictEqual(resolveHorizonHover(viz, hit, [110, 10], true), null);
  assert.strictEqual(resolveHorizonHover(viz, [], [0, 0], true), null);
});

it("shareHorizonScales: panels share x but keep their own rows", () => {
  const viz = new HorizonChart().groupBy("id").x("x").y("v");
  viz._ids = d => [d.id];
  viz._drawDepth = 0;
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = rows;
  viz.schema.width = 400;
  viz.schema.height = 300;
  viz.schema.ySort = horizonState(viz).sort;
  const shared = shareHorizonScales(viz, [rows.slice(0, 2), rows.slice(2)]);
  assert.ok(shared.domains.x, "x is shared");
  assert.strictEqual(shared.domains.y, undefined);
  assert.strictEqual(shared.padded.y, undefined);
});

it("measureBands: all the data sets the rows and band size, whatever is filtered out", () => {
  const viz = measured(rows);
  // Only "a" in the current timeline period, "b" hidden: both still count.
  viz._filteredData = rows.slice(0, 1);
  viz._hidden = ["b"];
  measureBands(viz);
  const state = horizonState(viz);
  assert.deepStrictEqual([...state.order.keys()], ["a", "b"]);
  assert.strictEqual(state.size, 5);
  assert.deepStrictEqual(state.signs, {positive: true, negative: true});
  assert.strictEqual(state.first.get("b"), rows[2]);

  // Rows at one x roll up, as the chart draws them.
  const twice = measured([...rows, {id: "a", x: 2, v: 9}]);
  assert.strictEqual(horizonState(twice).size, 10, "18 / 3 rounded up");
});

it("rowDomain and applyRowDomain: every row, or a panel's, unless the user sets a domain", () => {
  const data = [
    {id: "a", p: "one", x: 1, v: 1},
    {id: "b", p: "two", x: 1, v: 2},
    {id: "c", p: "one", x: 1, v: 3},
  ];
  const viz = measured(data, v => v.facet("p"));
  assert.deepStrictEqual(rowDomain(viz), ["a", "b", "c"]);
  assert.deepStrictEqual(rowDomain(viz, "one"), ["a", "c"]);
  assert.deepStrictEqual(rowDomain(viz, "three"), []);

  applyRowDomain(viz);
  assert.deepStrictEqual(viz._yConfig.domain, ["a", "b", "c"]);
  viz._facetStep = "panel";
  viz._filteredData = [data[1]];
  applyRowDomain(viz);
  assert.deepStrictEqual(viz._yConfig.domain, ["b"], "the panel's own rows");
  viz._yConfig.domain = ["c", "a"];
  applyRowDomain(viz);
  assert.deepStrictEqual(viz._yConfig.domain, ["c", "a"], "the user's wins");
});

it("rowToggle: hide, show, and solo by the legend's rules", () => {
  const none = {hidden: [], solo: []};
  assert.deepStrictEqual(rowToggle(none, "a", false, 3), {
    hidden: ["a"],
    solo: [],
  });
  assert.deepStrictEqual(
    rowToggle({hidden: ["a"], solo: []}, "a", false, 3),
    none,
    "a hidden row shows again",
  );
  assert.deepStrictEqual(
    rowToggle({hidden: ["a", "b"], solo: []}, "c", false, 3),
    none,
    "hiding every row shows them all",
  );
  assert.deepStrictEqual(rowToggle(none, "b", true, 3), {
    hidden: [],
    solo: ["b"],
  });
  assert.strictEqual(
    rowToggle({hidden: [], solo: ["b"]}, "b", true, 3),
    null,
    "Shift+click on the solo'd row changes nothing",
  );
  assert.deepStrictEqual(
    rowToggle({hidden: [], solo: ["b"]}, "b", false, 3),
    none,
    "a click on the solo'd row shows all",
  );
  assert.deepStrictEqual(rowToggle({hidden: [], solo: ["b"]}, "a", false, 3), {
    hidden: [],
    solo: ["b", "a"],
  });
  assert.deepStrictEqual(
    rowToggle({hidden: [], solo: ["b", "a"]}, "c", false, 3),
    none,
    "soloing every row shows them all",
  );
  // legendFilterInvert: a click solos, Shift+click hides.
  assert.deepStrictEqual(rowToggle(none, "a", false, 3, true), {
    hidden: [],
    solo: ["a"],
  });
  assert.deepStrictEqual(
    rowToggle({hidden: [], solo: ["a"]}, "a", false, 3, true),
    none,
  );
  assert.deepStrictEqual(rowToggle(none, "a", true, 3, true), {
    hidden: ["a"],
    solo: [],
  });
  assert.deepStrictEqual(
    rowToggle({hidden: [], solo: ["a"]}, "a", true, 3, true),
    none,
  );
  assert.strictEqual(
    rowToggle({hidden: [], solo: ["a"]}, "b", true, 3, true),
    null,
  );
});

it("rowHidden and rowLabelOpacity: a hidden or un-solo'd row's label dims", () => {
  const viz = measured(rows);
  viz._hidden = [];
  viz._solo = [];
  assert.strictEqual(rowHidden(viz, "a"), false);
  assert.strictEqual(rowLabelOpacity(viz, {data: {id: "a"}}), 1);
  viz._hidden = ["a"];
  assert.strictEqual(rowHidden(viz, "a"), true);
  assert.strictEqual(rowLabelOpacity(viz, {data: {id: "a"}}), 0.4);
  assert.strictEqual(rowLabelOpacity(viz, {id: "a"}), 0.4, "a bare tick");
  viz._hidden = [];
  viz._solo = ["b"];
  assert.strictEqual(rowHidden(viz, "a"), true);
  assert.strictEqual(rowHidden(viz, "b"), false);
  assert.strictEqual(rowHidden(viz, "nope"), false, "an unknown series");
});

it("rowLabelTabStop: the y axis's row labels, named for what Enter does", () => {
  const viz = measured(rows);
  viz._hidden = [];
  viz._solo = [];
  viz.schema.legendFilterInvert = () => false;
  const test = rowLabelTabStop(viz);
  const label = id => ({
    type: "text",
    key: `${id}_0`,
    datum: {data: {id, tick: id}},
  });
  const yAxis = [{type: "group", key: "p/plot-y-axis", children: []}];
  const xAxis = [{type: "group", key: "plot-x-axis", children: []}];
  assert.strictEqual(test(label("a"), yAxis), "Series a, Enter to Hide");
  viz._hidden = ["a"];
  assert.strictEqual(test(label("a"), yAxis), "Series a, Enter to Show");
  assert.strictEqual(test(label("a"), xAxis), undefined, "not on the x axis");
  assert.strictEqual(test(label("zzz"), yAxis), undefined, "not a series");
  assert.strictEqual(
    test({...label("a"), type: "rect"}, yAxis),
    undefined,
    "text only",
  );
});

it("labelAnchor: a zero-width anchor on the label's right edge, opening right", () => {
  const viz = {
    _select: {
      node: () => ({getBoundingClientRect: () => ({left: 100, top: 50})}),
    },
  };
  const anchor = labelAnchor(viz, {x: 10, y: 20, width: 30, height: 12});
  assert.strictEqual(anchor.placement, "right");
  assert.deepStrictEqual(anchor.getBoundingClientRect(), {
    x: 140,
    y: 70,
    left: 140,
    right: 140,
    top: 70,
    bottom: 82,
    width: 0,
    height: 12,
  });
  assert.strictEqual(
    labelAnchor({}, {x: 5, y: 6, width: 1, height: 2}).getBoundingClientRect()
      .left,
    6,
  );
});

it("hintKey: the keyboard's Enter wording for a click hint", () => {
  assert.strictEqual(hintKey("Click to Hide", true), "Enter to Hide");
  assert.strictEqual(
    hintKey("Shift+Click to Highlight", true),
    "Shift+Enter to Highlight",
  );
  assert.strictEqual(hintKey("Click to Show All", true), "Enter to Show All");
  assert.strictEqual(hintKey("Click to Hide", false), "Click to Hide");
});

it("rowHints: the legend's hints, by mouse or keyboard, translated", () => {
  const viz = measured(rows);
  viz._hidden = [];
  viz._solo = [];
  viz.schema.legendFilterInvert = () => false;
  assert.strictEqual(
    rowHints(viz, "a"),
    "Click to Hide<br />Shift+Click to Highlight",
  );
  assert.strictEqual(
    rowHints(viz, "a", true),
    "Enter to Hide<br />Shift+Enter to Highlight",
  );
  viz._hidden = ["a"];
  assert.strictEqual(
    rowHints(viz, "a", true),
    "Enter to Show<br />Shift+Enter to Highlight",
  );
  viz._hidden = [];
  viz._solo = ["a"];
  assert.strictEqual(rowHints(viz, "a", true), "Enter to Show All");
  viz._solo = [];
  viz.schema.legendFilterInvert = () => true;
  assert.strictEqual(
    rowHints(viz, "a", true),
    "Enter to Highlight<br />Shift+Enter to Hide",
  );
  viz.schema.legendFilterInvert = () => false;
  viz.locale("es-ES");
  assert.strictEqual(
    rowHints(viz, "a", true),
    "Enter para Ocultar<br />May\u00fas+Enter para Resaltar",
  );
  assert.strictEqual(viz.schema.translate("hidden"), "oculto");
});

it("rowChange: what a row label click did", () => {
  assert.strictEqual(rowChange({hidden: ["a"], solo: []}, "a"), "hidden");
  assert.strictEqual(rowChange({hidden: [], solo: ["a"]}, "a"), "highlighted");
  assert.strictEqual(rowChange({hidden: ["b"], solo: []}, "a"), "shown");
  assert.strictEqual(rowChange({hidden: [], solo: []}, "a"), "shown");
});
