import {it} from "vitest";
import assert from "assert";
import {locale as timeLocales} from "@d3plus/locales";
import {useJsdom} from "~test/jsdom.js";
import {CyclePlot, LinePlot} from "../../index.ts";
import {
  CYCLE_INSET,
  CYCLE_INSET_MAX,
  CYCLE_PERIODS,
  END_LABEL_GAP,
  computeTimeFilter,
  cycleAxisLabel,
  cycleColor,
  cycleCompare,
  cycleDate,
  cycleDateLabel,
  cycleEndLabel,
  cycleFacetHooks,
  cycleFacetPanel,
  cycleMeanLines,
  cycleMeans,
  cyclePeriodCount,
  cyclePeriodLabel,
  cyclePeriodOf,
  cyclePeriodOrder,
  cyclePlotDef,
  cycleRowMean,
  cycleStartOf,
  cycleTitle,
  cycleTooltipContext,
  cycleTooltipRows,
  cycleTooltipTitle,
  cycleXConfig,
  cycleYConfig,
  endLabelInset,
  insetDomain,
  meanAgg,
  noSeries,
  prepareCycle,
  resolveCyclePeriod,
  scaleTimeAxis,
  shareCycleScales,
} from "../../internal.ts";

useJsdom();

const enUS = timeLocales["en-US"];
const deDE = timeLocales["de-DE"];

/** Monthly rows for 2021–2023, one series unless `series` is given. */
const monthly = (series = [undefined]) =>
  series.flatMap((name, s) =>
    [2021, 2022, 2023].flatMap(year =>
      Array.from({length: 12}, (_, m) => ({
        ...(name ? {name} : {}),
        date: `${year}-${String(m + 1).padStart(2, "0")}-15`,
        value: 100 + m * 10 + (year - 2021) * 5 + s * 1000,
      })),
    ),
  );

/** A CyclePlot over `rows`, with its draw state prepared. */
const prepared = (rows, config = {}) => {
  const viz = new CyclePlot()
    .data(rows)
    .config({x: "date", y: "value", ...config});
  viz._preDraw();
  viz._filteredData = rows;
  return viz;
};

it("CyclePlot — a LinePlot with one touching panel per season", () => {
  const viz = new CyclePlot();
  assert.ok(viz instanceof LinePlot);
  assert.strictEqual(cyclePlotDef.name, "CyclePlot");
  assert.strictEqual(viz.period(), "month");
  assert.strictEqual(viz.mean(), true);
  assert.deepStrictEqual(viz.meanConfig(), {});
  assert.strictEqual(viz.lineLabels(), false);
  assert.strictEqual(viz.axisHover(), "y");
  assert.strictEqual(viz.discrete(), "x");
  assert.strictEqual(viz.xConfig().scale, "time");
  assert.strictEqual(viz.xConfig().labels, undefined, "set per panel");
  assert.strictEqual(viz.xConfig().ticks, undefined);
  assert.strictEqual(viz.xConfig().padding, 0);
  assert.strictEqual(viz.yConfig().maxSize, Infinity);
  const facet = viz.facetConfig();
  assert.strictEqual(facet.rows, 1);
  assert.strictEqual(facet.padding, 0);
  assert.strictEqual(typeof facet.sort, "function");
  assert.strictEqual(typeof facet.title, "function");
  assert.strictEqual(viz._timeOnDiscrete, true);
  assert.strictEqual(cyclePlotDef.facet, cycleFacetHooks);
});

it("CyclePlot — user config wins over its defaults", () => {
  const viz = new CyclePlot().config({
    period: "weekday",
    mean: false,
    meanConfig: {dash: true},
    facetConfig: {padding: 4},
    xConfig: {utc: true},
  });
  assert.strictEqual(viz.period(), "weekday");
  assert.strictEqual(viz.mean(), false);
  assert.deepStrictEqual(viz.meanConfig(), {dash: true});
  assert.strictEqual(viz.facetConfig().padding, 4);
  assert.strictEqual(viz.facetConfig().rows, 1, "merged");
  assert.strictEqual(viz.xConfig().utc, true);
  assert.strictEqual(viz.xConfig().scale, "time", "merged");
  assert.strictEqual(new CyclePlot().period(), "month", "per instance");
});

it("resolveCyclePeriod — a known period, else month", () => {
  assert.deepStrictEqual(CYCLE_PERIODS, [
    "month",
    "quarter",
    "weekday",
    "hour",
  ]);
  for (const p of CYCLE_PERIODS) assert.strictEqual(resolveCyclePeriod(p), p);
  assert.strictEqual(resolveCyclePeriod("year"), "month");
  assert.strictEqual(resolveCyclePeriod(undefined), "month");
});

it("cyclePeriodCount — seasons per cycle", () => {
  assert.strictEqual(cyclePeriodCount("month"), 12);
  assert.strictEqual(cyclePeriodCount("quarter"), 4);
  assert.strictEqual(cyclePeriodCount("weekday"), 7);
  assert.strictEqual(cyclePeriodCount("hour"), 24);
});

it("cyclePeriodOf — a date's season, in local time or UTC", () => {
  const d = new Date(2024, 7, 14, 13); // Wed Aug 14 2024, 1 PM local
  assert.strictEqual(cyclePeriodOf(d, "month"), 7);
  assert.strictEqual(cyclePeriodOf(d, "quarter"), 2);
  assert.strictEqual(cyclePeriodOf(d, "weekday"), 3);
  assert.strictEqual(cyclePeriodOf(d, "hour"), 13);
  const u = new Date(Date.UTC(2024, 0, 31, 23)); // Jan 31, 11 PM UTC
  assert.strictEqual(cyclePeriodOf(u, "month", true), 0);
  assert.strictEqual(cyclePeriodOf(u, "hour", true), 23);
  assert.strictEqual(cyclePeriodOf(u, "weekday", true), 3);
  assert.strictEqual(cyclePeriodOf(u, "month"), u.getMonth(), "local");
  assert.strictEqual(cyclePeriodOf(u, "hour"), u.getHours(), "local");
});

it("cycleStartOf — the cycle a date belongs to", () => {
  const d = new Date(2024, 7, 14, 13); // Wed Aug 14 2024
  assert.deepStrictEqual(cycleStartOf(d, "month"), new Date(2024, 0, 1));
  assert.deepStrictEqual(cycleStartOf(d, "quarter"), new Date(2024, 0, 1));
  assert.deepStrictEqual(cycleStartOf(d, "hour"), new Date(2024, 7, 14));
  assert.deepStrictEqual(
    cycleStartOf(d, "weekday", false, 1),
    new Date(2024, 7, 12),
    "the Monday",
  );
  assert.deepStrictEqual(
    cycleStartOf(d, "weekday", false, 0),
    new Date(2024, 7, 11),
    "the Sunday",
  );
  assert.deepStrictEqual(
    cycleStartOf(d, "weekday", false, 6),
    new Date(2024, 7, 10),
    "the Saturday",
  );
  const u = new Date(Date.UTC(2024, 0, 31, 23));
  assert.deepStrictEqual(
    cycleStartOf(u, "month", true),
    new Date(Date.UTC(2024, 0, 1)),
  );
  assert.deepStrictEqual(
    cycleStartOf(u, "hour", true),
    new Date(Date.UTC(2024, 0, 31)),
  );
  assert.deepStrictEqual(
    cycleStartOf(u, "weekday", true, 1),
    new Date(Date.UTC(2024, 0, 29)),
  );
});

it("cyclePeriodOrder — seasons in panel order", () => {
  assert.deepStrictEqual(cyclePeriodOrder("quarter"), [0, 1, 2, 3]);
  assert.strictEqual(cyclePeriodOrder("month").length, 12);
  assert.deepStrictEqual(cyclePeriodOrder("weekday", 1), [1, 2, 3, 4, 5, 6, 0]);
  assert.deepStrictEqual(cyclePeriodOrder("weekday", 0), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepStrictEqual(cyclePeriodOrder("weekday", 6), [6, 0, 1, 2, 3, 4, 5]);
  assert.deepStrictEqual(cyclePeriodOrder("hour", 1).slice(0, 2), [0, 1]);
});

it("cyclePeriodLabel — a season's short name in a locale", () => {
  assert.strictEqual(cyclePeriodLabel(0, "month", enUS), "Jan");
  assert.strictEqual(cyclePeriodLabel(2, "month", deDE), deDE.shortMonths[2]);
  assert.strictEqual(cyclePeriodLabel(2, "quarter", enUS), "Q3");
  assert.strictEqual(
    cyclePeriodLabel(0, "quarter", timeLocales["es-ES"]),
    "T1",
  );
  assert.strictEqual(cyclePeriodLabel(1, "weekday", enUS), "Mon");
  assert.strictEqual(cyclePeriodLabel(1, "weekday", deDE), deDE.shortDays[1]);
  assert.strictEqual(cyclePeriodLabel(0, "hour", enUS), "12 AM");
  assert.strictEqual(cyclePeriodLabel(13, "hour", enUS), "1 PM");
  assert.strictEqual(cyclePeriodLabel(13, "hour", deDE), "13:00");
});

it("cycleMeans — each series' mean, in first-appearance order", () => {
  const rows = [
    {s: "b", v: 2},
    {s: "a", v: 1},
    {s: "b", v: 4},
    {s: "a", v: "x"},
    {s: "c", v: null},
  ];
  const means = cycleMeans(
    rows,
    d => d.s,
    d => (d.v === null ? undefined : d.v),
  );
  assert.deepStrictEqual(
    means.map(m => [m.id, m.mean, m.index]),
    [
      ["b", 3, 0],
      ["a", 1, 1],
    ],
  );
  assert.strictEqual(means[0].row, rows[0]);
  assert.deepStrictEqual(
    cycleMeans(
      [],
      d => d.s,
      d => d.v,
    ),
    [],
  );
});

it("cycleMeanLines — a line at each series' mean, styled by meanConfig", () => {
  const one = prepared(monthly().filter(d => d.date.endsWith("-01-15")));
  const [line] = cycleMeanLines(one);
  assert.strictEqual(line.y, 105, "January's mean over three years");
  assert.strictEqual(line.strokeOpacity, 1);
  assert.strictEqual(line.stroke, undefined, "one series: the text color");

  const two = prepared(
    monthly(["A", "B"]).filter(d => d.date.endsWith("-01-15")),
    {groupBy: "name"},
  );
  const lines = cycleMeanLines(two);
  assert.deepStrictEqual(
    lines.map(l => l.y),
    [105, 1105],
  );
  assert.ok(lines.every(l => typeof l.stroke === "string"));
  assert.notStrictEqual(lines[0].stroke, lines[1].stroke, "series colors");

  two.meanConfig({stroke: "red", dash: true, y: 0});
  assert.ok(lines.length === 2);
  const styled = cycleMeanLines(two);
  assert.strictEqual(styled[0].stroke, "red");
  assert.strictEqual(styled[0].dash, true);
  assert.strictEqual(styled[0].y, 105, "the mean wins over a configured y");
  two.mean(false);
  assert.deepStrictEqual(cycleMeanLines(two), []);
});

it("cycleDate — a row's date, from a value or a merged list", () => {
  assert.deepStrictEqual(cycleDate("2024-03-05", false), new Date(2024, 2, 5));
  assert.deepStrictEqual(
    cycleDate("2024-03-05", true),
    new Date(Date.UTC(2024, 2, 5)),
  );
  assert.deepStrictEqual(
    cycleDate(["2024-03-05", "2024-03-06"], false),
    new Date(2024, 2, 5),
  );
  const d = new Date(2020, 1, 1);
  assert.strictEqual(cycleDate(d, false), d);
  assert.strictEqual(cycleDate(undefined, false), undefined);
  assert.strictEqual(cycleDate("", false), undefined);
  assert.strictEqual(cycleDate("not a date", false), undefined);
});

it("prepareCycle — points x and facet at each row's cycle and season", () => {
  const rows = monthly();
  const viz = prepared(rows);
  const state = viz.ctx.cycle;
  assert.strictEqual(viz._x, state.cycleX);
  assert.strictEqual(viz.schema.facet, state.facet);
  assert.strictEqual(state.period, "month");
  assert.strictEqual(state.utc, false);
  assert.strictEqual(state.weekStart, 0, "en-US weeks start on Sunday");
  assert.deepStrictEqual(viz._x(rows[13], 13), new Date(2022, 0, 1));
  assert.strictEqual(viz.schema.facet(rows[13], 13), 1);
  assert.ok(Number.isNaN(viz._x({date: "nope"}, 0)), "no date, no cycle");
  assert.strictEqual(viz.schema.facet({date: "nope"}, 0), undefined);

  // A second draw keeps reading the user's x; a new x replaces it.
  prepareCycle(viz);
  assert.deepStrictEqual(viz._x(rows[13], 13), new Date(2022, 0, 1));
  viz.x(d => d.other);
  prepareCycle(viz);
  assert.deepStrictEqual(
    viz._x({other: "2019-05-01"}, 0),
    new Date(2019, 0, 1),
  );

  viz.config({period: "weekday", locale: "de-DE", xConfig: {utc: true}});
  prepareCycle(viz);
  assert.strictEqual(state.period, "weekday");
  assert.strictEqual(state.weekStart, 1, "de-DE weeks start on Monday");
  assert.strictEqual(state.utc, true);
});

it("cycleTitle + cycleCompare — panel titles and order", () => {
  const viz = prepared(monthly());
  assert.strictEqual(cycleTitle(viz, 0), "Jan");
  assert.strictEqual(viz.facetConfig().title(11), "Dec");
  assert.ok(cycleCompare(viz, 0, 1) < 0);
  viz.config({period: "weekday", locale: "de-DE"});
  prepareCycle(viz);
  assert.strictEqual(cycleTitle(viz, 1), deDE.shortDays[1]);
  assert.ok(cycleCompare(viz, 1, 0) < 0, "Monday before Sunday");
  assert.ok(viz.facetConfig().sort(6, 0) < 0, "Saturday before Sunday");
  viz.config({locale: "en-US"});
  prepareCycle(viz);
  assert.ok(cycleCompare(viz, 0, 1) < 0, "Sunday first in en-US");
});

it("cycleColor — rows of no series take the palette's first color", () => {
  const viz = new CyclePlot();
  const first = viz.schema.colorDefaults.scale.range()[0];
  const color = cycleColor(viz, d => d.c);
  assert.strictEqual(color({}, 0), first);
  assert.strictEqual(color({c: null}, 0), first);
  assert.strictEqual(color({c: "A"}, 0), "A");
  assert.strictEqual(viz.schema.color({}, 0), first, "the default color");
});

it("insetDomain — room inside each end of a domain", () => {
  assert.deepStrictEqual(insetDomain([0, 10], 0.1), [-1, 11]);
  const dates = insetDomain([new Date(0), new Date(1000)], CYCLE_INSET);
  assert.ok(dates[0] instanceof Date);
  assert.deepStrictEqual(dates.map(Number), [-100, 1100]);
  assert.deepStrictEqual(insetDomain([5, 5], 0.1), [5, 5], "no span");
  assert.strictEqual(insetDomain(undefined, 0.1), undefined);
  assert.deepStrictEqual(insetDomain(["a", "b", "c"], 0.1), ["a", "b", "c"]);
});

it("shareCycleScales — shared scales with room for the end labels", () => {
  const rows = monthly();
  const viz = prepared(rows);
  const panels = Array.from({length: 12}, (_, m) =>
    rows.filter((d, i) => viz.schema.facet(d, i) === m),
  );
  const span = +new Date(2023, 0, 1) - +new Date(2021, 0, 1);
  const state = viz.ctx.cycle;
  viz.schema.width = 1000;

  // A wide panel: the labels fit at the least room.
  viz._margin = {top: 0, right: viz.schema.width - 400, bottom: 0, left: 0};
  const wide = shareCycleScales(viz, panels);
  const [lo, hi] = wide.domains.x.map(Number);
  assert.strictEqual(lo, +new Date(2021, 0, 1) - span * CYCLE_INSET);
  assert.strictEqual(hi, +new Date(2023, 0, 1) + span * CYCLE_INSET);
  assert.ok(wide.domains.y[0] <= 100 && wide.domains.y[1] >= 220);
  assert.deepStrictEqual(state.ends, [
    new Date(2021, 0, 1),
    new Date(2023, 0, 1),
  ]);
  assert.deepStrictEqual(state.endLabels, ["2021", "2023"]);

  // A narrower one makes more room for them.
  viz._margin = {top: 0, right: viz.schema.width - 100, bottom: 0, left: 0};
  const [nlo] = shareCycleScales(viz, panels).domains.x.map(Number);
  assert.ok(nlo < lo, "more room inside the ends");
  assert.deepStrictEqual(state.endLabels, ["2021", "2023"]);

  // Too narrow: no labels, the least room.
  viz._margin = {top: 0, right: viz.schema.width - 30, bottom: 0, left: 0};
  const [tlo] = shareCycleScales(viz, panels).domains.x.map(Number);
  assert.strictEqual(tlo, lo);
  assert.strictEqual(state.endLabels, undefined);
});

it("endLabelInset — room that keeps both end labels inside and apart", () => {
  assert.deepStrictEqual(endLabelInset(400, [20, 20]), {
    inset: CYCLE_INSET,
    fits: true,
  });
  const {inset, fits} = endLabelInset(100, [30, 30]);
  assert.ok(fits);
  const place = inset / (1 + 2 * inset);
  assert.ok(Math.abs(place * 100 - (15 + END_LABEL_GAP)) < 1e-9);
  assert.ok(inset <= CYCLE_INSET_MAX);
  assert.deepStrictEqual(endLabelInset(60, [30, 30]), {
    inset: CYCLE_INSET,
    fits: false,
  });
  assert.deepStrictEqual(endLabelInset(0, [1, 1]).fits, false);
});

it("cycleXConfig — ticks at the end cycles, labeled when they fit", () => {
  const ends = [new Date(2020, 0, 1), new Date(2023, 0, 1)];
  const endLabel = d => `${d.getFullYear()}`;
  const state = {ends, endLabels: ["2020", "2023"], endLabel};
  const out = cycleXConfig({title: false}, {}, state, true);
  assert.deepStrictEqual(out.ticks, ends);
  assert.deepStrictEqual(out.labels, ends);
  assert.strictEqual(out.tickFormat(+ends[1]), "2023");
  assert.strictEqual(out.tickFormat(ends[0]), "2020");
  assert.strictEqual(out.tickFormat("x"), "x");
  assert.deepStrictEqual(cycleXConfig({}, {}, state, false).labels, []);
  assert.deepStrictEqual(
    cycleXConfig({}, {}, {...state, endLabels: undefined}, true).labels,
    [],
    "labels that don't fit are dropped",
  );
  assert.deepStrictEqual(cycleXConfig({}, {}, {}, true).ticks, []);
  const own = {ticks: [1]};
  assert.strictEqual(cycleXConfig(own, own, state, true), own, "user ticks");
  const fmt = () => "f";
  assert.strictEqual(
    cycleXConfig({tickFormat: fmt}, {tickFormat: fmt}, state, true).tickFormat,
    fmt,
  );
});

it("cycleEndLabel — a cycle's year, or its first day", () => {
  const d = new Date(2023, 0, 2);
  assert.strictEqual(cycleEndLabel(d, "month", enUS), "2023");
  assert.strictEqual(cycleEndLabel(d, "quarter", enUS), "2023");
  assert.strictEqual(cycleEndLabel(d, "weekday", enUS), "Jan 2");
  assert.strictEqual(
    cycleEndLabel(d, "hour", deDE),
    `${deDE.shortMonths[0]} 2`,
  );
  const u = new Date(Date.UTC(2023, 11, 31, 23));
  assert.strictEqual(cycleEndLabel(u, "hour", enUS, true), "Dec 31");
});

it("meanAgg — rows in a season and cycle average by default", () => {
  assert.strictEqual(
    meanAgg([{v: 1}, {v: 2}, {v: "x"}, {v: 6}], d => d.v),
    3,
  );
  assert.strictEqual(
    meanAgg([], d => d.v),
    undefined,
  );
  const viz = prepared(monthly());
  assert.strictEqual(viz.schema.aggs.value, meanAgg);
  const sum = (a, c) => a.reduce((t, d) => t + c(d), 0);
  const own = prepared(monthly(), {aggs: {value: sum}});
  assert.strictEqual(own.schema.aggs.value, sum, "a user aggs wins");
});

it("cycleYConfig — unlabeled panels' y axes draw no ticks or padding", () => {
  assert.deepStrictEqual(cycleYConfig({title: "T"}, false), {
    title: "T",
    padding: 0,
    tickSize: 0,
  });
  assert.deepStrictEqual(cycleYConfig(undefined, true), {
    padding: 5,
    tickSize: 8,
  });
  assert.deepStrictEqual(cycleYConfig({padding: 2, tickSize: 3}, true), {
    padding: 2,
    tickSize: 3,
  });
});

it("cycleFacetPanel — applies and undoes a panel's y axis", () => {
  const viz = new CyclePlot();
  const saved = viz._yConfig;
  const ctx = {
    cell: {},
    shared: false,
    labels: {x: false, y: false},
    scales: undefined,
  };
  const undo = cycleFacetPanel(viz, ctx);
  assert.strictEqual(viz._yConfig.tickSize, 0);
  assert.strictEqual(viz._yConfig.padding, 0);
  assert.deepStrictEqual(viz._yConfig.labels, []);
  viz._yAxis.config({tickSize: 0, padding: 0});
  undo();
  assert.strictEqual(viz._yConfig, saved);
  assert.strictEqual(viz._yAxis.tickSize(), 8);
  assert.strictEqual(viz._yAxis.padding(), 5);
  const labeled = cycleFacetPanel(viz, {...ctx, labels: {x: false, y: true}});
  assert.strictEqual(viz._yConfig.tickSize, 8);
  labeled();
});

it("cycleDateLabel — a date in its season and cycle", () => {
  const d = new Date(2023, 0, 2, 13); // Mon Jan 2 2023, 1 PM
  assert.strictEqual(cycleDateLabel(d, "month", enUS), "Jan 2023");
  assert.strictEqual(cycleDateLabel(d, "quarter", enUS), "Q1 2023");
  assert.strictEqual(cycleDateLabel(d, "weekday", enUS), "Mon 1/2/2023");
  assert.strictEqual(cycleDateLabel(d, "hour", enUS), "1/2/2023 1 PM");
  assert.strictEqual(cycleDateLabel(d, "hour", deDE), "02.01.2023 13:00");
  const u = new Date(Date.UTC(2023, 11, 31, 23));
  assert.strictEqual(cycleDateLabel(u, "month", enUS, true), "Dec 2023");
  assert.strictEqual(cycleDateLabel(u, "hour", enUS, true), "12/31/2023 11 PM");
});

it("cycleTooltipContext — what the tooltip reads", () => {
  const rows = monthly();
  const viz = prepared(rows);
  const ctx = cycleTooltipContext(viz);
  assert.deepStrictEqual(ctx.date(rows[0], 0), new Date(2021, 0, 15));
  assert.strictEqual(ctx.season(rows[1], 1), 1);
  assert.strictEqual(ctx.period, "month");
  assert.strictEqual(ctx.locale, enUS);
  assert.strictEqual(ctx.utc, false);
});

it("noSeries + cycleRowMean — a row's series and its panel mean", () => {
  const rows = monthly(["A", "B"]);
  const viz = prepared(rows, {groupBy: "name"});
  const ctx = cycleTooltipContext(viz);
  assert.strictEqual(noSeries(viz, rows[0], 0), false);
  assert.strictEqual(cycleRowMean(viz, ctx, rows[0], 0), 105);
  assert.strictEqual(cycleRowMean(viz, ctx, rows[40], 40), 1145);
  assert.strictEqual(cycleRowMean(viz, ctx, {date: "x"}, 0), undefined);
  const single = prepared(monthly());
  assert.strictEqual(noSeries(single, {date: "2020-01-01"}, 0), true);
});

it("cycleTooltipTitle, cycleAxisLabel, cycleTooltipRows — the tooltip", () => {
  const rows = monthly(["A", "B"]);
  const viz = prepared(rows, {groupBy: "name"});
  const ctx = cycleTooltipContext(viz);
  const wrapped = {__d3plus__: true, data: rows[6], i: 6};
  assert.strictEqual(cycleTooltipTitle(viz, ctx, wrapped, 6), "A");
  assert.strictEqual(cycleAxisLabel(viz, ctx, "x", wrapped, 6), "Jul 2021");
  assert.strictEqual(cycleAxisLabel(viz, ctx, "y", wrapped, 6), undefined);
  assert.strictEqual(cycleAxisLabel(viz, ctx, "x", {date: "x"}, 0), undefined);
  assert.deepStrictEqual(cycleTooltipRows(viz, ctx, wrapped, 6), [
    ["Mean", "165"],
  ]);
  viz.locale("es-ES");
  assert.deepStrictEqual(cycleTooltipRows(viz, ctx, wrapped, 6)[0][0], "Media");
  viz.mean(false);
  assert.deepStrictEqual(cycleTooltipRows(viz, ctx, wrapped, 6), []);

  const single = prepared(monthly());
  const sctx = cycleTooltipContext(single);
  const row = single._filteredData[6];
  assert.strictEqual(cycleTooltipTitle(single, sctx, row, 6), "Jul 2021");
  assert.strictEqual(
    cycleAxisLabel(single, sctx, "x", row, 6),
    null,
    "the title shows the date",
  );
});

it("scaleTimeAxis — a time scale over Dates makes a time axis", () => {
  const viz = {_xConfig: {scale: "time"}, _yConfig: {scale: "utc"}};
  const date = new Date(2020, 0, 1);
  assert.strictEqual(scaleTimeAxis(viz, "x", date), true);
  assert.strictEqual(scaleTimeAxis(viz, "y", date), true);
  assert.strictEqual(scaleTimeAxis(viz, "x", 2020), false, "numbers aren't");
  assert.strictEqual(scaleTimeAxis(viz, "x", new Date(NaN)), false);
  assert.strictEqual(scaleTimeAxis({_xConfig: {}}, "x", date), false);
  assert.strictEqual(scaleTimeAxis({}, "x", date), false);
});

it("computeTimeFilter — a chart plotting time through its own values starts on every period", () => {
  const rows = [
    {t: "2020", v: 1},
    {t: "2021", v: 2},
    {t: "2022", v: 3},
  ];
  const viz = new LinePlot().data(rows).config({time: "t", x: "v"});
  const latest = computeTimeFilter(viz);
  assert.deepStrictEqual(
    rows.filter(latest).map(d => d.t),
    ["2022"],
    "the latest period",
  );
  viz._timeOnDiscrete = true;
  const all = computeTimeFilter(viz);
  assert.deepStrictEqual(
    rows.filter(all).map(d => d.t),
    ["2020", "2021", "2022"],
  );
});
