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
        const [cx, cy] = [b.left + b.width / 2, b.top + b.height / 2];
        // Whatever is on top at that point takes the event, as for a real pointer.
        const target = document.elementFromPoint(cx, cy) || el;
        target.dispatchEvent(new MouseEvent("mousemove", {clientX: cx, clientY: cy, bubbles: true}));
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

it("tooltip title — a user title still leads with the swatch", async () => {
  const r = await titleSwatch(
    "(lib, data) => new lib.Treemap().data(data.filter(d => d.year === 2018)).groupBy('id').sum('value').tooltipConfig({title: d => `Custom ${d.id}`})",
    "svg => svg.querySelector('[data-key=\"treemap-Beta\"]')",
  );
  assert.strictEqual(r.text, "Custom Beta");
  assert.strictEqual(r.kind, "square");
});

it("tooltip title — a shape's label leads with its shape's swatch", async () => {
  const r = await titleSwatch(
    "(lib, data) => new lib.Treemap().data(data.filter(d => d.year === 2018)).groupBy('id').sum('value')",
    "svg => Array.from(svg.querySelectorAll('text')).find(t => t.textContent.trim() === 'Beta')",
  );
  assert.strictEqual(r.text, "Beta");
  assert.strictEqual(r.kind, "square");
  assert.ok(r.color, "in the shape's fill");
});

/** A small Network: its tooltip title comes from the chart's own `tooltipConfig`. */
const network = `(lib, data) => new lib.Network()
  .nodes([{id: "Alpha", x: 0, y: 0}, {id: "Beta", x: 1, y: 1}, {id: "Gamma", x: 2, y: 0}])
  .links([{source: "Alpha", target: "Beta"}, {source: "Beta", target: "Gamma"}])
  .data(data.filter(d => d.year === 2018))`;

/** The first chart (non-legend) element of a tag. */
const chartEl = tag => `svg => Array.from(svg.querySelectorAll('${tag}'))
  .find(n => !n.closest('[data-key="viz-legend"]') && !/::hit$/.test(n.getAttribute('data-key') || ''))`;

it("tooltip title — a Network node leads with a dot", async () => {
  const r = await titleSwatch(network, chartEl("circle"));
  assert.strictEqual(r.kind, "dot");
  assert.ok(r.color, "in the node's fill");
});

/** A legend element: its swatch (`circle`/`rect`) or its label (`text`). */
const legendEl = (tag, id) => `svg => Array.from(svg.querySelectorAll('[data-key="viz-legend"] ${tag}'))
  .find(n => !/::hit$/.test(n.getAttribute('data-key') || '') && ${tag === "text" ? `n.textContent.trim() === '${id}'` : "n.getBoundingClientRect().width > 8"})`;

it("legend tooltip — a swatch and its label both lead with the swatch", async () => {
  // The legend colors the parent groups, one level up from the cells.
  const src = `(lib, data) => new lib.Treemap().groupBy(["group", "id"]).sum("value")
    .data(data.filter(d => d.year === 2018).map(d => ({...d, group: d.id === "Gamma" ? "Two" : "One"})))`;
  const swatch = await titleSwatch(src, legendEl("rect"));
  assert.strictEqual(swatch.kind, "square", "hovering the swatch");
  const label = await titleSwatch(src, legendEl("text", "One"));
  assert.strictEqual(label.text, "One");
  assert.strictEqual(label.kind, "square", "hovering the label");
  assert.ok(label.color);
});

it("legend tooltip — a Line series' label leads with the line glyph", async () => {
  const r = await titleSwatch(
    "(lib, data) => new lib.LinePlot().data(data).groupBy('id').x('year').y('value')",
    legendEl("text", "Alpha"),
  );
  assert.strictEqual(r.text, "Alpha");
  assert.strictEqual(r.kind, "line");
});

it("titleSwatch — false in tooltipConfig drops every title swatch", async () => {
  const src = `(lib, data) => new lib.Treemap().groupBy(["group", "id"]).sum("value").tooltipConfig({titleSwatch: false})
    .data(data.filter(d => d.year === 2018).map(d => ({...d, group: d.id === "Gamma" ? "Two" : "One"})))`;
  const shape = await titleSwatch(src, "svg => svg.querySelector('[data-key=\"treemap-Beta\"]')");
  assert.strictEqual(shape.text, "Beta");
  assert.strictEqual(shape.kind, null, "on a shape");
  const legend = await titleSwatch(src, legendEl("text", "One"));
  assert.strictEqual(legend.text, "One");
  assert.strictEqual(legend.kind, null, "on a legend entry");
});

it("titleSwatch — false in legendTooltip drops only legend swatches", async () => {
  const r = await render('<div id="viz" style="width:700px;height:400px"></div>', data =>
    new Promise(resolve => {
      const viz = new window.d3plus.Treemap().groupBy(["group", "id"]).sum("value").legendTooltip({titleSwatch: false})
        .data(data.filter(d => d.year === 2018).map(d => ({...d, group: d.id === "Gamma" ? "Two" : "One"})))
        .duration(0).select("#viz");
      const hover = el => new Promise(res => {
        const b = el.getBoundingClientRect();
        const [cx, cy] = [b.left + b.width / 2, b.top + b.height / 2];
        (document.elementFromPoint(cx, cy) || el)
          .dispatchEvent(new MouseEvent("mousemove", {clientX: cx, clientY: cy, bubbles: true}));
        requestAnimationFrame(() => setTimeout(() => {
          const title = document.querySelector(".d3plus-tooltip .d3plus-tooltip-title");
          res(!!(title && title.querySelector(".d3plus-tooltip-swatch")));
        }, 30));
      });
      viz.render(async () => {
        const svg = document.querySelector("#viz svg.d3plus-render-svg");
        const label = Array.from(svg.querySelectorAll('[data-key="viz-legend"] text')).find(t => t.textContent.trim() === "One");
        const legend = await hover(label);
        // A shape hovered after the legend gets its swatch back.
        const shape = await hover(svg.querySelector('[data-key="treemap-Beta"]'));
        resolve({legend, shape});
      });
    }), data);
  assert.deepStrictEqual(r, {legend: false, shape: true});
});

it("colorScale tooltip — a bucket's label leads with its swatch", async () => {
  const src = `(lib, data) => new lib.Matrix().groupBy(["id", "year"]).row("id").column("year").data(data)
    .colorScale("value").colorScaleConfig({scale: "jenks"}).colorScalePosition("right")`;
  const pick = `svg => Array.from(svg.querySelectorAll('[data-key="viz-colorScale"] text'))
    .find(t => /\\d/.test(t.textContent))`;
  const r = await titleSwatch(src, pick);
  assert.strictEqual(r.kind, "square");
  assert.ok(r.color, "in the bucket's color");
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
