import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BoxWhisker} from "../../index.ts";
import {
  boxTooltipRows,
  chartWhiskerMode,
  drawnBoxStats,
  noteDrawnBoxes,
  isObservation,
  observationRows,
  sourceRow,
} from "../../src/charts/BoxWhisker/tooltip.ts";

useJsdom();

/**
    BoxWhisker's tooltip rows: a box computed from observations lists its
    whisker ends, quartiles, and median in data units, labeled Maximum and
    Minimum only when its whiskers reach the extreme values.
*/

const observations = [300, 150, 160, 140, 20, 180, 40, 170, 125, 74, 80, 900];

/** A drawn raw box (as Box records it) and a scene node it drew. */
function drawnBox({vertical = true} = {}) {
  const row = {id: "alpha"};
  const values = observations.map((v, i) => ({
    __d3plus__: true,
    data: {id: "alpha", value: v},
    i,
    x: vertical ? "alpha" : v,
    y: vertical ? v : "alpha",
  }));
  const box = {
    __d3plus__: true,
    data: {__d3plus__: true, data: row, i: 0},
    i: 0,
    orient: vertical ? "vertical" : "horizontal",
    values,
  };
  const nodes = [
    {
      type: "group",
      key: "g",
      children: [
        {
          type: "rect",
          key: "alpha-box",
          owners: [{shapeType: "Box", datum: box, index: 0}],
        },
      ],
    },
  ];
  return {row, box, nodes};
}

it("sourceRow: follows the wrappers to the source row and its index", () => {
  const row = {id: "a"};
  assert.deepStrictEqual(
    sourceRow(
      {__d3plus__: true, data: {__d3plus__: true, data: row, i: 3}, i: 0},
      9,
    ),
    [row, 3],
  );
  assert.deepStrictEqual(sourceRow(row, 2), [row, 2]);
});

it("noteDrawnBoxes: records each Box owner by its source row, returning the nodes", () => {
  const {row, box, nodes} = drawnBox();
  assert.strictEqual(noteDrawnBoxes(nodes), nodes);
  const s = drawnBoxStats(new BoxWhisker(), row);
  assert.ok(s, "found the box");
  assert.strictEqual(drawnBoxStats(new BoxWhisker(), {id: "other"}), null);
  assert.strictEqual(box.values.length, 12);
});

it("chartWhiskerMode: shapeConfig.Box, then shapeConfig, then Tukey", () => {
  assert.deepStrictEqual(chartWhiskerMode(new BoxWhisker()), [
    "tukey",
    "tukey",
  ]);
  assert.deepStrictEqual(
    chartWhiskerMode(new BoxWhisker().shapeConfig({whiskerMode: "extent"})),
    ["extent", "extent"],
  );
  assert.deepStrictEqual(
    chartWhiskerMode(
      new BoxWhisker().shapeConfig({
        whiskerMode: "extent",
        Box: {whiskerMode: [0.1, "extent"]},
      }),
    ),
    [0.1, "extent"],
  );
});

it("drawnBoxStats: recomputes in data units from the box's observations", () => {
  for (const vertical of [true, false]) {
    const {row, nodes} = drawnBox({vertical});
    noteDrawnBoxes(nodes);
    const stats = drawnBoxStats(new BoxWhisker(), row);
    assert.deepStrictEqual(
      {...stats, mean: +stats.mean.toFixed(4), notch: undefined},
      {
        first: 78.5,
        median: 145,
        third: 172.5,
        lowerLimit: 20,
        upperLimit: 313.5,
        mean: 194.9167,
        count: 12,
        notch: undefined,
      },
    );
    // median ± 1.58 · IQR / √n
    const half = (1.58 * (172.5 - 78.5)) / Math.sqrt(12);
    assert.deepStrictEqual(
      stats.notch.map(v => +v.toFixed(6)),
      [145 - half, 145 + half].map(v => +v.toFixed(6)),
    );
  }
});

it("boxTooltipRows: a computed box lists its whiskers, quartiles, and median", () => {
  const {row, box, nodes} = drawnBox();
  noteDrawnBoxes(nodes);
  const viz = new BoxWhisker();
  const expected = [
    ["Upper Whisker", "314"],
    // The mean sits among the statistics by value.
    ["Mean", "195"],
    ["Upper Quartile", "173"],
    ["Median", "145"],
    ["Lower Quartile", "78.5"],
    ["Lower Whisker", "20"],
  ];
  assert.deepStrictEqual(boxTooltipRows(viz, row, 0), expected);
  assert.deepStrictEqual(boxTooltipRows(viz, box, 0), expected);
  // An outlier's observation lists its own value (without a `y` key here, none).
  assert.deepStrictEqual(boxTooltipRows(viz, box.values[11].data, 11), []);
  assert.deepStrictEqual(boxTooltipRows(viz, undefined, 0), []);
});

it("boxTooltipRows: extent whiskers are the Maximum and Minimum", () => {
  const {row, nodes} = drawnBox();
  noteDrawnBoxes(nodes);
  const viz = new BoxWhisker().shapeConfig({
    Box: {whiskerMode: ["extent", 0.9]},
  });
  const rows = boxTooltipRows(viz, row, 0);
  assert.deepStrictEqual(
    rows.map(r => r[0]),
    [
      "Upper Whisker",
      "Mean",
      "Upper Quartile",
      "Median",
      "Lower Quartile",
      "Minimum",
    ],
  );
  viz.shapeConfig({Box: {whiskerMode: "extent"}});
  assert.deepStrictEqual(boxTooltipRows(viz, row, 0)[0], ["Maximum", "900"]);
  viz.locale("es-ES").shapeConfig({Box: {whiskerMode: "tukey"}});
  assert.deepStrictEqual(boxTooltipRows(viz, row, 0)[0][0], "Bigote Superior");
});

it("boxTooltipRows: lists the mean, notch, and count only when the chart draws them", () => {
  const {row, nodes} = drawnBox();
  noteDrawnBoxes(nodes);
  const viz = new BoxWhisker().boxMean(false);
  const labels = () => boxTooltipRows(viz, row, 0).map(r => r[0]);
  assert.ok(!labels().includes("Mean"));
  viz.boxNotch(true);
  assert.deepStrictEqual(labels().slice(2, 4), ["Median", "Notch"]);
  const notch = boxTooltipRows(viz, row, 0).find(r => r[0] === "Notch");
  assert.deepStrictEqual(notch, ["Notch", "102 – 188"]);
  viz.boxWidthByCount(true);
  assert.deepStrictEqual(boxTooltipRows(viz, row, 0).at(-1), [
    "Observations",
    "12",
  ]);
  viz.locale("es-ES");
  assert.ok(labels().includes("Muesca"));
});

it("boxTooltipRows: a precomputed box lists its given mean, and a notch from its count", () => {
  const viz = new BoxWhisker()
    .boxMin("min")
    .boxQ1("q1")
    .boxMedian("median")
    .boxQ3("q3")
    .boxMax("max")
    .boxMean("mean")
    .boxCount("n")
    .boxNotch(true);
  const row = {min: 0, q1: 10, median: 20, q3: 30, max: 50, mean: 24, n: 16};
  const rows = boxTooltipRows(viz, row, 0);
  assert.deepStrictEqual(
    rows.map(r => r[0]),
    [
      "Maximum",
      "Upper Quartile",
      "Mean",
      "Median",
      "Notch",
      "Lower Quartile",
      "Minimum",
    ],
  );
  // 20 ± 1.58 · 20 / 4
  assert.deepStrictEqual(rows[4], ["Notch", "12.1 – 27.9"]);
  // Without a count there is no notch, and `true` gives no precomputed mean.
  viz.boxCount(false).boxMean(true);
  assert.deepStrictEqual(
    boxTooltipRows(viz, row, 0).map(r => r[0]),
    ["Maximum", "Upper Quartile", "Median", "Lower Quartile", "Minimum"],
  );
});

it("observationRows / isObservation: an observation beside a computed box lists its value", () => {
  const {row, box, nodes} = drawnBox();
  noteDrawnBoxes(nodes);
  const viz = new BoxWhisker().groupBy("id").y("value");
  const source = box.values[2].data;
  const point = {__d3plus__: true, data: box.values[2], i: 2};
  for (const d of [point, source]) {
    assert.ok(isObservation(viz, d));
    assert.deepStrictEqual(observationRows(viz, d, 2), [["value", "160"]]);
  }
  assert.deepStrictEqual(boxTooltipRows(viz, source, 2), [["value", "160"]]);
  // A box lists its statistics instead.
  assert.ok(!isObservation(viz, row));
  assert.deepStrictEqual(observationRows(viz, box, 0), []);
  // Precomputed rows are boxes.
  const stats = new BoxWhisker()
    .boxMin("a")
    .boxQ1("a")
    .boxMedian("a")
    .boxQ3("a")
    .boxMax("a");
  assert.ok(!isObservation(stats, source));
  // The axis title names it when set.
  viz.yConfig({title: "Score"});
  assert.deepStrictEqual(observationRows(viz, source, 2), [["Score", "160"]]);
});
