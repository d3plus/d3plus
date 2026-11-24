import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  hiddenAxisConfig,
  mergeDomains,
  ownDomain,
  planShares,
  readAxis,
  sameShare,
  shareScales,
} from "../../src/charts/Dashboard/dashboardShare.ts";
import {
  applyShare,
  dropStaleShares,
  recordReadings,
  settleDashboardCharts,
} from "../../src/charts/Dashboard/dashboardSettle.ts";
import {
  dashboardLegendRule,
  legendOff,
  legendSourceIndex,
} from "../../src/charts/Dashboard/dashboardLegend.ts";
import {linkChild} from "../../src/charts/Dashboard/dashboardLink.ts";
import constant from "../../src/utils/constant.ts";

useJsdom();

const slot = (column, row, columnSpan = 1, rowSpan = 1) => ({
  column,
  row,
  columnSpan,
  rowSpan,
});
const reading = (kind, domain) => ({kind, domain, data: undefined});

/** A stand-in Plot: drawn domains, axes, and axis configs. */
function plot(domains = {x: [0, 10], y: [50, 0]}, extra = {}) {
  const axisCalls = [];
  const axis = scale => ({
    scale: () => scale,
    config: c => axisCalls.push(c),
  });
  return {
    schema: {},
    _plotAxisDomains: domains,
    _xAxis: axis("linear"),
    _yAxis: axis("linear"),
    _xConfig: {title: "X"},
    _yConfig: {title: "Y"},
    axisCalls,
    ...extra,
  };
}

/** A stand-in dashboard chart entry. */
const child = (chart, cell) => ({
  chart,
  cell,
  inset: {top: 0, right: 0, bottom: 0, left: 0},
  drawn: true,
  aligned: 0,
  shared: 0,
  readings: {},
  axisConfig: {},
});

it("Dashboard: ownDomain notices a domain the chart sets itself", () => {
  assert.ok(ownDomain({schema: {xDomain: [0, 5]}}, "x"));
  assert.ok(ownDomain({schema: {yDomain: [undefined, 5]}}, "y"));
  assert.ok(!ownDomain({schema: {xDomain: [undefined]}}, "x"));
  assert.ok(!ownDomain({schema: {}}, "x"));
});

it("Dashboard: readAxis reads a drawn Plot axis's domain and kind", () => {
  const chart = plot({x: [new Date(0), new Date(10)], y: [5, 1]});
  chart._userData = [1];
  assert.deepStrictEqual(readAxis(chart, "x"), {
    kind: "time",
    domain: [new Date(0), new Date(10)],
    data: chart._userData,
  });
  assert.strictEqual(readAxis(chart, "y").kind, "linear");
  assert.strictEqual(readAxis({schema: {}}, "x"), undefined, "not a Plot");
  assert.strictEqual(
    readAxis(plot(undefined, {schema: {xDomain: [0, 1]}}), "x"),
    undefined,
    "a domain of its own",
  );
  assert.strictEqual(
    readAxis(plot(undefined, {_facetPanels: [{}]}), "x"),
    undefined,
    "faceted",
  );
});

it("Dashboard: mergeDomains unions extents, keeping their direction, and lists categories", () => {
  assert.deepStrictEqual(
    mergeDomains("linear", [
      [0, 10],
      [-5, 3],
    ]),
    [-5, 10],
  );
  assert.deepStrictEqual(
    mergeDomains("linear", [
      [50, 0],
      [80, 10],
    ]),
    [80, 0],
    "a y axis runs from its top",
  );
  assert.deepStrictEqual(
    mergeDomains("list", [
      ["a", "b"],
      ["b", "c"],
    ]),
    ["a", "b", "c"],
  );
});

it("Dashboard: planShares shares x down a column and y across a row, labeling the outer edge", () => {
  const slots = [slot(0, 0), slot(0, 1), slot(1, 0), slot(1, 1)];
  const readings = [
    {x: reading("linear", [0, 10]), y: reading("linear", [5, 0])},
    {x: reading("linear", [5, 20]), y: reading("linear", [9, 0])},
    {x: reading("list", ["a"]), y: reading("linear", [7, 1])},
    {x: reading("linear", [0, 1]), y: reading("linear", [3, 0])},
  ];
  const shares = planShares(slots, readings, {x: true, y: true});
  assert.deepStrictEqual(shares[0].domains, {x: [0, 20], y: [7, 0]});
  assert.deepStrictEqual(shares[0].hidden, {x: true});
  assert.deepStrictEqual(shares[1].hidden, {});
  assert.deepStrictEqual(shares[1].domains.y, [9, 0]);
  assert.strictEqual(
    shares[2].domains.x,
    undefined,
    "categories beside numbers don't share",
  );
  assert.deepStrictEqual(shares[2].hidden, {y: true});
  assert.deepStrictEqual(shares[3].hidden, {y: true});
  assert.deepStrictEqual(planShares(slots, readings, {}), [
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  assert.deepStrictEqual(
    planShares([slot(0, 0), slot(0, 1)], [{x: reading("linear", [0, 1])}, {}], {
      x: true,
    }),
    [undefined, undefined],
    "a chart without axes doesn't count",
  );
});

it("Dashboard: sameShare, shareScales, and hiddenAxisConfig", () => {
  const a = {domains: {x: [0, 5]}, hidden: {x: true}};
  assert.ok(sameShare(a, {domains: {x: [0, 5]}, hidden: {x: true}}));
  assert.ok(!sameShare(a, {domains: {x: [0, 6]}, hidden: {x: true}}));
  assert.ok(!sameShare(a, {domains: {x: [0, 5]}, hidden: {}}));
  assert.ok(sameShare(undefined, undefined));
  assert.ok(!sameShare(a, undefined));
  assert.deepStrictEqual(shareScales(a), {
    domains: {x: [0, 5]},
    padded: {x: [0, 5]},
  });
  assert.deepStrictEqual(hiddenAxisConfig({title: "T", ticks: [1]}, true), {
    title: false,
    ticks: [1],
    labels: [],
  });
  const config = {title: "T"};
  assert.strictEqual(hiddenAxisConfig(config, false), config);
});

it("Dashboard: applyShare hides labels and sets domains, and puts them back", () => {
  const chart = plot();
  const c = child(chart, slot(0, 0));
  applyShare(c, {domains: {x: [0, 20]}, hidden: {x: true}});
  assert.deepStrictEqual(chart._plotFacetScales.domains, {x: [0, 20]});
  assert.deepStrictEqual(chart._xConfig, {title: false, labels: []});
  assert.deepStrictEqual(chart._yConfig, {title: "Y"});
  applyShare(c, undefined);
  assert.strictEqual(chart._plotFacetScales, undefined);
  assert.deepStrictEqual(chart._xConfig, {title: "X"});
  assert.deepStrictEqual(chart.axisCalls, [{labels: undefined, title: "X"}]);
});

it("Dashboard: recordReadings reads unshared axes; dropStaleShares notices new data", () => {
  const chart = plot();
  chart._userData = ["first"];
  const c = child(chart, slot(0, 0));
  recordReadings(c);
  assert.deepStrictEqual(c.readings.x.domain, [0, 10]);
  applyShare(c, {domains: {x: [0, 99]}, hidden: {}});
  chart._plotAxisDomains = {x: [0, 99], y: [50, 0]};
  recordReadings(c);
  assert.deepStrictEqual(
    c.readings.x.domain,
    [0, 10],
    "a shared axis isn't read",
  );
  dropStaleShares([c]);
  assert.ok(c.share, "same data, same share");
  chart._userData = ["second"];
  dropStaleShares([c]);
  assert.strictEqual(c.share, undefined);
  assert.deepStrictEqual(c.readings, {});
});

it("Dashboard: settleDashboardCharts shares first, then lines up", () => {
  const top = child(plot({x: [0, 10], y: [5, 0]}), {
    ...slot(0, 0),
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const bottom = child(plot({x: [0, 30], y: [5, 0]}), {
    ...slot(0, 1),
    x: 0,
    y: 110,
    width: 100,
    height: 100,
  });
  for (const c of [top, bottom]) recordReadings(c);
  const redrawn = [];
  const host = {
    _dashboard: {children: [top, bottom]},
    schema: {layoutConfig: {shareX: true}},
  };
  settleDashboardCharts(host, c => redrawn.push(c));
  assert.deepStrictEqual(redrawn, [top, bottom]);
  assert.deepStrictEqual(top.share.domains.x, [0, 30]);
  assert.ok(top.share.hidden.x && !bottom.share.hidden.x);
  redrawn.length = 0;
  top.drawn = false;
  settleDashboardCharts(host, c => redrawn.push(c));
  assert.deepStrictEqual(redrawn, [], "waits for every chart to draw");
});

it("Dashboard: legendOff and legendSourceIndex pick the legend's chart", () => {
  assert.ok(legendOff(false));
  assert.ok(legendOff(constant(false)));
  assert.ok(!legendOff(constant(true)));
  assert.ok(!legendOff(() => false), "a rule may still show it");
  const owns = [
    {legend: constant(false), eligible: true, dashboard: false},
    {legend: () => true, eligible: false, dashboard: false},
    {legend: () => true, eligible: true, dashboard: true},
    {legend: () => true, eligible: true, dashboard: false},
  ];
  assert.strictEqual(legendSourceIndex(owns, undefined), 3);
  assert.strictEqual(legendSourceIndex(owns, 0), 0, "a chart named outright");
  assert.strictEqual(legendSourceIndex(owns, 2), 3, "never a dashboard");
  assert.strictEqual(legendSourceIndex(owns.slice(0, 3), undefined), -1);
});

it("Dashboard: dashboardLegendRule borrows the user's rule, else the default", () => {
  const viz = {
    _defaultLegend: (config, arr) => arr.length > 1,
    _dashboard: {legend: {}},
  };
  const rule = dashboardLegendRule(viz);
  assert.strictEqual(rule({}, [1]), false);
  assert.strictEqual(rule({}, [1, 2]), true);
  viz._dashboard.legend.rule = function (config, arr) {
    return this === viz && arr.length === 1;
  };
  assert.strictEqual(rule({}, [1]), true);
});

it("Dashboard: linkChild links a chart unless it has a link of its own", () => {
  const make = link => {
    const chart = {schema: {link}, link: v => (chart.schema.link = v)};
    return {chart};
  };
  const free = make(undefined);
  linkChild({schema: {link: "g"}}, free);
  assert.strictEqual(free.chart.schema.link, "g");
  const own = make("mine");
  linkChild({schema: {link: "g"}}, own);
  assert.strictEqual(own.chart.schema.link, "mine");
  linkChild({schema: {link: false}}, free);
  assert.strictEqual(free.chart.schema.link, false);
});
