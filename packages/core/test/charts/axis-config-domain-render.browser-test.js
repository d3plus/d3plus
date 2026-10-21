import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

after(closeBrowser);

/**
    A full (two-sided) `domain` in a Plot's axis config is drawn exactly as
    given, the way an Axis given a domain draws it: only the axis config's
    own `rounding` rounds it. A one-sided axis-config domain still works like
    `yDomain([n])`.
*/

const rows = (values, groups = ["one", "two"]) =>
  ["A", "B", "C", "D"].flatMap((x, i) => groups.map((g, j) => ({x, g, v: values(i, j)})));
const DATA = {
  // Values from 990 to 1024.
  base: rows((i, j) => (j ? 990 + i * 5 : 1000 + i * 8)),
  years: [2001, 2003, 2007, 2010].flatMap((year, i) => ["one", "two"].map((g, j) => ({year, g, v: 990 + i * 5 + j}))),
  pyramid: ["0-9", "10-19", "20-29", "30-39"].flatMap((age, b) => [
    {age, sex: "Male", pop: 1000 - b * 200},
    {age, sex: "Female", pop: 1130 - b * 200},
  ]),
};

/** Renders `src` (a `lib => viz` builder) over `DATA[set]` and reports its axes' domains and break. */
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
            try {
              const read = axis => {
                const d = axis._d3Scale.domain().map(Number);
                return [Math.min(...d), Math.max(...d)];
              };
              const year = d => new Date(d).getFullYear();
              resolve({
                x: viz._xAxis._d3Scale.domain().length === 2 ? read(viz._xAxis) : null,
                y: viz._yAxis._d3Scale.domain().length === 2 ? read(viz._yAxis) : null,
                y2: viz._y2Axis?._d3Scale?.domain().length === 2 ? read(viz._y2Axis) : null,
                xYears: viz._xAxis.schema.scale === "time" ? viz._xAxis._d3Scale.domain().map(year) : null,
                brk: (viz.schema.discrete === "y" ? viz._xAxis : viz._yAxis)._baselineBreak?.value ?? null,
              });
            } catch (e) {
              reject(e);
            }
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

it("a two-sided yConfig domain is drawn exactly as given", async function () {
  this.timeout(120000);
  const bars = await probe(chart("BarChart", ".yConfig({domain: [960, 1100]})"));
  assert.deepStrictEqual(bars.y, [960, 1100]);
  assert.strictEqual(bars.brk, 0, "a BarChart still breaks back to 0");
  assert.deepStrictEqual((await probe(chart("LinePlot", ".yConfig({domain: [960, 1100]})"))).y, [960, 1100]);
  assert.deepStrictEqual((await probe(chart("AreaPlot", ".yConfig({domain: [960, 1100]})"))).y, [960, 1100]);
  assert.deepStrictEqual(
    (await probe(chart("BarChart", ".baselineBreak(false).yConfig({domain: [960, 1100]})"))).y,
    [960, 1100],
    "a full axis-config domain wins over the baseline with no break",
  );
  assert.deepStrictEqual(
    (await probe(chart("BarChart", ".yDomain([0, 2000]).yConfig({domain: [960, 1100]})"))).y,
    [960, 1100],
    "and over yDomain",
  );
});

it("a two-sided yConfig domain rounds only as the yConfig's rounding says", async function () {
  this.timeout(120000);
  assert.deepStrictEqual(
    (await probe(chart("BarChart", ".yConfig({domain: [960, 1100], rounding: 'outside'})"))).y,
    [900, 1100],
  );
  assert.deepStrictEqual(
    (await probe(chart("LinePlot", ".yConfig({domain: [960, 1100], rounding: 'outside'})"))).y,
    [900, 1100],
  );
  assert.deepStrictEqual(
    (await probe(chart("LinePlot", ".yConfig({domain: [960, 1100], rounding: 'none'})"))).y,
    [960, 1100],
  );
});

it("a one-sided yConfig domain still rounds its open end", async function () {
  this.timeout(120000);
  assert.deepStrictEqual((await probe(chart("BarChart", ".yConfig({domain: [980]})"))).y, [980, 1030]);
  assert.deepStrictEqual((await probe(chart("LinePlot", ".yConfig({domain: [undefined, 1100]})"))).y, [950, 1100]);
  assert.deepStrictEqual((await probe(chart("BarChart", ".yConfig({domain: [980], rounding: 'none'})"))).y, [980, 1024]);
});

it("a two-sided xConfig domain on a horizontal BarChart is drawn exactly as given", async function () {
  this.timeout(120000);
  const bars = await probe(horizontal("BarChart", ".xConfig({domain: [960, 1100]})"));
  assert.deepStrictEqual(bars.x, [960, 1100]);
  assert.strictEqual(bars.brk, 0);
  assert.deepStrictEqual(
    (await probe(horizontal("BarChart", ".xConfig({domain: [960, 1100], rounding: 'outside'})"))).x,
    [900, 1100],
  );
  assert.deepStrictEqual((await probe(horizontal("BarChart", ".xConfig({domain: [980]})"))).x, [980, 1030], "one-sided");
});

it("a two-sided y2Config domain is drawn exactly as given", async function () {
  this.timeout(120000);
  const src = "(lib, data) => new lib.LinePlot().data(data).groupBy('g').x('x').y('v').y2(d => d.v).legend(false)";
  assert.deepStrictEqual((await probe(`${src}.y2Config({domain: [960, 1100]})`)).y2, [960, 1100]);
  assert.deepStrictEqual((await probe(`${src}.y2Config({domain: [960, 1100], rounding: 'outside'})`)).y2, [900, 1100]);
  const primary = await probe(`${src}.yConfig({domain: [960, 1100]})`);
  assert.deepStrictEqual(primary.y, [960, 1100]);
  assert.deepStrictEqual(primary.y2, [950, 1050], "a full yConfig domain leaves y2 rounded");
});

it("a time axis domain is unaffected", async function () {
  this.timeout(120000);
  const src = "(lib, data) => new lib.LinePlot().data(data).groupBy('g').x('year').time('year').y('v').legend(false)";
  assert.deepStrictEqual((await probe(src, "years")).xYears, [2001, 2010]);
  assert.deepStrictEqual(
    (await probe(`${src}.xConfig({domain: [new Date(2000, 0, 1), new Date(2012, 0, 1)]})`, "years")).xYears,
    [2000, 2012],
  );
  assert.deepStrictEqual((await probe(`${src}.xDomain(['2000', '2012'])`, "years")).xYears, [2000, 2012]);
});

it("Pyramid still rounds its own symmetric domain", async function () {
  this.timeout(120000);
  const src = "(lib, data) => new lib.Pyramid().data(data).groupBy('sex').y('age').x('pop').detectVisible(false)";
  assert.deepStrictEqual((await probe(`${src}.categoryPosition('left')`, "pyramid")).x, [-1200, 1200]);
  assert.deepStrictEqual((await probe(src, "pyramid")).x, [-1200, 1200], "with the center gutter");
  assert.deepStrictEqual(
    (await probe(`${src}.categoryPosition('left').xConfig({rounding: 'none'})`, "pyramid")).x,
    [-1130, 1130],
    "the user's rounding still wins",
  );
  assert.deepStrictEqual(
    (await probe(`${src}.xConfig({domain: [-1150, 1150]})`, "pyramid")).x,
    [-1150, 1150],
    "a user's xConfig domain is drawn as given",
  );
});
