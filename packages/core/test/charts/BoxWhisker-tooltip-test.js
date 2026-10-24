import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BoxWhisker} from "../../index.ts";
import {
  boxTooltipRows,
  chartWhiskerMode,
  drawnBoxStats,
  noteDrawnBoxes,
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
    assert.deepStrictEqual(drawnBoxStats(new BoxWhisker(), row), {
      first: 78.5,
      median: 145,
      third: 172.5,
      lowerLimit: 20,
      upperLimit: 313.5,
    });
  }
});

it("boxTooltipRows: a computed box lists its whiskers, quartiles, and median", () => {
  const {row, box, nodes} = drawnBox();
  noteDrawnBoxes(nodes);
  const viz = new BoxWhisker();
  const expected = [
    ["Upper Whisker", "314"],
    ["Upper Quartile", "173"],
    ["Median", "145"],
    ["Lower Quartile", "78.5"],
    ["Lower Whisker", "20"],
  ];
  assert.deepStrictEqual(boxTooltipRows(viz, row, 0), expected);
  assert.deepStrictEqual(boxTooltipRows(viz, box, 0), expected);
  // An outlier's observation isn't a box.
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
    ["Upper Whisker", "Upper Quartile", "Median", "Lower Quartile", "Minimum"],
  );
  viz.shapeConfig({Box: {whiskerMode: "extent"}});
  assert.deepStrictEqual(boxTooltipRows(viz, row, 0)[0], ["Maximum", "900"]);
  viz.locale("es-ES").shapeConfig({Box: {whiskerMode: "tukey"}});
  assert.deepStrictEqual(boxTooltipRows(viz, row, 0)[0][0], "Bigote Superior");
});
