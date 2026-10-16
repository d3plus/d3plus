/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Candlestick in a real browser: one candle (or OHLC bar) per period, colored
    and filled by direction, the value axis spanning every high and low, evenly
    spaced or calendar-placed periods, snapped OHLC tooltips, events, facets,
    translations, and the canvas renderer.
*/

after(async () => {
  await closeBrowser();
});

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  // Seeded weekday prices.
  window.__prices = (n, symbol = "ACME", start = 100, seed = 11) => {
    let s = seed;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const rows = [];
    const day = new Date(2024, 0, 1);
    let close = start;
    while (rows.length < n) {
      if (day.getDay() % 6) {
        const open = close * (1 + (rand() - 0.5) * 0.02);
        close = open * (1 + (rand() - 0.5) * 0.04);
        const r = v => Math.round(v * 100) / 100;
        rows.push({
          symbol,
          date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
          open: r(open),
          high: r(Math.max(open, close) * (1 + rand() * 0.01)),
          low: r(Math.min(open, close) * (1 - rand() * 0.01)),
          close: r(close),
        });
      }
      day.setDate(day.getDate() + 1);
    }
    return rows;
  };
  window.__draw = (configure, renderer = "svg") =>
    new Promise(resolve => {
      const el = document.createElement("div");
      el.style.cssText = "width:800px;height:400px";
      document.body.appendChild(el);
      const viz = new window.d3plus.Candlestick()
        .select(el)
        .renderer(renderer)
        .duration(0)
        .width(800)
        .height(400);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  // Every Candlestick scene node (not hit areas), walking the chart scene.
  window.__candles = viz => {
    const out = [];
    const walk = n => {
      if (n.shapeType === "Candlestick" && !`${n.key}`.endsWith("::hit") && !`${n.key}`.includes("_volume")) out.push(n);
      (n.children || []).forEach(walk);
    };
    (viz._chartScene || []).forEach(walk);
    return out;
  };
  // Hovers the plot at a share of its width; resolves the tooltip's rows.
  window.__hover = (viz, el, fx) =>
    new Promise(resolve => {
      const target = el.querySelector("canvas.d3plus-render-canvas") ||
        el.querySelector('[data-key="plot-hover-surface"]') || el.querySelector("svg");
      const r = el.querySelector("svg, canvas").getBoundingClientRect();
      const a = viz._plotArea, c = viz._chartTransform;
      const clientX = r.left + c.x + a.x + a.width * fx;
      const clientY = r.top + c.y + a.y + a.height / 2;
      target.dispatchEvent(new MouseEvent("mousemove", {clientX, clientY, bubbles: true}));
      requestAnimationFrame(() => setTimeout(() => {
        const tips = document.querySelectorAll(".d3plus-tooltip");
        const tip = tips[tips.length - 1];
        resolve(tip ? Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
          Array.from(tr.querySelectorAll("td")).map(td => td.textContent)) : null);
      }, 50));
    });
};

const run = fn => render("", new Function(`return (${helpers})(), (${fn})();`));

it("Candlestick draws one candle per period, colored and filled by direction", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__prices(60);
    const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol"));
    const candles = window.__candles(viz);
    const paths = Array.from(el.querySelectorAll("path"))
      .filter(p => /_/.test(p.closest("[data-key]")?.getAttribute("data-key") || ""));
    return {
      n: candles.length,
      nan: Array.from(el.querySelectorAll("*")).filter(n =>
        Array.from(n.attributes).some(a => a.value.includes("NaN"))).length,
      paints: candles.map(c => [c.datum.data.close >= c.datum.data.open, c.paint.fill, c.paint.stroke, c.paint.strokeWidth]),
      closed: candles.every(c => c.d.endsWith("Z")),
      points: candles.every(c => c.interactionPoints && c.interactionPoints.length === 1),
      aria: candles[0].aria.label,
      yDomain: viz._yAxis._d3Scale.domain(),
      low: Math.min(...data.map(d => d.low)),
      high: Math.max(...data.map(d => d.high)),
      xScale: viz._xAxis.schema.scale,
      xTicks: viz._xAxis._d3Scale.domain().length,
      labels: Array.from(el.querySelectorAll("[data-key='plot-x-axis'] text")).map(t => t.textContent),
      paths: paths.length,
      title: viz._yConfig.title,
    };
  });
  assert.strictEqual(out.n, 60);
  assert.strictEqual(out.nan, 0);
  assert.ok(out.closed, "each candle closes its body");
  assert.ok(out.points, "each candle snaps at one point");
  for (const [up, fill, stroke, strokeWidth] of out.paints) {
    assert.strictEqual(stroke, up ? "#2f9e44" : "#e03131");
    assert.strictEqual(fill, up ? "none" : "#e03131", "rising candles are hollow");
    assert.strictEqual(strokeWidth, 1);
  }
  assert.ok(out.paints.some(p => p[0]) && out.paints.some(p => !p[0]), "both directions drawn");
  assert.match(out.aria, /^ACME, Jan 1, 2024: Open [\d.]+, High [\d.]+, Low [\d.]+, Close [\d.]+, Change [-+][\d.]+%\.$/);
  const [top, bottom] = out.yDomain;
  assert.ok(top >= out.high && bottom <= out.low, `y ${out.yDomain} holds ${out.low}–${out.high}`);
  assert.strictEqual(out.xScale, "point", "periods are evenly spaced by default");
  assert.strictEqual(out.xTicks, 60);
  assert.deepStrictEqual(out.labels.filter(Boolean), ["Jan 2024", "Feb", "Mar"], "the first period, then each month");
  assert.strictEqual(out.title, undefined, "the value axis takes no title from close");
});

it("Candlestick snaps an OHLC tooltip to the nearest period", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__prices(40);
    const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol"));
    const rows = await window.__hover(viz, el, 0.5);
    const {el: el2, viz: viz2} = await window.__draw(v => v.data(data).groupBy("symbol").locale("es-ES"));
    const es = await window.__hover(viz2, el2, 0.5);
    return {rows, es, crosshair: !!el.querySelector('[data-key="plot-crosshair"]')};
  });
  assert.ok(out.rows, "a tooltip shows");
  assert.deepStrictEqual(out.rows.map(r => r[0]), ["date", "Open", "High", "Low", "Close", "Change"]);
  assert.match(out.rows[0][1], /^[A-Z][a-z]{2} \d{1,2}, 2024$/);
  out.rows.slice(1, 5).forEach(r => assert.match(r[1], /^\d+\.\d\d$/));
  assert.match(out.rows[5][1], /^[-+]?\d+(\.\d+)?%$/);
  assert.ok(out.crosshair, "a crosshair marks the period");
  assert.deepStrictEqual(out.es.map(r => r[0]), ["date", "Apertura", "Máximo", "Mínimo", "Cierre", "Variación"]);
});

it("Candlestick variant ohlc draws unfilled bars with open and close ticks", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__prices(20);
    const {viz} = await window.__draw(v => v.data(data).groupBy("symbol").variant("ohlc").hollow(false));
    return window.__candles(viz).map(c => [c.d, c.paint.fill]);
  });
  assert.strictEqual(out.length, 20);
  out.forEach(([d, fill]) => {
    assert.strictEqual(fill, "none");
    assert.ok(!d.includes("Z"));
    assert.match(d, /^M[\d.]+,[\d.]+V[\d.]+M[\d.]+,[\d.]+H[\d.]+M[\d.]+,[\d.]+H[\d.]+$/);
  });
});

it("Candlestick skipGaps(false) places periods on a time axis with weekend gaps", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__prices(10);
    const {viz} = await window.__draw(v => v.data(data).groupBy("symbol").skipGaps(false).hollow(false));
    const candles = window.__candles(viz);
    const cx = candles.map(c => c.interactionPoints[0].x);
    return {
      scale: viz._xAxis.schema.scale,
      time: typeof viz.schema.time,
      cx,
      days: candles.map(c => c.datum.data.date),
      fills: candles.map(c => c.paint.fill),
    };
  });
  assert.strictEqual(out.scale, "time");
  assert.strictEqual(out.time, "function", "the period drives a time axis");
  // Jan 1 2024 is a Monday: Fri the 5th to Mon the 8th spans three days.
  const day = out.cx[1] - out.cx[0];
  const weekend = out.cx[5] - out.cx[4];
  assert.ok(Math.abs(weekend - 3 * day) < 1.5, `weekend gap ${weekend} vs day ${day}`);
  assert.ok(out.fills.every(f => f !== "none"), "hollow(false) fills every candle");
});

it("Candlestick reads custom accessors, aliases y to close, and skips rows without a close", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__prices(15).map((d, i) => ({
      when: d.date, o: d.open, h: d.high, l: d.low, price: i === 3 ? null : d.close, symbol: d.symbol,
    }));
    const {viz} = await window.__draw(v => v
      .data(data)
      .groupBy("symbol")
      .x("when")
      .open("o")
      .high("h")
      .low("l")
      .y("price")
      .upColor("#1c7ed6")
      .downColor(d => (d.o > 0 ? "#e8590c" : "black")));
    const candles = window.__candles(viz);
    return {
      n: candles.length,
      close: viz.close()({price: 5}),
      y: viz.y()({price: 7}),
      strokes: Array.from(new Set(candles.map(c => c.paint.stroke))).sort(),
      config: Object.keys(viz.config()).filter(k => ["open", "high", "low", "close", "variant", "hollow", "skipGaps", "upColor", "downColor", "bodyWidth"].includes(k)).sort(),
    };
  });
  assert.strictEqual(out.n, 14, "the row without a close is skipped");
  assert.strictEqual(out.close, 5);
  assert.strictEqual(out.y, 7);
  assert.deepStrictEqual(out.strokes, ["#1c7ed6", "#e8590c"]);
  assert.deepStrictEqual(out.config, ["bodyWidth", "close", "downColor", "high", "hollow", "low", "open", "skipGaps", "upColor", "variant"]);
});

it("Candlestick fires .Candlestick events with the row", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__prices(10);
    const clicked = [];
    const {el, viz} = await window.__draw(v => v
      .data(data)
      .groupBy("symbol")
      .on("click.Candlestick", d => clicked.push(d.date)));
    const node = el.querySelector("[data-key$='::hit']") || el.querySelector("path");
    node.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    await new Promise(r => setTimeout(r, 50));
    return {clicked, keys: window.__candles(viz).length};
  });
  assert.strictEqual(out.keys, 10);
  assert.strictEqual(out.clicked.length, 1);
  assert.match(out.clicked[0], /^2024-01-\d\d$/);
});

it("Candlestick draws 500 periods on canvas and hit-tests them", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__prices(500);
    const t0 = performance.now();
    const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol"), "canvas");
    const ms = performance.now() - t0;
    const rows = await window.__hover(viz, el, 0.7);
    return {n: window.__candles(viz).length, canvas: !!el.querySelector("canvas"), ms, rows};
  });
  assert.strictEqual(out.n, 500);
  assert.ok(out.canvas);
  assert.ok(out.ms < 5000, `rendered in ${out.ms}ms`);
  assert.ok(out.rows && out.rows.length === 6, "a snapped tooltip on canvas");
});

it("Candlestick draws each ticker as its own panel with facet", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = [...window.__prices(30, "ACME", 100, 3), ...window.__prices(30, "BOLT", 20, 5)];
    const {viz} = await window.__draw(v => v
      .data(data)
      .groupBy("symbol")
      .facet("symbol")
      .facetConfig({scales: "independent"}));
    const candles = window.__candles(viz);
    return {
      n: candles.length,
      symbols: Array.from(new Set(candles.map(c => c.datum.data.symbol))).sort(),
    };
  });
  assert.strictEqual(out.n, 60);
  assert.deepStrictEqual(out.symbols, ["ACME", "BOLT"]);
});

it("Candlestick redraws through empty data and back", async function () {
  this.timeout(60000);
  const out = await run(async () => {
    const data = window.__prices(12);
    const {viz} = await window.__draw(v => v.data(data).groupBy("symbol"));
    const counts = [window.__candles(viz).length];
    await new Promise(r => viz.data([]).render(r));
    counts.push(window.__candles(viz).length);
    await new Promise(r => viz.data(data.slice(0, 5)).render(r));
    counts.push(window.__candles(viz).length);
    return counts;
  });
  assert.deepStrictEqual(out, [12, 0, 5]);
});

it("Candlestick: filled candles take texture and backgroundImage on SVG and Canvas; hollow ones take neither", async function () {
  this.timeout(60000);
  for (const renderer of ["svg", "canvas"]) {
    const out = await render("", new Function("renderer", `return (${helpers})(), (async renderer => {
      const image = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";
      const probe = async configure => {
        const {el, viz} = await window.__draw(v => configure(v.data(window.__prices(20)).groupBy("symbol")
          .shapeConfig({texture: "lines", backgroundImage: image})), renderer);
        const images = [];
        const walk = n => {
          if (n.type === "image") images.push(n.key);
          (n.children || []).forEach(walk);
        };
        walk(viz._lastSceneRendered.root);
        // Each candle's image group is stamped as a Candlestick mark too; keep the paths.
        const marks = window.__candles(viz).filter(c => c.type === "path").map(c => ({
          up: c.datum.data.close >= c.datum.data.open,
          fill: String(c.paint.fill),
          texture: String(c.paint.fill).startsWith("pattern:") ? JSON.parse(String(c.paint.fill).slice(8)) : null,
          image: images.includes(c.key + "-bgimage-img"),
        }));
        // Only the candle path snaps; its image group shares the datum but adds no point.
        const extraPoints = window.__candles(viz).filter(c => c.type !== "path" && c.interactionPoints).length;
        el.remove();
        return {marks, extraPoints};
      };
      const filled = await probe(v => v.hollow(false));
      return {
        hollow: (await probe(v => v)).marks,
        filled: filled.marks,
        filledExtraPoints: filled.extraPoints,
        ohlc: (await probe(v => v.variant("ohlc"))).marks,
      };
    })(renderer);`), renderer);
    const {hollow, filled, ohlc} = out;
    assert.strictEqual(out.filledExtraPoints, 0, `${renderer}: image groups add no snap points`);
    assert.ok(hollow.some(m => m.up) && hollow.some(m => !m.up), `${renderer}: both directions drawn`);
    for (const m of hollow) {
      if (m.up) assert.ok(m.fill === "none" && !m.image, `${renderer}: a hollow candle stays hollow`);
      else {
        assert.ok(m.fill.startsWith("pattern:") && m.image, `${renderer}: a filled candle takes both`);
        assert.notStrictEqual(m.texture.stroke, m.texture.background, `${renderer}: texture lines show against the body`);
      }
    }
    assert.ok(filled.every(m => m.fill.startsWith("pattern:") && m.image), `${renderer}: hollow(false) fills every candle with both`);
    assert.ok(ohlc.every(m => m.fill === "none" && !m.image), `${renderer}: OHLC bars take neither`);
  }
});

/** Page-side: four intraday rows a day for three days, plus the daily OHLC they roll up to. */
const intraday = () => {
  const rows = [];
  const daily = [];
  for (let k = 0; k < 3; k++) {
    const day = `2024-01-0${k + 2}`;
    const base = 100 + k * 5;
    const ticks = [
      {open: base, high: base + 2, low: base - 1, close: base + 1},
      {open: base + 1, high: base + 6, low: base, close: base + 3},
      {open: base + 3, high: base + 4, low: base - 3, close: base + 2},
      {open: base + 2, high: base + 3, low: base + 1, close: base + (k === 1 ? -2 : 2.5)},
    ];
    ticks.forEach((t, j) => rows.push({symbol: "ACME", day, time: `${day}T${9 + j}:30`, ...t}));
    daily.push({open: base, high: base + 6, low: base - 3, close: base + (k === 1 ? -2 : 2.5)});
  }
  return {rows, daily};
};

/** Page-side: each candle's merged values as its tooltip and its geometry show them. */
const probeMerged = async (configure, renderer) => {
  const {el, viz} = await window.__draw(configure, renderer);
  const scale = viz._yAxis._d3Scale;
  const candles = window.__candles(viz).filter(c => c.type === "path");
  const geometry = candles.map(c => {
    const nums = Array.from(c.d.matchAll(/(?:M[\d.]+,|V)([\d.]+)/g)).map(m => +m[1]);
    return {top: Math.min(...nums), bottom: Math.max(...nums), close: c.interactionPoints[0].y};
  });
  const rows = await window.__hover(viz, el, 0.5);
  const px = v => scale(v);
  el.remove();
  return {
    n: candles.length,
    geometry,
    rows,
    fills: candles.map(c => c.paint.fill),
    px: window.__daily.map(d => ({high: px(d.high), low: px(d.low), close: px(d.close)})),
  };
};

const runMerged = (fn, renderer = "svg") =>
  render("", new Function("renderer", `return (${helpers})(), (() => {
    const {rows, daily} = (${intraday})();
    window.__rows = rows;
    window.__daily = daily;
    window.__probeMerged = ${probeMerged};
  })(), (${fn})(renderer);`), renderer);

/** Asserts each candle's wick spans the merged high and low and snaps at the merged close. */
const assertMergedGeometry = (out, label) => {
  assert.strictEqual(out.n, 3, `${label}: one candle per day`);
  out.geometry.forEach((g, k) => {
    const want = out.px[k];
    assert.ok(Math.abs(g.top - want.high) <= 1, `${label}: day ${k} high ${g.top} vs ${want.high}`);
    assert.ok(Math.abs(g.bottom - want.low) <= 1, `${label}: day ${k} low ${g.bottom} vs ${want.low}`);
    assert.ok(Math.abs(g.close - want.close) <= 1, `${label}: day ${k} close ${g.close} vs ${want.close}`);
  });
};

it("Candlestick merges rows sharing a period as first open, highest high, lowest low, last close", async function () {
  this.timeout(60000);
  for (const renderer of ["svg", "canvas"]) {
    const out = await runMerged(async renderer =>
      window.__probeMerged(v => v.data(window.__rows).groupBy("symbol").x("day"), renderer), renderer);
    assertMergedGeometry(out, renderer);
    assert.deepStrictEqual(out.rows.slice(1).map(r => r[1]), ["105.00", "111.00", "102.00", "103.00", "-1.9%"], `${renderer}: tooltip`);
    assert.strictEqual(out.fills[1], "#e03131", `${renderer}: the merged day fell, so it fills`);
  }
});

it("Candlestick merges function accessors' values the same way", async function () {
  this.timeout(60000);
  for (const renderer of ["svg", "canvas"]) {
    const out = await runMerged(async renderer => {
      const nested = window.__rows.map(({symbol, day, time, ...p}) => ({symbol, day, time, p}));
      return window.__probeMerged(v => v
        .data(nested)
        .groupBy("symbol")
        .x("day")
        .open(d => d.p.open)
        .high(d => d.p.high)
        .low(d => d.p.low)
        .close(d => d.p.close), renderer);
    }, renderer);
    assertMergedGeometry(out, `${renderer} functions`);
    assert.deepStrictEqual(out.rows.slice(1).map(r => r[1]), ["105.00", "111.00", "102.00", "103.00", "-1.9%"], `${renderer}: tooltip`);
  }
});

it("Candlestick lets aggs override the merge for data keys and function accessors", async function () {
  this.timeout(60000);
  const out = await runMerged(async () => {
    const mean = (rows, value) => rows.reduce((s, d) => s + value(d), 0) / rows.length;
    const keyed = await window.__probeMerged(v => v
      .data(window.__rows)
      .groupBy("symbol")
      .x("day")
      .aggs({open: (rows, value) => value(rows[1]), close: mean}));
    const nested = window.__rows.map(({symbol, day, time, ...p}) => ({symbol, day, time, p}));
    const functions = await window.__probeMerged(v => v
      .data(nested)
      .groupBy("symbol")
      .x("day")
      .open(d => d.p.open)
      .high(d => d.p.high)
      .low(d => d.p.low)
      .close(d => d.p.close)
      .aggs({close: mean}));
    return {keyed: keyed.rows, functions: functions.rows};
  });
  // Day two: closes 106, 108, 107, 103 average 106.
  assert.deepStrictEqual(out.keyed.slice(1, 5).map(r => r[1]), ["106.00", "111.00", "102.00", "106.00"]);
  assert.deepStrictEqual(out.functions.slice(1, 5).map(r => r[1]), ["105.00", "111.00", "102.00", "106.00"]);
});
