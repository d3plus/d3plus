import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot's `aspectRatio` in a real browser, on both renderers: the plot
    area shrinks along its too-long side, centered, so one y unit draws
    `aspectRatio` times an x unit (decades on log axes); small multiples
    hold it per panel, a zoom keeps it, and a category axis ignores it
    with a warning.
*/

const draw = ({
  renderer,
  ratio = 1,
  width = 700,
  height = 400,
  log = false,
  facet = false,
  zoom,
  y2 = false,
  discrete,
}) =>
  new Promise(resolve => {
    const warned = [];
    const warn = console.warn;
    console.warn = msg => warned.push(String(msg));
    const data = [];
    for (let i = 0; i <= 10; i++)
      data.push({
        id: `p${i}`,
        group: i % 2 ? "Odd" : "Even",
        x: log ? Math.pow(10, i / 2.5) : i,
        y: log ? Math.pow(10, i / 5) : i * 1.2 - 2,
        y2: i * 100,
      });
    const el = document.querySelector("#viz");
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    const viz = new window.d3plus.Plot()
      .data(data)
      .groupBy("id")
      .x(discrete ? "id" : "x")
      .y("y")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .shapeConfig({Circle: {label: false}})
      .aspectRatio(ratio)
      .select("#viz");
    if (log) viz.xConfig({scale: "log"}).yConfig({scale: "log"});
    if (facet) viz.facet("group");
    if (y2) viz.y2("y2");
    if (discrete) viz.discrete("x");
    if (zoom) viz.zoom(true);
    viz.render(() => {
      console.warn = warn;
      const units = axis => {
        const domain = axis._getDomain().map(Number);
        const range = axis._getRange();
        const span = log
          ? Math.abs(Math.log10(domain[1]) - Math.log10(domain[0]))
          : Math.abs(domain[1] - domain[0]);
        return Math.abs(range[1] - range[0]) / span;
      };
      const read = () => ({
        kx: units(viz._xAxis),
        ky: units(viz._yAxis),
        // The plot rect on the chart: its y range is in content space, which
        // moves down with the plot.
        body: {
          ...viz._bodyRect,
          y: viz._bodyRect.y + (viz._chartTransform?.y ?? 0),
        },
        xRange: viz._xAxis._getRange(),
        yRange: viz._yAxis._getRange(),
      });
      const out = {warned, ...read()};
      if (zoom) {
        viz._zoomRescale(zoom);
        out.zoomed = read();
      }
      out.canvas = !!document.querySelector("#viz canvas");
      out.panels = (viz._facetPanels || []).length;
      resolve(out);
    });
  });

const page = '<div id="viz"></div>';

const close = (a, b, tolerance, message) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${message}: ${a} vs ${b}`);

for (const renderer of ["svg", "canvas"]) {
  it(`aspectRatio 1 narrows a wide plot, centered (${renderer})`, async () => {
    const free = await render(page, draw, {renderer, ratio: false});
    const out = await render(page, draw, {renderer});
    close(out.ky, out.kx, out.kx * 0.01, "a y unit draws as long as an x unit");
    assert.ok(out.body.width < free.body.width - 50, "the plot narrows");
    close(out.body.height, free.body.height, 1, "and keeps its height");
    close(
      out.body.x + out.body.width / 2,
      free.body.x + free.body.width / 2,
      2,
      "centered",
    );
    assert.deepStrictEqual(out.warned, []);
    if (renderer === "canvas") assert.ok(out.canvas);
  });

  it(`aspectRatio shortens a tall plot, and scales by its number (${renderer})`, async () => {
    const free = await render(page, draw, {
      renderer,
      ratio: false,
      width: 300,
      height: 600,
    });
    const tall = await render(page, draw, {renderer, width: 300, height: 600});
    close(tall.ky, tall.kx, tall.kx * 0.01, "square units");
    assert.ok(tall.body.height < free.body.height - 50, "the plot shortens");
    close(
      tall.body.y + tall.body.height / 2,
      free.body.y + free.body.height / 2,
      2,
      "centered",
    );
    const two = await render(page, draw, {renderer, ratio: 2});
    close(two.ky, 2 * two.kx, two.kx * 0.02, "a y unit twice an x unit");
  });

  it(`log axes measure in decades; y2 follows the plot (${renderer})`, async () => {
    const log = await render(page, draw, {renderer, log: true});
    close(log.ky, log.kx, log.kx * 0.01, "a decade each way");
    const y2 = await render(page, draw, {renderer, y2: true});
    close(y2.ky, y2.kx, y2.kx * 0.01, "with a y2 axis");
  });

  it(`small multiples hold it per panel, and a zoom keeps it (${renderer})`, async () => {
    const facet = await render(page, draw, {renderer, facet: true, width: 900});
    assert.strictEqual(facet.panels, 2);
    close(facet.ky, facet.kx, facet.kx * 0.01, "the last panel's units");
    const zoomed = await render(page, draw, {
      renderer,
      zoom: {k: 2, x: -300, y: -150},
    });
    close(
      zoomed.zoomed.ky,
      zoomed.zoomed.kx,
      zoomed.zoomed.kx * 0.01,
      "zoomed",
    );
    assert.deepStrictEqual(zoomed.zoomed.body, zoomed.body);
  });

  it(`a category axis ignores it, with a warning (${renderer})`, async () => {
    const free = await render(page, draw, {
      renderer,
      ratio: false,
      discrete: true,
    });
    const out = await render(page, draw, {renderer, discrete: true});
    // Each warning logs once per page, on the first renderer's run.
    if (renderer === "svg")
      assert.ok(
        out.warned.some(w => /no even unit/.test(w)),
        `${out.warned}`,
      );
    assert.deepStrictEqual(out.body, free.body);
  });
}
