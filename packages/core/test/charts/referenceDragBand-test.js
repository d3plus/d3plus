import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  fireReferenceEvent,
  lineDragTarget,
  referenceDragState,
  setReferenceValue,
} from "../../src/charts/features/referenceDrag.ts";
import {
  bandBody,
  bandDragTargets,
  dragShift,
  fireBodyEvent,
  keyShift,
  moveBody,
  spanShift,
} from "../../src/charts/features/referenceDragBand.ts";
import {
  BODY_CLASS,
  BODY_GRIP,
  bindBodyDrag,
  bodyGrip,
  bodyNodes,
  bodyUnder,
  keySpans,
  syncBody,
} from "../../src/charts/features/referenceDragBody.ts";
import {
  DRAG_SERIES,
  DRAG_SOURCE,
  listSource,
} from "../../src/charts/features/referenceDragSource.ts";
import {
  REFERENCE_BAND,
  REFERENCE_LINE,
  referenceBandNodes,
} from "../../src/charts/features/referenceAnnotations.ts";
import {resolveReferenceLine} from "../../src/charts/features/referenceValues.ts";

useJsdom();

// Dragging reference bands (each edge, crossing the other; the body,
// moving the whole band) and `perSeries` lines (each series on its own).

// A 400×300 plot at (40, 10): x 0..100 → 40..440, y 0..50 → 310..10.
const yScale = scaleLinear().domain([0, 50]).range([310, 10]);
const xScale = scaleLinear().domain([0, 100]).range([40, 440]);
const frame = {
  plot: {x0: 40, y0: 10, x1: 440, y1: 310},
  axes: {
    x: {scale: v => xScale(v), domain: [0, 100]},
    y: {scale: v => yScale(v), domain: [0, 50]},
  },
};

/** A LinePlot with `config`, its handlers `on`, counting repaints. */
function chart(config, on = {}) {
  const viz = new LinePlot().config(config);
  for (const [k, fn] of Object.entries(on)) viz.on(k, fn);
  viz._repaints = 0;
  viz._repaintPlot = () => ++viz._repaints;
  viz.render = () => {};
  return viz;
}

/** The chart's band `i` as an annotation carrying its source. */
const bandOf = (viz, i = 0, extra = {}) => ({
  shape: REFERENCE_BAND,
  ...viz.schema.referenceBands[i],
  [DRAG_SOURCE]: listSource(
    "referenceBand",
    "referenceBands",
    () => viz.schema.referenceBands,
    l => (viz.schema.referenceBands = l),
    i,
  ),
  ...extra,
});

const boxOf = ([y0, y1], [x0, x1] = [0, 100]) => ({
  x: xScale(x0),
  y: yScale(y1),
  width: xScale(x1) - xScale(x0),
  height: yScale(y0) - yScale(y1),
});

it("bandDragTargets: an edge per end in the plot, named by which end it is", () => {
  const viz = chart({
    referenceBands: [{y: [10, 30], label: "Target", draggable: true}],
  });
  const [low, high] = bandDragTargets(viz, bandOf(viz), frame, boxOf([10, 30]));
  assert.strictEqual(low.id, "referenceBands-0-y-0");
  assert.strictEqual(low.handleAt, yScale(10), "the bottom edge");
  assert.strictEqual(high.handleAt, yScale(30));
  assert.strictEqual(low.name, "Start of Target");
  assert.strictEqual(high.name, "End of Target");
  assert.strictEqual(low.other, 30);
  assert.strictEqual(low.meets, false);
  assert.deepStrictEqual(low.span, [40, 440]);
  assert.strictEqual(low.grip, "end", "away from the label at the start");
  const off = bandOf(viz, 0, {y: [10, 80]});
  assert.strictEqual(
    bandDragTargets(viz, off, frame, boxOf([10, 50])).length,
    1,
  );
  assert.deepStrictEqual(
    bandDragTargets(
      viz,
      {shape: REFERENCE_BAND, y: [1, 2]},
      frame,
      boxOf([1, 2]),
    ),
    [],
  );
});

it("setReferenceValue: a band edge dragged past the other crosses it, swapping ends", () => {
  const viz = chart({referenceBands: [{y: [10, 30], draggable: true}]});
  const [low] = bandDragTargets(viz, bandOf(viz), frame, boxOf([10, 30]));
  assert.ok(setReferenceValue(viz, low, 20));
  assert.deepStrictEqual(viz.referenceBands()[0].y, [20, 30]);
  assert.ok(!setReferenceValue(viz, low, 30), "never lands on the other end");
  assert.ok(setReferenceValue(viz, low, 40));
  assert.deepStrictEqual(viz.referenceBands()[0].y, [30, 40], "swapped");
  assert.strictEqual(low.edge, 1, "now the span's end");
  assert.ok(setReferenceValue(viz, low, 45));
  assert.deepStrictEqual(viz.referenceBands()[0].y, [30, 45]);
  // A span given high to low stays high to low.
  const down = chart({referenceBands: [{y: [30, 10], draggable: true}]});
  const [top] = bandDragTargets(down, bandOf(down), frame, boxOf([10, 30]));
  setReferenceValue(down, top, 5);
  assert.deepStrictEqual(down.referenceBands()[0].y, [10, 5]);
});

it("bandDragTargets: on a category axis of bars, both ends may share a category", () => {
  const cats = scalePoint().domain(["a", "b", "c"]).range([40, 440]);
  const categoryFrame = {
    ...frame,
    axes: {x: {scale: cats, categories: cats.domain(), slots: true}},
  };
  const viz = chart({referenceBands: [{x: ["a", "b"], draggable: true}]});
  const [start] = bandDragTargets(viz, bandOf(viz), categoryFrame, {
    x: 40,
    y: 10,
    width: 200,
    height: 300,
  });
  assert.ok(start.meets);
  assert.ok(setReferenceValue(viz, start, 1));
  assert.deepStrictEqual(viz.referenceBands()[0].x, ["b", "b"]);
});

it("bandBody: the spans a band's body moves, with its name and text", () => {
  const viz = chart({
    referenceBands: [
      {y: [10, 30], x: [20, 40], label: "Zone", draggable: {step: 1}},
    ],
  });
  const body = bandBody(viz, bandOf(viz), frame, boxOf([10, 30], [20, 40]));
  assert.strictEqual(body.id, "referenceBands-0-body");
  assert.deepStrictEqual(
    body.spans.map(s => s.axis),
    ["x", "y"],
  );
  assert.deepStrictEqual(body.spans[1].values, [10, 30]);
  assert.deepStrictEqual(body.spans[1].at, [yScale(10), yScale(30)]);
  assert.strictEqual(body.name, "Move Zone");
  assert.strictEqual(body.text, "x: 20 – 40, y: 10 – 30");
  assert.strictEqual(referenceDragState(viz).bodies.get(body.id), body);
  const one = chart({referenceBands: [{y: [30, 10], draggable: true}]});
  assert.strictEqual(
    bandBody(one, bandOf(one), frame, boxOf([10, 30])).text,
    "10 – 30",
  );
  assert.strictEqual(
    bandBody(one, {shape: REFERENCE_BAND, y: [1, 2]}, frame, boxOf([1, 2])),
    null,
  );
});

it("spanShift, dragShift, keyShift: moves that keep both ends in range", () => {
  const viz = chart({referenceBands: [{y: [10, 30], draggable: {step: 1}}]});
  const [span] = bandBody(viz, bandOf(viz), frame, boxOf([10, 30])).spans;
  assert.strictEqual(spanShift(span, 15), 5);
  assert.strictEqual(spanShift(span, 45), 20, "the top end stops at 50");
  assert.strictEqual(spanShift(span, -5), -10, "the bottom end stops at 0");
  assert.strictEqual(spanShift(span, NaN), 0);
  // 30px up is 5 units.
  assert.strictEqual(dragShift(span, -30), 5);
  assert.strictEqual(keyShift(span, "ArrowUp"), 1);
  assert.strictEqual(keyShift(span, "PageDown"), -10);
  assert.strictEqual(keyShift(span, "Home"), -10);
  assert.strictEqual(keyShift(span, "End"), 20);
  assert.strictEqual(keyShift(span, "Enter"), null);
});

it("moveBody: writes both ends of each span, fires drag.referenceBand, and repaints", () => {
  const events = [];
  const viz = chart(
    {referenceBands: [{y: [30, 10], x: [20, 40], draggable: true}]},
    {"drag.referenceBand": (...args) => events.push(args)},
  );
  const body = bandBody(viz, bandOf(viz), frame, boxOf([10, 30], [20, 40]));
  const from = body.spans.map(s => s.values.slice());
  assert.ok(moveBody(viz, body, from, {y: 5}));
  assert.deepStrictEqual(viz.referenceBands()[0].y, [35, 15], "order kept");
  assert.deepStrictEqual(viz.referenceBands()[0].x, [20, 40], "x unmoved");
  assert.deepStrictEqual(events[0][0], {x: [20, 40], y: [35, 15]});
  assert.strictEqual(events[0][2], 0);
  assert.strictEqual(viz._repaints, 1);
  assert.strictEqual(body.text, "x: 20 – 40, y: 15 – 35");
  assert.ok(!moveBody(viz, body, from, {y: 5}), "already there");
  const one = chart(
    {referenceBands: [{y: [10, 30], draggable: true}]},
    {"end.referenceBand": (...args) => events.push(args)},
  );
  const oneBody = bandBody(one, bandOf(one), frame, boxOf([10, 30]));
  fireBodyEvent(one, "end", oneBody);
  assert.deepStrictEqual(events.at(-1)[0], [10, 30], "one span: the span");
});

it("keySpans: up and down move the vertical span, left and right the horizontal", () => {
  const viz = chart({
    referenceBands: [{y: [10, 30], x: [20, 40], draggable: true}],
  });
  const body = bandBody(viz, bandOf(viz), frame, boxOf([10, 30], [20, 40]));
  assert.deepStrictEqual(
    keySpans(body, "ArrowUp").map(s => s.axis),
    ["y"],
  );
  assert.deepStrictEqual(
    keySpans(body, "ArrowLeft").map(s => s.axis),
    ["x"],
  );
  assert.deepStrictEqual(
    keySpans(body, "Home").map(s => s.axis),
    ["x", "y"],
  );
  const one = chart({referenceBands: [{y: [10, 30], draggable: true}]});
  const oneBody = bandBody(one, bandOf(one), frame, boxOf([10, 30]));
  assert.deepStrictEqual(
    keySpans(oneBody, "ArrowRight").map(s => s.axis),
    ["y"],
  );
});

it("syncBody, bodyGrip, bodyNodes: a slider over the band and a knob at its center", () => {
  const viz = chart({referenceBands: [{y: [10, 30], draggable: true}]});
  const box = boxOf([10, 30]);
  const body = bandBody(viz, bandOf(viz), frame, box);
  const [grip, overlay] = bodyNodes(viz, body, "red", "b");
  assert.strictEqual(overlay.type, "htmlOverlay");
  assert.strictEqual(overlay.key, "reference-drag-referenceBands-0-body");
  assert.deepStrictEqual(
    [overlay.x, overlay.y, overlay.width, overlay.height],
    [box.x, box.y, box.width, box.height],
  );
  assert.strictEqual(
    overlay.style.pointerEvents,
    "none",
    "hover passes through",
  );
  assert.match(overlay.html, /role="slider"/);
  const el = document.createElement("div");
  el.innerHTML = `<div class="${BODY_CLASS}"></div>`;
  syncBody(el, body);
  assert.strictEqual(body.el, el);
  assert.strictEqual(
    el.firstChild.getAttribute("aria-label"),
    "Move Reference band",
  );
  assert.strictEqual(el.firstChild.getAttribute("aria-valuetext"), "10 – 30");
  assert.strictEqual(grip.key, "b-body-grip");
  const [knob, ...arms] = grip.children;
  assert.strictEqual(knob.width, BODY_GRIP);
  assert.strictEqual(knob.x + BODY_GRIP / 2, box.x + box.width / 2);
  assert.strictEqual(arms.length, 2);
  assert.strictEqual(
    bodyGrip(viz, body, "red", true, "b").children[0].paint.strokeWidth,
    2,
  );
});

it("bodyUnder and bindBodyDrag: a press inside a body's box, not on an overlay", () => {
  const viz = chart({referenceBands: [{y: [10, 30], draggable: true}]});
  const body = bandBody(viz, bandOf(viz), frame, boxOf([10, 30]));
  body.el = {
    getBoundingClientRect: () => ({left: 0, right: 100, top: 0, bottom: 50}),
  };
  const press = (x, y, target = document.body) => ({
    clientX: x,
    clientY: y,
    target,
  });
  assert.strictEqual(bodyUnder(viz, press(50, 20)), body);
  assert.strictEqual(bodyUnder(viz, press(150, 20)), null);
  const overlays = document.createElement("div");
  overlays.className = "d3plus-render-overlays";
  const handle = document.createElement("div");
  overlays.append(handle);
  assert.strictEqual(bodyUnder(viz, press(50, 20, handle)), null);
  const host = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  host.append(svg);
  viz._select = {node: () => svg};
  bindBodyDrag(viz);
  const binding = viz.ctx.referenceBodyBinding;
  assert.strictEqual(binding.host, host);
  bindBodyDrag(viz);
  assert.strictEqual(viz.ctx.referenceBodyBinding, binding, "bound once");
});

it("referenceBandNodes: a draggable band has a body and a grip and handle per edge", () => {
  const viz = chart({referenceBands: [{y: [10, 30], draggable: true}]});
  const nodes = referenceBandNodes(viz, bandOf(viz), frame, "b");
  assert.deepStrictEqual(
    nodes.map(n => n.type),
    [
      "rect",
      "group",
      "htmlOverlay",
      "group",
      "htmlOverlay",
      "group",
      "htmlOverlay",
    ],
  );
  assert.strictEqual(nodes[0].paint.fillOpacity, 0.08);
  referenceDragState(viz).focus = "referenceBands-0-body";
  const [lit] = referenceBandNodes(viz, bandOf(viz), frame, "b");
  assert.strictEqual(lit.paint.fillOpacity, 0.16, "deeper while focused");
});

it("resolveReferenceLine: a perSeries line keeps each series' dragged value", () => {
  const viz = new LinePlot().groupBy("id");
  viz._drawLabel = d => d.id;
  const rows = [
    {id: "a", y: 10, data: {id: "a"}, i: 0},
    {id: "a", y: 30, data: {id: "a"}, i: 1},
    {id: "b", y: 40, data: {id: "b"}, i: 2},
  ];
  const lines = resolveReferenceLine(
    viz,
    {
      shape: REFERENCE_LINE,
      y: "mean",
      perSeries: true,
      seriesValues: {b: 12, gone: 3},
    },
    rows,
  );
  assert.deepStrictEqual(
    lines.map(l => l.y),
    [20, 12],
  );
  assert.deepStrictEqual(
    lines.map(l => l[DRAG_SERIES]),
    ["a", "b"],
  );
});

it("perSeries lines: each drags on its own into seriesValues, reporting its series", () => {
  const events = [];
  const viz = chart(
    {referenceLines: [{y: "mean", perSeries: true, draggable: true}]},
    {"drag.referenceLine": (...args) => events.push(args)},
  );
  const source = listSource(
    "referenceLine",
    "referenceLines",
    () => viz.schema.referenceLines,
    l => (viz.schema.referenceLines = l),
    0,
  );
  const line = (series, y) =>
    lineDragTarget(
      viz,
      {
        shape: REFERENCE_LINE,
        y,
        label: series,
        [DRAG_SOURCE]: source,
        [DRAG_SERIES]: series,
      },
      frame,
      {axis: "y", at: yScale(y), span: [40, 440]},
    );
  const a = line("a", 20),
    b = line("b", 40);
  assert.strictEqual(a.id, "referenceLines-0-y-sa");
  assert.strictEqual(a.series, "a");
  assert.strictEqual(a.name, "a");
  assert.ok(setReferenceValue(viz, a, 25));
  assert.ok(setReferenceValue(viz, b, 45));
  assert.deepStrictEqual(viz.referenceLines()[0], {
    y: "mean",
    perSeries: true,
    draggable: true,
    seriesValues: {a: 25, b: 45},
  });
  assert.strictEqual(events[0][0], 25, "the series' own value");
  assert.strictEqual(events[0][1].seriesValues.a, 25);
  assert.strictEqual(events[0][2], 0);
  assert.strictEqual(events[0][4], "a", "the series, after the event");
  assert.strictEqual(events[1][0], 45);
  fireReferenceEvent(viz, "drag", b);
  assert.strictEqual(events.at(-1)[0], 45);
});
