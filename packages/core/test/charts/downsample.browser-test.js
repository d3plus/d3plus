import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Dense lines and areas thin to about two points per pixel of plot by
    Largest-Triangle-Three-Buckets on both renderers, keeping every point
    for hover; `downsample` sets the count or turns it off, stacked areas
    share their points, and a zoom thins only what it shows.
*/

const html = "<div id='viz' style='width:600px;height:300px'></div>";

/** Draws a chart over `n` points per series and reports its paths' points. */
const draw = ([renderer, chart, n, config, zoom]) =>
  new Promise(resolve => {
    const t0 = Date.UTC(2026, 0, 1);
    const data = [];
    for (let i = 0; i < n; i++)
      for (const id of ["a", "b"])
        data.push({
          id,
          x: new Date(t0 + i * 1000),
          y: 50 + Math.sin(i / 40 + id.length) * 20 + (i === 4321 ? 60 : 0),
        });
    const viz = new window.d3plus[chart]()
      .data(data)
      .groupBy("id")
      .xConfig({scale: "time"})
      .config(config)
      .renderer(renderer)
      .width(600)
      .height(300)
      .duration(0)
      .select("#viz");
    const report = () => {
      const flat = nodes =>
        nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const paths = flat(viz._chartScene).filter(
        n => n.type === "path" && n.series && !`${n.key}`.endsWith("::hit"),
      );
      return {
        width: Math.abs(viz._plotArea?.width ?? 0),
        paths: paths.map(n => ({
          key: n.key,
          keys: n.series.keys,
          hover: n.interactionPoints?.length ?? null,
        })),
      };
    };
    viz.render(() => {
      if (!zoom) return resolve(report());
      const first = report();
      viz.zoomIn();
      setTimeout(() => resolve({first, zoomed: report()}), 300);
    });
  });

const run = (renderer, chart, n, config = {}, zoom = false) =>
  render(html, draw, [renderer, chart, n, config, zoom]);

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a dense line draws about two points per pixel, and hovers every point`, async () => {
    const {width, paths} = await run(renderer, "LinePlot", 20000);
    const line = paths.find(p => p.key === "a");
    assert.ok(width > 300, `plot width ${width}`);
    assert.ok(
      line.keys.length <= Math.ceil(width * 2) + 2 && line.keys.length > width,
      `${line.keys.length} points across ${width}px`,
    );
    assert.ok(
      line.keys.includes(Date.UTC(2026, 0, 1) + 4321 * 1000),
      "the spike survives",
    );
    assert.strictEqual(line.hover, 20000);
  });

  it(`${renderer}: downsample sets the count, or false draws every point`, async () => {
    const counted = await run(renderer, "LinePlot", 5000, {downsample: 300});
    assert.strictEqual(counted.paths.find(p => p.key === "a").keys.length, 300);
    const full = await run(renderer, "LinePlot", 5000, {downsample: false});
    assert.strictEqual(full.paths.find(p => p.key === "a").keys.length, 5000);
  });

  it(`${renderer}: a sparse line draws every point`, async () => {
    const {paths} = await run(renderer, "LinePlot", 200);
    assert.strictEqual(paths.find(p => p.key === "a").keys.length, 200);
  });

  it(`${renderer}: stacked areas share their points`, async () => {
    const {paths} = await run(renderer, "StackedArea", 20000);
    const [a, b] = ["a", "b"].map(k => paths.find(p => p.key === k).keys);
    assert.ok(a.length < 20000, `${a.length} points`);
    assert.deepStrictEqual(a, b);
  });

  it(`${renderer}: zooming in thins only the part that shows`, async () => {
    const {first, zoomed} = await run(renderer, "LinePlot", 20000, {}, true);
    const before = first.paths.find(p => p.key === "a").keys;
    const after = zoomed.paths.find(p => p.key === "a").keys;
    const span = keys => keys[keys.length - 1] - keys[0];
    assert.ok(span(after) < span(before), "a narrower stretch");
    assert.ok(
      after.length > before.length * 0.5,
      `still about as many points (${after.length} vs ${before.length})`,
    );
  });
}
