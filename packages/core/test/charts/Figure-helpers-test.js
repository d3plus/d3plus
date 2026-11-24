import {it} from "vitest";
import assert from "assert";
import {captureWarnings} from "~test/helpers.js";
import {useJsdom} from "~test/jsdom.js";
import {
  FIGURE_ASPECT,
  FIGURE_PADDING,
  figureColumns,
  figureGrid,
  placeCharts,
  resolveFigureLayout,
  trackCount,
  trackOffsets,
  trackWeights,
} from "../../src/charts/Figure/figureGrid.ts";
import {
  alignCells,
  NO_SIDES,
  plotInsets,
  sidesChanged,
} from "../../src/charts/Figure/figureAlign.ts";
import {
  applyChartConfig,
  figureEntry,
  isChartInstance,
  reuses,
  sourceClass,
  syncFigureCharts,
} from "../../src/charts/Figure/figureCharts.ts";
import {
  figureLinkGroup,
  figureSettled,
  figureState,
  insetBox,
  isFigureLink,
} from "../../src/charts/Figure/figureRender.ts";
import {
  composeFigureScene,
  sceneMarkup,
} from "../../src/charts/Figure/figureScene.ts";
import {
  chartClass,
  registerChart,
} from "../../src/charts/definition/chartRegistry.ts";

useJsdom();

/** A stand-in chart: what the figure calls on one, recorded. */
class FakeChart {
  constructor() {
    this.calls = [];
    this.schema = {};
  }
  render() {
    return this;
  }
  select() {
    return this;
  }
  destroy() {
    return this;
  }
  config(c) {
    this.calls.push(c);
    return this;
  }
}

it("Figure: resolveFigureLayout fills in defaults", () => {
  assert.deepStrictEqual(resolveFigureLayout(undefined), {
    columns: undefined,
    rows: undefined,
    padding: FIGURE_PADDING,
    align: true,
  });
  assert.deepStrictEqual(
    resolveFigureLayout({columns: [2, 1], padding: 4, align: false}),
    {columns: [2, 1], rows: undefined, padding: 4, align: false},
  );
  assert.strictEqual(resolveFigureLayout({padding: -3}).padding, 16);
});

it("Figure: trackCount reads a count or a list of sizes", () => {
  assert.strictEqual(trackCount(3), 3);
  assert.strictEqual(trackCount(2.7), 2);
  assert.strictEqual(trackCount([2, 1, 1]), 3);
  assert.strictEqual(trackCount([]), undefined);
  assert.strictEqual(trackCount(0), undefined);
  assert.strictEqual(trackCount(undefined), undefined);
});

it("Figure: trackWeights pads missing and invalid weights with 1", () => {
  assert.deepStrictEqual(trackWeights([2, 0, -1], 4), [2, 1, 1, 1]);
  assert.deepStrictEqual(trackWeights(3, 3), [1, 1, 1]);
});

it("Figure: trackOffsets splits a length by weight, between gaps", () => {
  assert.deepStrictEqual(trackOffsets([2, 1], 310, 10), [
    {start: 0, size: 200},
    {start: 210, size: 100},
  ]);
  assert.deepStrictEqual(trackOffsets([1], 50, 10), [{start: 0, size: 50}]);
});

it("Figure: placeCharts fills rows and honors spans and fixed cells", () => {
  assert.deepStrictEqual(placeCharts([{rowSpan: 2}, {}, {}], 2), [
    {column: 0, row: 0, columnSpan: 1, rowSpan: 2},
    {column: 1, row: 0, columnSpan: 1, rowSpan: 1},
    {column: 1, row: 1, columnSpan: 1, rowSpan: 1},
  ]);
  // A fixed cell is placed first; the rest flow around it.
  assert.deepStrictEqual(
    placeCharts([{}, {row: 0, column: 0}, {columnSpan: 2}], 2),
    [
      {column: 1, row: 0, columnSpan: 1, rowSpan: 1},
      {column: 0, row: 0, columnSpan: 1, rowSpan: 1},
      {column: 0, row: 1, columnSpan: 2, rowSpan: 1},
    ],
  );
  // A span wider than the grid is clamped to it; a fixed column is kept.
  assert.deepStrictEqual(placeCharts([{columnSpan: 5}, {column: 1}], 2), [
    {column: 0, row: 0, columnSpan: 2, rowSpan: 1},
    {column: 1, row: 1, columnSpan: 1, rowSpan: 1},
  ]);
  // A chart fixed to a full row overlaps its end rather than moving.
  assert.deepStrictEqual(placeCharts([{columnSpan: 2}, {row: 0}], 2)[1], {
    column: 1,
    row: 0,
    columnSpan: 1,
    rowSpan: 1,
  });
});

it("Figure: figureColumns fixes, derives, or chooses the column count", () => {
  const area = {width: 900, height: 300};
  const layout = {padding: 0};
  assert.strictEqual(figureColumns([{}, {}], area, {...layout, columns: 4}), 4);
  assert.strictEqual(
    figureColumns([{}, {}, {}], area, {...layout, rows: 1}),
    3,
  );
  assert.strictEqual(
    figureColumns([{}, {}, {}], area, layout),
    3,
    "a wide area lays three charts in a row",
  );
  assert.strictEqual(
    figureColumns([{}, {}, {}], {width: 300, height: 900}, layout),
    1,
    "a tall one stacks them",
  );
  assert.strictEqual(
    figureColumns([{column: 2}], area, layout),
    3,
    "never fewer than a placed chart reaches",
  );
  assert.ok(FIGURE_ASPECT > 1);
});

it("Figure: figureGrid sizes each cell from its tracks and spans", () => {
  const cells = figureGrid(
    [{rowSpan: 2}, {}, {}],
    {x: 10, y: 20, width: 310, height: 210},
    {columns: [2, 1], padding: 10},
  );
  assert.deepStrictEqual(
    cells.map(c => [c.x, c.y, c.width, c.height]),
    [
      [10, 20, 200, 210],
      [220, 20, 100, 100],
      [220, 130, 100, 100],
    ],
  );
  assert.deepStrictEqual(
    figureGrid([], {x: 0, y: 0, width: 1, height: 1}, {padding: 0}),
    [],
  );
});

it("Figure: plotInsets measures a plot area from its surface's edges", () => {
  assert.deepStrictEqual(
    plotInsets({
      schema: {width: 400, height: 300},
      _plotArea: {x: 30, y: 5, width: 300, height: 200},
      _chartTransform: {x: 10, y: 20},
    }),
    {top: 25, right: 60, bottom: 75, left: 40},
  );
  assert.strictEqual(
    plotInsets({schema: {width: 400, height: 300}}),
    undefined,
  );
  // A letterboxed chart measures against the width it draws at.
  assert.strictEqual(
    plotInsets({
      schema: {width: 400, height: 300},
      _letterbox: {width: 400, offset: 50, drawn: 300},
      _plotArea: {x: 0, y: 0, width: 280, height: 300},
      _chartTransform: {},
    }).right,
    20,
  );
});

it("Figure: alignCells grows every inset on a shared grid line to the largest", () => {
  const slots = [
    {column: 0, row: 0, columnSpan: 1, rowSpan: 1},
    {column: 0, row: 1, columnSpan: 1, rowSpan: 1},
    {column: 1, row: 0, columnSpan: 1, rowSpan: 2},
  ];
  const out = alignCells(slots, [
    {top: 10, right: 5, bottom: 30, left: 40},
    {top: 12, right: 8, bottom: 20, left: 25},
    undefined,
  ]);
  assert.deepStrictEqual(out[0], {top: 0, right: 3, bottom: 0, left: 0});
  assert.deepStrictEqual(out[1], {top: 0, right: 0, bottom: 0, left: 15});
  assert.deepStrictEqual(out[2], NO_SIDES, "a chart without axes stays put");
  const row = alignCells(
    [
      {column: 0, row: 0, columnSpan: 1, rowSpan: 1},
      {column: 1, row: 0, columnSpan: 1, rowSpan: 1},
    ],
    [
      {top: 30, right: 0, bottom: 20, left: 0},
      {top: 10, right: 0, bottom: 45, left: 0},
    ],
  );
  assert.deepStrictEqual(
    row.map(s => [s.top, s.bottom]),
    [
      [0, 25],
      [20, 0],
    ],
    "charts side by side share their top and bottom",
  );
  assert.ok(sidesChanged(out[0], NO_SIDES));
  assert.ok(!sidesChanged({...NO_SIDES, left: 0.4}, NO_SIDES));
});

it("Figure: isChartInstance and figureEntry read the charts config", () => {
  const chart = new FakeChart();
  assert.ok(isChartInstance(chart));
  assert.ok(!isChartInstance({render() {}}));
  assert.deepStrictEqual(figureEntry(chart), {source: chart, placement: {}});
  const config = {data: []};
  assert.deepStrictEqual(
    figureEntry({chart: "BarChart", config, column: 1, rowSpan: 2, row: "x"}),
    {source: "BarChart", config, placement: {column: 1, rowSpan: 2}},
  );
  assert.strictEqual(figureEntry({config}), undefined);
  assert.strictEqual(figureEntry(4), undefined);
});

it("Figure: registerChart and chartClass name chart classes", () => {
  registerChart("FakeChart", FakeChart);
  assert.strictEqual(chartClass("FakeChart"), FakeChart);
  assert.strictEqual(sourceClass("FakeChart"), FakeChart);
  assert.strictEqual(sourceClass(FakeChart), FakeChart);
  assert.strictEqual(sourceClass("Nope"), undefined);
  assert.strictEqual(sourceClass({}), undefined);
});

it("Figure: reuses matches the same instance, or a made chart of the same class", () => {
  registerChart("FakeChart", FakeChart);
  const chart = new FakeChart();
  const given = {chart, owned: false};
  const made = {chart: new FakeChart(), owned: true};
  assert.ok(reuses(given, {source: chart}));
  assert.ok(!reuses(given, {source: new FakeChart()}));
  assert.ok(reuses(made, {source: "FakeChart"}));
  assert.ok(reuses(made, {source: FakeChart}));
  assert.ok(
    !reuses(given, {source: "FakeChart"}),
    "a given chart isn't reused for a name",
  );
});

it("Figure: syncFigureCharts reuses, makes, and drops charts", () => {
  registerChart("FakeChart", FakeChart);
  const owner = {};
  const a = new FakeChart();
  const first = syncFigureCharts(owner, [a, {chart: "FakeChart", row: 1}], []);
  assert.strictEqual(first.children.length, 2);
  assert.strictEqual(first.children[0].chart, a);
  assert.strictEqual(first.children[0].owned, false);
  assert.ok(first.children[1].chart instanceof FakeChart);
  assert.strictEqual(first.children[1].owned, true);
  assert.deepStrictEqual(first.children[1].placement, {row: 1});

  const made = first.children[1].chart;
  const second = syncFigureCharts(
    owner,
    [{chart: "FakeChart"}, {chart: "FakeChart"}],
    first.children,
  );
  assert.strictEqual(second.children[1].chart, made, "same class, same index");
  assert.notStrictEqual(second.children[0].chart, a);
  assert.deepStrictEqual(
    second.removed.map(c => c.chart),
    [a],
    "the instance no longer listed is dropped",
  );

  const warnings = captureWarnings(() => {
    const third = syncFigureCharts(owner, [{chart: "Missing"}, 7], []);
    assert.strictEqual(third.children.length, 0);
  });
  assert.strictEqual(warnings.length, 2);
  assert.match(warnings[0], /"Missing" is not a d3plus chart/);
  assert.match(warnings[1], /charts\[1\]/);
});

it("Figure: applyChartConfig applies shared then own config, once per change", () => {
  const chart = new FakeChart();
  const own = {title: "Own"};
  const child = {chart, config: own};
  const shared = {theme: "dark"};
  applyChartConfig(child, shared);
  assert.deepStrictEqual(chart.calls, [shared, own]);
  applyChartConfig(child, shared);
  assert.strictEqual(chart.calls.length, 2, "nothing changed, nothing applied");
  applyChartConfig(child, {});
  assert.deepStrictEqual(
    chart.calls.slice(2),
    [own],
    "an empty shared config is skipped",
  );
});

it("Figure: insetBox shrinks a cell, never below zero", () => {
  assert.deepStrictEqual(
    insetBox(
      {x: 10, y: 10, width: 100, height: 50},
      {top: 5, right: 10, bottom: 0, left: 20},
    ),
    {x: 30, y: 15, width: 70, height: 45},
  );
  assert.strictEqual(
    insetBox({x: 0, y: 0, width: 10, height: 10}, {...NO_SIDES, left: 20})
      .width,
    0,
  );
});

it("Figure: figureLinkGroup and isFigureLink read link groups", () => {
  assert.strictEqual(figureLinkGroup("dash"), "dash");
  assert.strictEqual(figureLinkGroup({group: "g", by: "id"}), "g");
  assert.strictEqual(figureLinkGroup(false), false);
  assert.strictEqual(figureLinkGroup(""), false);
  assert.ok(isFigureLink("d3plus-figure-12"));
  assert.ok(!isFigureLink("d3plus-figure-x"));
  assert.ok(!isFigureLink("dash"));
});

it("Figure: figureSettled waits for every pending chart render", async () => {
  const state = figureState();
  let settled = false;
  state.pending = 1;
  const done = figureSettled(state).then(() => (settled = true));
  await Promise.resolve();
  assert.strictEqual(settled, false);
  state.pending = 0;
  state.waiters.splice(0).forEach(fn => fn());
  await done;
  assert.strictEqual(settled, true);
  await figureSettled(figureState());
});

it("Figure: composeFigureScene places each chart's scene in its box", () => {
  const own = {
    width: 300,
    height: 200,
    root: {type: "group", key: "viz-root", children: []},
  };
  const part = {
    width: 100,
    height: 100,
    root: {
      type: "group",
      key: "viz-root",
      children: [{type: "rect", key: "a", x: 0, y: 0, width: 5, height: 5}],
    },
  };
  const scene = composeFigureScene(own, [
    {scene: part, x: 10, y: 20},
    {scene: part, x: 150, y: 20},
  ]);
  assert.strictEqual(scene.width, 300);
  const [mine, first, second] = scene.root.children;
  assert.strictEqual(mine, own.root);
  assert.deepStrictEqual(first.transform, {x: 10, y: 20});
  assert.strictEqual(first.children[0].key, "figure-chart-0/viz-root");
  assert.strictEqual(second.children[0].children[0].key, "figure-chart-1/a");
});

it("Figure: sceneMarkup serializes a scene as SVG", () => {
  const markup = sceneMarkup({
    width: 50,
    height: 40,
    root: {
      type: "group",
      key: "root",
      children: [
        {type: "rect", key: "r", x: 0, y: 0, width: 5, height: 5, fill: "red"},
      ],
    },
  });
  assert.match(markup, /^<svg/);
  assert.match(markup, /<rect/);
});
