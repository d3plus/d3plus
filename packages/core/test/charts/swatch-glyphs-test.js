/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    Legend and tooltip swatches share one vocabulary: a Line series is a dot
    with a short stroke through it, a Circle a dot, and anything else a
    square. Single tooltips lead their title with the hovered mark's swatch.
    Driven in real Chromium so hover picking runs through the SVG renderer.
*/

after(closeBrowser);

const data = [];
["Alpha", "Beta", "Gamma"].forEach((id, s) =>
  [2015, 2016, 2017, 2018].forEach((year, k) => data.push({id, year, value: 10 + s * 8 + k * (2 + s)})),
);

/** Each legend item's swatch nodes, from the scene: `[[type, width, height, r], …]` keyed by id. */
const legendSwatches = src =>
  render('<div id="viz" style="width:700px;height:400px"></div>', ([src, data]) =>
    new Promise(resolve => {
      const viz = new Function("lib", "data", `return (${src})(lib, data);`)(window.d3plus, data).duration(0).select("#viz");
      viz.render(() => {
        const out = {};
        const walk = (n, inLegend) => {
          const here = inLegend || n.key === "viz-legend";
          if (here && (n.type === "rect" || n.type === "circle") && n.datum && !/::hit$/.test(n.key || "")) {
            const id = (n.datum.data || n.datum).id;
            (out[id] = out[id] || []).push(n.type === "circle" ? ["circle", n.r] : ["rect", n.width, n.height]);
          }
          (n.children || []).forEach(c => walk(c, here));
        };
        walk(viz.toScene().root, false);
        resolve(out);
      });
    }), [src, data]);

it("legend — a Line series gets a stroke through a dot", async () => {
  const out = await legendSwatches("(lib, data) => new lib.LinePlot().data(data).groupBy('id').x('year').y('value')");
  assert.deepStrictEqual(Object.keys(out).sort(), ["Alpha", "Beta", "Gamma"]);
  for (const [id, nodes] of Object.entries(out)) {
    const rect = nodes.find(n => n[0] === "rect");
    const circle = nodes.find(n => n[0] === "circle");
    assert.ok(rect && circle, `${id}: a stroke and a dot`);
    assert.strictEqual(rect[2], 2, `${id}: a thin stroke`);
    assert.strictEqual(rect[1], 12, `${id}: as wide as a square or dot swatch, so swatches line up`);
    assert.ok(rect[1] > circle[1] * 2, `${id}: the stroke pokes out past the dot`);
  }
});

it("legend — Bars stay squares and Circles stay dots", async () => {
  const bars = await legendSwatches("(lib, data) => new lib.BarChart().data(data).groupBy('id').x('year').y('value')");
  for (const nodes of Object.values(bars)) assert.deepStrictEqual(nodes, [["rect", 12, 12]]);
  const dots = await legendSwatches("(lib, data) => new lib.Plot().data(data).groupBy(['id', 'year']).x('year').y('value')");
  for (const nodes of Object.values(dots)) assert.deepStrictEqual(nodes.map(n => n[0]), ["circle"]);
});

/** Hovers a chart mark (`pick` selects it) and reports the tooltip title's swatch. */
const titleSwatch = (src, pick) =>
  render('<div id="viz" style="width:700px;height:400px"></div>', ([src, data, pick]) =>
    new Promise(resolve => {
      const viz = new Function("lib", "data", `return (${src})(lib, data);`)(window.d3plus, data).duration(0).select("#viz");
      viz.render(() => {
        const svg = document.querySelector("#viz svg.d3plus-render-svg");
        const el = new Function("svg", `return (${pick})(svg);`)(svg);
        const b = el.getBoundingClientRect();
        el.dispatchEvent(new MouseEvent("mousemove", {clientX: b.left + b.width / 2, clientY: b.top + b.height / 2, bubbles: true}));
        requestAnimationFrame(() => setTimeout(() => {
          const title = document.querySelector(".d3plus-tooltip .d3plus-tooltip-title");
          const sw = title && title.querySelector(".d3plus-tooltip-swatch");
          const line = sw && sw.classList.contains("d3plus-tooltip-swatch-line");
          const paint = line ? sw.lastElementChild : sw;
          resolve({
            text: title ? title.textContent : null,
            kind: sw ? line ? "line" : sw.style.borderRadius === "50%" ? "dot" : "square" : null,
            color: paint ? paint.style.backgroundColor : null,
            markColor: el.getAttribute("fill") !== "none" && el.getAttribute("fill") !== "transparent"
              ? el.getAttribute("fill")
              : el.getAttribute("stroke"),
          });
        }, 30));
      });
    }), [src, data, pick]);

const norm = c => (c || "").replace(/\s/g, "");

it("tooltip title — a Treemap rectangle leads with a square in its color", async () => {
  const r = await titleSwatch(
    "(lib, data) => new lib.Treemap().data(data.filter(d => d.year === 2018)).groupBy('id').sum('value')",
    "svg => svg.querySelector('[data-key=\"treemap-Beta\"]')",
  );
  assert.strictEqual(r.text, "Beta");
  assert.strictEqual(r.kind, "square");
  const {rgb} = await import("d3-color");
  assert.strictEqual(norm(r.color), norm(rgb(r.markColor).toString()), "the mark's fill");
});

it("tooltip title — a scatter point leads with a dot", async () => {
  const r = await titleSwatch(
    "(lib, data) => new lib.Plot().data(data).groupBy(['id', 'year']).x('year').y('value').tooltipShared(false)",
    "svg => Array.from(svg.querySelectorAll('circle')).find(c => /^Beta/.test(c.getAttribute('data-key') || ''))",
  );
  assert.strictEqual(r.kind, "dot");
  assert.ok(r.color, "colored");
});

it("tooltip title — a single Line tooltip leads with the line glyph", async () => {
  const r = await titleSwatch(
    "(lib, data) => new lib.LinePlot().data(data).groupBy('id').x('year').y('value').tooltipShared(false)",
    "svg => svg.querySelector('[data-key=\"Alpha::hit\"]') || svg.querySelector('[data-key=\"Alpha\"]')",
  );
  assert.strictEqual(r.text, "Alpha");
  assert.strictEqual(r.kind, "line");
  assert.ok(r.color, "in the line's stroke color");
});

it("tooltip title — a user title replaces the swatch", async () => {
  const r = await titleSwatch(
    "(lib, data) => new lib.Treemap().data(data.filter(d => d.year === 2018)).groupBy('id').sum('value').tooltipConfig({title: d => `Custom ${d.id}`})",
    "svg => svg.querySelector('[data-key=\"treemap-Beta\"]')",
  );
  assert.strictEqual(r.text, "Custom Beta");
  assert.strictEqual(r.kind, null);
});

it("legend — mixed swatches and their labels line up", async () => {
  const out = await render('<div id="viz" style="width:700px;height:400px"></div>', data =>
    new Promise(resolve => {
      const viz = new window.d3plus.Plot().data(data).groupBy("id").x("year").y("value").discrete("x")
        .legendPosition("right").duration(0).select("#viz")
        .shape(d => (d.id === "Alpha" ? "Line" : d.id === "Beta" ? "Circle" : "Rect"));
      viz.render(() => {
        const legend = document.querySelector('[data-key="viz-legend"]');
        const left = n => Math.round(n.getBoundingClientRect().left * 10) / 10;
        const swatches = Array.from(legend.querySelectorAll("rect, circle"))
          .filter(n => !/::hit$/.test(n.getAttribute("data-key")) && n.getBoundingClientRect().width > 8)
          .map(n => [left(n), Math.round(n.getBoundingClientRect().width * 10) / 10]);
        resolve({swatches, labels: Array.from(legend.querySelectorAll("text")).map(left)});
      });
    }), data);
  assert.strictEqual(out.swatches.length, 3, "a swatch per series");
  assert.strictEqual(new Set(out.swatches.map(s => s.join())).size, 1, `swatches share one column: ${JSON.stringify(out.swatches)}`);
  assert.strictEqual(out.labels.length, 3);
  assert.ok(Math.max(...out.labels) - Math.min(...out.labels) < 0.5, `labels start together: ${out.labels}`);
});
