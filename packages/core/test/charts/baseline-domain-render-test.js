import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    `baseline(n)` renders exactly like `yDomain([n])` (or `xDomain([n])` on a
    horizontal chart): the same value axis, ticks, baseline-break marks, and
    shapes, with bars and areas still growing from the chart's own 0 behind
    the break. Each test renders both and compares the painted scenes node by
    node, ignoring keys.
*/

const rows = (values, groups = ["one", "two"]) =>
  ["A", "B", "C", "D"].flatMap((x, i) => groups.map((g, j) => ({x, g, v: values(i, j)})));
const DATA = {
  base: rows((i, j) => (j ? 990 + i * 5 : 1000 + i * 8)),
  below: rows((i, j) => (j ? 990 + i * 5 : 960 + i * 20)),
  mixed: rows((i, j) => (j ? -10 + i * 5 : -20 + i * 15)),
  negative: rows((i, j) => (j ? -90 - i * 5 : -100 - i * 8)),
};

/**
    Renders `src` (a `lib => viz` builder) over `DATA[set]` and reports the
    value axis (domain, ticks, break), where the chart's own baseline sits,
    the bars' value-axis spans, and the painted scene as geometry only.
*/
const probe = (src, set = "base") =>
  render(
    '<div id="viz" style="width:700px;height:450px"></div>',
    ([src, data]) =>
      new Promise((resolve, reject) => {
        try {
          const viz = new Function("lib", "data", `return (${src})(lib, data);`)(window.d3plus, data)
            .duration(0)
            .select("#viz");
          viz.render(() => {
            const vertical = viz._swarm ? viz._swarm.axis === "y" : viz.schema.discrete !== "y";
            const axis = vertical ? viz._yAxis : viz._xAxis;
            const along = vertical ? "y" : "x";
            const size = vertical ? "height" : "width";
            const round = v => Math.round(v * 100) / 100;
            const GEOMETRY = ["type", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "r", "d", "points", "text", "transform", "clip"];
            const bars = [];
            const geometry = n => {
              const out = {};
              for (const k of GEOMETRY) {
                if (n[k] === undefined) continue;
                out[k] = JSON.parse(JSON.stringify(n[k], (_, v) => (typeof v === "number" ? round(v) : v)));
              }
              if (n.children) out.children = n.children.map(geometry);
              return out;
            };
            const walk = (n, t0 = 0) => {
              const t = t0 + ((n.transform && n.transform[along]) || 0);
              if (n.shapeType === "Bar" && n.type === "rect") bars.push([round(t + n[along]), round(t + n[along] + n[size])]);
              (n.children || []).forEach(c => walk(c, t));
            };
            const scene = viz._sceneRenderer._scene.root.children;
            scene.forEach(n => walk(n));
            const domain = axis._d3Scale.domain().map(Number);
            const zero = axis._getPosition(0);
            resolve({
              domain: [Math.min(...domain), Math.max(...domain)],
              brk: axis._baselineBreak ? axis._baselineBreak.value : null,
              ticks: (axis._availableTicks || []).map(Number),
              zero: Number.isFinite(zero) ? round(zero) : null,
              // The pixel length of a bar from 0 to the smallest value, 990.
              span990: Number.isFinite(zero) ? round(Math.abs(zero - axis._getPosition(990))) : null,
              span980: Number.isFinite(zero) ? round(Math.abs(zero - axis._getPosition(980))) : null,
              bars,
              panels: (viz._facetPanels || []).map(p => p.state._plotAxisDomains[vertical ? "y" : "x"].map(Number)),
              scene: scene.map(geometry),
            });
          });
        } catch (e) {
          reject(e);
        }
      }),
    [src, DATA[set]],
  );

const chart = (name, extra = "") =>
  `(lib, data) => new lib.${name}().data(data).groupBy("g").x("x").y("v").legend(false)${extra}`;
const horizontal = (name, extra = "") =>
  `(lib, data) => new lib.${name}().data(data).groupBy("g").y("x").x("v").discrete("y").legend(false)${extra}`;

/** Renders `a` and `b` and asserts they paint the same scene; returns `a`'s probe. */
async function assertSame(a, b, set, what) {
  const [one, two] = [await probe(a, set), await probe(b, set)];
  assert.deepStrictEqual(one.domain, two.domain, `${what}: the same domain`);
  assert.deepStrictEqual(one.ticks, two.ticks, `${what}: the same ticks`);
  assert.strictEqual(one.brk, two.brk, `${what}: the same baseline break`);
  assert.deepStrictEqual(one.bars, two.bars, `${what}: the same bars`);
  assert.deepStrictEqual(one.scene, two.scene, `${what}: the same scene`);
  return one;
}

for (const name of ["BarChart", "AreaPlot", "StackedArea", "LinePlot"]) {
  it(`${name}: baseline(980) paints exactly what yDomain([980]) does`, async function () {
    this.timeout(60000);
    const out = await assertSame(chart(name, ".baseline(980)"), chart(name, ".yDomain([980])"), "base", name);
    assert.ok(out.domain[1] >= 1024, "the axis reaches the data");
    if (name === "LinePlot") {
      assert.deepStrictEqual(out.domain, [980, 1024], "LinePlot has no baseline to break back to");
      assert.strictEqual(out.brk, null);
    } else {
      assert.strictEqual(out.brk, 0, "the axis breaks back to a 0 tick");
      assert.ok(out.ticks.includes(0), "0 is a tick");
    }
  });

  it(`${name}: horizontal baseline(980) paints exactly what xDomain([980]) does`, async function () {
    this.timeout(60000);
    await assertSame(horizontal(name, ".baseline(980)"), horizontal(name, ".xDomain([980])"), "base", `horizontal ${name}`);
  });
}

it("BarChart: bars grow from the 0 tick behind the break, not from the baseline", async function () {
  this.timeout(60000);
  for (const [build, what] of [[chart, "vertical"], [horizontal, "horizontal"]]) {
    const out = await probe(build("BarChart", ".baseline(980)"));
    assert.deepStrictEqual(out.domain, [980, 1024], `${what}: the domain starts at the baseline, unrounded at either end`);
    assert.ok(out.span980 > 10, `${what}: the 0 tick sits past the break (${out.span980}px from 980)`);
    const shortest = Math.min(...out.bars.map(([a, b]) => Math.abs(b - a)));
    assert.ok(Math.abs(shortest - out.span990) <= 2, `${what}: the 990 bar spans 0 to 990 (${shortest} vs ${out.span990})`);
  }
});

it("with baselineBreak(false), baseline(980) stretches to 0 just like yDomain([980])", async function () {
  this.timeout(60000);
  for (const name of ["BarChart", "AreaPlot", "StackedArea"]) {
    const out = await assertSame(
      chart(name, ".baselineBreak(false).baseline(980)"),
      chart(name, ".baselineBreak(false).yDomain([980])"),
      "base",
      `${name} unbroken`,
    );
    assert.strictEqual(out.domain[0], 0, `${name} stretches to 0`);
    assert.strictEqual(out.brk, null);
  }
});

it("values below the baseline draw just as below a yDomain minimum", async function () {
  this.timeout(60000);
  for (const name of ["BarChart", "AreaPlot", "LinePlot"])
    await assertSame(chart(name, ".baseline(980)"), chart(name, ".yDomain([980])"), "below", `${name} below`);
});

it("a baseline above every value ends the axis, like yDomain([undefined, n])", async function () {
  this.timeout(60000);
  for (const name of ["BarChart", "LinePlot"]) {
    const out = await assertSame(chart(name, ".baseline(-80)"), chart(name, ".yDomain([undefined, -80])"), "negative", `${name} negative`);
    assert.strictEqual(out.domain[1], -80, `${name} ends at the baseline`);
  }
  const bars = await probe(chart("BarChart", ".baseline(-80)"), "negative");
  assert.strictEqual(bars.brk, 0, "BarChart breaks back up to 0");
  const above = await assertSame(chart("BarChart", ".baseline(1100)"), chart("BarChart", ".yDomain([undefined, 1100])"), "base", "above");
  assert.deepStrictEqual(above.domain, [0, 1100], "positive bars still reach down to 0");
});

it("a yDomain bound wins over the baseline", async function () {
  this.timeout(60000);
  await assertSame(chart("BarChart", ".yDomain([990]).baseline(980)"), chart("BarChart", ".yDomain([990])"), "base", "a minimum");
  await assertSame(chart("BarChart", ".yDomain([970]).baseline(980)"), chart("BarChart", ".yDomain([970])"), "below", "a lower minimum");
  await assertSame(
    chart("LinePlot", ".yDomain([undefined, 1100]).baseline(980)"),
    chart("LinePlot", ".yDomain([980, 1100])"),
    "base",
    "a maximum keeps the baseline as the minimum",
  );
  const config = await probe(chart("BarChart", ".yConfig({domain: [960, 1100]}).baseline(980)"));
  assert.deepStrictEqual(config.domain, [960, 1100], "a yConfig domain wins outright");
});

it("BarChart's built-in baseline of 0 still lets bars hang below it", async function () {
  this.timeout(60000);
  const mixed = await probe(chart("BarChart"), "mixed");
  assert.ok(mixed.domain[0] < 0 && mixed.domain[1] > 0, "the axis spans both signs");
  const positive = await probe(chart("BarChart"));
  assert.deepStrictEqual(positive.domain, [0, 1030], "the axis still rounds outside");
  await assertSame(chart("BarChart", ".baseline(0)"), chart("BarChart", ".yDomain([0])"), "mixed", "a set baseline of 0");
});

it("BoxWhisker, Histogram, and Beeswarm: baseline(n) matches a domain minimum", async function () {
  this.timeout(60000);
  await assertSame(
    `(lib, data) => new lib.BoxWhisker().data(data).groupBy(["x", "g"]).x("x").y("v").baseline(980)`,
    `(lib, data) => new lib.BoxWhisker().data(data).groupBy(["x", "g"]).x("x").y("v").yDomain([980])`,
    "base",
    "BoxWhisker",
  );
  await assertSame(
    `(lib, data) => new lib.Histogram().data(data).value("v").binWidth(10).baseline(1)`,
    `(lib, data) => new lib.Histogram().data(data).value("v").binWidth(10).yDomain([1])`,
    "base",
    "Histogram",
  );
  await assertSame(
    `(lib, data) => new lib.Beeswarm().data(data).groupBy(["g", "x"]).x("v").baseline(980)`,
    `(lib, data) => new lib.Beeswarm().data(data).groupBy(["g", "x"]).x("v").xDomain([980])`,
    "base",
    "Beeswarm",
  );
});

it("a faceted BarChart: baseline(980) matches yDomain([980]) in every panel", async function () {
  this.timeout(60000);
  for (const scales of ["shared", "independent"]) {
    const facet = extra => `(lib, data) => new lib.BarChart().data(data).groupBy("g").x("x").y("v").legend(false)
      .facet("g").facetConfig({scales: "${scales}"})${extra}`;
    const out = await assertSame(facet(".baseline(980)"), facet(".yDomain([980])"), "base", `${scales} facets`);
    assert.strictEqual(out.panels.length, 2);
    out.panels.forEach(d => assert.ok(d.includes(980), `${scales} panel domain ${d}`));
  }
});
