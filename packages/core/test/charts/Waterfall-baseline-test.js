import assert from "assert";
import {Waterfall} from "../../es/index.js";
import {render, closeBrowser} from "../playwright.js";

/**
    Waterfall in real Chromium, zoomed in on a bridge between large totals: a
    value-axis domain that stops short of zero (`yDomain([980])`) keeps a 0
    tick behind a break, and subtotal bars rise from that 0 through it. Once
    `baseline(n)` sets the value axis's minimum (#945), it paints the same.
*/

after(closeBrowser);

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
  this.timeout(60000);
  assertFromZero(await render(body, probe, [bridge, {yDomain: [980]}]), undefined, "vertical");
  const flat = await render(body, probe, [bridge, {}]);
  assert.ok(Math.min(...flat.domain) <= 0, "the axis includes zero by default");
  assert.strictEqual(flat.brk, null, "and doesn't break");
});

it("Waterfall's domain break works for horizontal bars and small multiples", async function () {
  this.timeout(60000);
  const horizontal = await render(body, probe, [bridge, {xDomain: [980], discrete: "y", x: "v", y: "step"}]);
  assertFromZero(horizontal, undefined, "horizontal");
  const years = [2024, 2025].flatMap(yr => bridge.map(d => ({...d, yr})));
  const facet = await render(body, probe, [years, {yDomain: [980], facet: "yr"}]);
  assert.ok(find(facet, "Opening", 2024) && find(facet, "Opening", 2025), "both panels draw");
});

it("Waterfall's baseline(980) paints exactly what yDomain([980]) does", async function () {
  this.timeout(60000);
  // Runs once Plot's `baseline` sets the value axis's minimum (#945), which
  // leaves the chart's own baseline, where bars start, at 0.
  if (new Waterfall().baseline(980).schema.baseline !== 0) this.skip();
  for (const [a, b, label] of [
    [{baseline: 980}, {yDomain: [980]}, "vertical"],
    [{baseline: 980, discrete: "y", x: "v", y: "step"}, {xDomain: [980], discrete: "y", x: "v", y: "step"}, "horizontal"],
  ]) {
    const [one, two] = [await render(body, probe, [bridge, a]), await render(body, probe, [bridge, b])];
    assert.deepStrictEqual(one.domain, two.domain, `${label}: the same domain`);
    assert.strictEqual(one.brk, two.brk, `${label}: the same break`);
    assert.deepStrictEqual(one.bars, two.bars, `${label}: the same bars`);
    assert.deepStrictEqual(one.scene, two.scene, `${label}: the same scene`);
  }
});
