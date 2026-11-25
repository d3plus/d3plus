import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  hiddenAxisConfig,
  mergeDomains,
  overlapGroups,
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
  chartRows,
  combineStyle,
  ENTRY_KEY,
  entryAccessor,
  gatherRows,
  ID_KEY,
  idAccessor,
  legendOff,
  legendSources,
  userSet,
} from "../../src/charts/Dashboard/dashboardLegend.ts";
import {
  staleLegendRows,
  unchanged,
} from "../../src/charts/Dashboard/dashboardRender.ts";
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
    readAxis(plot(undefined, {schema: {xDomain: [0, 1]}}), "x").own,
    true,
    "a domain of its own is marked",
  );
  assert.deepStrictEqual(
    readAxis(
      plot(
        {x: [2, 3], y: [5, 0]},
        {_plotZoomBase: {scales: {x: {domain: () => [0, 10]}}}},
      ),
      "x",
    ).domain,
    [0, 10],
    "a zoomed chart reads its unzoomed domain",
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

it("Dashboard: planShares shares across overlapping spans, labeling each chart with none below", () => {
  // A wide chart over two side by side.
  const slots = [slot(0, 0, 2), slot(0, 1), slot(1, 1)];
  const readings = [
    {x: reading("linear", [0, 10])},
    {x: reading("linear", [5, 20])},
    {x: reading("linear", [-5, 1])},
  ];
  const shares = planShares(slots, readings, {x: true});
  assert.deepStrictEqual(
    shares.map(s => s.domains.x),
    [
      [-5, 20],
      [-5, 20],
      [-5, 20],
    ],
  );
  assert.deepStrictEqual(
    shares.map(s => !!s.hidden.x),
    [true, false, false],
  );
  assert.deepStrictEqual(overlapGroups(slots, [1, 2], "x"), [[1], [2]]);
  assert.deepStrictEqual(overlapGroups(slots, [1, 2, 0], "x"), [[0, 1, 2]]);
});

it("Dashboard: planShares takes the domains charts set themselves", () => {
  const slots = [slot(0, 0), slot(0, 1), slot(0, 2)];
  const own = domain => ({...reading("linear", domain), own: true});
  const one = planShares(
    slots,
    [
      {x: reading("linear", [0, 50])},
      {x: own([0, 10])},
      {x: reading("linear", [2, 3])},
    ],
    {x: true},
  );
  assert.deepStrictEqual(
    one[0].domains.x,
    [0, 10],
    "the chart's own domain is everyone's",
  );
  const two = planShares(
    slots,
    [{x: own([0, 10])}, {x: own([5, 30])}, {x: reading("linear", [2, 3])}],
    {x: true},
  );
  assert.deepStrictEqual(two[2].domains.x, [0, 30], "two own domains merge");
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

it("Dashboard: legendOff and legendSources pick the legend's charts", () => {
  assert.ok(legendOff(false));
  assert.ok(legendOff(constant(false)));
  assert.ok(!legendOff(constant(true)));
  assert.ok(!legendOff(() => false), "a rule may still show it");
  const owns = [
    {legend: constant(false), eligible: true, dashboard: false},
    {legend: () => true, eligible: false, dashboard: false},
    {legend: () => true, eligible: true, dashboard: true},
    {legend: () => true, eligible: true, dashboard: false},
    {legend: () => true, eligible: true, dashboard: false},
  ];
  assert.deepStrictEqual(legendSources(owns, undefined), [3, 4]);
  assert.deepStrictEqual(legendSources(owns, 0), [0], "a chart named outright");
  const scaled = owns.map((o, i) => ({...o, scaled: i === 3}));
  assert.deepStrictEqual(
    legendSources(scaled, undefined),
    [4],
    "a chart colored by a colorScale is left out",
  );
  assert.deepStrictEqual(legendSources(scaled, [3]), [], "even when named");
  assert.deepStrictEqual(
    legendSources(owns, [4, 2, 9]),
    [4],
    "never a dashboard",
  );
});

it("Dashboard: userSet and combineStyle take what charts set, earlier first, the dashboard's own over all", () => {
  const fill = () => "red";
  const base = {fill, Rect: {width: 10}};
  assert.strictEqual(userSet({fill, Rect: {width: 10}}, base), undefined);
  assert.deepStrictEqual(userSet({fill, Rect: {width: 12}}, base), {
    Rect: {width: 12},
  });
  assert.strictEqual(userSet("Circle", "Rect"), "Circle");
  const style = combineStyle(
    {padding: 5, align: "center"},
    [{padding: 1}, undefined, {padding: 9, title: "T"}],
    {align: "left"},
  );
  assert.deepStrictEqual(style, {padding: 1, align: "left", title: "T"});
  assert.strictEqual(
    combineStyle("Rect", [undefined, "Circle", "Line"], undefined),
    "Circle",
  );
  assert.strictEqual(combineStyle("Rect", ["Circle"], "Square"), "Square");
  assert.strictEqual(combineStyle("Rect", [], undefined), "Rect");
});

it("Dashboard: entryAccessor, idAccessor, chartRows, and gatherRows read each chart's entries", () => {
  const byRegion = {
    schema: {color: d => d.region, groupBy: [d => d.country]},
    _userData: [{country: "Chile", region: "Americas"}, {country: "Peru"}],
  };
  const byLevel = {
    schema: {groupBy: [d => d.region, d => d.country]},
    _userData: "data.csv",
    _data: [{country: "France", region: "Europe"}],
  };
  assert.strictEqual(entryAccessor(byRegion)({region: "X"}), "X");
  assert.strictEqual(entryAccessor(byLevel)({region: "Y"}), "Y");
  assert.strictEqual(idAccessor(byLevel)({country: "Z"}), "Z");
  assert.strictEqual(chartRows(byLevel), byLevel._data, "loaded from a URL");
  assert.strictEqual(chartRows(byRegion), byRegion._userData);
  assert.deepStrictEqual(
    gatherRows([byRegion, byLevel]).map(d => [d[ENTRY_KEY], d[ID_KEY]]),
    [
      ["Americas", "Chile"],
      ["Europe", "France"],
    ],
    "a row without an entry is left out",
  );
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

it("Dashboard: unchanged tells a chart that can keep its draw", () => {
  const c = {
    cell: {x: 0, y: 0, width: 100, height: 50},
    inset: {top: 0, right: 10, bottom: 0, left: 0},
    node: {},
    drawnSize: {width: 90, height: 50},
  };
  assert.ok(unchanged(c));
  assert.ok(!unchanged({...c, dirty: true}), "something it's given changed");
  assert.ok(!unchanged({...c, drawnSize: {width: 100, height: 50}}), "resized");
  assert.ok(!unchanged({...c, drawnSize: undefined}), "never drawn");
});

it("Dashboard: staleLegendRows notices a legend chart's URL data arriving", () => {
  const chart = {_userData: "data.csv", _data: [{a: 1}]};
  const child = {chart};
  const legend = {sources: [child], signature: []};
  assert.ok(staleLegendRows(legend, child));
  legend.signature = [chart._data];
  assert.ok(!staleLegendRows(legend, child));
  assert.ok(!staleLegendRows({sources: [], signature: []}, child));
  assert.ok(
    !staleLegendRows(legend, {chart: {_userData: [], _data: []}}),
    "not a legend chart",
  );
});

it("Dashboard: a chart's _linkBy is what its rows link on", async () => {
  const {resolveLink} = await import("../../src/charts/viz/linkGroup.ts");
  const row = {entry: "Europe", id: "France"};
  const viz = {schema: {link: "g"}, _id: d => d.id};
  assert.strictEqual(resolveLink(viz).by(row, 0), "France");
  viz._linkBy = d => [d.entry, d.id];
  assert.deepStrictEqual(resolveLink(viz).by(row, 0), ["Europe", "France"]);
});
