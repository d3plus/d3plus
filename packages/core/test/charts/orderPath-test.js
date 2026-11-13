import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  DATA_ORDER,
  coerceOrder,
  compareOrder,
  endLabelSpot,
  keepOrderField,
  orderOf,
  orderedPointKeys,
  orderedSeries,
  segmentArrows,
  sortByOrder,
} from "../../src/charts/Plot/orderPath.ts";
import {
  ORDER_POINT_SHAPES,
  orderTooltipRows,
  orderValueText,
  seriesStrokes,
} from "../../src/charts/Plot/orderPathScene.ts";
import {computeFilteredData} from "../../src/charts/pipeline/preDrawData.ts";
import ConnectedScatter, {
  connectedScatterDef,
} from "../../src/charts/ConnectedScatter/index.ts";
import Scatter from "../../src/charts/Scatter/index.ts";

useJsdom();

/** A formatted Plot row for `data` at index `i`. */
const row = (data, i, extra = {}) => ({data, i, id: data.id, ...extra});

it("coerceOrder / orderOf: a key or function, else no path", () => {
  assert.strictEqual(coerceOrder("year")({year: 2004}), 2004);
  const fn = d => d.t;
  assert.strictEqual(coerceOrder(fn), fn);
  assert.strictEqual(coerceOrder(undefined), undefined);
  assert.strictEqual(coerceOrder(false), undefined);
  assert.strictEqual(orderOf({schema: {order: fn}}), fn);
  assert.strictEqual(orderOf({schema: {order: "year"}}), undefined);
  assert.strictEqual(DATA_ORDER({}, 4), 4);
});

it("compareOrder: numbers, numeric strings, and dates by value; missing last", () => {
  const sorted = [10, "9", 2, null, "b", "a", undefined, NaN].sort(
    compareOrder,
  );
  assert.deepStrictEqual(sorted.slice(0, 6), [2, "9", 10, "a", "b", null]);
  assert.ok(compareOrder(new Date(2001, 0), new Date(2000, 0)) > 0);
  assert.strictEqual(compareOrder(undefined, null), 0);
});

it("sortByOrder / orderedSeries: path order per series, ties keep theirs", () => {
  const rows = [
    row({id: "a", year: 2002, k: 1}, 0),
    row({id: "b", year: 2000}, 1),
    row({id: "a", year: 2000}, 2),
    row({id: "a", year: 2002, k: 2}, 3),
  ];
  const year = d => d.year;
  assert.deepStrictEqual(
    sortByOrder(rows, year).map(r => r.i),
    [1, 2, 0, 3],
  );
  assert.deepStrictEqual(
    sortByOrder([rows[3], rows[0]], DATA_ORDER).map(r => r.i),
    [0, 3],
    "data order sorts by row index",
  );
  const series = orderedSeries(rows, year);
  assert.deepStrictEqual([...series.keys()], ["a", "b"]);
  assert.deepStrictEqual(
    series.get("a").map(r => r.i),
    [2, 0, 3],
  );
});

it("orderedPointKeys: series and order value, numbered on repeats", () => {
  const rows = [
    row({id: "a", year: 2000}, 0, {x: 1, y: 2}),
    row({id: "a", year: 2001}, 1, {x: 3, y: 4}),
    row({id: "a", year: 2001}, 2, {x: 5, y: 6}),
    row({id: "a", year: new Date(2002, 0, 1)}, 3, {x: 7, y: 8}),
  ];
  const keys = orderedPointKeys(rows, d => d.year);
  assert.deepStrictEqual(
    rows.map(r => keys.get(r)),
    ["a_2000", "a_2001", "a_2001_1", `a_${new Date(2002, 0, 1).getTime()}`],
  );
  const byPosition = orderedPointKeys(rows.slice(0, 2), DATA_ORDER);
  assert.deepStrictEqual(
    rows.slice(0, 2).map(r => byPosition.get(r)),
    ["a_1_2", "a_3_4"],
  );
});

it("segmentArrows: one centered arrow per segment with room", () => {
  const arrows = segmentArrows(
    [
      [0, 0],
      [100, 0],
      [100, 10],
      [100, 110],
    ],
    6,
    [5, 5, 5, 5],
  );
  assert.deepStrictEqual(
    arrows.map(a => a.segment),
    [0, 2],
    "the 10px segment is skipped",
  );
  assert.ok(Math.abs(arrows[0].x - 53) < 1e-9 && arrows[0].y === 0);
  assert.strictEqual(arrows[0].angle, 0);
  assert.ok(Math.abs(arrows[1].angle - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(arrows[1].y - 63) < 1e-9);
  assert.deepStrictEqual(segmentArrows([[0, 0]], 6), []);
  assert.strictEqual(
    segmentArrows(
      [
        [0, 0],
        [30, 0],
      ],
      6,
    ).length,
    1,
  );
});

it("endLabelSpot: past the mark, away from the path, inside the bounds", () => {
  const right = endLabelSpot([100, 100], [50, 100], 5, 30, 10);
  assert.strictEqual(right.anchor, "start");
  assert.ok(right.d.startsWith("M109,103.5"));
  const left = endLabelSpot([100, 100], [150, 110], 5, 30, 10);
  assert.strictEqual(left.anchor, "end");
  assert.ok(left.d.endsWith("L91,103.5"));
  const above = endLabelSpot([100, 100], [100, 160], 5, 30, 10);
  assert.strictEqual(above.anchor, "middle");
  assert.ok(above.d.startsWith("M84,91"));
  const below = endLabelSpot([100, 100], [100, 40], 0, 30, 10);
  assert.ok(below.d.startsWith("M84,111.5"));
  assert.strictEqual(
    endLabelSpot([0, 0], undefined, 0, 10, 10).anchor,
    "start",
  );
  // Running out of the right edge, it moves above the point.
  const kept = endLabelSpot(
    [190, 100],
    [150, 100],
    5,
    30,
    10,
    [0, 200, 0, 200],
  );
  assert.strictEqual(kept.anchor, "end", "or to its left");
});

it("orderValueText: years as is, other numbers abbreviated, dates as dates", () => {
  assert.strictEqual(orderValueText(2004, [], "en-US"), "2004");
  assert.strictEqual(orderValueText(1234567, [], "en-US"), "1.23M");
  assert.strictEqual(orderValueText("Q3", [], "en-US"), "Q3");
  assert.strictEqual(orderValueText(null, [], "en-US"), "");
  const jan = new Date(2004, 0, 1);
  assert.strictEqual(orderValueText(jan, [jan], "en-US"), "2004");
});

it("seriesStrokes: each series' line color and width", () => {
  const strokes = seriesStrokes([
    {
      type: "group",
      key: "g",
      children: [
        {
          type: "path",
          key: "a",
          shapeType: "Line",
          datum: {key: "a"},
          paint: {stroke: "#f00", strokeWidth: 2},
        },
        {
          type: "path",
          key: "a::hit",
          shapeType: "Line",
          datum: {key: "a"},
          paint: {stroke: "transparent"},
        },
        {type: "circle", key: "c", shapeType: "Circle", paint: {}},
      ],
    },
  ]);
  assert.deepStrictEqual([...strokes], [["a", {stroke: "#f00", width: 2}]]);
  assert.deepStrictEqual(ORDER_POINT_SHAPES, ["Circle", "Rect"]);
});

it("orderTooltipRows: the hovered point's order field", () => {
  const viz = new ConnectedScatter().order("year");
  const point = {id: "a", year: 2004};
  const wrapped = {__d3plus__: true, data: point, i: 0};
  assert.deepStrictEqual(orderTooltipRows(viz, wrapped, 0), [["year", "2004"]]);
  assert.deepStrictEqual(
    orderTooltipRows(viz, {id: "a", year: [2004, 2006]}, 0),
    [],
    "a series' merged datum has no single step",
  );
  assert.deepStrictEqual(
    orderTooltipRows(new ConnectedScatter(), wrapped, 0),
    [],
    "data order names no field",
  );
  assert.deepStrictEqual(orderTooltipRows(new Scatter(), wrapped, 0), []);
});

it("ConnectedScatter: data order by default, with arrows and labels", () => {
  const viz = new ConnectedScatter();
  assert.strictEqual(viz.order(), DATA_ORDER);
  assert.strictEqual(viz.pathArrows(), true);
  assert.strictEqual(viz.pathLabels(), true);
  assert.strictEqual(connectedScatterDef.name, "ConnectedScatter");
  assert.strictEqual(new Scatter().order(), undefined);
});

it("computeFilteredData: an order keeps each step's rows apart", () => {
  const data = [
    {id: "a", year: 2000, x: 1, y: 1},
    {id: "a", year: 2001, x: 2, y: 2},
    {id: "a", year: 2001, x: 3, y: 3},
  ];
  const run = viz => {
    const out = {};
    viz.data(data);
    computeFilteredData(viz, out, 0, d => d.id, undefined);
    return out.filteredData;
  };
  assert.strictEqual(
    run(new Scatter().groupBy("id")).length,
    1,
    "without order, a series merges",
  );
  const scatter = new Scatter().groupBy("id").order("year");
  keepOrderField(scatter);
  const ordered = run(scatter);
  assert.deepStrictEqual(
    ordered.map(d => [d.year, d.x]),
    [
      [2000, 1],
      [2001, 5],
    ],
    "rows sharing a step aggregate",
  );
  assert.strictEqual(
    run(new ConnectedScatter().groupBy("id")).length,
    3,
    "data order keeps every row",
  );
});
