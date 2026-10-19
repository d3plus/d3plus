import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(closeBrowser);

/**
    A per-row `shapeConfig.texture` accessor reaches an AreaPlot's areas and a
    LinePlot's confidence bands, on SVG and Canvas. Each Area resolves the
    accessor against its merged row, so `d.id` is the series id and only the
    matching series is textured, in the chart and in the legend.
*/

/** Renders one chart and reports which areas and legend swatches are textured. */
const probe = async ({cls, confidence, renderer}) => {
  const series = ["alpha", "beta"].flatMap((id, k) =>
    [2019, 2020, 2021].map((year, j) => ({id, year, value: 10 + k * 5 + j * 3, lci: 5 + k * 5 + j * 3, hci: 15 + k * 5 + j * 3})));
  const el = document.createElement("div");
  el.style.cssText = "width:600px;height:400px;";
  document.body.appendChild(el);
  const seen = [];
  const viz = new window.d3plus[cls]()
    .select(el)
    .config({data: series, groupBy: "id", x: "year", y: "value", duration: 0})
    .shapeConfig({texture: d => (seen.push(d.id), d.id === "alpha" ? "lines" : false)})
    .renderer(renderer);
  if (confidence) viz.confidence(["lci", "hci"]);
  await new Promise(r => viz.render(r));

  const leaves = [];
  const walk = (node, anc) => {
    if (node.type === "group") (node.children || []).forEach(c => walk(c, `${anc}>${node.key || ""}`));
    else leaves.push({node, anc});
  };
  walk(viz._lastSceneRendered.root, "");
  const textured = n => String(n.paint && n.paint.fill).startsWith("pattern:");
  const areas = leaves
    .filter(({node, anc}) => node.shapeType === "Area" && anc.includes("viz-chart-cells") && !String(node.key).endsWith("::hit"))
    .map(({node}) => ({key: String(node.key), textured: textured(node)}));
  const legend = leaves
    .filter(({node, anc}) =>
      anc.includes("viz-legend") && node.datum != null && ["rect", "circle", "path"].includes(node.type) &&
      !String(node.key).endsWith("::hit"))
    // A swatch's key leads with its series id (then its opacity and texture).
    .map(({node}) => ({id: String(node.key).split("_")[0], textured: textured(node)}));
  const svg = el.querySelector("svg.d3plus-render-svg");
  const out = {
    areas,
    legend,
    seenIds: [...new Set(seen.map(String))].sort(),
    domPatternFills: renderer === "svg" ? svg.querySelectorAll("[fill^='url(#']").length : null,
  };
  el.remove();
  return out;
};

const cases = [
  {name: "AreaPlot areas", cls: "AreaPlot"},
  {name: "LinePlot confidence bands", cls: "LinePlot", confidence: true},
];

for (const {name, cls, confidence} of cases) {
  it(`${name}: a per-row texture accessor gets the merged row, on SVG and Canvas`, async function () {
    this.timeout(120000);
    for (const renderer of ["svg", "canvas"]) {
      const label = `${name} (${renderer})`;
      const r = await render("", probe, {cls, confidence, renderer});
      assert.deepStrictEqual(
        r.areas.map(a => [a.key, a.textured]).sort(),
        [["alpha", true], ["beta", false]],
        `${label}: only the alpha area is textured`,
      );
      assert.deepStrictEqual(r.seenIds, ["alpha", "beta"], `${label}: the accessor only sees series rows`);
      // A LinePlot's legend draws a line and a point per series; each takes its series' texture.
      assert.deepStrictEqual(
        [...new Set(r.legend.map(s => `${s.id}:${s.textured}`))].sort(),
        ["alpha:true", "beta:false"],
        `${label}: only the alpha legend swatches are textured`,
      );
      if (renderer === "svg") {
        const textured = r.areas.concat(r.legend).filter(m => m.textured).length;
        assert.strictEqual(r.domPatternFills, textured, `${label}: the DOM fills each textured area and swatch with a pattern`);
      }
    }
  });
}

// backgroundImage already resolves through the merged row; keep it that way.
it("AreaPlot: a per-row backgroundImage accessor gets the merged row, on SVG and Canvas", async function () {
  this.timeout(120000);
  for (const renderer of ["svg", "canvas"]) {
    const images = await render("", async renderer => {
      const data = ["alpha", "beta"].flatMap(id => [2019, 2020].map((year, j) => ({id, year, value: 10 + j})));
      const el = document.createElement("div");
      el.style.cssText = "width:600px;height:400px;";
      document.body.appendChild(el);
      const viz = new window.d3plus.AreaPlot()
        .select(el)
        .config({data, groupBy: "id", x: "year", y: "value", duration: 0})
        .shapeConfig({Area: {backgroundImage: d => (d.id === "alpha" ? "data:image/svg+xml,%3Csvg%2F%3E" : false)}})
        .renderer(renderer);
      await new Promise(r => viz.render(r));
      const keys = [];
      const walk = n => (n.type === "group" ? (n.children || []).forEach(walk) : n.type === "image" && keys.push(String(n.key)));
      walk(viz._lastSceneRendered.root);
      el.remove();
      return keys;
    }, renderer);
    assert.deepStrictEqual(images, ["alpha-bgimage-img"], `${renderer}: only the alpha area draws its image`);
  }
});
