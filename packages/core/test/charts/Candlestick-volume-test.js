/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Candlestick's volume strip in a real browser: one bar per candle under the
    candles, colored by direction, with its own abbreviated axis; a Volume
    tooltip row; summed volumes when rows merge; hover and hit-testing on the
    bars; facets, OHLC bars, calendar gaps, zoom, textures, and the canvas
    renderer.
*/

after(async () => {
  await closeBrowser();
});

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  // Seeded weekday prices with volumes.
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
          volume: Math.round(1e6 * (1 + rand() * 3)),
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
  const walk = (nodes, test, out = []) => {
    (nodes || []).forEach(n => {
      if (test(n)) out.push(n);
      walk(n.children, test, out);
    });
    return out;
  };
  window.__walk = walk;
  const mark = n => n.shapeType === "Candlestick" && n.type === "path" && !`${n.key}`.endsWith("::hit");
  window.__candles = viz => walk(viz._chartScene, n => mark(n) && !`${n.key}`.endsWith("_volume"));
  window.__bars = viz => walk(viz._chartScene, n => mark(n) && `${n.key}`.endsWith("_volume"));
  window.__axes = viz => walk(viz._chartScene, n => n.key === "candlestick-volume-axis" || `${n.key}`.endsWith("/candlestick-volume-axis"));
  // A path's numbers, as [x, y] pairs.
  window.__box = d => {
    const xs = Array.from(d.matchAll(/(?:M|H)(-?[\d.]+)/g)).map(m => +m[1]);
    const ys = Array.from(d.matchAll(/(?:,|V)(-?[\d.]+)/g)).map(m => +m[1]);
    return {x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys)};
  };
  // Hovers a content-space point; resolves the tooltip's rows.
  window.__hoverAt = (viz, el, cx, cy) =>
    new Promise(resolve => {
      const r = el.querySelector("svg, canvas").getBoundingClientRect();
      const c = viz._chartTransform;
      const clientX = r.left + c.x + cx;
      const clientY = r.top + c.y + cy;
      const target = el.querySelector("canvas.d3plus-render-canvas") || document.elementFromPoint(clientX, clientY);
      target.dispatchEvent(new MouseEvent("mousemove", {clientX, clientY, bubbles: true}));
      requestAnimationFrame(() => setTimeout(() => {
        const tips = document.querySelectorAll(".d3plus-tooltip");
        const tip = tips[tips.length - 1];
        resolve(tip ? Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
          Array.from(tr.querySelectorAll("td")).map(td => td.textContent)) : null);
      }, 50));
    });
};

const run = (fn, arg) => render("", new Function("arg", `return (${helpers})(), (${fn})(arg);`), arg);

it("Candlestick draws a volume strip only with volume: a bar per candle, colored by direction, between the candles and the x axis", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = window.__prices(40);
    const plain = await window.__draw(v => v.data(data).groupBy("symbol"));
    const span = viz => {
      const range = viz._yAxis._d3Scale.range();
      return Math.abs(range[1] - range[0]);
    };
    const before = {bars: window.__bars(plain.viz).length, axes: window.__axes(plain.viz).length, span: span(plain.viz)};
    const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume"));
    const candles = window.__candles(viz);
    const bars = window.__bars(viz);
    const xAxis = window.__walk(viz._chartScene, n => n.key === "plot-x-axis")[0];
    const xBar = window.__walk(xAxis.children, n => n.key === "bar")[0];
    const off = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume").volume(false));
    return {
      before,
      off: window.__bars(off.viz).length,
      span: span(viz),
      priceBottom: Math.max(...viz._yAxis._d3Scale.range()),
      area: viz._plotArea,
      xAxisY: xBar.points[0][1] + (xAxis.transform?.y ?? 0),
      candles: candles.map(c => ({
        up: c.datum.data.close >= c.datum.data.open,
        cx: c.interactionPoints[0].x,
        ...window.__box(c.d),
      })),
      bars: bars.map(b => ({
        up: b.datum.data.close >= b.datum.data.open,
        fill: b.paint.fill,
        cx: b.interactionPoints[0].x,
        volume: b.datum.data.volume,
        ...window.__box(b.d),
      })),
      labels: Array.from(el.querySelectorAll("[data-key='candlestick-volume-axis'] text")).map(t => t.textContent),
      nan: Array.from(el.querySelectorAll("*")).filter(n =>
        Array.from(n.attributes).some(a => a.value.includes("NaN"))).length,
    };
  });
  assert.deepStrictEqual(out.before.bars, 0, "no strip without volume");
  assert.deepStrictEqual(out.before.axes, 0, "no strip axis without volume");
  assert.strictEqual(out.off, 0, "volume(false) turns the strip off");
  assert.strictEqual(out.nan, 0);
  assert.strictEqual(out.bars.length, 40);
  assert.strictEqual(out.bars.length, out.candles.length, "one bar per candle");
  out.bars.forEach((b, k) => {
    assert.strictEqual(b.fill, b.up ? "#2f9e44" : "#e03131", "bars are filled in their candle's color, hollow up candles included");
    assert.ok(Math.abs(b.cx - out.candles[k].cx) < 0.01, "a bar sits under its candle");
  });
  assert.ok(out.bars.some(b => b.up) && out.bars.some(b => !b.up));
  // Taller bars for bigger volumes.
  const sorted = out.bars.slice().sort((a, b) => a.volume - b.volume);
  assert.ok(sorted[0].y0 > sorted[sorted.length - 1].y0, "the biggest volume reaches highest");
  assert.ok(out.span < out.before.span, `the price axis shrinks (${out.span} < ${out.before.span})`);
  const candleBottom = Math.max(...out.candles.map(c => c.y1));
  const barTop = Math.min(...out.bars.map(b => b.y0));
  const stripBottom = out.area.y + out.area.height;
  assert.ok(candleBottom <= out.priceBottom + 1, "candles stay in the price area");
  assert.ok(barTop >= out.priceBottom + 15, `the strip starts a gap under the price area (${barTop} vs ${out.priceBottom})`);
  out.bars.forEach(b => assert.ok(Math.abs(b.y1 - stripBottom) < 1, "bars stand on the strip's bottom"));
  assert.ok(out.xAxisY >= stripBottom - 1, `the x axis sits under the strip (${out.xAxisY} vs ${stripBottom})`);
  assert.ok(out.labels.length >= 1);
  out.labels.forEach(l => assert.match(l, /^\d+(\.\d+)?[kKMB]$/, `abbreviated tick ${l}`));
});

it("Candlestick lists Volume in the tooltip and aria label, translated", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = window.__prices(20);
    const tip = async locale => {
      const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume").locale(locale));
      const a = viz._plotArea;
      const rows = await window.__hoverAt(viz, el, a.x + a.width / 2, a.height * 0.1);
      const aria = window.__candles(viz)[0].aria.label;
      const barAria = window.__bars(viz)[0].aria.label;
      el.remove();
      return {rows, aria, barAria};
    };
    return {en: await tip("en-US"), es: await tip("es-ES")};
  });
  assert.deepStrictEqual(out.en.rows.map(r => r[0]), ["date", "Open", "High", "Low", "Close", "Change", "Volume"]);
  assert.match(out.en.rows[6][1], /^\d+(\.\d+)?M$/);
  assert.match(out.en.aria, /, Volume \d+(\.\d+)?M\.$/);
  assert.match(out.en.barAria, /^ACME, Jan 1, 2024: Volume \d+(\.\d+)?M\.$/, "a volume bar reads its period and volume");
  assert.strictEqual(out.es.rows[6][0], "Volumen");
  assert.match(out.es.barAria, /^ACME, ene 1, 2024: Volumen \d+(,\d+)?mm\.$/, "in the chart's locale");
});

it("Candlestick's date work grows linearly with its periods, volume strip included", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    // Counts Date comparisons and conversions while drawing `n` periods.
    const count = async (n, volume) => {
      const data = window.__prices(n);
      const valueOf = Date.prototype.valueOf;
      let calls = 0;
      Date.prototype.valueOf = function () {
        calls++;
        return valueOf.call(this);
      };
      try {
        const {el} = await window.__draw(v => (volume ? v.volume("volume") : v).data(data).groupBy("symbol"));
        el.remove();
      }
      finally {
        Date.prototype.valueOf = valueOf;
      }
      return calls;
    };
    return {
      plain: [await count(250, false), await count(1000, false)],
      volume: [await count(250, true), await count(1000, true)],
    };
  });
  // Four times the periods: about four times the work when linear, sixteen
  // when each bar scans every period (as labeling bars through the axis did).
  Object.entries(out).forEach(([name, [small, large]]) =>
    assert.ok(large / small < 6, `${name}: ${small} at 250 periods, ${large} at 1000`));
});

it("Candlestick sums volumes when rows merge, and aggs overrides it", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const rows = [];
    ["2024-01-02", "2024-01-03", "2024-01-04"].forEach((day, k) => {
      [1, 2, 3].forEach(j => rows.push({
        symbol: "ACME", day, open: 100 + k + j, high: 104 + k, low: 98 + k, close: 101 + k + j,
        volume: j * 1e6, nested: {v: j * 1e6},
      }));
    });
    const probe = async configure => {
      const {el, viz} = await window.__draw(v => configure(v.data(rows).groupBy("symbol").x("day")));
      const a = viz._plotArea;
      const tip = await window.__hoverAt(viz, el, a.x + a.width / 2, a.height * 0.1);
      const bars = window.__bars(viz).map(b => window.__box(b.d));
      el.remove();
      return {volume: tip.find(r => r[0] === "Volume")[1], bars: bars.map(b => b.y1 - b.y0)};
    };
    const most = (a, value) => Math.max(...a.map(value));
    return {
      key: await probe(v => v.volume("volume")),
      fn: await probe(v => v.volume(d => d.nested.v)),
      keyOverride: await probe(v => v.volume("volume").aggs({volume: most})),
      fnOverride: await probe(v => v.volume(d => d.nested.v).aggs({volume: most})),
    };
  });
  assert.strictEqual(out.key.volume, "6M", "1M + 2M + 3M");
  assert.strictEqual(out.fn.volume, "6M", "a function accessor sums too");
  assert.strictEqual(out.keyOverride.volume, "3M", "a key's aggs entry wins");
  assert.strictEqual(out.fnOverride.volume, "3M", "a field-named aggs entry wins for a function");
  assert.strictEqual(out.key.bars.length, 3);
  out.key.bars.forEach(h => assert.ok(h > 0));
});

it("Candlestick volume bars hover and hit-test with their candle on SVG and Canvas", async function () {
  this.timeout(120000);
  for (const renderer of ["svg", "canvas"]) {
    const out = await run(async renderer => {
      const data = window.__prices(30);
      const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume"), renderer);
      const bars = window.__bars(viz);
      const bar = bars[12];
      const box = window.__box(bar.d);
      const rows = await window.__hoverAt(viz, el, (box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2);
      const hovered = typeof viz._hover === "function";
      const match = hovered ? viz._hover(bar.datum.data, bar.datum.i) : null;
      return {rows, date: bar.datum.data.date, hovered, match, points: bars.every(b => b.interactionPoints.length === 1)};
    }, renderer);
    assert.ok(out.rows, `${renderer}: a tooltip shows over a volume bar`);
    assert.strictEqual(out.rows[6][0], "Volume", `${renderer}: the bar's tooltip is its candle's`);
    const [y, m, d] = out.date.split("-").map(Number);
    assert.strictEqual(out.rows[0][1], new Date(y, m - 1, d).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"}));
    assert.ok(out.points, `${renderer}: each bar snaps at its candle's point`);
    assert.ok(out.hovered && out.match, `${renderer}: hovering a bar highlights its row`);
  }
});

it("Candlestick volume works with variant ohlc, skipGaps(false), and volumeConfig", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = window.__prices(15);
    const strip = viz => viz._plotArea.y + viz._plotArea.height - Math.max(...viz._yAxis._d3Scale.range());
    const ohlc = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume").variant("ohlc").skipGaps(false));
    const base = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume"));
    const tall = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume")
      .volumeConfig({height: 0.35, gap: 4, shapeConfig: {fillOpacity: 1, stroke: "black", strokeWidth: 1}}));
    const bar = window.__bars(tall.viz)[0];
    return {
      ohlc: {
        bars: window.__bars(ohlc.viz).map(b => b.interactionPoints[0].x),
        candles: window.__candles(ohlc.viz).map(c => c.interactionPoints[0].x),
        scale: ohlc.viz._xAxis.schema.scale,
      },
      base: strip(base.viz),
      tall: strip(tall.viz),
      paint: bar.paint,
      defaultPaint: window.__bars(base.viz)[0].paint,
    };
  });
  assert.strictEqual(out.ohlc.scale, "time");
  assert.strictEqual(out.ohlc.bars.length, 15);
  assert.deepStrictEqual(out.ohlc.bars, out.ohlc.candles, "bars follow the OHLC bars on a time axis");
  assert.ok(out.tall > out.base * 1.4, `volumeConfig.height grows the strip (${out.tall} vs ${out.base})`);
  assert.strictEqual(out.defaultPaint.fillOpacity, 0.5);
  assert.strictEqual(out.paint.fillOpacity, 1);
  assert.strictEqual(out.paint.stroke, "black");
});

it("Candlestick draws a volume strip in each facet panel", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = [...window.__prices(20, "ACME", 100, 3), ...window.__prices(20, "BOLT", 20, 5).map(d => ({...d, volume: d.volume * 40}))];
    const probe = async scales => {
      const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol").facet("symbol").volume("volume")
        .facetConfig({scales}));
      const axes = Array.from(el.querySelectorAll("[data-key$='candlestick-volume-axis']"))
        .map(g => Array.from(g.querySelectorAll("text")).map(t => t.textContent).filter(Boolean));
      const result = {
        candles: window.__candles(viz).length,
        bars: window.__bars(viz).length,
        axes: window.__axes(viz).length,
        labels: axes,
        symbols: Array.from(new Set(window.__bars(viz).map(b => b.datum.data.symbol))).sort(),
      };
      el.remove();
      return result;
    };
    return {independent: await probe("independent"), shared: await probe("shared")};
  });
  for (const key of ["independent", "shared"]) {
    const o = out[key];
    assert.strictEqual(o.candles, 40, key);
    assert.strictEqual(o.bars, 40, `${key}: a bar per candle`);
    assert.strictEqual(o.axes, 2, `${key}: each panel gets its own strip axis`);
    assert.deepStrictEqual(o.symbols, ["ACME", "BOLT"]);
  }
  assert.notDeepStrictEqual(out.independent.labels[0], out.independent.labels[1], "independent panels fit their own volumes");
  const labeled = out.shared.labels.filter(l => l.length);
  assert.strictEqual(labeled.length, 1, "with shared scales, only the left panel labels its strip");
});

it("Candlestick keeps candles out of the volume strip while zoomed", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = window.__prices(30);
    const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume"));
    const span = () => {
      const [a, b] = viz._yAxis._d3Scale.domain();
      return Math.abs(b - a);
    };
    const before = span();
    el.querySelector(".zoom-in").click();
    await new Promise(r => setTimeout(r, 900));
    const content = window.__walk(viz._chartScene, n => n.key === "plot-zoom-content")[0];
    const price = window.__walk(viz._chartScene, n => n.key === "candlestick-price")[0];
    return {
      zoomed: before / span(),
      content: content && content.clip,
      price: price && price.clip,
      area: viz._plotArea,
      priceBottom: Math.max(...viz._yAxis._d3Scale.range()),
      bars: window.__bars(viz).length,
    };
  });
  assert.ok(out.zoomed > 1.5, `the price axis zoomed in (${out.zoomed}x)`);
  assert.ok(out.content, "the zoomed plot clips its content");
  const stripBottom = out.area.y + out.area.height;
  assert.ok(Math.abs(out.content.y + out.content.height - stripBottom) < 1, "the plot's clip takes in the strip");
  assert.ok(Math.abs(out.price.y + out.price.height - out.priceBottom) < 1, "candles clip at the price area's bottom");
  assert.strictEqual(out.bars, 30, "the strip stays drawn");
});

it("Candlestick keeps the volume axis labeled while zoomed", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = window.__prices(30);
    const {el, viz} = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume"));
    const labels = () => Array.from(el.querySelectorAll("[data-key='candlestick-volume-axis'] text")).map(t => t.textContent);
    // The axis sits left of the plot, so the zoom's clip of the plot content would hide it.
    const inZoomContent = () => window.__walk(viz._chartScene, n => n.key === "plot-zoom-content")
      .some(c => window.__walk(c.children, n => n.key === "candlestick-volume-axis").length);
    const before = labels();
    el.querySelector(".zoom-in").click();
    await new Promise(r => setTimeout(r, 900));
    return {before, zoomed: labels(), inside: inZoomContent()};
  });
  assert.ok(out.before.length, "the volume axis is labeled");
  assert.deepStrictEqual(out.zoomed, out.before, "a zoom leaves the volume axis's labels in place");
  assert.strictEqual(out.inside, false, "the volume axis sits outside the zoom's clipped content");
});

it("Candlestick's volume strip and axis stay clear of the plot's domain clip", async function () {
  this.timeout(120000);
  const out = await run(async () => {
    const data = window.__prices(30);
    const {viz} = await window.__draw(v => v.data(data).groupBy("symbol").volume("volume"));
    const isClip = n => /(^|\/)plot-domain-clip-\d+$/.test(`${n.key}`);
    // Each volume bar's and the volume axis's nearest domain clip, if any.
    const clipped = [];
    const visit = (nodes, clip) => (nodes || []).forEach(n => {
      const next = isClip(n) ? n.clip : clip;
      const bar = n.type === "path" && `${n.key}`.endsWith("_volume");
      if (next && (bar || n.key === "candlestick-volume-axis")) clipped.push({key: n.key, bottom: next.y + next.height});
      visit(n.children, next);
    });
    visit(viz._chartScene, undefined);
    return {clipped, area: viz._plotArea, bars: window.__bars(viz).length, axes: window.__axes(viz).length};
  });
  const stripBottom = out.area.y + out.area.height;
  assert.ok(out.clipped.every(c => c.key !== "candlestick-volume-axis"), "the volume axis, left of the plot, is never clipped");
  assert.ok(out.clipped.every(c => c.bottom >= stripBottom - 1), "a clip around the volume bars takes in the strip");
  assert.strictEqual(out.bars, 30, "every volume bar is drawn");
  assert.strictEqual(out.axes, 1, "the volume axis is drawn");
});

it("Candlestick volume bars take texture and backgroundImage on SVG and Canvas", async function () {
  this.timeout(120000);
  for (const renderer of ["svg", "canvas"]) {
    const out = await run(async renderer => {
      const image = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";
      const {viz} = await window.__draw(v => v.data(window.__prices(12)).groupBy("symbol").volume("volume")
        .shapeConfig({texture: "lines", backgroundImage: image}), renderer);
      const images = window.__walk([viz._lastSceneRendered.root], n => n.type === "image").map(n => n.key);
      return window.__bars(viz).map(b => {
        const fill = String(b.paint.fill);
        return {
          up: b.datum.data.close >= b.datum.data.open,
          texture: fill.startsWith("pattern:") ? JSON.parse(fill.slice(8)) : null,
          image: images.includes(`${b.key}-bgimage-img`),
        };
      });
    }, renderer);
    assert.strictEqual(out.length, 12);
    assert.ok(out.some(b => b.up), `${renderer}: up bars drawn`);
    for (const b of out) {
      assert.ok(b.texture, `${renderer}: every bar is textured, hollow up candles' included`);
      assert.notStrictEqual(b.texture.stroke, b.texture.background, `${renderer}: texture lines show against the bar`);
      assert.ok(b.image, `${renderer}: every bar takes the backgroundImage`);
    }
  }
});
