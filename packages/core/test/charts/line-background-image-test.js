import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(closeBrowser);

/**
    Lines are stroked, not filled, so they draw no `shapeConfig.backgroundImage`
    and no `shapeConfig.texture`, on SVG and Canvas, while the filled marks
    beside them (areas, bars, and the legend's swatches) keep theirs. Each
    chart renders with both features set and reports its marks per shape type,
    how many carry a texture, and the images it draws.
*/

const image = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";

/** Renders one chart with a texture and a background image and tallies its marks and images. */
const probe = async ({cls, config, renderer, image}) => {
  const series = ["alpha", "beta"].flatMap((id, k) =>
    [2019, 2020, 2021].map((year, j) => ({id, year, value: 10 + k * 5 + j * 3, lci: 8 + k * 5 + j * 3, hci: 12 + k * 5 + j * 3})));
  const el = document.createElement("div");
  el.style.cssText = "width:600px;height:400px;";
  document.body.appendChild(el);
  const viz = new window.d3plus[cls]()
    .select(el)
    .config({data: series, groupBy: "id", x: "year", y: "value", duration: 0})
    .config(config)
    .shapeConfig({backgroundImage: image, texture: "lines"})
    .renderer(renderer);
  await new Promise(r => viz.render(r));

  const leaves = [];
  const walk = (node, anc) => {
    if (node.type === "group") (node.children || []).forEach(c => walk(c, `${anc}>${node.key || ""}`));
    else leaves.push({node, anc});
  };
  walk(viz._lastSceneRendered.root, "");
  // A shape's image group is keyed after it; a line and its confidence band
  // share a key, so images are listed by key rather than matched to a mark.
  const images = leaves
    .filter(({node, anc}) => node.type === "image" && anc.includes("viz-chart-cells"))
    .map(({node}) => String(node.key))
    .sort();
  const tally = {};
  for (const {node, anc} of leaves) {
    if (!node.shapeType || node.datum == null || String(node.key).endsWith("::hit")) continue;
    if (/axis/.test(anc)) continue;
    const where = anc.includes("viz-legend") ? "legend" : anc.includes("viz-chart-cells") ? "chart" : null;
    if (!where) continue;
    const t = (tally[`${where}:${node.shapeType}`] ||= {marks: 0, textured: 0});
    t.marks++;
    if (String(node.paint && node.paint.fill).startsWith("pattern:")) t.textured++;
  }
  const legendImages = leaves.filter(({node, anc}) => node.type === "image" && anc.includes("viz-legend")).length;
  const svg = el.querySelector("svg.d3plus-render-svg");
  const out = {
    tally,
    images,
    legendImages,
    domImages: renderer === "svg" ? svg.querySelectorAll("image").length : null,
  };
  el.remove();
  return out;
};

const cases = [
  {
    name: "LinePlot",
    cls: "LinePlot",
    config: {lineMarkers: true},
    marks: {
      "chart:Line": {marks: 2, textured: 0},
      // Line markers take neither feature, as before.
      "chart:Circle": {marks: 6, textured: 0},
    },
    images: [],
  },
  {
    name: "LinePlot with confidence bands",
    cls: "LinePlot",
    config: {confidence: ["lci", "hci"]},
    marks: {
      "chart:Line": {marks: 2, textured: 0},
      // The band around each line is a filled Area.
      "chart:Area": {marks: 2, textured: 2},
    },
    // One image per band; none for the lines that share their keys.
    images: ["alpha-bgimage-img", "beta-bgimage-img"],
  },
  {
    name: "AreaPlot",
    cls: "AreaPlot",
    config: {},
    marks: {"chart:Area": {marks: 2, textured: 2}},
    images: ["alpha-bgimage-img", "beta-bgimage-img"],
  },
  {
    name: "BarChart with error bars",
    cls: "BarChart",
    config: {confidence: ["lci", "hci"]},
    // Six bars, then six error bars: unfilled Bar shapes that share their bar's key.
    marks: {"chart:Bar": {marks: 12, textured: 6}},
    // One image per bar; none for the error bars.
    images: ["alpha", "beta"].flatMap(id => [2019, 2020, 2021].map(year => `${id}_${year}-bgimage-img`)),
  },
];

for (const {name, cls, config, marks, images} of cases) {
  it(`${name}: only filled marks draw shapeConfig.backgroundImage and texture, on SVG and Canvas`, async function () {
    this.timeout(120000);
    for (const renderer of ["svg", "canvas"]) {
      const label = `${name} (${renderer})`;
      const r = await render("", probe, {cls, config, renderer, image});
      const chart = Object.fromEntries(Object.entries(r.tally).filter(([k]) => k.startsWith("chart:")));
      assert.deepStrictEqual(chart, marks, `${label}: chart marks`);
      assert.deepStrictEqual(r.images, images, `${label}: chart images`);
      // The legend's swatches are filled marks, so every one keeps both.
      const legend = Object.entries(r.tally).filter(([k]) => k.startsWith("legend:"));
      const swatches = legend.reduce((n, [, t]) => n + t.marks, 0);
      assert.ok(swatches > 0, `${label}: has legend swatches`);
      for (const [k, t] of legend) assert.strictEqual(t.textured, t.marks, `${label}: ${k} swatches keep the texture`);
      assert.strictEqual(r.legendImages, swatches, `${label}: legend swatches keep the image`);
      if (renderer === "svg") assert.strictEqual(r.domImages, images.length + swatches, `${label}: the DOM draws exactly the scene's images`);
    }
  });
}
