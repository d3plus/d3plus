import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    The first Marimekko stories across the widths a Storybook docs page or
    canvas gives a chart (350px tall): every region's label lies flat,
    wrapped within its own bar, with its share on a line beneath it in
    BasicExample and BarWidthMeasure and its name alone in
    WithoutWidthShares, and BarWidthMeasure's x axis sits below its bars.
*/

after(async () => {
  await closeBrowser();
});

// The stories' smartphone revenue ($B) and units sold (millions) by region.
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
const names = Object.keys(regions);
const share = /^[\d.]+%$/;

/**
    Renders a Marimekko and reads its painted scene back (either renderer):
    the x axis's labels (lines, rotation, and top edge), its domain line, and
    the bottom edge of the bars, all in the chart body's coordinates.
*/
const draw = ([config, rows]) =>
  new Promise(resolve => {
    if (config.maxAggs) config = {...config, aggs: {[config.maxAggs]: (a, c) => Math.max(...a.map(c))}};
    delete config.maxAggs;
    const el = document.createElement("div");
    document.body.appendChild(el);
    const viz = new window.d3plus.Marimekko()
      .select(el)
      .data(rows)
      .groupBy("Brand")
      .x("Region")
      .y("Revenue")
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

for (const renderer of ["svg", "canvas"]) {
  for (const width of [600, 750, 900, 1100]) {
    it(`Marimekko stories at ${width} × 350: every region lies flat, with its share beneath its name unless barWidthShare(false) (${renderer})`, async function () {
      this.timeout(60000);
      const out = await render("", draw, [{renderer, width}, sales]);
      assert.strictEqual(out.rotated, false, "no label rotates");
      assert.ok(out.labels.every(l => !l.rotate), "none painted rotated");
      assert.deepStrictEqual(out.labels.map(l => l.lines.slice(0, -1).join(" ")), names, "every region, in order");
      out.labels.forEach(l => assert.ok(share.test(l.lines[l.lines.length - 1]), `share line: ${l.lines}`));

      // WithoutWidthShares: the same regions, by name alone.
      const plain = await render("", draw, [{renderer, width, barWidthShare: false}, sales]);
      assert.strictEqual(plain.rotated, false);
      assert.deepStrictEqual(plain.labels.map(l => l.lines.join(" ")), names);
    });

    it(`Marimekko BarWidthMeasure story at ${width} × 350: flat labels with their shares, below every bar (${renderer})`, async function () {
      this.timeout(60000);
      const out = await render("", draw, [{renderer, width, barWidth: "Units Sold", maxAggs: "Units Sold"}, sales]);
      assert.strictEqual(out.rotated, false, "no label rotates");
      assert.ok(out.labels.length >= 4, `labels: ${JSON.stringify(out.labels)}`);
      out.labels.forEach(l => assert.ok(share.test(l.lines[l.lines.length - 1]), `share line: ${l.lines}`));
      assert.ok(Math.abs(out.domain - out.barBottom) <= 0.5, `the domain line (${out.domain}) meets the bars' base (${out.barBottom})`);
      out.labels.forEach(l => assert.ok(l.top >= out.domain, `${l.lines} (${l.top}) below the domain line (${out.domain})`));
    });
  }
}
