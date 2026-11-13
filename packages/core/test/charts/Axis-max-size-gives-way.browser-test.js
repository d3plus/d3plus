import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    When an axis's `maxSize` leaves less room than one line of its labels
    needs, the axis draws no labels, and when it leaves less than its title
    needs, no title; its line, ticks and (for a color scale) its bar still
    draw, and it claims only what it draws. The title gives way first when
    that lets the labels fit. In a real browser on both renderers: a color
    scale's bar (a gradient and a `bucketAxis`, along the bottom and the
    right) and a LinePlot's x axis given an `xConfig.maxSize`. A Plot axis
    under the chart's own limit (no `maxSize` set) still keeps its line of
    labels and its title.
*/

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));

const title = "What the colors show";

/**
    Draws `arg.setup` and reports the painted text of the axis at `arg.axis`
    (a color scale's axis when unset), how many rects the color scale draws,
    and the chart's margins.
*/
const draw = arg =>
  new Promise(resolve => {
    const viz = new Function("d3plus", "rows", `return ${arg.setup}`)(
      window.d3plus,
      arg.rows,
    )
      .renderer(arg.renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const out = {texts: [], rects: 0, ticks: 0, margin: viz._margin};
      const walk = (n, inAxis, inScale) => {
        const key = String(n.key || "");
        const axis =
          inAxis || (arg.axis ? key.endsWith(arg.axis) : /^Axis-/.test(key));
        const scale = inScale || key === "viz-colorScale";
        if (axis && n.type === "text" && n.lines.length)
          out.texts.push(n.lines.map(l => l.text).join(" "));
        if (axis && (n.type === "line" || n.type === "rect")) out.ticks++;
        if (scale && !axis && n.type === "rect") out.rects++;
        (n.children || []).forEach(c => walk(c, axis, scale));
      };
      walk(viz._paintedScene.root, false, false);
      resolve(out);
    });
  });

const drawChart = (renderer, setup, [width, height], axis) =>
  render(
    `<div id='viz' style='width:${width}px;height:${height}px'></div>`,
    draw,
    {renderer, setup, rows, axis},
  );

const scales = {
  gradient: `scale: "linear"`,
  bucketAxis: `scale: "jenks", bucketAxis: true`,
};

const colorScale = (position, scale, axisConfig) =>
  `new d3plus.Treemap().data(rows).groupBy("id").sum("v").colorScale("v")
    .colorScalePosition("${position}")
    .colorScaleConfig({${scale}, axisConfig: {${axisConfig}}})`;

// A third of a 150px tall chart, less the bar (10px) and the padding on its
// two sides (5px each): the room a color scale gives its axis there.
const third = 150 / 3 - 20;

for (const renderer of ["svg", "canvas"])
  for (const [name, scale] of Object.entries(scales)) {
    it(`[${renderer}] a ${name} color scale draws its bar without labels when one line doesn't fit`, async () => {
      const size = [400, 150];
      const out = await drawChart(
        renderer,
        colorScale("bottom", scale, `maxSize: ${third}, title: "${title}"`),
        size,
      );
      assert.deepStrictEqual(out.texts, [], "no labels or title");
      assert.ok(out.rects > 0, "the bar draws");
      assert.ok(out.ticks > 0, "the ticks draw");
      assert.ok(
        out.margin.bottom <= 150 / 3,
        `the scale takes at most a third (${out.margin.bottom})`,
      );
    });

    it(`[${renderer}] a ${name} color scale drops its title first when that lets its labels fit`, async () => {
      // 40px holds one line of labels (and the ticks and padding), not a title too.
      const size = [400, 300];
      const titled = await drawChart(
        renderer,
        colorScale("bottom", scale, `maxSize: 40, title: "${title}"`),
        size,
      );
      const plain = await drawChart(
        renderer,
        colorScale("bottom", scale, "maxSize: 40"),
        size,
      );
      assert.ok(!titled.texts.includes(title), "no title");
      assert.ok(titled.texts.length > 0, "labels drawn");
      assert.deepStrictEqual(titled.texts, plain.texts, "as with no title");
      assert.strictEqual(titled.margin.bottom, plain.margin.bottom);
    });

    it(`[${renderer}] a ${name} color scale keeps its title when only its labels don't fit`, async () => {
      const size = [400, 300];
      const out = await drawChart(
        renderer,
        colorScale(
          "bottom",
          scale,
          `maxSize: 40, title: "${title}", shapeConfig: {labelConfig: {fontSize: 30}}`,
        ),
        size,
      );
      assert.deepStrictEqual(out.texts, [title], "only the title");
    });

    it(`[${renderer}] a ${name} color scale at the right draws its bar without labels when none fits`, async () => {
      const size = [400, 300];
      const out = await drawChart(
        renderer,
        colorScale("right", scale, `maxSize: 10, title: "${title}"`),
        size,
      );
      assert.deepStrictEqual(out.texts, [], "no labels or title");
      assert.ok(out.rects > 0, "the bar draws");
      assert.ok(
        out.margin.right <= 10 + 20,
        `the scale claims its bar, padding and limit (${out.margin.right})`,
      );
    });
  }

const line = `new d3plus.LinePlot()
  .data(["Alpha", "Beta", "Gamma"].map((x, i) => ({id: "a", x, y: 10 + i})))
  .groupBy("id").x("x").y("y").discrete("x").legend(false)`;

/** Draws `setup` and reports what its x axis claims across its labels. */
const xClaim = ([setup, renderer]) =>
  new Promise(resolve => {
    const viz = new Function("d3plus", `return ${setup}`)(window.d3plus)
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const axis = viz._xAxis;
      resolve({
        claim: axis._labelSpace + axis._margin.bottom,
        title: !axis._dropTitle,
      });
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a LinePlot's x axis draws no labels when its xConfig.maxSize is too small for one line`, async () => {
    const out = await drawChart(
      renderer,
      `${line}.xConfig({maxSize: 20, title: "${title}"})`,
      [400, 300],
      "plot-x-axis",
    );
    assert.deepStrictEqual(out.texts, [], "no labels or title");
    assert.ok(out.ticks > 0, "the axis line and ticks draw");
  });

  it(`[${renderer}] a LinePlot's x axis drops its title to fit its xConfig.maxSize`, async () => {
    const out = await drawChart(
      renderer,
      `${line}.xConfig({maxSize: 40, title: "${title}"})`,
      [400, 300],
      "plot-x-axis",
    );
    assert.deepStrictEqual(out.texts, ["Alpha", "Beta", "Gamma"]);
  });

  it(`[${renderer}] a LinePlot's x axis keeps its labels and title past the chart's own limit`, async () => {
    // Half of a 100px tall chart is too little for a line of labels and a
    // title, but the limit the chart sets itself lets them take more; the
    // same limit set in xConfig doesn't.
    const size = "<div id='viz' style='width:400px;height:100px'></div>";
    const own = await render(size, xClaim, [
      `${line}.xConfig({title: "${title}"})`,
      renderer,
    ]);
    const set = await render(size, xClaim, [
      `${line}.xConfig({title: "${title}", maxSize: 50})`,
      renderer,
    ]);
    assert.ok(own.title && own.claim > 50, JSON.stringify(own));
    assert.ok(!set.title && set.claim <= 50, JSON.stringify(set));
  });
}
