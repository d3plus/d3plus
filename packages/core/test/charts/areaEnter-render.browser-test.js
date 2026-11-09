import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    Areas grow out of the value axis: each Area path's `enterD` is its
    outline flattened onto the baseline (the zero line for a stack, its own
    baseline otherwise), and on both renderers a first draw starts every
    band at zero height there and ends on its own outline.
*/

const data = [
  {id: "A", year: 2020, v: 10},
  {id: "A", year: 2021, v: 30},
  {id: "A", year: 2022, v: 20},
  {id: "B", year: 2020, v: 20},
  {id: "B", year: 2021, v: 5},
  {id: "B", year: 2022, v: 25},
];

/** Every [x, y] pair in a path's `d`. */
const pairs = d =>
  (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [])
    .map(Number)
    .reduce((out, n, i) => {
      if (i % 2) out[out.length - 1].push(n);
      else out.push([n]);
      return out;
    }, []);

/** The value-axis coordinate (`j`: 1 for y, 0 for x) of every pair. */
const along = (d, j) => pairs(d).map(p => p[j]);
const spread = values => Math.max(...values) - Math.min(...values);

/** Draws a chart and reports each Area path's d, enterD, and transform. */
const areas = ([chart, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .groupBy("id")
      .config(config)
      .width(500)
      .height(400)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const flat = nodes =>
        nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      resolve(
        flat(viz._chartScene)
          .filter(
            n =>
              n.type === "path" &&
              n.shapeType === "Area" &&
              !`${n.key}`.endsWith("::hit"),
          )
          .map(n => ({
            key: n.key,
            d: n.d,
            enterD: n.enterD ?? null,
            ty: n.transform?.y ?? 0,
          })),
      );
    });
  });

const run = (chart, config) =>
  render("<div id='viz' style='width:500px;height:400px'></div>", areas, [
    chart,
    config,
  ]);

it("a StackedArea's bands all start flat on the zero line, which the bottom band sits on", async () => {
  const bands = await run("StackedArea", {data, x: "year", y: "v"});
  assert.strictEqual(bands.length, 2);
  const lines = bands.map(n => {
    assert.ok(n.enterD, `${n.key} has an enter start`);
    assert.strictEqual(
      n.enterD.replace(/[-\d.e]+/g, "#"),
      n.d.replace(/[-\d.e]+/g, "#"),
      `${n.key}: the same commands as its outline`,
    );
    assert.deepStrictEqual(
      along(n.enterD, 0),
      along(n.d, 0),
      `${n.key}: every point keeps its x`,
    );
    const ys = along(n.enterD, 1);
    assert.ok(spread(ys) < 1e-6, `${n.key}: flat (${spread(ys)})`);
    return ys[0] + n.ty;
  });
  assert.ok(Math.abs(lines[0] - lines[1]) < 1e-6, "on one line");
  // The zero line is the stack's lowest edge.
  const lowest = Math.max(
    ...bands.flatMap(n => along(n.d, 1).map(y => y + n.ty)),
  );
  assert.ok(Math.abs(lines[0] - lowest) < 0.01, `${lines[0]} vs ${lowest}`);
});

it("an AreaPlot starts on its own baseline", async () => {
  const [area] = await run("AreaPlot", {
    data: data.filter(d => d.id === "A"),
    x: "year",
    y: "v",
  });
  const ys = along(area.enterD, 1);
  assert.ok(spread(ys) < 1e-6, "flat");
  assert.ok(
    Math.abs(ys[0] - Math.max(...along(area.d, 1))) < 0.01,
    "on the area's own bottom edge",
  );
});

it("a horizontal area starts flat on its x baseline", async () => {
  const bands = await run("StackedArea", {
    data,
    discrete: "y",
    x: "v",
    y: "year",
  });
  assert.strictEqual(bands.length, 2);
  for (const n of bands) {
    assert.ok(spread(along(n.enterD, 0)) < 1e-6, `${n.key}: flat in x`);
    assert.deepStrictEqual(along(n.enterD, 1), along(n.d, 1));
  }
});

/** Band A's path `d` at the start, midway, and end of a 1600ms first draw, on a paused clock. */
const frames = renderer =>
  withPage(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async page => {
      await page.clock.pauseAt(Date.now() + 1000);
      await page.evaluate(
        ([renderer, rows]) => {
          window.viz = new window.d3plus.StackedArea()
            .data(rows)
            .groupBy("id")
            .x("year")
            .y("v")
            .legend(false)
            .renderer(renderer)
            .width(500)
            .height(400)
            .duration(1600)
            .select("#viz");
          window.viz.render();
        },
        [renderer, data],
      );
      // The transition starts when the scene is first drawn.
      for (
        let i = 0;
        i < 1000 && !(await page.evaluate(() => !!window.viz._sceneRenderer));
        i++
      )
        await page.clock.runFor(1);
      // The canvas paints each frame's interpolated scene.
      await page.evaluate(() => {
        window.frame = null;
        const r = window.viz._sceneRenderer;
        if (r.kind !== "canvas") return;
        const paint = r._paint.bind(r);
        r._paint = frame => {
          window.frame = frame;
          return paint(frame);
        };
      });
      const target = await page.evaluate(() => {
        const flat = nodes =>
          nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
        const n = flat(window.viz._chartScene).find(
          n => n.type === "path" && n.shapeType === "Area" && n.key === "A",
        );
        return {d: n.d, enterD: n.enterD};
      });
      const current = () =>
        page.evaluate(() => {
          if (window.frame) {
            const flat = nodes =>
              nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
            return flat([window.frame.root]).find(
              n => n.type === "path" && n.key === "A",
            ).d;
          }
          return document
            .querySelector(`svg.d3plus-render-svg path[data-key="A"]`)
            .getAttribute("d");
        });
      const out = [];
      let now = 0;
      for (const ms of [16, 800, 1700]) {
        await page.clock.runFor(ms - now);
        now = ms;
        out.push(await current());
      }
      return {target, frames: out};
    },
    {clock: true},
  );

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a stacked band rises from the zero line to its outline`, async () => {
    const {target, frames: ds} = await frames(renderer);
    const base = along(target.enterD, 1)[0];
    const [start, mid, end] = ds.map(d => along(d, 1));
    const final = along(target.d, 1);
    assert.ok(
      start.every(y => Math.abs(y - base) < 3),
      `starts at zero height on the zero line: ${start} vs ${base}`,
    );
    mid.forEach((y, k) => {
      const lo = Math.min(base, final[k]) - 0.5;
      const hi = Math.max(base, final[k]) + 0.5;
      assert.ok(y >= lo && y <= hi, `midway between: ${y} in [${lo}, ${hi}]`);
    });
    assert.ok(spread(mid) > 1, "midway, the band has some height");
    end.forEach((y, k) =>
      assert.ok(Math.abs(y - final[k]) < 0.5, `ends on its outline: ${y}`),
    );
  });
}
