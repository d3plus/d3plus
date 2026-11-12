import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A colorScale whose labels are far too long to sit side by side, in a real
    browser on both renderers: at every position, drawn as a gradient, as a
    bucketed bar and as swatches, the scale still draws with its labels whole
    (wrapped, with the ones that crowd hidden), its end labels among them,
    and leaves the chart room. `axisConfig.labels` picks the labels a
    gradient or a bucketed bar shows.
*/

const width = 600;
const height = 400;
const prefix = "A very long color scale label for ";

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));

const scales = {
  gradient: {scale: "linear"},
  "bucketed bar": {scale: "jenks", bucketAxis: true},
  swatches: {scale: "jenks"},
};

/** Draws the chart into `#${arg.target}` and reports its painted colorScale. */
const draw = arg =>
  new Promise(resolve => {
    const {prefix, labels} = arg;
    const viz = new window.d3plus.Treemap()
      .data(arg.rows)
      .groupBy("id")
      .sum("v")
      .colorScale("v")
      .colorScalePosition(arg.position)
      .colorScaleConfig({
        ...arg.scale,
        axisConfig: {
          tickFormat: d => `${prefix}${d}`,
          ...(labels ? {labels} : {}),
        },
      })
      .renderer(arg.renderer)
      .duration(0)
      .select(`#${arg.target}`);
    viz.render(() => {
      const out = {labels: [], rects: 0};
      const walk = n => {
        if (n.type === "text")
          out.labels.push(n.lines.map(l => l.text).join(" "));
        else if (n.type === "rect") out.rects++;
        (n.children || []).forEach(walk);
      };
      const scale = viz._paintedScene.root.children.find(
        n => n.key === "viz-colorScale",
      );
      if (scale) walk(scale);
      const {width, height} = viz._colorScaleClass.outerBounds();
      resolve({
        ...out,
        drawn: Boolean(scale),
        width,
        height,
        margin: viz._margin,
      });
    });
  });

const body = `<div id='ref' style='width:${width}px;height:${height}px'></div>
  <div id='viz' style='width:${width}px;height:${height}px'></div>`;

/** The scale drawn with short labels, then the same one with long labels. */
const drawBoth = new Function(
  "arg",
  `const draw = ${draw};
  return draw({...arg, prefix: "", target: "ref"}).then(short =>
    draw({...arg, target: "viz"}).then(long => ({short, long})),
  );`,
);

for (const renderer of ["svg", "canvas"])
  for (const [name, scale] of Object.entries(scales))
    for (const position of ["top", "bottom", "left", "right"])
      it(`[${renderer}] a ${name} colorScale with long labels still draws at the ${position}`, async () => {
        const {short, long} = await render(body, drawBoth, {
          rows,
          renderer,
          scale,
          position,
          prefix,
        });
        assert.ok(long.drawn, "the colorScale is painted");
        assert.ok(long.rects >= 1, `its colors are drawn (${long.rects})`);
        assert.ok(
          long.labels.length >= 2 &&
            long.labels.every(l => l.startsWith(prefix)),
          `its labels are drawn (${long.labels.join(" | ")})`,
        );
        // Each long label reads as its short twin does, with nothing cut off.
        const shown = long.labels.map(l => l.split(prefix).join(""));
        assert.ok(
          shown.every(l => short.labels.includes(l)),
          `labels whole (${shown.join(" | ")} of ${short.labels.join(" | ")})`,
        );
        const ends = [short.labels[0], short.labels[short.labels.length - 1]];
        assert.ok(
          ends.every(l => shown.includes(l)),
          `end labels ${ends.join(" and ")} shown (${shown.join(" | ")})`,
        );
        if (name === "swatches")
          assert.deepStrictEqual(shown, short.labels, "every bucket labeled");
        assert.ok(
          long.width > 0 && long.width <= width,
          `fits the chart's width (${long.width})`,
        );
        assert.ok(
          long.height > 0 && long.height <= height,
          `fits the chart's height (${long.height})`,
        );
        const {top, right, bottom, left} = long.margin;
        assert.ok(
          width - left - right >= 100 && height - top - bottom >= 100,
          `the chart keeps room (${JSON.stringify(long.margin)})`,
        );
      });

for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    for (const position of ["bottom", "right"])
      it(`[${renderer}] axisConfig.labels picks a ${name} colorScale's labels at the ${position}`, async () => {
        const {labels} = await render(
          `<div id='viz' style='width:${width}px;height:${height}px'></div>`,
          draw,
          {
            rows,
            renderer,
            scale: scales[name],
            position,
            prefix,
            labels: [200, 800],
            target: "viz",
          },
        );
        assert.deepStrictEqual(
          labels.map(l => l.split(prefix).join("")).sort(),
          ["200", "800"],
          "only the given labels",
        );
      });
