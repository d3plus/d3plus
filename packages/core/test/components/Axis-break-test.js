import assert from "assert";
import {AxisBottom, AxisLeft, AxisRight, AxisTop} from "../../es/index.js";
import {applyAxisBreaks, breakGap, breakStyle} from "../../es/src/components/Axis/axisBreak.js";
import {isBrokenScale} from "../../es/src/components/Axis/brokenScale.js";
import it from "../jsdom.js";

/**
    Explicit axis breaks (#766): `break` removes value ranges from a linear
    axis, drawn with the same glyph as the baseline break.
*/

const compute = axis => axis.renderMode("compute").select(null).render();

const leftAxis = config =>
  compute(new AxisLeft().domain([1000, 0]).height(400).width(300).config(config || {}));

const sceneLines = axis =>
  Object.fromEntries(
    axis
      .toScene()
      .children.filter(n => n.type === "line")
      .map(n => [n.key, n]),
  );

it("breakStyle reads breakConfig, with mask on by default", () => {
  const axis = new AxisLeft();
  assert.deepStrictEqual(breakStyle(axis), {angle: 30, gap: 5, size: 10, space: 36, mask: true});
  axis.breakConfig({mask: false, space: 50});
  assert.deepStrictEqual(breakStyle(axis), {angle: 30, gap: 5, size: 10, space: 50, mask: false});
  assert.strictEqual(breakStyle(axis, "baselineBreakConfig").mask, false, "the baseline break defaults to no mask");
});

it("break removes a value range and swaps in a broken scale", () => {
  const axis = leftAxis({break: [100, 900]});
  assert.ok(isBrokenScale(axis._d3Scale));
  assert.strictEqual(axis._breaks.length, 1);
  const [brk] = axis._breaks;
  assert.strictEqual(brk.start, 100, "start is the edge nearer the baseline");
  assert.strictEqual(brk.end, 900);
  assert.strictEqual(brk.baseline, false);
  assert.strictEqual(brk.mask, true);
  assert.strictEqual(brk.startPosition - brk.endPosition, 36, "the break spans its space");
  assert.strictEqual(axis._getPosition(100), brk.startPosition);
  assert.deepStrictEqual(axis._d3Scale.domain(), [1000, 0], "the scale still reports the domain");
});

it("a broken axis ticks each side of the break and labels both edges", () => {
  const axis = leftAxis({break: [100, 900]});
  const ticks = axis._visibleTicks.map(Number);
  assert.ok(!ticks.some(t => t > 100 && t < 900), "no ticks inside the break");
  assert.ok(ticks.includes(100) && ticks.includes(900), "both edges are ticks");
  assert.ok(ticks.some(t => t > 0 && t < 100) && ticks.some(t => t > 900 && t < 1000), "each side keeps its own ticks");
  const labels = axis._tickShape._data.filter(d => d.text).map(d => d.id);
  assert.ok(labels.includes(100) && labels.includes(900), "both edges are labeled");
});

it("no gridline is drawn inside an explicit break", () => {
  const axis = leftAxis({break: [100, 900], gridSize: undefined});
  const [brk] = axis._breaks;
  const grid = axis.toScene().children.filter(n => String(n.key).startsWith("grid-"));
  assert.ok(grid.length > 2);
  grid.forEach(g => {
    const y = g.points[0][1];
    assert.ok(!(y > brk.endPosition && y < brk.startPosition), `gridline at ${y} outside the break`);
  });
});

it("an explicit break gaps the axis line and draws its marks", () => {
  const axis = leftAxis({break: [100, 900]});
  const lines = sceneLines(axis);
  assert.ok(lines.bar && lines["bar-1"] && lines["break-0-0"] && lines["break-0-1"]);
  const [g0, g1] = breakGap(axis, axis._breaks[0]);
  assert.strictEqual(g1 - g0, 5, "gap is breakConfig.gap");
  const ends = [lines.bar, lines["bar-1"]].flatMap(l => l.points.map(p => p[1]));
  assert.ok(ends.includes(g0) && ends.includes(g1), "the axis line stops at both sides of the gap");
  assert.ok(!lines["bar-baseline"], "no baseline segment");
});

it("several breaks each get a gap and marks", () => {
  const axis = leftAxis({break: [[100, 300], [500, 800]]});
  assert.strictEqual(axis._breaks.length, 2);
  const keys = Object.keys(sceneLines(axis)).filter(k => !k.startsWith("grid"));
  ["bar", "bar-1", "bar-2", "break-0-0", "break-0-1", "break-1-0", "break-1-1"].forEach(k =>
    assert.ok(keys.includes(k), `${k} drawn`),
  );
});

it("breaks that don't fit are ignored", () => {
  assert.strictEqual(leftAxis({break: [-100, 500]})._breaks.length, 0, "starts outside the domain");
  assert.strictEqual(leftAxis({break: [500, 500]})._breaks.length, 0, "empty range");
  assert.ok(!isBrokenScale(leftAxis({break: [-10, 2000]})._d3Scale), "swallows the domain");
  assert.strictEqual(
    compute(new AxisLeft().domain([1000, 0]).height(100).width(300).break([100, 900]))._breaks.length,
    0,
    "range too short",
  );
  assert.strictEqual(
    compute(new AxisLeft().domain([1000, 1]).scale("log").height(400).break([10, 100]))._breaks.length,
    0,
    "log scales don't break",
  );
});

it("an explicit break and a baseline break share the axis", () => {
  const axis = compute(
    new AxisLeft().domain([2100, 1100]).height(400).width(300).baselineBreak(true).break([1300, 1700]),
  );
  assert.strictEqual(axis._breaks.length, 2);
  assert.ok(axis._baselineBreak, "baseline break still resolves");
  assert.strictEqual(axis._getPosition(0), axis._getRange()[1], "0 at the axis end");
  const keys = Object.keys(sceneLines(axis));
  ["bar-baseline", "bar", "bar-1", "baseline-break-0", "break-0-0"].forEach(k => assert.ok(keys.includes(k), k));
  const ticks = axis._visibleTicks.map(Number);
  assert.ok(ticks.includes(0) && ticks.includes(1100) && ticks.includes(1300) && ticks.includes(1700));
});

it("breakConfig styles explicit breaks independently of baselineBreakConfig", () => {
  const axis = leftAxis({break: [100, 900], breakConfig: {stroke: "red", gap: 9, angle: 0, size: 20}});
  const {"break-0-0": m0, "break-0-1": m1} = sceneLines(axis);
  assert.strictEqual(m0.paint.stroke, "red");
  assert.strictEqual(Math.abs(m0.points[0][1] - m1.points[0][1]), 9);
  assert.strictEqual(Math.abs(m0.points[1][0] - m0.points[0][0]), 20, "angle 0 draws perpendicular marks of size 20");
});

const orientations = [
  ["left", () => new AxisLeft().domain([1000, 0]).height(400).width(300), 0, -1],
  ["right", () => new AxisRight().domain([1000, 0]).height(400).width(300), 0, 1],
  ["bottom", () => new AxisBottom().domain([0, 1000]).width(400).height(100), 1, 1],
  ["top", () => new AxisTop().domain([0, 1000]).width(400).height(100), 1, -1],
  ["left, negative", () => new AxisLeft().domain([0, -1000]).height(400).width(300), 0, -1],
];
orientations.forEach(([name, make, crossIndex, outward]) => {
  it(`explicit break marks stay on the tick side of a ${name} axis`, () => {
    const axis = compute(make().break(name.includes("negative") ? [-900, -100] : [100, 900]));
    const lines = sceneLines(axis);
    const line = lines.bar.points[0][crossIndex];
    [lines["break-0-0"], lines["break-0-1"]].forEach(m => {
      assert.strictEqual(m.points[0][crossIndex], line, "starts on the axis line");
      assert.ok((m.points[1][crossIndex] - line) * outward > 0, "runs outward");
    });
  });
});

it("applyAxisBreaks clears breaks when the axis no longer has any", () => {
  const axis = leftAxis({break: [100, 900]});
  assert.strictEqual(axis._breaks.length, 1);
  compute(axis.break(false));
  assert.strictEqual(axis._breaks.length, 0);
  assert.ok(!isBrokenScale(axis._d3Scale));
  applyAxisBreaks(axis, [0, 400]);
  assert.deepStrictEqual(axis._breaks, [], "direct call on an unbroken axis");
});
