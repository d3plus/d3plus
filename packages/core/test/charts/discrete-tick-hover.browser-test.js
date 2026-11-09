import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    Discrete axis tick labels follow the hover: the labels of the hovered
    marks' buckets keep full opacity while the rest dim with the other marks,
    on a Plot's discrete axis (vertical or horizontal bars, on both
    renderers) and on a Matrix's row and column axes. Continuous axes keep
    every label, as before.
*/

/** Each tick label's text and opacity, by axis scene key. */
const tickOpacity = () => {
  const viz = window.__viz;
  const out = {};
  const walk = (node, axis) => {
    const key = `${node.key}`;
    const here = /-axis$/.test(key) ? key : axis;
    if (node.type === "text" && here)
      (out[here] ||= {})[node.lines.map(l => l.text).join(" ")] =
        node.paint?.opacity ?? 1;
    (node.children || []).forEach(c => walk(c, here));
  };
  const scene = viz.toScene();
  (scene.root ? [scene.root] : scene.children).forEach(n => walk(n));
  return out;
};

const bars = [
  {id: "alpha", x: "A", y: 4},
  {id: "beta", x: "B", y: 6},
  {id: "gamma", x: "C", y: 2},
];

const barProbe = async ([data, horizontal, renderer, tickOpacitySrc]) => {
  const viz = new window.d3plus.BarChart()
    .select("#viz")
    .duration(0)
    .renderer(renderer)
    .data(data)
    .groupBy("id")
    .legend(false);
  if (horizontal) viz.discrete("y").x("y").y("x");
  else viz.x("x").y("y");
  await new Promise(r => viz.render(r));
  window.__viz = viz;
  const probe = new Function(`return (${tickOpacitySrc})()`);
  const before = probe();
  viz.hover(d => d.id === "alpha");
  const hovered = probe();
  viz.hover(false);
  return {before, hovered, after: probe()};
};

const box = "<div id='viz' style='width:600px;height:400px'></div>";

for (const renderer of ["svg", "canvas"])
  it(`BarChart keeps the hovered bar's discrete tick label bright (${renderer})`, async function () {
    const out = await render(box, barProbe, [
      bars,
      false,
      renderer,
      tickOpacity.toString(),
    ]);
    const x = out.hovered["plot-x-axis"];
    assert.strictEqual(x.A, 1, "the hovered bar's category");
    assert.strictEqual(x.B, 0.5, "another category dims");
    assert.strictEqual(x.C, 0.5);
    const y = out.hovered["plot-y-axis"];
    assert.ok(
      Object.values(y).every(o => o === 1),
      "the continuous axis keeps every label",
    );
    for (const state of [out.before, out.after])
      assert.ok(
        Object.values(state["plot-x-axis"]).every(o => o === 1),
        "no hover, no dimming",
      );
  });

it("BarChart's pointer hover keeps the hovered bar's tick label bright", async function () {
  await withPage(box, async p => {
    const at = await p.evaluate(
      async ([data, src]) => {
        const viz = new window.d3plus.BarChart()
          .select("#viz")
          .duration(0)
          .data(data)
          .groupBy("id")
          .x("x")
          .y("y")
          .legend(false);
        await new Promise(r => viz.render(r));
        window.__viz = viz;
        window.__probe = new Function(`return (${src})()`);
        const svg = document.querySelector("#viz svg").getBoundingClientRect();
        const tick = [...document.querySelectorAll("#viz svg text")]
          .find(t => t.textContent === "B")
          .getBoundingClientRect();
        return [tick.x + tick.width / 2, svg.y + svg.height / 2];
      },
      [bars, tickOpacity.toString()],
    );
    await p.mouse.move(at[0] - 3, at[1] - 3);
    await p.mouse.move(...at, {steps: 3});
    await p.waitForTimeout(150);
    const out = await p.evaluate(() => window.__probe());
    assert.deepStrictEqual(out["plot-x-axis"], {A: 0.5, B: 1, C: 0.5});
  });
});

it("a horizontal BarChart's discrete y axis follows the hover", async function () {
  const out = await render(box, barProbe, [
    bars,
    true,
    "svg",
    tickOpacity.toString(),
  ]);
  const y = out.hovered["plot-y-axis"];
  assert.strictEqual(y.A, 1);
  assert.strictEqual(y.B, 0.5);
  assert.ok(
    Object.values(out.hovered["plot-x-axis"]).every(o => o === 1),
    "the value axis keeps every label",
  );
});

it("BarChart's legend hover keeps its bars' tick labels bright", async function () {
  const out = await render(
    box,
    async src => {
      const viz = new window.d3plus.BarChart()
        .select("#viz")
        .duration(0)
        .data([
          {group: "g1", x: "A", y: 4},
          {group: "g1", x: "B", y: 3},
          {group: "g2", x: "C", y: 2},
        ])
        .groupBy("group")
        .x("x")
        .y("y");
      await new Promise(r => viz.render(r));
      window.__viz = viz;
      viz.hover(d => d.group === "g1");
      return new Function(`return (${src})()`)();
    },
    tickOpacity.toString(),
  );
  assert.deepStrictEqual(out["plot-x-axis"], {A: 1, B: 1, C: 0.5});
});

it("Matrix keeps the hovered cell's row and column labels bright", async function () {
  const out = await render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    async src => {
      const viz = new window.d3plus.Matrix()
        .select("#viz")
        .duration(0)
        .groupBy(["row", "column"])
        .data([
          {row: "R1", column: "C1", value: 10},
          {row: "R1", column: "C2", value: 25},
          {row: "R2", column: "C1", value: 30},
          {row: "R2", column: "C2", value: 5},
        ])
        .colorScale("value");
      await new Promise(r => viz.render(r));
      window.__viz = viz;
      const probe = new Function(`return (${src})()`);
      const cell = viz._filteredData.find(
        d => d.row === "R2" && d.column === "C1",
      );
      viz.schema.on["mousemove.shape"](
        cell,
        0,
        cell,
        new MouseEvent("mousemove"),
      );
      const hovered = probe();
      viz.hover(d => d.column === "C2");
      return {hovered, column: probe()};
    },
    tickOpacity.toString(),
  );
  assert.deepStrictEqual(out.hovered["matrix-row-axis"], {R1: 0.5, R2: 1});
  assert.deepStrictEqual(out.hovered["matrix-column-axis"], {C1: 1, C2: 0.5});
  // Any other hover follows the marks it matches.
  assert.deepStrictEqual(out.column["matrix-row-axis"], {R1: 1, R2: 1});
  assert.deepStrictEqual(out.column["matrix-column-axis"], {C1: 0.5, C2: 1});
});
