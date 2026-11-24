import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scaleTime} from "d3-scale";
import {
  dataWindow,
  liveTransform,
  windowTransform,
  zoomedDomain,
  zoomWindows,
} from "../../src/charts/Plot/zoomWindow.ts";

/**
    `zoomWindow.ts`: a Plot's zoom as windows of axis values — the window a
    transform shows, and the transform that shows a window — which the range
    selector and linked zoom share.
*/

/**
    A Plot whose plot rect is 300×200 at (60, 40) on the surface (ranges
    measured from a body at (50, 30)), rescaling `axes`.
*/
const plot = (axes, {reversed = {}, xData = [], yData = []} = {}) => {
  const scales = {
    x: scaleLinear().domain([0, 100]).range([10, 310]),
    y: scaleLinear().domain([50, 0]).range([10, 210]),
  };
  return {
    _plotZoomBase: {
      scales: Object.fromEntries(axes.map(a => [a, scales[a]])),
      chartTransform: {x: 50, y: 30},
      pCtx: {x2Height: 0, xData, yData},
      layout: {xRange: [10, 310], yRange: [10, 210]},
      reversed,
    },
  };
};

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

it("zoomedDomain: the identity shows the axis's whole domain", () => {
  const {_plotZoomBase: base} = plot(["x", "y"]);
  assert.deepStrictEqual(zoomedDomain(base, {k: 1, x: 0, y: 0}, "x"), [0, 100]);
  assert.deepStrictEqual(zoomedDomain(base, {k: 1, x: 0, y: 0}, "y"), [50, 0]);
});

it("zoomedDomain: a 2× zoom about the plot's left edge shows its first half", () => {
  const {_plotZoomBase: base} = plot(["x"]);
  // The plot's left edge sits at surface x 60: 60·2 + t = 60.
  const [lo, hi] = zoomedDomain(base, {k: 2, x: -60, y: 0}, "x");
  close(lo, 0, "lo");
  close(hi, 50, "hi");
});

it("zoomedDomain: a reversed axis gets its domain the way round it reverses", () => {
  const {_plotZoomBase: base} = plot(["x"], {reversed: {x: true}});
  assert.deepStrictEqual(zoomedDomain(base, {k: 1, x: 0, y: 0}, "x"), [100, 0]);
});

it("zoomWindows: the window along each rescaled dimension, low end first", () => {
  const viz = plot(["x", "y"]);
  const w = zoomWindows(viz, {k: 1, x: 0, y: 0});
  assert.deepStrictEqual(w, {x: [0, 100], y: [0, 50]});
  assert.deepStrictEqual(zoomWindows(plot(["x"]), {k: 1, x: 0, y: 0}), {
    x: [0, 100],
  });
  assert.deepStrictEqual(zoomWindows({}), {});
});

it("liveTransform: the identity for a chart without a zoom surface", () => {
  assert.deepStrictEqual(liveTransform({}), {k: 1, x: 0, y: 0});
});

it("windowTransform: shows a window along x, and round-trips through zoomWindows", () => {
  const viz = plot(["x"]);
  const t = windowTransform(viz, {x: [25, 50]});
  close(t.k, 4, "k");
  const {x} = zoomWindows(viz, t);
  close(x[0], 25, "start");
  close(x[1], 50, "end");
});

it("windowTransform: a window along y on a plot zooming both sets the scale; x stays centered", () => {
  const viz = plot(["x", "y"]);
  const t = windowTransform(viz, {y: [10, 20]});
  close(t.k, 5, "k");
  const w = zoomWindows(viz, t);
  close(w.y[0], 10, "y start");
  close(w.y[1], 20, "y end");
  // Centered on the plot's middle (x 50).
  close((w.x[0] + w.x[1]) / 2, 50, "x center");
});

it("windowTransform: works on a time axis", () => {
  const start = new Date(2024, 0, 1),
    end = new Date(2024, 11, 31);
  const viz = plot([]);
  viz._plotZoomBase.scales.x = scaleTime()
    .domain([start, end])
    .range([10, 310]);
  const mid = +new Date(2024, 6, 1);
  const t = windowTransform(viz, {x: [mid, +end]});
  const {x} = zoomWindows(viz, t);
  assert.ok(Math.abs(x[0] - mid) < 1000, "starts at the window's start");
  assert.ok(Math.abs(x[1] - +end) < 1000, "ends at the window's end");
});

it("windowTransform: null without a window along a rescaled axis", () => {
  assert.strictEqual(windowTransform(plot(["x"]), {y: [0, 10]}), null);
  assert.strictEqual(windowTransform(plot(["x"]), {x: [5, 5]}), null);
  assert.strictEqual(windowTransform({}, {x: [0, 10]}), null);
});

it("dataWindow: the extent of the data along an axis", () => {
  const viz = plot(["x"], {
    xData: [new Date(2024, 3, 1), null, new Date(2024, 0, 1), "x"],
    yData: [4, 9, -2],
  });
  assert.deepStrictEqual(dataWindow(viz, "x"), [
    +new Date(2024, 0, 1),
    +new Date(2024, 3, 1),
  ]);
  assert.deepStrictEqual(dataWindow(viz, "y"), [-2, 9]);
  assert.strictEqual(dataWindow(plot(["x"]), "x"), undefined);
  assert.strictEqual(dataWindow({}, "x"), undefined);
});
