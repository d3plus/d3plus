import assert from "assert";
import {autoZoomMax} from "../../es/src/charts/features/zoomExtent.js";

/**
    #85: the default maximum zoom is the scale at which the chart's smallest
    data shape fills the chart area (less padding), so a few large shapes
    need little zoom while a detailed map can zoom into its smallest path.
*/

const rect = (key, width, height, extra = {}) =>
  ({type: "rect", key, x: 0, y: 0, width, height, datum: {id: key}, ...extra});

it("autoZoomMax fits the smallest data shape to the padded chart area", () => {
  const nodes = [rect("big", 200, 200), rect("small", 10, 20)];
  // (400 - 2·20) / 10 = 36 across, (300 - 2·20) / 20 = 13 down → 13 fits both.
  assert.strictEqual(autoZoomMax(nodes, 400, 300, 20), 13);
});

it("autoZoomMax never drops below 1", () => {
  assert.strictEqual(autoZoomMax([rect("huge", 1000, 1000)], 400, 300, 20), 1);
  assert.strictEqual(autoZoomMax([], 400, 300, 20), 1);
});

it("autoZoomMax ignores decorations, labels, hit areas, and non-data nodes", () => {
  const nodes = [
    rect("big", 200, 200),
    rect("no-datum", 1, 1, {datum: undefined}),
    rect("a::hit", 1, 1),
    {type: "text", key: "label", x: 0, y: 0, lines: [], font: {}, datum: {}},
    {type: "group", key: "axis", datum: {}, children: [rect("tick", 1, 1)]},
  ];
  assert.strictEqual(autoZoomMax(nodes, 400, 300, 0), 1.5);
});

it("autoZoomMax measures circles and paths, and honors node and chart scale", () => {
  const circle = {type: "circle", key: "c", cx: 0, cy: 0, r: 5, datum: {}};
  assert.strictEqual(autoZoomMax([circle], 400, 300, 0), 30);
  assert.strictEqual(autoZoomMax([{...circle, transform: {scale: 2}}], 400, 300, 0), 15);
  assert.strictEqual(autoZoomMax([circle], 400, 300, 0, 3), 10);
  const path = {type: "path", key: "p", d: "M0,0L30,0L30,10Z", datum: {}};
  assert.strictEqual(autoZoomMax([path], 300, 300, 0), 10);
});

it("autoZoomMax measures a Line/Area series by its segments, not its full extent", () => {
  const line = {
    type: "path",
    key: "series",
    d: "M0,0L400,300",
    datum: {},
    interactionPoints: [
      {x: 0, y: 0, datum: {}, index: 0},
      {x: 100, y: 0, datum: {}, index: 1},
      {x: 400, y: 300, datum: {}, index: 2},
    ],
  };
  // The flat 100px first segment fills the 400px width at 4×.
  assert.strictEqual(autoZoomMax([line], 400, 300, 0), 4);
});

it("autoZoomMax lets a zero-width shape constrain only its other dimension", () => {
  assert.strictEqual(autoZoomMax([rect("sliver", 0, 30)], 400, 300, 0), 10);
  assert.strictEqual(autoZoomMax([rect("point", 0, 0)], 400, 300, 0), 1);
});
