import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    An axis `maxSize` given as a function, through chart configs. The
    function is called with the room the chart has for the axis (its height
    for a horizontal axis, its width for a vertical one), the same size on
    every layout pass, and its result limits the labels as that number would.
    Driven in real Chromium for text measurement.
*/

/**
    Renders `setup` (which wraps its `maxSize` function in `sized` to record
    the sizes it is called with) and reads back the chart's `axis`.
*/
const probe = ([setup, renderer, read]) =>
  new Promise(resolve => {
    const sizes = [];
    const sized = fn => size => (sizes.push(size), fn(size));
    const viz = new Function("d3plus", "sized", `return ${setup}`)(
      window.d3plus,
      sized,
    )
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const texts = [];
      const walk = node => {
        if (!node) return;
        if (node.type === "text")
          texts.push(node.lines.map(l => l.text).join("/"));
        (node.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      const axis = read ? viz[read] : undefined;
      resolve({
        sizes: [...new Set(sizes)],
        calls: sizes.length,
        texts,
        labelSpace: axis?._labelSpace,
        bounds: axis?.outerBounds(),
        range: axis?._getRange(),
      });
    });
  });

const run = (setup, renderer, read) =>
  render("<div id='viz' style='width:800px;height:500px'></div>", probe, [
    setup,
    renderer,
    read,
  ]);

const line = `new d3plus.LinePlot().data([
  {id: "a", x: "Professional, Scientific, and Technical Services", y: 10},
  {id: "a", x: "Health Care and Social Assistance", y: 20},
  {id: "a", x: "Arts, Entertainment, and Recreation plus Accommodation and Food", y: 15},
]).groupBy("id").x("x").y("y").discrete("x")`;
const longFormat = `tickFormat: d => "A long value label of " + (+d) + " units"`;

/** Each Plot axis: its config key, the config that gives it long labels, and its chart size. */
const plotAxes = [
  ["x", "", "xConfig", "labelRotation: true", 500, 5],
  ["y", "", "yConfig", longFormat, 800, 8],
  ["x2", `.x2("x")`, "x2Config", "labelRotation: true", 500, 5],
  ["y2", `.y2("y")`, "y2Config", longFormat, 800, 8],
];

for (const renderer of ["svg", "canvas"])
  for (const [key, extra, config, labels, size, divisor] of plotAxes)
    it(`[${renderer}] ${config}: a maxSize function limits the label room`, async () => {
      const chart = line + extra;
      const read = `_${key}Axis`;
      const unset = await run(
        `${chart}.${config}({${labels}})`,
        renderer,
        read,
      );
      const byFunction = await run(
        `${chart}.${config}({${labels}, maxSize: sized(d => d / ${divisor})})`,
        renderer,
        read,
      );
      const byNumber = await run(
        `${chart}.${config}({${labels}, maxSize: ${size / divisor}})`,
        renderer,
        read,
      );

      assert.ok(byFunction.calls > 0, "the function is called");
      assert.deepStrictEqual(
        byFunction.sizes,
        [size],
        `every pass hands it the chart's ${size}px`,
      );
      assert.ok(
        byFunction.labelSpace < unset.labelSpace,
        `less label room than unset (${byFunction.labelSpace} < ${unset.labelSpace})`,
      );
      assert.ok(
        byFunction.labelSpace <= size / divisor,
        `within the limit (${byFunction.labelSpace})`,
      );
      for (const k of ["labelSpace", "bounds", "range", "texts"])
        assert.deepStrictEqual(
          byFunction[k],
          byNumber[k],
          `${k} matches maxSize: ${size / divisor}`,
        );
    });

const matrix = `new d3plus.Matrix().data([
  {r: "Professional, Scientific, and Technical Services", c: "One", v: 1},
  {r: "Arts, Entertainment, and Recreation", c: "Two", v: 2},
  {r: "Arts, Entertainment, and Recreation", c: "One", v: 3},
]).groupBy(["r", "c"]).row("r").column("c")`;
const parallel = `new d3plus.ParallelCoordinates().data([
  {id: "a", one: "Professional, Scientific, and Technical Services", two: 3},
  {id: "b", one: "Health Care and Social Assistance", two: 6},
]).groupBy("id").dimensions(["one", "two"])`;
const gantt = `new d3plus.Gantt().data([
  {id: "a", start: "2024-03-04", end: "2024-03-14"},
  {id: "b", start: "2024-03-10", end: "2024-04-22"},
]).groupBy("id")`;
const colorScale = `new d3plus.Treemap()
  .data([{id: "a", v: 1}, {id: "b", v: 5}, {id: "c", v: 9}])
  .groupBy("id").sum("v").colorScale("v").colorScalePosition("right")`;

/** Other configs that reach an Axis: the chart, then its config with and without the function. */
const others = {
  "Matrix rowConfig": [matrix, `.rowConfig({maxSize: sized(d => d / 10)})`, ""],
  "ParallelCoordinates axisConfig": [
    parallel,
    `.axisConfig({maxSize: sized(d => d / 4)})`,
    "",
  ],
  "colorScaleConfig axisConfig": [
    colorScale,
    `.colorScaleConfig({scale: "linear", axisConfig: {${longFormat}, maxSize: sized(d => d / 8)}})`,
    `.colorScaleConfig({scale: "linear", axisConfig: {${longFormat}}})`,
  ],
};

for (const renderer of ["svg", "canvas"])
  for (const [name, [chart, withFunction, without]] of Object.entries(others))
    it(`[${renderer}] ${name}: a maxSize function wraps the labels tighter`, async () => {
      const unset = await run(chart + without, renderer);
      const byFunction = await run(chart + withFunction, renderer);
      assert.ok(byFunction.calls > 0, "the function is called");
      assert.ok(
        byFunction.sizes.every(size => size > 0),
        `with the axis's size (${byFunction.sizes})`,
      );
      const lines = r => r.texts.join("/").split("/").length;
      assert.ok(
        lines(byFunction) > lines(unset),
        `labels wrap onto more lines (${lines(byFunction)} > ${lines(unset)})`,
      );
    });

it("Gantt axisConfig: a maxSize function reads one size on every pass", async () => {
  // The axis is measured over the chart's height, then drawn over its rows.
  const out = await run(
    `${gantt}.axisConfig({maxSize: sized(d => d / 4)})`,
    "svg",
  );
  assert.ok(out.calls > 0, "the function is called");
  assert.strictEqual(out.sizes.length, 1, `one size (${out.sizes})`);
});

/**
    Draws an axis along the bottom once per `maxSize`, its labels long enough
    to wrap onto several lines, and reads back how deep each one is.
*/
const depths = sizes =>
  sizes.reduce(
    (done, maxSize) =>
      done.then(
        out =>
          new Promise(resolve => {
            const axis = new window.d3plus.Axis()
              .domain([0, 100])
              .labels([0, 50, 100])
              .tickFormat(
                d => `A long label of ${d} units that wraps onto lines`,
              )
              .labelRotation(false)
              .gridSize(0)
              .maxSize(maxSize)
              .width(400)
              .height(300)
              .duration(0)
              .select("#viz");
            axis.render(() => resolve([...out, axis.outerBounds().height]));
          }),
      ),
    Promise.resolve([]),
  );

it("flat labels and their padding stay within any maxSize", async () => {
  // From one line of labels to all of their lines, a pixel at a time.
  const sizes = Array.from({length: 91}, (_, i) => 40 + i);
  const drawn = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    depths,
    sizes,
  );
  assert.deepStrictEqual(
    sizes.filter((maxSize, i) => drawn[i] > maxSize),
    [],
    `no axis is deeper than its maxSize (${drawn.join(", ")})`,
  );
  assert.ok(
    new Set(drawn).size >= 3,
    `the labels wrap onto more lines as maxSize grows (${[...new Set(drawn)].join(", ")})`,
  );
});
