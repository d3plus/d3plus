/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Ridgeline in a real browser: one density curve per group rising from its
    category's baseline down the y axis, first group on top, ridges overlapping
    by `overlap`, ordered by `medianSort`, with tooltips on both backends,
    legend hover, and small multiples.
*/

after(async () => {
  await closeBrowser();
});

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  let s = 5;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const normal = () => Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
  window.__rows = () => {
    s = 5;
    const groups = [["low", 2, 0.5], ["mid", 5, 1], ["high", 8, 0.5]];
    return groups.flatMap(([id, mean, sd], g) =>
      Array.from({length: 30 + g * 10}, (_, i) => ({id, side: i % 2 ? "L" : "R", f: i % 2 ? "one" : "two", v: mean + sd * normal()})),
    );
  };
  // Bounding boxes of the density areas, keyed by group.
  window.__areas = el =>
    Object.fromEntries(
      Array.from(el.querySelectorAll("path[data-key^='density-']"))
        .map(p => {
          const b = p.getBoundingClientRect();
          return [p.getAttribute("data-key").slice(8), {left: b.left, right: b.right, top: b.top, bottom: b.bottom, cx: (b.left + b.right) / 2, cy: (b.top + b.bottom) / 2}];
        }),
    );
  window.__ticks = (el, axis) =>
    Object.fromEntries(
      Array.from(el.querySelectorAll(`[data-key='plot-${axis}-axis'] text, g[data-key^='plot-${axis}'] text`)).map(t => {
        const b = t.getBoundingClientRect();
        return [t.textContent, {x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2}];
      }),
    );
  window.__nan = el =>
    Array.from(el.querySelectorAll("*")).filter(n =>
      Array.from(n.attributes).some(a => a.value.includes("NaN")),
    ).length;
  window.__z = 0;
  window.__draw = (configure, size = [800, 500]) =>
    new Promise(resolve => {
      const el = document.createElement("div");
      // Every chart sits in the viewport, the newest on top.
      el.style.cssText = `position:absolute;top:0;left:0;background:#fff;z-index:${++window.__z};width:${size[0]}px;height:${size[1]}px`;
      document.body.appendChild(el);
      const viz = new window.d3plus.Ridgeline()
        .select(el)
        .detectVisible(false)
        .duration(0)
        .width(size[0])
        .height(size[1]);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  // The text of the tooltip a hover filled in (each chart has its own).
  window.__hover = async (target, x, y) => {
    const tips = () => Array.from(document.querySelectorAll(".d3plus-tooltip"));
    const text = t => t.innerText.replace(/\s+/g, " ").trim();
    const before = new Map(tips().map(t => [t, text(t)]));
    target.dispatchEvent(new MouseEvent("mousemove", {clientX: x, clientY: y, bubbles: true}));
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));
    const tip = tips().reverse().find(t => text(t) && before.get(t) !== text(t));
    return tip ? text(tip) : "";
  };
};

const run = fn => render("", new Function(`return (${helpers})(), (${fn})();`));

it("Ridgeline stacks one ridge per group, first on top, rising from its baseline", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const {el, viz} = await window.__draw(v => v.data(window.__rows()).groupBy("id").value("v"));
    const ys = ["low", "mid", "high"].map(id => viz._yAxis._getPosition(id));
    const top = viz._yAxis._d3Scale.range()[0];
    return {
      areas: window.__areas(el),
      ticks: window.__ticks(el, "y"),
      nan: window.__nan(el),
      ys,
      top,
      step: Math.abs(ys[1] - ys[0]),
      xTitle: viz._xConfig.title,
      xDomain: viz._xAxis._d3Scale.domain(),
      svgTop: el.querySelector("svg").getBoundingClientRect().top,
    };
  });
  assert.strictEqual(out.nan, 0, "no NaN attributes");
  assert.deepStrictEqual(Object.keys(out.areas).sort(), ["high", "low", "mid"]);
  assert.ok(out.ticks.low.y < out.ticks.mid.y && out.ticks.mid.y < out.ticks.high.y, "first group on top");
  ["low", "mid", "high"].forEach(id => {
    const a = out.areas[id];
    assert.ok(Math.abs(a.bottom - out.ticks[id].y) < 2, `${id} rests on its baseline`);
    assert.ok(a.bottom - a.top <= 1.5 * out.step + 1, `${id} rises at most overlap × step`);
  });
  const tallest = Math.max(...Object.values(out.areas).map(a => a.bottom - a.top));
  assert.ok(Math.abs(tallest - 1.5 * out.step) < 2, "the tallest ridge rises exactly overlap × step");
  assert.ok(out.ys[0] - out.top >= 1.5 * out.step - 1, "headroom above the first baseline for its ridge");
  assert.ok(out.areas.high.cx > out.areas.low.cx, "values run along x");
  assert.ok(out.xDomain[0] < 0.5 && out.xDomain[1] > 9.5, "x axis covers every tail");
  assert.strictEqual(out.xTitle, "v");
});

it("Ridgeline: overlap sets ridge height, densityScale width equalizes peaks", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const heights = async configure => {
      const {el, viz} = await window.__draw(v => configure(v.data(window.__rows()).groupBy("id").value("v")));
      const step = Math.abs(viz._yAxis._getPosition("mid") - viz._yAxis._getPosition("low"));
      const areas = window.__areas(el);
      return {step, h: Object.fromEntries(Object.entries(areas).map(([k, a]) => [k, a.bottom - a.top]))};
    };
    return {
      low: await heights(v => v.overlap(0.5)),
      width: await heights(v => v.densityScale("width")),
      flat: await heights(v => v.overlap(0)),
    };
  });
  const tallest = Math.max(...Object.values(out.low.h));
  assert.ok(Math.abs(tallest - 0.5 * out.low.step) < 2, "overlap 0.5 rises half a step");
  Object.values(out.width.h).forEach(h => assert.ok(Math.abs(h - 1.5 * out.width.step) < 2, "every ridge reaches full height"));
  Object.values(out.flat.h).forEach(h => assert.ok(h < 2, "overlap 0 flattens the ridges"));
});

it("Ridgeline orders ridges by median", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const order = async sort => {
      const {el} = await window.__draw(v => v.data(window.__rows()).groupBy("id").value("v").medianSort(sort));
      const ticks = window.__ticks(el, "y");
      return Object.entries(ticks).sort((a, b) => a[1].y - b[1].y).map(([k]) => k);
    };
    return {data: await order(false), asc: await order("ascending"), desc: await order("descending")};
  });
  assert.deepStrictEqual(out.data, ["low", "mid", "high"]);
  assert.deepStrictEqual(out.asc, ["low", "mid", "high"]);
  assert.deepStrictEqual(out.desc, ["high", "mid", "low"]);
});

it("Ridgeline tooltips on SVG and Canvas, and legend hover dims the others", async function () {
  this.timeout(60000);
  // One chart per page: a page's charts would share their tooltip elements.
  const probe = configure =>
    run(new Function(`return (async () => {
      const config = v => (${configure})(v.data(window.__rows()).groupBy("id").value("v"));
      const svg = await window.__draw(v => config(v).renderer("svg"));
      const a = window.__areas(svg.el).mid;
      const rect = svg.el.getBoundingClientRect();
      // A point inside the mid ridge, just above its baseline.
      const x = a.cx - rect.left, y = a.bottom - 3 - rect.top;
      svg.el.remove();
      const {el, viz} = await window.__draw(config);
      const target = viz.renderer() === "canvas"
        ? el.querySelector("canvas.d3plus-render-canvas")
        : el.querySelector("path[data-key='density-mid']");
      const box = el.getBoundingClientRect();
      const tip = await window.__hover(target, box.left + x, box.top + y);
      viz.hover(d => d.id === "mid");
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));
      const opacity = id => {
        const n = el.querySelector("path[data-key='density-" + id + "']");
        return n ? Number(n.getAttribute("opacity") ?? 1) : null;
      };
      return {tip, mid: opacity("mid"), low: opacity("low")};
    })()`));
  const svg = await probe("v => v");
  const canvas = await probe("v => v.renderer('canvas')");
  for (const tip of [svg.tip, canvas.tip]) {
    assert.ok(tip.startsWith("mid"), `titled by the group: ${tip}`);
    ["Observations 40", "Maximum", "Median", "Minimum"].forEach(label => assert.ok(tip.includes(label), `${label}: ${tip}`));
  }
  assert.ok(svg.low < svg.mid, `other ridges dim (${svg.low} vs ${svg.mid})`);
});

it("Ridgeline overlaps two groupBy levels in one row and draws small multiples", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const nested = await window.__draw(v => v.data(window.__rows()).groupBy(["id", "side"]).value("v"));
    const faceted = await window.__draw(v => v.data(window.__rows()).groupBy("id").value("v").facet("f"), [900, 400]);
    return {
      nested: window.__areas(nested.el),
      ticks: window.__ticks(nested.el, "y"),
      panels: (faceted.viz._facetPanels || []).length,
      facetAreas: faceted.el.querySelectorAll("path[data-key*='density-']").length,
      nan: window.__nan(nested.el) + window.__nan(faceted.el),
    };
  });
  assert.strictEqual(Object.keys(out.nested).length, 6);
  assert.deepStrictEqual(Object.keys(out.ticks).sort(), ["high", "low", "mid"], "one row per first-level group");
  assert.ok(Math.abs(out.nested.low_L.bottom - out.nested.low_R.bottom) < 1, "both series share the row's baseline");
  assert.strictEqual(out.panels, 2);
  assert.ok(out.facetAreas >= 6, `a ridge per group per panel (${out.facetAreas})`);
  assert.strictEqual(out.nan, 0);
});
