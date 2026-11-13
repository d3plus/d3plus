import {it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";
import {useJsdom} from "~test/jsdom.js";
import {ArcDiagram, Geomap, Network, Plot, Treemap} from "../../index.ts";
import {
  BOX_DRAG_DISTANCE,
  bindZoomGestures,
  clampPoint,
  dragsFar,
  inBox,
  spanBox,
  startsBoxDrag,
  unbindZoomGestures,
} from "../../src/charts/drawSteps/zoomDrag.ts";
import {
  canZoom,
  setZoomBrush,
  zoomBy,
} from "../../src/charts/drawSteps/zoomActions.ts";
import {
  minimapAnchor,
  showsZoomControls,
  zoomControlsBox,
  zoomControlsReach,
} from "../../src/charts/drawSteps/zoomControlsMarkup.ts";

useJsdom();

const SVG = "http://www.w3.org/2000/svg";
const area = [
  [10, 20],
  [110, 120],
];

/** A mousedown-like event: the primary button, no modifier, a first press. */
const press = (props = {}) => ({
  button: 0,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  detail: 1,
  target: null,
  ...props,
});

/** The names of the d3 listeners bound on a node. */
const listeners = node => (node.__on || []).map(l => `${l.type}.${l.name}`);

it("zoom gesture options default to buttons, drag to pan, and double-click to zoom in", () => {
  for (const Chart of [ArcDiagram, Geomap, Network, Plot, Treemap]) {
    const chart = new Chart();
    assert.strictEqual(chart.zoomControls(), true, Chart.name);
    assert.strictEqual(chart.zoomDrag(), "pan", Chart.name);
    assert.strictEqual(chart.zoomDoubleClick(), "in", Chart.name);
  }
  const chart = new Treemap().config({
    zoomControls: false,
    zoomDrag: "brush",
    zoomDoubleClick: "reset",
  });
  assert.strictEqual(chart.zoomControls(), false);
  assert.strictEqual(chart.zoomDrag(), "brush");
  assert.strictEqual(chart.zoomDoubleClick(), "reset");
  assert.strictEqual(
    new Treemap().zoomDoubleClick(false).zoomDoubleClick(),
    false,
  );
});

it("clampPoint keeps a point inside a box", () => {
  assert.deepStrictEqual(clampPoint([0, 200], area), [10, 120]);
  assert.deepStrictEqual(clampPoint([50, 60], area), [50, 60]);
  assert.deepStrictEqual(clampPoint([500, -5], area), [110, 20]);
});

it("spanBox spans two corners whichever way the drag went", () => {
  const box = [
    [20, 30],
    [80, 90],
  ];
  assert.deepStrictEqual(spanBox([20, 30], [80, 90]), box);
  assert.deepStrictEqual(spanBox([80, 90], [20, 30]), box);
  assert.deepStrictEqual(spanBox([80, 30], [20, 90]), box);
});

it("inBox includes a box's edges", () => {
  assert.strictEqual(inBox([10, 20], area), true);
  assert.strictEqual(inBox([110, 120], area), true);
  assert.strictEqual(inBox([60, 70], area), true);
  assert.strictEqual(inBox([9, 70], area), false);
  assert.strictEqual(inBox([60, 121], area), false);
});

it("dragsFar tells a drag from a click's jitter", () => {
  assert.strictEqual(dragsFar([0, 0], [BOX_DRAG_DISTANCE, 0]), false);
  assert.strictEqual(dragsFar([0, 0], [2, 2]), false);
  assert.strictEqual(dragsFar([0, 0], [BOX_DRAG_DISTANCE + 1, 0]), true);
  assert.strictEqual(dragsFar([5, 5], [5, 1]), true);
});

it("startsBoxDrag takes a plain first press inside the chart area", () => {
  const at = [50, 50];
  assert.strictEqual(startsBoxDrag(press(), at, area), true);
  assert.strictEqual(startsBoxDrag(press(), [5, 50], area), false, "outside");
  for (const key of ["shiftKey", "ctrlKey", "metaKey", "altKey"])
    assert.strictEqual(
      startsBoxDrag(press({[key]: true}), at, area),
      false,
      key,
    );
  assert.strictEqual(startsBoxDrag(press({button: 2}), at, area), false);
  assert.strictEqual(
    startsBoxDrag(press({detail: 2}), at, area),
    false,
    "the second press of a double-click",
  );
  const svg = document.createElementNS(SVG, "svg");
  const timeline = document.createElementNS(SVG, "g");
  timeline.setAttribute("class", "d3plus-viz-timeline");
  const rect = document.createElementNS(SVG, "rect");
  timeline.appendChild(rect);
  svg.appendChild(timeline);
  assert.strictEqual(
    startsBoxDrag(press({target: rect}), at, area),
    false,
    "a press on the timeline's brush",
  );
});

it("bindZoomGestures binds the box drag for zoomDrag brush, and unbindZoomGestures removes it", () => {
  const svg = document.createElementNS(SVG, "svg");
  const tgt = select(svg);
  const viz = {schema: {zoomDrag: "brush", zoomDoubleClick: "in"}};
  const zoomIn = () => {};
  tgt.on("dblclick.zoom", zoomIn);
  bindZoomGestures(viz, tgt, () => {});
  assert.ok(listeners(svg).includes("mousedown.zoombox"));
  assert.strictEqual(tgt.on("dblclick.zoom"), zoomIn, "d3-zoom's dblclick");
  viz.schema.zoomDrag = "pan";
  bindZoomGestures(viz, tgt, () => {});
  assert.ok(!listeners(svg).includes("mousedown.zoombox"), "pan drops it");
  viz.schema.zoomDrag = "brush";
  bindZoomGestures(viz, tgt, () => {});
  unbindZoomGestures(tgt);
  assert.ok(!listeners(svg).includes("mousedown.zoombox"), "unbound");
});

it("bindZoomGestures makes a double-click reset for zoomDoubleClick reset, and drops it for false", () => {
  const svg = document.createElementNS(SVG, "svg");
  document.body.appendChild(svg);
  const tgt = select(svg);
  const viz = {schema: {zoomDrag: "pan", zoomDoubleClick: "reset"}};
  let resets = 0;
  let zooms = 0;
  tgt.on("dblclick.zoom", () => zooms++);
  bindZoomGestures(viz, tgt, () => resets++);
  svg.dispatchEvent(new window.MouseEvent("dblclick", {bubbles: true}));
  assert.strictEqual(resets, 1, "a double-click resets");
  assert.strictEqual(zooms, 0, "and doesn't zoom in");
  svg.dispatchEvent(
    new window.MouseEvent("dblclick", {bubbles: true, ctrlKey: true}),
  );
  assert.strictEqual(resets, 1, "Ctrl + double-click is left alone");

  viz.schema.zoomDoubleClick = false;
  bindZoomGestures(viz, tgt, () => resets++);
  assert.strictEqual(tgt.on("dblclick.zoom"), undefined, "no listener");
  svg.dispatchEvent(new window.MouseEvent("dblclick", {bubbles: true}));
  assert.strictEqual(resets, 1, "a double-click does nothing");
  svg.remove();
});

it("showsZoomControls and the room the buttons take follow zoomControls", () => {
  const chart = new Treemap();
  assert.strictEqual(showsZoomControls(chart), true);
  assert.ok(zoomControlsBox(chart), "the buttons take room");
  assert.ok(zoomControlsReach(chart) > 0);
  chart.zoomControls(false);
  assert.strictEqual(showsZoomControls(chart), false);
  assert.strictEqual(zoomControlsBox(chart), null, "no room for buttons");
  assert.strictEqual(zoomControlsReach(chart), 0);
  chart.zoomControls(true).zoom(false);
  assert.strictEqual(showsZoomControls(chart), false, "zoom: false hides them");
});

it("minimapAnchor hangs the minimap from the buttons, or the chart area's top without them", () => {
  const chart = new Treemap();
  assert.deepStrictEqual(minimapAnchor(chart), zoomControlsBox(chart));
  chart.zoomControls(false);
  chart._margin = {top: 42, right: 0, bottom: 0, left: 0};
  const anchor = minimapAnchor(chart);
  assert.ok(anchor.width > 0, "as wide as the default buttons");
  assert.strictEqual(anchor.height, 42, "down to the chart area's top");
  chart.zoom(false);
  assert.strictEqual(minimapAnchor(chart), null, "no minimap without zoom");
});

it("the zoom actions do nothing before a chart renders", () => {
  const chart = new Treemap();
  assert.strictEqual(canZoom(chart), false);
  zoomBy(chart, 2);
  setZoomBrush(chart, true);
  assert.strictEqual(chart._zoomTransform, undefined);
  assert.strictEqual(chart.zoomBrush(), false);
  assert.strictEqual(chart.zoomIn(), chart, "zoomIn chains");
  assert.strictEqual(chart.zoomOut(), chart, "zoomOut chains");
  assert.strictEqual(chart.zoomReset(), chart, "zoomReset chains");
  assert.strictEqual(chart.zoomBrush(true), chart, "zoomBrush(on) chains");
  assert.strictEqual(chart.zoomBrush(), false, "still not brushing");
});

it("canZoom needs zoom on and a rendered zoom surface", () => {
  const svg = document.createElementNS(SVG, "svg");
  const chart = new Treemap();
  chart._container = select(svg);
  chart._brushGroup = select(svg);
  assert.strictEqual(canZoom(chart), true);
  chart.zoom(false);
  assert.strictEqual(canZoom(chart), false);
});

it("config() reflection leaves the zoom actions out and never runs them", () => {
  const chart = new Treemap();
  let calls = 0;
  for (const key of ["zoomIn", "zoomOut", "zoomReset", "zoomBrush"])
    chart[key] = () => (calls++, chart);
  const cfg = chart.config();
  assert.strictEqual(calls, 0, "no zoom action runs");
  for (const key of ["zoomIn", "zoomOut", "zoomReset", "zoomBrush"])
    assert.ok(!(key in cfg), `${key} is not config`);
  assert.strictEqual(cfg.zoomControls, true, "zoomControls is config");
});
