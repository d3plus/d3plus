import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Small multiples alongside the other Plot features that draw per chart:
    axis breaks and their masks, the baseline break's labels, short charts'
    x-axis end labels, axis ink on a dark page, the space kept between
    columns for overhanging tick labels, and a Gauge drawing one dial per panel.
*/

after(async () => {
  await closeBrowser();
});

const PRELUDE = `
  const regions = ["East", "North", "South", "West"];
  const products = ["Apples", "Figs", "Pears", "Plums"];
  const years = [2019, 2020, 2021, 2022, 2023];
  const rows = [];
  regions.forEach((region, r) => products.forEach((product, p) => years.forEach((year, y) =>
    rows.push({region, product, year, sales: 10 + ((r * 7 + p * 13 + y * 5) % 23) * (r + 1)}))));
  const done = chart => new Promise(resolve => chart.render(resolve));
  const walk = (nodes, fn) => nodes.forEach(n => {
    fn(n);
    if (n.children) walk(n.children, fn);
  });
  const panelOf = key => String(key).split("/")[0];
`;

/** Renders into a `height`-tall box and runs `body` in the page after the prelude. */
function page(body, {height = 600, background = "white"} = {}) {
  return render(
    `<div id='viz' style='width:900px;height:${height}px'></div>`,
    new Function(`return (async () => {
      document.body.style.background = "${background}";
      ${PRELUDE} ${body}
    })()`),
  );
}

for (const scales of ["shared", "independent"]) {
  it(`axis breaks mask each panel's own content (${scales} scales)`, async function () {
    this.timeout(60000);
    const out = await page(`
      const data = rows.map(d => d.region === "South" && d.year === 2021 ? {...d, sales: 900} : d);
      const chart = new d3plus.BarChart().select("#viz").data(data)
        .groupBy("product").x("year").y("sales").yBreak([120, 850])
        .facet("region").facetConfig({scales: "${scales}"}).duration(0);
      await done(chart);
      const masks = [];
      walk(chart._chartScene, n => {
        if (/\\/plot-break-mask-y$/.test(String(n.key))) masks.push(panelOf(n.key));
      });
      const clips = Array.from(document.querySelectorAll("#viz clipPath")).map(c => c.id);
      return {masks, unique: new Set(clips).size === clips.length};
    `);
    const expected = scales === "shared"
      ? ["facet-East", "facet-North", "facet-South", "facet-West"]
      : ["facet-South"];
    assert.deepStrictEqual(out.masks, expected, "a break mask in each panel whose y domain crosses the break");
    assert.ok(out.unique, "every panel's mask gets its own clip path");
  });
}

it("a baseline break's baseline label follows the panel's outer-axis labels", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.LinePlot().select("#viz").data(rows.map(d => ({...d, sales: d.sales + 400})))
      .groupBy("product").x("year").y("sales").baselineBreak(true).facet("region").duration(0);
    await done(chart);
    const texts = {};
    document.querySelectorAll('#viz [data-key$="/plot-y-axis"]').forEach(g => {
      texts[panelOf(g.getAttribute("data-key"))] = Array.from(g.querySelectorAll("text")).map(t => t.textContent).filter(Boolean);
    });
    return texts;
  `);
  assert.ok(out["facet-East"].includes("0"), "the left column labels the baseline");
  assert.deepStrictEqual(out["facet-North"], [], "an inner panel labels nothing, baseline included");
});

it("a chart too short for y axes labels each bottom panel's x ends flush with its plot", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.LinePlot().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region").duration(0);
    await done(chart);
    return chart._facetPanels.map(p => {
      const a = p.state._plotArea;
      let labels = [];
      walk(p.scene, n => {
        if (n.key === "plot-x-end-labels") labels = n.children.map(c => ({x: c.transform.x, width: c.width, text: c.lines.map(l => l.text).join("")}));
      });
      return {key: p.key, bottom: p.cell.edges.bottom, left: a.x, right: a.x + a.width, labels};
    });
  `, {height: 140});
  for (const panel of out) {
    assert.ok(panel.bottom, `${panel.key} is on the bottom edge`);
    assert.deepStrictEqual(panel.labels.map(l => l.text), ["2019", "2023"], `${panel.key} labels its ends`);
    const [start, end] = panel.labels;
    assert.ok(Math.abs(start.x - panel.left) < 1, `${panel.key}: the start label sits at the plot's left edge`);
    assert.ok(Math.abs(end.x + end.width - panel.right) < 1, `${panel.key}: the end label ends at the plot's right edge`);
  }
});

it("keeps overhanging x tick labels of neighboring panels apart", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.LinePlot().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region").facetConfig({columns: 4, padding: 4}).duration(0);
    await done(chart);
    return Array.from(document.querySelectorAll('#viz [data-key$="/plot-x-axis"]')).map(g => {
      const boxes = Array.from(g.querySelectorAll("text")).filter(t => t.textContent).map(t => t.getBoundingClientRect());
      return [Math.min(...boxes.map(b => b.left)), Math.max(...boxes.map(b => b.right))];
    }).sort((a, b) => a[0] - b[0]);
  `);
  assert.strictEqual(out.length, 4);
  for (let i = 1; i < out.length; i++)
    assert.ok(out[i][0] >= out[i - 1][1], `panel ${i}'s labels start after panel ${i - 1}'s end (${out[i][0]} vs ${out[i - 1][1]})`);
});

it("panel titles and axis labels take the dark page's ink", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.LinePlot().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region").duration(0);
    await done(chart);
    const titles = [];
    walk(chart._chartScene, n => { if (n.interactionGroup === "facet") titles.push(n.paint.fill); });
    const ticks = Array.from(document.querySelectorAll('#viz [data-key="facet-South/plot-x-axis"] text'))
      .filter(t => t.textContent).map(t => t.getAttribute("fill"));
    return {titles: Array.from(new Set(titles)), ticks: Array.from(new Set(ticks)), light: chart.schema.colorDefaults.light};
  `, {background: "rgb(20, 20, 20)"});
  assert.deepStrictEqual(out.titles, [out.light], "panel titles in the light ink");
  assert.deepStrictEqual(out.ticks, [out.light], "tick labels in the light ink");
});

it("a faceted Gauge draws one dial per panel", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.Gauge().select("#viz")
      .data(regions.map((region, i) => ({id: "Speed", region, value: 30 + i * 17})))
      .domain([0, 100]).facet("region").duration(0);
    await done(chart);
    return chart._facetPanels.map(p => {
      const values = [];
      walk(p.scene, n => { if (n.datum && n.datum.value !== undefined) values.push(n.datum.value); });
      return {key: p.key, values: Array.from(new Set(values)), transform: p.chartTransform};
    });
  `);
  assert.deepStrictEqual(out.map(p => p.key), ["facet-East", "facet-North", "facet-South", "facet-West"]);
  assert.deepStrictEqual(out.map(p => p.values), [[30], [47], [64], [81]], "each dial shows its own panel's value");
  assert.strictEqual(new Set(out.map(p => JSON.stringify(p.transform))).size, 4, "each dial is placed in its own panel");
});
