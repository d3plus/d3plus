import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Marimekko's wrapped category labels, drawn beside a legend: the plot
    still ends where the x axis begins, at every width (see
    plot-x-axis-fit.browser-test.js for the BarChart case).
*/

/**
    Renders a chart and reads its painted scene back (either renderer): the x
    axis's labels (lines and top edge), its domain line, and the bottom edge
    of the bars, all in the chart body's coordinates.
*/
const drawAxisFit = ([chart, config, rows]) =>
  new Promise(resolve => {
    if (config.maxAggs) config = {...config, aggs: {[config.maxAggs]: (a, c) => Math.max(...a.map(c))}};
    delete config.maxAggs;
    const el = document.createElement("div");
    document.body.appendChild(el);
    const viz = new window.d3plus[chart]()
      .select(el)
      .data(rows)
      .duration(0)
      .height(350)
      .config(config);
    viz.render(() => {
      const out = {labels: [], domain: undefined, barBottom: -Infinity, rotated: viz._xAxis._labelRotation};
      const walk = (node, dx, dy, axis) => {
        if (!node || node.key === "textBox-group" || node.key === "viz-legend") return;
        const x = dx + (node.transform?.x ?? 0), y = dy + (node.transform?.y ?? 0);
        const inAxis = axis || /(?:^|\/)plot-x-axis$/.test(node.key || "");
        if (inAxis && node.type === "text")
          out.labels.push({lines: node.lines.map(l => l.text), top: y + node.y, rotate: node.transform?.rotate ?? 0});
        else if (inAxis && node.type === "line" && node.key === "bar")
          out.domain = y + Math.min(...node.points.map(p => p[1]));
        else if (!inAxis && node.type === "rect" && /_/.test(node.key || "") && !/::hit$/.test(node.key))
          out.barBottom = Math.max(out.barBottom, y + node.y + node.height);
        (node.children || []).forEach(c => walk(c, x, y, inAxis));
      };
      walk(viz._paintedScene && viz._paintedScene.root, 0, 0, false);
      resolve(out);
    });
  });

/** Asserts the x axis's domain line meets the bars' base, with every label below it. */
const assertBelow = (out, message) => {
  assert.ok(Number.isFinite(out.barBottom) && out.domain !== undefined, `${message}: bars and a domain line drawn`);
  assert.ok(Math.abs(out.domain - out.barBottom) <= 0.5, `${message}: the domain line (${out.domain}) meets the bars' base (${out.barBottom})`);
  out.labels.forEach(l => assert.ok(l.top >= out.domain, `${message}: ${l.lines} (${l.top}) below the domain line (${out.domain})`));
};

// Smartphone revenue ($B) and units sold (millions) by region.
const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Other"];
const regions = {
  "North America": [62, 24, 1, 1, 9],
  "Latin America": [6, 14, 7, 3, 8],
  "Europe": [38, 30, 12, 6, 14],
  "Middle East & Africa": [8, 12, 6, 5, 16],
  "Asia Pacific": [70, 34, 40, 38, 58],
};
const units = {"North America": 150, "Latin America": 130, "Europe": 190, "Middle East & Africa": 190, "Asia Pacific": 640};
const sales = Object.entries(regions).flatMap(([Region, values]) =>
  values.map((Revenue, i) => ({Region, Brand: brands[i], Revenue, "Units Sold": units[Region]})));

for (const renderer of ["svg", "canvas"]) {
  for (const width of [600, 750, 900, 1100]) {
    it(`Marimekko with a barWidth measure at ${width} × 350: the x axis sits below every bar (${renderer})`, async function () {
      const config = {renderer, width, groupBy: "Brand", x: "Region", y: "Revenue", barWidth: "Units Sold", maxAggs: "Units Sold"};
      const out = await render("", drawAxisFit, ["Marimekko", config, sales]);
      assert.ok(out.labels.length >= 4, `labels: ${JSON.stringify(out.labels)}`);
      assertBelow(out, `${width}px`);
    });
  }
}
