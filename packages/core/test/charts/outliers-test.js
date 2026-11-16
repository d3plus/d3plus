import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, LinePlot, Scatter} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {formatPlotData} from "../../src/charts/Plot/pipeline.ts";
import {
  OUTLIER_K,
  OUTLIER_MIN_VALUES,
  OUTLIER_SHAPES,
  computePlotOutliers,
  findOutliers,
  outlierAxis,
  outlierFences,
  outlierGroups,
  resolveOutlier,
} from "../../src/charts/Plot/outlierDetect.ts";
import {
  barEndHigh,
  clampRingBox,
  dropMarkLabels,
  edgePoint,
  growBox,
  outlierConfig,
  outlierDefaults,
  outlierOf,
  outlierRings,
  ringPaint,
  outlierRingRadius,
  withOutliers,
} from "../../src/charts/Plot/outlierScene.ts";
import {
  OUTLIER_LABEL_GAP,
  barLabelSpots,
  emitOutlierLabels,
  outlierLabel,
  outlierLabelSpots,
  outlierSides,
  placeOutlierLabels,
} from "../../src/charts/Plot/outlierLabels.ts";
import {
  OUTLIER_LINE_STEP,
  boxCrossesSegment,
  lineSegments,
  seriesSegments,
} from "../../src/charts/Plot/outlierLines.ts";
import {
  appendOutlier,
  notedOutlier,
  outlierAria,
  outlierRows,
  outlierSuffix,
} from "../../src/charts/Plot/outlierTooltip.ts";

useJsdom();

/** Twelve points per series, `a` with a spike at x 5 and `b` with a dip at x 8. */
const series = ["a", "b"].flatMap(id =>
  Array.from({length: 12}, (_, x) => ({
    id,
    x,
    y:
      10 +
      (x % 3) +
      (id === "a" && x === 5 ? 30 : 0) -
      (id === "b" && x === 8 ? 30 : 0),
  })),
);

/** A chart through its data prep, with its plotted rows and outliers found. */
function prepared(viz) {
  viz._preDraw();
  const ctx = runStages({viz}, [formatPlotData, computePlotOutliers]);
  return {viz, rows: ctx.plotFormattedData};
}

const line = config =>
  prepared(
    new LinePlot().data(series).groupBy("id").x("x").y("y").config(config),
  );

it("resolveOutlier: true is Tukey's rule; an object picks method, k and group; a function flags rows", () => {
  assert.deepStrictEqual(resolveOutlier(true), {
    method: "iqr",
    k: 1.5,
    group: "auto",
  });
  assert.deepStrictEqual(resolveOutlier({method: "zscore"}), {
    method: "zscore",
    k: 3,
    group: "auto",
  });
  assert.deepStrictEqual(resolveOutlier({method: "mad", k: 2, group: "all"}), {
    method: "mad",
    k: 2,
    group: "all",
  });
  assert.deepStrictEqual(
    resolveOutlier({method: "nope", k: -1, group: "nope"}),
    {method: "iqr", k: 1.5, group: "auto"},
    "anything unrecognized falls back",
  );
  const fn = () => true;
  assert.strictEqual(resolveOutlier(fn), fn);
  for (const off of [false, undefined, null, 0, "iqr"])
    assert.strictEqual(resolveOutlier(off), null);
  assert.deepStrictEqual(OUTLIER_K, {iqr: 1.5, zscore: 3, mad: 3.5});
  assert.strictEqual(OUTLIER_MIN_VALUES, 3);
  assert.ok(!OUTLIER_SHAPES.has("Box"), "a Box draws its own outliers");
});

it("outlierFences: Tukey's fences, z-score and MAD fences, and none without spread", () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 100];
  // Quartiles 3 and 7 (d3's R-7), IQR 4.
  assert.deepStrictEqual(outlierFences(values, "iqr", 1.5), [-3, 13]);
  assert.deepStrictEqual(outlierFences(values, "iqr", 3), [-9, 19]);
  const [lo, hi] = outlierFences([2, 4, 4, 4, 5, 5, 7, 9], "zscore", 2);
  // Mean 5, sample standard deviation 2.138.
  assert.ok(Math.abs(lo - (5 - 2 * 2.138)) < 1e-3);
  assert.ok(Math.abs(hi - (5 + 2 * 2.138)) < 1e-3);
  // Median 5, MAD 2: fences at 5 ± 3.5 × 2 / 0.6745.
  const mad = outlierFences([1, 3, 5, 7, 9, 5, 5], "mad", 3.5);
  assert.ok(Math.abs(mad[1] - (5 + (3.5 * 2) / 0.6745)) < 1e-9);
  assert.strictEqual(outlierFences([1, 2], "iqr", 1.5), null, "too few");
  assert.deepStrictEqual(
    outlierFences([4, 4, 4, 4, 9], "iqr", 1.5),
    [4, 4],
    "no interquartile range: the quartiles fence, as BoxWhisker's whiskers",
  );
  assert.strictEqual(outlierFences([4, 4, 4, 4], "zscore", 3), null);
  assert.strictEqual(outlierFences([4, 4, 4, 9], "mad", 3.5), null, "MAD 0");
  assert.deepStrictEqual(
    outlierFences([NaN, 1, 2, 3, 4], "iqr", 1),
    outlierFences([1, 2, 3, 4], "iqr", 1),
    "non-finite values are skipped",
  );
});

it("outlierAxis: opposite the discrete axis, or its twin when only that holds a value", () => {
  assert.strictEqual(outlierAxis("x", {x: "a", y: 3}), "y");
  assert.strictEqual(outlierAxis("y", {x: 3, y: "a"}), "x");
  assert.strictEqual(outlierAxis(undefined, {x: 1, y: 3}), "y");
  assert.strictEqual(outlierAxis("x", {x: "a", y2: 3}), "y2");
  assert.strictEqual(outlierAxis("x", {x: "a", y: new Date(0)}), "y");
  assert.strictEqual(outlierAxis("x", {x: "a"}), "y");
});

it("outlierGroups: a line along its series, bars within their category, falling back to every row", () => {
  const {viz, rows} = line({});
  const lines = outlierGroups(viz, rows, "auto");
  assert.deepStrictEqual(
    lines.map(g => g.map(r => r.id)[0]),
    ["a", "b"],
    "one group per line",
  );
  assert.strictEqual(outlierGroups(viz, rows, "all").length, 1);
  assert.strictEqual(
    outlierGroups(viz, rows, "discrete").length,
    1,
    "two rows per x is too few, so every row together",
  );
  const bars = prepared(
    new BarChart()
      .data(["a", "b", "c"].flatMap(id => [1, 2].map(x => ({id, x, y: 1}))))
      .groupBy("id")
      .x("x")
      .y("y"),
  );
  assert.deepStrictEqual(
    outlierGroups(bars.viz, bars.rows, "auto").map(g => g.length),
    [3, 3],
    "bars group by their category",
  );
  const points = prepared(
    new Scatter()
      .data(series.map((d, k) => ({...d, k})))
      .groupBy(["id", "k"])
      .x("x")
      .y("y"),
  );
  assert.deepStrictEqual(
    outlierGroups(points.viz, points.rows, "series").map(g => g.length),
    [12, 12],
    "single points group by their parent groupBy level",
  );
});

it("findOutliers / computePlotOutliers: each line's spike and dip, by source row", () => {
  const {viz} = line({outlier: true});
  const found = [...viz._plotOutliers.values()];
  assert.deepStrictEqual(
    found.map(o => [o.row.id, o.row.x, o.axis, o.side]),
    [
      ["a", 5, "y", "high"],
      ["b", 8, "y", "low"],
    ],
  );
  assert.ok(viz._plotOutliers.has(found[0].row.data), "keyed by source row");
  assert.strictEqual(line({}).viz._plotOutliers.size, 0, "off by default");
  const flagged = line({outlier: d => d.x === 0}).viz._plotOutliers;
  assert.strictEqual(flagged.size, 2);
  assert.ok([...flagged.values()].every(o => o.side === undefined));
  const box = findOutliers(viz, [{shape: "Box", data: {}, i: 0, y: 1}]);
  assert.strictEqual(box.size, 0, "a Box's rows are left to it");
});

it("outlierDefaults / outlierConfig / outlierOf: defaults, and a datum's outlier through its wrappers", () => {
  assert.deepStrictEqual(outlierDefaults(), {
    gap: 2,
    label: true,
    labelConfig: {},
    r: 6,
    strokeWidth: 2,
  });
  const {viz} = line({outlier: true, outlierConfig: {r: 9}});
  assert.strictEqual(outlierConfig(viz).r, 9);
  assert.strictEqual(outlierConfig(viz).gap, 2, "merged over the defaults");
  const [[source, outlier]] = viz._plotOutliers;
  assert.deepStrictEqual(outlierOf(viz._plotOutliers, source), [
    source,
    outlier,
  ]);
  const label = {data: {data: source}};
  assert.deepStrictEqual(outlierOf(viz._plotOutliers, label), [
    source,
    outlier,
  ]);
  assert.strictEqual(outlierOf(viz._plotOutliers, {data: {}}), null);
  assert.strictEqual(outlierOf(new Map(), source), null);
});

it("outlierRingRadius / growBox / clampRingBox / barEndHigh / edgePoint: ring geometry", () => {
  assert.strictEqual(outlierRingRadius(5, 2, 2), 8);
  assert.deepStrictEqual(growBox({x: 10, y: 10, width: 4, height: 6}, 2), {
    x: 8,
    y: 8,
    width: 8,
    height: 10,
  });
  const edges = {x0: 0, y0: 0, x1: 100, y1: 50};
  assert.deepStrictEqual(
    clampRingBox({x: -5, y: 10, width: 120, height: 10}, edges, 1),
    {x: 1, y: 10, width: 98, height: 10},
  );
  const bar = {x: 0, y: 20, width: 10, height: 30};
  assert.strictEqual(barEndHigh(bar, "y", 20), false, "upright bar's top");
  assert.strictEqual(barEndHigh(bar, "y", 50), true, "a negative bar's bottom");
  assert.strictEqual(
    barEndHigh(bar, "x", 10),
    true,
    "a horizontal bar's right",
  );
  const top = [
    [0, 5],
    [10, 2],
    [20, 8],
  ];
  assert.deepStrictEqual(edgePoint(top, [9, 40], "x"), [10, 2]);
  assert.deepStrictEqual(edgePoint(top, [9, 40], "y"), [20, 8]);
  assert.deepStrictEqual(edgePoint([], [9, 40], "x"), [9, 40]);
});

it("ringPaint: unfilled, in the chart's text color, styled by outlierConfig", () => {
  const {viz} = line({});
  const plain = ringPaint(viz, outlierDefaults(), {}, 0);
  assert.strictEqual(plain.fill, "none");
  assert.strictEqual(plain.strokeWidth, 2);
  assert.ok(typeof plain.stroke === "string" && plain.stroke.length);
  assert.deepStrictEqual(
    ringPaint(
      viz,
      {
        stroke: d => d.c,
        strokeWidth: 3,
        strokeOpacity: 0.5,
        strokeDasharray: "4 2",
      },
      {c: "red"},
      0,
    ),
    {
      fill: "none",
      stroke: "red",
      strokeWidth: 3,
      strokeOpacity: 0.5,
      strokeDasharray: [4, 2],
    },
  );
});

/** A scene of three circles (`p1` an outlier) and their labels, for a stub chart. */
function pointScene() {
  const sources = [0, 1, 2].map(k => ({id: `p${k}`, y: k}));
  const datum = k => ({__d3plus__: true, data: sources[k], i: k});
  const nodes = [0, 1, 2].flatMap(k => [
    {
      type: "circle",
      key: `p${k}`,
      cx: 0,
      cy: 0,
      r: 5,
      transform: {x: 50 + k * 40, y: 50},
      datum: datum(k),
      shapeType: "Circle",
    },
    {
      type: "text",
      key: `p${k}_0`,
      x: 60 + k * 40,
      y: 50,
      lines: [{text: `p${k}`, width: 12, y: 0}],
      font: {size: 11},
      datum: {data: datum(k)},
    },
  ]);
  const row = {data: sources[1], i: 1, y: 30, shape: "Circle"};
  return {sources, nodes, row};
}

it("outlierRings: a circle around a point, a box around a bar, and a line's point on the line", () => {
  const {viz} = line({});
  const {sources, nodes, row} = pointScene();
  viz._plotOutliers = new Map([[sources[1], {row, axis: "y", side: "high"}]]);
  const frame = {x: v => v, y: v => v, edges: {x0: 0, y0: 0, x1: 200, y1: 100}};
  const [ring] = outlierRings(viz, nodes, frame);
  assert.deepStrictEqual(
    [ring.node.type, ring.node.cx, ring.node.cy, ring.node.r],
    ["circle", 90, 50, 8],
  );
  assert.strictEqual(ring.node.interactive, false);
  assert.strictEqual(ring.node.datum, nodes[2].datum, "dims with its mark");
  assert.deepStrictEqual(ring.circle, {x: 90, y: 50, r: 9});

  const bar = {
    type: "rect",
    key: "b",
    x: -5,
    y: -20,
    width: 10,
    height: 20,
    transform: {x: 40, y: 80},
    datum: {data: sources[1], i: 1},
  };
  const barRow = {...row, shape: "Bar", y: 60};
  viz._plotOutliers = new Map([
    [sources[1], {row: barRow, axis: "y", side: "high"}],
  ]);
  const [box] = outlierRings(viz, [bar], frame);
  assert.deepStrictEqual(
    [box.node.x, box.node.y, box.node.width, box.node.height],
    [32, 57, 16, 26],
  );
  assert.strictEqual(box.endHigh, false, "the value end is the top");
  assert.strictEqual(box.inset, 4);

  const path = {
    type: "path",
    key: "a",
    d: "",
    transform: {x: 500, y: 500},
    datum: {data: {}},
    interactionPoints: [
      {x: 10, y: 20, datum: {data: {}}, index: 0},
      {x: 30, y: 40, datum: {data: sources[1]}, index: 1},
    ],
  };
  viz._plotOutliers = new Map([[sources[1], {row, axis: "y", side: "high"}]]);
  const [point] = outlierRings(viz, [path], frame);
  assert.deepStrictEqual(
    [point.node.cx, point.node.cy, point.node.r],
    [30, 40, 6],
    "a line's points sit outside its own transform",
  );
  viz._plotOutliers = new Map();
  assert.deepStrictEqual(outlierRings(viz, nodes, frame), []);
});

it("outlierSides / barLabelSpots / outlierLabelSpots: past the outlier's extreme first", () => {
  assert.deepStrictEqual(outlierSides("y", "high").slice(0, 3), [
    "top",
    "top-right",
    "top-left",
  ]);
  assert.strictEqual(outlierSides("y", "low")[0], "bottom");
  assert.strictEqual(outlierSides("x", "high")[0], "right");
  assert.strictEqual(outlierSides("x", "low").at(-1), "right");
  assert.strictEqual(outlierSides("y", undefined)[0], "top");
  assert.strictEqual(new Set(outlierSides("y", "high")).size, 8);

  const box = {x: 10, y: 20, width: 10, height: 30};
  const up = barLabelSpots(box, "y", false, 20, 10, 2, 4);
  assert.deepStrictEqual(up[0], {
    box: {x: 5, y: 8, width: 20, height: 10},
    side: "top",
  });
  assert.deepStrictEqual(up[1].box, {x: 22, y: 24, width: 20, height: 10});
  assert.deepStrictEqual(up[2].box, {x: -12, y: 24, width: 20, height: 10});
  const right = barLabelSpots(box, "x", true, 20, 10, 2);
  assert.deepStrictEqual(right[0], {
    box: {x: 22, y: 30, width: 20, height: 10},
    side: "right",
  });

  const outlier = {axis: "y", side: "high", row: {}};
  const spots = outlierLabelSpots(
    {circle: {x: 50, y: 50, r: 8}, outlier},
    20,
    10,
  );
  assert.strictEqual(spots.length, 16, "each side, then each a label farther");
  assert.strictEqual(spots[8].side, "top");
  assert.strictEqual(spots[8].box.y, spots[0].box.y - 10);
  assert.deepStrictEqual(spots[0], {
    box: {x: 40, y: 50 - 8 - OUTLIER_LABEL_GAP - 10, width: 20, height: 10},
    side: "top",
  });
  assert.strictEqual(
    outlierLabelSpots({box, endHigh: false, outlier}, 20, 10).length,
    3,
  );
  assert.strictEqual(
    outlierLabelSpots({box, outlier}, 20, 10).length,
    16,
    "a square's label goes round its box",
  );
  assert.deepStrictEqual(outlierLabelSpots({outlier}, 20, 10), []);
});

it("placeOutlierLabels: each label's first open spot inside the bounds, or none", () => {
  const bounds = {x: 0, y: 0, width: 100, height: 100};
  const spot = (x, y) => ({box: {x, y, width: 10, height: 10}, side: "top"});
  const placed = placeOutlierLabels(
    [
      [spot(-5, 0), spot(10, 10)],
      [spot(12, 12), spot(40, 40)],
      [spot(42, 42)],
      [spot(80, 80)],
    ],
    [{x: 85, y: 85, r: 3}],
    [],
    bounds,
  );
  assert.deepStrictEqual(placed[0], spot(10, 10), "out of bounds is skipped");
  assert.deepStrictEqual(placed[1], spot(40, 40), "clear of the first label");
  assert.strictEqual(placed[2], null, "no room left");
  assert.strictEqual(placed[3], null, "a circle is in the way");
  assert.deepStrictEqual(
    placeOutlierLabels(
      [[spot(0, 0)]],
      [],
      [{x: 5, y: 5, width: 2, height: 2}],
      bounds,
    ),
    [null],
    "an obstacle is in the way",
  );
  const crossed = placeOutlierLabels(
    [[spot(10, 10), spot(40, 10)]],
    [],
    [],
    bounds,
    [
      [
        [0, 15],
        [30, 15],
      ],
    ],
  );
  assert.deepStrictEqual(crossed, [spot(40, 10)], "a drawn line is in the way");
});

it("seriesSegments: a series' points joined along its curve, sampled and mapped", () => {
  const points = [
    [0, 0],
    [10, 0],
    [10, 10],
  ];
  const straight = seriesSegments(points, "linear", undefined, 100);
  assert.deepStrictEqual(straight, [
    [
      [0, 0],
      [10, 0],
    ],
    [
      [10, 0],
      [10, 10],
    ],
  ]);
  const moved = seriesSegments(points, "linear", ([x, y]) => [x + 5, y + 1]);
  assert.deepStrictEqual(moved[0][0], [5, 1], "mapped into plot space");
  const curved = seriesSegments(
    [
      [0, 0],
      [20, 30],
      [40, 0],
    ],
    "monotoneX",
  );
  assert.ok(curved.length > 4, "a curve is sampled into short pieces");
  const longest = Math.max(
    ...curved.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1])),
  );
  assert.ok(
    longest < OUTLIER_LINE_STEP * 1.5,
    `pieces about ${OUTLIER_LINE_STEP}px long: ${longest}`,
  );
  assert.deepStrictEqual(seriesSegments([[1, 1]], "linear"), []);
});

it("lineSegments: every line and area top edge in a scene, hit areas and plain paths aside", () => {
  const series = {
    top: [
      [0, 0],
      [10, 0],
    ],
    keys: [0, 1],
    curve: "linear",
  };
  const nodes = [
    {
      type: "group",
      key: "g",
      transform: {x: 100, y: 50},
      children: [
        {type: "path", key: "a", d: "", series, transform: {x: 5, y: 0}},
        {type: "path", key: "a::hit", d: "", series},
        {type: "path", key: "wedge", d: "M0,0L5,5Z"},
        {
          type: "path",
          key: "area",
          d: "",
          series: {
            ...series,
            top: [
              [0, 20],
              [10, 20],
            ],
            base: [
              [0, 40],
              [10, 40],
            ],
          },
        },
      ],
    },
  ];
  assert.deepStrictEqual(lineSegments(nodes), [
    [
      [105, 50],
      [115, 50],
    ],
    [
      [100, 70],
      [110, 70],
    ],
  ]);
  assert.deepStrictEqual(lineSegments([]), []);
});

it("boxCrossesSegment: a segment through a box, or ending in it, but not one that misses or touches it", () => {
  const box = {x: 10, y: 10, width: 20, height: 10};
  const cross = (a, b) => boxCrossesSegment(box, [a, b]);
  assert.ok(cross([0, 15], [40, 15]), "straight through");
  assert.ok(cross([0, 0], [40, 30]), "diagonally through");
  assert.ok(cross([15, 15], [50, 50]), "starting inside");
  assert.ok(cross([0, 12], [12, 12]), "ending inside");
  assert.ok(!cross([0, 0], [40, 0]), "passing above");
  assert.ok(!cross([0, 25], [8, 0]), "missing the corner");
  assert.ok(!cross([0, 10], [40, 10]), "running along its edge");
  assert.ok(!cross([30, 0], [30, 40]), "along its right edge");
  assert.ok(!cross([50, 15], [50, 15]), "a point outside");
});

it("outlierLabel: the row's name and value, a function's text, or none", () => {
  const {viz} = line({outlier: true});
  const [[source, outlier]] = viz._plotOutliers;
  assert.strictEqual(outlierLabel(viz, {source, outlier}, true), "a: 42");
  assert.strictEqual(
    outlierLabel(viz, {source, outlier}, d => `x ${d.x}`),
    "x 5",
  );
  assert.strictEqual(
    outlierLabel(viz, {source, outlier}, () => false),
    "",
  );
  assert.strictEqual(outlierLabel(viz, {source, outlier}, false), "");
});

it("emitOutlierLabels / dropMarkLabels / withOutliers: the label stands in for the mark's own", () => {
  const {viz} = line({});
  const {sources, nodes, row} = pointScene();
  viz._plotOutliers = new Map([[sources[1], {row, axis: "y", side: "high"}]]);
  viz._drawLabel = d => d.id;
  const frame = {x: v => v, y: v => v, edges: {x0: 0, y0: 0, x1: 200, y1: 100}};
  const rings = outlierRings(viz, nodes, frame);
  const labels = emitOutlierLabels(viz, rings, nodes, frame.edges, {
    label: true,
    labelConfig: {},
  });
  assert.strictEqual(labels.nodes.length, 1);
  const [text] = labels.nodes;
  assert.strictEqual(text.lines[0].text, "p1: 30");
  assert.strictEqual(text.interactive, false);
  assert.ok(text.halo, "haloed in the background");
  assert.deepStrictEqual([...labels.sources], [sources[1]]);
  assert.strictEqual(
    emitOutlierLabels(viz, rings, nodes, frame.edges, {label: false}).nodes
      .length,
    0,
  );

  const kept = dropMarkLabels(
    [{type: "group", key: "g", children: nodes}],
    labels.sources,
  )[0].children;
  assert.deepStrictEqual(
    kept.map(n => n.key),
    ["p0", "p0_0", "p1", "p2", "p2_0"],
  );
  assert.strictEqual(dropMarkLabels(nodes, new Set()), nodes);

  const out = withOutliers(viz, nodes, frame);
  assert.deepStrictEqual(
    out.map(n => n.key),
    [
      "p0",
      "p0_0",
      "p1",
      "p2",
      "p2_0",
      "outlier-ring-p1",
      "outlier-label-outlier-ring-p1_0",
    ],
  );
  viz._plotOutliers = new Map();
  assert.strictEqual(withOutliers(viz, nodes, frame), nodes);
});

it("notedOutlier / outlierRows / outlierSuffix / outlierAria: the outlier's notes, unless tooltip is false", () => {
  const {viz} = line({outlier: true});
  const [[source]] = viz._plotOutliers;
  const other = series[0];
  assert.ok(notedOutlier(viz, source));
  assert.strictEqual(notedOutlier(viz, other), null);
  assert.deepStrictEqual(outlierRows(viz, source), [["Outlier"]]);
  assert.deepStrictEqual(outlierRows(viz, other), []);
  assert.strictEqual(outlierSuffix(viz, source), " (Outlier)");
  assert.strictEqual(outlierSuffix(viz, other), "");
  assert.strictEqual(outlierAria(viz, source, 0), " Outlier.");
  // A line's aria label gets its merged row: its outliers' x values.
  assert.strictEqual(
    outlierAria(viz, {id: "a", x: 66, y: 0}, 0),
    " Outlier: 5.",
  );
  assert.strictEqual(outlierAria(viz, {id: "c", x: 1, y: 1}, 0), "");
  viz.outlierConfig({tooltip: false});
  assert.strictEqual(notedOutlier(viz, source), null);
  assert.deepStrictEqual(outlierRows(viz, source), []);
  assert.strictEqual(outlierAria(viz, source, 0), "");
  viz.locale("es-ES").outlierConfig({tooltip: true});
  assert.deepStrictEqual(outlierRows(viz, source), [["Valor atípico"]]);
});

it("appendOutlier: wraps the tooltip's rows once, adding the row for each hovered outlier", () => {
  const {viz} = line({outlier: true});
  const [[source]] = viz._plotOutliers;
  let tbody = [["x", "1"]];
  const tooltip = {
    tbody(_) {
      if (!arguments.length) return tbody;
      tbody = _;
      return this;
    },
  };
  appendOutlier(tooltip, viz);
  const wrapped = tbody;
  assert.deepStrictEqual(wrapped(source, 0), [["x", "1"], ["Outlier"]]);
  assert.deepStrictEqual(wrapped(series[0], 0), [["x", "1"]]);
  appendOutlier(tooltip, viz);
  assert.strictEqual(tbody, wrapped, "not wrapped twice");
  const plain = {tbody: () => "untouched"};
  viz._plotOutliers = new Map();
  assert.strictEqual(appendOutlier(plain, viz), plain);
});
