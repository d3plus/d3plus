/* global DOMPoint, requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    #278: `trendLine` fits a regression to the plotted data and paints it
    behind the marks — one line per series (or one for all data), an optional
    confidence band, and a tooltip with the equation and R² on hover. Driven
    in real Chromium so hover picking runs through the SVG renderer.
*/

const scatter = [];
["Alpha", "Beta"].forEach((id, s) =>
  [1, 2, 3, 4, 5, 6, 7, 8].forEach(x =>
    scatter.push({id, pt: `${id}${x}`, x, y: (s + 1) * 10 + (s + 1) * 3 * x + (x % 2 ? 2 : -2)}),
  ),
);

const years = [];
["Alpha", "Beta"].forEach((id, s) =>
  [2015, 2016, 2017, 2018, 2019, 2020].forEach((year, k) =>
    years.push({id, year, value: 20 + 10 * s + 4 * k + (k % 2 ? 3 : 0)}),
  ),
);

const probe = ([kind, config, data, hover]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[kind]()
      .data(data)
      .groupBy("id")
      .config(config)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      const keyed = Array.from(svg.querySelectorAll("[data-key]"));
      const groups = keyed.filter(n => /^plot-trend-/.test(n.getAttribute("data-key")));
      // A Line also emits a fat transparent "::hit" path as its hover target.
      const visible = g => Array.from(g.querySelectorAll("path"))
        .filter(p => !/::hit$/.test(p.getAttribute("data-key") || ""));
      const isMark = n => /^(Alpha|Beta)(_.*)?$/.test(n.getAttribute("data-key"));
      const firstMark = keyed.findIndex(isMark);
      const firstTrend = groups.length ? keyed.indexOf(groups[0]) : -1;
      const out = {
        keys: groups.map(g => g.getAttribute("data-key")),
        paths: groups.map(g => visible(g).length),
        strokes: groups.map(g => {
          const p = visible(g).pop();
          return p ? p.getAttribute("stroke") : null;
        }),
        dash: groups.map(g => {
          const p = visible(g).pop();
          return p ? p.getAttribute("stroke-dasharray") : null;
        }),
        hitAreas: groups.map(g => g.querySelectorAll('[data-key$="::hit"]').length),
        behindMarks: firstTrend >= 0 && firstMark >= 0 ? firstTrend < firstMark : null,
        fits: (viz._trendFits || []).map(f => ({
          id: f.id, type: f.fit.type, r2: f.fit.r2, n: f.fit.n, axis: f.axis,
          samples: f.samples.length,
          lci: f.samples[0].lci, hci: f.samples[0].hci,
          first: f.samples[0], last: f.samples[f.samples.length - 1],
        })),
        yDomain: viz._yAxis._d3Scale.domain().map(Number),
        xDomain: viz._xAxis._d3Scale.domain().map(d => (typeof d === "number" || d instanceof Date ? +d : d)),
      };
      if (!hover || !groups.length) return resolve(out);
      // Hover the middle of the first trend line.
      const line = Array.from(groups[0].querySelectorAll("path")).pop();
      const p = line.getPointAtLength(line.getTotalLength() / 2);
      const screen = new DOMPoint(p.x, p.y).matrixTransform(line.getScreenCTM());
      line.dispatchEvent(new MouseEvent("mousemove", {clientX: screen.x, clientY: screen.y, bubbles: true}));
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        out.tip = tip
          ? {
            title: tip.querySelector(".d3plus-tooltip-title").textContent,
            rows: Array.from(tip.querySelectorAll("tbody tr"))
              .map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent)),
          }
          : null;
        svg.dispatchEvent(new MouseEvent("mouseleave", {clientX: 0, clientY: 0}));
        requestAnimationFrame(() => setTimeout(() => {
          out.tipAfterLeave = !!document.querySelector(".d3plus-tooltip");
          resolve(out);
        }, 30));
      }, 30));
    });
  });

const run = (kind, config, data = scatter, hover = false) =>
  render('<div id="viz" style="width:600px;height:400px"></div>', probe, [kind, config, data, hover]);
// Scatter points are drawn one per `pt`; their series is the parent `id`.
const points = {groupBy: ["id", "pt"], x: "x", y: "y"};

after(closeBrowser);

it("trendLine — off by default", async () => {
  const r = await run("Plot", {...points});
  assert.deepStrictEqual(r.keys, [], "no trend groups");
  assert.deepStrictEqual(r.fits, [], "no fits");
});

it("trendLine — one line per series, colored to match, behind the marks", async () => {
  const r = await run("Plot", {...points, trendLine: true});
  assert.deepStrictEqual(r.keys, ["plot-trend-Alpha", "plot-trend-Beta"], "a group per series");
  assert.deepStrictEqual(r.paths, [1, 1], "just the line (no band)");
  assert.ok(r.strokes.every(s => s && s !== "#444"), "series colors");
  assert.notStrictEqual(r.strokes[0], r.strokes[1], "each series its own color");
  assert.ok(r.dash.every(d => d === "6 4"), "dashed by default");
  assert.deepStrictEqual(r.hitAreas, [1, 1], "a wide hover target along each line");
  assert.strictEqual(r.behindMarks, true, "trend lines draw before the first mark");
  assert.ok(r.fits.every(f => f.type === "linear" && f.n === 8 && f.r2 > 0.9), "linear fits");
  assert.deepStrictEqual([r.fits[0].first.x, r.fits[0].last.x], [1, 8], "spans the series' x extent");
});

it("trendLine — a scatter with one groupBy level fits all points together", async () => {
  const r = await run("Plot", {groupBy: "pt", x: "x", y: "y", trendLine: true});
  assert.deepStrictEqual(r.keys, ["plot-trend-all"], "every point is its own id, so one line");
  assert.strictEqual(r.fits[0].n, 16);
});

it("trendLine — group 'all' fits one dark-gray line", async () => {
  const r = await run("Plot", {...points, trendLine: "linear", trendLineConfig: {group: "all"}});
  assert.deepStrictEqual(r.keys, ["plot-trend-all"]);
  assert.strictEqual(r.strokes[0], "#444");
  assert.strictEqual(r.fits[0].n, 16, "fit to every point");
});

it("trendLine — confidence band draws an area and widens the y domain", async () => {
  const base = await run("Plot", {...points, trendLine: true});
  const r = await run("Plot", {...points, trendLine: true, trendLineConfig: {confidence: true}});
  assert.deepStrictEqual(r.paths, [2, 2], "band + line per series");
  assert.ok(r.fits.every(f => f.lci < f.hci), "band bounds");
  const lowest = Math.min(...r.fits.map(f => f.lci));
  assert.ok(Math.min(...r.yDomain) <= lowest, `y domain ${r.yDomain} covers the band (${lowest})`);
  assert.ok(Math.min(...r.yDomain) < Math.min(...base.yDomain), "domain grew to fit the band");
});

it("trendLine — non-linear types", async () => {
  for (const type of ["exponential", "logarithmic", "power", "polynomial"]) {
    const r = await run("Plot", {...points, trendLine: type});
    assert.strictEqual(r.fits.length, 2, `${type}: two fits`);
    assert.ok(r.fits.every(f => f.type === type && f.samples === 50), `${type}: sampled curve`);
  }
  const band = await run("Plot", {...points, trendLine: "exponential", trendLineConfig: {confidence: true}});
  assert.deepStrictEqual(band.paths, [1, 1], "confidence bands are linear-only");
});

it("trendLine — BarChart fits along the discrete axis, one sample per category", async () => {
  const r = await run("BarChart", {x: "year", y: "value", trendLine: true}, years);
  assert.deepStrictEqual(r.keys, ["plot-trend-Alpha", "plot-trend-Beta"], "a line per series, not per bar");
  assert.ok(r.fits.every(f => f.axis === "x" && f.samples === 6), "a sample at each year");
  assert.strictEqual(r.behindMarks, true, "behind the bars");
});

it("trendLine — horizontal BarChart fits along y", async () => {
  const r = await run("BarChart", {discrete: "y", x: "value", y: "year", trendLine: true}, years);
  assert.strictEqual(r.fits.length, 2);
  assert.ok(r.fits.every(f => f.axis === "y"), "independent axis is y");
  assert.ok(r.fits.every(f => typeof f.first.x === "number" && f.first.y === 2015), "x holds the fitted value");
});

it("trendLine — BarChart with category names fits by order", async () => {
  const cats = ["Low", "Mid", "High", "Top"].map((cat, i) => ({id: "A", cat, value: 5 + 5 * i}));
  const r = await run("BarChart", {x: "cat", y: "value", trendLine: true}, cats);
  assert.strictEqual(r.fits.length, 1);
  assert.deepStrictEqual([r.fits[0].first.x, r.fits[0].last.x], ["Low", "Top"], "samples back to categories");
  assert.ok(Math.abs(r.fits[0].r2 - 1) < 1e-9, "exact fit by category index");
});

it("trendLine — stacked charts fit the stack totals", async () => {
  const r = await run("StackedArea", {x: "year", y: "value", trendLine: true}, years);
  assert.deepStrictEqual(r.keys, ["plot-trend-all"], "one line for the stack");
  assert.ok(r.fits[0].first.y > 40, "follows the stack tops (totals), not a single series");
});

it("trendLine — time axis LinePlot", async () => {
  const data = years.map(d => ({...d, date: `${d.year}-01-01`}));
  const r = await run("LinePlot", {x: "date", y: "value", time: "date", trendLine: true}, data);
  assert.strictEqual(r.fits.length, 2);
  assert.ok(r.fits.every(f => f.samples === 50), "continuous time axis samples a curve");
  assert.ok(r.fits[0].first.x instanceof Date, "samples map back to dates");
});

it("trendLine — hovering a line shows its equation and R²", async () => {
  const r = await run("Plot", {...points, trendLine: true}, scatter, true);
  assert.ok(r.tip, "tooltip shown");
  assert.strictEqual(r.tip.title, "Alpha", "titled by the series");
  const rows = Object.fromEntries(r.tip.rows.map(([k, v]) => [k, v]));
  assert.strictEqual(rows["Trend Line"], "Linear");
  assert.match(rows.Equation, /^y = [\d.]+x \+ [\d.]+$/, "fitted equation");
  assert.match(rows["R²"], /^0\.\d{3}$/, "R² to three decimals");
  assert.strictEqual(rows.Observations, "8");
  assert.ok(!r.tipAfterLeave, "tooltip hides on leave");
});

it("trendLine — tooltip labels are translated", async () => {
  const r = await run("Plot", {...points, trendLine: true, trendLineConfig: {group: "all"}, locale: "es-ES"}, scatter, true);
  assert.ok(r.tip, "tooltip shown");
  assert.strictEqual(r.tip.title, "Línea de Tendencia");
  const labels = r.tip.rows.map(([k]) => k);
  assert.deepStrictEqual(labels, ["Línea de Tendencia", "Ecuación", "R²", "Observaciones"]);
  assert.strictEqual(r.tip.rows[0][1], "Lineal");
});

it("trendLine — tooltip can be turned off", async () => {
  const r = await run("Plot", {...points, trendLine: true, trendLineConfig: {tooltip: false}}, scatter, true);
  assert.ok(!r.tip, "no tooltip");
});

it("trendLine — Canvas renderer picks the line for its tooltip", async () => {
  const r = await render('<div id="viz" style="width:600px;height:400px"></div>', ([data, config]) =>
    new Promise(resolve => {
      const viz = new window.d3plus.Plot()
        .data(data)
        .config(config)
        .renderer("canvas")
        .duration(0)
        .select("#viz");
      viz.render(() => {
        const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
        const {width, height} = canvas;
        const px = canvas.getContext("2d").getImageData(0, 0, width, height).data;
        // The all-data line paints #444; find one of its dash pixels.
        let found = null;
        for (let i = 0; i < px.length && !found; i += 4) {
          if (px[i + 3] > 250 && [0, 1, 2].every(k => Math.abs(px[i + k] - 68) < 6))
            found = [(i / 4) % width, Math.floor(i / 4 / width)];
        }
        if (!found) return resolve({found: false});
        const rect = canvas.getBoundingClientRect();
        const clientX = rect.left + found[0] * rect.width / width;
        const clientY = rect.top + found[1] * rect.height / height;
        canvas.dispatchEvent(new MouseEvent("mousemove", {clientX, clientY, bubbles: true}));
        requestAnimationFrame(() => setTimeout(() => {
          const tip = document.querySelector(".d3plus-tooltip");
          resolve({found: true, title: tip ? tip.querySelector(".d3plus-tooltip-title").textContent : null});
        }, 30));
      });
    }), [scatter, {...points, trendLine: true, trendLineConfig: {group: "all", strokeDasharray: "none"}}]);
  assert.ok(r.found, "line painted on the canvas");
  assert.strictEqual(r.title, "Trend Line", "tooltip from the canvas pick");
});
