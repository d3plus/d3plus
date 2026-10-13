import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

/**
    Setting `baseline` acts exactly like setting just that end of the value
    domain: the value axis starts at the baseline with no rounding below it,
    bars and areas grow from it, and nothing is drawn past it. A bound in
    `yDomain` still wins, and a baseline above every value ends the axis like
    a domain maximum. A chart's built-in baseline (BarChart's 0) only marks
    where bars start.
*/

const rows = (values, groups = ["one", "two"]) =>
  ["A", "B", "C", "D"].flatMap((x, i) => groups.map((g, j) => ({x, g, v: values(i, j)})));
const DATA = {
  base: rows((i, j) => (j ? 990 + i * 5 : 1000 + i * 8)),
  below: rows((i, j) => (j ? 990 + i * 5 : 960 + i * 20)),
  mixed: rows((i, j) => (j ? -10 + i * 5 : -20 + i * 15)),
  negative: rows((i, j) => (j ? -90 - i * 5 : -100 - i * 8)),
};

/** Renders `src` (a `lib => viz` builder) over `DATA[set]` and reports the value axis and shapes. */
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
            const bars = [], areas = [];
            const walk = n => {
              const t = n.transform || {x: 0, y: 0};
              if (n.shapeType === "Bar" && n.type === "rect")
                bars.push([t[along] + n[along], t[along] + n[along] + n[size]]);
              if (n.shapeType === "Area" && n.type === "path") {
                const numbers = (String(n.d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number);
                const values = numbers.filter((_, i) => i % 2 === (vertical ? 1 : 0)).map(v => v + t[along]);
                areas.push([Math.min(...values), Math.max(...values)]);
              }
              (n.children || []).forEach(walk);
            };
            viz._chartScene.forEach(walk);
            const domain = axis._d3Scale.domain().map(Number);
            resolve({
              domain: [Math.min(...domain), Math.max(...domain)],
              brk: Boolean(axis._baselineBreak),
              range: axis._getRange().map(Number),
              baseline: typeof viz.schema.baseline === "number" ? axis._getPosition(viz.schema.baseline) : undefined,
              bars,
              areas,
              panels: (viz._facetPanels || []).map(p => p.state._plotAxisDomains[vertical ? "y" : "x"].map(Number)),
            });
          });
        } catch (e) {
          reject(e);
        }
      }),
    [src, DATA[set]],
  );

const lo = r => Math.min(...r);
const hi = r => Math.max(...r);

/** Every shape span lies within the axis range (allowing a pixel either way). */
function assertInside(out, spans, what) {
  assert.ok(spans.length, `${what} drawn`);
  spans.forEach(([a, b]) =>
    assert.ok(a >= lo(out.range) - 1 && b <= hi(out.range) + 1, `${what} [${a}, ${b}] stays inside the axis ${out.range}`),
  );
}

/** Every shape span has an end at the baseline's position. */
function assertFromBaseline(out, spans, what) {
  spans.forEach(([a, b]) => {
    const base = Math.abs(a - out.baseline) < Math.abs(b - out.baseline) ? a : b;
    assert.ok(Math.abs(base - out.baseline) <= 1, `${what} grows from the baseline (${base} vs ${out.baseline})`);
  });
}

const chart = (name, extra = "") =>
  `(lib, data) => new lib.${name}().data(data).groupBy("g").x("x").y("v").legend(false)${extra}`;
const horizontal = (name, extra = "") =>
  `(lib, data) => new lib.${name}().data(data).groupBy("g").y("x").x("v").discrete("y").legend(false)${extra}`;

for (const name of ["BarChart", "AreaPlot", "LinePlot", "StackedArea"]) {
  it(`${name}: baseline(980) starts the value axis at exactly 980, unbroken`, async function () {
    this.timeout(60000);
    const out = await probe(chart(name, ".baseline(980)"));
    assert.strictEqual(out.domain[0], 980, "the axis starts at the baseline, not a rounded value below it");
    assert.ok(out.domain[1] >= 1024, "the axis reaches the data");
    assert.strictEqual(out.brk, false, "no baseline break");
    if (name !== "LinePlot") assertInside(out, name === "BarChart" ? out.bars : out.areas, "shapes");
  });

  it(`${name}: horizontal baseline(980) starts the x axis at exactly 980`, async function () {
    this.timeout(60000);
    const out = await probe(horizontal(name, ".baseline(980)"));
    assert.strictEqual(out.domain[0], 980);
    assert.strictEqual(out.brk, false);
    if (name !== "LinePlot") assertInside(out, name === "BarChart" ? out.bars : out.areas, "shapes");
  });
}

it("BarChart and LinePlot: baseline(980) draws the same value axis as yDomain([980])", async function () {
  this.timeout(60000);
  for (const name of ["BarChart", "LinePlot"]) {
    const baseline = await probe(chart(name, ".baseline(980)"));
    const domain = await probe(chart(name, ".yDomain([980])"));
    assert.deepStrictEqual(baseline.domain, domain.domain, `${name} domains match`);
  }
});

it("BarChart and AreaPlot: bars and areas grow from the baseline", async function () {
  this.timeout(60000);
  const bars = await probe(chart("BarChart", ".baseline(980)"));
  assertFromBaseline(bars, bars.bars, "bar");
  assert.strictEqual(bars.baseline, hi(bars.range), "the baseline is the bottom of the axis");
  const areas = await probe(chart("AreaPlot", ".baseline(980)"));
  assertFromBaseline(areas, areas.areas, "area");
});

it("BarChart: a horizontal baseline sits at the left end of the x axis", async function () {
  this.timeout(60000);
  const out = await probe(horizontal("BarChart", ".baseline(980)"));
  assert.strictEqual(out.baseline, lo(out.range));
  assertFromBaseline(out, out.bars, "bar");
});

it("BarChart: a yDomain minimum wins over the baseline, breaking between them", async function () {
  this.timeout(60000);
  const out = await probe(chart("BarChart", ".yDomain([990]).baseline(980)"));
  assert.strictEqual(out.domain[1] >= 1024, true);
  assert.strictEqual(out.brk, true, "the axis breaks back to the baseline");
  assertFromBaseline(out, out.bars, "bar");
  const below = await probe(chart("BarChart", ".yDomain([970]).baseline(980)"), "below");
  assert.strictEqual(below.domain[0], 970, "a domain minimum below the baseline wins too");
  assert.strictEqual(below.brk, false);
});

it("BarChart: a yConfig domain wins over the baseline", async function () {
  this.timeout(60000);
  const out = await probe(chart("BarChart", ".yConfig({domain: [960, 1100]}).baseline(980)"));
  assert.deepStrictEqual(out.domain, [960, 1100]);
});

it("LinePlot: a yDomain maximum keeps the baseline as the minimum", async function () {
  this.timeout(60000);
  const out = await probe(chart("LinePlot", ".yDomain([undefined, 1100]).baseline(980)"));
  assert.deepStrictEqual(out.domain, [980, 1100]);
});

it("data below the baseline is cut off at the axis, as by a domain minimum", async function () {
  this.timeout(60000);
  const bars = await probe(chart("BarChart", ".baseline(980)"), "below");
  assert.strictEqual(bars.domain[0], 980, "the axis doesn't extend below the baseline");
  assertInside(bars, bars.bars, "bars");
  const cut = bars.bars.filter(([a, b]) => Math.abs(a - b) < 1);
  assert.strictEqual(cut.length, 2, "the bars at (980) and below (960) the baseline draw nothing");
  const domain = await probe(chart("BarChart", ".yDomain([980]).baselineBreak(false).baseline(980)"), "below");
  assert.deepStrictEqual(bars.bars, domain.bars, "the same bars as a yDomain minimum");
  const areas = await probe(chart("AreaPlot", ".baseline(980)"), "below");
  assert.strictEqual(areas.domain[0], 980);
  assertInside(areas, areas.areas, "areas");
});

it("a baseline above every value ends the axis, like a domain maximum", async function () {
  this.timeout(60000);
  const bars = await probe(chart("BarChart", ".baseline(-80)"), "negative");
  assert.strictEqual(bars.domain[1], -80, "the axis ends at the baseline");
  assert.ok(bars.domain[0] <= -124, "the axis reaches the data");
  assert.strictEqual(bars.baseline, lo(bars.range), "the baseline is the top of the axis");
  assertFromBaseline(bars, bars.bars, "bar");
  const lines = await probe(chart("LinePlot", ".baseline(-80)"), "negative");
  assert.strictEqual(lines.domain[1], -80);
});

it("BarChart's built-in baseline of 0 still lets bars hang below it", async function () {
  this.timeout(60000);
  const mixed = await probe(chart("BarChart"), "mixed");
  assert.ok(mixed.domain[0] < 0 && mixed.domain[1] > 0, "the axis spans both signs");
  const positive = await probe(chart("BarChart"));
  assert.deepStrictEqual(positive.domain, [0, 1030], "the axis still rounds outside");
  const set = await probe(chart("BarChart", ".baseline(0)"), "mixed");
  assert.strictEqual(set.domain[0], 0, "a set baseline of 0 cuts the axis there");
});

it("BoxWhisker, Histogram, and Beeswarm start their value axis at a set baseline", async function () {
  this.timeout(60000);
  const box = await probe(`(lib, data) => new lib.BoxWhisker().data(data).groupBy(["x", "g"]).x("x").y("v").baseline(980)`);
  assert.strictEqual(box.domain[0], 980, "BoxWhisker");
  const hist = await probe(`(lib, data) => new lib.Histogram().data(data).value("v").binWidth(10).baseline(1)`);
  assert.strictEqual(hist.domain[0], 1, "Histogram's count axis");
  const swarm = await probe(`(lib, data) => new lib.Beeswarm().data(data).groupBy(["g", "x"]).x("v").baseline(980)`);
  assert.strictEqual(swarm.domain[0], 980, "Beeswarm's value axis");
});

it("a faceted BarChart with shared scales starts every panel at the baseline", async function () {
  this.timeout(60000);
  const out = await probe(`(lib, data) => new lib.BarChart().data(data).groupBy("g").x("x").y("v").legend(false)
    .facet("g").facetConfig({scales: "shared"}).baseline(980)`);
  assert.strictEqual(out.panels.length, 2);
  out.panels.forEach(d => assert.strictEqual(Math.min(...d), 980, `panel domain ${d}`));
  const independent = await probe(`(lib, data) => new lib.BarChart().data(data).groupBy("g").x("x").y("v").legend(false)
    .facet("g").facetConfig({scales: "independent"}).baseline(980)`);
  independent.panels.forEach(d => assert.strictEqual(Math.min(...d), 980, `independent panel domain ${d}`));
});
