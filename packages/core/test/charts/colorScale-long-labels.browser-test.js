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

    A scale along a side of the chart takes at most a third of the chart
    across it, its bar or swatches, padding, ticks, labels and title
    together, unless `axisConfig.maxSize` (a gradient or a bucketed bar) or
    `legendConfig`'s width or height (swatches) says otherwise; a scale that
    fits in that third draws as it does with no limit. A gradient or a
    bucketed bar at the top or bottom keeps its bar, a line of labels and
    its title, which is more than a third of a short chart.
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
    const {prefix, labels, title, legend} = arg;
    // A string `maxSize` is the source of a function, which the copy of
    // `arg` handed to the page can't hold.
    const sizes = [];
    const limit =
      typeof arg.maxSize === "string"
        ? new Function("sizes", `return ${arg.maxSize}`)(sizes)
        : arg.maxSize;
    const viz = new window.d3plus.Treemap()
      .data(arg.rows)
      .groupBy("id")
      .sum("v")
      .colorScale("v")
      .colorScalePosition(arg.position)
      .colorScaleConfig({
        ...arg.scale,
        ...(legend ? {legendConfig: legend} : {}),
        axisConfig: {
          tickFormat: d => `${prefix}${d}`,
          ...(labels ? {labels} : {}),
          ...(title ? {title} : {}),
          ...(limit === undefined ? {} : {maxSize: limit}),
        },
      })
      .renderer(arg.renderer)
      .duration(0)
      .select(`#${arg.target}`);
    viz.render(() => {
      // `box` is the extent of the scale's bar or swatches in the chart.
      const out = {labels: [], rects: 0, box: null};
      const walk = (n, dx, dy) => {
        const x = dx + ((n.transform && n.transform.x) || 0);
        const y = dy + ((n.transform && n.transform.y) || 0);
        if (n.type === "text")
          out.labels.push(n.lines.map(l => l.text).join(" "));
        else if (n.type === "rect") {
          out.rects++;
          const [x0, y0, x1, y1] = out.box || [x + n.x, y + n.y, x, y];
          out.box = [
            Math.min(x0, x + n.x),
            Math.min(y0, y + n.y),
            Math.max(x1, x + n.x + n.width),
            Math.max(y1, y + n.y + n.height),
          ];
        }
        (n.children || []).forEach(c => walk(c, x, y));
      };
      const scale = viz._paintedScene.root.children.find(
        n => n.key === "viz-colorScale",
      );
      if (scale) walk(scale, 0, 0);
      const {width, height} = viz._colorScaleClass.outerBounds();
      resolve({
        ...out,
        drawn: Boolean(scale),
        width,
        height,
        margin: viz._margin,
        labelSpace:
          arg.scale.bucketAxis || arg.scale.scale === "linear"
            ? viz._colorScaleClass._axisClass._labelSpace
            : 0,
        sizes: [...new Set(sizes)],
      });
    });
  });

/** A target per chart of a test, each `size` wide and tall. */
const body = (count, size = [width, height]) =>
  Array.from(
    {length: count},
    (_, i) =>
      `<div id='v${i}' style='width:${size[0]}px;height:${size[1]}px'></div>`,
  ).join("");

/** Draws `arg` once per entry of `arg.variants`, each with that entry's changes. */
const drawEach = new Function(
  "arg",
  `const draw = ${draw};
  return arg.variants.reduce(
    (done, variant, i) =>
      done.then(out =>
        draw({...arg, ...variant, target: "v" + i}).then(d => [...out, d]),
      ),
    Promise.resolve([]),
  );`,
);

/** Draws one chart per variant, `size` wide and tall. */
const drawVariants = (arg, variants, size) =>
  render(body(variants.length, size), drawEach, {...arg, variants});

/** Whether a scale at `position` runs along the chart's width. */
const wide = position => position === "top" || position === "bottom";

for (const renderer of ["svg", "canvas"])
  for (const [name, scale] of Object.entries(scales))
    for (const position of ["top", "bottom", "left", "right"])
      it(`[${renderer}] a ${name} colorScale with long labels still draws at the ${position}`, async () => {
        const [short, long, unlimited] = await drawVariants(
          {rows, renderer, scale, position, prefix},
          [{prefix: ""}, {}, {maxSize: Infinity}],
        );
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
        const side = wide(position) ? height : width;
        assert.ok(
          long.margin[position] <= side / 3,
          `takes at most a third of the chart (${long.margin[position]})`,
        );
        if (name === "swatches") return;
        // A bar's labels fit in a third of the chart's height, so its limit
        // changes nothing there; a third of its width wraps them further.
        if (wide(position))
          assert.deepStrictEqual(long, unlimited, "as with no limit");
        else
          assert.ok(
            long.margin[position] < unlimited.margin[position],
            `wrapped tighter than with no limit (${long.margin[position]} < ${unlimited.margin[position]})`,
          );
      });

for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    for (const position of ["bottom", "right"])
      it(`[${renderer}] axisConfig.labels picks a ${name} colorScale's labels at the ${position}`, async () => {
        const {labels} = await render(body(1), draw, {
          rows,
          renderer,
          scale: scales[name],
          position,
          prefix,
          labels: [200, 800],
          target: "v0",
        });
        assert.deepStrictEqual(
          labels.map(l => l.split(prefix).join("")).sort(),
          ["200", "800"],
          "only the given labels",
        );
      });

// Labels long enough to want more than a third of a chart, one whose third
// has room to wrap them in and a smaller one whose third does not.
const longer = `${prefix}the values that are no more than `;
const medium = [300, 300];
const small = [250, 200];
/** The chart's size across a scale at `position`. */
const across = (position, size = small) => size[wide(position) ? 1 : 0];
/** The Legend size that limits swatches at `position`. */
const crossKey = position => (wide(position) ? "height" : "width");
/** `maxSize` functions, as source: each notes the size it is called with. */
const sixth = "size => (sizes.push(size), size / 6)";
// A third of the chart, less the scale's bar (10px) and the padding on its
// two sides (5px each): the room a scale gives its axis.
const thirdLessBar = "size => (sizes.push(size), Math.floor(size / 3) - 20)";
/** What a draw reports, less the sizes its `maxSize` function was called with. */
const drawn = out => ({...out, sizes: []});
/** The same chart with nothing limiting its scale. */
const unlimitedOf = (name, position, size = small) =>
  name === "swatches"
    ? {legend: {[crossKey(position)]: across(position, size)}}
    : {maxSize: Infinity};
/** Asserts the scale's bar or swatches lie in the margin it claims at `position`. */
const assertInMargin = ({box, margin}, position, [w, h] = small) => {
  const claim = margin[position];
  const [from, to] = wide(position) ? [box[1], box[3]] : [box[0], box[2]];
  const [min, max] =
    position === "top" || position === "left"
      ? [0, claim]
      : [(wide(position) ? h : w) - claim, wide(position) ? h : w];
  assert.ok(
    from >= min && to <= max,
    `drawn against the chart's ${position} edge (${from} to ${to} in ${min} to ${max})`,
  );
};

for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    for (const position of ["top", "bottom", "left", "right"])
      it(`[${renderer}] a ${name} colorScale takes at most a third of the chart at the ${position}`, async () => {
        const side = across(position, medium);
        const [limited, unlimited, byFunction] = await drawVariants(
          {rows, renderer, scale: scales[name], position, prefix: longer},
          [{}, {maxSize: Infinity}, {maxSize: thirdLessBar}],
          medium,
        );
        assert.ok(limited.drawn, "the colorScale is painted");
        assert.ok(
          limited.rects >= 1,
          `its colors are drawn (${limited.rects})`,
        );
        assert.ok(
          limited.labels.length >= 1,
          `it is labeled (${limited.labels.join(" | ")})`,
        );
        assert.ok(
          unlimited.margin[position] > side / 3,
          `the scale wants more than a third (${unlimited.margin[position]})`,
        );
        assert.ok(
          limited.margin[position] <= side / 3,
          `the scale takes at most a third (${limited.margin[position]})`,
        );
        assertInMargin(limited, position, medium);
        // The default leaves the axis a third of the chart less the bar and
        // padding.
        assert.deepStrictEqual(
          byFunction.sizes,
          [side],
          `the function is called with the chart's ${side}px`,
        );
        assert.deepStrictEqual(
          drawn(limited),
          drawn(byFunction),
          "as maxSize: size => Math.floor(size / 3) - 20",
        );
      });

for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    for (const position of ["top", "bottom", "left", "right"])
      it(`[${renderer}] a ${name} colorScale keeps to a third of a small chart at the ${position}`, async () => {
        const side = across(position);
        const [limited, unlimited] = await drawVariants(
          {rows, renderer, scale: scales[name], position, prefix: longer},
          [{}, {maxSize: Infinity}],
          small,
        );
        assert.ok(limited.drawn, "the colorScale is painted");
        assert.ok(
          limited.rects >= 1,
          `its colors are drawn (${limited.rects})`,
        );
        assert.ok(
          unlimited.margin[position] > side / 3,
          `the scale wants more than a third (${unlimited.margin[position]})`,
        );
        assert.ok(
          limited.margin[position] <= side / 3,
          `the scale takes at most a third (${limited.margin[position]})`,
        );
        assertInMargin(limited, position);
        // No label fits whole in that third: each is cut short to fit,
        // a bucketed bar's within its bucket at the top or bottom.
        assert.ok(
          limited.labels.length > 0,
          `labeled (${limited.labels.join(" | ")})`,
        );
        assert.ok(
          limited.labels.every(l => l.endsWith("...")),
          `its labels are cut short (${limited.labels.join(" | ")})`,
        );
      });

// Heights whose thirds leave the labels every remainder of a line's height.
const heights = [294, 300, 306, 312, 318, 324, 330, 336, 342];

for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    it(`[${renderer}] a ${name} colorScale takes at most a third of a chart of any height`, async () => {
      const charts = await render(
        heights
          .map(
            (h, i) =>
              `<div id='v${i}' style='display:inline-block;width:${small[0]}px;height:${h}px'></div>`,
          )
          .join(""),
        drawEach,
        {
          rows,
          renderer,
          scale: scales[name],
          position: "bottom",
          prefix: longer,
          variants: heights.map(() => ({})),
        },
      );
      assert.deepStrictEqual(
        charts.map(({margin}, i) => margin.bottom <= heights[i] / 3),
        heights.map(() => true),
        `at most a third of each (${charts.map(c => c.margin.bottom).join(", ")} of ${heights.join(", ")})`,
      );
      assert.ok(
        charts.some(({margin}, i) => margin.bottom === heights[i] / 3),
        "a scale whose lines fit exactly takes the whole third",
      );
    });

for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    for (const position of ["bottom", "right"])
      it(`[${renderer}] a title shares a ${name} colorScale's third of the chart at the ${position}`, async () => {
        const side = across(position, medium);
        const title = "What the colors show";
        const [titled, plain, unlimited] = await drawVariants(
          {rows, renderer, scale: scales[name], position, prefix: longer},
          [{title}, {}, {title, maxSize: Infinity}],
          medium,
        );
        assert.ok(
          titled.labels.includes(title),
          `the title is drawn (${titled.labels.join(" | ")})`,
        );
        assert.ok(
          titled.labelSpace < plain.labelSpace,
          `the title takes from the labels' room (${titled.labelSpace} < ${plain.labelSpace})`,
        );
        assert.ok(
          titled.margin[position] <= side / 3,
          `the scale takes at most a third (${titled.margin[position]})`,
        );
        assert.ok(
          titled.margin[position] < unlimited.margin[position],
          `the scale takes less of the chart (${titled.margin[position]} < ${unlimited.margin[position]})`,
        );
      });

// A gradient or a bucketed bar along the chart's width keeps its bar, a line
// of labels and its title, whatever the chart's height.
for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    for (const position of ["top", "bottom"])
      it(`[${renderer}] a titled ${name} colorScale keeps its labels and title at the ${position} of a short chart`, async () => {
        const side = across(position);
        const title = "What the colors show";
        const [titled, plain, unlimited] = await drawVariants(
          {rows, renderer, scale: scales[name], position, prefix: ""},
          [{title}, {}, {title, maxSize: Infinity}],
          small,
        );
        assert.ok(
          plain.margin[position] <= side / 3,
          `with no title, the scale fits in a third (${plain.margin[position]})`,
        );
        assert.deepStrictEqual(
          titled.labels.filter(l => l !== title).sort(),
          [...plain.labels].sort(),
          `its labels and title are drawn (${titled.labels.join(" | ")})`,
        );
        assert.ok(
          titled.labels.includes(title),
          `the title is drawn (${titled.labels.join(" | ")})`,
        );
        assert.ok(
          titled.margin[position] > side / 3,
          `the scale takes more than a third (${titled.margin[position]})`,
        );
        assert.deepStrictEqual(titled, unlimited, "as with no limit");
      });

for (const renderer of ["svg", "canvas"])
  for (const name of ["gradient", "bucketed bar"])
    for (const position of ["bottom", "right"])
      it(`[${renderer}] axisConfig.maxSize replaces a ${name} colorScale's third of the chart at the ${position}`, async () => {
        const side = across(position, medium);
        const arg = {
          rows,
          renderer,
          scale: scales[name],
          position,
          prefix: longer,
        };
        // Two charts at a time: stacked, a fourth would be too far below the
        // viewport to draw.
        const [limited, byNumber] = await drawVariants(
          arg,
          [{}, {maxSize: 60}],
          medium,
        );
        const [byFunction, roomy] = await drawVariants(
          arg,
          [{maxSize: sixth}, {maxSize: side}],
          medium,
        );
        assert.ok(byNumber.drawn, "the colorScale is painted");
        assert.ok(
          byNumber.labelSpace <= 60,
          `a number is the limit (${byNumber.labelSpace})`,
        );
        assert.ok(
          byNumber.labelSpace < limited.labelSpace &&
            byNumber.margin[position] < limited.margin[position],
          `tighter than a third of the chart (${byNumber.margin[position]} < ${limited.margin[position]})`,
        );
        assert.ok(
          roomy.margin[position] > side / 3,
          `a larger one lets the scale take more than a third (${roomy.margin[position]})`,
        );

        assert.deepStrictEqual(
          byFunction.sizes,
          [side],
          `a function is called with the chart's ${side}px`,
        );
        assert.ok(
          byFunction.labelSpace <= side / 6,
          `its result is the limit (${byFunction.labelSpace})`,
        );
        const [twin] = await drawVariants(arg, [{maxSize: side / 6}], medium);
        assert.deepStrictEqual(
          drawn(byFunction),
          drawn(twin),
          `as maxSize: ${side / 6}`,
        );
      });

for (const renderer of ["svg", "canvas"])
  for (const position of ["top", "bottom", "left", "right"])
    it(`[${renderer}] a swatches colorScale takes at most a third of the chart at the ${position}`, async () => {
      const side = across(position);
      const [limited, unlimited] = await drawVariants(
        {rows, renderer, scale: scales.swatches, position, prefix},
        [{}, unlimitedOf("swatches", position)],
        small,
      );
      assert.ok(
        unlimited.margin[position] > side / 3,
        `the scale wants more than a third (${unlimited.margin[position]})`,
      );
      assert.ok(
        unlimited.labels.length >= 2,
        `with room, its swatches are labeled (${unlimited.labels.length})`,
      );
      assert.ok(limited.drawn, "the colorScale is painted");
      assert.ok(
        limited.margin[position] <= side / 3,
        `the scale takes at most a third (${limited.margin[position]})`,
      );
      assert.strictEqual(
        limited.rects,
        unlimited.rects,
        "every bucket keeps its swatch",
      );
      // Labels that don't fit in a third of the chart are left out.
      assert.deepStrictEqual(limited.labels, [], "without labels");
      assertInMargin(limited, position);
    });

for (const renderer of ["svg", "canvas"])
  for (const position of ["left", "right"])
    it(`[${renderer}] a swatches colorScale's labels wrap to fit a third of the chart at the ${position}`, async () => {
      const size = [width, height];
      const [limited, unlimited] = await drawVariants(
        {rows, renderer, scale: scales.swatches, position, prefix},
        [{}, unlimitedOf("swatches", position, size)],
      );
      assert.ok(
        unlimited.margin[position] > width / 3,
        `the scale wants more than a third (${unlimited.margin[position]})`,
      );
      assert.ok(
        limited.margin[position] <= width / 3,
        `the scale takes at most a third (${limited.margin[position]})`,
      );
      assert.deepStrictEqual(
        limited.labels,
        unlimited.labels,
        "every label drawn whole",
      );
      assert.ok(
        limited.height > unlimited.height,
        `on more lines (${limited.height} > ${unlimited.height})`,
      );
      assertInMargin(limited, position, size);
    });

for (const renderer of ["svg", "canvas"])
  for (const position of ["bottom", "right"])
    it(`[${renderer}] legendConfig.${crossKey(position)} replaces a swatches colorScale's third of the chart at the ${position}`, async () => {
      const key = crossKey(position);
      const arg = {rows, renderer, scale: scales.swatches, position, prefix};
      // More than a third of a small chart: room for the labels.
      const side = across(position);
      const [limited, larger] = await drawVariants(
        arg,
        [{}, {legend: {[key]: side - 10}}],
        small,
      );
      assert.deepStrictEqual(
        limited.labels,
        [],
        "no labels in a third of the chart",
      );
      assert.ok(
        larger.labels.length >= 2 &&
          larger.labels.every(l => l.startsWith(prefix)),
        `its swatches are labeled (${larger.labels.join(" | ")})`,
      );
      assert.ok(
        larger.margin[position] > side / 3 &&
          larger.margin[position] <= side - 10,
        `the scale takes more than a third (${larger.margin[position]})`,
      );
      assertInMargin(larger, position);

      // Less than a third of a larger one.
      const size = [width, height];
      const [roomy, smaller] = await drawVariants(arg, [
        {},
        {legend: {[key]: 60}},
      ]);
      assert.ok(
        smaller.margin[position] <= 60 &&
          smaller.margin[position] < roomy.margin[position],
        `the scale takes less (${smaller.margin[position]} < ${roomy.margin[position]})`,
      );
      assert.strictEqual(smaller.rects, roomy.rects, "with every swatch");
      assertInMargin(smaller, position, size);
    });

for (const renderer of ["svg", "canvas"])
  for (const [name, scale] of Object.entries(scales))
    for (const position of ["top", "bottom", "left", "right"])
      it(`[${renderer}] a ${name} colorScale with short labels draws as with no limit at the ${position}`, async () => {
        const [limited, unlimited] = await drawVariants(
          {rows, renderer, scale, position, prefix: ""},
          [{}, unlimitedOf(name, position)],
          small,
        );
        assert.ok(
          limited.labels.length >= 2,
          `its labels are drawn (${limited.labels.join(" | ")})`,
        );
        assert.deepStrictEqual(limited, unlimited, "as with no limit");
      });
