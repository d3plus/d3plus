import {it} from "vitest";
import assert from "assert";
import {pie as d3Pie} from "d3-shape";
import {
  applyPieLayout,
  pieAspect,
  pieBaseRadius,
  pieSweepOf,
} from "../../src/charts/Pie/applyLayout.ts";
import {pieDef} from "../../src/charts/Pie/index.ts";
import {near} from "~test/helpers.js";

const field = key => pieDef.fields.find(f => f.key === key);
const data = [
  {id: "a", value: 50},
  {id: "b", value: 30},
  {id: "c", value: 20},
];
const mockViz = (schema = {}) => ({
  _filteredData: data,
  _margin: {top: 0, right: 0, bottom: 0, left: 0},
  ctx: {pie: d3Pie()},
  schema: {
    width: 600,
    height: 400,
    value: d => d.value,
    sort: (a, b) => b.value - a.value,
    innerRadius: 0,
    padPixel: 0,
    shapeConfig: {},
    startAngle: field("startAngle").default,
    endAngle: field("endAngle").default,
    ...schema,
  },
});

it("Pie fields: the sweep defaults to one turn from 12 o'clock", () => {
  assert.strictEqual(field("startAngle").default, 0);
  assert.strictEqual(field("endAngle").default, undefined);
});

it("pieSweepOf: reads startAngle and endAngle in degrees", () => {
  assert.deepStrictEqual(pieSweepOf(mockViz()), {start: 0, end: Math.PI * 2});
  const half = pieSweepOf(mockViz({startAngle: -90, endAngle: 90}));
  near(half.start, -Math.PI / 2, 1e-12, "start");
  near(half.end, Math.PI / 2, 1e-12, "end");
});

it("pieBaseRadius: the hole-less radius of the ring in the chart area", () => {
  assert.strictEqual(
    pieBaseRadius(mockViz()),
    200,
    "full: half the short side",
  );
  near(
    pieBaseRadius(mockViz({startAngle: -90, endAngle: 90})),
    300,
    1e-9,
    "half: half the width",
  );
  const margined = mockViz();
  margined._margin = {top: 50, right: 0, bottom: 50, left: 0};
  assert.strictEqual(pieBaseRadius(margined), 150, "inside the margins");
});

it("applyPieLayout: a full turn is centered, with the hover-stroke room kept", () => {
  const viz = mockViz();
  const {shapeData} = applyPieLayout({viz});
  assert.strictEqual(shapeData.length, 3);
  near(shapeData[0].startAngle, 0, 1e-12, "starts at 12");
  near(shapeData[2].endAngle, Math.PI * 2, 1e-12, "ends at 12");
  assert.deepStrictEqual(viz.ctx.pieCenter, {x: 300, y: 200});
  assert.deepStrictEqual(viz.ctx.pieBox, {
    x0: -197,
    x1: 197,
    y0: -197,
    y1: 197,
  });
  assert.strictEqual(viz.ctx.arcData.outerRadius()(), 197);
});

it("applyPieLayout: a half ring fills its sweep, centered", () => {
  const viz = mockViz({startAngle: -90, endAngle: 90, innerRadius: 100});
  const {shapeData} = applyPieLayout({viz});
  near(shapeData[0].startAngle, -Math.PI / 2, 1e-12, "starts at 9");
  near(shapeData[2].endAngle, Math.PI / 2, 1e-12, "ends at 3");
  near(
    shapeData[0].endAngle - shapeData[0].startAngle,
    Math.PI * 0.5,
    1e-12,
    "the largest slice fills half the sweep",
  );
  near(viz.ctx.pieCenter.x, 300, 1e-9, "centered");
  near(viz.ctx.pieCenter.y, 348.5, 1e-9, "footprint centered vertically");
  near(viz.ctx.arcData.outerRadius()(), 297, 1e-9, "fills the width");
  near(viz.ctx.pieBox.y1, 0, 1e-9, "nothing below the flat edge");
  assert.deepStrictEqual(viz.ctx.pieSweep, pieSweepOf(viz));
});

it("applyPieLayout: a hole lets a ring that would reach its center grow", () => {
  const tall = {width: 300, height: 600};
  const solid = mockViz({...tall, startAngle: 60, endAngle: 120});
  applyPieLayout({viz: solid});
  const ring = mockViz({
    ...tall,
    startAngle: 60,
    endAngle: 120,
    innerRadius: () => 150,
  });
  applyPieLayout({viz: ring});
  const r0 = solid.ctx.arcData.outerRadius()();
  const r1 = ring.ctx.arcData.outerRadius()();
  assert.ok(r1 > r0, `grows (${r0} → ${r1})`);
  near(ring.ctx.pieBox.x1 - ring.ctx.pieBox.x0, 294, 1e-3, "fills the width");
});

it("pieAspect: the footprint's width over its height", () => {
  assert.strictEqual(pieAspect(mockViz()), 1, "full circle");
  near(pieAspect(mockViz({startAngle: -90, endAngle: 90})), 2, 1e-9, "half");
  near(pieAspect(mockViz({startAngle: 0, endAngle: 90})), 1, 1e-9, "quarter");
  near(
    pieAspect(mockViz({startAngle: 0, endAngle: 180})),
    0.5,
    1e-9,
    "right half",
  );
});
