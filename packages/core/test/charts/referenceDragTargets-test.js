import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint, scaleTime} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  dateText,
  dragAxisOf,
  dragLit,
  draggableEntry,
  dragTarget,
  dragValue,
  fireReferenceEvent,
  lineDragTarget,
  redrawAfterDrag,
  referenceDragState,
  scheduleDragRepaint,
  setReferenceValue,
  storedValue,
} from "../../src/charts/features/referenceDrag.ts";
import {
  asList,
  DRAG_SOURCE,
  listSource,
  settingSource,
} from "../../src/charts/features/referenceDragSource.ts";
import {
  HANDLE_CLASS,
  HANDLE_SIZE,
  pressStartsDrag,
  referenceDragHandle,
  syncHandle,
} from "../../src/charts/features/referenceDragHandle.ts";
import {
  dragNodes,
  GRIP_KEY,
  GRIP_SIZE,
  gripCenter,
  referenceDragGrip,
} from "../../src/charts/features/referenceDragGrip.ts";
import {
  expandReferenceBands,
  expandReferenceLines,
  REFERENCE_BAND,
  REFERENCE_LINE,
  referenceLineNodes,
} from "../../src/charts/features/referenceAnnotations.ts";
import {
  expandQuadrants,
  quadrantNodes,
  quadrantSource,
} from "../../src/charts/features/referenceQuadrants.ts";
import {plotAnnotationList} from "../../src/charts/features/plotAnnotations.ts";

useJsdom();

// Draggable reference annotations: where each lives, the drag targets a
// painted line, band edge, or quadrant divider registers, writing a moved
// value back, and the grip and handle it is moved by.

// A 400×300 plot at (40, 10): x 0..100 → 40..440, y 0..50 → 310..10.
const yScale = scaleLinear().domain([0, 50]).range([310, 10]);
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

/** A LinePlot with `config`, its handlers `on`, counting repaints and renders. */
function chart(config, on = {}) {
  const viz = new LinePlot().config(config);
  for (const [k, fn] of Object.entries(on)) viz.on(k, fn);
  viz._repaints = viz._renders = 0;
  viz._repaintPlot = () => ++viz._repaints;
  viz.render = () => ++viz._renders;
  return viz;
}

/** The source of the chart's `referenceLines` entry `i`. */
const lineSource = (viz, i) =>
  listSource(
    "referenceLine",
    "referenceLines",
    () => viz.schema.referenceLines,
    list => (viz.schema.referenceLines = list),
    i,
  );

/** A line annotation of entry `i`, as `plotAnnotationList` resolves it. */
const lineOf = (viz, i, extra = {}) => ({
  shape: REFERENCE_LINE,
  ...viz.schema.referenceLines[i],
  [DRAG_SOURCE]: lineSource(viz, i),
  ...extra,
});

it("asList, listSource, settingSource: read and write where a setting lives", () => {
  assert.deepStrictEqual(asList(undefined), []);
  assert.deepStrictEqual(asList({y: 1}), [{y: 1}]);
  const viz = chart({referenceLines: [{y: 1}, {y: 2}]});
  const source = lineSource(viz, 1);
  assert.strictEqual(source.key, "referenceLines-1");
  assert.strictEqual(source.index, 1);
  assert.deepStrictEqual(source.entry(), {y: 2});
  const given = viz.schema.referenceLines;
  source.write({y: 3});
  assert.deepStrictEqual(viz.schema.referenceLines, [{y: 1}, {y: 3}]);
  assert.strictEqual(given[1].y, 2, "the given list is left alone");
  let stored;
  const setting = settingSource(
    "referenceLine",
    "paretoThreshold",
    () => ({y2: 0.8}),
    e => (stored = e),
  );
  assert.strictEqual(setting.index, "paretoThreshold");
  setting.write({y2: 0.7});
  assert.deepStrictEqual(stored, {y2: 0.7});
  assert.strictEqual(setting.payload, undefined);
});

it("expandReferenceLines and expandReferenceBands: a draggable entry carries its source", () => {
  const sources = [];
  const lines = expandReferenceLines(
    [{y: 1}, null, {y: 2, draggable: true}],
    i => (sources.push(i), {key: `l${i}`}),
  );
  assert.strictEqual(lines.length, 2);
  assert.strictEqual(lines[0][DRAG_SOURCE], undefined);
  assert.strictEqual(lines[1][DRAG_SOURCE].key, "l2");
  assert.deepStrictEqual(sources, [2]);
  assert.strictEqual(
    expandReferenceLines([{y: 2, draggable: true}])[0][DRAG_SOURCE],
    undefined,
    "no source, no drag",
  );
  const bands = expandReferenceBands([{y: [1, 2], draggable: true}], i => ({
    key: i,
  }));
  assert.strictEqual(bands[0].shape, REFERENCE_BAND);
  assert.strictEqual(bands[0][DRAG_SOURCE].key, 0);
});

it("plotAnnotationList: lines, bands, and annotations get sources; quadrants too", () => {
  const viz = new LinePlot()
    .data([
      {id: "a", x: 1, y: 2},
      {id: "a", x: 2, y: 4},
    ])
    .config({
      referenceLines: [{y: 3, draggable: true}],
      referenceBands: [{x: [1, 2], draggable: true}],
      quadrants: {x: 1.5, y: 3, draggable: true},
      annotations: [
        {shape: "ReferenceLine", x: 1, draggable: true},
        {shape: "Rect"},
      ],
    });
  viz._filteredData = viz._data;
  const list = plotAnnotationList(viz);
  const keys = list.map(d => d[DRAG_SOURCE]?.key);
  assert.deepStrictEqual(keys, [
    "quadrants",
    "referenceBands-0",
    "referenceLines-0",
    "annotations-0",
    undefined,
  ]);
  const own = list[3][DRAG_SOURCE];
  own.write({...own.entry(), x: 2});
  assert.strictEqual(viz.annotations()[0].x, 2);
  assert.strictEqual(viz.annotations()[1].shape, "Rect");
});

it("draggableEntry: any entry that sets draggable", () => {
  assert.ok(draggableEntry({y: 5, draggable: true}));
  assert.ok(
    draggableEntry({y: "mean", draggable: {step: 1}}),
    "statistics too",
  );
  assert.ok(!draggableEntry({y: 5}));
  assert.ok(draggableEntry({y: "mean", perSeries: true, draggable: true}));
  assert.ok(!draggableEntry(undefined));
});

it("dateText: a day's start without its time, anything else with it", () => {
  assert.strictEqual(dateText(Date.UTC(2022, 6, 26), true), "Jul 26, 2022");
  assert.match(dateText(Date.UTC(2022, 6, 26, 15, 30), true), /3:30/);
});

it("dragAxisOf, dragValue, storedValue: numbers, dates, categories, and plot fractions", () => {
  const plot = dragAxisOf(frame, "y", true);
  assert.deepStrictEqual(plot.domain, [0, 1]);
  assert.strictEqual(plot.scale(0.5), 160);
  const numeric = dragAxisOf(frame, "x", false);
  assert.strictEqual(dragValue(numeric, "12"), 12);
  assert.strictEqual(storedValue(numeric, 12), 12);
  const t0 = Date.UTC(2020, 0, 1);
  const time = {
    scale: scaleTime()
      .domain([t0, t0 + 864e5])
      .range([0, 1]),
    domain: [t0, t0 + 864e5],
    time: true,
    utc: true,
  };
  assert.strictEqual(dragValue(time, "2020-01-01"), t0);
  assert.ok(storedValue(time, t0) instanceof Date);
  const cats = scalePoint().domain(["a", "b", "c"]).range([40, 440]);
  const categoryFrame = {
    ...frame,
    axes: {x: {scale: cats, categories: ["a", "b", "c"]}},
  };
  const category = dragAxisOf(categoryFrame, "x", false);
  assert.deepStrictEqual(category.categories, ["a", "b", "c"]);
  assert.strictEqual(dragValue(category, "b"), 1);
  assert.ok(Number.isNaN(dragValue(category, "z")));
  assert.strictEqual(storedValue(category, 2), "c");
  assert.strictEqual(dragAxisOf({...frame, axes: {}}, "x", false), null);
});

it("lineDragTarget: a draggable line's place, value, name, and grip end", () => {
  const viz = chart({
    referenceLines: [{y: 25, draggable: {step: 1}, label: "Goal"}],
  });
  const target = lineDragTarget(viz, lineOf(viz, 0), frame, line);
  assert.strictEqual(target.id, "referenceLines-0-y");
  assert.strictEqual(target.value, 25);
  assert.strictEqual(target.length, 300);
  assert.strictEqual(target.name, "Goal");
  assert.strictEqual(target.grip, "start", "away from the label at the end");
  assert.deepStrictEqual(target.options, {
    min: undefined,
    max: undefined,
    step: 1,
  });
  assert.strictEqual(referenceDragState(viz).targets.get(target.id), target);
  const flipped = lineDragTarget(
    viz,
    lineOf(viz, 0, {labelPosition: "start", label: undefined}),
    frame,
    line,
  );
  assert.strictEqual(flipped.grip, "end");
  assert.strictEqual(flipped.name, "Reference line");
  // A resolved statistic drags from its value.
  const mean = chart({referenceLines: [{y: "mean", draggable: true}]});
  const stat = lineDragTarget(
    mean,
    lineOf(mean, 0, {y: 30, label: "Mean"}),
    frame,
    line,
  );
  assert.strictEqual(stat.value, 30);
  assert.strictEqual(
    lineDragTarget(viz, {shape: REFERENCE_LINE, y: 25}, frame, line),
    null,
  );
});

it("dragTarget: a category line snaps between categories, its range by category", () => {
  const viz = chart({
    referenceLines: [{x: "b", draggable: {min: "b", max: "z"}}],
  });
  const cats = scalePoint().domain(["a", "b", "c", "d"]).range([40, 440]);
  const categoryFrame = {
    ...frame,
    axes: {x: {scale: cats, categories: cats.domain()}},
  };
  const target = dragTarget(viz, lineSource(viz, 0), categoryFrame, {
    axis: "x",
    value: "b",
    at: cats("b"),
    handleAt: cats("b"),
    span: [10, 310],
    grip: "start",
    name: "b",
  });
  assert.strictEqual(target.value, 1);
  assert.deepStrictEqual(target.options, {min: 1, max: undefined, step: 1});
  assert.strictEqual(target.text, "b");
  assert.ok(setReferenceValue(viz, target, 3));
  assert.strictEqual(viz.referenceLines()[0].x, "d", "stores the category");
});

it("quadrantSource and quadrant dividers: each divider moves the center's x or y", () => {
  const viz = chart({quadrants: {x: "mean", y: 25, draggable: true}});
  const source = quadrantSource(viz, {x: 50, y: 25});
  assert.strictEqual(source.kind, "quadrants");
  assert.strictEqual(source.index, "quadrants");
  assert.deepStrictEqual(source.payload({x: 60, y: 25}, "x"), {x: 60, y: 25});
  const annotation = {
    shape: "Quadrants",
    x: 50,
    y: 25,
    draggable: true,
    [DRAG_SOURCE]: source,
  };
  const nodes = quadrantNodes(viz, annotation, frame, "q");
  const handles = nodes.filter(n => n.type === "htmlOverlay");
  assert.deepStrictEqual(
    handles.map(n => n.key),
    ["reference-drag-quadrants-x", "reference-drag-quadrants-y"],
  );
  assert.deepStrictEqual(
    nodes.filter(n => n.type === "text").map(n => n.lines[0].text),
    ["50", "25"],
    "each divider labeled with its value",
  );
  const [x, y] = [...referenceDragState(viz).targets.values()];
  assert.strictEqual(x.name, "Vertical divider");
  assert.strictEqual(y.name, "Horizontal divider");
  const events = [];
  viz.on("drag.quadrants", (...args) => events.push(args));
  assert.ok(setReferenceValue(viz, x, 70));
  assert.deepStrictEqual(viz.quadrants(), {x: 70, y: 25, draggable: true});
  assert.deepStrictEqual(events[0][0], {x: 70, y: 25});
  assert.strictEqual(events[0][2], "x", "the axis moved");
});

it("expandQuadrants: a draggable setting carries its source", () => {
  const viz = new LinePlot();
  viz._filteredData = [];
  const [q] = expandQuadrants(viz, {x: 1, y: 2, draggable: true});
  assert.strictEqual(q[DRAG_SOURCE].kind, "quadrants");
  assert.strictEqual(
    expandQuadrants(viz, {x: 1, y: 2})[0][DRAG_SOURCE],
    undefined,
  );
});

it("setReferenceValue: writes the entry, fires drag, and repaints", () => {
  const events = [];
  const viz = chart(
    {referenceLines: [{y: 1}, {y: 25, id: "goal", draggable: true}]},
    {
      "drag.referenceLine": (...args) => events.push(["drag", ...args]),
      "end.referenceLine": (...args) => events.push(["end", ...args]),
    },
  );
  const target = lineDragTarget(viz, lineOf(viz, 1), frame, line);
  assert.ok(setReferenceValue(viz, target, 30));
  assert.strictEqual(viz.referenceLines()[1].y, 30);
  assert.strictEqual(viz.referenceLines()[1].id, "goal");
  assert.strictEqual(target.at, yScale(30));
  assert.strictEqual(target.handleAt, yScale(30));
  assert.deepStrictEqual(events[0].slice(0, 2), ["drag", 30]);
  assert.strictEqual(events[0][2].id, "goal");
  assert.strictEqual(events[0][3], 1);
  assert.strictEqual(viz._repaints, 1, "no animation frame here: at once");
  assert.ok(!setReferenceValue(viz, target, 30), "the same value");
  assert.ok(!setReferenceValue(viz, target, NaN));
  fireReferenceEvent(viz, "end", target);
  assert.deepStrictEqual(events[1].slice(0, 2), ["end", 30]);
});

it("setReferenceValue: a statistic becomes the fixed value it is dragged to", () => {
  const viz = chart({referenceLines: [{y: "mean", draggable: true}]});
  const target = lineDragTarget(
    viz,
    lineOf(viz, 0, {y: 20, label: "Mean"}),
    frame,
    line,
  );
  setReferenceValue(viz, target, 22);
  assert.deepStrictEqual(viz.referenceLines()[0], {y: 22, draggable: true});
});

it("setReferenceValue: a time axis line stores a Date", () => {
  const t0 = Date.UTC(2020, 0, 1),
    t1 = Date.UTC(2021, 0, 1);
  const time = scaleTime().domain([t0, t1]).range([40, 440]);
  const timeFrame = {
    ...frame,
    axes: {x: {scale: time, domain: [t0, t1], time: true, utc: true}},
  };
  const viz = chart({referenceLines: [{x: "2020-06-01", draggable: true}]});
  const target = lineDragTarget(viz, lineOf(viz, 0), timeFrame, {
    axis: "x",
    at: 200,
    span: [10, 310],
  });
  assert.strictEqual(target.value, Date.UTC(2020, 5, 1));
  assert.strictEqual(target.text, "Jun 1, 2020");
  setReferenceValue(viz, target, Date.UTC(2020, 6, 1));
  assert.ok(viz.referenceLines()[0].x instanceof Date);
});

it("fireReferenceEvent: a throwing handler doesn't stop the drag", () => {
  const viz = chart(
    {referenceLines: [{y: 25, draggable: true}]},
    {
      "drag.referenceLine": () => {
        throw new Error("handler");
      },
    },
  );
  const target = lineDragTarget(viz, lineOf(viz, 0), frame, line);
  const report = console.error;
  console.error = () => {};
  try {
    assert.ok(setReferenceValue(viz, target, 20));
  } finally {
    console.error = report;
  }
  assert.strictEqual(viz.referenceLines()[0].y, 20);
});

it("scheduleDragRepaint: one repaint per frame, a redraw where it can't repaint", () => {
  const viz = chart({});
  const raf = globalThis.requestAnimationFrame;
  const frames = [];
  globalThis.requestAnimationFrame = fn => frames.push(fn);
  try {
    scheduleDragRepaint(viz);
    scheduleDragRepaint(viz);
    assert.strictEqual(frames.length, 1);
    frames[0]();
    assert.strictEqual(viz._repaints, 1);
    viz._repaintPlot = () => false;
    scheduleDragRepaint(viz);
    frames[1]();
    assert.strictEqual(viz._renders, 1, "redrawn");
    assert.strictEqual(viz._instantNextDraw, true, "without a transition");
  } finally {
    globalThis.requestAnimationFrame = raf;
  }
});

it("redrawAfterDrag: renders, instantly when asked", () => {
  const viz = chart({});
  redrawAfterDrag(viz);
  assert.strictEqual(viz._renders, 1);
  assert.ok(!viz._instantNextDraw);
  redrawAfterDrag(viz, true);
  assert.strictEqual(viz._instantNextDraw, true);
});

it("dragLit: hovered, focused, or dragged", () => {
  const state = {targets: new Map()};
  assert.ok(!dragLit(state, "a"));
  assert.ok(dragLit({...state, hover: "a"}, "a"));
  assert.ok(dragLit({...state, focus: "a"}, "a"));
  assert.ok(dragLit({...state, dragging: "a"}, "a"));
  assert.ok(!dragLit({...state, dragging: "b"}, "a"));
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

it("referenceDragHandle: a slider strip centered on the handle's place", () => {
  const viz = chart({referenceLines: [{y: 25, draggable: true}]});
  const target = lineDragTarget(viz, lineOf(viz, 0), frame, line);
  const node = referenceDragHandle(viz, target);
  assert.strictEqual(node.type, "htmlOverlay");
  assert.strictEqual(node.key, "reference-drag-referenceLines-0-y");
  assert.deepStrictEqual(
    [node.x, node.y, node.width, node.height],
    [40, 160 - HANDLE_SIZE / 2, 400, HANDLE_SIZE],
  );
  assert.match(node.html, /role="slider"/);
  assert.match(node.html, /aria-orientation="vertical"/);
  assert.match(node.html, /cursor:ns-resize/);
  assert.ok(node.events[`.${HANDLE_CLASS}`].keyup, "a key let go settles it");
  const vertical = referenceDragHandle(viz, {
    ...target,
    axis: "x",
    handleAt: 200,
    span: [10, 310],
  });
  assert.deepStrictEqual(
    [vertical.x, vertical.y, vertical.width, vertical.height],
    [200 - HANDLE_SIZE / 2, 10, HANDLE_SIZE, 300],
  );
  assert.match(vertical.html, /aria-orientation="horizontal"/);
});

it("syncHandle: writes the slider's name, range, and value", () => {
  const viz = chart({
    referenceLines: [{y: 25, draggable: {min: 5}, label: "Goal"}],
  });
  const target = lineDragTarget(viz, lineOf(viz, 0), frame, line);
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

it("gripCenter and referenceDragGrip: a pill at the end away from the label", () => {
  const viz = chart({referenceLines: [{y: 25, draggable: true}]});
  const target = lineDragTarget(viz, lineOf(viz, 0), frame, line);
  const [cx, cy] = gripCenter(target);
  assert.strictEqual(cx, 40 + GRIP_SIZE[0] / 2 + 4);
  assert.strictEqual(cy, 160);
  assert.deepStrictEqual(gripCenter({...target, grip: "end"}), [
    440 - GRIP_SIZE[0] / 2 - 4,
    160,
  ]);
  // A vertical line's start is its bottom.
  assert.deepStrictEqual(
    gripCenter({...target, axis: "x", handleAt: 200, span: [10, 310]}),
    [200, 310 - GRIP_SIZE[0] / 2 - 4],
  );
  const grip = referenceDragGrip(viz, target, "red", false, "k");
  assert.strictEqual(grip.key, `k${GRIP_KEY}`);
  const [pill, ...ridges] = grip.children;
  assert.deepStrictEqual([pill.width, pill.height], GRIP_SIZE);
  assert.strictEqual(pill.paint.stroke, "red");
  assert.strictEqual(pill.paint.strokeWidth, 1);
  assert.ok(pill.paint.fill, "the chart's background");
  assert.strictEqual(ridges.length, 2);
  assert.strictEqual(
    referenceDragGrip(viz, target, "red", true, "k").children[0].paint
      .strokeWidth,
    2,
  );
  const upright = referenceDragGrip(
    viz,
    {...target, axis: "x", handleAt: 200, span: [10, 310]},
    "red",
    false,
    "k",
  );
  assert.deepStrictEqual(
    [upright.children[0].width, upright.children[0].height],
    [GRIP_SIZE[1], GRIP_SIZE[0]],
  );
});

it("dragNodes: a grip and a handle, and a lit band edge's line", () => {
  const viz = chart({referenceLines: [{y: 25, draggable: true}]});
  const target = lineDragTarget(viz, lineOf(viz, 0), frame, line);
  assert.deepStrictEqual(
    dragNodes(viz, target, "red", "k").map(n => n.type),
    ["group", "htmlOverlay"],
  );
  referenceDragState(viz).hover = target.id;
  const edge = {...target, edge: 0};
  const lit = dragNodes(viz, edge, "red", "k");
  assert.deepStrictEqual(
    lit.map(n => n.type),
    ["line", "group", "htmlOverlay"],
  );
  assert.deepStrictEqual(lit[0].points, [
    [40, 160],
    [440, 160],
  ]);
});

it("referenceLineNodes: a draggable line is labeled with its value and has a grip and handle", () => {
  const viz = chart({referenceLines: [{y: 25, draggable: true}]});
  const nodes = referenceLineNodes(viz, lineOf(viz, 0), frame, "r");
  assert.deepStrictEqual(
    nodes.map(n => n.type),
    ["line", "text", "group", "htmlOverlay"],
  );
  assert.strictEqual(nodes[1].lines[0].text, "25");
  assert.strictEqual(nodes[0].paint.strokeWidth, 1);
  referenceDragState(viz).hover = "referenceLines-0-y";
  const [lit] = referenceLineNodes(
    viz,
    lineOf(viz, 0, {label: false}),
    frame,
    "r",
  );
  assert.strictEqual(lit.paint.strokeWidth, 2, "lit while hovered");
  assert.strictEqual(lit.paint.strokeOpacity, 1);
});
