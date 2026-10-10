/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A Plot's tooltips label a time axis's values the way the axis labels its
    ticks, whether the data holds date strings, Dates, or timestamps; a
    category axis's strings read as given. Driven in Chromium through real
    pointer events, on both renderers.
*/

after(closeBrowser);

const days = ["2026-01-01", "2026-04-01", "2026-07-01", "2026-10-01"];

const sources = {
  "date strings": `() => ${JSON.stringify(days)}`,
  Dates: `() => ${JSON.stringify(days)}.map(s => new Date(s + "T00:00"))`,
  timestamps: `() => ${JSON.stringify(days)}.map(s => +new Date(s + "T00:00"))`,
};

/**
    Renders a chart over the values `xs` builds (one series for "single", two
    for "shared"), hovers the third discrete position, and reads the tooltip
    and the discrete axis's tick labels.
*/
const probe = ([kind, xs, config, renderer, series]) =>
  new Promise(resolve => {
    const values = new Function(`return (${xs})();`)();
    const data = [];
    ["Alpha", "Beta"].slice(0, series).forEach((id, s) =>
      values.forEach((date, k) => data.push({id, date, value: 10 * (s + 1) + k})),
    );
    const viz = new window.d3plus[kind]()
      .data(data)
      .groupBy("id")
      .x("date")
      .y("value")
      .config(config)
      .renderer(renderer)
      .legend(false)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const host = document.querySelector(`#viz ${renderer === "canvas" ? "canvas.d3plus-render-canvas" : "svg.d3plus-render-svg"}`);
      const discrete = viz.schema.discrete || "x";
      const r = host.getBoundingClientRect();
      const a = viz._plotArea, c = viz._chartTransform;
      // A LinePlot hovers empty space near the top of the plot area; a BarChart its third bar.
      const bar = discrete === "y" && host.querySelector('rect[data-key*="Jul 01 2026"]');
      const box = bar && bar.getBoundingClientRect();
      const at = discrete === "x"
        ? [r.left + c.x + a.x + a.width * 0.66, r.top + c.y + a.y + 4]
        : box
          ? [box.left + 4, box.top + box.height / 2]
          : [r.left + c.x + a.x + 4, r.top + c.y + viz._yFunc(new Date(`${values[2]}T00:00`))];
      // The SVG renderer picks from the event target; the canvas hit-tests the point.
      const surface = host.querySelector('[data-key="plot-hover-surface"]');
      (bar || surface || host).dispatchEvent(
        new MouseEvent("mousemove", {clientX: at[0], clientY: at[1], bubbles: true}),
      );
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        const cells = sel => tip
          ? Array.from(tip.querySelectorAll(sel)).map(tr => Array.from(tr.querySelectorAll("td, th")).map(td => td.textContent))
          : [];
        const ticks = [];
        const walk = (node, path = []) => {
          if (node.type === "text" && path.includes(`plot-${discrete}-axis`))
            ticks.push(node.lines.map(l => l.text).join(" "));
          (node.children || []).forEach(child => walk(child, path.concat(node.key)));
        };
        walk(viz._paintedScene.root);
        resolve({thead: cells("thead tr"), tbody: cells("tbody tr"), ticks, scale: viz[`_${discrete}Axis`].scale()});
      }, 50));
    });
  });

const run = (kind, xs, config, renderer, series) =>
  render('<div id="viz" style="width:600px;height:400px"></div>', probe, [kind, xs, config, renderer, series]);

for (const renderer of ["svg", "canvas"]) {
  for (const [name, xs] of Object.entries(sources)) {
    it(`LinePlot (${renderer}) — ${name} on a time axis read like the axis ticks in the tooltip`, async function () {
      this.timeout(60000);
      const shared = await run("LinePlot", xs, {time: "date"}, renderer, 2);
      assert.strictEqual(shared.scale, "time");
      assert.ok(shared.ticks.includes("Q3 2026"), `the axis labels Q3 2026 (got ${shared.ticks})`);
      assert.deepStrictEqual(shared.thead, [["date", "Q3 2026"]], "the shared header names the hovered date");
      const single = await run("LinePlot", xs, {time: "date"}, renderer, 1);
      assert.deepStrictEqual(single.tbody[0], ["date", "Q3 2026"], "the single tooltip's x row names the hovered date");
    });
  }

  it(`BarChart (${renderer}) — date strings on a time y axis read like the axis ticks in the tooltip`, async function () {
    this.timeout(60000);
    const config = {discrete: "y", x: "value", y: "date", time: "date"};
    const r = await run("BarChart", sources["date strings"], config, renderer, 1);
    assert.strictEqual(r.scale, "time");
    assert.ok(r.ticks.includes("Q3 2026"), `the axis labels Q3 2026 (got ${r.ticks})`);
    assert.deepStrictEqual(r.tbody[1], ["date", "Q3 2026"]);
  });

  it(`LinePlot (${renderer}) — strings on a category axis read as given`, async function () {
    this.timeout(60000);
    const fruit = `() => ["Apples", "Bananas", "Cherries", "Durians"]`;
    const shared = await run("LinePlot", fruit, {}, renderer, 2);
    assert.strictEqual(shared.scale, "point");
    assert.deepStrictEqual(shared.thead, [["date", "Cherries"]]);
    const single = await run("LinePlot", fruit, {}, renderer, 1);
    assert.deepStrictEqual(single.tbody[0], ["date", "Cherries"]);
    const iso = await run("LinePlot", sources["date strings"], {}, renderer, 1);
    assert.deepStrictEqual(iso.tbody[0], ["date", "2026-07-01"], "date strings without a time axis read as given");
  });
}
