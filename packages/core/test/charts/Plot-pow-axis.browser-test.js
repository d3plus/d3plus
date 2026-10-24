import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {openPage} from "~test/browser/page.js";

/**
    #768: a Plot axis config's `exponent` draws a `"pow"` axis at that
    exponent: the marks, ticks and gridlines follow it, the axis zooms, and
    the axis-hover badge reads the hovered value back, on both backends.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";

const data = [];
[1, 40, 2000].forEach((size, s) =>
  [2010, 2011, 2012, 2013, 2014].forEach((year, k) =>
    data.push({id: `s${s}`, year, value: size * 1000 * (1 + k * 0.25)}),
  ),
);

const PRELUDE = `
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const lines = chart => {
    const out = {};
    const walk = nodes => nodes.forEach(n => {
      if (n.shapeType === "Line" && n.interactionPoints && !String(n.key).endsWith("::hit"))
        out[n.datum && n.datum.id] = n.interactionPoints.map(p => p.y);
      if (n.children) walk(n.children);
    });
    walk(chart._chartScene);
    return out;
  };
`;

const page = (body, arg) =>
  render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a pow y axis with an exponent places the lines on it`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(arg.data).groupBy("id").x("year").y("value")
        .legend(false).renderer(arg.renderer)
        .yConfig({scale: "pow", exponent: 0.3});
      await done(chart);
      const axis = chart._yAxis;
      const y = v => axis._getPosition(v);
      return {
        exponent: axis._d3Scale.exponent(),
        domain: axis._d3Scale.domain(),
        expected: arg.data.filter(d => d.id === "s0").map(d => y(d.value)),
        line: lines(chart).s0,
        labels: axis._getLabels(),
        labelPixels: axis._getLabels().map(y),
        grid: axis._gridLineData.map(d => d.id),
      };
    `,
      {data, renderer},
    );
    assert.strictEqual(r.exponent, 0.3);
    assert.strictEqual(r.domain[1], 0, "rounded outside to 0 (high to low)");
    assert.deepStrictEqual(
      r.line.map(Math.round),
      r.expected.map(Math.round),
      "the line sits on the pow scale",
    );
    const gaps = r.labelPixels.slice(1).map((p, i) => p - r.labelPixels[i]);
    assert.ok(
      Math.max(...gaps) < Math.min(...gaps) * 3,
      `labels ${r.labels} spread along the axis: ${gaps}`,
    );
    assert.ok(r.grid.length >= r.labels.length - 1, "gridlines follow ticks");
  });

  it(`[${renderer}] a pow axis zooms`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(arg.data).groupBy("id").x("year").y("value")
        .legend(false).renderer(arg.renderer)
        .yConfig({scale: "pow", exponent: 0.5});
      await done(chart);
      const base = chart._yAxis._d3Scale.domain();
      for (let i = 0; i < 2; i++) document.querySelector("#viz .zoom-in").click();
      await frames();
      const zoomed = chart._yAxis._d3Scale.domain();
      const exponent = chart._yAxis._d3Scale.exponent();
      document.querySelector("#viz .zoom-reset").click();
      await frames();
      return {
        zoomable: Object.keys(chart._plotZoomBase.scales),
        base, zoomed, exponent,
        reset: chart._yAxis._d3Scale.domain(),
      };
    `,
      {data, renderer},
    );
    assert.deepStrictEqual(r.zoomable, ["y"], "the pow y axis zooms");
    assert.strictEqual(r.exponent, 0.5, "and keeps its exponent");
    assert.ok(
      r.zoomed[0] < r.base[0] && r.zoomed[1] > r.base[1],
      `zoomed in: ${r.zoomed} inside ${r.base}`,
    );
    assert.deepStrictEqual(r.reset, r.base, "reset restores the domain");
  });
}

it("a pow axis ignores breaks in a Plot", async () => {
  const r = await page(
    `
    const chart = new d3plus.BarChart()
      .data(arg.data.filter(d => d.year === 2010)).groupBy("id").x("id").y("value")
      .legend(false)
      .yConfig({scale: "pow", exponent: 0.5, break: [100000, 1000000]});
    await done(chart);
    return {breaks: chart._yAxis._breaks.length, exponent: chart._yAxis._d3Scale.exponent()};
  `,
    {data},
  );
  assert.deepStrictEqual(r, {breaks: 0, exponent: 0.5});
});

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] the axis-hover badge reads a pow axis's value`, async () => {
    const {page: p, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>',
    );
    try {
      await p.evaluate(
        ([rows, renderer]) =>
          new Promise(resolve => {
            const viz = new window.d3plus.Plot()
              .data(rows)
              .groupBy("id")
              .x("year")
              .y("value")
              .legend(false)
              .yConfig({scale: "pow", exponent: 0.3})
              .renderer(renderer)
              .duration(0)
              .select("#viz");
            window.__viz = viz;
            viz.render(resolve);
          }),
        [data.filter(d => d.year === 2012), renderer],
      );
      const point = await p.evaluate(() => {
        const viz = window.__viz;
        let found;
        const walk = nodes =>
          nodes.forEach(n => {
            if (!found && n.key === "s1" && n.type === "circle") found = n;
            if (n.children) walk(n.children);
          });
        walk(viz._chartScene);
        const t = found.transform || {};
        const surface = document
          .querySelector("#viz svg, #viz canvas")
          .getBoundingClientRect();
        const c = viz._chartTransform || {x: 0, y: 0};
        return [
          surface.left + c.x + (t.x || 0) + found.cx,
          surface.top + c.y + (t.y || 0) + found.cy,
        ];
      });
      await p.mouse.move(5, 5);
      await p.mouse.move(point[0], point[1], {steps: 3});
      await p.waitForTimeout(80);
      const badges = await p.evaluate(() => {
        const out = [];
        const walk = nodes =>
          nodes.forEach(n => {
            const m = `${n.key}`.match(/plot-axis-hover-badge-(\w+)$/);
            if (m) out.push([m[1], n.children[1].lines[0].text]);
            if (n.children) walk(n.children);
          });
        walk([window.__viz._paintedScene.root]);
        return out;
      });
      assert.deepStrictEqual(badges, [
        ["x", "2012"],
        ["y", "60k"],
      ]);
    } finally {
      await close();
    }
  });
}
