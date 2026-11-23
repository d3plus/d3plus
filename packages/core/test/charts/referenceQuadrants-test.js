import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  dashOf,
  referenceBandRect,
  referenceLabelNode,
  referenceLineNodes,
  referenceLinePoints,
  referenceLineSpan,
} from "../../src/charts/features/referenceAnnotations.ts";
import {
  expandQuadrants,
  QUADRANT_CORNERS,
  QUADRANTS,
  quadrantBoxes,
  quadrantLabelSpots,
  quadrantNodes,
} from "../../src/charts/features/referenceQuadrants.ts";
import {
  calloutAnchorRow,
  pickRow,
  resolveCalloutSelect,
  selectRows,
} from "../../src/charts/features/calloutSelect.ts";
import {
  calloutRowNodes,
  droplineNodes,
} from "../../src/charts/features/calloutScene.ts";

useJsdom();

// Quadrants, two-dimensional bands, partial reference lines, callouts that
// select their own rows, and droplines.

// A 400×300 plot at (40, 10): x 0..100 → 40..440, y 0..50 → 310..10.
const plot = {x0: 40, y0: 10, x1: 440, y1: 310};
const frame = {
  plot,
  axes: {
    x: {scale: scaleLinear().domain([0, 100]).range([40, 440])},
    y: {scale: scaleLinear().domain([0, 50]).range([310, 10])},
  },
};
const point = scalePoint().domain(["A", "B", "C", "D"]).range([90, 390]);
const bars = {
  plot,
  axes: {
    x: {scale: v => point(v) ?? NaN, categories: point.domain(), slots: true},
    y: frame.axes.y,
  },
};
const block = {
  lines: ["Hi"],
  widths: [20],
  width: 20,
  height: 16,
  lineHeight: 16,
};

const data = [
  {id: "a", x: 10, y: 10},
  {id: "a", x: 30, y: 40},
  {id: "b", x: 20, y: 30},
  {id: "b", x: 60, y: 20},
];
const rows = data.map((d, i) => ({data: d, i, id: d.id, x: d.x, y: d.y}));

/** A LinePlot with `data` as its drawn rows. */
function chart() {
  const viz = new LinePlot().data(data).groupBy("id");
  viz._filteredData = data;
  viz._formattedData = rows;
  viz._drawLabel = d => d.id;
  return viz;
}

it("referenceLineSpan: from/to on the other axis, else the plot's edges", () => {
  assert.deepStrictEqual(referenceLineSpan(frame, "y", {y: 5}), [40, 440]);
  assert.deepStrictEqual(
    referenceLineSpan(frame, "y", {y: 5, from: 25, to: 50}),
    [140, 240],
  );
  assert.deepStrictEqual(
    referenceLineSpan(frame, "y", {y: 5, from: 50}),
    [240, 440],
    "from to the right edge",
  );
  assert.deepStrictEqual(
    referenceLineSpan(frame, "x", {x: 5, to: 25}),
    [160, 310],
    "from the bottom up to 25",
  );
  assert.deepStrictEqual(
    referenceLineSpan(frame, "y", {y: 5, from: -50, to: 200}),
    [40, 440],
    "clipped",
  );
  assert.deepStrictEqual(
    referenceLineSpan(bars, "y", {y: 5, from: "B", to: "C"}),
    [140, 340],
    "each end category's whole slot",
  );
  assert.deepStrictEqual(
    referenceLineSpan(frame, "y", {y: 5, from: 0.5, ref: "plot"}),
    [240, 440],
  );
  assert.strictEqual(referenceLineSpan(bars, "y", {y: 5, from: "Z"}), null);
});

it("referenceLinePoints: a partial line's points", () => {
  assert.deepStrictEqual(
    referenceLinePoints(frame, {y: 25, from: 25, to: 50}).points,
    [
      [140, 160],
      [240, 160],
    ],
  );
  assert.deepStrictEqual(
    referenceLinePoints(frame, {x: 50, from: 10, to: 20}).points,
    [
      [240, 250],
      [240, 190],
    ],
  );
});

it("referenceLineNodes: a partial line's label keeps to its span", () => {
  const viz = new LinePlot();
  const nodes = referenceLineNodes(
    viz,
    {shape: "ReferenceLine", y: 25, from: 25, to: 50, label: "Goal"},
    frame,
    "r",
  );
  const label = nodes.find(n => n.type === "text");
  const x = label.transform.x;
  assert.ok(x <= 240 && x >= 140, `label at ${x}`);
});

it("referenceBandRect: both an x and a y span shade a rectangle", () => {
  assert.deepStrictEqual(referenceBandRect(frame, {x: [25, 50], y: [10, 20]}), {
    axis: "x",
    box: {x: 140, y: 190, width: 100, height: 60},
  });
  const {box} = referenceBandRect(frame, {x: [75, 150], y: [40, 80]});
  assert.deepStrictEqual(
    [box.x, box.y, box.width, Math.round(box.height)],
    [340, 10, 100, 60],
    "clipped on both axes",
  );
  assert.strictEqual(
    referenceBandRect(frame, {x: [25, 50], y: [60, 80]}),
    null,
    "off the plot on one axis",
  );
});

it("dashOf: true is 4 4, false none, else the pattern", () => {
  assert.deepStrictEqual(dashOf({shape: "x", dash: true}), [4, 4]);
  assert.strictEqual(dashOf({shape: "x", dash: false}), undefined);
  assert.deepStrictEqual(dashOf({shape: "x", dash: "6 2"}), [6, 2]);
});

it("referenceLabelNode: the label at its first spot, or null without one", () => {
  const viz = new LinePlot();
  const spots = [{x: 50, y: 60, align: "start"}];
  const node = referenceLabelNode(
    viz,
    {shape: "x", label: "Hi"},
    "k",
    () => spots,
  );
  assert.strictEqual(node.key, "k");
  assert.deepStrictEqual(node.transform, {x: 50, y: 60});
  assert.strictEqual(
    referenceLabelNode(viz, {shape: "x", label: false}, "k", () => spots),
    null,
  );
});

it("expandQuadrants: centered on the means by default", () => {
  const viz = chart();
  assert.deepStrictEqual(expandQuadrants(viz, false), []);
  const [q] = expandQuadrants(viz, true);
  assert.strictEqual(q.shape, QUADRANTS);
  assert.strictEqual(q.layer, "back");
  assert.deepStrictEqual([q.x, q.y], [30, 25]);
  const [m] = expandQuadrants(viz, {x: "median", y: 0, layer: "front"});
  assert.deepStrictEqual([m.x, m.y, m.layer], [25, 0, "front"]);
  const [p] = expandQuadrants(viz, {ref: "plot"});
  assert.deepStrictEqual([p.x, p.y], [0.5, 0.5]);
  viz._filteredData = [];
  assert.deepStrictEqual(expandQuadrants(viz, true), [], "no rows, no mean");
});

it("quadrantBoxes: four rects around the center, clamped to the plot", () => {
  const boxes = quadrantBoxes(plot, [140, 110]);
  assert.deepStrictEqual(boxes.topLeft, {
    x: 40,
    y: 10,
    width: 100,
    height: 100,
  });
  assert.deepStrictEqual(boxes.bottomRight, {
    x: 140,
    y: 110,
    width: 300,
    height: 200,
  });
  assert.strictEqual(quadrantBoxes(plot, [0, 110]).topLeft.width, 0);
  assert.deepStrictEqual(QUADRANT_CORNERS, [
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight",
  ]);
});

it("quadrantLabelSpots: the outer corner first", () => {
  const box = {x: 140, y: 110, width: 300, height: 200};
  const [first, second, third] = quadrantLabelSpots(box, "bottomRight", block);
  assert.deepStrictEqual(first, {x: 436, y: 290, align: "end"});
  assert.deepStrictEqual(second, {x: 144, y: 290, align: "start"});
  assert.deepStrictEqual(third, {x: 436, y: 114, align: "end"});
  assert.deepStrictEqual(quadrantLabelSpots(box, "topLeft", block)[0], {
    x: 144,
    y: 114,
    align: "start",
  });
});

it("quadrantNodes: fills, two dividers, and corner labels", () => {
  const viz = new LinePlot();
  const nodes = quadrantNodes(
    viz,
    {
      shape: QUADRANTS,
      x: 25,
      y: 40,
      fill: "#000000",
      topRight: {label: "Stars", fill: "#00ff00", fillOpacity: 0.2},
      bottomLeft: {label: "Dogs"},
      dash: true,
    },
    frame,
    "q",
  );
  const rects = nodes.filter(n => n.type === "rect");
  assert.strictEqual(rects.length, 4);
  const tr = rects.find(n => n.key === "q-topRight");
  assert.deepStrictEqual(
    [tr.x, tr.y, tr.width, Math.round(tr.height)].concat([
      tr.paint.fill,
      tr.paint.fillOpacity,
    ]),
    [140, 10, 300, 60, "#00ff00", 0.2],
  );
  assert.strictEqual(
    rects.find(n => n.key === "q-topLeft").paint.fillOpacity,
    0.08,
  );
  const lines = nodes.filter(n => n.type === "line");
  assert.strictEqual(lines.length, 2);
  assert.deepStrictEqual(lines[0].paint.strokeDasharray, [4, 4]);
  const labels = nodes.filter(n => n.type === "text");
  assert.deepStrictEqual(
    labels.map(n => n.key),
    ["q-topRight-label", "q-bottomLeft-label"],
  );
  assert.deepStrictEqual(
    quadrantNodes(viz, {shape: QUADRANTS, x: "Z", y: 1}, frame, "q"),
    [],
  );
  assert.strictEqual(
    quadrantNodes(viz, {shape: QUADRANTS, x: 25, y: 40}, frame, "q").filter(
      n => n.type === "rect",
    ).length,
    0,
    "no fill unless set",
  );
});

it("pickRow: max/min on the value axis, first/last along the other", () => {
  assert.strictEqual(pickRow(rows, "max")[0], rows[1]);
  assert.strictEqual(pickRow(rows, "min")[0], rows[0]);
  assert.strictEqual(pickRow(rows, "last")[0], rows[3]);
  assert.strictEqual(pickRow(rows, "first")[0], rows[0]);
  assert.strictEqual(pickRow(rows, "max", "y")[0], rows[3], "horizontal");
  const cats = ["B", "A", "C"].map((x, i) => ({data: {}, i, id: x, x, y: i}));
  assert.strictEqual(pickRow(cats, "last")[0], cats[2], "drawn order");
  assert.deepStrictEqual(pickRow([], "max"), []);
});

it("calloutAnchorRow: the drawn values, series, and data row", () => {
  assert.deepStrictEqual(calloutAnchorRow(rows[2]), {
    data: data[2],
    i: 2,
    id: "b",
    x: 20,
    y: 30,
  });
  const y2 = {data: {}, i: 0, id: "a", x: 1, y2: 5};
  assert.deepStrictEqual(Object.keys(calloutAnchorRow(y2)), [
    "data",
    "i",
    "id",
    "x",
    "y2",
  ]);
});

it("selectRows: a keyword's row, or the rows a function returns", () => {
  const viz = chart();
  assert.deepStrictEqual(selectRows(viz, rows, "max"), [rows[1]]);
  assert.deepStrictEqual(
    selectRows(viz, rows, r => r.filter(d => d.x > 15)),
    [rows[1], rows[2], rows[3]],
  );
  assert.deepStrictEqual(
    selectRows(viz, rows, () => [{}]),
    [],
  );
  assert.deepStrictEqual(selectRows(viz, rows, "middle"), []);
});

it("resolveCalloutSelect: anchors at the picked rows, per series too", () => {
  const viz = chart();
  const plain = {shape: "Callout", data: [{x: 1, y: 1, label: "x"}]};
  assert.strictEqual(resolveCalloutSelect(viz, plain), plain);
  const one = resolveCalloutSelect(viz, {shape: "Callout", select: "max"});
  assert.deepStrictEqual(
    one.data.map(d => [d.x, d.y]),
    [[30, 40]],
  );
  assert.strictEqual(one.label(one.data[0]), "a", "the series label");
  const each = resolveCalloutSelect(viz, {
    shape: "Callout",
    select: "last",
    perSeries: true,
    label: "End",
  });
  assert.deepStrictEqual(
    each.data.map(d => d.x),
    [30, 60],
  );
  assert.strictEqual(each.label, "End");
});

it("droplineNodes: lines from the anchor to its axes", () => {
  const pick = setting => key =>
    key === "dropline" ? setting : key === "droplineStroke" ? "red" : undefined;
  const row = {d: {x: 50, y: 25}, key: "c"};
  const anchor = [240, 160];
  assert.deepStrictEqual(
    droplineNodes(pick(false), plot, row, anchor, "#000"),
    [],
  );
  const [down] = droplineNodes(pick(true), plot, row, anchor, "#000");
  assert.deepStrictEqual(down.points, [
    [240, 160],
    [240, 310],
  ]);
  assert.strictEqual(down.paint.stroke, "red");
  assert.deepStrictEqual(down.paint.strokeDasharray, [4, 2]);
  assert.strictEqual(down.paint.strokeOpacity, 0.5);
  const both = droplineNodes(pick("both"), plot, row, anchor, "#000");
  assert.deepStrictEqual(
    both.map(n => n.points[1]),
    [
      [240, 310],
      [40, 160],
    ],
  );
  const secondary = droplineNodes(
    pick("both"),
    plot,
    {d: {x2: 50, y2: 25}, key: "c"},
    anchor,
    "#000",
  );
  assert.deepStrictEqual(
    secondary.map(n => n.points[1]),
    [
      [240, 10],
      [440, 160],
    ],
    "to the top and right axes",
  );
});

it("calloutRowNodes: droplines draw first, behind the connector", () => {
  const viz = new LinePlot();
  const nodes = calloutRowNodes(viz, {shape: "Callout", dropline: "y"}, frame, {
    d: {x: 50, y: 25, label: "Hi"},
    i: 0,
    key: "c-0",
  });
  assert.strictEqual(nodes[0].key, "c-0-dropline-y");
  assert.ok(nodes.some(n => n.key === "c-0-connector"));
});
