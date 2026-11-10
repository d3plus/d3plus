import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Axis labels with no break in them (one word wider than a label's room),
    in a real browser on both renderers: a label too long to draw whole is
    cut short ("…") and stays inside the chart, rather than running off its
    edge or leaving the axis with no labels at all. Covers a horizontal
    `bucketAxis` color scale and a gradient at the bottom of the chart
    (limited by an explicit `axisConfig.maxSize`), and a BarChart's x and y
    axes.
*/

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));

const unbreakable = "veryveryverylongunbreakablecolorscalekey";

const bars = ["A", "B", "C", "D", "E", "F"].map((c, i) => ({
  id: c.repeat(30),
  x: 10 + i * 3,
}));

/**
    Draws the chart `arg.setup` builds and reports the painted lines of the
    axis labels in it (the color scale's axis, or a Plot's `arg.axis`), each
    line's box in chart coordinates.
*/
const draw = arg =>
  new Promise(resolve => {
    const viz = new Function("d3plus", "rows", "bars", `return ${arg.setup}`)(
      window.d3plus,
      arg.rows,
      arg.bars,
    )
      .renderer(arg.renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const labels = [];
      const walk = (n, dx, dy, inAxis) => {
        const t = n.transform || {};
        const x = dx + (t.x || 0);
        const y = dy + (t.y || 0);
        const key = String(n.key || "");
        const axis =
          inAxis ||
          (arg.axis ? key.endsWith(arg.axis) : /^Axis-/.test(key)) ||
          false;
        if (axis && n.type === "text" && n.lines.length) {
          const anchor = (n.font && n.font.anchor) || "start";
          labels.push(
            n.lines.map(l => {
              const lx = x + n.x + l.x;
              const x0 =
                anchor === "middle"
                  ? lx - l.width / 2
                  : anchor === "end"
                    ? lx - l.width
                    : lx;
              return {text: l.text, x0, x1: x0 + l.width, y: y + n.y + l.y};
            }),
          );
        }
        (n.children || []).forEach(c => walk(c, x, y, axis));
      };
      walk(viz._paintedScene.root, 0, 0, false);
      resolve(labels);
    });
  });

/** Draws `setup` into a `width` × `height` chart. */
const drawChart = (renderer, setup, [width, height], axis) =>
  render(
    `<div id='viz' style='width:${width}px;height:${height}px'></div>`,
    draw,
    {renderer, setup, rows, bars, axis},
  );

/** Asserts every painted label line lies across the chart's width. */
const assertInside = (labels, width, what) => {
  for (const lines of labels)
    for (const {text, x0, x1} of lines)
      assert.ok(
        x0 >= -0.5 && x1 <= width + 0.5,
        `${what}: "${text}" lies within the chart [${x0.toFixed(1)}, ${x1.toFixed(1)}] of ${width}`,
      );
};

const text = labels => labels.map(lines => lines.map(l => l.text).join(" "));

const colorScale = (scale, maxSize) =>
  `new d3plus.Treemap().data(rows).groupBy("id").sum("v").colorScale("v")
    .colorScalePosition("bottom")
    .colorScaleConfig({${scale}, axisConfig: {
      maxSize: ${maxSize},
      tickFormat: d => "${unbreakable}" + d,
    }})`;

const bucketAxis = `scale: "jenks", bucketAxis: true`;
const gradient = `scale: "linear"`;

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a bucketAxis color scale keeps a cut label inside a 400×300 chart`, async () => {
    const size = [400, 300];
    const labels = await drawChart(renderer, colorScale(bucketAxis, 130), size);
    assert.ok(labels.length > 0, "a label is drawn");
    assertInside(labels, size[0], "bucketAxis");
  });

  it(`[${renderer}] a bucketAxis color scale cuts its labels short to fit a 250×200 chart`, async () => {
    const size = [250, 200];
    const labels = await drawChart(renderer, colorScale(bucketAxis, 80), size);
    assert.ok(labels.length >= 2, `labels are drawn (${text(labels)})`);
    assert.ok(
      labels.every(
        lines => lines.length === 1 && /\.\.\.$/.test(lines[0].text),
      ),
      `each is cut short on one line (${text(labels)})`,
    );
    assertInside(labels, size[0], "bucketAxis");
  });

  it(`[${renderer}] a gradient color scale cuts its labels short to fit a 250×200 chart`, async () => {
    const size = [250, 200];
    const labels = await drawChart(renderer, colorScale(gradient, 80), size);
    assert.ok(labels.length >= 2, `labels are drawn (${text(labels)})`);
    assertInside(labels, size[0], "gradient");
  });

  it(`[${renderer}] a BarChart's x axis cuts labels short within its maxSize`, async () => {
    const size = [400, 300];
    const setup = `new d3plus.BarChart().data(bars).groupBy("id").x("id").y("x")
      .legend(false).xConfig({maxSize: 40})`;
    const labels = await drawChart(renderer, setup, size, "plot-x-axis");
    assert.strictEqual(
      labels.length,
      bars.length,
      `every bar is labeled (${text(labels)})`,
    );
    labels.forEach((lines, i) =>
      assert.ok(
        lines.length === 1 &&
          lines[0].text.startsWith("ABCDEF"[i]) &&
          /\.\.\.$/.test(lines[0].text),
        `cut short on one line (${lines[0].text})`,
      ),
    );
    assertInside(labels, size[0], "x axis");
  });

  it(`[${renderer}] a BarChart's x axis cuts labels short on a small chart`, async () => {
    const size = [250, 200];
    const setup = `new d3plus.BarChart().data(bars).groupBy("id").x("id").y("x").legend(false)`;
    const labels = await drawChart(renderer, setup, size, "plot-x-axis");
    assert.ok(labels.length > 0, "labels are drawn");
    assertInside(labels, size[0], "x axis");
  });

  it(`[${renderer}] a BarChart's y axis cuts labels short on a small chart`, async () => {
    const size = [250, 200];
    const setup = `new d3plus.BarChart().data(bars.slice(0, 3)).groupBy("id")
      .y("id").x("x").discrete("y").legend(false)`;
    const labels = await drawChart(renderer, setup, size, "plot-y-axis");
    assert.strictEqual(
      labels.length,
      3,
      `every bar is labeled (${text(labels)})`,
    );
    assert.ok(
      labels.every(lines => /\.\.\.$/.test(lines[lines.length - 1].text)),
      `cut short (${text(labels)})`,
    );
    assertInside(labels, size[0], "y axis");
  });
}
