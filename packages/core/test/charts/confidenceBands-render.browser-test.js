/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Nested `confidence` bands in a real browser: shading outermost first,
    tooltips listing each band's range, both backends, small multiples, and
    the single-pair API drawing exactly as before.
*/

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  // A series whose bands open after `start` and widen each step.
  window.__fan = (id, level = 10, start = 5, extra = {}) =>
    Array.from({length: 10}, (_, t) => {
      const row = {id, t: 2000 + t, v: level + t, ...extra};
      if (t >= start) {
        const w = t - start;
        Object.assign(row, {p5: row.v - 2 * w, p95: row.v + 2 * w, p25: row.v - w, p75: row.v + w});
      }
      return row;
    });
  window.__draw = (Chart, configure, size = [800, 500]) =>
    new Promise(resolve => {
      const el = document.createElement("div");
      el.style.cssText = `width:${size[0]}px;height:${size[1]}px`;
      document.body.appendChild(el);
      const viz = new window.d3plus[Chart]().select(el).detectVisible(false).duration(0).width(size[0]).height(size[1]);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  window.__flat = nodes => nodes.flatMap(n => [n, ...(n.children ? window.__flat(n.children) : [])]);
  window.__nan = el =>
    Array.from(el.querySelectorAll("*")).filter(n => Array.from(n.attributes).some(a => a.value.includes("NaN"))).length;
  // Bands and line dashes, summarized from the scene.
  window.__summary = viz => {
    const nodes = window.__flat(viz._chartScene);
    return {
      bands: nodes
        .filter(n => n.shapeType === "Area")
        .map(n => ({key: n.key, opacity: n.paint.fillOpacity, fill: n.paint.fill})),
      dashes: nodes
        .filter(n => n.shapeType === "Line" && !/::hit$/.test(`${n.key}`))
        .map(n => (n.paint.strokeDasharray || []).slice(0, 4)),
    };
  };
  // Hovers plot space at `fx` across the plot and reads the tooltip rows.
  window.__hover = async (el, viz, fx) => {
    const surface = el.querySelector("svg.d3plus-render-svg, canvas.d3plus-render-canvas");
    const r = surface.getBoundingClientRect();
    const a = viz._plotArea, c = viz._chartTransform;
    const clientX = r.left + c.x + a.x + a.width * fx, clientY = r.top + c.y + a.y + 4;
    const target = el.querySelector('[data-key="plot-hover-surface"]') || surface;
    target.dispatchEvent(new MouseEvent("mousemove", {clientX, clientY, bubbles: true}));
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));
    const tip = document.querySelector(".d3plus-tooltip");
    return tip
      ? Array.from(tip.querySelectorAll("tbody tr")).map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent))
      : [];
  };
};

const run = (fn, arg) => render("", new Function("arg", `return (${helpers})(), (${fn})(arg);`), arg);

const bands = [["p5", "p95", "90%"], ["p25", "p75", "50%"]];

it("LinePlot draws nested bands outermost first, shaded light to dark", {timeout: 120000}, async function () {
  const out = await run(async bands => {
    const {el, viz} = await window.__draw("LinePlot", v =>
      v.data(window.__fan("s")).groupBy("id").x("t").y("v").confidence(bands),
    );
    return {
      ...window.__summary(viz),
      domain: viz._yAxis._d3Scale.domain(),
      nan: window.__nan(el),
      inner: el.querySelectorAll("path[data-key='s::band-1']").length,
      getter: viz.confidence().length,
    };
  }, bands);
  assert.deepStrictEqual(out.bands.map(b => b.key), ["s", "s::band-1"], "outermost first");
  assert.strictEqual(out.bands[0].opacity, 0.15, "the widest band is the lightest");
  const inner = 1 - (1 - out.bands[0].opacity) * (1 - out.bands[1].opacity);
  assert.ok(Math.abs(inner - 0.6) < 1e-4, `the narrowest composites darkest (${inner})`);
  assert.strictEqual(out.bands[0].fill, out.bands[1].fill, "in the line's color");
  assert.ok(out.dashes.every(d => d.length <= 1), "solid lines");
  assert.ok(Math.min(...out.domain) <= 11 && Math.max(...out.domain) >= 27, `the axis fits the outer band (${out.domain})`);
  assert.strictEqual(out.inner, 1, "painted as SVG");
  assert.strictEqual(out.getter, 2, "the getter returns every band");
  assert.strictEqual(out.nan, 0);
});

it("confidence with one [lower, upper] pair draws exactly as before", {timeout: 120000}, async function () {
  const out = await run(async () => {
    const draw = confidence =>
      window.__draw("LinePlot", v =>
        v.data(window.__fan("a").concat(window.__fan("b", 20))).groupBy("id").x("t").y("v").confidence(confidence),
      );
    const pair = await draw(["p5", "p95"]);
    const listed = await draw([["p5", "p95"]]);
    const fns = await draw([d => d.p5, d => d.p95]);
    const scene = viz => JSON.stringify(window.__flat(viz._chartScene).filter(n => n.shapeType === "Area").map(n => [n.key, n.d, n.paint]));
    return {
      summary: window.__summary(pair.viz),
      same: scene(pair.viz) === scene(listed.viz) && scene(pair.viz) === scene(fns.viz),
      shared: await window.__hover(pair.el, pair.viz, 0.98),
    };
  });
  const rows = await run(async () => {
    const {el, viz} = await window.__draw("LinePlot", v =>
      v.data(window.__fan("a")).groupBy("id").x("t").y("v").confidence(["p5", "p95"]),
    );
    return window.__hover(el, viz, 0.98);
  });
  assert.deepStrictEqual(out.summary.bands.map(b => [b.key, b.opacity]), [["a", 0.5], ["b", 0.5]],
    "one band per line, keyed as its line, at half opacity");
  assert.ok(out.summary.dashes.every(d => d.length <= 1), "solid lines");
  assert.ok(out.same, "a pair, a list of one pair, and accessor functions draw the same bands");
  assert.deepStrictEqual(rows, [["t", "2009"], ["v", "19"], ["Lower Bound", "11"], ["Upper Bound", "27"]]);
  assert.deepStrictEqual(out.shared, [["b", "29 (21 – 37)"], ["a", "19 (11 – 27)"]]);
});

it("nested band tooltips list each band's range; the shared tooltip shows the outermost", {timeout: 120000}, async function () {
  const hover = ([series, locale, bands]) =>
    run(
      async ([series, locale, bands]) => {
        const data = series.flatMap(([id, level]) => window.__fan(id, level));
        const {el, viz} = await window.__draw("LinePlot", v =>
          v.data(data).groupBy("id").x("t").y("v").locale(locale).confidence(bands),
        );
        return window.__hover(el, viz, 0.98);
      },
      [series, locale, bands],
    );
  const unlabeled = bands.map(b => b.slice(0, 2));
  const one = await hover([[["s", 10]], "en-US", bands]);
  const two = await hover([[["a", 10], ["b", 20]], "en-US", unlabeled]);
  const es = await hover([[["s", 10]], "es-ES", unlabeled]);
  assert.deepStrictEqual(one, [["t", "2009"], ["v", "19"], ["90%", "11 – 27"], ["50%", "15 – 23"]]);
  assert.deepStrictEqual(two, [["b", "29 (21 – 37)"], ["a", "19 (11 – 27)"]]);
  assert.deepStrictEqual(es.slice(2), [["Banda 1", "11,0 – 27,0"], ["Banda 2", "15,0 – 23,0"]], "unlabeled bands, translated and locale-formatted");
});

it("nested bands paint the same on Canvas, with tooltips", {timeout: 120000}, async function () {
  const out = await run(async bands => {
    const configure = v => v.data(window.__fan("s")).groupBy("id").x("t").y("v").confidence(bands);
    const svg = await window.__draw("LinePlot", configure);
    const canvas = await window.__draw("LinePlot", v => configure(v.renderer("canvas")));
    return {
      hasCanvas: !!canvas.el.querySelector("canvas.d3plus-render-canvas"),
      noSvgBands: canvas.el.querySelectorAll("path[data-key='s::band-1']").length,
      same: JSON.stringify(window.__summary(svg.viz)) === JSON.stringify(window.__summary(canvas.viz)),
      rows: await window.__hover(canvas.el, canvas.viz, 0.98),
    };
  }, bands);
  assert.ok(out.hasCanvas, "canvas mounted");
  assert.strictEqual(out.noSvgBands, 0, "nothing painted as SVG");
  assert.ok(out.same, "both backends build the same bands");
  assert.deepStrictEqual(out.rows.slice(2), [["90%", "11 – 27"], ["50%", "15 – 23"]]);
});

it("nested bands in small multiples: each panel draws its own bands", {timeout: 120000}, async function () {
  const out = await run(async bands => {
    const data = window.__fan("North", 10, 5, {region: "North"}).concat(window.__fan("South", 30, 3, {region: "South"}));
    const result = {};
    for (const renderer of ["svg", "canvas"]) {
      const {el, viz} = await window.__draw("LinePlot", v =>
        v.data(data).groupBy("id").facet("region").x("t").y("v").confidence(bands).renderer(renderer),
      );
      result[renderer] = {
        bands: window.__flat(viz._chartScene).filter(n => n.shapeType === "Area").map(n => n.key),
        nan: window.__nan(el),
      };
    }
    return result;
  }, bands);
  for (const renderer of ["svg", "canvas"]) {
    const r = out[renderer];
    assert.strictEqual(r.bands.length, 4, `${renderer}: two bands per panel (${r.bands})`);
    assert.ok(r.bands.some(k => /North$/.test(k)) && r.bands.some(k => /South::band-1$/.test(k)), `${renderer}: keyed per panel`);
    assert.strictEqual(r.nan, 0);
  }
});
