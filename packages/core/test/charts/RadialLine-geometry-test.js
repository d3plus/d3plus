import {it} from "vitest";
import assert from "assert";
import {radialAngleScale} from "../../src/charts/RadialLine/angles.ts";
import {
  polarXY,
  radialAreaPath,
  radialCurve,
  radialLinePath,
} from "../../src/charts/RadialLine/paths.ts";
import {
  radialDomainValues,
  radialSeries,
} from "../../src/charts/RadialLine/series.ts";
import {radialSpokeNodes} from "../../src/charts/RadialLine/spokes.ts";

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} ≈ ${b}`);

const rows = [
  {id: "A", x: "b", y: 2},
  {id: "A", x: "a", y: 1},
  {id: "B", x: "a", y: 3},
  {id: "A", x: "c", y: Number.NaN},
  {id: "B", x: "c", y: -2},
  {id: "B", x: "z", y: 5},
];
const opts = scale => ({
  id: d => d.id,
  x: d => d.x,
  y: d => d.y,
  scale,
});

it("radialSeries places each group's points in axis order, from the baseline", () => {
  const scale = radialAngleScale(["a", "b", "c"], {domain: ["a", "b", "c"]});
  const [a, b] = radialSeries(rows, {...opts(scale), baseline: 1});
  assert.strictEqual(a.id, "A");
  assert.deepStrictEqual(a.rows, [rows[0], rows[1], rows[3]]);
  assert.deepStrictEqual(
    a.points.map(p => [p.key, p.value, p.y0, p.y1, p.i]),
    [
      ["a", 1, 1, 1, 1],
      ["b", 2, 1, 2, 0],
    ],
    "a non-finite value has no point",
  );
  assert.strictEqual(a.points[0].row, rows[1]);
  assert.deepStrictEqual(
    b.points.map(p => [p.key, p.y1]),
    [
      ["a", 3],
      ["c", -2],
    ],
    "an off-axis `x` is left out; negatives stay",
  );
});

it("radialSeries stacks each group on the ones before it, at every `x`", () => {
  const scale = radialAngleScale(["a", "b", "c"], {domain: ["a", "b", "c"]});
  const [a, b] = radialSeries(rows, {...opts(scale), stacked: true});
  assert.deepStrictEqual(
    a.points.map(p => [p.key, p.y0, p.y1, !!p.row]),
    [
      ["a", 0, 1, true],
      ["b", 0, 2, true],
      ["c", 0, 0, true],
    ],
  );
  assert.deepStrictEqual(
    b.points.map(p => [p.key, p.y0, p.y1, !!p.row, p.i]),
    [
      ["a", 1, 4, true, 2],
      ["b", 2, 2, false, -1],
      ["c", 0, 0, true, 4],
    ],
    "a missing row counts as 0 and a negative takes no room",
  );
  assert.deepStrictEqual(radialDomainValues([a, b]), [1, 2, 0, 4, 2, 0]);
});

it("radialSeries orders points counterclockwise and from the start angle", () => {
  const scale = radialAngleScale([0, 1, 2, 3], {
    clockwise: false,
    start: 1,
  });
  const data = [3, 1, 0, 2].map(x => ({id: "A", x, y: x}));
  const [s] = radialSeries(data, {
    ...opts(scale),
    clockwise: false,
    start: 1,
  });
  assert.deepStrictEqual(
    s.points.map(p => p.x),
    [0, 1, 2, 3],
  );
});

it("polarXY puts angle 0 at 12 o'clock and turns clockwise", () => {
  const [x0, y0] = polarXY(0, 10);
  close(x0, 0);
  close(y0, -10);
  const [x1, y1] = polarXY(Math.PI / 2, 10);
  close(x1, 10);
  close(y1, 0);
});

it("radialCurve closes the curves that have a closed form, and repeats the first point for the rest", () => {
  assert.strictEqual(radialCurve("linear", false).repeatFirst, false);
  assert.strictEqual(radialCurve("linear", true).repeatFirst, false);
  assert.strictEqual(radialCurve("catmullRom", true).repeatFirst, false);
  assert.strictEqual(radialCurve("natural", true).repeatFirst, true);
  assert.strictEqual(radialCurve("monotoneX", false).repeatFirst, false);
  assert.notStrictEqual(
    radialCurve("linear", true).curve,
    radialCurve("linear", false).curve,
  );
});

const square = [0, 1, 2, 3].map(k => ({angle: (k * Math.PI) / 2, r: 10}));

it("radialLinePath draws the points in order and closes the loop", () => {
  assert.strictEqual(radialLinePath([]), "");
  const closed = radialLinePath(square);
  assert.ok(/^M0,-10L10,0L0,10L-10,0Z$/.test(closed), closed);
  const open = radialLinePath(square, "linear", false);
  assert.ok(!open.includes("Z"), open);
  const natural = radialLinePath(square, "natural", true);
  assert.ok(/0,-10$/.test(natural), "repeats the first point to close");
});

it("radialAreaPath draws a ring when closed, its inner loop wound the other way", () => {
  assert.strictEqual(radialAreaPath([]), "");
  const ring = radialAreaPath(
    square.map(p => ({angle: p.angle, r0: 5, r1: 10})),
  );
  const loops = ring.split("Z").filter(Boolean);
  assert.strictEqual(loops.length, 2, ring);
  assert.ok(loops[0].startsWith("M0,-10L10,0"), loops[0]);
  assert.ok(loops[1].startsWith("M-5,0L0,5"), "the inner loop runs backward");
  const open = radialAreaPath(
    square.map(p => ({angle: p.angle, r0: 0, r1: 10})),
    "linear",
    false,
  );
  assert.strictEqual(open.split("Z").filter(Boolean).length, 1);
});

it("radialSpokeNodes draws a non-interactive spoke from the inner to the outer radius", () => {
  const style = {stroke: "#ccc", strokeWidth: (_r, i) => i + 1};
  const [group] = radialSpokeNodes(
    [
      {key: "a", angle: 0},
      {key: "b", angle: Math.PI / 2},
    ],
    5,
    20,
    style,
    "radial",
  );
  assert.strictEqual(group.key, "radial-spokes");
  assert.strictEqual(group.interactive, false);
  assert.deepStrictEqual(
    group.children.map(n => [
      n.key,
      n.d.replace(/-?[\d.e-]+/g, v => `${Math.round(+v)}`),
      n.paint.stroke,
      n.paint.strokeWidth,
    ]),
    [
      ["radial-spoke-a", "M0,-5L0,-20", "#ccc", 1],
      ["radial-spoke-b", "M5,0L20,0", "#ccc", 2],
    ],
  );
  assert.deepStrictEqual(radialSpokeNodes([], 0, 10, style, "r"), []);
  assert.deepStrictEqual(
    radialSpokeNodes([{key: "a", angle: 0}], 10, 10, style, "r"),
    [],
    "no room",
  );
});
