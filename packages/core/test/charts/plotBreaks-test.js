import assert from "assert";
import it from "../jsdom.js";
import {AxisBottom, AxisLeft} from "../../es/index.js";
import {
  bandPolygon,
  breakGap,
  breakLineNodes,
  breakLinePaint,
  maskBreaks,
  maskPath,
  plotAxisConfig,
  unwrapBreakMasks,
} from "../../es/internal.js";

/**
    A Plot's side of axis breaks (#766, #767): two lines across the plot from
    each break's marks, and a straight mask cut between them.
*/

const compute = axis => axis.renderMode("compute").select(null).render();
const yAxis = config => compute(new AxisLeft().domain([1000, 0]).height(400).width(300).config({break: [100, 900], ...config}));
const xAxis = config => compute(new AxisBottom().domain([0, 1000]).width(400).height(100).config({break: [200, 800], ...config}));
const frame = {xRange: [10, 390], yRange: [0, 400], x2Height: 0};
const stubViz = (y, x, discrete = "x") => ({
  schema: {discrete, colorDefaults: {dark: "#000", light: "#fff"}},
  _yAxis: y,
  _xAxis: x,
});

const area = p =>
  p.reduce((s, [x, y], i) => {
    const [nx, ny] = p[(i + 1) % p.length];
    return s + x * ny - nx * y;
  }, 0) / 2;

/** Parses a mask path back into polygons. */
const rings = d =>
  d
    .split("Z")
    .filter(Boolean)
    .map(r => r.replace("M", "").split("L").map(pt => pt.split(",").map(Number)));

it("maskPath winds holes against the outer ring", () => {
  const outer = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const sameWay = [[2, 2], [4, 2], [4, 4], [2, 4]];
  for (const hole of [sameWay, sameWay.slice().reverse()]) {
    const [o, h] = rings(maskPath(outer, [hole]));
    assert.ok(Math.sign(area(o)) !== Math.sign(area(h)), "hole winds the other way, so nonzero fill skips it");
  }
});

it("bandPolygon is a straight band across the plot, inset by half a line", () => {
  assert.deepStrictEqual(bandPolygon([100, 105], [10, 390], true), [[10, 100], [390, 100], [390, 105], [10, 105]], "horizontal for a y break");
  assert.deepStrictEqual(bandPolygon([100, 105], [0, 400], false, 0.5), [[100.5, 0], [104.5, 0], [104.5, 400], [100.5, 400]], "vertical for an x break, inset");
});

it("breakLineNodes runs two lines across the plot from each y break's marks", () => {
  const y = yAxis();
  const nodes = breakLineNodes(stubViz(y), {...frame, x2Height: 20});
  const [g0, g1] = breakGap(y, y._breaks[0]);
  assert.deepStrictEqual(nodes.map(n => n.key), ["break-line-y-0-0", "break-line-y-0-1"]);
  assert.deepStrictEqual(nodes[0].points, [[10, g0 - 20], [390, g0 - 20]], "horizontal, from the axis across, shifted by x2");
  assert.deepStrictEqual(nodes[1].points, [[10, g1 - 20], [390, g1 - 20]]);
  assert.strictEqual(nodes[0].interactive, false, "decorative");
  // The lines start where the break marks meet the axis line.
  const marks = y.toScene().children.filter(n => String(n.key).startsWith("break-0-"));
  const feet = marks.map(m => m.points[0][1]).sort((a, b) => a - b);
  assert.deepStrictEqual(feet, [g0, g1]);
});

it("breakLineNodes draws vertical lines for an x break", () => {
  const x = xAxis();
  const nodes = breakLineNodes(stubViz(undefined, x, "y"), frame);
  const [g0, g1] = breakGap(x, x._breaks[0]);
  assert.deepStrictEqual(nodes.map(n => n.points), [[[g0, 0], [g0, 400]], [[g1, 0], [g1, 400]]]);
});

it("breakLineNodes covers the baseline break too, and honors lines: false", () => {
  const base = compute(new AxisLeft().domain([2100, 1100]).height(400).width(300).baselineBreak(true));
  assert.strictEqual(breakLineNodes(stubViz(base), frame).length, 2, "baseline break lines");
  base.baselineBreakConfig({lines: false}).render();
  assert.strictEqual(breakLineNodes(stubViz(base), frame).length, 0, "toggled off");
  assert.strictEqual(breakLineNodes(stubViz(yAxis({breakConfig: {lines: false}})), frame).length, 0);
});

it("break lines take the gridline style, fall back when the grid is hidden, and take lineConfig", () => {
  const styled = yAxis({gridConfig: {stroke: "rgb(1, 2, 3)", "stroke-width": 2}});
  assert.deepStrictEqual(breakLinePaint(stubViz(styled), styled, styled._breaks[0]), {stroke: "rgb(1, 2, 3)", strokeWidth: 2});
  const hidden = yAxis({gridConfig: {stroke: "transparent"}});
  const paint = breakLinePaint(stubViz(hidden), hidden, hidden._breaks[0]);
  assert.ok(paint.stroke && paint.stroke !== "transparent", `still drawn with the grid hidden (${paint.stroke})`);
  const own = yAxis({breakConfig: {lineConfig: {stroke: "red", "stroke-dasharray": "2 2"}}});
  const ownPaint = breakLinePaint(stubViz(own), own, own._breaks[0]);
  assert.strictEqual(ownPaint.stroke, "red");
  assert.deepStrictEqual(ownPaint.strokeDasharray, [2, 2]);
});

it("maskBreaks cuts each masked break's gap as a straight band, per axis", () => {
  const y = yAxis();
  const x = xAxis();
  const nodes = [{type: "rect", key: "a", x: 0, y: 0, width: 5, height: 5}];
  const out = maskBreaks(stubViz(y, x), nodes, frame);
  assert.strictEqual(out[0].key, "plot-break-mask-x", "x mask outside");
  assert.strictEqual(out[0].children[0].key, "plot-break-mask-y", "y mask inside");
  assert.deepStrictEqual(unwrapBreakMasks(out), nodes);

  const [, hole] = rings(out[0].children[0].clip.d);
  const [g0, g1] = breakGap(y, y._breaks[0]);
  const ys = [...new Set(hole.map(p => p[1]))].sort((a, b) => a - b);
  assert.deepStrictEqual(ys, [g0 + 0.5, g1 - 0.5], "straight edges, between the two break lines");
  assert.deepStrictEqual([...new Set(hole.map(p => p[0]))].sort((a, b) => a - b), [10, 390], "spans the plot");

  const [, xHole] = rings(out[0].clip.d);
  assert.strictEqual(new Set(xHole.map(p => p[0])).size, 2, "the x band is vertical");
});

it("maskBreaks leaves content whole when no break asks for a mask", () => {
  const nodes = [{type: "rect", key: "a", x: 0, y: 0, width: 5, height: 5}];
  assert.strictEqual(maskBreaks(stubViz(yAxis({breakConfig: {mask: false}})), nodes, frame), nodes);
  const base = compute(new AxisLeft().domain([2100, 1100]).height(400).width(300).baselineBreak(true));
  assert.strictEqual(maskBreaks(stubViz(base), nodes, frame), nodes, "the baseline break is unmasked by default");
  base.baselineBreakConfig({mask: true}).render();
  assert.strictEqual(maskBreaks(stubViz(base), nodes, frame)[0].key, "plot-break-mask-y", "unless asked");
  const noLines = yAxis({breakConfig: {lines: false}});
  const [, hole] = rings(maskBreaks(stubViz(noLines), nodes, frame)[0].clip.d);
  const [g0, g1] = breakGap(noLines, noLines._breaks[0]);
  assert.deepStrictEqual([...new Set(hole.map(p => p[1]))].sort((a, b) => a - b), [g0, g1], "no lines, no inset");
});

it("plotAxisConfig folds xBreak/yBreak into the axis config, always setting break", () => {
  assert.deepStrictEqual(plotAxisConfig({schema: {yBreak: [1, 2]}, _yConfig: {title: "t"}}, "y"), {break: [1, 2], title: "t"});
  assert.deepStrictEqual(plotAxisConfig({schema: {}, _xConfig: {}}, "x"), {break: false}, "cleared when unset");
  assert.deepStrictEqual(plotAxisConfig({schema: {yBreak: [1, 2]}, _yConfig: {break: [3, 4]}}, "y"), {break: [3, 4]}, "a yConfig break wins");
});
