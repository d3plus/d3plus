import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Every axis `scale` a Plot takes draws an axis, on both backends: the
    value axis's continuous scales (and `"auto"`), and `"time"` and `"utc"`
    (or `"auto"`, which picks time for dates) on a time axis. A name an
    axis doesn't draw warns and draws linear.
*/

const box = "<div id='viz' style='width:700px;height:360px'></div>";

const rows = [1, 2, 3, 4, 5, 6].map(k => ({
  id: "Sales",
  date: Date.UTC(2024, k - 1, 1),
  value: k * k * 40,
}));

/** Renders a LinePlot and reads its axes' scales, labels, and warnings. */
const draw = (config, renderer) =>
  render(
    box,
    ({config, renderer}) =>
      new Promise(resolve => {
        const warnings = [];
        const warn = console.warn;
        console.warn = msg => warnings.push(String(msg));
        const viz = new window.d3plus.LinePlot()
          .config({
            data: config.rows,
            groupBy: "id",
            x: "date",
            time: "date",
            y: "value",
            legend: false,
            timeline: false,
            duration: 0,
            ...config.extra,
          })
          .renderer(renderer)
          .select("#viz");
        viz.render(() => {
          console.warn = warn;
          const labels = key => {
            const node = sceneNodes(viz._paintedScene.root).find(
              n => n.key === key,
            );
            return sceneNodes(node)
              .filter(n => n.type === "text")
              .map(n => n.lines.map(l => l.text).join(" "));
          };
          resolve({
            x: {scale: viz._xAxis.scale(), utc: viz._xAxis.utc()},
            y: viz._yAxis.scale(),
            xLabels: labels("plot-x-axis"),
            yLabels: labels("plot-y-axis"),
            warnings,
          });
        });
      }),
    {config, renderer},
  );

for (const renderer of ["svg", "canvas"]) {
  for (const scale of ["auto", "linear", "log", "pow", "sqrt"])
    it(`[${renderer}] yConfig.scale "${scale}" draws the value axis`, async () => {
      const out = await draw({rows, extra: {yConfig: {scale}}}, renderer);
      assert.deepStrictEqual(out.warnings, []);
      assert.ok(
        scale === "auto" ? ["linear", "log"].includes(out.y) : out.y === scale,
        `the y axis draws ${out.y}`,
      );
      assert.ok(out.yLabels.length >= 2, `y labels (${out.yLabels})`);
    });

  for (const scale of ["time", "utc", "auto"])
    it(`[${renderer}] xConfig.scale "${scale}" draws the time axis`, async () => {
      const out = await draw({rows, extra: {xConfig: {scale}}}, renderer);
      assert.deepStrictEqual(out.warnings, []);
      assert.deepStrictEqual(out.x, {scale: "time", utc: scale === "utc"});
      assert.ok(out.xLabels.length >= 3, `x labels (${out.xLabels})`);
      if (scale === "utc") assert.strictEqual(out.xLabels[0], "Jan 2024");
    });

  it(`[${renderer}] a scale the axis doesn't draw warns and draws linear`, async () => {
    // Each warning logs once per page, so each backend tries its own name.
    const removed = renderer === "svg" ? "symlog" : "quantize";
    const out = await draw(
      {rows, extra: {yConfig: {scale: removed}}},
      renderer,
    );
    assert.ok(
      out.warnings.some(w => w.includes(`unknown scale "${removed}"`)),
      `warned (${out.warnings})`,
    );
    const linear = await draw(
      {rows, extra: {yConfig: {scale: "linear"}}},
      renderer,
    );
    assert.deepStrictEqual(out.yLabels, linear.yLabels);
  });
}
