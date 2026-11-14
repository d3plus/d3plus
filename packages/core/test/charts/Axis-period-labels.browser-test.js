import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Period labels in a chart (`xConfig: {tickLabelPosition: "period"}`), on
    both renderers: a monthly line's labels center between its month ticks
    while the ticks and grid lines stay on the months' starts, and a bar
    chart's labels stay beneath its bars.
*/

const draw = ({renderer, chart, period}) =>
  new Promise(resolve => {
    const data = [];
    for (let i = 0; i < 12; i++)
      data.push({id: "a", date: new Date(2024, i, 1), value: 10 + (i % 4)});
    const viz = new window.d3plus[chart]()
      .data(data)
      .groupBy("id")
      .x("date")
      .y("value")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .xConfig(period ? {tickLabelPosition: "period"} : {})
      .select("#viz");
    viz.render(() => {
      const axis = viz._xAxis;
      const nodes = [];
      const walk = n => {
        nodes.push(n);
        (n.children || []).forEach(walk);
      };
      walk(viz.toScene().root);
      const xAxis = nodes.find(n => n.key === "plot-x-axis");
      const texts = [];
      const collect = n => {
        if (n.type === "text") texts.push(n);
        (n.children || []).forEach(collect);
      };
      if (xAxis) collect(xAxis);
      // A Line tick lists each tick twice, once per end of its mark.
      const seen = new Set();
      const labels = axis._tickShape._data
        .filter(d => d.text && d.tick && !seen.has(+d.id) && seen.add(+d.id))
        .map(d => ({
          id: d.id,
          tick: axis._getPosition(d.id),
          x: d.x,
          center: d.x + d.labelBounds.x + d.labelBounds.width / 2,
          period: axis._periodPositions?.get(+d.id),
        }));
      resolve({
        labels,
        texts: texts.length,
        grid: axis._gridLineData.map(d => +d.id),
        ticks: axis._tickShape._data.filter(d => d.tick).map(d => +d.id),
        canvas: !!document.querySelector("#viz canvas"),
      });
    });
  });

const page = '<div id="viz" style="width:700px;height:400px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`a line's period labels center between its month ticks (${renderer})`, async () => {
    const before = await render(page, draw, {renderer, chart: "LinePlot"});
    const out = await render(page, draw, {
      renderer,
      chart: "LinePlot",
      period: true,
    });
    assert.ok(out.labels.length >= 6, `${out.labels.length} labels`);
    assert.ok(out.texts >= out.labels.length, `${out.texts} texts`);
    const step = out.labels[1].tick - out.labels[0].tick;
    for (const label of out.labels) {
      // The tick stays on the month's start, the label half a month on.
      assert.strictEqual(label.x, label.tick);
      assert.ok(
        Math.abs(label.center - label.period) < 0.5,
        `${label.center} vs ${label.period}`,
      );
      assert.ok(
        Math.abs(label.center - (label.tick + step / 2)) < 1,
        `${new Date(label.id)}: ${label.center} vs ${label.tick + step / 2}`,
      );
    }
    // Ticks and grid lines fall on the same dates either way.
    assert.deepStrictEqual(new Set(out.grid), new Set(before.grid));
    assert.deepStrictEqual(new Set(out.ticks), new Set(before.ticks));
    if (renderer === "canvas") assert.ok(out.canvas);
  });

  it(`a bar chart's labels stay beneath its bars (${renderer})`, async () => {
    const out = await render(page, draw, {
      renderer,
      chart: "BarChart",
      period: true,
    });
    assert.ok(out.labels.length >= 6);
    for (const label of out.labels) {
      assert.strictEqual(label.period, undefined);
      assert.ok(Math.abs(label.center - label.tick) < 0.5);
    }
  });
}
