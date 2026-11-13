import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {movingAverage} from "@d3plus/math";
import {
  computeTrendFits,
  fitRegression,
  resolveTrendType,
  trendDomainValues,
  trendLineDefaults,
  trendTypes,
} from "../../src/charts/Plot/trendLines.ts";
import {
  fitMovingAverage,
  movingAverageOptions,
  movingAverageSamples,
} from "../../src/charts/Plot/trendMovingAverage.ts";
import {
  movingAverageTooltipRows,
  nearestSample,
  trendTooltipRows,
  trendTypeNames,
} from "../../src/charts/Plot/trendTooltip.ts";
import {
  trendEquationLabel,
  trendLabelText,
} from "../../src/charts/Plot/trendLabels.ts";
import {emitTrendLines} from "../../src/charts/Plot/trendScene.ts";

useJsdom();

/**
    Moving-average trend lines: the config they read, their samples and
    bands, how they fit per series, across every point, and along stacks,
    and their tooltip, label, and scene.
*/

/** A minimal viz for the fit stage. */
function fakeViz(config = {}, schema = {}) {
  return {
    _trendLine: "movingAverage",
    _trendLineConfig: {...trendLineDefaults(), ...config},
    _drawDepth: 0,
    _ids: d => [d.id],
    _drawLabel: d => `Label ${d.id}`,
    _xConfig: {},
    _yConfig: {},
    schema: {
      discrete: undefined,
      stacked: false,
      shapeConfig: {fill: d => (d.id === "A" ? "red" : "blue")},
      translate: s => `T(${s})`,
      locale: "en-US",
      ...schema,
    },
  };
}

/** Formatted Plot rows from `[id, x, y]` triples. */
const rows = triples =>
  triples.map(([id, x, y], i) => ({data: {id}, i, id, x, y}));

const series = (id, values) => values.map((y, k) => [id, k + 1, y]);

const sampling = {axis: "x", fromNumber: n => n, logDep: false};

it("resolveTrendType and trendTypes include movingAverage", () => {
  assert.strictEqual(resolveTrendType("movingAverage"), "movingAverage");
  assert.ok(trendTypes.includes("movingAverage"));
  assert.strictEqual(trendTypeNames.movingAverage, "Moving Average");
});

it("trendLineDefaults: a trailing window of 5 with ±2σ bands", () => {
  const d = trendLineDefaults();
  assert.deepStrictEqual(
    [d.window, d.center, d.bands, d.bandDeviations],
    [5, false, true, 2],
  );
});

it("movingAverageOptions reads window, center, and the band width", () => {
  assert.deepStrictEqual(movingAverageOptions(trendLineDefaults()), {
    window: 5,
    center: false,
    deviations: 2,
  });
  assert.deepStrictEqual(
    movingAverageOptions({window: 3, center: true, bandDeviations: 1.5}),
    {window: 3, center: true, deviations: 1.5},
  );
  assert.strictEqual(
    movingAverageOptions({bands: false, bandDeviations: 3}).deviations,
    0,
    "bands off",
  );
  assert.strictEqual(
    movingAverageOptions({bandDeviations: "x"}).deviations,
    0,
    "a width that isn't a number draws none",
  );
  assert.deepStrictEqual(movingAverageOptions({}), {
    window: 5,
    center: false,
    deviations: 2,
  });
});

it("movingAverageSamples: a sample per full window, banded when the bands have width", () => {
  const points = [1, 2, 3, 4].map(x => [x, x * 10]);
  const fit = movingAverage(points, {window: 2});
  const samples = movingAverageSamples(fit, sampling);
  assert.deepStrictEqual(
    samples.map(s => [s.x, s.y, s.lci, s.hci]),
    [
      [2, 15, 5, 25],
      [3, 25, 15, 35],
      [4, 35, 25, 45],
    ],
  );
  const flat = movingAverage(points, {window: 2, deviations: 0});
  assert.strictEqual(movingAverageSamples(flat, sampling)[0].lci, undefined);
  const along = movingAverageSamples(fit, {
    axis: "y",
    fromNumber: n => `c${n}`,
    logDep: false,
  });
  assert.deepStrictEqual(
    [along[0].y, along[0].x],
    ["c2", 15],
    "a fit along y places the average on x",
  );
});

it("movingAverageSamples: a log axis drops points at or below 0, and bands that reach it", () => {
  const fit = movingAverage(
    [
      [1, -4],
      [2, 2],
      [3, 4],
      [4, 40],
    ],
    {window: 2},
  );
  const samples = movingAverageSamples(fit, {...sampling, logDep: true});
  assert.deepStrictEqual(
    samples.map(s => s.x),
    [3, 4],
    "the average at x = 2 is negative",
  );
  assert.ok(
    samples.every(s => s.lci === undefined),
    "a band below 0 can't draw on a log axis",
  );
});

it("fitMovingAverage: the average and its samples, or null without a full window", () => {
  const points = [1, 2, 3].map(x => [x, x]);
  const out = fitMovingAverage(points, {window: 3, bands: false}, sampling);
  assert.strictEqual(out.fit.type, "movingAverage");
  assert.deepStrictEqual(out.samples, [{x: 3, y: 2}]);
  assert.strictEqual(fitMovingAverage(points, {window: 4}, sampling), null);
});

it("fitRegression: samples a regression along its extent", () => {
  const out = fitRegression(
    [
      [0, 0],
      [2, 4],
    ],
    "linear",
    trendLineDefaults(),
    {...sampling, categories: [0, 1, 2], steps: []},
  );
  assert.strictEqual(out.fit.type, "linear");
  assert.deepStrictEqual(
    out.samples.map(s => [s.x, s.y]),
    [
      [0, 0],
      [1, 2],
      [2, 4],
    ],
  );
  assert.strictEqual(
    fitRegression(
      [[1, 1]],
      "linear",
      {},
      {
        ...sampling,
        categories: null,
        steps: [],
      },
    ),
    null,
  );
});

it("computeTrendFits: a moving average per series, in its color, with bands", () => {
  const data = rows([
    ...series("A", [1, 3, 5, 7, 9, 11]),
    ...series("B", [10, 10, 10, 10, 10, 10]),
  ]);
  const fits = computeTrendFits(fakeViz({window: 3}), data, [1, 2, 3, 4, 5, 6]);
  assert.deepStrictEqual(
    fits.map(f => [f.id, f.color, f.fit.type]),
    [
      ["A", "red", "movingAverage"],
      ["B", "blue", "movingAverage"],
    ],
  );
  assert.deepStrictEqual(
    fits[0].samples.map(s => [s.x, s.y]),
    [
      [3, 3],
      [4, 5],
      [5, 7],
      [6, 9],
    ],
    "the first window − 1 points have no average",
  );
  assert.ok(
    fits[0].samples.every(s => s.hci - s.lci > 0),
    "banded",
  );
  assert.ok(
    fits[1].samples.every(s => s.lci === 10 && s.hci === 10),
    "a flat series has no spread",
  );
  assert.ok(
    trendDomainValues(fits).includes(fits[0].samples[0].hci),
    "the bands widen the axis",
  );
});

it("computeTrendFits: center, bands off, and a window too wide to fit", () => {
  const data = rows(series("A", [1, 3, 5, 7, 9]));
  const [centered] = computeTrendFits(
    fakeViz({window: 3, center: true, bands: false}),
    data,
    [1, 2, 3, 4, 5],
  );
  assert.deepStrictEqual(
    centered.samples.map(s => [s.x, s.y, s.lci]),
    [
      [2, 3, undefined],
      [3, 5, undefined],
      [4, 7, undefined],
    ],
  );
  assert.deepStrictEqual(
    computeTrendFits(fakeViz({window: 9}), data, [1, 2, 3, 4, 5]),
    [],
  );
});

it("computeTrendFits: group 'all' averages the series at each position; stacks average their totals", () => {
  const data = rows([...series("A", [2, 4, 6]), ...series("B", [4, 6, 8])]);
  const [all] = computeTrendFits(
    fakeViz({window: 2, group: "all"}),
    data,
    [1, 2, 3],
  );
  assert.strictEqual(all.id, "all");
  assert.deepStrictEqual(
    all.samples.map(s => [s.x, s.y]),
    [
      [2, 4],
      [3, 6],
    ],
  );
  const [stacked] = computeTrendFits(
    fakeViz({window: 2}, {stacked: true, discrete: "x"}),
    data,
    [1, 2, 3],
  );
  assert.deepStrictEqual(
    stacked.samples.map(s => [s.x, s.y]),
    [
      [2, 8],
      [3, 12],
    ],
  );
});

it("computeTrendFits: categories average by their order, and a moving average draws no projection", () => {
  const data = rows([
    ["A", "Q1", 4],
    ["A", "Q2", 6],
    ["A", "Q3", 8],
  ]);
  const [fit] = computeTrendFits(fakeViz({window: 2}, {discrete: "x"}), data, [
    "Q1",
    "Q2",
    "Q3",
  ]);
  assert.deepStrictEqual(
    fit.samples.map(s => [s.x, s.y]),
    [
      ["Q2", 5],
      ["Q3", 7],
    ],
  );
  const numeric = rows(series("A", [1, 2, 3, 4]));
  const [projected] = computeTrendFits(
    fakeViz({window: 2, projection: 3}),
    numeric,
    [1, 2, 3, 4],
    [5, 6, 7],
  );
  assert.ok(projected.samples.every(s => !s.projected && !s.step));
});

it("movingAverageTooltipRows: the nearest point's average and band, then the window", () => {
  const viz = {
    _xKey: "year",
    _yKey: "sales",
    _xConfig: {},
    _yConfig: {},
    schema: {locale: "en-US", discrete: undefined, translate: s => `T(${s})`},
  };
  const fit = movingAverage(
    [1, 2, 3, 4].map(x => [x, x * 10]),
    {window: 2},
  );
  const trend = {axis: "x", fit, samples: []};
  const sample = {x: 3, y: 25, lci: 15, hci: 35};
  assert.deepStrictEqual(movingAverageTooltipRows(viz, trend, fit, sample), [
    ["year", "3"],
    ["T(Moving Average)", "25"],
    ["T(Band)", "15 – 35 (±2σ)"],
    ["T(Window)", "2"],
    ["T(Observations)", "4"],
  ]);
  const centered = {...fit, center: true};
  assert.deepStrictEqual(
    trendTooltipRows(viz, {...trend, fit: centered}),
    [
      ["T(Trend Line)", "T(Moving Average)"],
      ["T(Window)", "2 (T(Centered))"],
      ["T(Observations)", "4"],
    ],
    "trendTooltipRows hands a moving average its own rows",
  );
  assert.strictEqual(
    movingAverageTooltipRows(viz, trend, fit, {x: 3, y: 25}).length,
    4,
    "no band row without bands",
  );
});

it("nearestSample: the sample closest to the pointer along the fit's axis", () => {
  const viz = {_xFunc: v => v * 10, _yFunc: v => v};
  const trend = {
    axis: "x",
    samples: [{x: 1}, {x: 2}, {x: 3}],
  };
  assert.strictEqual(nearestSample(viz, trend, [21, 0]), trend.samples[1]);
  assert.strictEqual(nearestSample(viz, trend, [99, 0]), trend.samples[2]);
  assert.strictEqual(nearestSample(viz, trend, [0, 0], []), undefined);
  assert.strictEqual(nearestSample({}, trend, [0, 0]), undefined);
});

it("trend labels: a moving average names itself and its window", () => {
  const fit = movingAverage(
    [1, 2, 3].map(x => [x, x]),
    {window: 3},
  );
  const trend = {id: "A", label: "Alpha", axis: "x", fit, row: {id: "A"}};
  const viz = {schema: {locale: "en-US", translate: s => `T(${s})`}};
  assert.strictEqual(
    trendLabelText(viz, trend, "equation"),
    "T(Moving Average) (3)",
  );
  assert.strictEqual(trendLabelText(viz, trend, true), "Alpha");
  assert.strictEqual(trendEquationLabel(trend, "en-US"), "");
});

it("emitTrendLines: a moving average's band draws under its line", () => {
  const fit = movingAverage(
    [1, 2, 3, 4].map(x => [x, x * 10]),
    {window: 2},
  );
  const trend = {
    id: "A",
    label: "A",
    color: "red",
    axis: "x",
    fit,
    row: {id: "A"},
    samples: movingAverageSamples(fit, sampling),
  };
  const viz = {
    _trendFits: [trend],
    _trendLineConfig: {...trendLineDefaults(), window: 2, center: true},
    schema: {duration: 0},
  };
  const [group] = emitTrendLines(
    viz,
    v => v,
    v => v,
  );
  const [band, ...rest] = group.children;
  assert.strictEqual(band.interactive, false, "the band takes no hover");
  assert.strictEqual(band.paint.fill, "red");
  assert.strictEqual(
    band.paint.fillOpacity,
    0.15,
    "confidenceConfig styles it",
  );
  assert.ok(rest.some(n => n.type === "path" && n.paint.stroke === "red"));
});
