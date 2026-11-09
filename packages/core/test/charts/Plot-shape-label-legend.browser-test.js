import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot's default legend hides when every shape shows its own name: the
    eight named scatter points of the docs' basic example draw no legend,
    while a point whose label is hidden, labels that read differently from
    the legend, a legend named by color category, or a `legend` of the
    user's own keep it.
*/

const BASIC = [
  {id: "alpha", x: 4, y: 7},
  {id: "beta", x: 5, y: 2},
  {id: "gamma", x: 6, y: 13},
  {id: "delta", x: 2, y: 11},
  {id: "epsilon", x: 5, y: 5},
  {id: "zeta", x: 3, y: 4},
  {id: "eta", x: 2.5, y: 6},
  {id: "theta", x: 5.5, y: 9},
];

/** 60 points packed into one spot, too crowded for every label. */
const CROWDED = Array.from({length: 60}, (_, i) => ({
  id: `Point ${i + 1}`,
  x: 50 + (i % 6) * 0.1,
  y: 50 + Math.floor(i / 6) * 0.1,
}));

const draw = ({data, renderer, config}) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Plot()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .renderer(renderer)
      .duration(0)
      .config(new Function(`return ${config}`)())
      .select("#viz");
    viz.render(() => {
      const nodes = [];
      const walk = n => {
        nodes.push(n);
        (n.children || []).forEach(walk);
      };
      walk(viz.toScene().root);
      const ids = new Set(data.map(d => d.id));
      resolve({
        labels: nodes.filter(
          n =>
            n.type === "text" &&
            ids.has(n.datum?.data?.id) &&
            n.lines.some(l => l.text.trim()),
        ).length,
        legend:
          nodes.some(n => n.key === "viz-legend") &&
          (viz._legendClass._lineData || []).length > 0,
      });
    });
  });

const page = '<div id="viz" style="width:600px;height:400px"></div>';
const run = (renderer, data, config = "{}") =>
  render(page, draw, {data, renderer, config});

for (const renderer of ["svg", "canvas"]) {
  it(`named points hide the default legend (${renderer})`, async () => {
    const out = await run(renderer, BASIC);
    assert.strictEqual(out.labels, BASIC.length, "every point is named");
    assert.ok(!out.legend, "no legend");
  });

  it(`a point without its label keeps the legend (${renderer})`, async () => {
    const out = await run(renderer, CROWDED);
    assert.ok(out.labels < CROWDED.length, `${out.labels} labels`);
    assert.ok(out.legend, "the legend names the rest");
    const unnamed = await run(
      renderer,
      BASIC,
      "{shapeConfig: {Circle: {label: false}}}",
    );
    assert.strictEqual(unnamed.labels, 0);
    assert.ok(unnamed.legend, "label: false keeps the legend");
  });

  it(`labels that read differently from the legend keep it (${renderer})`, async () => {
    const out = await run(
      renderer,
      BASIC,
      "{shapeConfig: {Circle: {label: d => `#${d.id}`}}}",
    );
    assert.ok(out.legend, "the labels don't say what the legend does");
    const categories = await run(
      renderer,
      BASIC.map((d, i) => ({...d, kind: i % 2 ? "odd" : "even"})),
      "{color: 'kind'}",
    );
    assert.ok(categories.legend, "a legend of color categories stays");
  });

  it(`a legend of the user's own wins (${renderer})`, async () => {
    const out = await run(renderer, BASIC, "{legend: true}");
    assert.strictEqual(out.labels, BASIC.length);
    assert.ok(out.legend, "legend: true");
  });
}
