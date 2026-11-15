import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot's shape config reads a shape's per-datum keys as the Shape does:
    a number (`shapeConfig.Rect.width: 12`) as a constant, and a string
    (`width: "w"`) as the data field to read from each row, which both sizes
    each mark and buffers the axes for it. On both backends.
*/

/** Renders a Plot of Rects with the `shapeConfig` its source gives, and reports each data rect's size and the x and y domains. */
const draw = ([shapeConfig, renderer]) =>
  new Promise((resolve, reject) => {
    const errors = [];
    const error = console.error;
    console.error = (...args) => errors.push(args.map(String).join(" "));
    const data = [0, 1, 2, 3, 4].map(i => ({
      id: `r${i}`,
      x: i,
      y: i * 2 + 1,
      // The last rect is wide enough to need room past the x domain's end.
      w: i === 4 ? 300 : 10 + i * 10,
      h: 40 - i * 5,
    }));
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
          .map(n => ({id: n.datum.data.id, width: n.width, height: n.height}))
          .sort((a, b) => (a.id < b.id ? -1 : 1));
        resolve({
          errors,
          rects,
          x: viz._xAxis._d3Scale.domain().map(Number),
          y: viz._yAxis._d3Scale.domain().map(Number),
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
    assert.ok(r.x[0] < 0 && r.x[1] > 4, "buffers the domain");
  });

  it(`Plot ${renderer} — a plain Rect width matches a function returning it`, async () => {
    const plain = await run("{Rect: {width: 20, height: 10}}", renderer);
    const fn = await run(
      "{Rect: {width: () => 20, height: () => 10}}",
      renderer,
    );
    assert.deepStrictEqual(plain, fn);
  });

  it(`Plot ${renderer} — a Rect width and height naming data fields read each row`, async () => {
    const r = await run("{Rect: {width: 'w', height: 'h'}}", renderer);
    assert.deepStrictEqual(r.errors, []);
    assert.deepStrictEqual(
      r.rects.map(({width, height}) => [width, height]),
      [0, 1, 2, 3, 4].map(i => [i === 4 ? 300 : 10 + i * 10, 40 - i * 5]),
    );
    // As a function reading the same fields does, sizing and buffering alike.
    const fn = await run(
      "{Rect: {width: d => d.w, height: d => d.h}}",
      renderer,
    );
    assert.deepStrictEqual(r, fn);
    // The buffer reads each row: the wide last rect needs more room past the
    // domain's end than rects sized like the first one.
    const narrow = await run("{Rect: {width: 10, height: 40}}", renderer);
    assert.ok(r.x[1] > narrow.x[1], "buffers by the row's own width");
  });

  it(`Plot ${renderer} — a Circle radius naming a data field reads each row`, async () => {
    const out = await render(
      "<div id='viz' style='width:600px;height:300px'></div>",
      renderer =>
        new Promise(resolve => {
          const data = [0, 1, 2].map(i => ({
            id: `c${i}`,
            x: i,
            y: i,
            size: 4 + i * 4,
          }));
          const viz = new window.d3plus.Plot()
            .data(data)
            .groupBy("id")
            .x("x")
            .y("y")
            .shapeConfig({Circle: {r: "size"}})
            .legend(false)
            .duration(0)
            .renderer(renderer)
            .select("#viz");
          viz.render(() => {
            const flat = nodes =>
              nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
            resolve(
              flat(viz._chartScene)
                .filter(
                  n => n.type === "circle" && !String(n.key).endsWith("::hit"),
                )
                .map(n => [n.datum.data.id, n.r])
                .sort(),
            );
          });
        }),
      renderer,
    );
    assert.deepStrictEqual(out, [
      ["c0", 4],
      ["c1", 8],
      ["c2", 12],
    ]);
  });
}
