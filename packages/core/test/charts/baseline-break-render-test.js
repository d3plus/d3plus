import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    A BarChart whose value domain stops short of zero (#645) keeps 0 as the
    axis's end tick, breaks the axis between 0 and the domain, and starts its
    bars at the 0 tick — so they never run past the axis into the legend.
*/

const data = [
  {id: "A", v: 1500},
  {id: "B", v: 1800},
  {id: "C", v: 1250},
  {id: "D", v: 2000},
];

/** Renders `src` (a `lib => viz` builder) and reports the value axis + bars. */
const probe = (src, opts = {}) =>
  render(
    '<div id="viz" style="width:700px;height:450px"></div>',
    ([src, data, opts]) =>
      new Promise((resolve, reject) => {
        try {
          const viz = new Function("lib", "data", `return (${src})(lib, data);`)(window.d3plus, data)
            .duration(0)
            .select("#viz");
          viz.render(() => {
            const vertical = viz.schema.discrete !== "y";
            const axis = vertical ? viz._yAxis : viz._xAxis;
            const along = vertical ? "y" : "x";
            const size = vertical ? "height" : "width";
            const bars = [];
            const walk = n => {
              if (n.shapeType === "Bar" && n.type === "rect") {
                const t = n.transform || {x: 0, y: 0};
                bars.push([t[along] + n[along], t[along] + n[along] + n[size]]);
              }
              (n.children || []).forEach(walk);
            };
            viz._chartScene.forEach(walk);
            const scene = axis.toScene().children;
            // Break-mark cross-axis coordinates, against the axis line.
            const marks = scene
              .filter(n => String(n.key).startsWith("baseline-break"))
              .map(n => n.points.map(p => p[vertical ? 0 : 1]));
            const barLine = scene.find(n => n.key === "bar");
            const axisLine = barLine ? barLine.points[0][vertical ? 0 : 1] : undefined;
            const grid = scene
              .filter(n => typeof n.key === "string" && n.key.startsWith("grid-"))
              .map(n => n.points[0][vertical ? 1 : 0]);
            if (opts.zoom) viz._zoomRescale({k: 1, x: 0, y: 0});
            resolve({
              brk: axis._baselineBreak,
              vertical,
              range: axis._getRange(),
              domain: axis._d3Scale.domain(),
              ticks: axis._visibleTicks.map(Number),
              zero: axis._getPosition(0),
              lines: scene.filter(n => n.type === "line" && !String(n.key).startsWith("grid")).map(n => n.key),
              grid,
              marks,
              axisLine,
              bars,
              canvas: !!document.querySelector("#viz canvas.d3plus-render-canvas"),
              zoomed: opts.zoom
                ? {brk: axis._baselineBreak, domain: axis._d3Scale.domain(), zero: axis._getPosition(0)}
                : undefined,
            });
          });
        } catch (e) {
          reject(e);
        }
      }),
    [src, data, opts],
  );

const lo = r => Math.min(...r);
const hi = r => Math.max(...r);

/** Asserts a vertical/horizontal broken value axis with bars resting on the 0 tick. */
function assertBroken(out, {end}) {
  assert.ok(out.brk, "the value axis breaks");
  assert.strictEqual(out.zero, end(out.range), "0 sits at the axis end");
  assert.ok(out.ticks.includes(0) && out.ticks.includes(1100), "0 and the domain min are ticks");
  assert.ok(!out.ticks.some(t => t > 0 && t < 1100), "no ticks inside the break");
  assert.ok(out.lines.includes("baseline-break-0") && out.lines.includes("baseline-break-1"), "break glyph drawn");
  // Marks sit outside the plot: left of a y axis line, below an x axis line.
  const outward = out.vertical ? -1 : 1;
  out.marks.flat().forEach(c =>
    assert.ok((c - out.axisLine) * outward >= 0, `break mark at ${c} stays outside the plot (axis line ${out.axisLine})`),
  );
  const [g0, g1] = [lo([out.brk.position, out.brk.edgePosition]), hi([out.brk.position, out.brk.edgePosition])];
  assert.ok(!out.grid.some(g => g > g0 && g < g1), "no gridline inside the break");
  assert.strictEqual(out.bars.length, 4);
  out.bars.forEach(([a, b]) => {
    const base = Math.abs(a - out.zero) < Math.abs(b - out.zero) ? a : b;
    assert.ok(Math.abs(base - out.zero) <= 1, `bar starts at the 0 tick (${base} vs ${out.zero})`);
    assert.ok(lo([a, b]) >= lo(out.range) - 1 && hi([a, b]) <= hi(out.range) + 1, "bar stays inside the axis");
  });
}

it("BarChart: yDomain above zero breaks the y axis and rests bars on the 0 tick", async function () {
  this.timeout(60000);
  const out = await probe(`(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yDomain([1100, 2100])`);
  assertBroken(out, {end: hi});
  assert.deepStrictEqual(out.domain, [2100, 1100], "the axis keeps the user's domain");
});

it("BarChart: a yConfig domain above zero breaks the same way", async function () {
  this.timeout(60000);
  const out = await probe(`(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yConfig({domain: [1100, 2100]})`);
  assertBroken(out, {end: hi});
});

it("BarChart: horizontal bars break the x axis at its left end", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").discrete("y").y("id").x("v").xConfig({domain: [1100, 2100]})`,
  );
  assertBroken(out, {end: lo});
});

it("BarChart: an all-negative domain breaks at the top, with 0 as the top tick", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data.map(d => ({...d, v: -d.v}))).groupBy("id").x("id").y("v").yDomain([-2100, -1100])`,
  );
  assert.ok(out.brk, "breaks");
  assert.strictEqual(out.zero, lo(out.range), "0 sits at the top of the axis");
  assert.ok(out.ticks.includes(0) && out.ticks.includes(-1100));
  out.bars.forEach(([a]) => assert.ok(Math.abs(a - out.zero) <= 1, "bars hang from the 0 tick"));
  assert.strictEqual(out.marks.length, 2);
  out.marks.flat().forEach(c => assert.ok(c <= out.axisLine, `break mark at ${c} stays left of the y axis line`));
});

it("BarChart: the Canvas renderer draws the broken axis too", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yDomain([1100, 2100]).renderer("canvas")`,
  );
  assert.ok(out.canvas, "painted to a canvas");
  assertBroken(out, {end: hi});
});

it("BarChart: baselineBreak(false) keeps a yConfig domain unbroken but clamps bars at the axis", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yConfig({domain: [1100, 2100]}).baselineBreak(false)`,
  );
  assert.strictEqual(out.brk, null, "no break");
  assert.ok(!out.ticks.includes(0), "no 0 tick");
  assert.ok(out.zero > hi(out.range), "0 maps below the axis");
  out.bars.forEach(([a, b]) => {
    assert.ok(lo([a, b]) >= lo(out.range) - 1, "bar top inside the axis");
    assert.ok(hi([a, b]) <= hi(out.range) + 1, `bar base clamped to the axis (${hi([a, b])} vs ${hi(out.range)})`);
  });
});

it("BarChart: baselineBreak(false) with yDomain stretches the domain to 0 instead", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yDomain([1100, 2100]).baselineBreak(false)`,
  );
  assert.strictEqual(out.brk, null);
  assert.strictEqual(Math.min(...out.domain), 0, "domain reaches the baseline");
});

it("BarChart: bars above the domain max are clamped at the top of the axis", async function () {
  this.timeout(60000);
  const out = await probe(`(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yDomain([1100, 1600])`);
  assert.ok(out.brk, "breaks");
  out.bars.forEach(([a]) => assert.ok(a >= lo(out.range) - 1, `bar top ${a} inside the axis`));
});

it("BarChart: a data-driven domain still starts at 0 with no break", async function () {
  this.timeout(60000);
  const out = await probe(`(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v")`);
  assert.strictEqual(out.brk, null);
  assert.strictEqual(Math.min(...out.domain), 0);
  assert.deepStrictEqual(out.lines, ["bar"], "single axis line");
});

it("LinePlot: a yDomain above zero does not break the axis", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.LinePlot().data(data.map((d, i) => ({...d, id: "s", x: i}))).groupBy("id").x("x").y("v").yDomain([1100, 2100])`,
  );
  assert.strictEqual(out.brk, null);
  assert.deepStrictEqual(out.domain, [2100, 1100]);
});

it("BarChart: zooming a broken axis keeps the break and its mapping", async function () {
  this.timeout(60000);
  const out = await probe(
    `(lib, data) => new lib.BarChart().data(data).groupBy("id").x("id").y("v").yDomain([1100, 2100]).zoom(true)`,
    {zoom: true},
  );
  assert.ok(out.zoomed.brk, "still broken at the identity zoom");
  assert.deepStrictEqual(out.zoomed.domain.map(Math.round), out.domain.map(Math.round), "same domain");
  assert.strictEqual(out.zoomed.zero, out.zero, "0 stays at the axis end");
});
