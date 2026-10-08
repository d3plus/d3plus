import assert from "assert";
import {Axis, AxisBottom, AxisLeft, AxisRight, AxisTop} from "../../es/index.js";
import {
  axisBarNodes,
  baselineBreakStyle,
  breakTickValues,
  brokenBarScene,
  resolveBaselineBreak,
} from "../../es/internal.js";
import it from "../jsdom.js";

/**
    Baseline axis breaks (#645): an axis whose domain stops short of its
    `baseline` keeps the baseline as its end tick, then breaks to the domain.
*/

const compute = axis => axis.renderMode("compute").select(null).render();

/** A left (vertical) axis over [1100, 2100], top-to-bottom like Plot's y axis. */
const leftAxis = config =>
  compute(
    new AxisLeft()
      .domain([2100, 1100])
      .height(400)
      .width(300)
      .baselineBreak(true)
      .config(config || {}),
  );

/** The axis scene's line children, by key. */
const lines = axis =>
  Object.fromEntries(
    axis
      .toScene()
      .children.filter(n => n.type === "line")
      .map(n => [n.key, n]),
  );

it("baselineBreakStyle reads the glyph settings, falling back on bad values", () => {
  const axis = new Axis();
  assert.deepStrictEqual(baselineBreakStyle(axis), {angle: 30, gap: 5, size: 10, space: 36, mask: false, lines: true});
  axis.baselineBreakConfig({angle: 45, gap: "wide", size: -4, space: 50, mask: "yes"});
  assert.deepStrictEqual(baselineBreakStyle(axis), {angle: 45, gap: 5, size: 0, space: 50, mask: false, lines: true});
});

it("resolveBaselineBreak finds the domain edge nearest the baseline", () => {
  const axis = new AxisBottom().domain([1100, 2100]).baselineBreak(true);
  compute(axis);
  const brk = resolveBaselineBreak(axis, [0, 400]);
  assert.deepStrictEqual(brk, {value: 0, position: 0, edge: 1100, edgePosition: 36});

  // An all-negative domain breaks at its top end instead.
  const neg = compute(new AxisBottom().domain([-2100, -1100]).baselineBreak(true));
  assert.deepStrictEqual(resolveBaselineBreak(neg, [0, 400]), {
    value: 0,
    position: 400,
    edge: -1100,
    edgePosition: 364,
  });
});

it("resolveBaselineBreak stays off when the break doesn't apply", () => {
  const off = (axis, range = [0, 400]) => resolveBaselineBreak(compute(axis), range);
  assert.strictEqual(off(new AxisBottom().domain([1100, 2100])), null, "baselineBreak defaults off");
  assert.strictEqual(off(new AxisBottom().domain([0, 2100]).baselineBreak(true)), null, "domain reaches the baseline");
  assert.strictEqual(off(new AxisBottom().domain([-5, 10]).baselineBreak(true)), null, "domain spans the baseline");
  assert.strictEqual(
    off(new AxisBottom().domain([1100, 2100]).baselineBreak(true).scale("log")),
    null,
    "only linear scales break",
  );
  assert.strictEqual(
    off(new AxisBottom().domain([1100, 2100]).baselineBreak(true), [0, 60]),
    null,
    "a range too short to hold the break",
  );
  assert.strictEqual(
    off(new AxisBottom().domain([1100, 2100]).baselineBreak(true).baseline(undefined)),
    null,
    "no numeric baseline",
  );
});

it("breakTickValues drops ticks inside a break and adds a baseline break's baseline", () => {
  const base = {start: 0, end: 1100, startPosition: 400, endPosition: 364, baseline: true, mask: false};
  assert.deepStrictEqual(breakTickValues([base], [500, 1100, 1500, 2000]), [1100, 1500, 2000, 0]);
  assert.deepStrictEqual(breakTickValues([base], [0, 1100]), [0, 1100], "keeps an existing baseline once");
  const inner = {start: 1300, end: 1700, startPosition: 200, endPosition: 164, baseline: false, mask: true};
  assert.deepStrictEqual(
    breakTickValues([inner], [1200, 1300, 1500, 1700, 1800]),
    [1200, 1300, 1700, 1800],
    "an explicit break drops what's inside it, keeps its edges, and adds no baseline",
  );
});

it("a broken axis maps the baseline to its end and the domain over the rest", () => {
  const axis = leftAxis();
  const brk = axis._baselineBreak;
  assert.ok(brk, "break is active");
  const [top, bottom] = axis._getRange();
  assert.strictEqual(axis._getPosition(0), bottom, "0 sits at the axis end");
  assert.strictEqual(axis._getPosition(1100), bottom - 36, "the domain min sits one break-length above it");
  assert.strictEqual(axis._getPosition(2100), top, "the domain max keeps the far end");
  assert.deepStrictEqual(axis._d3Scale.domain(), [2100, 1100], "the linear scale keeps the user domain");
  assert.strictEqual(axis._d3Scale.range()[1], bottom - 36, "the linear range stops at the break");
});

it("a broken axis ticks 0, then the domain min, then the usual ticks", () => {
  const axis = leftAxis();
  const ticks = axis._visibleTicks.map(Number);
  assert.strictEqual(ticks[ticks.length - 1], 0, "0 is the end tick");
  assert.strictEqual(ticks[ticks.length - 2], 1100, "the domain min is the next tick");
  assert.ok(!ticks.some(t => t > 0 && t < 1100), "no ticks inside the break");
  const labels = axis._tickShape._data.filter(d => d.text).map(d => d.id);
  assert.ok(labels.includes(0) && labels.includes(1100), "both are labeled");
});

it("explicit ticks inside the break are dropped and the baseline added", () => {
  const axis = leftAxis({ticks: [500, 1100, 1600, 2100]});
  const ticks = axis._availableTicks.map(Number).sort((a, b) => a - b);
  assert.deepStrictEqual(ticks, [0, 1100, 1600, 2100]);
});

it("no gridline is drawn inside the break", () => {
  const axis = leftAxis({gridSize: undefined});
  const brk = axis._baselineBreak;
  const lo = Math.min(brk.position, brk.edgePosition);
  const hi = Math.max(brk.position, brk.edgePosition);
  const grid = axis
    .toScene()
    .children.filter(n => typeof n.key === "string" && n.key.startsWith("grid-"));
  assert.ok(grid.length > 2, "gridlines drawn");
  grid.forEach(g => {
    const y = g.points[0][1];
    assert.ok(!(y > lo && y < hi), `gridline at ${y} is outside the break (${lo}–${hi})`);
  });
});

it("a broken axis splits its bar line and draws two parallel tilted marks", () => {
  const axis = leftAxis();
  const brk = axis._baselineBreak;
  const {bar, "bar-baseline": base, "baseline-break-0": m0, "baseline-break-1": m1} = lines(axis);
  assert.ok(bar && base && m0 && m1, "bar, baseline segment, and two marks");
  const center = (brk.position + brk.edgePosition) / 2;
  assert.strictEqual(base.points[0][1], brk.position, "baseline segment starts at the axis end");
  assert.strictEqual(base.points[1][1], center + 2.5, "and stops at the gap");
  assert.strictEqual(bar.points[0][1], center - 2.5, "main segment resumes after the 5px gap");
  assert.strictEqual(bar.points[1][1], axis._getPosition(2100), "and runs to the far end");
  // Parallel marks of the configured size, one at each side of the gap.
  const vec = m => [m.points[1][0] - m.points[0][0], m.points[1][1] - m.points[0][1]];
  const [v0, v1] = [vec(m0), vec(m1)];
  assert.ok(Math.abs(v0[0] - v1[0]) < 1e-9 && Math.abs(v0[1] - v1[1]) < 1e-9, "marks are parallel");
  assert.ok(Math.abs(Math.hypot(...v0) - 10) < 1e-9, "marks are 10px long");
  const tilt = (Math.atan2(Math.abs(v0[1]), Math.abs(v0[0])) * 180) / Math.PI;
  assert.ok(Math.abs(tilt - 30) < 1e-9, `marks tilt 30° from perpendicular (got ${tilt})`);
  const mid = m => (m.points[0][1] + m.points[1][1]) / 2;
  assert.strictEqual(Math.abs(mid(m0) - mid(m1)), 5, "marks sit the gap apart");
  assert.ok(m0.paint.stroke, "marks are stroked");
});

/**
    For each orientation: the axis, the cross-axis coordinate index, and the
    sign of the tick side (where labels sit, away from the plot).
*/
const orientations = [
  ["left", () => new AxisLeft().domain([2100, 1100]).height(400).width(300), 0, -1],
  ["right", () => new AxisRight().domain([2100, 1100]).height(400).width(300), 0, 1],
  ["bottom", () => new AxisBottom().domain([1100, 2100]).width(400).height(100), 1, 1],
  ["top", () => new AxisTop().domain([1100, 2100]).width(400).height(100), 1, -1],
  ["left, all-negative", () => new AxisLeft().domain([-1100, -2100]).height(400).width(300), 0, -1],
  ["bottom, all-negative", () => new AxisBottom().domain([-2100, -1100]).width(400).height(100), 1, 1],
];

orientations.forEach(([name, make, crossIndex, outward]) => {
  it(`break marks stay on the tick side of a ${name} axis`, () => {
    const axis = compute(make().baselineBreak(true));
    assert.ok(axis._baselineBreak, "break is active");
    const {bar, "baseline-break-0": m0, "baseline-break-1": m1} = lines(axis);
    const line = bar.points[0][crossIndex];
    [m0, m1].forEach(m => {
      assert.strictEqual(m.points[0][crossIndex], line, "mark starts on the axis line");
      const reach = (m.points[1][crossIndex] - line) * outward;
      assert.ok(reach > 0, `mark runs outward (${reach})`);
      m.points.forEach(p =>
        assert.ok((p[crossIndex] - line) * outward >= 0, `no point crosses into the plot (${p})`),
      );
    });
    // The far ends lean toward the baseline, matching on both marks.
    const along = 1 - crossIndex;
    const lean = m => (m.points[1][along] - m.points[0][along]) * Math.sign(axis._baselineBreak.edgePosition - axis._baselineBreak.position);
    assert.ok(lean(m0) < 0 && Math.abs(lean(m0) - lean(m1)) < 1e-9, "parallel, leaning toward the baseline");
  });
});

it("baselineBreakConfig styles the glyph", () => {
  const axis = leftAxis({baselineBreakConfig: {gap: 8, size: 20, angle: 0, space: 50, stroke: "red", "stroke-width": 2}});
  const brk = axis._baselineBreak;
  assert.strictEqual(brk.position - brk.edgePosition, 50, "space sets the break length");
  const {"baseline-break-0": m0, "baseline-break-1": m1} = lines(axis);
  assert.strictEqual(m0.paint.stroke, "red");
  assert.strictEqual(m0.paint.strokeWidth, 2);
  assert.strictEqual(m0.points[0][1], m0.points[1][1], "angle 0 draws marks perpendicular to the axis");
  assert.strictEqual(Math.abs(m0.points[1][0] - m0.points[0][0]), 20, "size sets the mark length");
  assert.strictEqual(Math.abs(m0.points[0][1] - m1.points[0][1]), 8, "gap separates the marks");
});

it("a horizontal broken axis breaks at its left end", () => {
  const axis = compute(new AxisBottom().domain([1100, 2100]).width(400).height(100).baselineBreak(true));
  const brk = axis._baselineBreak;
  assert.strictEqual(axis._getPosition(0), axis._getRange()[0], "0 at the left end");
  assert.strictEqual(brk.edgePosition - brk.position, 36);
  const {bar, "bar-baseline": base} = lines(axis);
  assert.strictEqual(base.points[0][0], brk.position);
  assert.ok(bar.points[0][0] > base.points[1][0], "the gap sits between the segments");
  assert.strictEqual(bar.points[0][1], base.points[0][1], "both segments share the axis line");
});

it("without baselineBreak the axis draws a single bar line", () => {
  const axis = compute(new AxisLeft().domain([2100, 1100]).height(400).width(300));
  assert.strictEqual(axis._baselineBreak, null);
  assert.deepStrictEqual(Object.keys(lines(axis)).filter(k => !k.startsWith("grid")), ["bar"]);
  assert.ok(!axis._visibleTicks.includes(0), "no baseline tick");
});

it("axisBarNodes falls back to one line, and brokenBarScene builds the split bar", () => {
  const axis = compute(new AxisBottom().domain([0, 10]));
  const points = [[0, 5], [100, 5]];
  const plain = axisBarNodes(axis, points, () => ({stroke: "blue"}));
  assert.deepStrictEqual(plain, [{type: "line", key: "bar", points, paint: {stroke: "blue"}}]);

  const brk = {start: 0, end: 10, startPosition: 0, endPosition: 36, baseline: true, mask: false};
  const nodes = brokenBarScene(axis, [brk], [[36, 5], [100, 5]], {stroke: "a"}, () => ({stroke: "b"}));
  assert.deepStrictEqual(nodes.map(n => n.key), ["bar-baseline", "bar", "baseline-break-0", "baseline-break-1"]);
  assert.deepStrictEqual(nodes[0].points, [[0, 5], [15.5, 5]]);
  assert.deepStrictEqual(nodes[1].points, [[20.5, 5], [100, 5]]);
  assert.strictEqual(nodes[2].paint.stroke, "b");
});
