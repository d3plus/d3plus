import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    The polar charts' value rings and ring labels match Radar's: the ring
    labels lie beneath the marks, with Radar's paint (no halo, full opacity
    unless `levelLabelConfig` says otherwise), the center "0" is labeled, and
    every chrome key carries the chart's own prefix, on SVG and Canvas.
*/

const rows = [
  {id: "a", value: 40},
  {id: "b", value: 25},
  {id: "c", value: 10},
  {id: "d", value: 30},
];

const draw = (chart, config) =>
  render(
    "<div id='svg' style='width:500px;height:420px'></div><div id='canvas' style='width:500px;height:420px'></div>",
    async ({data, chartName, cfg}) => {
      const out = {};
      for (const renderer of ["svg", "canvas"]) {
        const viz = new window.d3plus[chartName]()
          .select(`#${renderer}`)
          .duration(0)
          .renderer(renderer)
          .data(data)
          .config(cfg);
        await new Promise(r => viz.render(r));
        const keys = [];
        const walk = nodes =>
          nodes.forEach(n => {
            keys.push(n.key);
            if (n.children) walk(n.children);
          });
        walk(viz._chartScene);
        const top = viz._chartScene.map(n => n.key);
        const prefix = chartName.toLowerCase();
        const group = viz._chartScene.find(
          n => n.key === `${prefix}-level-labels`,
        );
        const firstMark = viz._chartScene.findIndex(
          n => n.type === "path" && n.datum,
        );
        const result = {
          keys,
          labelsIndex: top.indexOf(`${prefix}-level-labels`),
          ringsIndex: top.indexOf(`${prefix}-radial-circles`),
          firstMark,
          labels: group.children.map(c => ({
            key: c.key,
            text: c.lines[0].text,
            paint: c.paint,
          })),
        };
        if (renderer === "svg") {
          const svg = document.querySelector("#svg svg");
          const label = svg.querySelector(
            `[data-key='${prefix}-level-labels']`,
          );
          const mark = [...svg.querySelectorAll("[data-key]")].find(
            el =>
              el.tagName === "path" &&
              el.getAttribute("data-key") === viz._chartScene[firstMark].key,
          );
          result.domBefore = !!(
            label &&
            mark &&
            label.compareDocumentPosition(mark) &
              Node.DOCUMENT_POSITION_FOLLOWING
          );
          result.texts = [...svg.querySelectorAll("text")].map(
            t => t.textContent,
          );
        } else {
          result.canvas = !!document.querySelector(
            "#canvas canvas.d3plus-render-canvas",
          );
        }
        out[renderer] = result;
      }
      return out;
    },
    {data: rows, chartName: chart, cfg: config},
  );

const check = (out, prefix) => {
  for (const renderer of ["svg", "canvas"]) {
    const r = out[renderer];
    assert.ok(
      r.labelsIndex > r.ringsIndex,
      `${renderer}: ring labels over the rings`,
    );
    assert.ok(
      r.labelsIndex < r.firstMark,
      `${renderer}: ring labels beneath the marks, as Radar's`,
    );
    const zero = r.labels.find(l => l.text === "0");
    assert.ok(zero, `${renderer}: the center 0 is labeled`);
    assert.strictEqual(zero.key, `${prefix}-level-label-0`);
    assert.ok(
      r.labels.every(l => l.paint.opacity === 1 && !l.paint.stroke),
      `${renderer}: Radar's paint, no halo`,
    );
    assert.deepStrictEqual(
      r.keys.filter(k => `${k}`.startsWith("radar-")),
      [],
      `${renderer}: no radar- keys`,
    );
    assert.ok(
      r.keys.includes(`${prefix}-ring-outer`),
      `${renderer}: the outer ring keeps the chart's prefix`,
    );
  }
  assert.ok(out.svg.domBefore, "SVG paints the ring labels before the marks");
  assert.ok(out.svg.texts.includes("0"), "SVG draws the center 0");
  assert.ok(out.canvas.canvas, "Canvas draws");
  assert.deepStrictEqual(
    out.canvas.labels.map(l => l.text),
    out.svg.labels.map(l => l.text),
    "Canvas labels the same rings",
  );
};

it(
  "PolarArea ring labels lie beneath the wedges, the center labeled, keyed polararea-",
  {timeout: 180000},
  async function () {
    check(await draw("PolarArea", {}), "polararea");
  },
);

it(
  "RadialBar circular bar ring labels lie beneath the bars, the inner ring labeled, keyed radialbar-",
  {timeout: 180000},
  async function () {
    check(await draw("RadialBar", {discrete: "angle"}), "radialbar");
  },
);

it(
  "levelLabelConfig fontOpacity carries to the polar ring labels, as on Radar",
  {timeout: 180000},
  async function () {
    const out = await draw("PolarArea", {levelLabelConfig: {fontOpacity: 0.4}});
    assert.ok(out.svg.labels.every(l => l.paint.opacity === 0.4));
  },
);
