import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Trend line labels in a real browser, on both renderers: each fit gets a
    label along its line (its path sits just above the fitted stretch), the
    text reads left to right even on a reversed axis, SVG draws it in a
    <textPath>, and Canvas paints it without errors.
*/

const draw = ({renderer, config, reversed, log}) =>
  new Promise(resolve => {
    const data = [];
    for (const [id, a, b] of [
      ["Alpha", 2, 5],
      ["Beta", -1, 70],
    ])
      for (let x = 1; x <= 20; x++)
        data.push({
          id,
          k: `${id}${x}`,
          x,
          y: log ? Math.exp(0.15 * x) * (id === "Beta" ? 3 : 1) : a * x + b,
        });
    const viz = new window.d3plus.Plot()
      .data(data)
      .groupBy(["id", "k"])
      .x("x")
      .y("y")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .shapeConfig({Circle: {label: false}})
      .trendLine(log ? "exponential" : "linear")
      .trendLineConfig(config)
      .select("#viz");
    if (reversed) viz.xDomain([20, 0]);
    if (log) viz.yConfig({scale: "log"});
    viz.render(() => {
      const nodes = [];
      const walk = n => {
        nodes.push(n);
        (n.children || []).forEach(walk);
      };
      walk(viz.toScene().root);
      const labels = nodes.filter(
        n => n.type === "text" && `${n.key}`.startsWith("trend-label-"),
      );
      const points = d =>
        [...d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(m => [+m[1], +m[2]]);
      // The fitted line in pixels, from the same scales the marks use.
      const fits = viz._trendFits.map(f => ({
        id: f.id,
        line: f.samples
          .filter(s => !s.projected)
          .map(s => [viz._xFunc(s.x), viz._yFunc(s.y)]),
      }));
      resolve({
        labels: labels.map(n => ({
          key: n.key,
          text: n.lines[0].text,
          interactive: n.interactive,
          points: points(n.path.d),
        })),
        fits,
        textPaths: document.querySelectorAll("#viz textPath").length,
        canvas: !!document.querySelector("#viz canvas"),
      });
    });
  });

/** The distance from a point to a polyline. */
const distance = ([px, py], line) => {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1];
    const [bx, by] = line[i];
    const dx = bx - ax,
      dy = by - ay;
    const t = Math.max(
      0,
      Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)),
    );
    best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
  }
  return best;
};

const page = '<div id="viz" style="width:700px;height:400px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`trend labels follow their lines (${renderer})`, async () => {
    const out = await render(page, draw, {
      renderer,
      config: {label: true},
    });
    assert.deepStrictEqual(out.labels.map(l => l.text).sort(), [
      "Alpha",
      "Beta",
    ]);
    for (const label of out.labels) {
      assert.strictEqual(label.interactive, false);
      const fit = out.fits.find(f => label.key === `trend-label-${f.id}`);
      for (const p of label.points)
        assert.ok(
          Math.abs(distance(p, fit.line) - 3) < 1,
          `${label.key} sits 3px off its line (${distance(p, fit.line)})`,
        );
      const first = label.points[0];
      const last = label.points[label.points.length - 1];
      assert.ok(first[0] < last[0], "reads left to right");
    }
    if (renderer === "svg") assert.strictEqual(out.textPaths, 2);
    else assert.ok(out.canvas);
  });

  it(`trend labels stay upright on a reversed axis, and curve on a log fit (${renderer})`, async () => {
    const reversed = await render(page, draw, {
      renderer,
      reversed: true,
      config: {label: "equation"},
    });
    assert.strictEqual(reversed.labels.length, 2);
    for (const label of reversed.labels) {
      assert.ok(label.text.includes("R²"), label.text);
      const first = label.points[0];
      const last = label.points[label.points.length - 1];
      assert.ok(first[0] < last[0], "reads left to right");
    }
    const log = await render(page, draw, {
      renderer,
      log: true,
      config: {label: true},
    });
    for (const label of log.labels) {
      const fit = log.fits.find(f => label.key === `trend-label-${f.id}`);
      for (const p of label.points)
        assert.ok(Math.abs(distance(p, fit.line) - 3) < 1.5);
    }
  });
}
