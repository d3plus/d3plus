import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    #611: an axis config's `reverse: true` flips the axis. The shapes, tick
    labels, breaks, zoom and small multiples follow it, on both backends.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";

const PRELUDE = `
  const stack = [];
  ["Coal", "Gas", "Solar"].forEach((source, k) => {
    for (let year = 2015; year <= 2020; year++)
      stack.push({source, year, value: 10 + k * 5 + (year - 2015) * (k + 1)});
  });
  const monthly = [];
  for (let i = 0; i < 12; i++)
    monthly.push({id: "s", date: new Date(2020, i, 1), value: 10 + (i * 7) % 13});
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const walk = (nodes, fn) => nodes.forEach(n => { fn(n); if (n.children) walk(n.children, fn); });
  const unwrap = d => (d && d.data ? d.data : d);
  // Painted bars: their datum's discrete value and their box.
  const bars = chart => {
    const out = [];
    walk(chart._chartScene, n => {
      if (n.type === "rect" && n.shapeType === "Bar" && !String(n.key).endsWith("::hit")) {
        const t = n.transform || {};
        const d = unwrap(n.datum);
        out.push({year: d.year, source: d.source, x: (t.x || 0) + n.x, y: (t.y || 0) + n.y, width: n.width, height: n.height});
      }
    });
    return out;
  };
  // The axis's visible ticks, in the order they sit along it.
  const labels = axis => axis._visibleTicks
    .map(d => [d instanceof Date ? +d : d, axis._getPosition(d)])
    .sort((a, b) => a[1] - b[1])
    .map(d => d[0]);
`;

function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] yConfig reverse puts a horizontal stacked bar chart's earliest year at the top`, async () => {
    const r = await page(
      `
      const run = async reverse => {
        const chart = new d3plus.BarChart()
          .data(stack).groupBy("source").discrete("y").y("year").x("value")
          .stacked(true).legend(false).renderer(arg).yConfig({reverse});
        await done(chart);
        const b = bars(chart);
        const top = y => Math.min(...b.filter(d => d.year === y).map(d => d.y));
        return {
          first: top(2015), last: top(2020),
          sizes: b.every(d => d.width > 0 && d.height > 0),
          count: b.length,
          labels: labels(chart._yAxis),
        };
      };
      return {normal: await run(false), reversed: await run(true)};
    `,
      renderer,
    );
    assert.ok(r.normal.first > r.normal.last, "by default 2020 sits on top");
    assert.ok(r.reversed.first < r.reversed.last, "reversed, 2015 sits on top");
    assert.strictEqual(r.reversed.count, 18, "every segment drawn");
    assert.ok(r.reversed.sizes, "with positive sizes");
    assert.deepStrictEqual(
      r.reversed.labels,
      [2015, 2016, 2017, 2018, 2019, 2020],
      "labels read down from 2015",
    );
    assert.deepStrictEqual(
      r.normal.labels,
      r.reversed.labels.slice().reverse(),
    );
  });

  it(`[${renderer}] xConfig reverse flips grouped bars, and a value axis grows its bars the other way`, async () => {
    const r = await page(
      `
      const grouped = new d3plus.BarChart()
        .data(stack).groupBy("source").x("year").y("value")
        .legend(false).renderer(arg).xConfig({reverse: true});
      await done(grouped);
      const b = bars(grouped);
      const left = y => Math.min(...b.filter(d => d.year === y).map(d => d.x));
      const out = {
        first: left(2015), last: left(2020),
        sizes: b.length === 18 && b.every(d => d.width > 0 && d.height > 0),
      };
      const down = new d3plus.BarChart()
        .data([{id: "a", x: 1, v: 5}, {id: "b", x: 2, v: 8}]).groupBy("id").x("x").y("v")
        .legend(false).renderer(arg).yConfig({reverse: true});
      await done(down);
      const zero = down._yAxis._getPosition(0);
      out.down = bars(down).map(d => [d.y, d.height]);
      out.zero = zero;
      return out;
    `,
      renderer,
    );
    assert.ok(r.first > r.last, "2020's group is left of 2015's");
    assert.ok(r.sizes, "every bar drawn with positive sizes");
    r.down.forEach(([y, height]) => {
      assert.ok(Math.abs(y - r.zero) < 1, `bars hang from 0 at the top (${y})`);
      assert.ok(height > 0);
    });
  });
}

it("a reversed time axis runs late to early, and a reversed value axis low to high", async () => {
  const r = await page(`
    const chart = new d3plus.LinePlot()
      .data(monthly).groupBy("id").x("date").y("value").legend(false)
      .xConfig({reverse: true}).yConfig({reverse: true});
    await done(chart);
    const x = chart._xAxis, y = chart._yAxis;
    return {
      jan: x._getPosition(new Date(2020, 0, 1)),
      dec: x._getPosition(new Date(2020, 11, 1)),
      low: y._getPosition(10),
      high: y._getPosition(20),
      yDomain: y._d3Scale.domain(),
      given: y._givenDomain(),
    };
  `);
  assert.ok(r.dec < r.jan, "December left of January");
  assert.ok(r.low < r.high, "low values at the top");
  assert.ok(r.yDomain[0] < r.yDomain[1], "the y scale runs low to high");
  assert.deepStrictEqual(r.given, r.yDomain.slice().reverse());
});

it("a reversed value axis keeps its break", async () => {
  const r = await page(`
    const chart = new d3plus.BarChart()
      .data([{id: "a", v: 10}, {id: "b", v: 20}, {id: "c", v: 980}]).groupBy("id").x("id").y("v")
      .legend(false).yConfig({reverse: true, break: [100, 900]});
    await done(chart);
    const y = chart._yAxis;
    return {breaks: y._breaks.length, p0: y._getPosition(0), p50: y._getPosition(50), p950: y._getPosition(950)};
  `);
  assert.strictEqual(r.breaks, 1);
  assert.ok(r.p0 < r.p50 && r.p50 < r.p950, "positions grow down the axis");
});

it("a reversed axis zooms, keeping its direction", async () => {
  const r = await page(`
    const chart = new d3plus.LinePlot()
      .data(monthly).groupBy("id").x("date").y("value").legend(false)
      .yConfig({reverse: true});
    await done(chart);
    const domain = () => chart._yAxis._d3Scale.domain().map(Number);
    const base = domain();
    for (let i = 0; i < 2; i++) document.querySelector("#viz .zoom-in").click();
    await frames();
    const zoomed = domain();
    document.querySelector("#viz .zoom-reset").click();
    await frames();
    return {base, zoomed, reset: domain()};
  `);
  assert.ok(r.base[0] < r.base[1], "low to high");
  assert.ok(r.zoomed[0] < r.zoomed[1], "still low to high when zoomed");
  assert.ok(
    r.zoomed[1] - r.zoomed[0] < (r.base[1] - r.base[0]) / 1.5,
    `zoomed in: ${r.zoomed} from ${r.base}`,
  );
  assert.deepStrictEqual(r.reset, r.base);
});

it("every small multiple reverses its axis", async () => {
  const r = await page(`
    const rows = stack.map(d => ({...d, region: d.year % 2 ? "Odd" : "Even"}));
    const chart = new d3plus.LinePlot()
      .data(rows).groupBy("source").x("year").y("value").facet("region")
      .legend(false).yConfig({reverse: true});
    await done(chart);
    return chart._facetPanels.map(p => p.state._plotAxisDomains.y.map(Number));
  `);
  assert.strictEqual(r.length, 2);
  r.forEach(domain =>
    assert.ok(domain[0] < domain[1], `panel runs low to high: ${domain}`),
  );
});

it("line labels sit past a reversed x axis's right end", async () => {
  const r = await page(`
    const series = [];
    ["Alpha", "Beta"].forEach((id, s) => {
      for (let year = 2010; year <= 2016; year++)
        series.push({id, year, value: 10 * (s + 1) + (year - 2010) * (s + 1)});
    });
    const chart = new d3plus.LinePlot()
      .data(series).groupBy("id").x("year").y("value").legend(false)
      .lineLabels(true).xConfig({reverse: true});
    await done(chart);
    const found = [];
    const at = (nodes, o) => nodes.forEach(n => {
      const t = n.transform || {};
      const p = {x: o.x + (t.x || 0), y: o.y + (t.y || 0)};
      if (n.type === "text" && ["Alpha", "Beta"].includes(n.lines?.[0]?.text)) found.push(p.x);
      if (n.children) at(n.children, p);
    });
    at(chart._chartScene, {x: 0, y: 0});
    return {labels: found, end: chart._xFunc(2010), start: chart._xFunc(2016)};
  `);
  assert.ok(r.end > r.start, "2010 is the right end");
  assert.strictEqual(r.labels.length, 2);
  assert.ok(
    r.labels.every(x => x >= r.end - 1),
    `labels (${r.labels}) start past the right end (${r.end})`,
  );
});
