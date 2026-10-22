/* global getComputedStyle, MutationObserver, requestAnimationFrame */
import {it} from "vitest";
import {commands} from "vitest/browser";
import assert from "~test/browser/assert.js";
import {loadD3plus, pageErrors, resetPage} from "~test/browser/render.js";

/**
    Candlestick hover in a real browser, on both renderers, with real pointer
    moves: hovering a period, through the plot's snapped hover or directly
    over its candle, keeps that candle and its volume bar bright with an
    emphasized stroke and dims every other period, while a legend swatch
    still highlights its whole series; and the snapped tooltip never shows
    its arrow, even while the pointer crosses onto a candle.
*/

/** Draws a Candlestick from `config`; resolves when it renders. */
const draw = ([config, renderer]) =>
  new Promise(resolve => {
    const rows = [];
    let s = 7;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (const symbol of config.symbols) {
      let close = 100;
      const day = new Date(2024, 0, 1);
      for (let n = 0; n < 16; day.setDate(day.getDate() + 1)) {
        if (!(day.getDay() % 6)) continue;
        const open = close * (1 + (rand() - 0.5) * 0.02);
        close = open * (1 + (rand() - 0.5) * 0.04);
        const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
        rows.push({
          symbol,
          date,
          open,
          close,
          high: Math.max(open, close) * 1.01,
          low: Math.min(open, close) * 0.99,
          volume: 1e6 * (1 + rand()),
        });
        n++;
      }
    }
    const el = document.querySelector("#viz");
    const viz = new window.d3plus.Candlestick()
      .data(rows)
      .groupBy("symbol")
      .config(config.config || {})
      .renderer(renderer)
      .width(600)
      .height(400)
      .duration(0)
      .select(el);
    window.__viz = viz;
    viz.render(() => resolve());
  });

/**
    Every period's marks in the painted scene, keyed by scene key: client
    position (its snap point, and its hover target's top and middle), opacity
    (with its groups'), and stroke width; each legend swatch's client center;
    and whether any axis node dims.
*/
const marks = () => {
  const viz = window.__viz;
  const host =
    document.querySelector("#viz svg") || document.querySelector("#viz canvas");
  const box = host.getBoundingClientRect();
  const out = {};
  const hits = {};
  const legend = [];
  let axisDims = false;
  const walk = (n, x, y, inherited, axis, inLegend) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    const opacity =
      inherited *
      (n.paint && typeof n.paint.opacity === "number" ? n.paint.opacity : 1);
    const inAxis = axis || n.interactionGroup === "axis";
    if (inAxis && opacity < 1) axisDims = true;
    const key = String(n.key);
    const swatches = inLegend || n.interactionGroup === "legend";
    if (swatches && n.type === "rect" && n.datum)
      legend.push({
        x: box.left + nx + n.x + n.width / 2,
        y: box.top + ny + n.y + n.height / 2,
      });
    if (n.shapeType === "Candlestick" && key.endsWith("::hit"))
      hits[key.slice(0, -5)] = {
        top: box.top + ny + n.y,
        middle: box.top + ny + n.y + n.height / 2,
      };
    else if (
      n.shapeType === "Candlestick" &&
      n.type === "path" &&
      n.interactionPoints
    ) {
      const p = n.interactionPoints[0];
      out[key] = {
        x: box.left + nx + p.x,
        y: box.top + ny + p.y,
        opacity,
        strokeWidth: n.paint.strokeWidth,
      };
    }
    (n.children || []).forEach(c => walk(c, nx, ny, opacity, inAxis, swatches));
  };
  walk(viz._paintedScene.root, 0, 0, 1, false, false);
  Object.keys(out).forEach(k => Object.assign(out[k], hits[k] || {}));
  return {
    marks: out,
    legend,
    axisDims,
    hovered: typeof viz._hover === "function",
  };
};

/**
    Draws `config`, moves the pointer onto `target` (an index into the drawn
    candles; with `beside`, right of and above it, in the plot's snapped
    hover; else through its hover target's middle), and reports the marks
    before and after, the hovered candle's key, and how often a tooltip arrow
    showed while the pointer moved, sampled every frame and on every DOM
    change. With `legend`, the pointer moves onto the first legend swatch
    instead.
*/
async function hover(
  config,
  renderer,
  {target = 6, beside = false, legend = false} = {},
) {
  await loadD3plus();
  resetPage("<div id='viz' style='width:600px;height:400px'></div>");
  await draw(JSON.parse(JSON.stringify([config, renderer])));
  const before = marks();
  const keys = Object.keys(before.marks).filter(k => !k.endsWith("_volume"));
  const key = keys[target];
  const m = before.marks[key];
  // Beside: a third of the way to the next period, still nearest this one.
  const dx = beside ? (before.marks[keys[target + 1]].x - m.x) / 3 : 0;
  let arrows = 0,
    watching = true;
  const check = () =>
    document.querySelectorAll(".d3plus-tooltip").forEach(tip => {
      const arrow = tip.querySelector(".d3plus-tooltip-arrow");
      const style = getComputedStyle(tip);
      if (
        arrow &&
        getComputedStyle(arrow).display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0
      )
        arrows++;
    });
  const frame = () => {
    if (!watching) return;
    check();
    requestAnimationFrame(frame);
  };
  frame();
  const observer = new MutationObserver(check);
  observer.observe(document.body, {
    subtree: true,
    attributes: true,
    childList: true,
  });
  try {
    if (legend)
      await commands.mouseMove(before.legend[0].x, before.legend[0].y, {
        steps: 4,
      });
    else {
      // Start above the candle, clear of it, then move in steps.
      await commands.mouseMove(m.x + dx, m.top - 30);
      await commands.mouseMove(m.x + dx, beside ? m.top - 20 : m.middle, {
        steps: 12,
      });
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  } finally {
    watching = false;
    observer.disconnect();
  }
  const after = marks();
  const errors = pageErrors();
  if (errors.length) throw new Error(`page error: ${errors.join("; ")}`);
  return {before, after, key, arrows};
}

// The direct hover onto candle 6 is also the arrow check's crossing onto it,
// so the two tests read one run.
const runs = new Map();
const hoverOnce = (config, renderer, {target = 6, beside = false} = {}) => {
  const key = JSON.stringify([config, renderer, target, beside]);
  if (!runs.has(key)) runs.set(key, hover(config, renderer, {target, beside}));
  return runs.get(key);
};

/** Asserts the hovered candle (and its volume bar) stay bright with an emphasized stroke, and every other period dims. */
function highlightsOne({before, after, key}, volume) {
  assert.ok(after.hovered, "a hover is set");
  const own = volume ? [key, `${key}_volume`] : [key];
  own.forEach(k => {
    const m = after.marks[k];
    assert.ok(m, `${k} is drawn`);
    assert.strictEqual(m.opacity, 1, `${k} stays bright`);
    assert.ok(
      m.strokeWidth > (before.marks[k].strokeWidth || 0),
      `${k} is emphasized (${before.marks[k].strokeWidth} -> ${m.strokeWidth})`,
    );
  });
  const others = Object.keys(after.marks).filter(k => !own.includes(k));
  assert.ok(
    others.length >= (volume ? 30 : 15),
    `other periods are drawn (${others.length})`,
  );
  others.forEach(k =>
    assert.ok(
      after.marks[k].opacity < 1,
      `${k} dims (${after.marks[k].opacity})`,
    ),
  );
  assert.ok(!after.axisDims, "axes stay bright");
}

const cases = {
  candles: {symbols: ["ACME"]},
  "candles with volume": {symbols: ["ACME"], config: {volume: "volume"}},
  "OHLC bars with volume": {
    symbols: ["ACME"],
    config: {volume: "volume", variant: "ohlc"},
  },
  "skipGaps false with volume": {
    symbols: ["ACME"],
    config: {volume: "volume", skipGaps: false},
  },
  "facets with volume": {
    symbols: ["ACME", "BOLT"],
    config: {volume: "volume", facet: "symbol"},
  },
};

for (const renderer of ["svg", "canvas"]) {
  for (const [name, config] of Object.entries(cases)) {
    const volume = !!(config.config && config.config.volume);
    it(`Candlestick ${renderer} — the snapped hover beside a candle highlights it (${name})`, async function () {
      highlightsOne(await hover(config, renderer, {beside: true}), volume);
    });

    it(`Candlestick ${renderer} — hovering a candle directly highlights it (${name})`, async function () {
      highlightsOne(await hoverOnce(config, renderer), volume);
    });

    it(`Candlestick ${renderer} — moving onto a candle never shows the tooltip arrow (${name})`, async function () {
      // Down candles are filled, up candles hollow: cross onto one of each.
      for (const target of [4, 5, 6, 7]) {
        const {arrows} = await hoverOnce(config, renderer, {target});
        assert.strictEqual(
          arrows,
          0,
          `no arrow over candle ${target} (${arrows} samples showed one)`,
        );
      }
    });
  }

  it(`Candlestick ${renderer} — a legend hover still highlights its whole series`, async function () {
    const {after} = await hover(
      {symbols: ["ACME", "BOLT"], config: {legend: true, volume: "volume"}},
      renderer,
      {legend: true},
    );
    assert.ok(after.hovered, "a hover is set");
    const keys = Object.keys(after.marks);
    assert.ok(after.legend.length >= 2, "the legend is drawn");
    keys
      .filter(k => k.startsWith("ACME_"))
      .forEach(k =>
        assert.strictEqual(after.marks[k].opacity, 1, `${k} stays bright`),
      );
    keys
      .filter(k => k.startsWith("BOLT_"))
      .forEach(k => assert.ok(after.marks[k].opacity < 1, `${k} dims`));
    assert.ok(!after.axisDims, "axes stay bright");
  });
}
