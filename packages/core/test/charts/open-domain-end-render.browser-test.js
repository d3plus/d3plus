import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart} from "~test/browser/helpers.js";

/**
    A one-sided user domain (`yDomain([n])`, `yDomain([undefined, n])`, a
    one-sided `yConfig.domain`, or `baseline(n)`) pins only the end the user
    set: the far end comes from the data and is rounded where the axis would
    round it with no domain set, unless the axis's `rounding` is "none". With
    both ends set, neither is rounded.
*/

const rows = (values, groups = ["one", "two"]) =>
  ["A", "B", "C", "D"].flatMap((x, i) =>
    groups.map((g, j) => ({x, g, v: values(i, j)})),
  );
const DATA = {
  // Values from 990 to 1024.
  base: rows((i, j) => (j ? 990 + i * 5 : 1000 + i * 8)),
  // Values from -124 to -90.
  negative: rows((i, j) => (j ? -90 - i * 5 : -100 - i * 8)),
  years: [2001, 2003, 2007, 2010].flatMap((year, i) =>
    ["one", "two"].map((g, j) => ({year, g, v: 990 + i * 5 + j})),
  ),
};

/** Renders `src` (a `lib => viz` builder) over `DATA[set]` and reports its axes' domains, breaks, and facet panels. */
const probe = (src, set = "base") =>
  probeChart(
    src,
    viz => {
      const read = axis => {
        const d = axis._d3Scale.domain().map(Number);
        return [Math.min(...d), Math.max(...d)];
      };
      const year = d => new Date(d).getFullYear();
      return {
        x: viz._xAxis._d3Scale.domain().length === 2 ? read(viz._xAxis) : null,
        y: viz._yAxis._d3Scale.domain().length === 2 ? read(viz._yAxis) : null,
        xYears:
          viz._xAxis.schema.scale === "time"
            ? viz._xAxis._d3Scale.domain().map(year)
            : null,
        brk:
          (viz.schema.discrete === "y" ? viz._xAxis : viz._yAxis)._baselineBreak
            ?.value ?? null,
        panels: (viz._facetPanels || []).map(p =>
          p.state._plotAxisDomains.y.map(Number).sort((a, b) => a - b),
        ),
      };
    },
    {data: DATA[set]},
  );

const chart = (name, extra = "") =>
  `(lib, data) => new lib.${name}().data(data).groupBy("g").x("x").y("v").legend(false)${extra}`;
const horizontal = (name, extra = "") =>
  `(lib, data) => new lib.${name}().data(data).groupBy("g").y("x").x("v").discrete("y").legend(false)${extra}`;

it("BarChart: yDomain([980]) keeps 980 and rounds the top as it would with no domain", async function () {
  const none = await probe(chart("BarChart"));
  assert.deepStrictEqual(none.y, [0, 1030], "no domain: rounded outside");
  const one = await probe(chart("BarChart", ".yDomain([980])"));
  assert.deepStrictEqual(
    one.y,
    [980, 1030],
    "the same rounded top, 980 exactly",
  );
  assert.strictEqual(one.brk, 0, "still breaks back to 0");
  assert.deepStrictEqual(
    (await probe(chart("BarChart", ".yDomain([980, 1024])"))).y,
    [980, 1024],
    "both ends set: no rounding",
  );
  assert.deepStrictEqual(
    (
      await probe(
        chart("BarChart", ".yDomain([980]).yConfig({rounding: 'none'})"),
      )
    ).y,
    [980, 1024],
    "rounding off: the top stays at the data",
  );
  assert.deepStrictEqual(
    (
      await probe(
        chart("BarChart", ".yDomain([980]).yConfig({rounding: 'inside'})"),
      )
    ).y,
    [980, 1020],
    "inside rounding pulls the top in",
  );
  assert.deepStrictEqual(
    (
      await probe(
        chart(
          "BarChart",
          ".yDomain([980, 1024]).yConfig({rounding: 'outside'})",
        ),
      )
    ).y,
    [950, 1050],
    "rounding asked for on a full domain still rounds both ends",
  );
  assert.deepStrictEqual(
    (await probe(chart("BarChart", ".baselineBreak(false).yDomain([980])"))).y,
    [0, 1030],
    "with no break, the axis stretches to 0 and the top still rounds",
  );
});

it("baseline(980) rounds the far end just like yDomain([980])", async function () {
  for (const name of ["BarChart", "AreaPlot", "StackedArea", "LinePlot"]) {
    const [baseline, domain] = [
      await probe(chart(name, ".baseline(980)")),
      await probe(chart(name, ".yDomain([980])")),
    ];
    assert.deepStrictEqual(baseline.y, domain.y, name);
    assert.strictEqual(baseline.y[0], 980, `${name} starts at 980 exactly`);
  }
  assert.deepStrictEqual(
    (await probe(chart("BarChart", ".baseline(980)"))).y,
    [980, 1030],
  );
  assert.deepStrictEqual(
    (await probe(chart("StackedArea", ".baseline(980)"))).y,
    [980, 2030],
    "the stack's total",
  );
  assert.deepStrictEqual(
    (await probe(chart("LinePlot", ".baseline(980)"))).y,
    [980, 1050],
    "LinePlot rounds as it does with no domain",
  );
  assert.deepStrictEqual((await probe(chart("LinePlot"))).y, [950, 1050]);
  assert.deepStrictEqual(
    (
      await probe(
        chart("BarChart", ".baseline(980).yConfig({rounding: 'none'})"),
      )
    ).y,
    [980, 1024],
    "rounding off",
  );
});

it("yDomain([undefined, n]) keeps n and rounds the bottom", async function () {
  assert.deepStrictEqual(
    (await probe(chart("LinePlot"), "negative")).y,
    [-130, -90],
  );
  assert.deepStrictEqual(
    (await probe(chart("LinePlot", ".yDomain([undefined, -80])"), "negative"))
      .y,
    [-130, -80],
  );
  const bars = await probe(
    chart("BarChart", ".yDomain([undefined, -80])"),
    "negative",
  );
  assert.deepStrictEqual(bars.y, [-130, -80]);
  assert.strictEqual(bars.brk, 0, "breaks up to 0");
  assert.deepStrictEqual(
    (await probe(chart("BarChart", ".baseline(-80)"), "negative")).y,
    [-130, -80],
    "a baseline above every value",
  );
  assert.deepStrictEqual(
    (await probe(chart("LinePlot", ".yDomain([undefined, 1100])"))).y,
    [950, 1100],
  );
});

it("horizontal charts round the open end of xDomain([n])", async function () {
  assert.deepStrictEqual((await probe(horizontal("BarChart"))).x, [0, 1030]);
  const bars = await probe(horizontal("BarChart", ".xDomain([980])"));
  assert.deepStrictEqual(bars.x, [980, 1030]);
  assert.strictEqual(bars.brk, 0);
  assert.deepStrictEqual(
    (await probe(horizontal("BarChart", ".baseline(980)"))).x,
    [980, 1030],
  );
  assert.deepStrictEqual(
    (await probe(horizontal("BarChart", ".xDomain([980, 1024])"))).x,
    [980, 1024],
  );
  assert.deepStrictEqual(
    (await probe(horizontal("LinePlot", ".xDomain([980])"))).x,
    [980, 1050],
  );
});

it("a one-sided yConfig or xConfig domain works like yDomain([n])", async function () {
  const config = await probe(chart("BarChart", ".yConfig({domain: [980]})"));
  assert.deepStrictEqual(config.y, [980, 1030]);
  assert.strictEqual(config.brk, 0);
  assert.deepStrictEqual(
    (await probe(chart("LinePlot", ".yConfig({domain: [undefined, 1100]})"))).y,
    [950, 1100],
  );
  assert.deepStrictEqual(
    (await probe(horizontal("BarChart", ".xConfig({domain: [980]})"))).x,
    [980, 1030],
  );
  assert.deepStrictEqual(
    (
      await probe(
        chart("BarChart", ".yConfig({domain: [980], rounding: 'none'})"),
      )
    ).y,
    [980, 1024],
  );
});

it("BoxWhisker, Beeswarm, Histogram, and a scatter Plot round the open end", async function () {
  const box =
    "(lib, data) => new lib.BoxWhisker().data(data).groupBy(['x', 'g']).x('x').y('v')";
  assert.deepStrictEqual((await probe(box)).y, [950, 1050]);
  assert.deepStrictEqual((await probe(`${box}.yDomain([980])`)).y, [980, 1050]);
  const swarm =
    "(lib, data) => new lib.Beeswarm().data(data).groupBy(['g', 'x']).x('v')";
  assert.deepStrictEqual((await probe(swarm)).x, [950, 1050]);
  assert.deepStrictEqual(
    (await probe(`${swarm}.xDomain([980])`)).x,
    [980, 1050],
  );
  const hist =
    "(lib, data) => new lib.Histogram().data(data).value('v').binWidth(10)";
  assert.deepStrictEqual((await probe(`${hist}.yDomain([1])`)).y, [1, 4]);
  const scatter =
    "(lib, data) => new lib.Plot().data(data).groupBy(['g', 'x']).x('v').y('v').legend(false)";
  assert.deepStrictEqual(
    (await probe(`${scatter}.xDomain([980])`)).x,
    [980, 1050],
  );
  assert.deepStrictEqual(
    (await probe(`${scatter}.xConfig({domain: [980]})`)).x,
    [980, 1050],
  );
});

it("a time axis isn't rounded, with or without a one-sided domain", async function () {
  const line =
    "(lib, data) => new lib.LinePlot().data(data).groupBy('g').x('year').time('year').y('v').legend(false)";
  assert.deepStrictEqual((await probe(line, "years")).xYears, [2001, 2010]);
  assert.deepStrictEqual(
    (await probe(`${line}.xDomain(['2002'])`, "years")).xYears,
    [2002, 2010],
  );
  assert.deepStrictEqual(
    (await probe(`${line}.xDomain([undefined, '2008'])`, "years")).xYears,
    [2001, 2008],
  );
});

it("facets: shared scales round the open end once, independent ones per panel", async function () {
  const facet = (scales, extra = "") =>
    chart("BarChart", `.facet("g").facetConfig({scales: "${scales}"})${extra}`);
  const shared = await probe(facet("shared", ".yDomain([980])"));
  assert.deepStrictEqual(shared.panels, [
    [980, 1030],
    [980, 1030],
  ]);
  const independent = await probe(facet("independent", ".yDomain([980])"));
  const auto = await probe(facet("independent"));
  assert.deepStrictEqual(auto.panels, [
    [0, 1030],
    [0, 1010],
  ]);
  assert.deepStrictEqual(
    independent.panels,
    [
      [980, 1030],
      [980, 1010],
    ],
    "each panel's own rounded top",
  );
  assert.deepStrictEqual(
    (await probe(facet("shared", ".baseline(980)"))).panels,
    shared.panels,
    "baseline(980) matches",
  );
});
