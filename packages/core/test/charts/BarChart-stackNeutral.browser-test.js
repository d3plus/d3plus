import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `stackNeutral` centers a diverging stacked BarChart on a neutral series,
    as a Likert chart does, on SVG and Canvas: the neutral segment straddles
    zero, the other answers stack outward from it in data order, the legend
    reads along the axis, and the tooltip reports the full neutral value.
*/

const answers = {
  "Strongly disagree": -10,
  Disagree: -20,
  Neutral: 40,
  Agree: 25,
  "Strongly agree": 15,
};
const rows = (year = 2024) =>
  ["Q1", "Q2"].flatMap(q =>
    Object.entries(answers).map(([answer, v]) => ({q, answer, v, year})),
  );

/** Renders a BarChart and reports its bars along the value axis, legend and tooltip. */
const draw = ([{neutralFn, ...config}, data, renderer]) =>
  new Promise(resolve => {
    // Functions don't cross into the page, so an accessor comes as source.
    if (neutralFn) config.stackNeutral = new Function(`return ${neutralFn}`)();
    const viz = new window.d3plus.BarChart()
      .data(data)
      .groupBy("answer")
      .stacked(true)
      .config(config)
      .renderer(renderer)
      .width(700)
      .height(400)
      .duration(0)
      .select("#viz");
    viz.render(async () => {
      const flat = nodes =>
        nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const horizontal = viz.schema.discrete === "y";
      const bars = flat(viz._chartScene)
        .filter(n => n.type === "rect" && n.shapeType === "Bar")
        .map(n => {
          const start = horizontal
            ? n.transform.x + n.x
            : n.transform.y + n.y + n.height;
          const size = horizontal ? n.width : -n.height;
          return {
            node: n,
            answer: n.datum.data.answer,
            q: n.datum.data.q,
            year: n.datum.data.year,
            lo: Math.min(start, start + size),
            hi: Math.max(start, start + size),
          };
        });
      // The value axis' zero, in the bars' coordinates.
      const scale = horizontal ? viz._xFunc : viz._yFunc;
      const zero = config.facet ? null : scale(0);
      const neutral = bars.find(b => b.answer === "Neutral");
      const event = type =>
        viz._routeSceneEvent({
          type,
          point: [1, 1],
          pick: {
            node: neutral.node,
            datum: neutral.node.datum,
            index: neutral.node.index,
          },
          nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
        });
      if (!config.facet) {
        event("mouseenter");
        event("mousemove");
        await new Promise(r => setTimeout(r, 100));
      }
      const tooltip = document.querySelector(".d3plus-tooltip");
      resolve({
        bars: bars.map(b => ({
          answer: b.answer,
          q: b.q,
          year: b.year,
          mid: (b.lo + b.hi) / 2,
        })),
        zero,
        legend: viz._legendClass.data().map(d => d.answer),
        tooltip: tooltip ? tooltip.textContent : "",
        canvas: Boolean(document.querySelector("#viz canvas")),
      });
    });
  });

const chart = (config, renderer, data = rows()) =>
  render('<div id="viz" style="width:700px;height:400px"></div>', draw, [
    config,
    data,
    renderer,
  ]);

const near = (a, b, label) =>
  assert.ok(Math.abs(a - b) < 0.5, `${label}: ${a} ≈ ${b}`);

/** The answers of one stack, in order along the value axis. */
const along = (bars, q = "Q1") =>
  bars
    .filter(b => b.q === q)
    .sort((a, b) => a.mid - b.mid)
    .map(b => b.answer);

const order = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
];

for (const renderer of ["svg", "canvas"]) {
  it(`stackNeutral: horizontal bars straddle zero, reading along the scale (${renderer})`, async () => {
    const out = await chart(
      {stackNeutral: "Neutral", discrete: "y", x: "v", y: "q"},
      renderer,
    );
    assert.strictEqual(out.canvas, renderer === "canvas");
    for (const q of ["Q1", "Q2"]) {
      const n = out.bars.find(b => b.q === q && b.answer === "Neutral");
      near(n.mid, out.zero, `${q} neutral centered on zero`);
      assert.deepStrictEqual(along(out.bars, q), order);
    }
    assert.deepStrictEqual(out.legend, order, "legend reads along the axis");
    assert.ok(/v\s*40/.test(out.tooltip), out.tooltip);
    assert.ok(/Share\s*36\.4%/.test(out.tooltip), out.tooltip);
  });

  it(`stackNeutral: vertical bars straddle zero, low answers below (${renderer})`, async () => {
    const out = await chart(
      {neutralFn: 'd => d.answer === "Neutral"', x: "q", y: "v"},
      renderer,
    );
    const n = out.bars.find(b => b.q === "Q1" && b.answer === "Neutral");
    near(n.mid, out.zero, "neutral centered on zero");
    // Pixels grow downward: the scale reads from the bottom of the chart.
    assert.deepStrictEqual(along(out.bars).reverse(), order);
    assert.deepStrictEqual(out.legend, order);
  });

  it(`stackNeutral: each small multiple stacks along the scale (${renderer})`, async () => {
    const out = await chart(
      {stackNeutral: "Neutral", discrete: "y", facet: "year", x: "v", y: "q"},
      renderer,
      [...rows(2023), ...rows(2024)],
    );
    const neutral = out.bars.filter(b => b.answer === "Neutral");
    assert.strictEqual(neutral.length, 4);
    const years = new Set(neutral.map(b => b.year));
    assert.deepStrictEqual([...years].sort(), [2023, 2024]);
    for (const year of years) {
      const bars = out.bars.filter(b => b.year === year);
      assert.deepStrictEqual(along(bars), order, `${year} reads in order`);
    }
  });

  it(`stackNeutral: an explicit stackOrder orders each side outward (${renderer})`, async () => {
    const out = await chart(
      {
        stackNeutral: "Neutral",
        stackOrder: "keyReverse",
        discrete: "y",
        x: "v",
        y: "q",
      },
      renderer,
    );
    // Z→A from the neutral: "Strongly …" sits next to it on each side.
    assert.deepStrictEqual(along(out.bars), [
      "Disagree",
      "Strongly disagree",
      "Neutral",
      "Strongly agree",
      "Agree",
    ]);
    const n = out.bars.find(b => b.q === "Q1" && b.answer === "Neutral");
    near(n.mid, out.zero, "neutral centered on zero");
  });

  it(`stackNeutral: ignored under another stackOffset (${renderer})`, async () => {
    const out = await chart(
      {
        stackNeutral: "Neutral",
        stackOffset: "none",
        discrete: "y",
        x: "v",
        y: "q",
      },
      renderer,
    );
    const n = out.bars.find(b => b.q === "Q1" && b.answer === "Neutral");
    assert.ok(Math.abs(n.mid - out.zero) > 5, "neutral not centered");
  });
}
