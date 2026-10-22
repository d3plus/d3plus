import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    AreaPlot, StackedArea, and Histogram keep a user value-domain minimum the
    way BarChart does: the axis starts at the user's value and breaks back to
    the baseline, and areas and bars start at the baseline tick.
*/

const DATA = ["A", "B", "C", "D"].flatMap((x, i) => [
  {x, g: "one", v: 1000 + i * 8},
  {x, g: "two", v: 990 + i * 5},
]);
const VALUES = [5, 12, 18, 21, 22, 25, 29, 31, 35, 40].map(v => ({v}));

/** Renders `src` (a `lib => viz` builder) and reports the value axis and the area/bar spans along it. */
const probe = (src, data = DATA) =>
  probeChart(src, viz => {
    const vertical = viz.schema.discrete !== "y";
    const axis = vertical ? viz._yAxis : viz._xAxis;
    const along = vertical ? "y" : "x";
    const size = vertical ? "height" : "width";
    const spans = [];
    for (const n of sceneNodes(viz._chartScene)) {
      const t = n.transform || {x: 0, y: 0};
      if (n.shapeType === "Area" && n.type === "path") {
        const numbers = (String(n.d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number);
        const values = numbers.filter((_, i) => i % 2 === (vertical ? 1 : 0)).map(v => v + t[along]);
        spans.push([Math.min(...values), Math.max(...values)]);
      }
      if (n.shapeType === "Bar" && n.type === "rect")
        spans.push([t[along] + n[along], t[along] + n[along] + n[size]]);
    }
    const domain = axis._d3Scale.domain().map(Number);
    return {
      domain: [Math.min(...domain), Math.max(...domain)],
      brk: axis._baselineBreak ? {value: axis._baselineBreak.value, position: axis._baselineBreak.position} : null,
      range: axis._getRange().map(Number),
      spans,
    };
  }, {data});

/** The value axis keeps the user's minimum, breaks back to 0, and every shape reaches the 0 tick. */
function assertKept(out, min) {
  assert.strictEqual(out.domain[0], min, `the axis starts at the user's ${min}`);
  assert.ok(out.brk, "the axis breaks back to the baseline");
  assert.strictEqual(out.brk.value, 0);
  assert.ok(out.spans.length, "shapes drawn");
  // The shapes nearest the baseline (every one, unstacked) start at the 0 tick.
  const ends = out.spans.flat();
  const nearest = ends.reduce((a, b) => (Math.abs(b - out.brk.position) < Math.abs(a - out.brk.position) ? b : a));
  assert.ok(Math.abs(nearest - out.brk.position) <= 1, `shapes start at the 0 tick (${nearest} vs ${out.brk.position})`);
  const [lo, hi] = [Math.min(...out.range), Math.max(...out.range)];
  assert.ok(ends.every(e => e >= lo - 1 && e <= hi + 1), "shapes stay inside the axis");
}

const vertical = (name, extra) =>
  `(lib, data) => new lib.${name}().data(data).groupBy("g").x("x").y("v").legend(false)${extra}`;
const horizontal = (name, extra) =>
  `(lib, data) => new lib.${name}().data(data).groupBy("g").y("x").x("v").discrete("y").legend(false)${extra}`;

for (const name of ["AreaPlot", "StackedArea"]) {
  it(`${name}: a yDomain minimum is kept, with a break back to the baseline`, async function () {
    assertKept(await probe(vertical(name, ".yDomain([980])")), 980);
  });

  it(`${name}: a yConfig domain minimum is kept the same way`, async function () {
    assertKept(await probe(vertical(name, ".yConfig({domain: [900, 2100]})")), 900);
  });

  it(`${name}: horizontal, an xDomain minimum is kept`, async function () {
    assertKept(await probe(horizontal(name, ".xDomain([980])")), 980);
  });

  it(`${name}: baselineBreak(false) still stretches a yDomain to the baseline`, async function () {
    const out = await probe(vertical(name, ".yDomain([980]).baselineBreak(false)"));
    assert.strictEqual(out.domain[0], 0);
    assert.strictEqual(out.brk, null);
  });
}

it("AreaPlot: a domain reaching the baseline draws no break", async function () {
  const out = await probe(vertical("AreaPlot", ""));
  assert.strictEqual(out.domain[0], 0);
  assert.strictEqual(out.brk, null);
});

it("Histogram: a yDomain minimum on the count axis is kept", async function () {
  const out = await probe(`(lib, data) => new lib.Histogram().data(data).value("v").binWidth(10).yDomain([2])`, VALUES);
  assertKept(out, 2);
});
