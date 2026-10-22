import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {overlaps} from "~test/helpers.js";

/**
    The size legend on Lollipop and Dumbbell: a `size` accessor adds Plot's
    nested-circle key, drawn from the same radius scale as the heads (so its
    outer and inner circles are the largest and smallest heads), on both
    renderers, beside the color legend, and shared across small multiples.
*/

const cities = [
  {city: "Tokyo", region: "Asia", population: 37.4, growth: 0.2},
  {city: "Delhi", region: "Asia", population: 31.0, growth: 3.1},
  {city: "São Paulo", region: "Americas", population: 22.0, growth: 0.9},
  {city: "Mexico City", region: "Americas", population: 21.8, growth: 0.6},
  {city: "Cairo", region: "Africa", population: 21.3, growth: 2.0},
  {city: "Kinshasa", region: "Africa", population: 14.3, growth: 4.4},
];

/**
    Renders the chart `type` with `config`, then reports the size legend
    (from the scene, so it's renderer-agnostic) against the chart's heads,
    plus the on-screen boxes of the legends and heads when drawn as SVG.
*/
const probe = ([type, config, rows]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[type]()
      .data(rows)
      .config(config)
      .width(700)
      .height(450)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const nodes = [];
      const walk = (n, path) => {
        nodes.push({n, path});
        (n.children || []).forEach(c => walk(c, path.concat(n.key)));
      };
      walk(viz.toScene().root, []);
      const inPanel = ({path}) => path.includes("viz-bottomRight");
      const legendCircles = nodes
        .filter(x => inPanel(x) && x.n.type === "circle")
        .map(x => x.n.r);
      const legendText = nodes
        .filter(x => inPanel(x) && x.n.type === "text")
        .map(x => x.n.lines.map(l => l.text).join(" "));
      const heads = nodes
        .filter(
          x =>
            !inPanel(x) &&
            x.n.type === "circle" &&
            x.n.shapeType === "Circle" &&
            x.n.datum &&
            !x.path.includes("viz-legend"),
        )
        .map(x => x.n.r);
      const box = el => {
        if (!el) return null;
        const {left, top, right, bottom} = el.getBoundingClientRect();
        return {left, top, right, bottom};
      };
      const svg = document.querySelector("#viz svg");
      resolve({
        panel: nodes.some(({n}) => n.key === "viz-bottomRight"),
        legendCircles,
        legendText,
        heads,
        boxes: svg
          ? {
              sizeLegend: box(
                svg.querySelector('[data-key="viz-bottomRight"]'),
              ),
              legend: box(svg.querySelector('[data-key="viz-legend"]')),
              heads: [...svg.querySelectorAll("circle")]
                .filter(
                  c =>
                    !c.closest('[data-key="viz-bottomRight"]') &&
                    !c.closest('[data-key="viz-legend"]'),
                )
                .map(box),
            }
          : null,
      });
    });
  });

const run = (type, config, rows = cities) =>
  render("<div id='viz' style='width:700px;height:450px'></div>", probe, [
    type,
    config,
    rows,
  ]);

const lollipop = extra => ({
  groupBy: "city",
  color: "region",
  x: "city",
  y: "population",
  size: "growth",
  ...extra,
});

/** The legend's circles are the heads' radii: same scale, same extremes. */
const assertMatchesHeads = (out, min, max) => {
  assert.ok(out.panel, "size legend drawn");
  assert.strictEqual(out.legendCircles.length, 3);
  assert.strictEqual(
    Math.max(...out.legendCircles),
    Math.max(...out.heads),
    "outer circle = largest head",
  );
  assert.strictEqual(
    Math.min(...out.legendCircles),
    Math.min(...out.heads),
    "inner circle = smallest head",
  );
  assert.strictEqual(Math.max(...out.heads), max);
  assert.strictEqual(Math.min(...out.heads), min);
};

for (const renderer of ["svg", "canvas"]) {
  it(`Lollipop ${renderer} — a size accessor adds a size legend matching the heads`, async function () {
    const out = await run(
      "Lollipop",
      lollipop({renderer, sizeMin: 4, sizeMax: 14}),
    );
    assertMatchesHeads(out, 4, 14);
    assert.ok(out.legendText.includes("growth"), "titled by the size key");
    assert.ok(
      out.legendText.includes("4.4") && out.legendText.includes("0.2"),
      "labels the extremes",
    );
  });
}

it("Lollipop — no size legend without a size accessor, or with sizeLegend(false)", async function () {
  const unsized = await run("Lollipop", {
    groupBy: "city",
    x: "city",
    y: "population",
  });
  assert.strictEqual(unsized.panel, false);
  const off = await run("Lollipop", lollipop({sizeLegend: false}));
  assert.strictEqual(off.panel, false);
});

it("Lollipop — the size legend follows sizeScale, sizeMin, and sizeMax", async function () {
  const out = await run(
    "Lollipop",
    lollipop({
      sizeScale: "sqrt",
      sizeMin: 3,
      sizeMax: 18,
      discrete: "y",
      x: "population",
      y: "city",
    }),
  );
  assertMatchesHeads(out, 3, 18);
  const growth = cities.map(d => d.growth);
  const lo = Math.min(...growth);
  const hi = Math.max(...growth);
  const sqrt = v =>
    3 +
    ((Math.sqrt(v) - Math.sqrt(lo)) / (Math.sqrt(hi) - Math.sqrt(lo))) *
      (18 - 3);
  const middle = out.legendCircles.slice().sort((a, b) => a - b)[1];
  const label = Number(
    out.legendText.find(t => /^[\d.]+$/.test(t) && +t > lo && +t < hi),
  );
  assert.ok(
    Math.abs(middle - sqrt(label)) < 1e-6,
    `middle circle on the sqrt scale: ${middle} vs ${sqrt(label)}`,
  );
});

it("Lollipop — the size legend stays clear of the color legend and the heads", async function () {
  for (const extra of [
    {},
    {legendInset: false},
    {legendInset: false, sizeLegendPosition: "bottom"},
  ]) {
    const out = await run(
      "Lollipop",
      lollipop({sizeMin: 4, sizeMax: 14, ...extra}),
    );
    const {sizeLegend, legend, heads} = out.boxes;
    assert.ok(
      sizeLegend && legend,
      `both legends drawn (${JSON.stringify(extra)})`,
    );
    assert.ok(
      !overlaps(sizeLegend, legend, 0.5),
      `legends apart (${JSON.stringify(extra)})`,
    );
    heads.forEach(h =>
      assert.ok(
        !overlaps(sizeLegend, h, 0.5),
        `clear of the heads (${JSON.stringify(extra)})`,
      ),
    );
  }
});

it("Lollipop — small multiples share one size scale and one size legend", async function () {
  const rows = ["East", "West"].flatMap((region, r) =>
    cities.map(d => ({...d, region, growth: d.growth * (r + 1)})),
  );
  const out = await run(
    "Lollipop",
    {
      groupBy: "city",
      facet: "region",
      x: "city",
      y: "population",
      size: "growth",
      sizeMin: 4,
      sizeMax: 14,
      legend: false,
    },
    rows,
  );
  assert.strictEqual(out.heads.length, 12);
  assertMatchesHeads(out, 4, 14);
  assert.ok(
    out.legendText.includes("8.8"),
    "keyed to the largest value across panels",
  );
});

it("Dumbbell — a size accessor adds a size legend matching the points", async function () {
  const rows = [
    {country: "Japan", year: "2000", v: 81, pop: 127},
    {country: "Japan", year: "2020", v: 84, pop: 125},
    {country: "India", year: "2000", v: 63, pop: 1057},
    {country: "India", year: "2020", v: 67, pop: 1414},
    {country: "Brazil", year: "2000", v: 70, pop: 175},
    {country: "Brazil", year: "2020", v: 73, pop: 214},
  ];
  const out = await run(
    "Dumbbell",
    {
      groupBy: "year",
      x: "v",
      y: "country",
      size: "pop",
      sizeMin: 3,
      sizeMax: 15,
    },
    rows,
  );
  assertMatchesHeads(out, 3, 15);
  const unsized = await run(
    "Dumbbell",
    {groupBy: "year", x: "v", y: "country"},
    rows,
  );
  assert.strictEqual(unsized.panel, false);
});
