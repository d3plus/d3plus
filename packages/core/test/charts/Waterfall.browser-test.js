/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Waterfall in real Chromium: bars floating on the running total, subtotals
    from zero, kind colors and legend, connectors, value labels, horizontal
    bars read top-down, side-by-side series, small multiples, tooltips, and
    the Canvas backend.
*/

const income = [
  {item: "Revenue", amount: 420, sub: true},
  {item: "Cost of Goods", amount: -180},
  {item: "Gross Profit", sub: true},
  {item: "Marketing", amount: -45},
  {item: "Other Income", amount: 25},
  {item: "Net Income", sub: true},
];

/** Renders a Waterfall into #viz, measures it, and optionally hovers a bar. */
const probe = ([data, config, hover]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Waterfall()
      .data(data)
      .x("item")
      .y("amount")
      .subtotal("sub")
      .duration(0)
      .detectVisible(false)
      .config(config)
      .select("#viz");
    viz.render(() => {
      const host = document.querySelector("#viz");
      const svg = host.querySelector("svg.d3plus-render-svg");
      const box = el => {
        const b = el.getBoundingClientRect();
        return {left: b.left, right: b.right, top: b.top, bottom: b.bottom};
      };
      const bars = svg
        ? Array.from(
            svg.querySelectorAll(
              "[data-key$='plot-zoom-content'] rect.d3plus-render-rect",
            ),
          ).map(r => ({
            key: r.getAttribute("data-key"),
            fill: r.getAttribute("fill"),
            ...box(r),
          }))
        : [];
      const connectors = svg
        ? Array.from(
            svg.querySelectorAll("[data-key*='waterfall-connector']"),
          ).map(n => ({key: n.getAttribute("data-key"), ...box(n)}))
        : [];
      const texts = svg
        ? Array.from(
            svg.querySelectorAll("[data-key$='plot-zoom-content'] text"),
          ).map(t => t.textContent)
        : [];
      const legend = svg
        ? Array.from(svg.querySelectorAll("[data-key='viz-legend'] text")).map(
            t => t.textContent,
          )
        : [];
      const nan = svg
        ? Array.from(svg.querySelectorAll("*")).filter(n =>
            Array.from(n.attributes).some(a => a.value.includes("NaN")),
          ).length
        : 0;
      const sceneConnectors = [];
      for (const n of sceneNodes(viz._chartScene || [])) {
        if (
          typeof n.key === "string" &&
          n.key.startsWith("waterfall-connector")
        )
          sceneConnectors.push(n.key);
      }
      const out = {
        canvas: !!host.querySelector("canvas.d3plus-render-canvas"),
        bars,
        connectors,
        texts,
        legend,
        nan,
        sceneConnectors,
      };
      if (!hover || !svg) return resolve(out);
      const target = svg.querySelector(`[data-key='${hover}']`);
      const b = target.getBoundingClientRect();
      target.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: (b.left + b.right) / 2,
          clientY: (b.top + b.bottom) / 2,
          bubbles: true,
        }),
      );
      requestAnimationFrame(() =>
        setTimeout(() => {
          const tip = document.querySelector(".d3plus-tooltip");
          out.tooltip = tip
            ? {
                title:
                  tip.querySelector(".d3plus-tooltip-title")?.textContent ?? "",
                rows: Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
                  Array.from(tr.querySelectorAll("td")).map(
                    td => td.textContent,
                  ),
                ),
              }
            : null;
          resolve(out);
        }, 50),
      );
    });
  });

const body =
  '<div id="viz" style="width:700px;height:420px;font-family:sans-serif;"></div>';
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
const bar = (out, item) => out.bars.find(b => b.key === `undefined_${item}`);

it("Waterfall floats each change on the running total and draws subtotals from zero", async function () {
  const out = await render(body, probe, [income, {}]);
  assert.strictEqual(out.nan, 0, "no NaN attributes");
  assert.strictEqual(out.bars.length, income.length, "one bar per row");
  const revenue = bar(out, "Revenue"),
    cogs = bar(out, "Cost of Goods"),
    gross = bar(out, "Gross Profit");
  const marketing = bar(out, "Marketing"),
    other = bar(out, "Other Income"),
    net = bar(out, "Net Income");
  assert.ok(
    near(cogs.top, revenue.top),
    "a decrease starts at the running total",
  );
  assert.ok(
    near(cogs.bottom, gross.top),
    "and ends where the subtotal shows it",
  );
  assert.ok(
    near(gross.bottom, revenue.bottom),
    "subtotals share the zero baseline",
  );
  assert.ok(near(marketing.top, gross.top));
  assert.ok(
    near(other.bottom, marketing.bottom),
    "an increase starts where the last bar ended",
  );
  assert.ok(
    near(net.top, other.top),
    "the last subtotal shows the final running total",
  );
  const unit = (revenue.bottom - revenue.top) / 420;
  assert.ok(
    near(cogs.bottom - cogs.top, 180 * unit),
    "bar lengths match their changes",
  );
  assert.ok(near(net.bottom - net.top, 220 * unit));
});

it("Waterfall colors, labels, and connects its bars, with a legend of kinds", async function () {
  const out = await render(body, probe, [income, {}]);
  const fills = Object.fromEntries(
    out.bars.map(b => [b.key.replace("undefined_", ""), b.fill]),
  );
  assert.strictEqual(
    fills.Revenue,
    "#1c7ed6",
    "totals take colorDefaults.sequential",
  );
  assert.strictEqual(
    fills["Cost of Goods"],
    "#c92a2a",
    "decreases take colorDefaults.off",
  );
  assert.strictEqual(
    fills["Other Income"],
    "#2b8a3e",
    "increases take colorDefaults.on",
  );
  assert.deepStrictEqual(out.legend, ["Increase", "Decrease", "Total"]);
  ["420", "-180", "240", "-45", "+25", "220"].forEach(t =>
    assert.ok(out.texts.includes(t), `labels "${t}"`),
  );

  assert.strictEqual(
    out.connectors.length,
    5,
    "one connector between each pair of bars",
  );
  const revenue = bar(out, "Revenue"),
    cogs = bar(out, "Cost of Goods");
  const first = out.connectors.find(c => c.key.endsWith("-0"));
  assert.ok(
    near(first.top, revenue.top, 1) &&
      near(first.left, revenue.right, 1) &&
      near(first.right, cogs.left, 1),
    "spans the gap at the earlier bar's end",
  );

  const custom = await render(body, probe, [
    income,
    {
      increaseColor: "#ff00ff",
      connectors: false,
      shapeConfig: {Bar: {label: false}},
    },
  ]);
  assert.strictEqual(
    custom.bars.find(b => b.key === "undefined_Other Income").fill,
    "#ff00ff",
  );
  assert.strictEqual(custom.connectors.length, 0, "connectors(false)");
  assert.ok(!custom.texts.includes("+25"), "labels off");
});

it("Waterfall's tooltip shows the change and the running total", async function () {
  const out = await render(body, probe, [income, {}, "undefined_Marketing"]);
  assert.ok(out.tooltip, "a tooltip renders");
  assert.strictEqual(out.tooltip.title, "Decrease");
  assert.deepStrictEqual(out.tooltip.rows, [
    ["item", "Marketing"],
    ["amount", "-45"],
    ["Running Total", "195"],
  ]);
});

it("Waterfall reads horizontal bars top-down", async function () {
  const out = await render(body, probe, [
    income,
    {discrete: "y", x: "amount", y: "item"},
  ]);
  assert.strictEqual(out.nan, 0);
  const tops = income.map(d => bar(out, d.item).top);
  assert.deepStrictEqual(
    tops.slice().sort((a, b) => a - b),
    tops,
    "rows run in data order from the top",
  );
  const revenue = bar(out, "Revenue"),
    cogs = bar(out, "Cost of Goods");
  assert.ok(
    near(cogs.right, revenue.right),
    "a decrease starts at the running total",
  );
  assert.strictEqual(out.connectors.length, 5);
});

it("Waterfall keeps a running total per series, side by side", async function () {
  const regions = ["North", "South"].flatMap((region, r) => [
    {region, item: "Q1", amount: r ? 30 : 40},
    {region, item: "Q2", amount: r ? -10 : 25},
    {region, item: "Year", sub: true},
  ]);
  const out = await render(body, probe, [regions, {groupBy: "region"}]);
  const get = key => out.bars.find(b => b.key === key);
  const north = get("North_Year"),
    south = get("South_Year");
  assert.ok(north && south, "a subtotal bar per series");
  assert.ok(north.right <= south.left + 1, "series sit side by side");
  const unit = (get("North_Q1").bottom - get("North_Q1").top) / 40;
  assert.ok(near(north.bottom - north.top, 65 * unit), "North totals 65");
  assert.ok(near(south.bottom - south.top, 20 * unit), "South totals 20");
  assert.strictEqual(
    out.connectors.length,
    4,
    "connectors stay within each series",
  );
});

it("Waterfall draws one running total per small-multiples panel", async function () {
  const years = [2024, 2025].flatMap((year, y) => [
    {year, item: "Start", amount: 100 + y * 50, sub: true},
    {year, item: "Change", amount: y ? -20 : 10},
    {year, item: "End", sub: true},
  ]);
  const out = await render(body, probe, [years, {facet: "year"}]);
  assert.strictEqual(out.nan, 0);
  assert.ok(
    out.texts.includes("110") && out.texts.includes("130"),
    `each panel ends at its own total: ${out.texts}`,
  );
  assert.strictEqual(out.connectors.length, 4, "two connectors per panel");
});

it("Waterfall renders on Canvas", async function () {
  const out = await render(body, probe, [income, {renderer: "canvas"}]);
  assert.strictEqual(out.canvas, true);
  assert.strictEqual(
    out.sceneConnectors.length,
    5,
    "connectors are in the scene",
  );
});
