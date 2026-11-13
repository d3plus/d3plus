/* global DOMPoint, requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    `trendLine("movingAverage")` in real Chromium: a rolling mean per series
    with shaded ±2σ bands behind the marks, centered or trailing windows, the
    bands off, a time axis, its tooltip (translated), and the Canvas backend.
*/

const months = [];
["Alpha", "Beta"].forEach((id, s) =>
  Array.from({length: 12}, (_, k) =>
    months.push({
      id,
      month: k + 1,
      value: 40 + 20 * s + 3 * k + (k % 3 === 0 ? 9 : k % 3 === 1 ? -6 : 0),
    }),
  ),
);

const probe = ([config, data, hover]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.LinePlot()
      .data(data)
      .groupBy("id")
      .x("month")
      .y("value")
      .config(config)
      .duration(0)
      .detectVisible(false)
      .select("#viz");
    viz.render(() => {
      const nodes = sceneNodes(viz._chartScene || []);
      const groups = nodes.filter(n => /^plot-trend-/.test(`${n.key}`));
      const out = {
        canvas: !!document.querySelector("#viz canvas.d3plus-render-canvas"),
        keys: groups.map(g => g.key),
        children: groups.map(g =>
          g.children
            .filter(c => !/::hit$/.test(`${c.key}`))
            .map(c => (c.interactive ? "line" : "band")),
        ),
        fits: (viz._trendFits || []).map(f => ({
          id: f.id,
          type: f.fit.type,
          window: f.fit.window,
          center: f.fit.center,
          xs: f.samples.map(s => (s.x instanceof Date ? +s.x : s.x)),
          ys: f.samples.map(s => s.y),
          lci: f.samples.map(s => s.lci),
          hci: f.samples.map(s => s.hci),
        })),
        yDomain: viz._yAxis._d3Scale.domain().map(Number),
        labels: nodes
          .filter(n => /^trend-label-/.test(`${n.key}`) && n.lines)
          .map(n => n.lines.map(l => l.text).join("")),
      };
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      if (!hover || !svg) return resolve(out);
      const trend = Array.from(svg.querySelectorAll("[data-key]")).find(n =>
        /^plot-trend-/.test(n.getAttribute("data-key")),
      );
      const line = Array.from(trend.querySelectorAll("path")).pop();
      const p = line.getPointAtLength(line.getTotalLength() / 2);
      const screen = new DOMPoint(p.x, p.y).matrixTransform(
        line.getScreenCTM(),
      );
      line.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: screen.x,
          clientY: screen.y,
          bubbles: true,
        }),
      );
      requestAnimationFrame(() =>
        setTimeout(() => {
          const tip = document.querySelector(".d3plus-tooltip");
          out.tip = tip
            ? {
                title: tip.querySelector(".d3plus-tooltip-title").textContent,
                rows: Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
                  Array.from(tr.querySelectorAll("td")).map(
                    td => td.textContent,
                  ),
                ),
              }
            : null;
          resolve(out);
        }, 30),
      );
    });
  });

const run = (config, data = months, hover = false) =>
  render('<div id="viz" style="width:600px;height:400px"></div>', probe, [
    config,
    data,
    hover,
  ]);

/** The trailing mean of `values` over `n` points, from the first full window. */
const rolling = (values, n) =>
  values.slice(n - 1).map((_, i) => {
    const w = values.slice(i, i + n);
    return w.reduce((a, b) => a + b, 0) / n;
  });

it("movingAverage — a trailing mean per series with ±2σ bands", async () => {
  const r = await run({
    trendLine: "movingAverage",
    trendLineConfig: {window: 3},
  });
  assert.deepStrictEqual(r.keys, ["plot-trend-Alpha", "plot-trend-Beta"]);
  assert.deepStrictEqual(
    r.children,
    [
      ["band", "line"],
      ["band", "line"],
    ],
    "a band under each line",
  );
  const alpha = months.filter(d => d.id === "Alpha").map(d => d.value);
  const [fit] = r.fits;
  assert.strictEqual(fit.type, "movingAverage");
  assert.deepStrictEqual(fit.xs, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  rolling(alpha, 3).forEach((mean, i) =>
    assert.ok(Math.abs(fit.ys[i] - mean) < 1e-9, `mean at ${fit.xs[i]}`),
  );
  fit.ys.forEach((y, i) => {
    const half = (fit.hci[i] - fit.lci[i]) / 2;
    assert.ok(half > 0, "the band has width");
    assert.ok(Math.abs(fit.lci[i] + half - y) < 1e-9, "centered on the mean");
  });
  const lowest = Math.min(...r.fits.flatMap(f => f.lci));
  assert.ok(
    Math.min(...r.yDomain) <= lowest,
    `the y domain ${r.yDomain} covers the bands (${lowest})`,
  );
});

it("movingAverage — a centered window, a band multiplier, and bands off", async () => {
  const centered = await run({
    trendLine: "movingAverage",
    trendLineConfig: {window: 3, center: true, bands: 1},
  });
  assert.deepStrictEqual(centered.fits[0].xs, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.strictEqual(centered.fits[0].center, true);
  const two = await run({
    trendLine: "movingAverage",
    trendLineConfig: {window: 3, center: true},
  });
  const width = r => r.fits[0].hci[0] - r.fits[0].lci[0];
  assert.ok(
    Math.abs(width(two) - 2 * width(centered)) < 1e-9,
    "bands sets the multiplier",
  );
  const off = await run({
    trendLine: "movingAverage",
    trendLineConfig: {window: 3, bands: false},
  });
  assert.deepStrictEqual(off.children, [["line"], ["line"]], "no bands");
});

it("movingAverage — group 'all' draws one average across the series", async () => {
  const r = await run({
    trendLine: "movingAverage",
    trendLineConfig: {window: 4, group: "all"},
  });
  assert.deepStrictEqual(r.keys, ["plot-trend-all"]);
  assert.strictEqual(r.fits[0].xs.length, 9);
});

it("movingAverage — along a time axis", async () => {
  const daily = Array.from({length: 10}, (_, k) => ({
    id: "Alpha",
    month: new Date(2024, 0, k + 1),
    value: 10 + (k % 2 ? 4 : 0) + k,
  }));
  const r = await run(
    {trendLine: "movingAverage", trendLineConfig: {window: 7}},
    daily,
  );
  assert.strictEqual(r.fits.length, 1);
  assert.deepStrictEqual(
    r.fits[0].xs,
    daily.slice(6).map(d => +d.month),
    "an average from the seventh day on",
  );
});

it("movingAverage — a span of time averages over gaps, and names its span", async function () {
  const days = [1, 2, 3, 4, 8, 9, 10, 11, 12].map(d => ({
    id: "Alpha",
    month: new Date(2024, 0, d),
    value: 10 * d,
  }));
  const r = await run(
    {trendLine: "movingAverage", trendLineConfig: {window: {days: 3}}},
    days,
  );
  const [fit] = r.fits;
  assert.deepStrictEqual(
    fit.xs.map(x => new Date(x).getDate()),
    [4, 8, 9, 10, 11, 12],
  );
  assert.deepStrictEqual(
    fit.ys,
    [30, 80, 85, 90, 100, 110],
    "each averages its last three days, the gap included",
  );
  assert.deepStrictEqual(r.labels, ["Moving Average (3 days)"]);
  const points = await run({trendLine: "movingAverage"}, days);
  assert.deepStrictEqual(
    points.fits[0].xs.map(x => new Date(x).getDate()),
    [10, 11, 12],
    "seven points by default",
  );
});

it("movingAverage — hovering the line shows the nearest average, its band, and the window", async () => {
  const r = await run(
    {trendLine: "movingAverage", trendLineConfig: {window: 3}},
    months,
    true,
  );
  assert.ok(r.tip, "tooltip shown");
  assert.strictEqual(r.tip.title, "Alpha");
  const labels = r.tip.rows.map(([k]) => k);
  assert.deepStrictEqual(labels, [
    "month",
    "Moving Average",
    "Band",
    "Window",
    "Observations",
  ]);
  const rows = Object.fromEntries(r.tip.rows);
  assert.match(rows["Moving Average"], /^[\d.]+$/);
  assert.strictEqual(rows.Window, "3");
  assert.strictEqual(rows.Observations, "12");
  assert.match(rows.Band, /^[\d.]+ – [\d.]+ \(±2σ\)$/);
});

it("movingAverage — tooltip labels are translated", async () => {
  const r = await run(
    {
      trendLine: "movingAverage",
      trendLineConfig: {window: 3, center: true},
      locale: "es-ES",
    },
    months,
    true,
  );
  const rows = Object.fromEntries(r.tip.rows);
  assert.ok("Media Móvil" in rows, "the average's row");
  assert.strictEqual(rows.Ventana, "3 (Centrado)");
});

it("movingAverage — renders on Canvas", async () => {
  const r = await run({
    trendLine: "movingAverage",
    trendLineConfig: {window: 3},
    renderer: "canvas",
  });
  assert.strictEqual(r.canvas, true);
  assert.deepStrictEqual(r.keys, ["plot-trend-Alpha", "plot-trend-Beta"]);
  assert.deepStrictEqual(r.children[0], ["band", "line"]);
});
