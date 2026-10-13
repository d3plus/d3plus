import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Waterfall in real Chromium: `baseline` lifts the subtotal bars (and the
    axis with them) off zero, and a value-axis domain short of the baseline draws
    a break.
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
    value axis and each bar's pixel span along it.
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
      const bars = [];
      const walk = (n, dx = 0, dy = 0) => {
        const t = n.transform || {x: 0, y: 0};
        const ox = dx + (t.x || 0), oy = dy + (t.y || 0);
        if (n.shapeType === "Bar" && n.type === "rect") {
          let row = n.datum;
          while (row && (row.__d3plus__ || row.__d3plusShape__) && row.data) row = row.data;
          const o = vertical ? oy : ox;
          bars.push({step: row.step, panel: row.yr, span: [o + n[along], o + n[along] + n[size]]});
        }
        (n.children || []).forEach(c => walk(c, ox, oy));
      };
      viz._chartScene.forEach(n => walk(n));
      const scene = axis.toScene().children;
      resolve({
        domain: axis._d3Scale.domain().map(Number),
        marks: scene.filter(n => String(n.key).startsWith("baseline-break")).length,
        bars,
      });
    });
  });

const body = '<div id="viz" style="width:700px;height:420px;font-family:sans-serif;"></div>';
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b));
const length = bar => Math.abs(bar.span[1] - bar.span[0]);
const find = (out, step, panel) => out.bars.find(b => b.step === step && b.panel === panel);

/** Asserts a bridge's subtotals rise from 980: the Opening bar is 20 long, Price 15. */
function assertRaised(out, panel, label) {
  const opening = find(out, "Opening", panel), price = find(out, "Price", panel), closing = find(out, "Closing", panel);
  assert.ok(opening && price && closing, `${label}: bars drawn`);
  assert.ok(near(length(opening) / length(price), 20 / 15), `${label}: Opening spans 980 to 1,000 (${length(opening)} vs ${length(price)})`);
  assert.ok(near(length(closing) / length(price), 40 / 15), `${label}: Closing spans 980 to 1,020`);
}

it("Waterfall's baseline lifts subtotals and the axis off zero, without a break", async function () {
  this.timeout(60000);
  const out = await render(body, probe, [bridge, {baseline: 980}]);
  assertRaised(out, undefined, "vertical");
  const [lo, hi] = [Math.min(...out.domain), Math.max(...out.domain)];
  assert.ok(lo > 0 && lo <= 980, `the axis starts near the baseline, not zero (${out.domain})`);
  assert.ok(hi >= 1020);
  assert.strictEqual(out.marks, 0, "no baseline break");

  const flat = await render(body, probe, [bridge, {}]);
  assert.ok(Math.min(...flat.domain) <= 0, "the axis includes zero by default");
});

it("Waterfall's baseline works for horizontal bars and small multiples", async function () {
  this.timeout(60000);
  const horizontal = await render(body, probe, [bridge, {baseline: 980, discrete: "y", x: "v", y: "step"}]);
  assertRaised(horizontal, undefined, "horizontal");
  assert.ok(Math.min(...horizontal.domain) > 0, `the x axis leaves zero out (${horizontal.domain})`);

  const years = [2024, 2025].flatMap(yr => bridge.map(d => ({...d, yr})));
  const facet = await render(body, probe, [years, {baseline: 980, facet: "yr"}]);
  assertRaised(facet, 2024, "2024 panel");
  assertRaised(facet, 2025, "2025 panel");
});

it("Waterfall breaks the value axis when its domain stops short of the baseline", async function () {
  this.timeout(60000);
  const zero = await render(body, probe, [bridge, {yDomain: [980]}]);
  assert.ok(zero.marks > 0, "a yDomain above zero keeps zero behind a break");
  assert.ok(Math.min(...zero.domain) >= 980, `the domain starts at the yDomain (${zero.domain})`);

  const raised = await render(body, probe, [bridge, {baseline: 980, yDomain: [990]}]);
  assert.ok(raised.marks > 0, "a yDomain above the baseline breaks the axis");
  assert.ok(Math.min(...raised.domain) >= 990, `the domain starts at the yDomain (${raised.domain})`);
});
