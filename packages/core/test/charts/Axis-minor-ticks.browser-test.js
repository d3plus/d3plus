import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Minor ticks in a chart, on both renderers: a log-log Plot draws them by
    default between its decades, `minorTicks: false` turns them off, and
    `minorGrid` draws fainter grid lines at them behind the marks.
*/

const draw = ({renderer, xConfig = {}, yConfig = {}, width = 700}) =>
  new Promise(resolve => {
    const data = [];
    for (let i = 0; i < 20; i++)
      data.push({id: `p${i}`, x: Math.pow(10, 1 + (i % 5)), y: 2 + i * 40});
    const viz = new window.d3plus.Plot()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .shapeConfig({Circle: {label: false}})
      .xConfig({scale: "log", ...xConfig})
      .yConfig({scale: "log", ...yConfig})
      .select("#viz");
    document.querySelector("#viz").style.width = `${width}px`;
    viz.render(() => {
      const nodes = [];
      const walk = (n, path) => {
        nodes.push({node: n, path});
        (n.children || []).forEach(c => walk(c, [...path, n.key]));
      };
      walk(viz.toScene().root, []);
      const grid = nodes.filter(
        ({node, path}) =>
          path.includes("plot-x-axis-grid") &&
          `${node.key}`.startsWith("grid-"),
      );
      const shapes = nodes.findIndex(({node}) => node.type === "circle");
      const minorGrid = nodes.findIndex(({node}) =>
        `${node.key}`.startsWith("grid-minor-"),
      );
      const axis = viz._xAxis;
      resolve({
        minorValues: axis._minorTickValues,
        minorMarks: axis._tickShape._data.filter(d => d.minor).length,
        minorGridLines: grid.filter(({node}) =>
          node.key.startsWith("grid-minor-"),
        ).length,
        minorGridOpacity: grid.find(({node}) =>
          node.key.startsWith("grid-minor-"),
        )?.node.paint.strokeOpacity,
        minorGridFirst: minorGrid,
        shapes,
        canvas: !!document.querySelector("#viz canvas"),
      });
    });
  });

const page = '<div id="viz" style="width:700px;height:400px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`a log axis draws minor ticks by default (${renderer})`, async () => {
    const out = await render(page, draw, {renderer});
    // 2 through 9 in each decade the axis spans.
    assert.ok(out.minorValues.length >= 32);
    assert.strictEqual(out.minorValues.length % 8, 0);
    for (const v of out.minorValues) {
      const lead = v / Math.pow(10, Math.floor(Math.log10(v)));
      assert.ok(Math.abs(lead - Math.round(lead)) < 1e-9 && lead >= 2, `${v}`);
    }
    assert.strictEqual(out.minorMarks, 2 * out.minorValues.length);
    assert.strictEqual(out.minorGridLines, 0);
    const off = await render(page, draw, {
      renderer,
      xConfig: {minorTicks: false},
    });
    assert.strictEqual(off.minorMarks, 0);
    if (renderer === "canvas") assert.ok(out.canvas);
  });

  it(`a narrow log axis thins its minor ticks (${renderer})`, async () => {
    const out = await render(page, draw, {renderer, width: 260});
    assert.ok(out.minorValues.length > 0);
    assert.ok(out.minorValues.length / 8 < 4, `${out.minorValues.length}`);
  });

  it(`minorGrid draws faint lines behind the marks (${renderer})`, async () => {
    const out = await render(page, draw, {
      renderer,
      xConfig: {minorGrid: true},
    });
    assert.strictEqual(out.minorGridLines, out.minorValues.length);
    assert.strictEqual(out.minorGridOpacity, 0.5);
    assert.ok(out.minorGridFirst < out.shapes, "drawn before the shapes");
  });
}
