import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot zooms a brushed box by rescaling its linear and time axes, so the
    box fits the plot rect (where the axes read their values) along the axes
    that zoom: each zoomed axis shows the brushed range, and a discrete axis
    (a LinePlot's x, a horizontal BarChart's y) has no say in how far it
    zooms. It used to fit the box to the whole chart, axis margins included,
    and by both dimensions, so a LinePlot brushed across its width barely
    zoomed. Both backends.
*/

const box = "<div id='viz' style='width:720px;height:360px'></div>";

// Page-side helpers: sample data, a render promise, and the surface pixel
// where an axis value sits (the zoom works in surface pixels).
const PRELUDE = `
  const waves = [];
  ["Alpha", "Beta", "Gamma"].forEach((id, j) => {
    for (let x = 0; x < 40; x++)
      waves.push({id, x, y: Math.round((Math.sin(x / 4 + j) * 10 + 20) * 10) / 10});
  });
  const points = [];
  for (let i = 0; i < 30; i++) points.push({id: "p" + i, x: i * 3, y: (i * 37) % 100});
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const domainOf = axis => axis._d3Scale.domain().map(Number).sort((a, b) => a - b);
  // Where a value on the unzoomed x or y axis sits on the zoom surface.
  const at = (chart, axis, value) => {
    const base = chart._plotZoomBase;
    const ct = base.chartTransform;
    const origin = axis === "x" ? ct.x : ct.y - base.pCtx.x2Height;
    return chart[axis === "x" ? "_xAxis" : "_yAxis"]._d3Scale(value) + origin;
  };
`;

/** Runs `body` in the page after the prelude. */
function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

/** Whether two ranges match to within 1% of the expected one's span. */
function close(got, want) {
  const tol = Math.abs(want[1] - want[0]) * 0.01;
  return Math.abs(got[0] - want[0]) <= tol && Math.abs(got[1] - want[1]) <= tol;
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a LinePlot fits a box brushed across it to the box's y range`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(waves).groupBy("id").x("x").y("y").legend(false).zoomMax(50)
        .renderer(arg);
      await done(chart);
      const x = domainOf(chart._xAxis);
      const zoomed = {};
      // Wide and short, then narrow and tall: the height decides both.
      for (const [name, [x0, x1, y0, y1]] of Object.entries({
        wide: [2, 37, 25, 21], tall: [18, 20, 28, 12],
      })) {
        chart._zoomToBounds(null, 0);
        chart._zoomToBounds(
          [[at(chart, "x", x0), at(chart, "y", y0)], [at(chart, "x", x1), at(chart, "y", y1)]],
          0,
        );
        await frames();
        zoomed[name] = {y: domainOf(chart._yAxis), x: domainOf(chart._xAxis)};
      }
      return {x, zoomed, axes: Object.keys(chart._plotZoomBase.scales)};
    `,
      renderer,
    );
    assert.deepStrictEqual(r.axes, ["y"], "only y zooms");
    for (const [name, want] of [
      ["wide", [21, 25]],
      ["tall", [12, 28]],
    ]) {
      const {x, y} = r.zoomed[name];
      assert.ok(close(y, want), `${name}: y shows ${y} for ${want}`);
      assert.deepStrictEqual(x, r.x, `${name}: x stays put`);
    }
  });

  it(`[${renderer}] a horizontal BarChart fits a box to its x range`, async () => {
    const r = await page(
      `
      const data = ["a", "b", "c", "d", "e"].map((id, i) => ({id, value: 10 + i * 20}));
      const chart = new d3plus.BarChart()
        .data(data).groupBy("id").discrete("y").y("id").x("value").legend(false).zoomMax(50)
        .renderer(arg);
      await done(chart);
      const yAt = chart._yAxis._d3Scale("c") + chart._plotZoomBase.chartTransform.y;
      chart._zoomToBounds([[at(chart, "x", 20), yAt - 5], [at(chart, "x", 60), yAt + 5]], 0);
      await frames();
      return {x: domainOf(chart._xAxis), axes: Object.keys(chart._plotZoomBase.scales)};
    `,
      renderer,
    );
    assert.deepStrictEqual(r.axes, ["x"], "only x zooms");
    assert.ok(close(r.x, [20, 60]), `x shows ${r.x}`);
  });

  it(`[${renderer}] a Scatter fits a box along its tighter axis and centers the other`, async () => {
    const r = await page(
      `
      const chart = new d3plus.Scatter()
        .data(points).groupBy("id").x("x").y("y").legend(false).zoomMax(50)
        .renderer(arg);
      await done(chart);
      const [d0, d1] = domainOf(chart._xAxis), [e0, e1] = domainOf(chart._yAxis);
      // A third of the plot wide, a tenth tall: x is the tighter fit.
      const want = {
        x: [d0 + (d1 - d0) / 3, d0 + (2 * (d1 - d0)) / 3],
        y: [e0 + (e1 - e0) * 0.45, e0 + (e1 - e0) * 0.55],
      };
      const xs = want.x.map(v => at(chart, "x", v)).sort((a, b) => a - b);
      const ys = want.y.map(v => at(chart, "y", v)).sort((a, b) => a - b);
      chart._zoomToBounds([[xs[0], ys[0]], [xs[1], ys[1]]], 0);
      await frames();
      return {want, x: domainOf(chart._xAxis), y: domainOf(chart._yAxis)};
    `,
      renderer,
    );
    assert.ok(close(r.x, r.want.x), `x shows ${r.x} for ${r.want.x}`);
    const mid = (r.y[0] + r.y[1]) / 2;
    const wantMid = (r.want.y[0] + r.want.y[1]) / 2;
    const span = r.want.y[1] - r.want.y[0];
    assert.ok(
      Math.abs(mid - wantMid) < span * 0.01,
      `y centered on the box (${mid} vs ${wantMid})`,
    );
    assert.ok(
      r.y[0] <= r.want.y[0] && r.y[1] >= r.want.y[1],
      `y still shows the box (${r.y})`,
    );
  });

  it(`[${renderer}] a brush drag on a LinePlot zooms y to the dragged rows`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(waves).groupBy("id").x("x").y("y").legend(false).zoomMax(50)
        .zoomControls(false).zoomDrag("brush")
        .renderer(arg);
      await done(chart);
      const el = (chart._zoomEventTarget || chart._container).node();
      const rect = el.getBoundingClientRect();
      const fire = (type, px, py, target) => target.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window, button: 0, detail: 1,
        clientX: rect.left + px, clientY: rect.top + py,
      }));
      const x0 = at(chart, "x", 3), x1 = at(chart, "x", 36);
      const y0 = at(chart, "y", 26), y1 = at(chart, "y", 18);
      fire("mousedown", x0, y0, el);
      fire("mousemove", (x0 + x1) / 2, (y0 + y1) / 2, window);
      fire("mousemove", x1, y1, window);
      fire("mouseup", x1, y1, window);
      await new Promise(resolve => setTimeout(resolve, 50));
      await frames();
      return {y: domainOf(chart._yAxis)};
    `,
      renderer,
    );
    assert.ok(close(r.y, [18, 26]), `y shows ${r.y}`);
  });
}
