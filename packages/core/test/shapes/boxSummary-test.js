import {it} from "vitest";
import assert from "assert";
// The package entry loads first so the shape modules resolve in their usual order.
import {Box} from "../../index.ts";
import {
  boxStatKeys,
  boxSummaryValues,
  computeSummaryBoxes,
  hasBoxStats,
  missingBoxStats,
  placeBox,
  readBoxSummary,
  toStatAccessor,
  warnMissingBoxStats,
} from "../../src/shapes/boxSummary.ts";
import {captureWarnings} from "~test/helpers.js";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

const row = {id: "alpha", lo: 20, q1: 78.5, mid: 145, q3: 172.5, hi: 300};
const stats = {
  boxMin: toStatAccessor("lo"),
  boxQ1: toStatAccessor("q1"),
  boxMedian: toStatAccessor("mid"),
  boxQ3: toStatAccessor("q3"),
  boxMax: toStatAccessor("hi"),
};

it("boxStatKeys: the five statistics, lowest first", () => {
  assert.deepStrictEqual(boxStatKeys, [
    "boxMin",
    "boxQ1",
    "boxMedian",
    "boxQ3",
    "boxMax",
  ]);
});

it("toStatAccessor: unsets on nullish/false, reads a key, keeps a function, wraps a constant", () => {
  assert.strictEqual(toStatAccessor(undefined), undefined);
  assert.strictEqual(toStatAccessor(null), undefined);
  assert.strictEqual(toStatAccessor(false), undefined);
  assert.strictEqual(toStatAccessor("lo")(row, 0), 20);
  const fn = d => d.hi;
  assert.strictEqual(toStatAccessor(fn), fn);
  assert.strictEqual(toStatAccessor(7)(row, 0), 7);
});

it("hasBoxStats / missingBoxStats: any statistic turns precomputed boxes on", () => {
  assert.strictEqual(hasBoxStats({}), false);
  assert.deepStrictEqual(missingBoxStats({}), []);
  assert.strictEqual(hasBoxStats({boxOutliers: () => []}), false);
  assert.strictEqual(hasBoxStats({boxMedian: () => 1}), true);
  assert.deepStrictEqual(missingBoxStats({boxMedian: () => 1}), [
    "boxMin",
    "boxQ1",
    "boxQ3",
    "boxMax",
  ]);
  assert.deepStrictEqual(missingBoxStats(stats), []);
});

it("warnMissingBoxStats: warns once naming the unset statistics", () => {
  const partial = {boxMin: () => 1, boxMedian: () => 2};
  const warnings = captureWarnings(() => {
    warnMissingBoxStats("Test", partial);
    warnMissingBoxStats("Test", partial);
    warnMissingBoxStats("Test", stats);
    warnMissingBoxStats("Test", {});
  });
  assert.deepStrictEqual(warnings, [
    "Test draws precomputed boxes only when boxMin, boxQ1, boxMedian, boxQ3, boxMax are all set; missing boxQ1, boxQ3, boxMax.",
  ]);
});

it("readBoxSummary: reads the statistics and outliers", () => {
  assert.deepStrictEqual(
    readBoxSummary({...stats, boxOutliers: () => [900, "x", -60]}, row, 0),
    {min: 20, q1: 78.5, median: 145, q3: 172.5, max: 300, outliers: [900, -60]},
  );
  // One aggregated row turns a one-item array into its value.
  assert.deepStrictEqual(
    readBoxSummary({...stats, boxOutliers: () => 900}, row, 0).outliers,
    [900],
  );
  assert.deepStrictEqual(readBoxSummary(stats, row, 0).outliers, []);
});

it("readBoxSummary: sorts statistics that arrive reversed (top-down pixels)", () => {
  const s = readBoxSummary(
    stats,
    {lo: 300, q1: 250, mid: 200, q3: 150, hi: 100},
    0,
  );
  assert.deepStrictEqual(
    [s.min, s.q1, s.median, s.q3, s.max],
    [100, 150, 200, 250, 300],
  );
});

it("readBoxSummary: null when a statistic is unset or not a number", () => {
  assert.strictEqual(readBoxSummary({boxMedian: () => 1}, row, 0), null);
  assert.strictEqual(readBoxSummary(stats, {...row, q1: null}, 0), null);
  assert.strictEqual(readBoxSummary(stats, {...row, q1: "78"}, 0), null);
  assert.strictEqual(readBoxSummary(stats, {...row, q1: NaN}, 0), null);
  // A Date reads as its timestamp.
  const at = new Date(2020, 0, 1);
  assert.strictEqual(readBoxSummary(stats, {...row, hi: at}, 0).max, +at);
});

it("boxSummaryValues: the set statistics then the outliers, complete or not", () => {
  assert.deepStrictEqual(
    boxSummaryValues({...stats, boxOutliers: () => [900]}, row, 0),
    [20, 78.5, 145, 172.5, 300, 900],
  );
  assert.deepStrictEqual(
    boxSummaryValues(stats, {...row, hi: null}, 0),
    [20, 78.5, 145, 172.5],
  );
  assert.deepStrictEqual(
    boxSummaryValues(
      {boxMedian: stats.boxMedian, boxOutliers: () => 5},
      row,
      0,
    ),
    [145, 5],
  );
  assert.deepStrictEqual(boxSummaryValues({}, row, 0), []);
});

it("boxSummaryValues: leaves out the outliers when told the row draws none", () => {
  assert.deepStrictEqual(
    boxSummaryValues({...stats, boxOutliers: () => [900]}, row, 0, false),
    [20, 78.5, 145, 172.5, 300],
  );
});

it("placeBox: centers the rect between the quartiles", () => {
  const v = {orient: "vertical", first: 100, third: 160};
  placeBox(v, "alpha", 40);
  assert.deepStrictEqual([v.x, v.y, v.width, v.height], ["alpha", 130, 40, 60]);
  const h = {orient: "horizontal", first: 100, third: 160};
  placeBox(h, "alpha", 40);
  assert.deepStrictEqual([h.x, h.y, h.width, h.height], [130, "alpha", 60, 40]);
});

it("computeSummaryBoxes: one box per complete row, with its outliers and owners", () => {
  const box = new Box().config({
    ...stats,
    boxOutliers: "out",
    x: "id",
    y: "mid",
    rectWidth: 30,
  });
  box._data = [
    {...row, out: [900, -60]},
    {...row, id: "beta", out: []},
    {...row, id: "gamma", q3: null},
  ];
  const outliers = [];
  const boxes = computeSummaryBoxes(box, outliers);
  assert.deepStrictEqual(
    boxes.map(d => [
      d.id,
      d.lowerLimit,
      d.first,
      d.median,
      d.third,
      d.upperLimit,
    ]),
    [
      ["alpha", 20, 78.5, 145, 172.5, 300],
      ["beta", 20, 78.5, 145, 172.5, 300],
    ],
  );
  assert.strictEqual(boxes[0].data, box._data[0]);
  assert.deepStrictEqual(boxes[0].values, [box._data[0]]);
  assert.deepStrictEqual(
    [boxes[0].x, boxes[0].y, boxes[0].width, boxes[0].height],
    ["alpha", 125.5, 30, 94],
  );
  assert.deepStrictEqual(
    outliers.map(d => [d.id, d.x, d.y, d.outlier, d.data === box._data[0]]),
    [
      ["alpha-outlier-0", "alpha", 900, "Circle", true],
      ["alpha-outlier-1", "alpha", -60, "Circle", true],
    ],
  );
  assert.deepStrictEqual(box._owned.get(outliers[1]), {
    datum: boxes[0],
    index: 0,
  });
  assert.deepStrictEqual(box._owned.get(boxes[1]), {datum: boxes[1], index: 1});
});

it("computeSummaryBoxes: horizontal boxes sit at their y, outliers along x", () => {
  const box = new Box().config({
    ...stats,
    boxOutliers: () => [900],
    orient: "horizontal",
    y: "id",
  });
  box._data = [row];
  const outliers = [];
  const [d] = computeSummaryBoxes(box, outliers);
  assert.deepStrictEqual([d.x, d.y, d.width], [125.5, "alpha", 94]);
  assert.deepStrictEqual([outliers[0].x, outliers[0].y], [900, "alpha"]);
});

it("Box: precomputed boxes draw the box, median, whiskers, and outliers", () => {
  const box = new Box()
    .config({...stats, boxOutliers: () => [500], x: () => 100})
    .renderMode("compute")
    .data([row])
    .render();
  const nodes = {};
  for (const n of box.toScene().children) nodes[n.key] = n;
  assert.strictEqual(nodes["100-box"].height, 94);
  assert.strictEqual(nodes["100-median"].transform.y, 145);
  assert.ok(nodes["100-whisker-top"] && nodes["100-whisker-bottom"]);
  assert.strictEqual(nodes["100-outlier-0"].transform.y, 500);
});

it("Box: a precomputed box draws no outliers when its outlier setting is false", () => {
  const scene = outlier =>
    new Box()
      .config({...stats, boxOutliers: () => [500, 600], x: () => 100, outlier})
      .renderMode("compute")
      .data([row, {...row, x: 1}])
      .render()
      .toScene()
      .children.map(n => n.key);
  assert.deepStrictEqual(
    scene(false).filter(k => k.includes("outlier")),
    [],
  );
  assert.ok(scene(false).includes("100-box"), "the box still draws");
  // An accessor decides per row.
  const keys = new Box()
    .config({
      ...stats,
      boxOutliers: () => [500],
      x: d => d.x ?? 100,
      outlier: d => (d.x === 1 ? false : "Rect"),
    })
    .renderMode("compute")
    .data([row, {...row, x: 1}])
    .render()
    .toScene()
    .children.map(n => n.key)
    .filter(k => k.includes("outlier"));
  assert.deepStrictEqual(keys, ["100-outlier-0"]);
});
