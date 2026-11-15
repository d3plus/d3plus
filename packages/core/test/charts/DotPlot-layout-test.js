import {it} from "vitest";
import assert from "assert";
import {
  MAX_DOT_DIAMETER,
  MIN_DOT_DIAMETER,
  expandUnit,
  fitDotDiameter,
  groupOrder,
  separateStacks,
  stackCenters,
  stackOffsets,
  tallestStack,
  wilkinsonStacks,
} from "../../src/charts/DotPlot/dotLayout.ts";
import {
  LANE_GAP,
  dotGap,
  dotPlacements,
} from "../../src/charts/DotPlot/placements.ts";
import {
  dotTooltipRows,
  dotTooltipTitle,
  namedRow,
} from "../../src/charts/DotPlot/tooltip.ts";
import {sourceRow} from "../../src/charts/DotPlot/index.ts";
import {
  panelDiameter,
  settleFacetSize,
  trackFacetSize,
} from "../../src/charts/DotPlot/facetSize.ts";

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} ≈ ${b}`);

it("wilkinsonStacks — sweeps sorted values into stacks one width wide", () => {
  const values = [1.2, 0, 3, 0.9, 1, NaN, 0.5];
  assert.deepStrictEqual(
    wilkinsonStacks(values, 1),
    [[1, 6, 3], [4, 0], [2]],
    "a value a full width past the stack's first value opens the next",
  );
  assert.deepStrictEqual(wilkinsonStacks([], 1), []);
  assert.deepStrictEqual(
    wilkinsonStacks([2, 2, 2], 1),
    [[0, 1, 2]],
    "ties stay in input order",
  );
  assert.deepStrictEqual(wilkinsonStacks([0, 1, 2], 0.5), [[0], [1], [2]]);
});

it("stackCenters — each stack sits at the mean of its values", () => {
  const values = [0, 0.5, 0.9, 1, 1.2, 3];
  const centers = stackCenters(values, wilkinsonStacks(values, 1));
  close(centers[0], 1.4 / 3);
  close(centers[1], 1.1);
  close(centers[2], 3);
});

it("separateStacks — overlapping neighbors pushed apart until they touch", () => {
  assert.deepStrictEqual(
    separateStacks([0, 20, 45], 10),
    [0, 20, 45],
    "stacks a gap apart keep their place",
  );
  assert.deepStrictEqual(
    separateStacks([0, 5, 30], 10),
    [-2.5, 7.5, 30],
    "a pair spreads evenly around its mean",
  );
  assert.deepStrictEqual(
    separateStacks([0, 1, 2], 10),
    [-9, 1, 11],
    "a run spreads around its mean",
  );
  assert.deepStrictEqual(
    separateStacks([0, 6, 12, 40], 10),
    [-4, 6, 16, 40],
    "a push stops where it no longer overlaps",
  );
  separateStacks([0, 9, 17], 10).forEach((x, i) =>
    close(x, 26 / 3 + (i - 1) * 10, "a chain pools into one run"),
  );
  assert.deepStrictEqual(
    separateStacks([30, 5, 0], 10),
    [30, 7.5, -2.5],
    "any input order, returned in that order",
  );
  assert.deepStrictEqual(separateStacks([], 10), []);
  const out = separateStacks([3, 3.5, 4, 20, 21], 4);
  const sum = values => values.reduce((a, b) => a + b, 0);
  assert.ok(
    Math.abs(sum(out) - sum([3, 3.5, 4, 20, 21])) < 1e-9,
    "the overall position is kept",
  );
  for (let i = 1; i < out.length; i++)
    assert.ok(out[i] - out[i - 1] >= 4 - 1e-9, "neighbors just touch or clear");
});

it("tallestStack — the largest stack's dot count", () => {
  assert.strictEqual(tallestStack([0, 0.5, 0.9, 1, 1.2, 3], 1), 3);
  assert.strictEqual(tallestStack([0, 0.5, 0.9, 1, 1.2, 3], 10), 6);
  assert.strictEqual(tallestStack([], 1), 0);
});

it("fitDotDiameter — the largest dots whose tallest stack fits", () => {
  assert.strictEqual(MIN_DOT_DIAMETER, 2);
  assert.strictEqual(MAX_DOT_DIAMETER, 20);
  const d = fitDotDiameter([[0, 5, 10, 100]], {extent: 20});
  assert.ok(d > 9.98 && d <= 10, `two-dot stacks of 10px fill 20px: ${d}`);
  assert.strictEqual(
    fitDotDiameter([[0, 100]], {extent: 50}),
    20,
    "sparse dots stop at the largest diameter",
  );
  assert.strictEqual(fitDotDiameter([[0, 100]], {extent: 50, max: 30}), 30);
  assert.strictEqual(
    fitDotDiameter([[0, 100]], {extent: 12}),
    12,
    "no larger than the room across the axis",
  );
  assert.strictEqual(
    fitDotDiameter([[0, 0, 0, 0, 0, 0]], {extent: 6}),
    2,
    "overflowing stacks keep the smallest dots",
  );
  assert.strictEqual(fitDotDiameter([[0]], {extent: 1}), 2);
  const shared = fitDotDiameter(
    [
      [0, 100],
      [0, 0, 0, 0],
    ],
    {extent: 40},
  );
  assert.ok(shared <= 10, `every lane fits: ${shared}`);
});

it("stackOffsets — piled up from the baseline, or centered on it", () => {
  assert.deepStrictEqual(stackOffsets(3, 10), [5, 15, 25]);
  assert.deepStrictEqual(stackOffsets(3, 10, "center"), [-10, 0, 10]);
  assert.deepStrictEqual(stackOffsets(4, 10, "center"), [-15, -5, 5, 15]);
  assert.deepStrictEqual(stackOffsets(0, 10), []);
});

it("groupOrder — groups in natural order, level by level", () => {
  const order = groupOrder([["b"], ["a"], ["b"], [undefined]]);
  assert.ok(order(1, 0) < 0, "a before b");
  assert.strictEqual(order(0, 2), 0, "same group");
  assert.ok(order(3, 1) < 0, "ungrouped first");
  const nested = groupOrder([
    ["x", "10"],
    ["x", "9"],
    ["w", "99"],
  ]);
  assert.ok(nested(1, 0) < 0, "9 before 10");
  assert.ok(nested(2, 1) < 0, "the top level decides first");
});

it("expandUnit — one copy per `unit` of the value, rounded", () => {
  const rows = [{v: 12}, {v: 4}, {v: "x"}, {v: 2}];
  const {rows: dots, source} = expandUnit(rows, d => d.v, 5);
  assert.strictEqual(dots.length, 3);
  assert.deepStrictEqual(
    dots.map(d => source.get(d)),
    [rows[0], rows[0], rows[1]],
  );
  assert.notStrictEqual(dots[0], dots[1], "each dot is its own row");
  assert.deepStrictEqual(dots[0], rows[0], "with its row's fields");
});

it("dotGap — 1px, or a quarter of a small dot", () => {
  assert.strictEqual(dotGap(8), 1);
  assert.strictEqual(dotGap(2), 0.5);
  assert.strictEqual(LANE_GAP, 0.1);
});

/** A swarm-mode viz and paint inputs over rows of `[value, group, lane]`. */
function placementInputs(rows, {swarm, schema = {}, lanes = []} = {}) {
  const state = swarm ?? {axis: "x", cross: "y", lanes: false};
  const viz = {_swarm: state, schema, ctx: {dotPlot: {}}, _ids: d => [d.g]};
  const values = rows.map(([v, g, lane = ""], i) => ({
    id: g,
    [state.axis]: v,
    [state.cross]: lane,
    data: {g},
    i,
  }));
  const linear = v => v * 10;
  const laneAt = v => (v === "L1" ? 150 : v === "L2" ? 50 : NaN);
  const inputs = {
    values,
    x: state.axis === "x" ? linear : laneAt,
    y: state.axis === "y" ? linear : laneAt,
    xRange: [0, 300],
    yRange: [0, 200],
    lanes,
    r: () => 5,
  };
  return {viz, values, place: () => dotPlacements(viz, inputs)};
}

it("dotPlacements — stacks rise from the plot's bottom, grouped", () => {
  const {values, place} = placementInputs([
    [1, "b"],
    [1.2, "a"],
    [1.4, "b"],
    [5, "a"],
  ]);
  const out = place();
  const at = values.map(d => out.get(d));
  // 20px dots (the largest): 10/12/14px share a stack at their mean, 12px.
  assert.deepStrictEqual(
    at.map(p => p.x),
    [12, 12, 12, 50],
  );
  assert.deepStrictEqual(
    at.map(p => p.y),
    [170, 190, 150, 190],
    "a, then b in value order, from y = 200",
  );
  assert.ok(at.every(p => p.r === 9.5));
  assert.deepStrictEqual(
    at.map(p => p.key),
    ["b", "a", "b~1", "a~1"],
    "dots sharing an id take keys of their own",
  );
});

it("dotPlacements — centered stacks, a fixed radius, or a fixed bin width", () => {
  const rows = [
    [1, "a"],
    [1.2, "a"],
    [1.4, "a"],
    [5, "a"],
  ];
  const centered = placementInputs(rows, {schema: {stackDirection: "center"}});
  const c = centered.place();
  assert.deepStrictEqual(
    centered.values.map(d => c.get(d).y),
    [120, 100, 80, 100],
  );

  const pair = [
    [1, "a"],
    [1.7, "a"],
  ];
  const fixed = placementInputs(pair, {schema: {dotRadius: 3}});
  const f = fixed.place();
  assert.deepStrictEqual(
    fixed.values.map(d => f.get(d).x),
    [10, 17],
    "6px dots make 6px bins, so 10 and 17px stand apart",
  );
  assert.strictEqual(f.get(fixed.values[0]).r, 2.5);
  const auto = placementInputs(pair).place();
  assert.strictEqual(auto.size, 2);
  assert.deepStrictEqual(
    [...auto.values()].map(p => p.x),
    [13.5, 13.5],
    "20px dots stack them",
  );

  const binned = placementInputs(rows, {schema: {binWidth: 1}});
  const b = binned.place();
  const first = b.get(binned.values[0]);
  close(first.x, 12, "the stack's mean value, scaled");
  assert.strictEqual(first.r, 4.5, "dots as wide as a 10px bin");
});

it("dotPlacements — stacks that overlap at their means are pushed apart", () => {
  const {values, place} = placementInputs(
    [
      [1, "a"],
      [2.8, "a"],
      [3.2, "a"],
    ],
    {schema: {dotRadius: 10}},
  );
  const out = place();
  // 20px bins: 10 and 28px stack at 19, 32px stacks alone, 13px off.
  assert.deepStrictEqual(
    values.map(d => out.get(d).x),
    [15.5, 15.5, 35.5],
    "both move 3.5px, until they touch",
  );
});

it("dotPlacements — one row per category, sized to fit the band", () => {
  const rows = [
    [1, "a", "L1"],
    [1, "a", "L1"],
    [1, "a", "L1"],
    [1, "a", "L1"],
    [1, "a", "L1"],
    [20, "a", "L2"],
  ];
  const {values, place} = placementInputs(rows, {
    swarm: {axis: "x", cross: "y", lanes: true},
    lanes: ["L1", "L2"],
  });
  const out = place();
  const extent = 100 * (1 - LANE_GAP);
  const d = extent / 5;
  // The fit bisects to within a hundredth of a pixel.
  const near = (a, b) => assert.ok(Math.abs(a - b) < 0.05, `${a} ≈ ${b}`);
  values
    .slice(0, 5)
    .forEach((v, k) => near(out.get(v).y, 150 + extent / 2 - (k + 0.5) * d));
  near(out.get(values[5]).y, 50 + extent / 2 - d / 2);
});

it("dotPlacements — a vertical dot plot stacks to the right", () => {
  const {values, place} = placementInputs(
    [
      [1, "a"],
      [1, "a"],
    ],
    {swarm: {axis: "y", cross: "x", lanes: false}},
  );
  const out = place();
  assert.deepStrictEqual(
    values.map(d => [out.get(d).x, out.get(d).y]),
    [
      [10, 10],
      [30, 10],
    ],
  );
});

/** A minimal chart for the tooltip helpers. */
function tooltipViz(schema = {}, swarm = {axis: "x", cross: "y", lanes: true}) {
  return {
    schema: {
      groupBy: [d => d.id],
      translate: s => `«${s}»`,
      locale: "en-US",
      value: d => d.count,
      ...schema,
    },
    _swarm: swarm,
    _x: d => d.v,
    _y: d => d.lane,
    _xKey: "v",
    _yKey: "lane",
    _xConfig: {title: "Value Axis"},
    _yConfig: {},
    _drawLabel: d => `Row ${d.id}`,
  };
}

it("namedRow — a groupBy id or a label names a row", () => {
  assert.strictEqual(namedRow(tooltipViz(), {id: 1}, 0), true);
  assert.strictEqual(namedRow(tooltipViz(), {}, 0), false);
  assert.strictEqual(namedRow(tooltipViz({label: () => "x"}), {}, 0), true);
});

it("dotTooltipTitle / dotTooltipRows — the row, its value, and its category", () => {
  const row = d => d;
  const viz = tooltipViz();
  assert.strictEqual(dotTooltipTitle(viz, row)({id: 7, v: 3}, 0), "Row 7");
  assert.deepStrictEqual(
    dotTooltipRows(viz, row)({id: 7, v: 1500, lane: "A"}, 0),
    [
      ["Value Axis", "1.5k"],
      ["lane", "A"],
    ],
  );
  // Unnamed: the title is the value, which no row repeats.
  assert.strictEqual(dotTooltipTitle(viz, row)({v: 3}, 0), "3");
  assert.deepStrictEqual(dotTooltipRows(viz, row)({v: 3, lane: "A"}, 0), [
    ["lane", "A"],
  ]);
  // A discrete axis's own tooltip lists the axes.
  const discrete = tooltipViz({discrete: "y"});
  assert.deepStrictEqual(dotTooltipRows(discrete, row)({id: 1, v: 3}, 0), []);
});

it("dotTooltipRows — with `unit`, the row's value and what a dot stands for", () => {
  const viz = tooltipViz({unit: 5}, {axis: "x", cross: "y", lanes: false});
  assert.deepStrictEqual(
    dotTooltipRows(viz, d => d)({id: 1, v: 2, count: 42}, 0),
    [
      ["Value Axis", "2"],
      ["«Value»", "42"],
      ["«Each Dot»", "5"],
    ],
  );
});

it("sourceRow — a dot's own row, or with `unit` the row it came from", () => {
  const raw = {v: 1};
  const copy = {v: 1};
  const viz = {ctx: {dotPlot: {source: new Map([[copy, raw]])}}};
  assert.strictEqual(sourceRow(viz, {__d3plus__: true, data: copy}), raw);
  const other = {v: 2};
  assert.strictEqual(sourceRow(viz, {__d3plus__: true, data: other}), other);
});

it("facet dot size — panels note their fit, then share the smallest", () => {
  const viz = {ctx: {dotPlot: {}}, _facetStep: undefined};
  trackFacetSize(viz);
  assert.strictEqual(panelDiameter(viz, 12), 12, "outside small multiples");
  assert.strictEqual(settleFacetSize(viz), false);

  viz._facetStep = "chrome";
  trackFacetSize(viz);
  viz._facetStep = "panel";
  trackFacetSize(viz);
  assert.strictEqual(panelDiameter(viz, 12), 12, "first pass: own fit");
  assert.strictEqual(panelDiameter(viz, 7), 7);
  assert.strictEqual(panelDiameter(viz, 9), 9);
  assert.strictEqual(settleFacetSize(viz), true, "draw the panels again");
  assert.strictEqual(panelDiameter(viz, 12), 7, "second pass: the smallest");
  assert.strictEqual(settleFacetSize(viz), false, "settled once");

  viz._facetStep = "chrome";
  trackFacetSize(viz);
  viz._facetStep = "panel";
  panelDiameter(viz, 5);
  panelDiameter(viz, 5);
  assert.strictEqual(settleFacetSize(viz), false, "equal fits draw once");

  viz._facetStep = undefined;
  trackFacetSize(viz);
  assert.strictEqual(viz.ctx.dotPlot.facet, undefined, "a plain draw drops it");
});
