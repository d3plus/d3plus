import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    A Plot drawing Bars, Areas, or Boxes with no `discrete` and numbers on
    both axes stands them on x, as a BarChart, AreaPlot, or BoxWhisker does
    (see `Plot/inferDiscrete.ts`), on both renderers: every bar draws, one
    slot per x value, series side by side. Bars and areas grow from `0`, as
    a BarChart's and AreaPlot's do, unless a baseline is set. A swarm packs
    only the circles beside them, in their lanes; with no circles it has
    nothing to do, and says so once.
*/

const data = ["A", "B"].flatMap((id, k) =>
  [2020, 2021, 2022, 2023].map((year, j) => ({
    id,
    year,
    value: 10 + j * 4 + k * 3,
  })),
);

/** Each bar's box, the axes' scales, any draw error. */
const read = viz => {
  const body = sceneNodes(viz.toScene().root).find(
    n => n.key === "viz-chart-body",
  );
  const bars = sceneNodes(body ? body.children : [])
    .filter(
      n =>
        n.type === "rect" &&
        n.shapeType === "Bar" &&
        n.datum &&
        !`${n.key}`.endsWith("::hit"),
    )
    .map(n => ({
      id: n.datum.id,
      year: n.datum.year,
      value: n.datum.value,
      x: n.transform.x,
      width: n.width,
      height: n.height,
    }));
  const shapes = type =>
    sceneNodes(body ? body.children : []).filter(
      n => n.shapeType === type && n.datum && !`${n.key}`.endsWith("::hit"),
    );
  const circles = sceneNodes(body ? body.children : [])
    .filter(n => n.type === "circle" && n.shapeType === "Circle" && n.datum)
    .map(n => [n.transform.x, n.transform.y]);
  return {
    bars,
    circles,
    areas: shapes("Area").map(n => n.d),
    // A Box draws its body as a rect keyed `<id>-box`.
    boxes: sceneNodes(body ? body.children : []).filter(
      n => n.type === "rect" && `${n.key}`.endsWith("-box"),
    ).length,
    xScale: viz._xAxis.scale(),
    yScale: viz._yAxis.scale(),
    // The value axis's extent, low end first.
    xDomain: viz._xAxis._d3Scale
      .domain()
      .slice()
      .sort((a, b) => a - b),
    yDomain: viz._yAxis._d3Scale
      .domain()
      .slice()
      .sort((a, b) => a - b),
    errors: window.__drawErrors,
    warnings: window.__drawWarnings,
  };
};

const capture = `
  const errors = [];
  const warnings = [];
  window.__drawErrors = errors;
  window.__drawWarnings = warnings;
  console.error = (...args) => errors.push(args.map(String).join(" "));
  console.warn = (...args) => warnings.push(args.map(String).join(" "));`;

const src = chain => `(lib, data) => {
  ${capture}
  return new lib.Plot().data(data).groupBy("id").x("year").y("value")${chain};
}`;

for (const renderer of ["svg", "canvas"]) {
  it(`Plot ${renderer} — Bars with no discrete stand on x`, async () => {
    const out = await probeChart(src(`.shape("Bar")`), read, {data, renderer});
    assert.deepStrictEqual(out.errors, [], "draws without an error");
    assert.strictEqual(out.bars.length, data.length, "every bar draws");
    assert.strictEqual(out.xScale, "point");
    assert.strictEqual(out.yScale, "linear");
    for (const b of out.bars) {
      assert.ok(Number.isFinite(b.x), JSON.stringify(b));
      assert.ok(b.width > 0 && b.height > 0, JSON.stringify(b));
    }
    // The bars grow from 0, which the value axis reaches down to.
    assert.strictEqual(out.yDomain[0], 0);
    const sorted = [...out.bars].sort((a, b) => a.value - b.value);
    for (let i = 1; i < sorted.length; i++)
      assert.ok(sorted[i].height > sorted[i - 1].height, "taller with value");
    // Each year's two series sit side by side, years in order.
    const xs = id =>
      out.bars
        .filter(b => b.id === id)
        .sort((a, b) => a.year - b.year)
        .map(b => b.x);
    const [a, b] = [xs("A"), xs("B")];
    for (let i = 0; i < a.length; i++) {
      assert.ok(a[i] < b[i], "A then B within a year");
      if (i) assert.ok(b[i - 1] < a[i], "years in order, apart");
    }
  });

  it(`Plot ${renderer} — Bars mixed with Lines stand on x`, async () => {
    const out = await probeChart(
      src(`.shape(d => (d.id === "A" ? "Bar" : "Line"))`),
      read,
      {data, renderer},
    );
    assert.deepStrictEqual(out.errors, [], "draws without an error");
    assert.strictEqual(out.bars.length, 4, "series A draws as bars");
    assert.strictEqual(out.xScale, "point");
  });

  it(`Plot ${renderer} — discrete "y" lays the bars along y`, async () => {
    const out = await probeChart(
      src(`.shape("Bar").discrete("y").x("value").y("year")`),
      read,
      {data, renderer},
    );
    assert.deepStrictEqual(out.errors, [], "draws without an error");
    assert.strictEqual(out.bars.length, data.length);
    assert.strictEqual(out.xScale, "linear");
    assert.strictEqual(out.xDomain[0], 0, "the bars grow from 0");
  });

  it(`Plot ${renderer} — discrete "x" bars with no baseline grow from 0`, async () => {
    const out = await probeChart(src(`.shape("Bar").discrete("x")`), read, {
      data,
      renderer,
    });
    assert.strictEqual(out.yDomain[0], 0);
    for (const b of out.bars) assert.ok(b.height > 0, JSON.stringify(b));
  });

  it(`Plot ${renderer} — a set baseline still bounds the bars' axis`, async () => {
    const out = await probeChart(src(`.shape("Bar").baseline(5)`), read, {
      data,
      renderer,
    });
    assert.deepStrictEqual(out.errors, [], "draws without an error");
    assert.strictEqual(out.yDomain[0], 5);
    for (const b of out.bars) assert.ok(b.height > 0, JSON.stringify(b));
  });

  it(`Plot ${renderer} — negative bars grow down to 0`, async () => {
    const negative = data.map(d => ({...d, value: -d.value}));
    const out = await probeChart(src(`.shape("Bar")`), read, {
      data: negative,
      renderer,
    });
    assert.strictEqual(out.yDomain[1], 0);
    for (const b of out.bars) assert.ok(b.height > 0, JSON.stringify(b));
  });

  it(`Plot ${renderer} — a swarm packs the circles beside bars, in their lanes`, async () => {
    const years = [2020, 2021, 2022];
    const rows = [
      ...years.map((year, j) => ({
        id: `avg-${year}`,
        kind: "Bar",
        year,
        value: 10 + j,
      })),
      ...years.flatMap(year =>
        [0, 1, 2, 3, 4, 5].map(r => ({
          id: `p${r}-${year}`,
          kind: "Circle",
          year,
          value: 8 + (r % 2),
        })),
      ),
    ];
    const draw = chain =>
      probeChart(
        `(lib, data) => {
          ${capture}
          return new lib.Plot().data(data).groupBy("id").x("year").y("value").shape(d => d.kind)${chain};
        }`,
        read,
        {data: rows, renderer},
      );
    const flat = await draw("");
    const packed = await draw(".swarm(true)");
    for (const out of [flat, packed]) {
      assert.deepStrictEqual(out.errors, [], "draws without an error");
      assert.deepStrictEqual(out.warnings, [], "nothing to warn about");
      assert.strictEqual(out.bars.length, 3, "every bar draws");
      assert.strictEqual(out.circles.length, 18, "every circle draws");
      assert.strictEqual(out.xScale, "point");
    }
    const spots = out =>
      new Set(out.circles.map(c => c.map(Math.round).join())).size;
    // Unpacked, the circles of a year share two spots; packed, each has its own.
    assert.strictEqual(spots(flat), 6);
    assert.strictEqual(spots(packed), 18);
    // Each year's circles stay in that year's lane, over its bar.
    const xs = out => out.bars.map(b => b.x).sort((a, b) => a - b);
    const lane = Math.min(
      ...xs(packed)
        .slice(1)
        .map((x, i) => x - xs(packed)[i]),
    );
    for (const [x] of packed.circles)
      assert.ok(
        xs(packed).some(b => Math.abs(b - x) < lane / 2),
        `${x} sits in a lane`,
      );
  });

  it(`Plot ${renderer} — swarm("x") stands the bars beside it on y`, async () => {
    const rows = [
      {id: "avg", kind: "Bar", year: 2020, value: 10},
      ...[0, 1, 2, 3].map(r => ({
        id: `p${r}`,
        kind: "Circle",
        year: 2020,
        value: 9 + (r % 2),
      })),
    ];
    const out = await probeChart(
      `(lib, data) => {
        ${capture}
        return new lib.Plot().data(data).groupBy("id").x("value").y("year").shape(d => d.kind).swarm("x");
      }`,
      read,
      {data: rows, renderer},
    );
    assert.deepStrictEqual(out.errors, [], "draws without an error");
    assert.strictEqual(out.yScale, "point", "bars stand on y");
    assert.strictEqual(out.xScale, "linear");
    assert.strictEqual(out.bars.length, 1);
    assert.strictEqual(out.circles.length, 4);
  });

  for (const swarm of ["true", `"x"`, `"y"`])
    it(`Plot ${renderer} — swarm(${swarm}) with no circles notes it once`, async () => {
      const out = await probeChart(src(`.shape("Bar").swarm(${swarm})`), read, {
        data,
        renderer,
      });
      assert.deepStrictEqual(out.errors, [], "draws without an error");
      assert.strictEqual(out.bars.length, data.length, "every bar draws");
      assert.strictEqual(out.xScale, "point");
      assert.strictEqual(
        out.warnings.filter(w => w.includes("swarm")).length,
        1,
        out.warnings.join("; "),
      );
    });

  it(`Plot ${renderer} — Areas with no discrete stand on x`, async () => {
    const out = await probeChart(src(`.shape("Area")`), read, {data, renderer});
    assert.deepStrictEqual(out.errors, [], "draws without an error");
    assert.strictEqual(out.xScale, "point");
    assert.strictEqual(out.areas.length, 2, "one area per series");
    for (const d of out.areas) assert.ok(d && !/NaN/.test(d), d);
    // The areas fill down to 0, which the value axis reaches.
    assert.strictEqual(out.yDomain[0], 0);
  });

  it(`Plot ${renderer} — Boxes with no discrete stand on x`, async () => {
    const rows = [2020, 2021, 2022].flatMap(year =>
      [0, 1, 2, 3, 4].map(r => ({
        id: `${year}-${r}`,
        year,
        value: r * 2 + year - 2015,
      })),
    );
    const out = await probeChart(
      `(lib, data) => {
        ${capture}
        return new lib.Plot().data(data).groupBy("id").x("year").y("value").shape("Box");
      }`,
      read,
      {data: rows, renderer},
    );
    assert.deepStrictEqual(out.errors, [], "draws without an error");
    assert.strictEqual(out.xScale, "point");
    assert.strictEqual(out.boxes, 3, "one box per year");
  });
}
