import assert from "assert";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {render, closeBrowser} from "../playwright.js";

/**
    Small multiples (`facet`) rendered in a real browser: the panel grid, shared
    and independent scales, outer-edge axis labels, one shared legend, hover and
    the shared tooltip across panels, legend hide/solo, the canvas backend, and
    an unfaceted chart drawing exactly as before.
*/

after(async () => {
  await closeBrowser();
});

const box = "<div id='viz' style='width:900px;height:600px'></div>";

// Shared page-side helpers: sample data, a render promise, a hit-test search
// for a point over a mark, and a dispatched pointer event at a surface point.
const PRELUDE = `
  const regions = ["East", "North", "South", "West"];
  const products = ["Apples", "Figs", "Pears", "Plums"];
  const years = [2019, 2020, 2021, 2022];
  const rows = [];
  regions.forEach((region, r) => products.forEach((product, p) => years.forEach((year, y) =>
    rows.push({region, product, year, sales: 10 + ((r * 7 + p * 13 + y * 5) % 23) * (r + 1)}))));
  const done = chart => new Promise(resolve => chart.render(resolve));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const unwrap = d => (d && d.data ? d.data : d);
  const surface = chart => document.querySelector(
    chart._renderer === "canvas" ? "#viz canvas.d3plus-render-canvas" : "#viz svg.d3plus-render-svg");
  const findPoint = (chart, panelKey, test) => {
    const c = chart._facetPanels.find(p => p.key === panelKey).cell;
    for (let y = c.y + 2; y < c.y + c.height; y += 3)
      for (let x = c.x + 2; x < c.x + c.width; x += 3) {
        const pick = chart._sceneRenderer.pick([x, y]);
        if (pick && pick.node && !pick.node.interactionGroup && test(unwrap(pick.datum), pick.node)) return [x, y];
      }
    return null;
  };
  const pointer = (chart, type, point) => {
    const el = surface(chart);
    const ctm = el.getScreenCTM ? el.getScreenCTM() : null;
    const rect = el.getBoundingClientRect();
    const clientX = (ctm ? ctm.e : rect.left) + point[0], clientY = (ctm ? ctm.f : rect.top) + point[1];
    const target = chart._renderer === "canvas" || type === "mouseleave" ? el : document.elementFromPoint(clientX, clientY);
    target.dispatchEvent(new MouseEvent(type, {clientX, clientY, bubbles: true}));
  };
  const walk = (nodes, fn) => nodes.forEach(n => {
    fn(n);
    if (n.children) walk(n.children, fn);
  });
  const panelOf = key => String(key).split("/")[0];
`;

/** Runs `body` in the page after the prelude. */
function page(body, arg) {
  return render(box, new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`), arg);
}

it("draws one titled panel per facet value, with one legend for the whole chart", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.BarChart().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region").duration(0);
    await done(chart);
    const titles = [];
    walk(chart._chartScene, n => { if (n.interactionGroup === "facet") titles.push(n.lines.map(l => l.text).join(" ")); });
    return {
      keys: chart._chartScene.map(n => n.key),
      labels: chart._chartScene.map(n => n.aria && n.aria.label),
      titles,
      legends: document.querySelectorAll('#viz [data-key="viz-legend"]').length,
      legendItems: chart._legendClass._data.length,
      cells: chart._facetPanels.map(p => [p.cell.row, p.cell.column]),
    };
  `);
  assert.deepStrictEqual(out.keys, ["facet-East", "facet-North", "facet-South", "facet-West"]);
  assert.deepStrictEqual(out.labels, ["East", "North", "South", "West"], "each panel group is named by its title");
  assert.deepStrictEqual(out.titles, ["East", "North", "South", "West"]);
  assert.strictEqual(out.legends, 1, "one legend");
  assert.strictEqual(out.legendItems, 4, "one legend entry per series, not per panel");
  assert.deepStrictEqual(out.cells, [[0, 0], [0, 1], [1, 0], [1, 1]], "a 2×2 grid");
});

it("shares one y domain across panels and labels only the outer axes", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.BarChart().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region").duration(0);
    await done(chart);
    const texts = {};
    document.querySelectorAll('#viz [data-key$="/plot-y-axis"], #viz [data-key$="/plot-x-axis"]').forEach(g => {
      const key = g.getAttribute("data-key");
      texts[key] = Array.from(g.querySelectorAll("text")).map(t => t.textContent).filter(Boolean).length;
    });
    return {
      domains: chart._facetPanels.map(p => p.state._plotAxisDomains.y.map(Number)),
      areas: chart._facetPanels.map(p => [Math.round(p.state._plotArea.width), Math.round(p.state._plotArea.height)]),
      texts,
    };
  `);
  const [first, ...rest] = out.domains;
  rest.forEach(d => assert.deepStrictEqual(d, first, "every panel draws the same y domain"));
  assert.ok(first[0] >= 90, `the domain covers the largest panel's values (got ${first})`);
  const [area, ...areas] = out.areas;
  areas.forEach(a => assert.deepStrictEqual(a, area, "every panel's plot area is the same size"));
  assert.ok(out.texts["facet-East/plot-y-axis"] > 0, "the left column labels its y axis");
  assert.strictEqual(out.texts["facet-North/plot-y-axis"], 0, "inner panels don't");
  assert.ok(out.texts["facet-South/plot-x-axis"] > 0, "the bottom row labels its x axis");
  assert.strictEqual(out.texts["facet-East/plot-x-axis"], 0, "upper panels don't");
});

it("lines every panel's plot area up with its row and column, labeled or not", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.LinePlot().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region").duration(0);
    await done(chart);
    return chart._facetPanels.map(p => {
      const a = p.state._plotArea, t = p.chartTransform;
      return {row: p.cell.row, column: p.cell.column, x: [a.x + t.x, a.x + t.x + a.width].map(Math.round), y: [a.y + t.y, a.y + t.y + a.height].map(Math.round)};
    });
  `);
  const col = c => out.filter(p => p.column === c).map(p => p.x);
  const row = r => out.filter(p => p.row === r).map(p => p.y);
  for (const c of [0, 1]) assert.deepStrictEqual(col(c)[0], col(c)[1], `column ${c} shares its x extent`);
  for (const r of [0, 1]) assert.deepStrictEqual(row(r)[0], row(r)[1], `row ${r} shares its y extent`);
  const width = p => p.x[1] - p.x[0], height = p => p.y[1] - p.y[0];
  assert.ok(Math.abs(width(out[0]) - width(out[1])) <= 1, "columns are the same width");
  assert.ok(Math.abs(height(out[0]) - height(out[2])) <= 1, "rows are the same height");
});

it("fits each panel to its own rows with independent scales", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.BarChart().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region")
      .facetConfig({scales: "independent"}).duration(0);
    await done(chart);
    return chart._facetPanels.map(p => Math.max(...p.state._plotAxisDomains.y.map(Number)));
  `);
  assert.ok(new Set(out).size > 1, `panels draw different domains (got ${out})`);
});

it("hovering a line in one panel highlights that series in every panel", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.LinePlot().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").tooltipShared(false).facet("region").duration(0);
    await done(chart);
    const point = findPoint(chart, "facet-North", (d, node) => node.shapeType === "Line" && d.product === "Figs");
    pointer(chart, "mousemove", point);
    await frames();
    const lines = [];
    walk(chart._paintedScene.root.children, n => {
      if (n.shapeType === "Line" && n.datum && !n.interactionGroup && String(n.key).startsWith("facet-") && !String(n.key).endsWith("::hit"))
        lines.push({panel: panelOf(n.key), product: unwrap(n.datum).product, opacity: n.paint && n.paint.opacity});
    });
    return {found: !!point, hovered: typeof chart._hover === "function", lines};
  `);
  assert.ok(out.found, "found a point over the Figs line");
  assert.ok(out.hovered, "the hover predicate is set");
  const panels = new Set(out.lines.map(l => l.panel));
  assert.strictEqual(panels.size, 4, "lines are drawn in every panel");
  for (const line of out.lines) {
    if (line.product === "Figs") assert.ok(line.opacity === undefined || line.opacity === 1, `Figs stays bright in ${line.panel}`);
    else assert.ok(line.opacity < 1, `${line.product} dims in ${line.panel}`);
  }
});

it("the shared tooltip and crosshair follow the panel under the pointer", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.LinePlot().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region").duration(0);
    await done(chart);
    const south = chart._facetPanels.find(p => p.key === "facet-South");
    const area = south.state._plotArea, t = south.chartTransform;
    const point = [t.x + area.x + area.width * 0.66, t.y + area.y + 3];
    pointer(chart, "mousemove", point);
    await frames();
    const crosshairs = [];
    walk(chart._paintedScene.root.children, n => {
      if (String(n.key).endsWith("/plot-crosshair")) crosshairs.push(panelOf(n.key));
    });
    const tip = document.querySelector(".d3plus-tooltip");
    const state = chart._sharedHoverState;
    pointer(chart, "mouseleave", [0, 0]);
    return {mode: state && state.mode, panel: state && state.panel, crosshairs, tooltip: tip ? tip.textContent : "", cleared: chart._sharedHoverState};
  `);
  assert.strictEqual(out.mode, "shared");
  assert.strictEqual(out.panel, "facet-South");
  assert.deepStrictEqual(out.crosshairs, ["facet-South"], "the crosshair draws in the hovered panel only");
  for (const product of ["Apples", "Figs", "Pears", "Plums"]) assert.ok(out.tooltip.includes(product), `${product} is listed`);
  assert.strictEqual(out.cleared, null, "leaving the chart clears it");
});

for (const renderer of ["svg", "canvas"]) {
  for (const scales of ["shared", "independent"]) {
    it(`the crosshair spans the hovered panel's plot area, in that panel only (${renderer}, ${scales} scales)`, async function () {
      this.timeout(60000);
      const out = await page(`
        const regions5 = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
        const data = [];
        regions5.forEach((region, r) => ["Coffee", "Cocoa", "Tea"].forEach((product, p) => years.forEach((year, y) =>
          data.push({region, product, year, value: Math.round((20 + ((r * 11 + p * 7 + y * 5) % 17) * 4) * (1 + r * 0.6))}))));
        const chart = new d3plus.LinePlot().select("#viz").data(data)
          .groupBy("product").x("year").y("value").facet("region")
          .facetConfig({columns: 3, scales: arg}).renderer("${renderer}").duration(0);
        await done(chart);
        const results = [];
        for (const key of ["facet-Africa", "facet-Americas", "facet-Asia", "facet-Oceania"]) {
          const panel = chart._facetPanels.find(p => p.key === key);
          const a = panel.state._plotArea, t = panel.chartTransform;
          pointer(chart, "mousemove", [t.x + a.x + a.width * 0.6, t.y + a.y + a.height * 0.5]);
          await frames();
          const lines = [];
          walk(chart._paintedScene.root.children, n => {
            const k = String(n.key);
            if (n.type === "path" && k.endsWith("/crosshair")) {
              const ys = (n.d.match(/-?[\\d.]+/g) || []).map(Number).filter((v, i) => i % 2 === 1);
              lines.push({panel: panelOf(k), x: n.transform.x, top: n.transform.y + Math.min(...ys), bottom: n.transform.y + Math.max(...ys)});
            }
          });
          results.push({key, edges: panel.cell.edges, state: chart._sharedHoverState && chart._sharedHoverState.panel, area: {x: a.x, y: a.y, width: a.width, height: a.height}, lines});
          pointer(chart, "mouseleave", [0, 0]);
          await frames();
        }
        return results;
      `, scales);
      for (const r of out) {
        assert.strictEqual(r.state, r.key, `${r.key} owns the hover`);
        assert.deepStrictEqual(r.lines.map(l => l.panel), [r.key], `one crosshair, in ${r.key}`);
        const [line] = r.lines;
        assert.ok(Math.abs(line.top - r.area.y) < 0.5, `${r.key}: starts at the plot top (${line.top} vs ${r.area.y})`);
        assert.ok(Math.abs(line.bottom - (r.area.y + r.area.height)) < 0.5, `${r.key}: ends at the plot bottom (${line.bottom} vs ${r.area.y + r.area.height})`);
        assert.ok(line.x >= r.area.x && line.x <= r.area.x + r.area.width, `${r.key}: inside the plot horizontally`);
      }
      assert.ok(out.some(r => r.edges.left) && out.some(r => !r.edges.left && !r.edges.bottom) && out.some(r => r.edges.bottom && !r.edges.left), "edge and interior panels");
    });
  }
}

it("repaints add each panel's hover surface once, without touching the chart's own scene", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.LinePlot().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("region").duration(0);
    await done(chart);
    for (let i = 0; i < 3; i++) chart._drawSceneToTarget(0);
    const count = nodes => {
      const panels = {};
      walk(nodes, n => {
        if (String(n.key).endsWith("/plot-hover-surface")) panels[panelOf(n.key)] = (panels[panelOf(n.key)] || 0) + 1;
      });
      return panels;
    };
    return {painted: count(chart._paintedScene.root.children), own: count(chart._chartScene)};
  `);
  assert.deepStrictEqual(out.painted, {"facet-East": 1, "facet-North": 1, "facet-South": 1, "facet-West": 1});
  assert.deepStrictEqual(out.own, {});
});

it("Pie panels color each series the same, and a slice hover shows its own tooltip", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.Pie().select("#viz").data(rows.filter(d => d.year === 2022))
      .groupBy("product").value("sales").facet("region").duration(0);
    await done(chart);
    const fills = {};
    walk(chart._chartScene, n => {
      if (n.type === "path" && n.datum) (fills[unwrap(n.datum).product] ||= new Set()).add(n.paint.fill);
    });
    const point = findPoint(chart, "facet-West", d => d.product === "Pears");
    pointer(chart, "mousemove", point);
    await frames();
    const tip = document.querySelector(".d3plus-tooltip");
    return {
      fills: Object.fromEntries(Object.entries(fills).map(([k, v]) => [k, v.size])),
      tooltip: tip ? tip.textContent : "",
      region: chart._lastScenePick && chart._lastScenePick.d.region,
    };
  `);
  assert.deepStrictEqual(out.fills, {Apples: 1, Figs: 1, Pears: 1, Plums: 1}, "one color per series across panels");
  assert.ok(out.tooltip.includes("Pears"), "the hovered slice's tooltip");
  assert.strictEqual(out.region, "West", "the tooltip reports the hovered panel's row");
});

it("a legend click hides the series in every panel", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.Treemap().select("#viz").data(rows.filter(d => d.year === 2022))
      .groupBy("product").sum("sales").facet("region").duration(0);
    await done(chart);
    const legendDatum = chart._legendData.find(d => d.product === "Figs");
    chart.schema.on["click.legend"](legendDatum, 0, undefined, {shiftKey: false});
    await new Promise(r => setTimeout(r, 300));
    const drawn = {};
    chart._facetPanels.forEach(p => {
      drawn[p.key] = Array.from(new Set(p.scene.filter(n => n.type === "rect" && n.datum).map(n => unwrap(n.datum).product))).sort();
    });
    return drawn;
  `);
  for (const [panel, products] of Object.entries(out))
    assert.deepStrictEqual(products, ["Apples", "Pears", "Plums"], `${panel} drops Figs`);
});

it("hit-tests marks inside panels on the canvas backend", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.Pie().select("#viz").data(rows.filter(d => d.year === 2022))
      .groupBy("product").value("sales").facet("region").renderer("canvas").duration(0);
    await done(chart);
    const point = findPoint(chart, "facet-South", d => d.product === "Apples");
    pointer(chart, "mousemove", point);
    await frames();
    const pick = chart._lastScenePick;
    return {canvas: !!surface(chart), found: !!point, hovered: typeof chart._hover === "function", region: pick && pick.d.region, product: pick && pick.d.product};
  `);
  assert.ok(out.canvas, "drew to a canvas");
  assert.ok(out.found, "a pick resolves inside the panel");
  assert.ok(out.hovered);
  assert.deepStrictEqual([out.region, out.product], ["South", "Apples"]);
});

it("turning facet off draws the same scene as a chart that never faceted", async function () {
  this.timeout(60000);
  const out = await page(`
    const strip = scene => JSON.stringify(scene, (k, v) => (k === "datum" || k === "id" || typeof v === "function" ? undefined : v));
    const make = () => new d3plus.LinePlot().select("#viz").data(rows.filter(d => d.region === "East"))
      .groupBy("product").x("year").y("sales").duration(0);
    const plain = make();
    await done(plain);
    const expected = strip(plain._chartScene);
    plain.destroy();
    document.querySelector("#viz").innerHTML = "";
    const chart = make().facet("region");
    await done(chart);
    const faceted = chart._facetPanels.length;
    chart.facet(false);
    await done(chart);
    return {faceted, panels: chart._facetPanels, same: strip(chart._chartScene) === expected};
  `);
  assert.strictEqual(out.faceted, 1);
  assert.strictEqual(out.panels, undefined);
  assert.ok(out.same, "the unfaceted scene matches");
});

it("draws a single chart when no row has a facet value", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.BarChart().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").facet("missing").duration(0);
    await done(chart);
    return {panels: chart._facetPanels, marks: chart._chartScene.length};
  `);
  assert.strictEqual(out.panels, undefined);
  assert.ok(out.marks > 0, "the chart still draws");
});

it("facetConfig sets the grid shape, panel order, padding, and titles", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.Pie().select("#viz").data(rows.filter(d => d.year === 2022))
      .groupBy("product").value("sales").facet("region")
      .facetConfig({columns: 1, sort: "descending", padding: 7, title: (v, data) => v + " (" + data.length + ")"})
      .duration(0);
    await done(chart);
    const titles = [];
    walk(chart._chartScene, n => { if (n.interactionGroup === "facet") titles.push(n.lines.map(l => l.text).join(" ")); });
    const cells = chart._facetPanels.map(p => p.cell);
    chart.facetConfig({title: false, columns: 4});
    await done(chart);
    let after = 0;
    walk(chart._chartScene, n => { if (n.interactionGroup === "facet") after++; });
    return {
      order: cells.map((c, i) => chart._facetPanels[i].value),
      xs: new Set(cells.map(c => c.x)).size,
      gap: Math.round(cells[1].y - (cells[0].y + cells[0].height)),
      titles,
      after,
      rows: new Set(chart._facetPanels.map(p => p.cell.row)).size,
    };
  `);
  assert.deepStrictEqual(out.order, ["West", "South", "North", "East"]);
  assert.strictEqual(out.xs, 1, "one column");
  assert.strictEqual(out.gap, 7, "padding between panels");
  assert.deepStrictEqual(out.titles, ["West (4)", "South (4)", "North (4)", "East (4)"]);
  assert.strictEqual(out.after, 0, "title: false hides panel titles");
  assert.strictEqual(out.rows, 1, "facetConfig merges: columns 4 makes one row");
});

it("a colorScale reads the values the panels draw, not values rolled up across panels", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.Matrix().select("#viz").data(rows)
      .groupBy(["product", "year"]).row("product").column("year").colorScale("sales")
      .facet("region").duration(0);
    await done(chart);
    const values = chart._colorScaleClass._data.map(d => d.sales);
    return {max: Math.max(...values), rows: values.length};
  `);
  assert.strictEqual(out.rows, 64, "one colorScale row per panel cell");
  assert.ok(out.max <= 100, `the largest value is a single panel's (got ${out.max})`);
});

it("keeps every panel through the timeline, showing the same period in each", async function () {
  this.timeout(60000);
  const out = await page(`
    const data = rows.filter(d => d.region !== "South" || d.year < 2022);
    const chart = new d3plus.Treemap().select("#viz").data(data)
      .groupBy("product").sum("sales").time("year").facet("region").duration(0);
    await done(chart);
    return {
      panels: chart._facetPanels.map(p => [p.key, p.scene.length > 0]),
      years: Array.from(new Set(chart._filteredData.map(d => d.year))),
    };
  `);
  assert.deepStrictEqual(out.panels, [
    ["facet-East", true], ["facet-North", true], ["facet-South", false], ["facet-West", true],
  ], "South has no rows in the latest year but keeps its panel");
  assert.deepStrictEqual(out.years, [2022]);
});

it("each Geomap panel paints its own ocean into the scene", async function () {
  this.timeout(60000);
  const topo = JSON.parse(fs.readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../dev/charts/Geomap/countries.json"), "utf8"));
  const out = await page(`
    const chart = new d3plus.Geomap().select("#viz")
      .data([{id: "USA", g: "a", v: 1}, {id: "CAN", g: "a", v: 3}, {id: "BRA", g: "b", v: 2}])
      .colorScale("v").tiles(false).topojson(arg).topojsonId(d => d.id.toUpperCase())
      .facet("g").duration(0);
    await done(chart);
    const oceans = [];
    walk(chart._chartScene, n => { if (String(n.key).endsWith("/geomap-ocean")) oceans.push(panelOf(n.key)); });
    return oceans;
  `, topo);
  assert.deepStrictEqual(out, ["facet-a", "facet-b"]);
});

it("drilling down redraws every panel at the new depth", async function () {
  this.timeout(60000);
  const out = await page(`
    const kinds = {Apples: "Pome", Pears: "Pome", Plums: "Stone", Figs: "Other"};
    const data = rows.filter(d => d.year === 2022).map(d => ({...d, kind: kinds[d.product]}));
    const chart = new d3plus.Treemap().select("#viz").data(data)
      .groupBy(["kind", "product"]).sum("sales").depth(0).facet("region").duration(0);
    await done(chart);
    chart.schema.on["click.shape"](chart._filteredData.find(d => d.kind === "Pome"), 0, undefined, new MouseEvent("click"));
    await new Promise(r => setTimeout(r, 300));
    return {depth: chart._drawDepth, panels: chart._facetPanels.length, products: Array.from(new Set(chart._filteredData.map(d => d.product))).sort()};
  `);
  assert.deepStrictEqual(out, {depth: 1, panels: 4, products: ["Apples", "Pears"]});
});

it("panel titles measure and lay out as inert text", async function () {
  this.timeout(60000);
  const out = await page(`
    const {facetTitleBand, facetTitleNodes, measureFacetTitles} = d3plus;
    const titles = [{text: "East", x: 10, y: 20, width: 100}, {text: "West", x: 120, y: 20, width: 100}];
    const config = {fontSize: 12, padding: 4, textAnchor: "middle"};
    const nodes = facetTitleNodes(titles, config);
    const cell = w => ({x: 0, y: 0, width: w, height: 100, edges: {}});
    return {
      height: measureFacetTitles(titles, config),
      none: measureFacetTitles([], config),
      nodes: nodes.map(n => ({type: n.type, interactive: n.interactive, group: n.interactionGroup, datum: "datum" in n, text: n.lines[0].text})),
      wraps: facetTitleBand({schema: {}}, ["East", "A much longer title that wraps"], [cell(300), cell(40)], {fontSize: 12, padding: 2}),
      empty: facetTitleBand({schema: {}}, ["", ""], [cell(300), cell(300)], config),
    };
  `);
  assert.ok(out.height > 12 && out.height < 30, `one line plus padding (got ${out.height})`);
  assert.strictEqual(out.none, 0);
  assert.deepStrictEqual(out.nodes, [
    {type: "text", interactive: false, group: "facet", datum: false, text: "East"},
    {type: "text", interactive: false, group: "facet", datum: false, text: "West"},
  ]);
  assert.ok(out.wraps > 30, `a narrow cell's title wraps (got ${out.wraps})`);
  assert.strictEqual(out.empty, 0);
});

it("sharePlotScales spans every panel's stacks and categories", async function () {
  this.timeout(60000);
  const out = await page(`
    const chart = new d3plus.BarChart().select("#viz").data(rows)
      .groupBy("product").x("year").y("sales").stacked(true).facet("region").duration(0);
    await done(chart);
    const panels = chart._facetPanels.map(p => chart._filteredData.filter(d => d.region === p.value));
    const totals = panels.map(data => Math.max(...years.map(y => data.filter(d => d.year === y).reduce((s, d) => s + d.sales, 0))));
    const shared = d3plus.sharePlotScales(chart, panels);
    return {y: shared.domains.y.map(Number), x: shared.domains.x, padded: shared.padded.y.map(Number), totals};
  `);
  assert.deepStrictEqual(out.x, [2019, 2020, 2021, 2022], "every panel's categories, in order");
  assert.strictEqual(out.y[1], Math.max(...out.totals), "the tallest stack in any panel");
  assert.ok(Math.max(...out.padded) >= out.y[1], "the padded domain still covers it");
});
