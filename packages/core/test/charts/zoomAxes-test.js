import {it} from "vitest";
import assert from "assert";
import {
  defaultZoomAxis,
  isOverviewChart,
  isOverviewLink,
  rangeSelectorAxis,
  refitDomain,
  splitZoomAxes,
  zoomDimensions,
} from "../../src/charts/Plot/zoomAxes.ts";

/**
    `zoomAxes.ts`: which axes a Plot's zoom rescales (`zoomAxes`, or the
    range selector's time axis), and the extent an axis left unscaled refits
    to from the rows in view.
*/

it("zoomDimensions: names the dimensions zoomAxes lists", () => {
  assert.deepStrictEqual(zoomDimensions(["x"]), {x: true, y: false});
  assert.deepStrictEqual(zoomDimensions(["y"]), {x: false, y: true});
  assert.deepStrictEqual(zoomDimensions(["x", "y"]), {x: true, y: true});
  assert.deepStrictEqual(zoomDimensions(["y", "x", "x"]), {x: true, y: true});
});

it('zoomDimensions: "x", "y", and "xy" are shorthand for the lists', () => {
  assert.deepStrictEqual(zoomDimensions("x"), {x: true, y: false});
  assert.deepStrictEqual(zoomDimensions("y"), {x: false, y: true});
  assert.deepStrictEqual(zoomDimensions("xy", "x"), {x: true, y: true});
});

it("zoomDimensions: unset, or listing neither axis, it follows the time axis, else both", () => {
  assert.deepStrictEqual(zoomDimensions(undefined), {x: true, y: true});
  assert.deepStrictEqual(zoomDimensions(undefined, "x"), {x: true, y: false});
  assert.deepStrictEqual(zoomDimensions(undefined, "y"), {x: false, y: true});
  assert.deepStrictEqual(zoomDimensions([], "x"), {x: true, y: false});
  assert.deepStrictEqual(zoomDimensions(["z"]), {x: true, y: true});
  assert.deepStrictEqual(zoomDimensions("z"), {x: true, y: true});
  assert.deepStrictEqual(zoomDimensions("yx"), {x: true, y: true});
  // An explicit setting wins over the time axis.
  assert.deepStrictEqual(zoomDimensions(["x", "y"], "x"), {x: true, y: true});
});

it("splitZoomAxes: rescales the named dimension's axes and refits the rest", () => {
  assert.deepStrictEqual(
    splitZoomAxes(["x", "x2", "y", "y2"], {x: true, y: false}),
    {rescale: ["x", "x2"], refit: ["y", "y2"]},
  );
  assert.deepStrictEqual(splitZoomAxes(["x", "y"], {x: true, y: true}), {
    rescale: ["x", "y"],
    refit: [],
  });
});

it("splitZoomAxes: rescales every zoomable axis when none lies along the named dimension", () => {
  // A category x axis isn't zoomable, so `zoomAxes: ["x"]` has nothing to rescale.
  assert.deepStrictEqual(splitZoomAxes(["y"], {x: true, y: false}), {
    rescale: ["y"],
    refit: [],
  });
});

const rows = [
  {id: "a", shape: "Line", x: 0, y: 5},
  {id: "a", shape: "Line", x: 10, y: 50},
  {id: "a", shape: "Line", x: 20, y: 30},
  {id: "a", shape: "Line", x: 30, y: 40},
  {id: "a", shape: "Line", x: 40, y: 100},
];

it("refitDomain: spans the rows in the window and each line's neighbors past its edges", () => {
  // In view: x 20 (30). Neighbors: x 10 (50) and x 30 (40).
  assert.deepStrictEqual(
    refitDomain({rows, along: "x", window: [15, 25], axis: "y"}),
    [30, 50],
  );
});

it("refitDomain: a bar's neighbors past the edges don't count", () => {
  const bars = rows.map(r => ({...r, shape: "Bar"}));
  assert.deepStrictEqual(
    refitDomain({rows: bars, along: "x", window: [15, 32], axis: "y"}),
    [30, 40],
  );
});

it("refitDomain: reads a window given either way round", () => {
  assert.deepStrictEqual(
    refitDomain({rows, along: "x", window: [25, 15], axis: "y"}),
    [30, 50],
  );
});

it("refitDomain: takes in confidence bounds and the baseline", () => {
  const banded = [
    {id: "a", shape: "Bar", x: 1, y: 20, lci: 15, hci: 28},
    {id: "a", shape: "Bar", x: 2, y: 24, lci: 18, hci: 31},
  ];
  assert.deepStrictEqual(
    refitDomain({
      rows: banded,
      along: "x",
      window: [0, 3],
      axis: "y",
      confidence: true,
    }),
    [15, 31],
  );
  assert.deepStrictEqual(
    refitDomain({
      rows: banded,
      along: "x",
      window: [0, 3],
      axis: "y",
      baseline: 0,
    }),
    [0, 24],
  );
});

it("refitDomain: skips values that aren't numbers (an unset confidence bound is false)", () => {
  const out = refitDomain({
    rows: [
      {x: 1, y: 20, lci: false, hci: null},
      {x: 2, y: "n/a"},
      {x: 3, y: 24},
    ],
    along: "x",
    window: [0, 5],
    axis: "y",
    confidence: true,
  });
  assert.deepStrictEqual(out, [20, 24]);
});

it("refitDomain: reads Dates along the rescaled axis", () => {
  const dated = [
    {x: new Date(2024, 0, 1), y: 3},
    {x: new Date(2024, 5, 1), y: 9},
    {x: new Date(2024, 11, 1), y: 1},
  ];
  assert.deepStrictEqual(
    refitDomain({
      rows: dated,
      along: "x",
      window: [+new Date(2024, 3, 1), +new Date(2024, 11, 31)],
      axis: "y",
    }),
    [1, 9],
  );
});

it("refitDomain: spans a stacked plot's bands in view", () => {
  // Two series stacked at x 1, 2, 3; each point carries its group's rows.
  const group = x => [{x}];
  const point = (lo, hi, x) => Object.assign([lo, hi], {data: group(x)});
  const stack = [
    [point(0, 10, 1), point(0, 20, 2), point(0, 5, 3)],
    [point(10, 40, 1), point(20, 25, 2), point(5, 90, 3)],
  ];
  assert.deepStrictEqual(
    refitDomain({
      rows: [],
      along: "x",
      window: [1.5, 2.5],
      axis: "y",
      stack,
      discrete: "x",
    }),
    [0, 25],
  );
});

it("refitDomain: widens a single value by a tenth either way, or by 1 at zero", () => {
  const one = [{x: 1, y: 50}];
  assert.deepStrictEqual(
    refitDomain({rows: one, along: "x", window: [0, 2], axis: "y"}),
    [45, 55],
  );
  assert.deepStrictEqual(
    refitDomain({rows: [{x: 1, y: 0}], along: "x", window: [0, 2], axis: "y"}),
    [-1, 1],
  );
});

it("refitDomain: undefined with nothing in view", () => {
  const bars = rows.map(r => ({...r, shape: "Bar"}));
  assert.strictEqual(
    refitDomain({rows: bars, along: "x", window: [41, 50], axis: "y"}),
    undefined,
  );
});

it("rangeSelectorAxis: the time axis, when zoom and the range selector are on", () => {
  const viz = (schema, xTime, yTime) => ({
    schema: {zoom: true, ...schema},
    _xTime: xTime,
    _yTime: yTime,
  });
  assert.strictEqual(rangeSelectorAxis(viz({rangeSelector: true}, true)), "x");
  assert.strictEqual(
    rangeSelectorAxis(viz({rangeSelector: ["1M"]}, false, true)),
    "y",
  );
  assert.strictEqual(rangeSelectorAxis(viz({rangeSelector: true})), undefined);
  assert.strictEqual(
    rangeSelectorAxis(viz({rangeSelector: false}, true)),
    undefined,
  );
  assert.strictEqual(
    rangeSelectorAxis(viz({rangeSelector: []}, true)),
    undefined,
  );
  assert.strictEqual(
    rangeSelectorAxis(viz({rangeSelector: true, zoom: false}, true)),
    undefined,
  );
  assert.strictEqual(rangeSelectorAxis({}), undefined);
});

it('isOverviewLink: a link whose zoom is "overview"', () => {
  assert.strictEqual(isOverviewLink({group: "g", zoom: "overview"}), true);
  assert.strictEqual(isOverviewLink({group: "g", zoom: true}), false);
  assert.strictEqual(isOverviewLink("g"), false);
  assert.strictEqual(isOverviewLink(undefined), false);
});

it("defaultZoomAxis: the range selector's axis, else an overview's time axis", () => {
  const viz = (schema, xTime) => ({
    schema: {zoom: true, ...schema},
    _xTime: xTime,
  });
  assert.strictEqual(defaultZoomAxis(viz({rangeSelector: true}, true)), "x");
  assert.strictEqual(
    defaultZoomAxis(viz({link: {group: "g", zoom: "overview"}}, true)),
    "x",
  );
  assert.strictEqual(defaultZoomAxis(viz({link: "g"}, true)), undefined);
  // An overview without a time axis zooms along x.
  assert.strictEqual(
    defaultZoomAxis(viz({link: {group: "g", zoom: "overview"}}, false)),
    "x",
  );
});

it("isOverviewChart: an overview link on a chart that zooms and isn't faceted", () => {
  const link = {group: "g", zoom: "overview"};
  assert.strictEqual(isOverviewChart({schema: {zoom: true, link}}), true);
  assert.strictEqual(isOverviewChart({schema: {zoom: false, link}}), false);
  assert.strictEqual(
    isOverviewChart({schema: {zoom: true, link, facet: () => 1}}),
    false,
  );
  assert.strictEqual(isOverviewChart({schema: {zoom: true, link: "g"}}), false);
  assert.strictEqual(isOverviewChart({}), false);
});
