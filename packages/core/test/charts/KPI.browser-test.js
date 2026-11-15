import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    KPI tiles in a real browser, on SVG and Canvas: one tile per metric with
    its value, delta, and sparkline; hovering a tile highlights it and lists
    its value, previous value, and change in the tooltip; small multiples
    split the tiles by panel, each tile reading its own panel's history.
*/

const months = ["2025-01", "2025-02", "2025-03", "2025-04"];
const series = {
  North: {Revenue: [100, 120, 110, 132], Churn: [5, 4, 4.5, 4]},
  South: {Revenue: [80, 82, 90, 81], Churn: [3, 3.5, 3.2, 3.6]},
};
const data = Object.entries(series).flatMap(([region, metrics]) =>
  Object.entries(metrics).flatMap(([metric, values]) =>
    values.map((value, i) => ({region, metric, month: months[i], value})),
  ),
);

/** In-page helpers: build + render a chart, list its nodes, and wait. */
const setup = `
  window.build = (opts = {}) => new Promise(resolve => {
    const chart = new window.d3plus.KPI()
      .select("#viz")
      .data(window.DATA.filter(d => opts.facet || d.region === "North").map(d => ({...d})))
      .groupBy("metric")
      .time("month")
      .duration(0)
      .width(600).height(300);
    if (opts.renderer) chart.renderer(opts.renderer);
    if (opts.config) chart.config(opts.config);
    chart.render(() => resolve(chart));
  });
  window.flat = nodes => nodes.flatMap(n => [n, ...(n.children ? window.flat(n.children) : [])]);
  window.nodes = chart => window.flat(chart._chartScene);
  window.text = n => n.lines.map(l => l.text ?? l).join(" ");
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
`;

const page = (fn, arg) =>
  render(
    "<div id='viz' style='width:600px;height:300px'></div>",
    new Function(
      "arg",
      `window.DATA = arg.data; ${setup}; return (${fn})(arg.arg);`,
    ),
    {data, arg},
  );

for (const renderer of ["svg", "canvas"]) {
  it(`KPI (${renderer}): a tile per metric with its value, delta, and sparkline`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const nodes = window.nodes(chart);
      const find = key => nodes.find(n => String(n.key).endsWith(key));
      return {
        cards: nodes.filter(n => String(n.key).endsWith("-card")).length,
        value: window.text(find("kpi-Revenue-value")),
        delta: window.text(find("kpi-Revenue-delta")),
        churn: window.text(find("kpi-Churn-delta")),
        good: find("kpi-Revenue-delta").paint.fill,
        bad: find("kpi-Churn-delta").paint.fill,
        lines: nodes.filter(n => n.type === "line").length,
        areas: nodes.filter(n => n.type === "area").length,
        aria: find("kpi-Revenue-card").aria.label,
        dom:
          renderer === "svg"
            ? document.querySelectorAll("#viz svg [data-key$='-card']").length
            : document.querySelectorAll("#viz canvas").length,
      };
    }, renderer);
    assert.strictEqual(out.cards, 2);
    assert.strictEqual(out.value, "132");
    assert.strictEqual(out.delta, "▲ 20%");
    assert.strictEqual(out.churn, "▼ 11.1%");
    assert.notStrictEqual(out.good, out.bad);
    assert.strictEqual(out.lines, 2);
    assert.strictEqual(out.areas, 2);
    assert.strictEqual(out.aria, "Revenue, 132, +20% vs. previous.");
    assert.ok(out.dom >= (renderer === "svg" ? 2 : 1));
  });

  it(`KPI (${renderer}): hovering a tile highlights it, with its numbers in the tooltip`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const target = window
        .nodes(chart)
        .find(n => String(n.key).endsWith("kpi-Churn-card"));
      const group = window
        .nodes(chart)
        .find(n => n.type === "group" && String(n.key).endsWith("kpi-Churn"));
      const host = document.querySelector(
        renderer === "svg" ? "#viz svg.d3plus-render-svg" : "#viz canvas",
      );
      const box = host.getBoundingClientRect();
      const t = chart._chartTransform || {};
      const clientX =
        box.left + (t.x || 0) + group.transform.x + target.width / 2;
      const clientY =
        box.top + (t.y || 0) + group.transform.y + target.height / 2;
      if (renderer === "canvas")
        host.dispatchEvent(
          new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
        );
      else
        for (const type of ["mouseenter", "mousemove"])
          chart._routeSceneEvent({
            type,
            point: [1, 1],
            pick: {node: target, datum: target.datum, index: target.index},
            nativeEvent: {stopPropagation() {}, clientX, clientY},
          });
      await window.wait(150);
      const tooltip = document.querySelector(".d3plus-tooltip");
      return {
        hovered: ["Revenue", "Churn"].filter(
          m => chart._hover && chart._hover({metric: m}, 0),
        ),
        tooltip: tooltip ? tooltip.textContent : "",
      };
    }, renderer);
    assert.deepStrictEqual(out.hovered, ["Churn"]);
    assert.ok(/Value\s*4/.test(out.tooltip), out.tooltip);
    assert.ok(/Previous\s*4\.5/.test(out.tooltip), out.tooltip);
    assert.ok(/Change\s*-0\.5\s*\(-11\.1%\)/.test(out.tooltip), out.tooltip);
  });

  it(`KPI (${renderer}): small multiples read each panel's history, and bars draw per period`, async () => {
    const out = await page(async renderer => {
      const facet = await window.build({
        renderer,
        facet: true,
        config: {facet: "region"},
      });
      const nodes = window.nodes(facet);
      const deltas = nodes
        .filter(n => String(n.key).endsWith("kpi-Revenue|South-delta"))
        .map(window.text);
      const bars = await window.build({
        renderer,
        config: {sparkline: "bar", tileConfig: {columns: 1}},
      });
      const barNodes = window.nodes(bars);
      const cards = barNodes.filter(n => String(n.key).endsWith("-card"));
      return {
        cards: nodes.filter(n => String(n.key).endsWith("-card")).length,
        deltas,
        bars: barNodes.filter(n => /-bar-\d+$/.test(String(n.key))).length,
        stacked: cards.length === 2 && cards[0].width === cards[1].width,
      };
    }, renderer);
    assert.strictEqual(out.cards, 4);
    assert.deepStrictEqual(out.deltas, ["▼ 10%"]);
    assert.strictEqual(out.bars, 8);
    assert.ok(out.stacked, "one column of tiles");
  });
}
