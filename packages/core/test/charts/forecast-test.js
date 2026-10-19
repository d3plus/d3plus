import assert from "assert";
import it from "../jsdom.js";
import {BarChart, LinePlot} from "../../es/index.js";
import {
  autoForecastStart,
  discreteOrder,
  discreteRank,
  forecastDefaults,
  forecastRow,
  forecastStart,
  seriesForecastStarts,
  trendForecastStart,
} from "../../es/src/charts/Plot/forecast.js";

// Where a Plot's `forecast` begins: an explicit value, rows flagged by a
// predicate, "auto" (where confidence bands spread), or a trend projection.

/** A plotted Line row, as the pipeline wraps a source row. */
const plotted = (d, i) => ({__d3plus__: true, data: d, i, id: d.id, x: d.t, y: d.v, discrete: d.t});

const rows = [
  {id: "a", t: 1, v: 5},
  {id: "a", t: 2, v: 6, lo: 6, hi: 6},
  {id: "a", t: 3, v: 7, lo: 5, hi: 9},
  {id: "a", t: 4, v: 8, lo: 4, hi: 12},
].map(plotted);

const s = (series, value, forecast) => ({series, value, forecast});

it("forecastDefaults — the backdrop, rule, label, and line dash defaults", () => {
  assert.deepStrictEqual(forecastDefaults(), {
    fillOpacity: 0.05,
    fontSize: 12,
    fontOpacity: 0.7,
    lineDasharray: "6 4",
    strokeDasharray: "4 4",
    strokeOpacity: 0.4,
    strokeWidth: 1,
  });
  assert.notStrictEqual(forecastDefaults(), forecastDefaults(), "a fresh object each call");
});

it("discreteOrder — dates and numbers by value, categories by position", () => {
  assert.strictEqual(discreteOrder(5, 0), 5);
  assert.strictEqual(discreteOrder(new Date(10), 0), 10);
  assert.strictEqual(discreteOrder("Q3", 2), 2);
  assert.strictEqual(discreteOrder(NaN, 4), 4);
});

it("discreteRank — categories by first appearance, across series", () => {
  const rank = discreteRank(["Q1", "Q2", "Q3", "Q1", "Q2", "Q3"]);
  assert.deepStrictEqual(["Q3", "Q1", "Q2"].map(rank), [2, 0, 1]);
  assert.ok(Number.isNaN(rank("Q9")), "an unplotted category has no rank");
  assert.strictEqual(discreteRank([2020, 2021])(2025), 2025, "numbers rank by value");
  assert.strictEqual(discreteRank([])(new Date(7)), 7, "dates by time");
});

it("forecastRow — a row's series, discrete value, and whether its band spreads", () => {
  const viz = new LinePlot().confidence(["lo", "hi"]);
  assert.deepStrictEqual(forecastRow(viz, rows[0]), {series: "a", value: 1, forecast: false}, "no bounds");
  assert.deepStrictEqual(forecastRow(viz, rows[1]), {series: "a", value: 2, forecast: false}, "bounds on the line");
  assert.deepStrictEqual(forecastRow(viz, rows[2]), {series: "a", value: 3, forecast: true});
  viz.schema.discrete = "y";
  const flipped = {...rows[2], x: 7, y: 3, discrete: 3};
  assert.deepStrictEqual(forecastRow(viz, flipped), {series: "a", value: 3, forecast: true}, "a vertical plot reads x");
  assert.strictEqual(forecastRow(new LinePlot(), rows[3]).forecast, false, "no confidence, no spread");
});

it("forecastRow — a predicate flags forecast rows from the source row", () => {
  const seen = [];
  const viz = new LinePlot().forecast((d, i) => {
    seen.push(i);
    return d.t >= 3;
  });
  assert.deepStrictEqual(rows.map(d => forecastRow(viz, d).forecast), [false, false, true, true]);
  assert.deepStrictEqual(seen, [0, 1, 2, 3], "called with each row's index");
});

it("seriesForecastStarts — each series' last point before its forecast", () => {
  const starts = seriesForecastStarts([
    s("a", 1, false), s("a", 2, false), s("a", 3, true),
    s("b", 1, false), s("b", 2, true), s("b", 3, true),
    s("c", 1, false), s("c", 2, false),
  ]);
  assert.deepStrictEqual(Array.from(starts.keys()), ["a", "b"], "a series with no forecast has no start");
  assert.deepStrictEqual(starts.get("a"), {value: 2, next: 3, at: 2});
  assert.deepStrictEqual(starts.get("b"), {value: 1, next: 2, at: 1});
});

it("seriesForecastStarts — a series flagged throughout starts at its first row only with fromFirst", () => {
  const flagged = [s("Observed", 2019, false), s("Observed", 2020, false), s("Predicted", 2020, true), s("Predicted", 2021, true)];
  assert.strictEqual(seriesForecastStarts(flagged).size, 0, "auto: bands spread from the start");
  const starts = seriesForecastStarts(flagged, true);
  assert.deepStrictEqual(Array.from(starts.keys()), ["Predicted"]);
  assert.deepStrictEqual(starts.get("Predicted"), {value: 2020, next: 2020, at: 2020});
});

it("autoForecastStart — the last point before each series' forecast; earliest wins", () => {
  assert.strictEqual(autoForecastStart([s("a", 1, false), s("a", 2, false), s("a", 3, true)]), 2);
  assert.strictEqual(
    autoForecastStart([s("a", 1, false), s("a", 2, false), s("a", 3, true), s("b", 1, false), s("b", 2, true)]),
    1,
    "the earliest start across series wins",
  );
  assert.strictEqual(autoForecastStart([s("a", 1, true), s("a", 2, true)]), null, "flagged from the start");
  assert.strictEqual(autoForecastStart([s("a", 1, false), s("a", 2, false)]), null, "never flagged");
  assert.strictEqual(autoForecastStart([]), null);
  const d = k => new Date(2020, k, 1);
  assert.strictEqual(+autoForecastStart([s("a", d(2), true), s("a", d(0), false), s("a", d(1), false)]), +d(1), "dates sort by time");
  assert.strictEqual(autoForecastStart([s("a", "Q1", false), s("a", "Q2", false), s("a", "Q3", true)]), "Q2", "categories keep plotted order");
  assert.strictEqual(
    autoForecastStart([s("a", "Q1", false), s("a", "Q2", false), s("a", "Q3", false), s("b", "Q1", false), s("b", "Q2", false), s("b", "Q3", true)]),
    "Q2",
    "a later series' categories rank where they first appeared",
  );
});

it("forecastStart — unset and false mark nothing without a trend projection", () => {
  const viz = new LinePlot().confidence(["lo", "hi"]);
  assert.strictEqual(viz.forecast(), undefined, "unset by default on a LinePlot");
  assert.strictEqual(new BarChart().forecast(), undefined, "and on a BarChart");
  assert.strictEqual(forecastStart(viz, rows), null);
  viz.forecast(false);
  assert.strictEqual(forecastStart(viz, rows), null);
});

it("forecastStart — auto (or true) starts where the bands spread", () => {
  const viz = new LinePlot().confidence(["lo", "hi"]).forecast("auto");
  const start = forecastStart(viz, rows);
  assert.strictEqual(start.value, 2);
  assert.strictEqual(start.next, 3, "the first point inside the forecast");
  assert.deepStrictEqual(Array.from(start.series), [["a", 2]], "each line's own start");
  viz.forecast(true);
  assert.strictEqual(forecastStart(viz, rows).value, 2, "true means auto");
  assert.strictEqual(forecastStart(new LinePlot().forecast("auto"), rows), null, "no bands, no forecast");
});

it("forecastStart — a predicate starts at the last unflagged point", () => {
  const viz = new LinePlot().forecast(d => d.t > 2);
  const start = forecastStart(viz, rows);
  assert.deepStrictEqual([start.value, start.next], [2, 3]);
  // A forecast drawn as its own series, joined to the history at 2.
  const split = [
    ...[1, 2].map(t => plotted({id: "Observed", t, v: t, Type: "Observed"})),
    ...[2, 3, 4].map(t => plotted({id: "Predicted", t, v: t, Type: "Predicted"})),
  ];
  const flagged = new LinePlot().forecast(d => d.Type === "Predicted");
  const joined = forecastStart(flagged, split);
  assert.deepStrictEqual([joined.value, joined.next], [2, 2]);
  assert.deepStrictEqual(Array.from(joined.series), [["Predicted", 2]], "the observed line has no forecast");
  assert.strictEqual(forecastStart(new LinePlot().forecast(() => false), rows), null, "nothing flagged");
});

it("forecastStart — an explicit discrete value, with the next plotted value", () => {
  const viz = new LinePlot().forecast(3);
  assert.deepStrictEqual(forecastStart(viz, rows), {value: 3, next: 4});
  viz.forecast(4);
  assert.deepStrictEqual(forecastStart(viz, rows), {value: 4}, "nothing after the last point");
  viz.forecast(2.5);
  assert.deepStrictEqual(forecastStart(viz, rows), {value: 2.5, next: 3}, "between points");
  viz._xTime = true;
  viz.forecast("2025-01-01");
  const start = forecastStart(viz, rows);
  assert.ok(start.value instanceof Date, "a date on a time axis");
  assert.strictEqual(start.value.getFullYear(), 2025);
  const cats = ["Q1", "Q2", "Q3"].map((t, i) => plotted({id: "a", t, v: i}, i));
  assert.deepStrictEqual(forecastStart(new LinePlot().forecast("Q2"), cats), {value: "Q2", next: "Q3"}, "categories in plotted order");
});

/** A fitted trend line, as `computeTrendFits` stores it. */
const fit = (id, values, projected) => ({
  id,
  axis: "x",
  samples: [
    ...values.map(x => ({x, y: x})),
    ...projected.map((x, k) => ({x, y: x, projected: true, step: k > 0})),
  ],
});

it("trendForecastStart — from the last fitted value to the first projected slot", () => {
  const viz = new LinePlot();
  assert.strictEqual(trendForecastStart(viz), null, "no trend lines");
  viz._trendFits = [fit("a", [2020, 2021, 2022], [])];
  assert.strictEqual(trendForecastStart(viz), null, "no projection");
  viz._trendFits = [fit("a", [2020, 2021, 2022], [2022, 2023, 2024])];
  const start = trendForecastStart(viz);
  assert.deepStrictEqual([start.value, start.next], [2022, 2023]);
  assert.strictEqual(start.series.size, 0, "no line is dashed: the projection draws its own");
  // A series that ends early projects across slots other series still plot.
  viz._trendFits = [fit("a", [2020, 2021, 2022], [2022, 2023, 2024]), fit("b", [2020], [2020, 2021, 2022, 2023, 2024])];
  assert.deepStrictEqual([trendForecastStart(viz).value, trendForecastStart(viz).next], [2022, 2023], "after every series' data");
  const d = y => new Date(y, 0, 1);
  viz._trendFits = [fit("a", [d(2020), d(2021)], [d(2021), d(2022)])];
  assert.strictEqual(+trendForecastStart(viz).next, +d(2022), "dates");
});

it("forecastStart — a trend projection marks a forecast unless forecast is false", () => {
  const viz = new LinePlot();
  viz._trendFits = [fit("a", [1, 2, 3, 4], [4, 5, 6])];
  assert.deepStrictEqual(forecastStart(viz, rows).value, 4, "unset: the projection");
  viz.forecast(false);
  assert.strictEqual(forecastStart(viz, rows), null, "false turns it off");
  viz.forecast(2);
  assert.deepStrictEqual(forecastStart(viz, rows), {value: 2, next: 3}, "an explicit value wins");
  viz.forecast(d => d.t >= 3);
  const both = forecastStart(viz, rows);
  assert.strictEqual(both.value, 2, "the earlier of the predicate and the projection");
  assert.deepStrictEqual(Array.from(both.series), [["a", 2]]);
  viz._trendFits = [fit("a", [1], [1, 2])];
  const trendFirst = forecastStart(viz, rows);
  assert.deepStrictEqual([trendFirst.value, trendFirst.next], [1, 2], "a projection that starts first");
  assert.deepStrictEqual(Array.from(trendFirst.series), [["a", 2]], "lines still dash from their own start");
});
