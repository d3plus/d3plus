import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A user domain on a discrete axis lists the categories it shows. Rendered
    on both backends, a LinePlot's lines and a BarChart's bars draw only at
    those categories, with no NaN anywhere in the scene (a LinePlot's path
    `d` used to read `MNaN,…`, a bar `translate(NaN,…)`).
*/

/** Renders the chart `src` builds (a `(lib, data) => chart` function source) and reports its lines, bars and x axis. */
const draw = ([src, renderer]) =>
  new Promise((resolve, reject) => {
    const data = ["a", "b"].flatMap((id, j) =>
      [2015, 2016, 2017, 2018, 2019, 2020].map((year, i) => ({
        id,
        year,
        cat: `C${year}`,
        value: (i + 1) * (j + 2),
      })),
    );
    const viz = new Function("lib", "data", `return (${src})(lib, data);`)(
      window.d3plus,
      data,
    )
      .groupBy("id")
      .legend(false)
      .duration(0)
      .renderer(renderer)
      .select("#viz");
    viz.render(() => {
      try {
        const flat = nodes =>
          nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
        const nodes = flat(viz._chartScene);
        // Every vertex of a path: the M point, each L point, each C curve's end point.
        const vertices = d =>
          [...d.matchAll(/([MLC])([^MLCZ]*)/g)].map(([, cmd, args]) => {
            const n = args.split(",").map(Number);
            return cmd === "C" ? n.slice(4, 6) : n.slice(0, 2);
          });
        const lines = nodes
          .filter(
            n =>
              n.shapeType === "Line" &&
              n.type === "path" &&
              ["a", "b"].includes(n.key),
          )
          .map(n => ({
            key: n.key,
            xs: vertices(n.d).map(([x]) => x + n.transform.x),
            d: n.d,
          }));
        const bars = nodes
          .filter(
            n =>
              n.type === "rect" &&
              n.shapeType === "Bar" &&
              !String(n.key).endsWith("::hit"),
          )
          .map(n => ({key: n.key, x: n.transform.x}));
        const numbers = nodes.flatMap(n => [
          n.x,
          n.y,
          n.width,
          n.height,
          n.r,
          n.transform && n.transform.x,
          n.transform && n.transform.y,
        ]);
        const sceneNaN =
          numbers.some(v => Number.isNaN(v)) ||
          nodes.some(n => typeof n.d === "string" && n.d.includes("NaN"));
        const axis = viz._xAxis;
        const svg = document.querySelector("#viz svg.d3plus-render-svg");
        resolve({
          lines,
          bars,
          sceneNaN,
          domNaN: svg
            ? [...svg.querySelectorAll("*")].filter(el =>
                [...el.attributes].some(a => a.value.includes("NaN")),
              ).length
            : 0,
          canvas: Boolean(document.querySelector("#viz canvas")),
          domain: axis._d3Scale.domain(),
          positions: axis._d3Scale.domain().map(d => axis._getPosition(d)),
        });
      } catch (e) {
        reject(e);
      }
    });
  });

const run = (src, renderer) =>
  render("<div id='viz' style='width:600px;height:300px'></div>", draw, [
    src,
    renderer,
  ]);

/** Asserts `xs` are `positions` shifted by one constant (the axis's offset in the chart). */
const sameSpacing = (xs, positions, msg) => {
  assert.strictEqual(
    xs.length,
    positions.length,
    `${msg}: one vertex per category`,
  );
  xs.forEach((x, i) =>
    assert.ok(
      Math.abs(x - xs[0] - (positions[i] - positions[0])) < 0.01,
      `${msg}: vertex ${i} at its category`,
    ),
  );
};

for (const renderer of ["svg", "canvas"]) {
  it(`LinePlot xDomain on numeric categories draws only those categories (${renderer})`, async () => {
    const r = await run(
      "(lib, data) => new lib.LinePlot().data(data).x('year').y('value').xDomain([2016, 2018, 2019])",
      renderer,
    );
    assert.strictEqual(r.canvas, renderer === "canvas");
    assert.deepStrictEqual(r.domain, [2016, 2018, 2019]);
    assert.strictEqual(r.sceneNaN, false, "no NaN in the scene");
    assert.strictEqual(r.domNaN, 0, "no NaN attribute in the DOM");
    assert.deepStrictEqual(r.lines.map(l => l.key).sort(), ["a", "b"]);
    for (const line of r.lines)
      sameSpacing(line.xs, r.positions, `line ${line.key}`);
  });

  it(`LinePlot xDomain on string categories keeps the listed order (${renderer})`, async () => {
    const r = await run(
      "(lib, data) => new lib.LinePlot().data(data).x('cat').y('value').xDomain(['C2016', 'C2017', 'C2018'])",
      renderer,
    );
    assert.deepStrictEqual(r.domain, ["C2016", "C2017", "C2018"]);
    assert.strictEqual(r.sceneNaN, false);
    assert.strictEqual(r.domNaN, 0);
    for (const line of r.lines)
      sameSpacing(line.xs, r.positions, `line ${line.key}`);
  });

  it(`LinePlot xConfig.domain on a discrete axis matches xDomain (${renderer})`, async () => {
    const viaConfig = await run(
      "(lib, data) => new lib.LinePlot().data(data).x('cat').y('value').xConfig({domain: ['C2016', 'C2019']})",
      renderer,
    );
    const viaDomain = await run(
      "(lib, data) => new lib.LinePlot().data(data).x('cat').y('value').xDomain(['C2016', 'C2019'])",
      renderer,
    );
    assert.strictEqual(viaConfig.sceneNaN, false);
    assert.deepStrictEqual(viaConfig.domain, ["C2016", "C2019"]);
    assert.deepStrictEqual(
      viaConfig.lines.map(l => l.d),
      viaDomain.lines.map(l => l.d),
    );
  });

  it(`BarChart xDomain draws bars only for the listed categories (${renderer})`, async () => {
    const r = await run(
      "(lib, data) => new lib.BarChart().data(data).x('year').y('value').xDomain([2016, 2019])",
      renderer,
    );
    assert.deepStrictEqual(r.domain, [2016, 2019]);
    assert.strictEqual(r.sceneNaN, false, "no NaN in the scene");
    assert.strictEqual(r.domNaN, 0, "no NaN attribute in the DOM");
    assert.deepStrictEqual(r.bars.map(b => b.key).sort(), [
      "a_2016",
      "a_2019",
      "b_2016",
      "b_2019",
    ]);
  });
}
