import assert from "assert";
import it from "../jsdom.js";
import {AxisBottom, AxisLeft} from "../../es/index.js";
import {
  BREAK_MASK_KEY,
  bandPolygons,
  barColumns,
  maskBreaks,
  maskPath,
  unwrapBreakMasks,
} from "../../es/src/charts/Plot/breakMask.js";
import {plotAxisConfig} from "../../es/src/charts/Plot/baselineBreak.js";

/**
    Break masks (#767): a clip that cuts each masked break's gap across the
    plot content, slanted across bars.
*/

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
  const otherWay = sameWay.slice().reverse();
  for (const hole of [sameWay, otherWay]) {
    const [o, h] = rings(maskPath(outer, [hole]));
    assert.ok(Math.sign(area(o)) !== Math.sign(area(h)), "hole winds the other way, so nonzero fill skips it");
  }
});

it("barColumns finds bar extents across nested transforms and merges overlaps", () => {
  const bar = (x, w, t) => ({type: "rect", shapeType: "Bar", key: `b${x}`, x, y: -50, width: w, height: 50, transform: t});
  const nodes = [
    bar(-10, 20, {x: 100, y: 0}),
    bar(-10, 20, {x: 105, y: 0}),
    {type: "group", key: "g", transform: {x: 200, y: 0}, children: [bar(0, 30, {x: 0, y: 0})]},
    {type: "rect", key: "not-a-bar", x: 0, y: 0, width: 500, height: 5},
  ];
  assert.deepStrictEqual(barColumns(nodes, true), [[89, 116], [199, 231]], "x spans, padded a pixel, merged");
  assert.deepStrictEqual(barColumns(nodes, false), [[-51, 1]], "y spans for an x-axis band");
});

it("bandPolygons runs straight between columns and slants across them", () => {
  const toXY = (along, cross) => [cross, along];
  const polys = bandPolygons([100, 105], [0, 300], [[50, 150]], () => 0.1, toXY);
  assert.strictEqual(polys.length, 3, "straight, slanted column, straight");
  assert.deepStrictEqual(polys[0], [[0, 100], [50, 100], [50, 105], [0, 105]]);
  assert.deepStrictEqual(polys[1], [[50, 95], [150, 105], [150, 110], [50, 100]], "slope 0.1 across a 100px column");
  assert.deepStrictEqual(polys[2], [[150, 100], [300, 100], [300, 105], [150, 105]]);
  assert.strictEqual(bandPolygons([100, 105], [0, 300], [], () => 0, toXY).length, 1, "no bars: one band");
});

it("maskBreaks wraps content in a clip group per axis with masked breaks", () => {
  const yAxis = new AxisLeft().domain([1000, 0]).height(400).width(300).break([100, 900]).renderMode("compute").select(null).render();
  const xAxis = new AxisBottom().domain([0, 1000]).width(400).height(100).break([200, 800]).renderMode("compute").select(null).render();
  const viz = {schema: {discrete: "x"}, _yAxis: yAxis, _xAxis: xAxis};
  const nodes = [{type: "rect", key: "a", x: 0, y: 0, width: 5, height: 5}];
  const out = maskBreaks(viz, nodes, {xRange: [0, 400], yRange: [0, 400], x2Height: 0});
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].key, `${BREAK_MASK_KEY}-x`, "x mask outside");
  assert.strictEqual(out[0].children[0].key, `${BREAK_MASK_KEY}-y`, "y mask inside");
  assert.strictEqual(out[0].clip.type, "path");
  assert.deepStrictEqual(unwrapBreakMasks(out), nodes, "unwrapping returns the content");

  yAxis.breakConfig({mask: false}).render();
  xAxis.break(false).render();
  assert.strictEqual(maskBreaks(viz, nodes, {xRange: [0, 400], yRange: [0, 400], x2Height: 0}), nodes, "no masks: untouched");
});

it("a y break's band lands in the axis gap, shifted by the x2 axis height", () => {
  const yAxis = new AxisLeft().domain([1000, 0]).height(400).width(300).break([100, 900]).renderMode("compute").select(null).render();
  const viz = {schema: {discrete: "x"}, _yAxis: yAxis, _xAxis: undefined};
  const [group] = maskBreaks(viz, [], {xRange: [10, 390], yRange: [0, 400], x2Height: 20});
  const [, hole] = rings(group.clip.d);
  const ys = hole.map(p => p[1]);
  const brk = yAxis._breaks[0];
  const center = (brk.startPosition + brk.endPosition) / 2 - 20;
  assert.ok(Math.abs(Math.min(...ys) - (center - 2.5)) < 1e-9 && Math.abs(Math.max(...ys) - (center + 2.5)) < 1e-9);
  assert.deepStrictEqual([Math.min(...hole.map(p => p[0])), Math.max(...hole.map(p => p[0]))], [10, 390], "spans the plot");
});

it("plotAxisConfig folds xBreak/yBreak into the axis config, always setting break", () => {
  assert.deepStrictEqual(plotAxisConfig({schema: {yBreak: [1, 2]}, _yConfig: {title: "t"}}, "y"), {break: [1, 2], title: "t"});
  assert.deepStrictEqual(plotAxisConfig({schema: {}, _xConfig: {}}, "x"), {break: false}, "cleared when unset");
  assert.deepStrictEqual(
    plotAxisConfig({schema: {yBreak: [1, 2]}, _yConfig: {break: [3, 4]}}, "y"),
    {break: [3, 4]},
    "a yConfig break wins",
  );
});
