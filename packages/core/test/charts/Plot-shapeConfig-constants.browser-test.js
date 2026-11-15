import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A plain number in a Plot's shape config for a key a shape reads per
    datum (`shapeConfig.Rect.width: 12`) works as a constant, as a function
    returning it would, on both backends.
*/

/** Renders a Plot of Rects with the `shapeConfig` its source gives, and reports each data rect's size and the plot's x domain. */
const draw = ([shapeConfig, renderer]) =>
  new Promise((resolve, reject) => {
    const errors = [];
    const error = console.error;
    console.error = (...args) => errors.push(args.map(String).join(" "));
    const data = [0, 1, 2, 3, 4].map(i => ({id: `r${i}`, x: i, y: i * 2 + 1}));
    const viz = new window.d3plus.Plot()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .shape("Rect")
      .shapeConfig(new Function(`return (${shapeConfig});`)())
      .legend(false)
      .duration(0)
      .renderer(renderer)
      .select("#viz");
    viz.render(() => {
      console.error = error;
      try {
        const flat = nodes =>
          nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
        const rects = flat(viz._chartScene)
          .filter(
            n =>
              n.type === "rect" &&
              n.shapeType === "Rect" &&
              !String(n.key).endsWith("::hit"),
          )
          .map(n => ({width: n.width, height: n.height}));
        resolve({
          errors,
          rects,
          domain: viz._xAxis._d3Scale.domain().map(Number),
        });
      } catch (e) {
        reject(e);
      }
    });
  });

const run = (shapeConfig, renderer) =>
  render("<div id='viz' style='width:600px;height:300px'></div>", draw, [
    shapeConfig,
    renderer,
  ]);

for (const renderer of ["svg", "canvas"]) {
  it(`Plot ${renderer} — a plain Rect width and height draw every rect at that size`, async () => {
    const r = await run("{Rect: {width: 12, height: 8}}", renderer);
    assert.deepStrictEqual(r.errors, []);
    assert.strictEqual(r.rects.length, 5);
    r.rects.forEach(rect => {
      assert.strictEqual(rect.width, 12);
      assert.strictEqual(rect.height, 8);
    });
    // The x axis makes room past the data for the rects at its ends.
    assert.ok(r.domain[0] < 0 && r.domain[1] > 4, "buffers the domain");
  });

  it(`Plot ${renderer} — a plain Rect width matches a function returning it`, async () => {
    const plain = await run("{Rect: {width: 20, height: 10}}", renderer);
    const fn = await run(
      "{Rect: {width: () => 20, height: () => 10}}",
      renderer,
    );
    assert.deepStrictEqual(plain.rects, fn.rects);
    assert.deepStrictEqual(plain.domain, fn.domain);
  });
}
