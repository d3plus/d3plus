import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    Hexbin in a real browser, on both renderers: observations binned into
    hexagons (or squares) colored on the colorScale by count, density
    contours, the tooltip and hover of a bin, keyboard focus on a bin, the
    dark theme, zooming (which bins the observations again at the new
    scale, keeping the colorScale), and small multiples sharing one
    colorScale.
*/

const box = "<div id='viz' style='width:640px;height:420px'></div>";

// Three tight clusters (10, 5 and 1 observations), and rows to skip.
const clusters = [
  ...Array.from({length: 10}, () => ({x: 10, y: 10})),
  ...Array.from({length: 5}, () => ({x: 50, y: 40})),
  {x: 90, y: 80},
  {x: "n/a", y: 20},
  {x: 30, y: null},
];

// 400 observations normally distributed around (50, 50), from a seeded
// generator.
let seed = 7;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const blob = Array.from({length: 400}, () => {
  const r = Math.sqrt(-2 * Math.log(1 - random()));
  const a = 2 * Math.PI * random();
  return {x: 50 + 10 * r * Math.cos(a), y: 50 + 10 * r * Math.sin(a)};
});

// Page-side helpers: drawing, the painted Hexbin marks in surface pixels,
// and luminance.
const PRELUDE = `
  const done = chart => new Promise(resolve =>
    chart.select("#viz").duration(0).render(resolve));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const walk = (nodes, fn, o = {x: 0, y: 0, k: 1}) => nodes.forEach(n => {
    const t = n.transform || {};
    const next = {x: o.x + (t.x || 0) * o.k, y: o.y + (t.y || 0) * o.k, k: o.k * (t.scale ?? 1)};
    fn(n, next);
    if (n.children) walk(n.children, fn, next);
  });
  const vertices = d => {
    const square = d.match(/^M(-?[\\d.]+),(-?[\\d.]+)H(-?[\\d.]+)V(-?[\\d.]+)/);
    if (square) {
      const [x0, y0, x1, y1] = square.slice(1).map(Number);
      return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    }
    return (d.match(/-?[\\d.]+,-?[\\d.]+/g) || []).map(p => p.split(",").map(Number));
  };
  const marks = chart => {
    const out = [];
    walk(chart._paintedScene.root.children, (n, o) => {
      if (n.shapeType !== "Hexbin" || n.type !== "path") return;
      const pts = vertices(n.d).map(([x, y]) => [o.x + x * o.k, o.y + y * o.k]);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const meta = d3plus.hexbinMeta(n.datum);
      out.push({
        key: String(n.key),
        kind: meta.kind,
        value: d3plus.hexbinValue(n.datum),
        count: meta.count,
        fill: n.paint.fill,
        stroke: n.paint.stroke,
        fillOpacity: n.paint.fillOpacity,
        interactive: n.interactive !== false,
        d: n.d,
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
        center: [xs.reduce((a, b) => a + b, 0) / xs.length, ys.reduce((a, b) => a + b, 0) / ys.length],
      });
    });
    return out;
  };
  const bins = chart => marks(chart).filter(m => m.kind === "bin");
  const contours = chart => marks(chart).filter(m => m.kind === "contour");
  const colorOf = (chart, v) => String(chart._colorScaleClass._colorScale(v));
  const luminance = c => {
    const el = document.createElement("div");
    el.style.color = c;
    document.body.appendChild(el);
    const [r, g, b] = getComputedStyle(el).color.match(/\\d+(\\.\\d+)?/g).map(Number);
    el.remove();
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };
`;

/** Runs `body` in the page after the prelude. */
function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] bins count the observations and take the colorScale's colors`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Hexbin().data(arg.data).x("x").y("y").renderer(arg.renderer);
      await done(chart);
      const b = bins(chart);
      return {
        bins: b.map(m => ({count: m.count, value: m.value, fill: m.fill})),
        expected: b.map(m => colorOf(chart, m.value)),
        domain: chart._colorScaleClass._colorScale.domain(),
        scale: chart._paintedScene.root.children.some(n => n.key === "viz-colorScale"),
        widths: b.map(m => Math.round(m.width)),
        bounds: chart._paintedScene.root.children.length &&
          (() => {
            const out = [];
            walk(chart._paintedScene.root.children, n => {
              const meta = n.shapeType === "Hexbin" && n.datum && d3plus.hexbinMeta(n.datum);
              if (meta && meta.kind === "bin") out.push(meta);
            });
            return out.map(m => ({count: m.count, x: [m.x0, m.x1], y: [m.y0, m.y1], rows: m.rows.length}));
          })(),
      };
      `,
      {data: clusters, renderer},
    );
    assert.deepStrictEqual(
      r.bins.map(b => b.count).sort((a, b) => a - b),
      [1, 5, 10],
      "rows without numeric x and y are skipped",
    );
    assert.deepStrictEqual(
      r.bins.map(b => b.value),
      r.bins.map(b => b.count),
    );
    assert.deepStrictEqual(
      r.bins.map(b => b.fill),
      r.expected,
      "each bin is filled with its count's color",
    );
    assert.strictEqual(new Set(r.expected).size, 3, "three colors");
    assert.strictEqual(Math.min(...r.domain), 1);
    assert.strictEqual(Math.max(...r.domain), 10);
    assert.ok(r.scale, "the colorScale is drawn");
    const at = {10: [10, 10], 5: [50, 40], 1: [90, 80]};
    for (const b of r.bounds) {
      const [x, y] = at[b.count];
      assert.ok(b.x[0] < x && x < b.x[1], `x ${x} in ${b.x}`);
      assert.ok(b.y[0] < y && y < b.y[1], `y ${y} in ${b.y}`);
      assert.strictEqual(b.rows, b.count);
    }
    assert.ok(
      r.widths.every(w => w === 21),
      `hexagons are √3 × 12px wide (${r.widths})`,
    );
  });

  it(`[${renderer}] binShape "square" draws binSize squares`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Hexbin().data(arg.data).x("x").y("y")
        .binShape("square").binSize(16).renderer(arg.renderer);
      await done(chart);
      return bins(chart).map(m => ({d: m.d, w: m.width, h: m.height, count: m.count}));
      `,
      {data: clusters, renderer},
    );
    assert.deepStrictEqual(
      r.map(b => b.count).sort((a, b) => a - b),
      [1, 5, 10],
    );
    for (const b of r) {
      assert.ok(/^M[\d.,-]+H[\d.-]+V[\d.-]+H[\d.-]+Z$/.test(b.d), b.d);
      assert.strictEqual(Math.round(b.w), 16);
      assert.strictEqual(Math.round(b.h), 16);
    }
  });

  it(`[${renderer}] contours draw one region per level, colored by level`, async () => {
    const r = await page(
      `
      const auto = new d3plus.Hexbin().data(arg.data).x("x").y("y")
        .binShape(false).contours("filled").contourConfig({thresholds: 4})
        .renderer(arg.renderer);
      await done(auto);
      const filled = contours(auto);
      const levels = filled.map(m => m.value).slice(0, 3);
      const chart = new d3plus.Hexbin().data(arg.data).x("x").y("y")
        .binShape(false).contours(true)
        .contourConfig({thresholds: levels}).renderer(arg.renderer);
      await done(chart);
      const lines = contours(chart);
      const expected = lines.map(m => colorOf(chart, m.value));
      chart.binShape("hex");
      await done(chart);
      return {
        lines: lines.map(m => ({value: m.value, stroke: m.stroke, fillOpacity: m.fillOpacity, interactive: m.interactive})),
        expected,
        bins: bins(chart).length,
        overBins: contours(chart).map(m => m.interactive),
        filled: filled.map(m => ({value: m.value, fillOpacity: m.fillOpacity})),
        levels,
        scale: auto._colorScaleClass._colorScale.domain(),
      };
      `,
      {data: blob, renderer},
    );
    assert.strictEqual(r.levels.length, 3);
    assert.deepStrictEqual(
      r.lines.map(l => l.value),
      r.levels,
      "one region per level given",
    );
    assert.deepStrictEqual(
      r.lines.map(l => l.stroke),
      r.expected,
      "each outline takes its level's color",
    );
    assert.ok(r.lines.every(l => l.interactive && l.fillOpacity === 0));
    assert.ok(
      r.lines.every((l, i) => l.stroke !== r.lines[(i + 1) % 3].stroke),
      "each level has its own color",
    );
    assert.ok(r.filled.length >= 2, `${r.filled.length} filled levels`);
    const opacities = r.filled.map(f => f.fillOpacity);
    assert.deepStrictEqual(
      opacities,
      [...opacities].sort((a, b) => a - b),
      "the fill opacity ramps up by level",
    );
    assert.ok(Math.abs(opacities.at(-1) - 0.8) < 1e-9);
    assert.ok(r.scale.length > 0, "the colorScale spans the levels");
    assert.ok(r.bins > 0);
    assert.ok(
      r.overBins.length === 3 && r.overBins.every(i => i === false),
      "contours over bins leave hover to the bins",
    );
  });

  it(`[${renderer}] the dark theme outlines bins in the background and contours in ink`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Hexbin().data(arg.data).x("x").y("y")
        .contours(true).theme("dark").renderer(arg.renderer);
      await done(chart);
      const light = new d3plus.Hexbin().data(arg.data).x("x").y("y")
        .contours(true).renderer(arg.renderer);
      await done(light);
      return {
        levels: contours(chart).length,
        dark: {bin: luminance(bins(chart)[0].stroke), line: luminance(contours(chart)[0].stroke)},
        light: {bin: luminance(bins(light)[0].stroke), line: luminance(contours(light)[0].stroke)},
      };
      `,
      {data: blob, renderer},
    );
    assert.ok(r.levels > 1, `${r.levels} levels`);
    assert.ok(r.dark.bin < 0.25, `dark bin outline ${r.dark.bin}`);
    assert.ok(r.dark.line > 0.75, `dark contour ink ${r.dark.line}`);
    assert.ok(r.light.bin > 0.9, `light bin outline ${r.light.bin}`);
    assert.ok(r.light.line < 0.4, `light contour ink ${r.light.line}`);
  });

  it(`[${renderer}] zooming bins again and refits the colorScale to the bins in view`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Hexbin().data(arg.data).x("x").y("y")
        .zoom(true).renderer(arg.renderer);
      await done(chart);
      // The densest bin the colorScale reads, its fill, and the top color.
      const view = () => {
        const cs = chart._colorScaleClass;
        const rows = cs._data;
        const top = rows.reduce((a, b) => (d3plus.hexbinValue(b) > d3plus.hexbinValue(a) ? b : a));
        let fill;
        walk(chart._paintedScene.root.children, n => {
          if (n.shapeType === "Hexbin" && n.datum === top) fill = n.paint.fill;
        });
        const domain = cs._colorScale.domain();
        const labels = [];
        walk(chart._paintedScene.root.children.filter(n => n.key === "viz-colorScale"), n => {
          if (n.type === "text") labels.push(n.lines.map(l => l.text).join(" "));
        });
        return {
          max: d3plus.hexbinValue(top),
          fill,
          topColor: String(cs._colorScale(Math.max(...domain))),
          domain,
          labels,
          scale: cs._scaleType,
        };
      };
      const before = bins(chart);
      const unzoomed = view();
      // Let the zoom's transition settle before reading the scene.
      const settle = () => new Promise(res => setTimeout(res, 800));
      document.querySelector("#viz .zoom-in").click();
      document.querySelector("#viz .zoom-in").click();
      await settle();
      const after = bins(chart);
      const zoomed = view();
      document.querySelector("#viz .zoom-reset").click();
      await settle();
      return {
        before: before.length,
        after: after.length,
        widths: after.map(m => Math.round(m.width)),
        views: [unzoomed, zoomed, view()],
        fillsMatch: after.every(m => m.fill === colorOf(chart, m.value)) || JSON.stringify(after.filter(m => m.fill !== colorOf(chart, m.value)).slice(0, 3).map(m => [m.value, m.fill, colorOf(chart, m.value)])),
        reset: bins(chart).length,
      };
      `,
      {data: blob, renderer},
    );
    const [unzoomed, zoomed, reset] = r.views;
    assert.ok(r.after > r.before, `${r.before} bins → ${r.after}`);
    assert.ok(
      r.widths.every(w => w === 21),
      "bins keep their pixel size",
    );
    assert.strictEqual(unzoomed.scale, "linear", "a continuous colorScale");
    assert.ok(zoomed.max < unzoomed.max, "zoomed in, each bin holds fewer");
    assert.notDeepStrictEqual(
      zoomed.domain,
      unzoomed.domain,
      "the colorScale refits to the bins in view",
    );
    assert.strictEqual(Math.max(...zoomed.domain), zoomed.max);
    assert.notDeepStrictEqual(
      zoomed.labels,
      unzoomed.labels,
      "the legend relabels",
    );
    for (const v of [unzoomed, zoomed])
      assert.strictEqual(
        v.fill,
        v.topColor,
        "the densest bin in view takes the top color",
      );
    assert.deepStrictEqual(
      reset.domain,
      unzoomed.domain,
      "reset restores the colorScale",
    );
    assert.ok(
      r.fillsMatch,
      "zoomed bins are filled from the refitted colorScale",
    );
    assert.strictEqual(r.reset, r.before, "reset restores the bins");
  });

  it(`[${renderer}] small multiples bin each panel on one shared colorScale`, async () => {
    const r = await page(
      `
      const rows = arg.data.map((d, i) => ({...d, g: i < 300 ? "dense" : "sparse"}));
      const chart = new d3plus.Hexbin().data(rows).x("x").y("y").facet("g")
        .renderer(arg.renderer);
      await done(chart);
      const panels = chart._facetPanels.map(p => p.scene);
      const perPanel = panels.map(scene => {
        const out = [];
        walk(scene, n => {
          if (n.shapeType === "Hexbin" && n.datum) out.push(d3plus.hexbinMeta(n.datum).count);
        });
        return out;
      });
      return {
        totals: perPanel.map(p => p.reduce((s, c) => s + c, 0)),
        maxes: perPanel.map(p => Math.max(...p)),
        scaleMax: Math.max(...chart._colorScaleClass._data.map(d3plus.hexbinValue)),
      };
      `,
      {data: blob, renderer},
    );
    assert.deepStrictEqual(r.totals, [300, 100]);
    assert.ok(r.maxes[0] > r.maxes[1]);
    assert.strictEqual(
      r.scaleMax,
      Math.max(...r.maxes),
      "the colorScale reaches the densest panel's bins",
    );
  });
}

/** Draws the clusters in a fresh page and finds the 10-observation bin's center. */
const drawClusters = ([data, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Hexbin()
      .data(data)
      .x("x")
      .y("y")
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    window.__viz = viz;
    viz.render(() => {
      const host =
        document.querySelector("#viz svg") ||
        document.querySelector("#viz canvas");
      const rect = host.getBoundingClientRect();
      let center;
      const walk = (nodes, ox, oy) =>
        nodes.forEach(n => {
          const t = n.transform || {};
          const x = ox + (t.x || 0),
            y = oy + (t.y || 0);
          if (n.shapeType === "Hexbin" && n.type === "path" && n.datum) {
            const meta = window.d3plus.hexbinMeta(n.datum);
            if (meta.count === 10) {
              const pts = n.d
                .match(/-?[\d.]+,-?[\d.]+/g)
                .map(p => p.split(",").map(Number));
              center = [
                rect.left + x + pts.reduce((s, p) => s + p[0], 0) / pts.length,
                rect.top + y + pts.reduce((s, p) => s + p[1], 0) / pts.length,
              ];
            }
          }
          if (n.children) walk(n.children, x, y);
        });
      walk(viz._paintedScene.root.children, 0, 0);
      resolve(center);
    });
  });

/** The visible tooltip's text, and how many of the painted bins are hovered. */
const hoverState = () => {
  const tips = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent);
  const viz = window.__viz;
  const hovered = [];
  const walk = nodes =>
    nodes.forEach(n => {
      if (n.shapeType === "Hexbin" && n.datum && viz._hover?.(n.datum, 0))
        hovered.push(window.d3plus.hexbinMeta(n.datum).count);
      if (n.children) walk(n.children);
    });
  walk(viz._paintedScene.root.children);
  return {tips, hovered};
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] hovering a bin shows its count and ranges and highlights it`, async () => {
    await withPage(box, async p => {
      const center = await p.evaluate(drawClusters, [clusters, renderer]);
      assert.ok(center, "the 10-observation bin is drawn");
      await p.mouse.move(center[0] - 3, center[1] - 3);
      await p.mouse.move(...center, {steps: 3});
      await p.waitForTimeout(150);
      const {tips, hovered} = await p.evaluate(hoverState);
      assert.ok(
        tips.some(t => t.includes("Count: 10") && /x\s*\d/.test(t)),
        `the tooltip reads the count and ranges (got ${JSON.stringify(tips)})`,
      );
      assert.deepStrictEqual(hovered, [10], "only that bin is hovered");
    });
  });

  it(`[${renderer}] keyboard focus reaches the bins`, async () => {
    const r = await render(
      box,
      async ([data, renderer]) => {
        const viz = new window.d3plus.Hexbin()
          .data(data)
          .x("x")
          .y("y")
          .points(true)
          .contours(true)
          .contourConfig({thresholds: [3]})
          .renderer(renderer)
          .duration(0)
          .select("#viz");
        await new Promise(res => viz.render(res));
        const wait = () =>
          new Promise(res => requestAnimationFrame(() => setTimeout(res, 40)));
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const focused = [];
        host.focus();
        await wait();
        for (let i = 0; i < 3; i++) {
          const target = viz._keyboardNav.current;
          focused.push({
            id: target,
            live: host.querySelector("[aria-live]").textContent,
          });
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}),
          );
          await wait();
        }
        const tip = document.querySelector(".d3plus-tooltip");
        return {focused, tooltip: tip ? tip.textContent : null};
      },
      [clusters, renderer],
    );
    assert.strictEqual(r.focused.length, 3);
    assert.ok(
      r.focused.every(f => /bin-/.test(f.id)),
      `focus moves between bins (got ${r.focused.map(f => f.id)})`,
    );
    assert.strictEqual(new Set(r.focused.map(f => f.id)).size, 3);
    assert.ok(
      r.focused.every(f => /Count: \d+/.test(f.live)),
      "each bin is announced with its count",
    );
    assert.ok(/Count/.test(r.tooltip));
  });
}
