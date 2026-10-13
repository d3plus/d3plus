/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {bundle, render, closeBrowser} from "../playwright.js";

/**
    Date values on a Plot's discrete axis without `time()` stay a category
    axis, but label like a time axis: at the interval the dates step by, in
    the chart's locale, never as `Date.toString()`. Tooltips read the hovered
    Date at that interval with the year; an axis `tickFormat` still wins.
    Driven in Chromium through real pointer events, on both renderers.
*/

before(async function () {
  this.timeout(300000);
  await bundle();
});
after(closeBrowser);

/**
    Renders a chart over the Dates `xs` builds (one series for "single", two
    for "shared"), hovers the discrete position at `index`, and reads the
    discrete axis's scale, its label for every category, the painted labels,
    and the tooltip.
*/
const probe = ([kind, xs, config, renderer, series, index]) =>
  new Promise(resolve => {
    const values = new Function(`return (${xs})();`)();
    const format = config.tickFormat;
    if (format) {
      const key = `${config.discrete || "x"}Config`;
      config = {...config, [key]: {tickFormat: new Function("d", format)}};
      delete config.tickFormat;
    }
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
      const discrete = viz.schema.discrete || "x";
      const axis = viz[`_${discrete}Axis`];
      const host = document.querySelector(`#viz ${renderer === "canvas" ? "canvas.d3plus-render-canvas" : "svg.d3plus-render-svg"}`);
      const r = host.getBoundingClientRect();
      const a = viz._plotArea, c = viz._chartTransform;
      const category = axis._d3Scale.domain()[index];
      // A LinePlot hovers empty space near the top of the plot area; a BarChart
      // the middle of the hovered bar (the series' value there is 10 + index).
      const half = (10 + index) / 2;
      const at = kind === "BarChart"
        ? discrete === "x"
          ? [r.left + c.x + viz._xFunc(category), r.top + c.y + viz._yFunc(half)]
          : [r.left + c.x + viz._xFunc(half), r.top + c.y + viz._yFunc(category)]
        : [r.left + c.x + viz._xFunc(category), r.top + c.y + a.y + 4];
      // The SVG renderer picks from the event target; the canvas hit-tests the point.
      const surface = host.querySelector('[data-key="plot-hover-surface"]');
      const bar = host.querySelector(`rect[data-key="Alpha_${category}"]`);
      const target = renderer === "canvas" ? host : bar || surface;
      (target || host).dispatchEvent(
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
        resolve({
          scale: axis.scale(),
          labels: axis._d3Scale.domain().map(axis._labelFormat),
          ticks,
          thead: cells("thead tr"),
          tbody: cells("tbody tr"),
          aria: bar ? bar.getAttribute("aria-label") : undefined,
        });
      }, 50));
    });
  });

const run = (kind, xs, config, renderer, series, index) =>
  render('<div id="viz" style="width:900px;height:400px"></div>', probe, [kind, xs, config, renderer, series, index]);

const monthly = "() => Array.from({length: 30}, (_, i) => new Date(2023, i, 1))";
const daily = "() => Array.from({length: 14}, (_, i) => new Date(2026, 2, 1 + i))";
const yearly = "() => Array.from({length: 8}, (_, i) => new Date(2016 + i, 0, 1))";
const rawDate = /GMT|\d\d:\d\d:\d\d/;

for (const renderer of ["svg", "canvas"]) {
  it(`LinePlot (${renderer}) — monthly Dates without time() label as months on a point axis`, async function () {
    this.timeout(60000);
    const r = await run("LinePlot", monthly, {}, renderer, 2, 14);
    assert.strictEqual(r.scale, "point", "Dates without time() stay a category axis");
    assert.deepStrictEqual([r.labels[0], r.labels[1], r.labels[12], r.labels[29]], ["Jan 2023", "Feb", "Jan 2024", "Jun 2025"]);
    assert.ok(r.ticks.length > 2 && r.ticks.every(t => !rawDate.test(t)), `painted labels read as dates (got ${r.ticks})`);
    assert.ok(r.ticks.includes("Jan 2023") && r.ticks.includes("Jun 2025"), `the ends carry the year (got ${r.ticks})`);
    assert.deepStrictEqual(r.thead, [["date", "Mar 2024"]], "the shared header names the hovered month with its year");
    const single = await run("LinePlot", monthly, {}, renderer, 1, 14);
    assert.deepStrictEqual(single.tbody[0], ["date", "Mar 2024"], "the single tooltip's x row names the month");
  });

  it(`LinePlot (${renderer}) — daily Dates without time() label as days`, async function () {
    this.timeout(60000);
    const r = await run("LinePlot", daily, {}, renderer, 1, 4);
    assert.deepStrictEqual([r.labels[0], r.labels[4], r.labels[13]], ["Mar 1, 2026", "Mar 5", "Mar 14, 2026"]);
    assert.ok(r.ticks.every(t => !rawDate.test(t)), `painted labels read as dates (got ${r.ticks})`);
    assert.deepStrictEqual(r.tbody[0], ["date", "Mar 5, 2026"]);
  });

  it(`BarChart (${renderer}) — yearly Dates without time() label as years`, async function () {
    this.timeout(60000);
    const r = await run("BarChart", yearly, {}, renderer, 1, 3);
    assert.deepStrictEqual(r.labels, ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"]);
    assert.deepStrictEqual(r.ticks, r.labels, "every year is painted");
    assert.deepStrictEqual(r.tbody[0], ["date", "2019"]);
  });

  it(`BarChart (${renderer}) — monthly Dates on a discrete y axis label as months`, async function () {
    this.timeout(60000);
    const xs = "() => Array.from({length: 6}, (_, i) => new Date(2025, i, 1))";
    const r = await run("BarChart", xs, {discrete: "y", x: "value", y: "date"}, renderer, 1, 3);
    assert.deepStrictEqual(r.labels, ["Jun 2025", "May", "Apr", "Mar", "Feb", "Jan 2025"], "top to bottom");
    assert.ok(r.ticks.every(t => !rawDate.test(t)), `painted labels read as dates (got ${r.ticks})`);
    assert.deepStrictEqual(r.tbody[1], ["date", "Mar 2025"]);
    if (renderer === "svg") assert.strictEqual(r.aria, "Alpha, x: 12, y: Mar 2025.", "the bar's aria-label names the month");
  });

  it(`LinePlot (${renderer}) — Dates label in the chart's locale`, async function () {
    this.timeout(60000);
    const r = await run("LinePlot", monthly, {locale: "es-ES"}, renderer, 1, 14);
    assert.deepStrictEqual([r.labels[0], r.labels[1], r.labels[29]], ["ene 2023", "feb", "jun 2025"]);
    assert.deepStrictEqual(r.tbody[0][1], "mar 2024");
  });

  it(`LinePlot (${renderer}) — an xConfig tickFormat labels Date categories and their tooltips`, async function () {
    this.timeout(60000);
    const tickFormat = "return `@${d.getFullYear()}-${d.getMonth() + 1}`;";
    const r = await run("LinePlot", monthly, {tickFormat}, renderer, 2, 14);
    assert.deepStrictEqual([r.labels[0], r.labels[14]], ["@2023-1", "@2024-3"]);
    assert.deepStrictEqual(r.thead, [["date", "@2024-3"]]);
  });
}

it("LinePlot — a facet's panels label Date categories as months", async function () {
  this.timeout(60000);
  const r = await render(
    '<div id="viz" style="width:900px;height:320px"></div>',
    () => new Promise(resolve => {
      const data = ["North", "South", "East"].flatMap((region, s) =>
        Array.from({length: 30}, (_, m) => ({date: new Date(2023, m, 1), id: region, region, value: 100 + 10 * s + m})),
      );
      const viz = new window.d3plus.LinePlot()
        .data(data)
        .groupBy("id")
        .facet("region")
        .x("date")
        .y("value")
        .legend(false)
        .duration(0)
        .select("#viz");
      viz.render(() => {
        const texts = [];
        const walk = (node, path = []) => {
          if (node.type === "text" && path.some(k => /x-axis/.test(k)))
            texts.push(node.lines.map(l => l.text).join(" "));
          (node.children || []).forEach(child => walk(child, path.concat(node.key)));
        };
        walk(viz._paintedScene.root);
        resolve(texts);
      });
    }),
  );
  assert.ok(r.length > 6, `the panels paint x labels (got ${r})`);
  assert.ok(r.every(t => !/GMT|\d\d:\d\d:\d\d/.test(t)), `no raw Date strings (got ${r})`);
  assert.strictEqual(r.filter(t => t === "Jan 2023").length, 3, `each panel starts at Jan 2023 (got ${r})`);
  assert.strictEqual(r.filter(t => t === "Jun 2025").length, 3, `each panel ends at Jun 2025 (got ${r})`);
});
