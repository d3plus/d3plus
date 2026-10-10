import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    RadialBar renders in Chromium on both backends: concentric tracks sorted
    by value with arc length encoding value, the track backgrounds, value
    gridlines and tick labels, track labels at each start, partial sweeps
    that shift the circle to fit, the circular bar chart (discrete angle),
    hover, Canvas painting + picking, and small multiples.
*/

after(async () => {
  await closeBrowser();
});

const shares = [
  {id: "Safari", value: 20},
  {id: "Chrome", value: 64},
  {id: "Edge", value: 5},
  {id: "Firefox", value: 15},
];

it("RadialBar draws one track per row, outermost first, arc length encoding value", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:600px;height:500px'></div>",
    async rows => {
      const viz = new window.d3plus.RadialBar()
        .select("#viz")
        .duration(0)
        .data(rows);
      await new Promise(r => viz.render(r));
      const scene = viz._chartScene;
      const bars = scene.filter(
        n => n.type === "path" && n.datum && !`${n.key}`.endsWith("::hit"),
      );
      const hits = scene.filter(n => `${n.key}`.endsWith("::hit"));
      const svg = document.querySelector("#viz svg");
      return {
        keys: scene.map(n => n.key),
        bars: bars.map(b => ({id: b.datum.id, arc: b.arc, aria: b.aria.label})),
        hits: hits.map(h => ({key: h.key, fill: h.paint.fill, id: h.datum.id})),
        frame: viz.ctx.polar,
        tracks: scene
          .find(n => n.key === "radialbar-tracks")
          .children.map(t => ({arc: t.arc, interactive: t.interactive})),
        grid: scene.find(n => n.key === "radialbar-grid").children.length,
        labelGroup: scene.find(n => n.key === "radialbar-labels"),
        texts: [...svg.querySelectorAll("text")].map(t => t.textContent),
        legend: viz.schema.legend({}, viz._filteredData),
        tooltip: [
          viz.schema.tooltipConfig.tbody[0][0](),
          viz.schema.tooltipConfig.tbody[0][1](rows[1], 1),
        ],
        nan: [...svg.querySelectorAll("*")].filter(n =>
          [...n.attributes].some(a => a.value.includes("NaN")),
        ).length,
      };
    },
    shares,
  );
  assert.deepStrictEqual(
    out.bars.map(b => b.id),
    ["Chrome", "Safari", "Firefox", "Edge"],
    "sorted by value",
  );
  const radii = out.bars.map(b => b.arc.outerRadius);
  assert.ok(
    radii.every((r, i) => !i || r < radii[i - 1]),
    "the largest value is outermost",
  );
  assert.strictEqual(radii[0], out.frame.outer);
  assert.deepStrictEqual(
    out.frame.domain,
    [0, 70],
    "nice domain including zero",
  );
  const sweep = (3 * Math.PI) / 2;
  const chrome = out.bars[0].arc;
  assert.strictEqual(chrome.startAngle, 0, "bars start at 12 o'clock");
  assert.ok(
    Math.abs(chrome.endAngle - (64 / 70) * sweep) < 1e-9,
    "arc length is proportional to value",
  );
  assert.strictEqual(out.hits.length, 4, "every bar has a hit area");
  assert.ok(out.hits.every(h => h.fill === "transparent"));
  assert.strictEqual(out.hits[0].key, "radialbar-Chrome-Chrome::hit");
  assert.strictEqual(out.tracks.length, 4);
  assert.ok(
    out.tracks.every(
      t => t.interactive === false && Math.abs(t.arc.endAngle - sweep) < 1e-9,
    ),
    "full-sweep tracks",
  );
  assert.ok(out.grid >= 3, "value gridlines");
  assert.ok(
    out.labelGroup && out.labelGroup.interactive === false,
    "track labels",
  );
  for (const t of ["Chrome", "Safari", "Firefox", "Edge", "0", "70"])
    assert.ok(out.texts.includes(t), `renders "${t}"`);
  assert.strictEqual(out.legend, false, "the track labels name every bar");
  assert.deepStrictEqual(out.tooltip, ["Value", "64"]);
  assert.ok(out.bars[0].aria === "Chrome, 64.");
  assert.strictEqual(out.nan, 0);
});

it("RadialBar honors sort(null), domain, ticks, track(false), and a partial sweep", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    async rows => {
      const viz = new window.d3plus.RadialBar()
        .select("#viz")
        .duration(0)
        .data(rows)
        .sort(null)
        .domain([0, 100])
        .ticks([0, 50, 100])
        .track(false)
        .startAngle(-90)
        .maxAngle(180);
      await new Promise(r => viz.render(r));
      const scene = viz._chartScene;
      const bars = scene.filter(
        n => n.type === "path" && n.datum && !`${n.key}`.endsWith("::hit"),
      );
      return {
        ids: bars.map(b => b.datum.id),
        ends: bars.map(b => b.arc.endAngle),
        hasTracks: scene.some(n => n.key === "radialbar-tracks"),
        ticks: scene
          .find(n => n.key === "radialbar-ticks")
          .children.map(t => t.lines[0].text),
        rotate: scene.find(n => n.key === "radialbar-labels").transform,
        frame: viz.ctx.polar,
        transformY: viz._chartTransform.y,
        mid:
          viz._margin.top +
          (viz.schema.height - viz._margin.top - viz._margin.bottom) / 2,
      };
    },
    shares,
  );
  assert.deepStrictEqual(
    out.ids,
    ["Safari", "Chrome", "Edge", "Firefox"],
    "data order",
  );
  assert.ok(
    Math.abs(out.ends[1] - (-Math.PI / 2 + 0.64 * Math.PI)) < 1e-9,
    "64 of 100 over a half turn",
  );
  assert.strictEqual(out.hasTracks, false);
  assert.deepStrictEqual(out.ticks, ["0", "50", "100"]);
  assert.deepStrictEqual(
    out.rotate,
    {rotate: -90},
    "track labels turn with the start",
  );
  assert.ok(
    out.frame.cy > 0,
    "a half sweep moves the circle down to fill the area",
  );
  assert.ok(out.transformY > out.mid);
});

it('RadialBar discrete("angle") draws a circular bar chart', async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:600px;height:500px'></div>",
    async rows => {
      const viz = new window.d3plus.RadialBar()
        .select("#viz")
        .duration(0)
        .data(rows)
        .discrete("angle")
        .trackPadding(0.5);
      await new Promise(r => viz.render(r));
      const scene = viz._chartScene;
      const bars = scene.filter(
        n => n.type === "path" && n.datum && !`${n.key}`.endsWith("::hit"),
      );
      const hits = scene.filter(n => `${n.key}`.endsWith("::hit"));
      return {
        keys: scene.map(n => n.key),
        bars: bars.map(b => ({id: b.datum.id, arc: b.arc})),
        hits: hits.length,
        frame: viz.ctx.polar,
        tracks: scene.find(n => n.key === "radialbar-tracks").children.length,
        texts: [...document.querySelectorAll("#viz svg text")].map(
          t => t.textContent,
        ),
      };
    },
    shares,
  );
  const {inner, outer, levels} = out.frame;
  assert.ok(
    inner > 0 && Math.abs(inner - outer / 4) < 1e-9,
    "bars rise from an inner circle",
  );
  assert.deepStrictEqual(
    out.bars.map(b => b.id),
    ["Chrome", "Safari", "Firefox", "Edge"],
  );
  const r = v =>
    inner +
    ((v - levels.domain[0]) / (levels.domain[1] - levels.domain[0])) *
      (outer - inner);
  out.bars.forEach((b, i) => {
    assert.strictEqual(b.arc.innerRadius, inner);
    assert.ok(
      Math.abs(b.arc.outerRadius - r([64, 20, 15, 5][i])) < 1e-6,
      "bar length is linear in value",
    );
  });
  const slot = (Math.PI * 2) / 4;
  assert.ok(
    Math.abs(out.bars[0].arc.startAngle - slot / 4) < 1e-9,
    "half the slot is padding, split on both sides",
  );
  assert.strictEqual(out.hits, 4);
  assert.strictEqual(out.tracks, 4);
  assert.ok(out.keys.includes("radar-radial-circles"), "value rings");
  assert.ok(out.keys.includes("radialbar-labels"), "category labels");
  for (const t of ["Chrome", "Safari", "Firefox", "Edge"])
    assert.ok(out.texts.includes(t), `labels ${t}`);
});

it("RadialBar dims other rows on hover and picks on Canvas", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='svg' style='width:500px;height:400px'></div><div id='canvas' style='width:500px;height:400px'></div>",
    async rows => {
      const svg = new window.d3plus.RadialBar()
        .select("#svg")
        .duration(0)
        .data(rows);
      await new Promise(r => svg.render(r));
      svg.hover(d => d.id === "Chrome");
      await new Promise(r => setTimeout(r, 50));
      const opacity = key => {
        const el = document.querySelector(`#svg [data-key='${key}']`);
        return el ? Number(el.getAttribute("opacity") ?? 1) : null;
      };
      const viz = new window.d3plus.RadialBar()
        .select("#canvas")
        .duration(0)
        .renderer("canvas")
        .data(rows)
        .on("click", d => (window.__clicked = d && d.data ? d.data : d));
      await new Promise(r => viz.render(r));
      const canvas = document.querySelector(
        "#canvas canvas.d3plus-render-canvas",
      );
      // Click the empty end of Edge's track: its hit area covers the whole track.
      const edge = viz._chartScene.find(
        n =>
          n.type === "path" &&
          n.datum &&
          n.datum.id === "Edge" &&
          !`${n.key}`.endsWith("::hit"),
      );
      const r = (edge.arc.innerRadius + edge.arc.outerRadius) / 2;
      const a = Math.PI; // 6 o'clock, far past Edge's short bar
      const rect = canvas.getBoundingClientRect();
      window.__clicked = undefined;
      canvas.dispatchEvent(
        new MouseEvent("click", {
          clientX: rect.left + viz._chartTransform.x + r * Math.sin(a),
          clientY: rect.top + viz._chartTransform.y - r * Math.cos(a),
          bubbles: true,
        }),
      );
      return {
        chrome: opacity("radialbar-Chrome-Chrome"),
        edge: opacity("radialbar-Edge-Edge"),
        tracks: opacity("radialbar-tracks"),
        clicked: window.__clicked && window.__clicked.id,
      };
    },
    shares,
  );
  assert.strictEqual(out.chrome, 1);
  assert.strictEqual(out.edge, 0.5);
  assert.ok(out.tracks === null || out.tracks === 1, "tracks never dim");
  assert.strictEqual(
    out.clicked,
    "Edge",
    "a click anywhere on a track picks its row",
  );
});

it("RadialBar draws one panel per facet", async function () {
  this.timeout(180000);
  const out = await render(
    "<div id='viz' style='width:900px;height:400px'></div>",
    async rows => {
      const data = ["2025", "2026"].flatMap((year, y) =>
        rows.map(d => ({...d, year, value: d.value + y * 5})),
      );
      const viz = new window.d3plus.RadialBar()
        .select("#viz")
        .duration(0)
        .data(data)
        .facet("year");
      await new Promise(r => viz.render(r));
      const all = [];
      const walk = nodes =>
        nodes.forEach(n => {
          all.push(n);
          if (n.children) walk(n.children);
        });
      walk(viz._chartScene);
      return {
        bars: all.filter(
          n =>
            n.type === "path" &&
            n.datum &&
            n.arc &&
            !`${n.key}`.endsWith("::hit"),
        ).length,
        texts: [...document.querySelectorAll("#viz svg text")].map(
          t => t.textContent,
        ),
      };
    },
    shares,
  );
  assert.strictEqual(out.bars, 8, "four bars in each panel");
  assert.ok(
    out.texts.includes("2025") && out.texts.includes("2026"),
    "panel titles",
  );
});
