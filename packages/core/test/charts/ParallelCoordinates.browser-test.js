import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    ParallelCoordinates renders in Chromium on both backends: one line (plus
    hit path) per row and one axis + title per dimension, categorical axes,
    per-dimension config, the vertical layout, tooltips and hover emphasis,
    brushing (from code, by dragging a strip, and on small multiples), and
    Canvas painting + picking.
*/

const cars = [
  {name: "Alpha", origin: "USA", cylinders: 8, hp: 190, weight: 4300, mpg: 13},
  {name: "Bravo", origin: "USA", cylinders: 6, hp: 110, weight: 3200, mpg: 20},
  {name: "Charlie", origin: "USA", cylinders: 4, hp: 88, weight: 2600, mpg: 27},
  {name: "Delta", origin: "Japan", cylinders: 4, hp: 70, weight: 2100, mpg: 34},
  {name: "Echo", origin: "Japan", cylinders: 4, hp: 95, weight: 2400, mpg: 30},
  {name: "Foxtrot", origin: "Europe", cylinders: 4, hp: 78, weight: 2300, mpg: 31},
  {name: "Golf", origin: "Europe", cylinders: 5, hp: 103, weight: 2900, mpg: 24},
  {name: "Hotel", origin: "Europe", cylinders: 6, hp: 125, weight: 3100, mpg: null},
];

it("ParallelCoordinates draws a line per row and an axis + title per numeric dimension", async function () {
  const out = await render(
    "<div id='viz' style='width:700px;height:400px'></div>",
    async data => {
      const viz = new window.d3plus.ParallelCoordinates()
        .select("#viz")
        .duration(0)
        .data(data)
        .groupBy(["origin", "name"]);
      await new Promise(r => viz.render(r));
      const scene = viz._chartScene;
      const svg = document.querySelector("#viz svg");
      const lines = scene.filter(n => n.key.startsWith("pc-line-") && !n.key.endsWith("::hit"));
      const hits = scene.filter(n => n.key.endsWith("::hit"));
      const axes = scene.filter(n => n.key.startsWith("pc-axis-"));
      const hotel = lines.find(n => n.key === "pc-line-Hotel");
      return {
        dims: viz.ctx.dimensions.map(d => `${d.key}:${d.type}`),
        lines: lines.length,
        hits: hits.length,
        hitPaint: hits[0].paint,
        axes: axes.map(a => a.key),
        axisChrome: axes.every(a => a.interactionGroup === "axis" && a.interactive === false),
        lastIsAxis: scene[scene.length - 1].key.startsWith("pc-") && !scene[scene.length - 1].key.startsWith("pc-line"),
        texts: [...svg.querySelectorAll("text")].map(t => t.textContent),
        nan: [...svg.querySelectorAll("*")].filter(n => [...n.attributes].some(a => a.value.includes("NaN"))).length,
        aria: lines[0].aria.label,
        hotelMoves: (hotel.d.match(/M/g) || []).length,
        opacity: lines[0].paint.strokeOpacity,
        stroke: lines[0].paint.stroke,
        zoom: viz.zoom(),
        tooltip: viz.schema.tooltipConfig.tbody(data[0]),
        strips: document.querySelectorAll("#viz g.d3plus-viz-brush g.d3plus-parallel-brush").length,
      };
    },
    cars,
  );
  assert.deepStrictEqual(out.dims, ["cylinders:numeric", "hp:numeric", "weight:numeric", "mpg:numeric"], "numeric keys, minus groupBy");
  assert.strictEqual(out.lines, 8);
  assert.strictEqual(out.hits, 8, "each line has a hit path");
  assert.strictEqual(out.hitPaint.stroke, "transparent");
  assert.ok(out.hitPaint.strokeWidth >= 6, "the hit path is wider than the line");
  assert.deepStrictEqual(out.axes, ["pc-axis-cylinders", "pc-axis-hp", "pc-axis-weight", "pc-axis-mpg"]);
  assert.ok(out.axisChrome, "axes are chrome: no pointer, no dimming");
  assert.ok(out.lastIsAxis, "axes and titles draw over the lines");
  for (const t of ["cylinders", "hp", "weight", "mpg"]) assert.ok(out.texts.includes(t), `title "${t}"`);
  assert.strictEqual(out.nan, 0, "no NaN attributes");
  assert.strictEqual(out.aria, "Alpha: cylinders 8, hp 190, weight 4.3k, mpg 13.");
  assert.strictEqual(out.hotelMoves, 1, "a trailing missing value just ends the line");
  assert.strictEqual(out.opacity, 1, "few lines draw opaque");
  assert.ok(/^#|^rgb/.test(out.stroke), "lines take the row's color");
  assert.strictEqual(out.zoom, false, "zoom is off by default");
  assert.deepStrictEqual(out.tooltip, [["cylinders", "8"], ["hp", "190"], ["weight", "4.3k"], ["mpg", "13"]]);
  assert.strictEqual(out.strips, 4, "one brush strip per axis");
});

it("ParallelCoordinates reads categorical axes and per-dimension domain, format, reverse, and title", async function () {
  const out = await render(
    "<div id='viz' style='width:700px;height:400px'></div>",
    async data => {
      const viz = new window.d3plus.ParallelCoordinates()
        .select("#viz")
        .duration(0)
        .data(data)
        .groupBy(["origin", "name"])
        .dimensions(["origin", "cylinders", "weight", "mpg"])
        .dimensionConfig({
          cylinders: {scale: "point"},
          mpg: {reverse: true, domain: [0, 40], title: "Miles per Gallon"},
          weight: {tickFormat: d => `${d / 1000}t`},
        })
        .curve("bump");
      await new Promise(r => viz.render(r));
      const texts = [...document.querySelectorAll("#viz svg text")].map(t => t.textContent);
      const line = name => viz._chartScene.find(n => n.key === `pc-line-${name}`);
      const yAt = (d, k) => Number(d.split(/[MCL]/).filter(Boolean)[k].split(",").pop());
      const lastY = d => Number(d.split(",").pop());
      return {
        dims: viz.ctx.dimensions.map(d => `${d.key}:${d.type}:${d.domain.join("|")}`),
        texts,
        bump: /C/.test(line("Alpha").d),
        // mpg is reversed: the lowest mpg (Alpha, 13) sits nearer the top than the highest (Delta, 34).
        alphaMpg: lastY(line("Alpha").d),
        deltaMpg: lastY(line("Delta").d),
        // origin is categorical, sorted: Europe on top, USA at the bottom.
        alphaOrigin: yAt(line("Alpha").d, 0),
        golfOrigin: yAt(line("Golf").d, 0),
      };
    },
    cars,
  );
  assert.deepStrictEqual(out.dims, [
    "origin:categorical:Europe|Japan|USA",
    "cylinders:categorical:4|5|6|8",
    "weight:numeric:2100|4300",
    "mpg:numeric:0|40",
  ]);
  for (const t of ["Europe", "Japan", "USA", "Miles per Gallon", "4.3t"]) assert.ok(out.texts.includes(t), `renders "${t}"`);
  assert.ok(out.bump, "bump curves draw cubic segments");
  assert.ok(out.alphaMpg < out.deltaMpg, "reversed mpg puts low values on top");
  assert.ok(out.golfOrigin < out.alphaOrigin, "Europe sits above USA");
});

it("ParallelCoordinates stacks horizontal axes in the vertical orient", async function () {
  const out = await render(
    "<div id='viz' style='width:600px;height:500px'></div>",
    async data => {
      const viz = new window.d3plus.ParallelCoordinates()
        .select("#viz")
        .duration(0)
        .data(data)
        .groupBy(["origin", "name"])
        .dimensions(["hp", "mpg", "weight"])
        .orient("vertical");
      await new Promise(r => viz.render(r));
      const d = viz._chartScene.find(n => n.key === "pc-line-Alpha").d;
      const pts = d.slice(1).split("L").map(p => p.split(",").map(Number));
      const strips = [...document.querySelectorAll("#viz g.d3plus-parallel-brush")].map(g => {
        const r = g.querySelector("rect.overlay");
        return {w: Number(r.getAttribute("width")), h: Number(r.getAttribute("height"))};
      });
      return {pts, strips};
    },
    cars,
  );
  assert.strictEqual(out.pts.length, 3);
  assert.ok(out.pts[0][1] < out.pts[1][1] && out.pts[1][1] < out.pts[2][1], "axes run top to bottom");
  assert.ok(out.strips.every(s => s.w > s.h), "brush strips lie along the horizontal axes");
});

it("ParallelCoordinates shows a tooltip row per dimension and draws a hovered line opaque", async function () {
  const out = await render(
    "<div id='viz' style='width:700px;height:400px'></div>",
    async data => {
      const linesOf = root => {
        const found = [];
        for (const n of sceneNodes(root)) {
          if (typeof n.key === "string" && n.key.includes("pc-line-") && !n.key.endsWith("::hit")) found.push(n);
        }
        return found;
      };
      const viz = new window.d3plus.ParallelCoordinates()
        .select("#viz")
        .duration(0)
        .lineOpacity(0.4)
        .data(data)
        .groupBy(["origin", "name"]);
      await new Promise(r => viz.render(r));
      const before = linesOf(viz._paintedScene.root).map(n => n.paint.strokeOpacity);
      viz.schema.on.mouseenter(data[1], 1);
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 20)));
      const after = linesOf(viz._paintedScene.root);
      const bravo = after.find(n => n.key === "pc-line-Bravo");
      const other = after.find(n => n.key === "pc-line-Alpha");
      return {
        before: [...new Set(before)],
        bravo: {so: bravo.paint.strokeOpacity, z: bravo.z, sw: bravo.paint.strokeWidth},
        other: {so: other.paint.strokeOpacity, op: other.paint.opacity},
      };
    },
    cars,
  );
  assert.deepStrictEqual(out.before, [0.4], "lineOpacity sets every line's stroke opacity");
  assert.strictEqual(out.bravo.so, 1, "the hovered line is opaque");
  assert.ok(out.bravo.z > 0, "and raised");
  assert.ok(out.bravo.sw > 1.5, "with a wider stroke");
  assert.strictEqual(out.other.so, 0.4);
  assert.ok(out.other.op < 1, "the other lines dim");
});
