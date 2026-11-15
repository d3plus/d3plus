import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Venn in a real browser, on SVG and Canvas: one path per region (single
    sets first, overlaps over them), blended overlap colors, circles sized
    to their sets, a legend of sets; hovering an overlap highlights it with
    the overlaps inside it and shows its exact size; hiding a set drops its
    overlaps; the classic layout and small multiples.
*/

const data = [
  {sets: ["Python"], size: 540},
  {sets: ["SQL"], size: 480},
  {sets: ["R"], size: 210},
  {sets: ["Python", "SQL"], size: 260},
  {sets: ["Python", "R"], size: 120},
  {sets: ["R", "SQL"], size: 95},
  {sets: ["Python", "R", "SQL"], size: 70},
];

/** In-page helpers: build + render a chart, list its regions, and wait. */
const setup = `
  window.build = (opts = {}) => new Promise(resolve => {
    const chart = new window.d3plus.Venn()
      .select("#viz")
      .data((opts.data || window.DATA).map(d => ({...d})))
      .duration(0)
      .width(600).height(400);
    if (opts.renderer) chart.renderer(opts.renderer);
    if (opts.config) chart.config(opts.config);
    chart.render(() => resolve(chart));
  });
  window.flat = nodes => nodes.flatMap(n => [n, ...(n.children ? window.flat(n.children) : [])]);
  window.regions = chart => window.flat(chart._chartScene)
    .filter(n => n.type === "path" && /venn-\\[/.test(String(n.key)));
  window.setsOf = n => JSON.parse(String(n.key).replace(/^.*venn-/, ""));
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
`;

const page = (fn, arg) =>
  render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    new Function(
      "arg",
      `window.DATA = arg.data; ${setup}; return (${fn})(arg.arg);`,
    ),
    {data, arg},
  );

for (const renderer of ["svg", "canvas"]) {
  it(`Venn (${renderer}): a path per region, overlaps over circles, blended colors, circles sized to their sets`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const regions = window.regions(chart);
      const fill = sets =>
        regions.find(n => window.setsOf(n).join() === sets).paint.fill;
      const c = chart.ctx.vennCircles;
      const area = k => Math.PI * c[k].radius ** 2;
      return {
        sets: regions.map(n => window.setsOf(n).join("+")),
        python: fill("Python"),
        sql: fill("SQL"),
        pair: fill("Python,SQL"),
        ratio: area("SQL") / area("Python"),
        rRatio: area("R") / area("Python"),
        labels: window
          .flat(chart._chartScene)
          .filter(n => n.type === "text" && /venn-label/.test(String(n.key)))
          .length,
        aria: regions.every(n => n.aria && n.aria.label),
        legend: chart._legendClass.data().map(d => d.sets),
        dom:
          renderer === "svg"
            ? document.querySelectorAll("#viz svg path[data-key^='venn-']")
                .length
            : document.querySelectorAll("#viz canvas").length,
      };
    }, renderer);
    assert.deepStrictEqual(out.sets, [
      "Python",
      "SQL",
      "R",
      "Python+SQL",
      "Python+R",
      "R+SQL",
      "Python+R+SQL",
    ]);
    assert.notStrictEqual(out.pair, out.python);
    assert.notStrictEqual(out.pair, out.sql);
    assert.ok(Math.abs(out.ratio - 480 / 540) < 1e-6, `${out.ratio}`);
    assert.ok(Math.abs(out.rRatio - 210 / 540) < 1e-6, `${out.rRatio}`);
    assert.ok(out.labels > 0, "labels");
    assert.ok(out.aria, "each region is described");
    assert.deepStrictEqual(out.legend, [["Python"], ["SQL"], ["R"]]);
    assert.ok(out.dom >= (renderer === "svg" ? 7 : 1));
  });

  it(`Venn (${renderer}): hovering an overlap highlights it and the overlap inside it, with its sizes in the tooltip`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const target = window
        .regions(chart)
        .find(n => window.setsOf(n).join() === "Python,SQL");
      const laid = chart.ctx.vennRegions.find(
        r => r.sets.join() === "Python,SQL",
      );
      const host = document.querySelector(
        renderer === "svg" ? "#viz svg.d3plus-render-svg" : "#viz canvas",
      );
      const box = host.getBoundingClientRect();
      const t = chart._chartTransform || {};
      const at = laid ? laid.label : {x: 0, y: 0};
      const clientX = box.left + (t.x || 0) + at.x;
      const clientY = box.top + (t.y || 0) + at.y;
      if (renderer === "canvas")
        host.dispatchEvent(
          new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
        );
      else
        for (const type of ["mouseenter", "mousemove"])
          chart._routeSceneEvent({
            type,
            point: [1, 1],
            pick: {node: target, datum: target.datum, index: target.index},
            nativeEvent: {stopPropagation() {}, clientX, clientY},
          });
      await window.wait(150);
      const bright = window
        .regions(chart)
        .filter(n => chart._hover && chart._hover(n.datum, n.index))
        .map(n => window.setsOf(n).join("+"));
      const tooltip = document.querySelector(".d3plus-tooltip");
      return {
        laid: Boolean(laid),
        bright,
        tooltip: tooltip ? tooltip.textContent : "",
      };
    }, renderer);
    assert.ok(out.laid, "the layout keeps its regions");
    assert.deepStrictEqual(out.bright, ["Python+SQL", "Python+R+SQL"]);
    assert.ok(/Python ∩ SQL/.test(out.tooltip), out.tooltip);
    assert.ok(/Value\s*260/.test(out.tooltip), out.tooltip);
    assert.ok(/Only in This Region\s*190/.test(out.tooltip), out.tooltip);
  });

  it(`Venn (${renderer}): hovering a set in the legend highlights its circle and every overlap in it`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const legend = chart._legendClass.data();
      const r = legend.find(d => d.sets[0] === "R");
      chart.schema.on.mouseenter.call(chart, r, 0);
      await window.wait(50);
      return window
        .regions(chart)
        .filter(n => chart._hover && chart._hover(n.datum, n.index))
        .map(n => window.setsOf(n).join("+"));
    }, renderer);
    assert.deepStrictEqual(out, ["R", "Python+R", "R+SQL", "Python+R+SQL"]);
  });

  it(`Venn (${renderer}): hiding a set drops its circle and its overlaps`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const legend = chart._legendClass.data();
      chart.schema.on["click.legend"].call(
        chart,
        legend.find(d => d.sets[0] === "R"),
        0,
        undefined,
        {shiftKey: false},
      );
      for (let k = 0; k < 50 && chart._hidden.length === 0; k++)
        await window.wait(20);
      await window.wait(200);
      return {
        hidden: chart._hidden,
        sets: window.regions(chart).map(n => window.setsOf(n).join("+")),
        legend: chart._legendClass.data().length,
      };
    }, renderer);
    assert.deepStrictEqual(out.hidden, ["R"]);
    assert.deepStrictEqual(out.sets, ["Python", "SQL", "Python+SQL"]);
    assert.strictEqual(out.legend, 3, "the legend still lists every set");
  });

  it(`Venn (${renderer}): the classic layout, sets apart, and small multiples`, async () => {
    const out = await page(async renderer => {
      const classic = await window.build({
        renderer,
        config: {proportional: false},
      });
      const radii = Object.values(classic.ctx.vennCircles).map(c => c.radius);
      const apart = await window.build({
        renderer,
        data: [
          {sets: ["A"], size: 10},
          {sets: ["B"], size: 10},
        ],
      });
      const facet = await window.build({
        renderer,
        data: [
          {year: 2023, sets: ["A"], size: 10},
          {year: 2023, sets: ["B"], size: 8},
          {year: 2023, sets: ["A", "B"], size: 3},
          {year: 2024, sets: ["A"], size: 12},
          {year: 2024, sets: ["B"], size: 6},
          {year: 2024, sets: ["A", "B"], size: 4},
        ],
        config: {facet: "year"},
      });
      return {
        radii,
        classic: window.regions(classic).length,
        apart: window.regions(apart).map(n => window.setsOf(n).join("+")),
        facetKeys: window
          .regions(facet)
          .map(n => String(n.key).split("/")[0])
          .filter((k, i, all) => all.indexOf(k) === i),
        facetPaths: window.regions(facet).length,
      };
    }, renderer);
    assert.strictEqual(out.classic, 7);
    assert.ok(out.radii.every(r => Math.abs(r - out.radii[0]) < 1e-9));
    assert.deepStrictEqual(out.apart, ["A", "B"]);
    assert.deepStrictEqual(out.facetKeys, ["facet-2023", "facet-2024"]);
    assert.strictEqual(out.facetPaths, 6);
  });
}
