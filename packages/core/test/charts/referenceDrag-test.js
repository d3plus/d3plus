import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scaleLog, scaleTime} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  clampValue,
  dragOptions,
  dragRange,
  invertPixel,
  keyValue,
  pixelPrecision,
  roundToPixel,
  snapToStep,
  valueAtPixel,
} from "../../src/charts/features/referenceDragValue.ts";
import {
  dateText,
  DRAG_INDEX,
  dragLit,
  draggableEntry,
  fireReferenceEvent,
  referenceDragState,
  referenceDragTarget,
  scheduleDragRepaint,
  setReferenceValue,
} from "../../src/charts/features/referenceDrag.ts";
import {
  HANDLE_CLASS,
  HANDLE_SIZE,
  pressStartsDrag,
  referenceDragHandle,
  syncHandle,
} from "../../src/charts/features/referenceDragHandle.ts";
import {
  expandReferenceLines,
  REFERENCE_LINE,
  referenceLineNodes,
} from "../../src/charts/features/referenceAnnotations.ts";
import {linkedValues} from "../../src/charts/Plot/valueColors.ts";

useJsdom();

// Draggable reference lines: the values a pixel or a key moves a line to,
// the drag target a painted line registers, writing a moved value back,
// and the handle it is moved by.

// y 0..50 drawn from 310 (bottom) up to 10.
const yScale = scaleLinear().domain([0, 50]).range([310, 10]);
const yAxis = {scale: v => yScale(v), domain: [0, 50]};

it("dragOptions: true takes the defaults, an object its bounds and step", () => {
  assert.deepStrictEqual(dragOptions(true), {});
  assert.strictEqual(dragOptions(false), null);
  assert.strictEqual(dragOptions(undefined), null);
  assert.deepStrictEqual(dragOptions({min: 5, max: new Date(10), step: 2}), {
    min: 5,
    max: 10,
    step: 2,
  });
  assert.deepStrictEqual(dragOptions({min: "a", step: -1}), {
    min: undefined,
    max: undefined,
    step: undefined,
  });
});

it("invertPixel: reads linear, log, and time axes, clamped to the domain", () => {
  assert.ok(Math.abs(invertPixel(yAxis, 160) - 25) < 1e-6);
  assert.strictEqual(invertPixel(yAxis, 400), 0, "below the plot");
  assert.strictEqual(invertPixel(yAxis, -5), 50, "above the plot");
  const log = scaleLog().domain([1, 1000]).range([0, 300]);
  assert.ok(
    Math.abs(invertPixel({scale: log, domain: [1, 1000]}, 200) - 100) < 1e-6,
  );
  const t0 = Date.UTC(2020, 0, 1),
    t1 = Date.UTC(2021, 0, 1);
  const time = scaleTime().domain([t0, t1]).range([0, 366]);
  const day = invertPixel({scale: time, domain: [t0, t1], time: true}, 31);
  assert.ok(Math.abs(day - Date.UTC(2020, 1, 1)) < 1000);
  assert.ok(Number.isNaN(invertPixel({scale: yScale, domain: [NaN, 1]}, 4)));
});

it("snapToStep: the nearest multiple, written to the step's decimals", () => {
  assert.strictEqual(snapToStep(12.3, 5), 10);
  assert.strictEqual(snapToStep(0.1 + 0.2, 0.1), 0.3);
  assert.strictEqual(snapToStep(7.13, 0.25), 7.25);
  assert.strictEqual(snapToStep(7.13, 0), 7.13, "no step");
  assert.strictEqual(snapToStep(1.23456e-7, 1e-7), 1e-7);
});

it("pixelPrecision and roundToPixel: about a pixel's worth of the axis", () => {
  // 300px for 50 units: a pixel is 1/6 of a unit, so tenths.
  assert.strictEqual(pixelPrecision(yAxis, 160), 0.1);
  assert.strictEqual(roundToPixel(yAxis, 25.4567, 160), 25.5);
  const t0 = new Date(2020, 0, 1),
    t1 = new Date(2022, 0, 1);
  const time = scaleTime().domain([t0, t1]).range([0, 300]);
  const axis = {scale: time, domain: [+t0, +t1], time: true};
  const rounded = new Date(roundToPixel(axis, +new Date(2020, 5, 3, 14), 120));
  assert.strictEqual(rounded.getHours(), 0, "a pixel spans days: whole days");
  assert.strictEqual(rounded.getDate(), 4);
});

it("dragRange and clampValue: the domain, narrowed by min and max", () => {
  assert.deepStrictEqual(dragRange(yAxis, {}), [0, 50]);
  assert.deepStrictEqual(dragRange(yAxis, {min: 10, max: 80}), [10, 50]);
  assert.deepStrictEqual(dragRange(yAxis, {min: 40, max: 20}), [0, 50]);
  assert.strictEqual(clampValue(-3, [0, 50]), 0);
  assert.strictEqual(clampValue(51, [0.5, 50.5], 2), 50, "a step inside");
  assert.strictEqual(clampValue(0, [0.5, 50.5], 2), 2);
  assert.strictEqual(clampValue(20, [0, 50], 2), 20);
});

it("valueAtPixel: snapped to the step, or a pixel's worth, inside the range", () => {
  assert.strictEqual(valueAtPixel(yAxis, 160, {step: 5}), 25);
  assert.strictEqual(valueAtPixel(yAxis, 157, {}), 25.5);
  assert.strictEqual(valueAtPixel(yAxis, 0, {max: 40}), 40);
  assert.ok(
    Number.isNaN(valueAtPixel({scale: yScale, domain: [NaN, 0]}, 2, {})),
  );
});

it("keyValue: arrows step, Page keys ten steps, Home and End the ends", () => {
  const at = {value: 25, px: 160};
  assert.strictEqual(keyValue("ArrowUp", yAxis, at, 300, {step: 1}), 26);
  assert.strictEqual(keyValue("ArrowLeft", yAxis, at, 300, {step: 1}), 24);
  assert.strictEqual(keyValue("PageUp", yAxis, at, 300, {step: 1}), 35);
  assert.strictEqual(keyValue("PageDown", yAxis, at, 300, {step: 2}), 6);
  assert.strictEqual(keyValue("Home", yAxis, at, 300, {min: 10}), 10);
  assert.strictEqual(keyValue("End", yAxis, at, 300, {}), 50);
  assert.strictEqual(keyValue("Enter", yAxis, at, 300, {}), null);
  // Without a step: a hundredth of the plot (3px, half a unit), upward on a
  // y axis whose pixels run down.
  assert.strictEqual(keyValue("ArrowUp", yAxis, at, 300, {}), 25.5);
  assert.strictEqual(keyValue("ArrowDown", yAxis, at, 300, {}), 24.5);
  assert.strictEqual(
    keyValue("ArrowUp", yAxis, {value: 50, px: 10}, 300, {}),
    50,
  );
});

it("expandReferenceLines: indexed, a draggable entry keeps its place", () => {
  const lines = expandReferenceLines(
    [{y: 1}, null, {y: 2, draggable: true}],
    true,
  );
  assert.strictEqual(lines.length, 2);
  assert.strictEqual(lines[0][DRAG_INDEX], undefined);
  assert.strictEqual(lines[1][DRAG_INDEX], 2);
  assert.strictEqual(
    expandReferenceLines([{y: 2, draggable: true}])[0][DRAG_INDEX],
    undefined,
    "not the chart's own lines",
  );
});

it("draggableEntry: a value of its own, not a statistic, function, or per-series line", () => {
  assert.ok(draggableEntry({y: 5, draggable: true}, "y"));
  assert.ok(!draggableEntry({y: 5}, "y"));
  assert.ok(!draggableEntry({y: "mean", draggable: true}, "y"));
  assert.ok(!draggableEntry({y: () => 3, draggable: true}, "y"));
  assert.ok(!draggableEntry({y: 3, perSeries: true, draggable: true}, "y"));
  assert.ok(!draggableEntry(undefined, "y"));
});

it("dateText: a day's start without its time, anything else with it", () => {
  assert.strictEqual(dateText(Date.UTC(2022, 6, 26), true), "Jul 26, 2022");
  assert.match(dateText(Date.UTC(2022, 6, 26, 15, 30), true), /3:30/);
});

// A 400×300 plot at (40, 10): x 0..100 → 40..440, y 0..50 → 310..10.
const frame = {
  plot: {x0: 40, y0: 10, x1: 440, y1: 310},
  axes: {
    x: {
      scale: scaleLinear().domain([0, 100]).range([40, 440]),
      domain: [0, 100],
    },
    y: {scale: v => yScale(v), domain: [0, 50]},
  },
};
const line = {axis: "y", at: 160, span: [40, 440]};

/** A LinePlot whose `referenceLines` are `lines`, its handlers `on`. */
function chart(lines, on = {}) {
  const viz = new LinePlot().referenceLines(lines);
  for (const [k, fn] of Object.entries(on)) viz.on(k, fn);
  viz._repaints = 0;
  viz._repaintPlot = () => ++viz._repaints;
  return viz;
}

it("referenceDragTarget: registers a draggable line's place, value, and name", () => {
  const viz = chart([{y: 25, draggable: {step: 1}, label: "Goal"}]);
  const annotation = {
    shape: REFERENCE_LINE,
    y: 25,
    label: "Goal",
    [DRAG_INDEX]: 0,
  };
  const target = referenceDragTarget(viz, annotation, frame, line);
  assert.strictEqual(target.index, 0);
  assert.strictEqual(target.value, 25);
  assert.strictEqual(target.length, 300);
  assert.strictEqual(target.name, "Goal");
  assert.deepStrictEqual(target.options, {
    min: undefined,
    max: undefined,
    step: 1,
  });
  assert.strictEqual(referenceDragState(viz).targets.get(0), target);
  const unnamed = referenceDragTarget(
    viz,
    {...annotation, label: undefined},
    frame,
    line,
  );
  assert.strictEqual(unnamed.name, "Reference line");
  // Not one of the chart's own draggable lines, a category axis, or a facet panel.
  assert.strictEqual(
    referenceDragTarget(viz, {shape: REFERENCE_LINE, y: 25}, frame, line),
    null,
  );
  const categories = {...frame, axes: {y: {scale: () => 0, categories: ["a"]}}};
  assert.strictEqual(
    referenceDragTarget(viz, annotation, categories, line),
    null,
  );
  viz._facetStep = "panel";
  assert.strictEqual(referenceDragTarget(viz, annotation, frame, line), null);
});

it("referenceDragTarget: a plot-relative line moves over 0 to 1", () => {
  const viz = chart([{y: 0.5, ref: "plot", draggable: true}]);
  const target = referenceDragTarget(
    viz,
    {shape: REFERENCE_LINE, y: 0.5, ref: "plot", [DRAG_INDEX]: 0},
    frame,
    line,
  );
  assert.ok(target.plot);
  assert.deepStrictEqual(target.dragAxis.domain, [0, 1]);
  assert.strictEqual(target.dragAxis.scale(0.5), 160);
});

it("setReferenceValue: writes the entry, fires drag, and repaints", () => {
  const events = [];
  const viz = chart([{y: 1}, {y: 25, id: "goal", draggable: true}], {
    "drag.referenceLine": (...args) => events.push(["drag", ...args]),
    "end.referenceLine": (...args) => events.push(["end", ...args]),
  });
  const original = viz.referenceLines();
  referenceDragTarget(
    viz,
    {shape: REFERENCE_LINE, y: 25, [DRAG_INDEX]: 1},
    frame,
    line,
  );
  assert.ok(setReferenceValue(viz, 1, 30));
  assert.strictEqual(viz.referenceLines()[1].y, 30);
  assert.strictEqual(viz.referenceLines()[1].id, "goal");
  assert.strictEqual(original[1].y, 25, "the given entry is left alone");
  assert.strictEqual(referenceDragState(viz).targets.get(1).at, yScale(30));
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0][0], "drag");
  assert.strictEqual(events[0][1], 30);
  assert.strictEqual(events[0][2].id, "goal");
  assert.strictEqual(events[0][3], 1);
  assert.strictEqual(viz._repaints, 1, "no animation frame here: at once");
  assert.ok(!setReferenceValue(viz, 1, 30), "the same value");
  assert.ok(!setReferenceValue(viz, 1, NaN));
  assert.ok(!setReferenceValue(viz, 0, 3), "not a draggable line");
  fireReferenceEvent(viz, "end", 1);
  assert.strictEqual(events[1][0], "end");
  assert.strictEqual(events[1][1], 30);
});

it("setReferenceValue: a time axis line stores a Date", () => {
  const t0 = Date.UTC(2020, 0, 1),
    t1 = Date.UTC(2021, 0, 1);
  const time = scaleTime().domain([t0, t1]).range([40, 440]);
  const timeFrame = {
    ...frame,
    axes: {x: {scale: time, domain: [t0, t1], time: true, utc: true}},
  };
  const viz = chart([{x: "2020-06-01", draggable: true}]);
  const target = referenceDragTarget(
    viz,
    {shape: REFERENCE_LINE, x: "2020-06-01", [DRAG_INDEX]: 0},
    timeFrame,
    {axis: "x", at: 200, span: [10, 310]},
  );
  assert.strictEqual(target.value, Date.UTC(2020, 5, 1));
  assert.strictEqual(target.text, "Jun 1, 2020");
  setReferenceValue(viz, 0, Date.UTC(2020, 6, 1));
  assert.ok(viz.referenceLines()[0].x instanceof Date);
  assert.strictEqual(+viz.referenceLines()[0].x, Date.UTC(2020, 6, 1));
});

it("fireReferenceEvent: a throwing handler doesn't stop the drag", () => {
  const viz = chart([{y: 25, draggable: true}], {
    "drag.referenceLine": () => {
      throw new Error("handler");
    },
  });
  referenceDragTarget(
    viz,
    {shape: REFERENCE_LINE, y: 25, [DRAG_INDEX]: 0},
    frame,
    line,
  );
  const report = console.error;
  console.error = () => {};
  try {
    assert.ok(setReferenceValue(viz, 0, 20));
  } finally {
    console.error = report;
  }
  assert.strictEqual(viz.referenceLines()[0].y, 20);
});

it("scheduleDragRepaint: one repaint per animation frame", async () => {
  const viz = chart([]);
  const raf = globalThis.requestAnimationFrame;
  const frames = [];
  globalThis.requestAnimationFrame = fn => frames.push(fn);
  try {
    scheduleDragRepaint(viz);
    scheduleDragRepaint(viz);
    assert.strictEqual(frames.length, 1);
    assert.strictEqual(viz._repaints, 0);
    frames[0]();
    assert.strictEqual(viz._repaints, 1);
    scheduleDragRepaint(viz);
    assert.strictEqual(frames.length, 2, "a new frame once it ran");
  } finally {
    globalThis.requestAnimationFrame = raf;
  }
});

it("dragLit: hovered, focused, or dragged", () => {
  const state = {targets: new Map()};
  assert.ok(!dragLit(state, 0));
  assert.ok(dragLit({...state, hover: 0}, 0));
  assert.ok(dragLit({...state, focus: 0}, 0));
  assert.ok(dragLit({...state, dragging: 0}, 0));
  assert.ok(!dragLit({...state, dragging: 1}, 0));
});

it("pressStartsDrag: one finger, or the primary button without modifiers", () => {
  const mouse = (o = {}) => new MouseEvent("mousedown", o);
  assert.ok(pressStartsDrag(mouse()));
  assert.ok(!pressStartsDrag(mouse({button: 2})));
  assert.ok(!pressStartsDrag(mouse({shiftKey: true})));
  const touch = n => ({type: "touchstart", touches: {length: n}});
  assert.ok(pressStartsDrag(touch(1)));
  assert.ok(!pressStartsDrag(touch(2)));
});

it("referenceDragHandle: a slider strip centered on the line", () => {
  const viz = chart([{y: 25, draggable: true}]);
  const target = referenceDragTarget(
    viz,
    {shape: REFERENCE_LINE, y: 25, [DRAG_INDEX]: 0},
    frame,
    line,
  );
  const node = referenceDragHandle(viz, target);
  assert.strictEqual(node.type, "htmlOverlay");
  assert.strictEqual(node.key, "reference-drag-0");
  assert.deepStrictEqual(
    [node.x, node.y, node.width, node.height],
    [40, 160 - HANDLE_SIZE / 2, 400, HANDLE_SIZE],
  );
  assert.match(node.html, /role="slider"/);
  assert.match(node.html, /aria-orientation="vertical"/);
  assert.match(node.html, /cursor:ns-resize/);
  const vertical = referenceDragHandle(viz, {
    ...target,
    axis: "x",
    at: 200,
    span: [10, 310],
  });
  assert.deepStrictEqual(
    [vertical.x, vertical.y, vertical.width, vertical.height],
    [200 - HANDLE_SIZE / 2, 10, HANDLE_SIZE, 300],
  );
  assert.match(vertical.html, /aria-orientation="horizontal"/);
});

it("syncHandle: writes the slider's name, range, and value", () => {
  const viz = chart([{y: 25, draggable: {min: 5}}]);
  const target = referenceDragTarget(
    viz,
    {shape: REFERENCE_LINE, y: 25, label: "Goal", [DRAG_INDEX]: 0},
    frame,
    line,
  );
  const el = document.createElement("div");
  el.innerHTML = `<div class="${HANDLE_CLASS}"></div>`;
  syncHandle(el, target);
  const handle = el.firstChild;
  assert.strictEqual(handle.getAttribute("aria-label"), "Goal");
  assert.strictEqual(handle.getAttribute("aria-valuemin"), "5");
  assert.strictEqual(handle.getAttribute("aria-valuemax"), "50");
  assert.strictEqual(handle.getAttribute("aria-valuenow"), "25");
  assert.strictEqual(handle.getAttribute("aria-valuetext"), "25");
  syncHandle(document.createElement("div"), target);
});

it("referenceLineNodes: a draggable line is labeled with its value and has a handle", () => {
  const viz = chart([{y: 25, draggable: true}]);
  const nodes = referenceLineNodes(
    viz,
    {shape: REFERENCE_LINE, y: 25, [DRAG_INDEX]: 0},
    frame,
    "r",
  );
  assert.deepStrictEqual(
    nodes.map(n => n.type),
    ["line", "text", "htmlOverlay"],
  );
  assert.strictEqual(nodes[1].lines[0].text, "25");
  assert.strictEqual(nodes[0].paint.strokeWidth, 1);
  referenceDragState(viz).hover = 0;
  const [lit] = referenceLineNodes(
    viz,
    {shape: REFERENCE_LINE, y: 25, label: false, [DRAG_INDEX]: 0},
    frame,
    "r",
  );
  assert.strictEqual(lit.paint.strokeWidth, 2, "lit while hovered");
  assert.strictEqual(lit.paint.strokeOpacity, 1);
});

it("linkedValues: a line's id stands for its value", () => {
  const lines = [
    {y: 30, id: "target"},
    {x: new Date(5), id: "when"},
    {y: "mean", id: "avg"},
  ];
  assert.deepStrictEqual(linkedValues("target", lines), [30]);
  assert.deepStrictEqual(
    linkedValues([10, "target", "when"], lines),
    [10, 30, 5],
  );
  assert.deepStrictEqual(linkedValues(["avg", "missing", 4], lines), [4]);
  assert.strictEqual(linkedValues(20, lines), 20, "no names: as given");
  assert.strictEqual(linkedValues(true, lines), true);
  assert.deepStrictEqual(linkedValues("target", undefined), []);
});
