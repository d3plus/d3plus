import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    An axis keeps everything it claims across its labels (labels, their
    padding, ticks and title) within its `maxSize`, whatever layout the
    labels take: flat and wrapped, slanted, upright, or staggered. Driven in
    real Chromium for text measurement.
*/

/**
    Lays out a standalone axis once per `maxSize` in `arg.sizes`, from
    `arg.config`, and reads back how deep each one is and how its labels lie.
*/
const depths = arg =>
  arg.sizes.reduce(
    (done, maxSize) =>
      done.then(
        out =>
          new Promise(resolve => {
            const config = new Function(`return ${arg.config}`)();
            const axis = new window.d3plus.Axis()
              .domain([0, 100])
              .tickFormat(
                d => `A long label of ${d} units that wraps onto lines`,
              )
              .gridSize(0)
              .width(400)
              .height(300)
              .duration(0)
              .config(config)
              .select("#viz");
            if (maxSize !== null) axis.maxSize(maxSize);
            axis.render(() => {
              const {width, height} = axis.outerBounds();
              resolve([
                ...out,
                {
                  maxSize,
                  depth: ["left", "right"].includes(axis.orient())
                    ? width
                    : height,
                  slant: axis._labelSlant,
                  rotate: !!axis._labelRotation,
                },
              ]);
            });
          }),
      ),
    Promise.resolve([]),
  );

// From room for a line of labels and a title up.
const sizes = Array.from({length: 46}, (_, i) => 60 + i * 4);
const eleven = "labels: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]";

const layouts = {
  "left to decide": "labels: [0, 50, 100]",
  slanted: "labels: [0, 50, 100], labelRotation: -30",
  upright: "labels: [0, 50, 100], labelRotation: true",
  staggered: `${eleven}, labelRotation: false, labelOffset: true`,
  "titled, left to decide": `labels: [0, 50, 100], title: "An axis title"`,
  "titled and staggered": `${eleven}, labelRotation: false, labelOffset: true, title: "An axis title"`,
  "along the left": `labels: [0, 50, 100], orient: "left"`,
};

for (const [name, config] of Object.entries(layouts))
  it(`${name}: an axis is no deeper than its maxSize`, async () => {
    const drawn = await render(
      "<div id='viz' style='width:400px;height:300px'></div>",
      depths,
      {sizes, config: `({${config}})`},
    );
    const over = drawn.filter(d => d.depth > d.maxSize);
    assert.deepStrictEqual(
      over.map(d => `${d.depth} > ${d.maxSize}`),
      [],
      "no axis deeper than its maxSize",
    );
  });

it("slanted labels wrap onto fewer lines to fit, rather than reach past maxSize", async () => {
  const [unlimited, limited] = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    depths,
    {sizes: [null, 60], config: "({labels: [0, 50, 100], labelRotation: -30})"},
  );
  assert.ok(unlimited.slant && limited.slant, "both slant");
  assert.ok(unlimited.depth > 60, `unlimited, ${unlimited.depth}px deep`);
  assert.ok(limited.depth <= 60, `limited, ${limited.depth}px deep`);
});

it("staggered labels lie in one row when two don't fit maxSize", async () => {
  const config = `({${eleven}, labelRotation: false, labelOffset: true})`;
  const [unlimited, limited, flat] = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    depths,
    {sizes: [null, 100, 100], config},
  );
  const [plain] = await render(
    "<div id='viz' style='width:400px;height:300px'></div>",
    depths,
    {sizes: [100], config: `({${eleven}, labelRotation: false})`},
  );
  assert.ok(unlimited.depth > 100, `staggered, ${unlimited.depth}px deep`);
  assert.strictEqual(limited.depth, plain.depth, "as one row of labels");
  assert.strictEqual(flat.depth, limited.depth, "the same each time");
});

it("an axis with no maxSize, or one its labels fit, lays out as before", async () => {
  // Every layout above, unlimited and within a limit it never reaches.
  for (const config of Object.values(layouts)) {
    const [none, roomy] = await render(
      "<div id='viz' style='width:400px;height:300px'></div>",
      depths,
      {sizes: [null, 1000], config: `({${config}})`},
    );
    assert.deepStrictEqual(
      {...roomy, maxSize: null},
      none,
      `${config}: unchanged by a limit it doesn't reach`,
    );
  }
});

/** Draws `setup` and reports its x axis's claim and painted labels. */
const drawPlot = ([setup, renderer]) =>
  new Promise(resolve => {
    const viz = new Function("d3plus", `return ${setup}`)(window.d3plus)
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const labels = [];
      const walk = (n, inAxis) => {
        const axis = inAxis || String(n.key || "").endsWith("plot-x-axis");
        if (axis && n.type === "text" && n.lines.length)
          labels.push(n.lines.map(l => l.text).join(" "));
        (n.children || []).forEach(c => walk(c, axis));
      };
      walk(viz._paintedScene.root, false);
      const axis = viz._xAxis;
      resolve({
        labels,
        claim: axis._labelSpace + axis._margin.bottom,
        slant: axis._labelSlant,
      });
    });
  });

const industries = `[
  "Agriculture, Forestry, Fishing and Hunting",
  "Professional, Scientific, and Technical Services",
  "Health Care and Social Assistance",
  "Arts, Entertainment, and Recreation",
  "Accommodation and Food Services",
  "Administrative and Support Services",
].map((x, i) => ({id: "a", x, y: 10 + i}))`;

for (const renderer of ["svg", "canvas"])
  it(`[${renderer}] a LinePlot's slanted x labels keep within its xConfig.maxSize`, async () => {
    const chart = `new d3plus.LinePlot().data(${industries}).groupBy("id")
      .x("x").y("y").discrete("x").legend(false)`;
    const size = "<div id='viz' style='width:500px;height:400px'></div>";
    const unlimited = await render(size, drawPlot, [
      `${chart}.xConfig({labelRotation: -30})`,
      renderer,
    ]);
    const limited = await render(size, drawPlot, [
      `${chart}.xConfig({labelRotation: -30, maxSize: 70})`,
      renderer,
    ]);
    assert.ok(unlimited.slant && limited.slant, "both slant");
    assert.ok(unlimited.claim > 70, `unlimited claims ${unlimited.claim}px`);
    assert.ok(limited.claim <= 70, `limited claims ${limited.claim}px`);
    assert.ok(
      limited.labels.length > 0 && limited.labels.every(l => l.length > 0),
      `and draws its labels (${limited.labels.join(" | ")})`,
    );
  });
