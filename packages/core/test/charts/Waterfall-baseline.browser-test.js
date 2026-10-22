import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {Waterfall} from "../../index.ts";
import {render} from "~test/browser/render.js";

/**
    Waterfall in real Chromium, zoomed in on a bridge between large totals: a
    value-axis domain that stops short of zero (`yDomain([980])`) keeps a 0
    tick behind a break, and subtotal bars rise from that 0 through it.
    `baseline(n)` sets the value axis's minimum (#945), so it paints the same.
*/

const bridge = [
  {step: "Opening", v: 1000, sub: true},
  {step: "Price", v: 15},
  {step: "Volume", v: -8},
  {step: "Mix", v: 13},
  {step: "Closing", sub: true},
];

/**
    Renders a Waterfall of `data` configured by `config`, and reports its
    value axis, the 0 tick's position, each bar's pixel span along the axis,
    and the painted scene as geometry only.
*/
const probe = ([data, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Waterfall()
      .data(data)
      .x("step")
      .y("v")
      .subtotal("sub")
      .duration(0)
      .config(config)
      .select("#viz");
    viz.render(() => {
      const vertical = viz.schema.discrete !== "y";
      const axis = vertical ? viz._yAxis : viz._xAxis;
      const along = vertical ? "y" : "x";
      const size = vertical ? "height" : "width";
      const round = v => Math.round(v * 100) / 100;
      const bars = [];
      const walk = (n, o = 0) => {
        const t = o + ((n.transform && n.transform[along]) || 0);
        if (n.shapeType === "Bar" && n.type === "rect") {
          let row = n.datum;
          while (row && (row.__d3plus__ || row.__d3plusShape__) && row.data) row = row.data;
          bars.push({step: row.step, panel: row.yr, span: [round(t + n[along]), round(t + n[along] + n[size])]});
        }
        (n.children || []).forEach(c => walk(c, t));
      };
      viz._chartScene.forEach(n => walk(n));
      const GEOMETRY = ["type", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "r", "d", "points", "text", "transform"];
      const geometry = n => {
        const out = {};
        for (const k of GEOMETRY) {
          if (n[k] === undefined) continue;
          out[k] = JSON.parse(JSON.stringify(n[k], (_, v) => (typeof v === "number" ? round(v) : v)));
        }
        if (n.children) out.children = n.children.map(geometry);
        return out;
      };
      resolve({
        domain: axis._d3Scale.domain().map(Number),
        brk: axis._baselineBreak ? axis._baselineBreak.value : null,
        // Pixel lengths from 0 to 1,000 and from 980 to 1,000 along the axis.
        to1000: round(Math.abs(axis._getPosition(1000) - axis._getPosition(0))),
        from980: round(Math.abs(axis._getPosition(1000) - axis._getPosition(980))),
        bars,
        scene: viz._sceneRenderer._scene.root.children.map(geometry),
      });
    });
  });

const body = '<div id="viz" style="width:700px;height:420px;font-family:sans-serif;"></div>';
const length = bar => Math.abs(bar.span[1] - bar.span[0]);
const find = (out, step, panel) => out.bars.find(b => b.step === step && b.panel === panel);

/** Asserts the subtotals rise from the 0 tick through the break: Opening spans 0 to 1,000. */
function assertFromZero(out, panel, label) {
  assert.strictEqual(out.brk, 0, `${label}: the axis breaks back to a 0 tick`);
  assert.ok(Math.min(...out.domain) >= 980, `${label}: the domain starts at 980 (${out.domain})`);
  const opening = find(out, "Opening", panel), closing = find(out, "Closing", panel);
  assert.ok(opening && closing, `${label}: bars drawn`);
  assert.ok(Math.abs(length(opening) - out.to1000) <= 2, `${label}: Opening spans 0 to 1,000 (${length(opening)} vs ${out.to1000})`);
  assert.ok(length(opening) > out.from980 + 10, `${label}: Opening runs through the break, not from 980`);
  assert.ok(length(closing) > length(opening), `${label}: Closing (1,020) is longer than Opening`);
}

it("Waterfall's yDomain([980]) draws subtotals from the 0 tick through the break", async function () {
  assertFromZero(await render(body, probe, [bridge, {yDomain: [980]}]), undefined, "vertical");
  const flat = await render(body, probe, [bridge, {}]);
  assert.ok(Math.min(...flat.domain) <= 0, "the axis includes zero by default");
  assert.strictEqual(flat.brk, null, "and doesn't break");
});

it("Waterfall's domain break works for horizontal bars and small multiples", async function () {
  const horizontal = await render(body, probe, [bridge, {xDomain: [980], discrete: "y", x: "v", y: "step"}]);
  assertFromZero(horizontal, undefined, "horizontal");
  const years = [2024, 2025].flatMap(yr => bridge.map(d => ({...d, yr})));
  const facet = await render(body, probe, [years, {yDomain: [980], facet: "yr"}]);
  assert.ok(find(facet, "Opening", 2024) && find(facet, "Opening", 2025), "both panels draw");
});

it("Waterfall's baseline(980) paints exactly what yDomain([980]) does", async function () {
  // Plot's `baseline` sets the value axis's minimum (#945), leaving the
  // chart's own baseline, where bars start, at 0.
  assert.strictEqual(new Waterfall().baseline(980).schema.baseline, 0);
  for (const [a, b, label] of [
    [{baseline: 980}, {yDomain: [980]}, "vertical"],
    [{baseline: 980, discrete: "y", x: "v", y: "step"}, {xDomain: [980], discrete: "y", x: "v", y: "step"}, "horizontal"],
  ]) {
    const [one, two] = [await render(body, probe, [bridge, a]), await render(body, probe, [bridge, b])];
    assert.deepStrictEqual(one.domain, two.domain, `${label}: the same domain`);
    // Only 980 is pinned: the far end is rounded past the data's 1,020 top.
    const [lo, hi] = one.domain.slice().sort((p, q) => p - q);
    assert.strictEqual(lo, 980, `${label}: the domain starts at 980`);
    assert.ok(hi > 1020 && hi % 10 === 0, `${label}: the far end is rounded (${hi})`);
    assert.strictEqual(one.brk, two.brk, `${label}: the same break`);
    assert.deepStrictEqual(one.bars, two.bars, `${label}: the same bars`);
    assert.deepStrictEqual(one.scene, two.scene, `${label}: the same scene`);
  }
});

/**
    Renders `chart` (Waterfall, or a BarChart of the same running totals) with
    `config`, and reports the break-mask groups, the hole each cuts, and, per
    bar, whether it sits inside a mask. On Canvas it also samples the Closing
    total bar's pixels at the middle of the break's gap and just past it.
*/
const maskProbe = ([chart, data, config, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]().data(data).duration(0).renderer(renderer).config(config).select("#viz");
    viz.render(() => {
      const vertical = viz.schema.discrete !== "y";
      const axis = vertical ? viz._yAxis : viz._xAxis;
      const masks = [];
      const bars = {};
      let closing;
      const walk = (n, inMask) => {
        const isMask = String(n.key).startsWith("plot-break-mask");
        if (isMask) masks.push(n.key);
        if (n.shapeType === "Bar" && n.type === "rect") {
          let row = n.datum;
          while (row && (row.__d3plus__ || row.__d3plusShape__) && row.data) row = row.data;
          bars[row.step] = Boolean(inMask || isMask);
          if (row.step === "Closing") closing = n;
        }
        (n.children || []).forEach(c => walk(c, inMask || isMask));
      };
      viz._chartScene.forEach(n => walk(n, false));
      const out = {masks, bars, breaks: axis._breaks.map(b => ({baseline: b.baseline, mask: b.mask}))};
      if (renderer === "canvas") {
        const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
        const ratio = canvas.width / canvas.getBoundingClientRect().width;
        const ct = viz._chartTransform;
        const brk = axis._breaks[0];
        const gap = (brk.startPosition + brk.endPosition) / 2;
        const across = vertical
          ? closing.transform.x + closing.x + closing.width / 2
          : closing.transform.y + closing.y + closing.height / 2;
        const px = at => {
          const [px, py] = vertical ? [across + ct.x, at + ct.y] : [at + ct.x, across + ct.y];
          return Array.from(canvas.getContext("2d").getImageData(Math.round(px * ratio), Math.round(py * ratio), 1, 1).data);
        };
        const dir = Math.sign(brk.endPosition - brk.startPosition);
        out.pixels = {gap: px(gap), past: px(brk.endPosition + dir * 12)};
      }
      resolve(out);
    });
  });

const totals = [
  {step: "Opening", v: 1000},
  {step: "Price", v: 1015},
  {step: "Volume", v: 1007},
  {step: "Mix", v: 1020},
  {step: "Closing", v: 1020},
];
const orientations = [
  ["vertical", "y", {x: "step", y: "v", yDomain: [980]}],
  ["horizontal", "x", {discrete: "y", x: "v", y: "step", xDomain: [980]}],
];

it("Waterfall masks its baseline break exactly as BarChart does: across every bar by default, off on request", {timeout: 120000}, async function () {
  for (const [label, axis, config] of orientations) {
    const unmasked = {...config, [`${axis}Config`]: {baselineBreakConfig: {mask: false}}};
    const wf = await render(body, maskProbe, ["Waterfall", bridge, {...config, subtotal: "sub"}, "svg"]);
    const bc = await render(body, maskProbe, ["BarChart", totals, {...config, groupBy: "step"}, "svg"]);
    assert.deepStrictEqual(wf.breaks, [{baseline: true, mask: true}], `${label}: a masked baseline break`);
    assert.deepStrictEqual(wf.breaks, bc.breaks, `${label}: the same break as BarChart`);
    assert.ok(wf.masks.length && wf.masks.every(k => k.startsWith(`plot-break-mask-${axis}`)), `${label}: masked by default (${wf.masks})`);
    assert.deepStrictEqual(wf.masks, bc.masks, `${label}: the same mask as BarChart`);
    assert.ok(wf.bars.Opening && wf.bars.Closing, `${label}: the total bars are inside the mask`);
    assert.ok(Object.values(wf.bars).every(Boolean), `${label}: as is every other bar`);

    const wfOff = await render(body, maskProbe, ["Waterfall", bridge, {...unmasked, subtotal: "sub"}, "svg"]);
    const bcOff = await render(body, maskProbe, ["BarChart", totals, {...unmasked, groupBy: "step"}, "svg"]);
    assert.deepStrictEqual(wfOff.masks, [], `${label}: no mask with mask: false`);
    assert.deepStrictEqual(wfOff.masks, bcOff.masks, `${label}: like BarChart`);
  }
});

it("Waterfall's masked baseline break cuts the gap out of a total bar on Canvas", {timeout: 120000}, async function () {
  // The canvas leaves unpainted pixels transparent, so the page shows through.
  const empty = p => p[3] === 0 || (p[0] > 240 && p[1] > 240 && p[2] > 240);
  for (const [label, axis, config] of orientations) {
    const on = await render(body, maskProbe, ["Waterfall", bridge, {...config, subtotal: "sub"}, "canvas"]);
    assert.ok(empty(on.pixels.gap), `${label}: the gap shows the background (${on.pixels.gap})`);
    assert.ok(!empty(on.pixels.past), `${label}: the bar paints past the gap (${on.pixels.past})`);
    const unmasked = {...config, subtotal: "sub", [`${axis}Config`]: {baselineBreakConfig: {mask: false}}};
    const off = await render(body, maskProbe, ["Waterfall", bridge, unmasked, "canvas"]);
    assert.ok(!empty(off.pixels.gap), `${label}: unmasked, the bar runs solid through the gap (${off.pixels.gap})`);
  }
});

