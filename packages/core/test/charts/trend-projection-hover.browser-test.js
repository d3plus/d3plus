/* global DOMPoint, requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    #289: `trendLineConfig.projection` extends trend lines past the data. The
    axis widens to the projected positions, the projection draws as its own
    dotted line, and hovering it (or the plot area over a projected position)
    lists the projected values. Driven in real Chromium so hover picking runs
    through the SVG renderer.
*/

const years = [];
["Alpha", "Beta"].forEach((id, s) =>
  [2015, 2016, 2017, 2018, 2019, 2020].forEach((year, k) =>
    years.push({id, year, value: 20 + 10 * s + 4 * k + (k % 2 ? 3 : 0)}),
  ),
);

/**
    Renders, then hovers: `"surface"` at a fraction `fx` across the plot area
    (empty space near its top), or `"line"` at a fraction along the first
    projected trend line.
*/
const probe = ([kind, config, data, hover, fx]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[kind]()
      .data(data)
      .groupBy("id")
      .config(config)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      const visible = n => !/::hit$/.test(n.getAttribute("data-key") || "");
      const projections = Array.from(svg.querySelectorAll("[data-key]"))
        .filter(n => /^trend-.*-projection$/.test(n.getAttribute("data-key")) && visible(n));
      const out = {
        xDomain: viz._xAxis._d3Scale.domain().map(d => (d instanceof Date ? d.getFullYear() : d)),
        projections: projections.map(n => n.getAttribute("data-key")),
        dash: projections.map(n => n.getAttribute("stroke-dasharray")),
      };
      if (!hover) return resolve(out);
      if (hover === "surface") {
        const surface = svg.querySelector('[data-key="plot-hover-surface"]');
        const r = svg.getBoundingClientRect();
        const a = viz._plotArea, c = viz._chartTransform;
        const clientX = r.left + c.x + a.x + a.width * fx;
        const clientY = r.top + c.y + a.y + 4;
        (surface || svg).dispatchEvent(new MouseEvent("mousemove", {clientX, clientY, bubbles: true}));
      }
      else {
        const line = projections[0];
        const p = line.getPointAtLength(line.getTotalLength() * fx);
        const screen = new DOMPoint(p.x, p.y).matrixTransform(line.getScreenCTM());
        line.dispatchEvent(new MouseEvent("mousemove", {clientX: screen.x, clientY: screen.y, bubbles: true}));
      }
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        out.header = tip ? Array.from(tip.querySelectorAll("thead th")).map(th => th.textContent) : [];
        out.rows = tip
          ? Array.from(tip.querySelectorAll("tbody tr")).map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent))
          : [];
        out.crosshair = !!svg.querySelector('[data-key="plot-crosshair"]');
        resolve(out);
      }, 30));
    });
  });

const run = (kind, config, hover = null, fx = 0.5, data = years) =>
  render('<div id="viz" style="width:800px;height:400px"></div>', probe, [kind, config, data, hover, fx]);
const line = {x: "year", y: "value", trendLine: true};

after(closeBrowser);

it("projection — widens the axis and draws a dotted projection per series", async () => {
  const r = await run("LinePlot", {...line, trendLineConfig: {projection: 3}});
  assert.deepStrictEqual(r.xDomain, [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023]);
  assert.deepStrictEqual(r.projections, ["trend-Alpha-projection", "trend-Beta-projection"]);
  assert.ok(r.dash.every(d => d === "2 4"), `dotted by default (${r.dash})`);
});

it("projection — off by default", async () => {
  const r = await run("LinePlot", line);
  assert.deepStrictEqual(r.xDomain, [2015, 2016, 2017, 2018, 2019, 2020]);
  assert.deepStrictEqual(r.projections, []);
});

it("projection — on a time axis, to an end year", async () => {
  const dated = years.map(d => ({...d, date: `${d.year}-01-01`}));
  const r = await run("LinePlot", {x: "date", y: "value", time: "date", trendLine: true, trendLineConfig: {projection: {to: 2025}}}, null, 0.5, dated);
  assert.deepStrictEqual([r.xDomain[0], r.xDomain[r.xDomain.length - 1]], [2015, 2025]);
  assert.strictEqual(r.projections.length, 2);
});

it("projection — hovering a projected position lists every series' projected value", async () => {
  const r = await run("LinePlot", {...line, trendLineConfig: {projection: 3, confidence: true}}, "surface", 0.9);
  assert.ok(r.crosshair, "the crosshair snaps to the projected year");
  assert.deepStrictEqual(r.header, ["year", "2022 (Projected)"], "the projected year is marked");
  assert.deepStrictEqual(r.rows.map(row => row[0]).sort(), ["Alpha", "Beta"], "one row per series, names unmarked");
  assert.ok(r.rows.every(([, value]) => /\(.+ – .+\)$/.test(value)), `with the band's bounds: ${r.rows.map(row => row[1])}`);
});

it("projection — a column mixing plotted and projected values marks only the projected rows", async () => {
  const ragged = years.filter(d => d.id !== "Beta" || d.year <= 2018);
  const r = await run("LinePlot", {...line, trendLineConfig: {projection: 3}}, "surface", 0.5, ragged);
  assert.ok(!/Projected/.test(r.header.join(" ")), `header unmarked: ${r.header}`);
  const names = r.rows.map(row => row[0]);
  assert.ok(names.includes("Alpha"), `plotted series unmarked: ${names}`);
  assert.ok(names.includes("Beta (Projected)"), `projected series marked: ${names}`);
});

it("projection — the plotted years keep their usual tooltip", async () => {
  const r = await run("LinePlot", {...line, trendLineConfig: {projection: 3}}, "surface", 0);
  assert.deepStrictEqual(r.header, ["year", "2015"]);
  assert.ok(r.rows.every(([name]) => !/Projected/.test(name)));
});

it("projection — hovering the projected line leads with its projected value", async () => {
  const r = await run("LinePlot", {...line, trendLineConfig: {projection: 3}}, "line", 0.95);
  assert.deepStrictEqual(r.rows[0], ["year", "2023 (Projected)"]);
  assert.strictEqual(r.rows[1][0], "value");
  assert.ok(r.rows.some(([label]) => label === "Trend Line"), "followed by the fit's rows");
});

it("projection — a bar chart gains empty future slots", async () => {
  const r = await run("BarChart", {...line, trendLineConfig: {projection: 2}});
  assert.deepStrictEqual(r.xDomain.slice(-2), [2021, 2022]);
  assert.strictEqual(r.projections.length, 2);
});
