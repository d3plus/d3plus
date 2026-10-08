/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {rgb} from "d3-color";
import {render, closeBrowser} from "../playwright.js";

/**
    Pyramid in real Chromium: two sides mirrored about one center line, a
    value axis that reads magnitudes, side titles, sub-groups stacked per
    side, comparison outlines, positive tooltips, timeline frames, zoom, and
    the Canvas backend.
*/

after(closeBrowser);

const bands = ["0-9", "10-19", "20-29", "30-39"];
const rows = bands.flatMap((age, b) => [
  {age, sex: "Male", pop: 1000 - b * 200, before: 900 - b * 100, year: 2020},
  {age, sex: "Female", pop: 1100 - b * 200, before: 950 - b * 100, year: 2020},
]);
const years = [
  ...rows.map(d => ({...d, year: 2010, pop: d.pop / 2})),
  ...rows,
];
const stacked = rows.flatMap(d => [
  {...d, area: "Urban", pop: d.pop * 0.7},
  {...d, area: "Rural", pop: d.pop * 0.3},
]);

/**
    Renders a Pyramid configured by `config` (plus optional method calls) into
    #viz and measures it in client pixels.
*/
const probe = ([data, config, year]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Pyramid()
      .data(data)
      .groupBy("sex")
      .y("age")
      .x("pop")
      .duration(0)
      .detectVisible(false)
      .config(config)
      .select("#viz");
    if (year) viz.timeFilter(d => d.year === year);
    viz.render(() => {
      const host = document.querySelector("#viz");
      const svg = host.querySelector("svg.d3plus-render-svg");
      const box = el => {
        const b = el.getBoundingClientRect();
        return {left: b.left, right: b.right, top: b.top, bottom: b.bottom, cx: (b.left + b.right) / 2, cy: (b.top + b.bottom) / 2};
      };
      const origin = host.getBoundingClientRect();
      const ct = viz._chartTransform || {x: 0, y: 0};
      const area = viz._plotArea;
      resolve({
        canvas: !!host.querySelector("canvas.d3plus-render-canvas"),
        center: origin.left + ct.x + viz._xFunc(0),
        plot: area ? {left: origin.left + ct.x + area.x, right: origin.left + ct.x + area.x + area.width, top: origin.top + ct.y} : null,
        bars: svg
          ? Array.from(svg.querySelectorAll("[data-key='plot-zoom-content'] rect.d3plus-render-rect"))
            .filter(r => r.getAttribute("data-key").includes("_"))
            .map(r => ({key: r.getAttribute("data-key"), fill: r.getAttribute("fill"), ...box(r)}))
          : [],
        xTicks: svg ? Array.from(svg.querySelectorAll("[data-key='plot-x-axis'] text")).map(t => t.textContent) : [],
        yTicks: svg ? Array.from(svg.querySelectorAll("[data-key='plot-y-axis'] text")).map(t => t.textContent) : [],
        titles: svg ? Array.from(svg.querySelectorAll("[data-key='pyramid-side-titles'] text")).map(t => ({text: t.textContent, ...box(t)})) : [],
        outlines: svg ? Array.from(svg.querySelectorAll("[data-key^='pyramid-comparison']")).map(n => ({key: n.getAttribute("data-key"), events: n.getAttribute("pointer-events"), dash: n.getAttribute("stroke-dasharray")})) : [],
        domain: viz._xAxis._d3Scale.domain(),
        sides: viz.ctx.pyramid.sides,
      });
    });
  });

const body = '<div id="viz" style="width:700px;height:420px;font-family:sans-serif;"></div>';
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

it("Pyramid mirrors two sides about the center line", async function () {
  this.timeout(60000);
  const out = await render(body, probe, [rows, {}]);
  const male = out.bars.filter(b => b.key.startsWith("Male"));
  const female = out.bars.filter(b => b.key.startsWith("Female"));
  assert.strictEqual(male.length, 4);
  assert.strictEqual(female.length, 4);
  male.forEach(b => assert.ok(near(b.right, out.center), `${b.key} ends at the center`));
  female.forEach(b => assert.ok(near(b.left, out.center), `${b.key} starts at the center`));
  male.forEach(m => {
    const f = female.find(b => b.key.endsWith(m.key.slice(5)));
    assert.ok(near(m.cy, f.cy), `${m.key} shares its row`);
  });
  assert.ok(near(out.center, (out.plot.left + out.plot.right) / 2, 2), "the axis is symmetric about zero");
  const width = b => b.right - b.left;
  const m0 = male.find(b => b.key === "Male_0-9");
  const f0 = female.find(b => b.key === "Female_0-9");
  assert.ok(near(width(f0) / width(m0), 1.1, 0.02), "both halves share one scale");
  const top = Math.min(...out.bars.map(b => b.top));
  assert.ok(male.find(b => b.key === "Male_30-39").top - top < 1, "the last category sits on top");
});

it("Pyramid's value axis reads magnitudes on both halves", async function () {
  this.timeout(60000);
  const out = await render(body, probe, [rows, {}]);
  assert.ok(out.xTicks.length >= 5, `ticks: ${out.xTicks}`);
  assert.ok(out.xTicks.every(t => !/[-−]/.test(t)), `no minus signs: ${out.xTicks}`);
  assert.ok(out.xTicks.includes("0"));
  const numbers = out.xTicks.filter(t => /\d/.test(t) && t !== "0");
  const unique = new Set(numbers);
  assert.ok(numbers.length === unique.size * 2, `each magnitude appears once per side: ${numbers}`);
  assert.ok(near(out.domain[0], -out.domain[1], 1e-9), `symmetric domain ${out.domain}`);
  assert.deepStrictEqual(out.yTicks, ["30-39", "20-29", "10-19", "0-9"]);
});

it("Pyramid titles each half with its side", async function () {
  this.timeout(60000);
  const out = await render(body, probe, [rows, {}]);
  assert.deepStrictEqual(out.titles.map(t => t.text), ["Male", "Female"]);
  const [male, female] = out.titles;
  assert.ok(near(male.cx, (out.plot.left + out.center) / 2, 3), "Male centered over the left half");
  assert.ok(near(female.cx, (out.center + out.plot.right) / 2, 3), "Female centered over the right half");
  const top = Math.min(...out.bars.map(b => b.top));
  assert.ok(male.bottom <= top + 1, "titles sit above the bars");

  const flipped = await render(body, probe, [rows, {sides: ["Female", "Male"]}]);
  assert.deepStrictEqual(flipped.titles.map(t => t.text), ["Female", "Male"]);
  assert.ok(flipped.bars.filter(b => b.key.startsWith("Female")).every(b => near(b.right, flipped.center)), "Female on the left");

  const none = await render(body, probe, [rows, {sideTitles: false}]);
  assert.strictEqual(none.titles.length, 0);
  assert.ok(Math.min(...none.bars.map(b => b.top)) < top, "no room is reserved without titles");
});

it("Pyramid stacks sub-groups outward from the center on both sides", async function () {
  this.timeout(60000);
  const out = await render(body, probe, [stacked, {groupBy: ["sex", "area"]}]);
  assert.strictEqual(out.bars.length, 16);
  const bar = key => out.bars.find(b => b.key === key);
  bands.forEach(age => {
    const mu = bar(`Male_Urban_${age}`), mr = bar(`Male_Rural_${age}`);
    const fu = bar(`Female_Urban_${age}`), fr = bar(`Female_Rural_${age}`);
    assert.ok(near(mu.right, out.center) && near(mr.right, mu.left), `${age}: Male urban then rural, leftward`);
    assert.ok(near(fu.left, out.center) && near(fr.left, fu.right), `${age}: Female urban then rural, rightward`);
    assert.strictEqual(mu.fill, fu.fill, "a sub-group shares its color across sides");
    assert.notStrictEqual(mu.fill, mr.fill);
  });
  assert.deepStrictEqual(out.titles.map(t => t.text), ["Male", "Female"], "titles name the sides, not the sub-groups");
});

it("Pyramid draws a comparison outline and fits the axis to it", async function () {
  this.timeout(60000);
  const bigger = rows.map(d => ({...d, before: d.age === "0-9" ? 3000 : d.before}));
  const out = await render(body, probe, [bigger, {comparison: "before"}]);
  assert.deepStrictEqual(out.outlines.map(o => o.key), ["pyramid-comparison-0", "pyramid-comparison-1"]);
  out.outlines.forEach(o => assert.strictEqual(o.events, "none", "outlines are not interactive"));
  assert.ok(out.outlines[0].dash, "dashed by default");
  assert.ok(out.domain[1] >= 3000 && near(out.domain[0], -out.domain[1], 1e-9), `domain fits the outline: ${out.domain}`);
});

it("Pyramid percent mode reads percentages on the axis", async function () {
  this.timeout(60000);
  const out = await render(body, probe, [rows, {percent: true}]);
  const numbers = out.xTicks.filter(t => /\d/.test(t));
  assert.ok(numbers.every(t => t.endsWith("%")), `percent ticks: ${out.xTicks}`);
  assert.ok(out.xTicks.every(t => !/[-−]/.test(t)));
  assert.ok(out.xTicks.includes("Percent of Total"), "titled as a share");
  assert.ok(out.domain[1] < 1);
});

it("Pyramid keeps its axis across timeline frames with axisPersist", async function () {
  this.timeout(60000);
  const latest = await render(body, probe, [years, {time: "year", axisPersist: true}]);
  const first = await render(body, probe, [years, {time: "year", axisPersist: true}, 2010]);
  assert.deepStrictEqual(first.domain, latest.domain, "one axis for every year");
  const width = (out, key) => {
    const b = out.bars.find(r => r.key === key);
    return b.right - b.left;
  };
  assert.ok(near(width(first, "Male_0-9") * 2, width(latest, "Male_0-9"), 2), "2010 bars are half of 2020's");
  const fitted = await render(body, probe, [years, {time: "year"}, 2010]);
  assert.ok(fitted.domain[1] < latest.domain[1], "without axisPersist each frame fits itself");
});

it("Pyramid tooltips show positive values for both sides", async function () {
  this.timeout(60000);
  const tooltip = ([data, config, key]) =>
    new Promise(resolve => {
      const viz = new window.d3plus.Pyramid()
        .data(data).groupBy("sex").y("age").x("pop").duration(0).config(config).select("#viz");
      viz.render(() => {
        const svg = document.querySelector("#viz svg.d3plus-render-svg");
        const bar = svg.querySelector(`[data-key='${key}']`);
        const b = bar.getBoundingClientRect();
        bar.dispatchEvent(new MouseEvent("mousemove", {clientX: b.left + b.width / 2, clientY: b.top + b.height / 2, bubbles: true}));
        requestAnimationFrame(() => setTimeout(() => {
          const tip = document.querySelector(".d3plus-tooltip");
          resolve(tip ? Array.from(tip.querySelectorAll("tr")).map(tr => tr.textContent.trim()) : []);
        }, 50));
      });
    });
  const single = await render(body, tooltip, [rows, {tooltipShared: false, comparison: "before"}, "Male_0-9"]);
  assert.ok(single.some(r => r === "pop1k"), `value row: ${single}`);
  assert.ok(single.some(r => /^Percent of Total\d/.test(r)), `share row: ${single}`);
  assert.ok(single.some(r => r === "before900"), `comparison row: ${single}`);
  assert.ok(single.every(r => !/^(pop|Percent of Total|before)[-−]/.test(r)), `no negative values: ${single}`);
  const shared = await render(body, tooltip, [rows, {}, "Male_0-9"]);
  assert.ok(shared.some(r => /Male\s*1k/.test(r)) && shared.some(r => /Female\s*1\.1k/.test(r)), `both sides listed: ${shared}`);
  assert.ok(shared.every(r => !/^(Male|Female)\s*[-−]/.test(r)), `no negative values: ${shared}`);
});

it("Pyramid hides a side from the legend without moving the other", async function () {
  this.timeout(60000);
  const hidden = await render(body, ([data]) => new Promise(resolve => {
    const viz = new window.d3plus.Pyramid().data(data).groupBy("sex").y("age").x("pop").duration(0).select("#viz");
    viz._hidden = ["Male"];
    viz.render(() => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      const center = document.querySelector("#viz").getBoundingClientRect().left + viz._chartTransform.x + viz._xFunc(0);
      const bars = Array.from(svg.querySelectorAll("[data-key='plot-zoom-content'] rect.d3plus-render-rect"))
        .filter(r => r.getAttribute("data-key").includes("_"))
        .map(r => ({key: r.getAttribute("data-key"), left: r.getBoundingClientRect().left}));
      const titles = Array.from(svg.querySelectorAll("[data-key='pyramid-side-titles'] text")).map(t => t.textContent);
      resolve({bars, center, titles});
    });
  }), [rows]);
  assert.strictEqual(hidden.bars.length, 4);
  assert.ok(hidden.bars.every(b => b.key.startsWith("Female") && Math.abs(b.left - hidden.center) < 1.5), "Female stays right of center");
  assert.deepStrictEqual(hidden.titles, ["Male", "Female"]);
});

it("Pyramid zooms its value axis", async function () {
  this.timeout(60000);
  const out = await render(body, ([data]) => new Promise(resolve => {
    const viz = new window.d3plus.Pyramid().data(data).groupBy("sex").y("age").x("pop").duration(0).select("#viz");
    viz.render(() => {
      const before = viz._xAxis._d3Scale.domain();
      viz._zoomRescale({k: 2, x: -viz._chartTransform.x - viz._plotArea.width / 2, y: 0});
      const after = viz._xAxis._d3Scale.domain();
      const scene = viz.toScene();
      const keys = [];
      const walk = n => {
        keys.push(n.key);
        (n.children || []).forEach(walk);
      };
      walk(scene.root);
      resolve({before, after, titles: keys.includes("pyramid-side-titles")});
    });
  }), [rows]);
  assert.ok(out.after[1] - out.after[0] < (out.before[1] - out.before[0]) * 0.75, `zoomed ${out.before} → ${out.after}`);
  assert.ok(out.titles, "side titles survive a zoom repaint");
});

it("Pyramid paints on the Canvas backend", async function () {
  this.timeout(60000);
  const out = await render(body, ([data]) => new Promise(resolve => {
    const viz = new window.d3plus.Pyramid()
      .data(data).groupBy(["sex", "area"]).y("age").x("pop").comparison("before")
      .renderer("canvas").duration(0).select("#viz");
    viz.render(() => {
      const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
      if (!canvas) return resolve({canvas: false});
      const ctx = canvas.getContext("2d");
      const {width, height} = canvas;
      const px = ctx.getImageData(0, 0, width, height).data;
      const colors = new Set();
      let painted = 0;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 250 || (px[i] > 245 && px[i + 1] > 245 && px[i + 2] > 245)) continue;
        painted++;
        colors.add(`${px[i] >> 4}_${px[i + 1] >> 4}_${px[i + 2] >> 4}`);
      }
      // Sample the pixel just inside each side of the center line.
      const dpr = width / canvas.getBoundingClientRect().width;
      const ct = viz._chartTransform;
      const y = Math.round((ct.y + viz._yFunc("0-9")) * dpr);
      const sample = dx => {
        const x = Math.round((ct.x + viz._xFunc(0) + dx) * dpr);
        const p = ctx.getImageData(x, y, 1, 1).data;
        return `${p[0]},${p[1]},${p[2]}`;
      };
      resolve({canvas: true, painted, colors: colors.size, left: sample(-4), right: sample(4)});
    });
  }), [stacked]);
  assert.ok(out.canvas, "a <canvas> is mounted");
  assert.ok(out.painted > 5000, `painted ${out.painted}px`);
  assert.ok(out.colors >= 3, `${out.colors} colors`);
  assert.strictEqual(out.left, out.right, "the same sub-group paints both sides of the center");
});

/** Renders a Pyramid with `config` and reports its value axis break state, domain, ticks, and ink. */
const axisProbe = ([data, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Pyramid()
      .data(data).groupBy("sex").y("age").x("pop").duration(0).config(config).select("#viz");
    viz.render(() => {
      const fills = {};
      const walk = (n, group) => {
        const g = n.key === "pyramid-side-titles" || n.key === "plot-x-axis" ? n.key : group;
        if (n.type === "text" && g) (fills[g] = fills[g] || []).push(n.paint && n.paint.fill);
        (n.children || []).forEach(c => walk(c, g));
      };
      walk(viz.toScene().root);
      const axis = viz._xAxis;
      resolve({
        brk: !!axis._baselineBreak,
        domain: axis._d3Scale.domain(),
        zero: axis._getPosition(0),
        range: axis._getRange(),
        ticks: Array.from(document.querySelectorAll("#viz [data-key='plot-x-axis'] text")).map(t => t.textContent),
        fills,
      });
    });
  });

it("Pyramid never breaks its value axis away from zero", async function () {
  this.timeout(60000);
  // Values far from zero would break a BarChart's baseline.
  const far = rows.map(d => ({...d, pop: d.pop + 5000}));
  for (const config of [{}, {percent: true}, {baselineBreak: true}, {baselineBreak: true, percent: true}, {symmetric: false, baselineBreak: true}]) {
    const out = await render(body, axisProbe, [far, config]);
    assert.strictEqual(out.brk, false, `no break: ${JSON.stringify(config)}`);
    assert.ok(out.domain[0] < 0 && out.domain[1] > 0, `domain spans zero: ${out.domain}`);
    assert.ok(out.zero > out.range[0] && out.zero < out.range[1], "zero sits inside the axis");
  }
});

it("Pyramid's end labels read as magnitudes on both ends", async function () {
  this.timeout(60000);
  const out = await render(body, axisProbe, [rows, {}]);
  const numbers = out.ticks.filter(t => /\d/.test(t));
  assert.strictEqual(numbers[0], numbers[numbers.length - 1], `matching ends: ${out.ticks}`);
  assert.ok(numbers.includes("0"));
});

it("Pyramid's side titles and axis read on a dark background", async function () {
  this.timeout(60000);
  const lightness = c => {
    const {r, g, b} = rgb(c);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const dark = '<div id="viz" style="width:700px;height:420px;background:#111"></div>';
  const out = await render(dark, axisProbe, [rows, {}]);
  for (const key of ["pyramid-side-titles", "plot-x-axis"]) {
    assert.ok(out.fills[key] && out.fills[key].length, `${key} has text`);
    out.fills[key].forEach(f => assert.ok(lightness(f) > 0.5, `${key} ${f} reads on dark`));
  }
  const light = await render(body, axisProbe, [rows, {}]);
  light.fills["pyramid-side-titles"].forEach(f => assert.ok(lightness(f) < 0.5, `side title ${f} reads on white`));
});
