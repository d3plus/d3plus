import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    LinePlot's defaults, on both renderers: each series is named along its
    line, a lone line goes unnamed, and the legend hides only when every line
    got a name. An explicit `legend` or `lineLabels` wins, and a trend line
    shows its equation by default.
*/

const draw = ({renderer, config, short, series = 3}) =>
  new Promise(resolve => {
    const data = [];
    ["Alpha", "Beta", "Gamma"].slice(0, series).forEach((id, k) => {
      // A short series spans two neighboring years: too little line for a name.
      const years = short && k === 2 ? [2010, 2011] : [];
      for (let year = 2000; year <= 2024; year++) {
        if (years.length && !years.includes(year)) continue;
        data.push({id, year, value: 20 + k * 25 + 6 * Math.sin(year / 3 + k)});
      }
    });
    const viz = new window.d3plus.LinePlot()
      .data(data)
      .groupBy("id")
      .x("year")
      .y("value")
      .renderer(renderer)
      .duration(0)
      .config(config || {})
      .select("#viz");
    viz.render(() => {
      const nodes = [];
      const walk = n => {
        nodes.push(n);
        (n.children || []).forEach(walk);
      };
      walk(viz.toScene().root);
      resolve({
        along: nodes
          .filter(n => `${n.key}`.startsWith("line-label-along-"))
          .map(n => n.lines[0].text)
          .sort(),
        trend: nodes
          .filter(n => `${n.key}`.startsWith("trend-label-"))
          .map(n => n.lines[0].text),
        legend: nodes.some(n => n.key === "viz-legend"),
        legendEntries: (viz._legendClass._lineData || []).length,
      });
    });
  });

const page = '<div id="viz" style="width:700px;height:400px"></div>';
const legendShows = out => out.legend && out.legendEntries > 0;

for (const renderer of ["svg", "canvas"]) {
  it(`LinePlot names every line along it and hides its legend by default (${renderer})`, async () => {
    const out = await render(page, draw, {renderer});
    assert.deepStrictEqual(out.along, ["Alpha", "Beta", "Gamma"]);
    assert.ok(!legendShows(out), "no legend");
  });

  it(`LinePlot keeps its legend when a line goes unlabeled (${renderer})`, async () => {
    const out = await render(page, draw, {renderer, short: true});
    assert.deepStrictEqual(out.along, ["Alpha", "Beta"], "Gamma has no room");
    assert.ok(legendShows(out), "the legend stays");
  });

  it(`LinePlot names no lone line (${renderer})`, async () => {
    const out = await render(page, draw, {renderer, series: 1});
    assert.deepStrictEqual(out.along, []);
  });

  it(`explicit legend and lineLabels win (${renderer})`, async () => {
    const legend = await render(page, draw, {renderer, config: {legend: true}});
    assert.deepStrictEqual(legend.along, ["Alpha", "Beta", "Gamma"]);
    assert.ok(legendShows(legend), "legend: true shows it");
    const off = await render(page, draw, {
      renderer,
      config: {lineLabels: false},
    });
    assert.deepStrictEqual(off.along, []);
    assert.ok(legendShows(off), "the default legend returns");
    const end = await render(page, draw, {
      renderer,
      config: {lineLabels: true},
    });
    assert.deepStrictEqual(end.along, []);
    const hidden = await render(page, draw, {
      renderer,
      config: {legend: false, lineLabels: false},
    });
    assert.ok(!legendShows(hidden));
  });
}
