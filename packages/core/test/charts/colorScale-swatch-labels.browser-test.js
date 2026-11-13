import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A colorScale drawn as swatches whose labels are far too long for its
    room, in a real browser on both renderers: each swatch keeps its label,
    wrapped and, when it still doesn't fit, cut short with "...", and every
    label lies within the chart, in the margin the scale claims.
*/

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));

const prefix =
  "An extraordinarily long color scale label, much longer than any chart could show on a line or two, for ";

/** Draws the chart into `#${arg.target}` and reports its swatch labels' lines. */
const draw = arg =>
  new Promise(resolve => {
    const {prefix} = arg;
    const viz = new window.d3plus.Treemap()
      .config({
        data: arg.rows,
        groupBy: "id",
        sum: "v",
        colorScale: "v",
        colorScalePosition: arg.position,
        colorScaleConfig: {
          scale: "jenks",
          axisConfig: {tickFormat: d => `${prefix}${d}`},
        },
      })
      .renderer(arg.renderer)
      .duration(0)
      .select(`#${arg.target}`);
    viz.render(() => {
      const labels = [];
      const boxes = [];
      const walk = (n, dx, dy) => {
        const x = dx + ((n.transform && n.transform.x) || 0);
        const y = dy + ((n.transform && n.transform.y) || 0);
        if (n.type === "text") {
          const size = (n.font && n.font.size) || 10;
          const anchor = (n.font && n.font.anchor) || "start";
          for (const line of n.lines) {
            const shift =
              anchor === "middle"
                ? line.width / 2
                : anchor === "end"
                  ? line.width
                  : 0;
            const left = x + n.x + line.x - shift;
            const base = y + n.y + line.y;
            boxes.push([left, base - size, left + line.width, base]);
          }
          labels.push(n.lines.map(l => l.text).join(" "));
        }
        (n.children || []).forEach(c => walk(c, x, y));
      };
      const scale = viz._paintedScene.root.children.find(
        n => n.key === "viz-colorScale",
      );
      if (scale) walk(scale, 0, 0);
      resolve({labels, boxes, margin: viz._margin});
    });
  });

/** Draws the chart once with short labels and once with long ones. */
const drawBoth = (arg, [w, h]) =>
  render(
    `<div id='v0' style='width:${w}px;height:${h}px'></div><div id='v1' style='width:${w}px;height:${h}px'></div>`,
    new Function(
      "arg",
      `const draw = ${draw};
      return draw({...arg, prefix: "", target: "v0"}).then(short =>
        draw({...arg, target: "v1"}).then(long => [short, long]),
      );`,
    ),
    {rows, ...arg},
  );

for (const renderer of ["svg", "canvas"])
  for (const size of [
    [250, 200],
    [600, 400],
  ])
    for (const position of ["right", "bottom"])
      it(`[${renderer}] very long swatch labels are cut short within the chart at the ${position} of a ${size.join("×")} chart`, async () => {
        const [short, long] = await drawBoth(
          {renderer, position, prefix},
          size,
        );
        const [w, h] = size;
        assert.ok(short.labels.length === 5, `5 buckets (${short.labels})`);
        assert.strictEqual(
          long.labels.length,
          short.labels.length,
          `every swatch keeps its label (${long.labels.join(" | ")})`,
        );
        long.labels.forEach((label, i) => {
          const whole = `${prefix}${short.labels[i]}`;
          assert.ok(
            label === whole || label.endsWith("..."),
            `"${label}" is whole or cut short with "..."`,
          );
        });
        assert.ok(
          long.labels.some(label => label.endsWith("...")),
          "the labels are cut short",
        );
        const wide = position === "bottom";
        const claim = long.margin[position];
        for (const [x0, y0, x1, y1] of long.boxes) {
          assert.ok(
            x0 >= 0 && x1 <= w && y0 >= 0 && y1 <= h,
            `within the chart (${[x0, y0, x1, y1].map(Math.round)})`,
          );
          assert.ok(
            wide ? y0 >= h - claim - 1 : x0 >= w - claim - 1,
            `within the margin the scale claims (${[x0, y0, x1, y1].map(Math.round)} for ${claim})`,
          );
        }
        assert.ok(
          claim <= (wide ? h : w) / 3,
          `the scale takes at most a third (${claim})`,
        );
      });
