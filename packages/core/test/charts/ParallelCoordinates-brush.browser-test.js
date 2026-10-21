import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    ParallelCoordinates brushing, Canvas, and small multiples in Chromium:
    brushes set from code and by dragging a strip filter the lines (AND),
    `brushing(false)` removes the strips, the strip label is translated, the
    Canvas backend paints and picks, and faceted panels share domains and
    brush together. Also drives the layout helpers on a live chart.
*/

const rows = Array.from({length: 40}, (_, i) => ({
  id: `r${i}`,
  group: ["A", "B"][i % 2],
  x: i,
  y: (i * 7) % 40,
  z: 40 - i,
}));

it("ParallelCoordinates brushes from code fade the lines outside every brush", async function () {
  const out = await render(
    "<div id='viz' style='width:700px;height:400px'></div>",
    async data => {
      const viz = new window.d3plus.ParallelCoordinates()
        .select("#viz")
        .duration(0)
        .data(data)
        .groupBy(["group", "id"])
        .brushes({x: [10, 29], y: [0, 20]});
      await new Promise(r => viz.render(r));
      const lines = [];
      for (const n of sceneNodes(viz._paintedScene.root)) {
        if (typeof n.key === "string" && n.key.includes("pc-line-")) lines.push(n);
      }
      const visible = lines.filter(n => !n.key.endsWith("::hit"));
      const active = visible.filter(n => n.interactive !== false).map(n => n.datum.id);
      const faded = visible.find(n => n.interactive === false);
      const selections = [...document.querySelectorAll("#viz g.d3plus-parallel-brush rect.selection")]
        .map(r => r.style.display !== "none" && r.getAttribute("height") !== null ? Number(r.getAttribute("height")) : 0);
      return {
        active,
        expected: data.filter(d => d.x >= 10 && d.x <= 29 && d.y <= 20).map(d => d.id),
        fadedOpacity: faded.paint.strokeOpacity,
        fadedStroke: faded.paint.stroke,
        hitsOff: lines.filter(n => n.key.endsWith("::hit") && n.interactive === false).length,
        selections,
        label: document.querySelector("#viz g.d3plus-parallel-brush rect.overlay").getAttribute("aria-label"),
      };
    },
    rows,
  );
  assert.deepStrictEqual(out.active.sort(), out.expected.sort(), "only rows inside both brushes stay active");
  assert.ok(out.fadedOpacity < 0.5, "lines outside fade");
  assert.ok(/rgb\((\d+), \1, \1\)/.test(out.fadedStroke), `and turn gray (${out.fadedStroke})`);
  assert.strictEqual(out.hitsOff, 40 - out.active.length, "faded lines stop taking the pointer");
  assert.ok(out.selections[0] > 0 && out.selections[1] > 0, "the x and y strips draw their selections");
  assert.strictEqual(out.selections[2], 0, "the z strip has none");
  assert.strictEqual(out.label, "x: Drag to Filter");
});

it("ParallelCoordinates dragging a strip sets a brush and fires on('brush')", async function () {
  const out = await render(
    "<div id='viz' style='width:700px;height:400px'></div>",
    async data => {
      let fired;
      const viz = new window.d3plus.ParallelCoordinates()
        .select("#viz")
        .duration(0)
        .data(data)
        .groupBy(["group", "id"])
        .on("brush", b => (fired = b));
      await new Promise(r => viz.render(r));
      const overlay = document.querySelectorAll("#viz g.d3plus-parallel-brush rect.overlay")[0];
      const box = overlay.getBoundingClientRect();
      const at = f => ({clientX: box.left + box.width / 2, clientY: box.top + box.height * f, bubbles: true, view: window});
      overlay.dispatchEvent(new MouseEvent("mousedown", {...at(0.1), button: 0}));
      window.dispatchEvent(new MouseEvent("mousemove", at(0.3)));
      window.dispatchEvent(new MouseEvent("mousemove", at(0.5)));
      window.dispatchEvent(new MouseEvent("mouseup", at(0.5)));
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 20)));
      const brushes = viz.brushes();
      let off = 0;
      for (const n of sceneNodes(viz._paintedScene.root)) {
        if (typeof n.key === "string" && n.key.includes("pc-line-") && !n.key.endsWith("::hit") && n.interactive === false) off++;
      }
      return {brushes, fired, off};
    },
    rows,
  );
  assert.deepStrictEqual(Object.keys(out.brushes), ["x"]);
  const [lo, hi] = out.brushes.x;
  assert.ok(lo > 15 && hi < 37 && lo < hi, `the brush covers the dragged values (${lo}–${hi})`);
  assert.deepStrictEqual(out.fired, out.brushes, "on('brush') receives the brushes");
  assert.ok(out.off > 0, "lines outside the dragged brush fade");
});

it("ParallelCoordinates brushing(false) removes the strips; a translated locale labels them", async function () {
  const out = await render(
    "<div id='a' style='width:500px;height:300px'></div><div id='b' style='width:500px;height:300px'></div>",
    async data => {
      const a = new window.d3plus.ParallelCoordinates()
        .select("#a").duration(0).data(data).groupBy(["group", "id"])
        .brushing(false)
        .brushes({x: [0, 5]});
      await new Promise(r => a.render(r));
      const b = new window.d3plus.ParallelCoordinates()
        .select("#b").duration(0).data(data).groupBy(["group", "id"]).locale("es-ES");
      await new Promise(r => b.render(r));
      let off = 0;
      for (const n of sceneNodes(a._paintedScene.root)) {
        if (typeof n.key === "string" && n.key.includes("pc-line-") && n.interactive === false) off++;
      }
      return {
        strips: document.querySelectorAll("#a g.d3plus-parallel-brush").length,
        off,
        label: document.querySelector("#b g.d3plus-parallel-brush rect.overlay").getAttribute("aria-label"),
      };
    },
    rows,
  );
  assert.strictEqual(out.strips, 0, "no strips");
  assert.ok(out.off > 0, "brushes set from code still filter");
  assert.strictEqual(out.label, "x: Arrastrar para Filtrar");
});

it("ParallelCoordinates paints on Canvas, picks the line under the pointer, and keeps the strips interactive", async function () {
  const out = await render(
    "<div id='viz' style='width:700px;height:400px'></div>",
    async data => {
      const viz = new window.d3plus.ParallelCoordinates()
        .select("#viz")
        .duration(0)
        .renderer("canvas")
        .data(data)
        .groupBy(["group", "id"])
        .on("click.shape", d => (window.__clicked = d && d.data ? d.data : d));
      await new Promise(r => viz.render(r));
      const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
      if (!canvas) return {hasCanvas: false};
      const line = viz._chartScene.find(n => n.key === "pc-line-r5");
      const [p0, p1] = line.d.slice(1).split("L").map(p => p.split(",").map(Number));
      const rect = canvas.getBoundingClientRect();
      // Just past the first axis, where neighboring lines are still apart.
      const x = viz._chartTransform.x + p0[0] + (p1[0] - p0[0]) * 0.15;
      const y = viz._chartTransform.y + p0[1] + (p1[1] - p0[1]) * 0.15;
      canvas.dispatchEvent(new MouseEvent("click", {clientX: rect.left + x, clientY: rect.top + y, bubbles: true}));
      const layer = document.querySelector("#viz g.d3plus-viz-brush");
      return {
        hasCanvas: true,
        clicked: window.__clicked && window.__clicked.id,
        layerEvents: layer && getComputedStyle(layer).pointerEvents,
      };
    },
    rows,
  );
  assert.ok(out.hasCanvas, "a <canvas> is mounted");
  assert.strictEqual(out.clicked, "r5", "clicking a line picks its row");
  assert.strictEqual(out.layerEvents, "auto", "the brush strips stay interactive over the canvas");
});

it("ParallelCoordinates small multiples share domains and brush together", async function () {
  const out = await render(
    "<div id='viz' style='width:800px;height:400px'></div>",
    async data => {
      const viz = new window.d3plus.ParallelCoordinates()
        .select("#viz")
        .duration(0)
        .data(data)
        .groupBy(["group", "id"])
        .facet("group")
        .brushes({x: [0, 9]});
      await new Promise(r => viz.render(r));
      const groups = [...document.querySelectorAll("#viz g.d3plus-parallel-brush")];
      const xStrips = groups.filter(g => g.__data__.key === "x");
      const heights = xStrips.map(g => Number(g.querySelector("rect.selection").getAttribute("height")));
      // Drag a new x brush on the first panel: the second panel's strip follows.
      const overlay = xStrips[0].querySelector("rect.overlay");
      const box = overlay.getBoundingClientRect();
      const at = f => ({clientX: box.left + box.width / 2, clientY: box.top + box.height * f, bubbles: true, view: window});
      overlay.dispatchEvent(new MouseEvent("mousedown", {...at(0.6), button: 0}));
      window.dispatchEvent(new MouseEvent("mousemove", at(0.9)));
      window.dispatchEvent(new MouseEvent("mouseup", at(0.9)));
      const moved = xStrips.map(g => Number(g.querySelector("rect.selection").getAttribute("y")));
      return {
        panels: (viz._facetPanels || []).length,
        strips: groups.length,
        heights,
        moved,
        domains: viz.ctx.dimensions.map(d => d.domain.join("|")),
      };
    },
    rows,
  );
  assert.strictEqual(out.panels, 2);
  assert.strictEqual(out.strips, 6, "each panel has its own strips");
  assert.ok(out.heights.every(h => h > 0), "a brush set from code shows on every panel");
  assert.ok(Math.abs(out.moved[0] - out.moved[1]) < 1, "dragging one panel's strip moves the other's");
  assert.deepStrictEqual(out.domains, ["0|39", "0|39", "1|40"], "panels share the domains of all rows");
});

it("ParallelCoordinates layout helpers lay out axes and titles on a live chart", async function () {
  const out = await render(
    "<div id='viz' style='width:700px;height:400px'></div>",
    async data => {
      const d3plus = window.d3plus;
      const viz = new d3plus.ParallelCoordinates().select("#viz").duration(0).data(data).groupBy(["group", "id"]);
      await new Promise(r => viz.render(r));
      const dims = viz.ctx.dimensions;
      const h = d3plus.layoutAxes(viz, dims, 600, 300, "horizontal");
      const v = d3plus.layoutAxes(viz, dims, 600, 300, "vertical");
      const style = {fontSize: 12};
      const widths = d3plus.titleWidths(["ab", "abcdefgh"], style);
      const one = d3plus.titleHeight([{key: "a", text: "a long dimension title", x: 0, y: 0, width: 500, height: 0}], style);
      const wrapped = d3plus.titleHeight([{key: "a", text: "a long dimension title", x: 0, y: 0, width: 40, height: 0}], style);
      const nodes = d3plus.titleNodes([{key: "a", text: "Title", x: 0, y: 0, width: 100, height: 20}], style);
      return {
        h: h.axes.map(a => [Math.round(a.offset), Math.round(a.start), Math.round(a.end)]),
        v: v.axes.map(a => [Math.round(a.offset), Math.round(a.start), Math.round(a.end)]),
        hNodes: h.nodes.length,
        invert: Math.round(h.axes[0].invert(h.axes[0].position(20))),
        empty: d3plus.layoutAxes(viz, [], 600, 300, "horizontal").axes.length,
        widths,
        one,
        wrapped,
        node: {type: nodes[0].type, interactive: nodes[0].interactive, datum: "datum" in nodes[0]},
      };
    },
    rows,
  );
  const offsets = out.h.map(a => a[0]);
  assert.ok(offsets[0] < offsets[1] && offsets[1] < offsets[2], "horizontal axes run left to right");
  assert.ok(out.h.every(([, s, e]) => s === out.h[0][1] && e === out.h[0][2] && s < e), "every axis shares one range");
  assert.ok(out.v[0][0] < out.v[1][0] && out.v[1][0] < out.v[2][0], "vertical axes run top to bottom");
  assert.strictEqual(out.hNodes, 6, "an axis group and a title per dimension");
  assert.strictEqual(out.invert, 20, "numeric axes invert their positions");
  assert.strictEqual(out.empty, 0);
  assert.ok(out.widths[0] < out.widths[1], "titleWidths measures one-line widths");
  assert.ok(out.wrapped > out.one, "titleHeight grows when a title wraps");
  assert.deepStrictEqual(out.node, {type: "text", interactive: false, datum: false});
});
