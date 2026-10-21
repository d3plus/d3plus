import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Every chart's filled data marks honor `shapeConfig.texture` and
    `shapeConfig.backgroundImage`, on SVG and Canvas. Each case renders once
    per feature and backend, then walks the rendered scene graph: every filled
    data mark in the chart body must carry a `pattern:` fill (texture) or a
    `<key>-bgimage` image group (backgroundImage), and so must the legend
    swatches when a legend shows. On SVG the patterns and images must also
    reach the DOM.

    Stroked marks (lines, links, axes) have no fill to texture and are left
    out by the fill check; the few filled marks that intentionally take
    neither feature are named per case.
*/

/** Builds every case inside the page (accessors can't cross into it). */
const pageCases = () => {
  const flat = [{id: "alpha", value: 29}, {id: "beta", value: 18}, {id: "gamma", value: 12}];
  const series = ["alpha", "beta"].flatMap((id, k) =>
    [2019, 2020, 2021].map((year, j) => ({id, year, value: 10 + k * 5 + ((j * 7 + k * 3) % 11)})));
  const nested = [
    {parent: "x", id: "alpha", value: 29}, {parent: "x", id: "beta", value: 10}, {parent: "y", id: "gamma", value: 20},
  ];
  const grid = [
    {row: "r1", column: "c1", value: 1}, {row: "r1", column: "c2", value: 2},
    {row: "r2", column: "c1", value: 3}, {row: "r2", column: "c2", value: 4},
  ];
  const nodes = [{id: "alpha", x: 1, y: 1}, {id: "beta", x: 3, y: 1}, {id: "gamma", x: 2, y: 3}];
  const links = [{source: "alpha", target: "beta", value: 5}, {source: "beta", target: "gamma", value: 3}, {source: "gamma", target: "alpha", value: 4}];
  const samples = Array.from({length: 60}, (_, i) => ({id: i, group: ["Low", "High"][i % 2], value: (i * 37) % 23 + (i % 2) * 8}));
  const box = ["alpha", "beta"].flatMap(id => [20, 40, 74, 80, 115, 125, 150, 170, 180, 300].map((v, sub) => ({id, sub, value: v})));
  const topojson = {
    type: "Topology",
    objects: {c: {type: "GeometryCollection", geometries: [
      {type: "Polygon", arcs: [[0]], id: "x"},
      {type: "Polygon", arcs: [[1]], id: "y"},
    ]}},
    arcs: [
      [[-10, 40], [0, 40], [0, 60], [-10, 60], [-10, 40]],
      [[0, 40], [10, 40], [10, 60], [0, 60], [0, 40]],
    ],
  };
  return {
    Treemap: {config: {data: flat, groupBy: "id", sum: "value"}},
    Pack: {config: {data: flat, groupBy: "id", sum: "value"}},
    Pie: {config: {data: flat, groupBy: "id", value: "value"}},
    Donut: {config: {data: flat, groupBy: "id", value: "value"}},
    Sunburst: {config: {data: nested, groupBy: ["parent", "id"], sum: "value"}},
    Tree: {config: {data: nested, groupBy: ["parent", "id"]}},
    Network: {config: {nodes, links}},
    Sankey: {config: {links: links.slice(0, 2), value: "value"}},
    Rings: {config: {links, center: "alpha"}},
    Chord: {config: {links, value: "value"}},
    Geomap: {config: {data: [{id: "x", value: 3}, {id: "y", value: 5}], tiles: false, topojson, zoom: false}},
    Matrix: {config: {data: grid, row: "row", column: "column"}},
    RadialMatrix: {config: {data: grid, row: "row", column: "column"}},
    Priestley: {config: {data: [{id: "a", start: 2000, end: 2005}, {id: "b", start: 2002, end: 2008}], start: "start", end: "end"}},
    Radar: {config: {data: series, groupBy: "id", metric: "year", value: "value"}},
    // A needle and its hub are pointers: they take a texture but no image.
    Gauge: {config: {data: [{id: "Speed", value: 72}], domain: [0, 100]}, noImage: /-(indicator|hub)$/},
    GaugeProgress: {cls: "Gauge", config: {data: [{id: "CPU", value: 64}], domain: [0, 100], indicator: "progress"}},
    BarChart: {config: {data: series, groupBy: "id", x: "year", y: "value"}},
    AreaPlot: {config: {data: series, groupBy: "id", x: "year", y: "value"}},
    StackedArea: {config: {data: series, groupBy: "id", x: "year", y: "value"}},
    LinePlotConfidence: {cls: "LinePlot", config: {data: series.map(d => ({...d, lci: d.value - 3, hci: d.value + 3})), groupBy: "id", x: "year", y: "value", confidence: ["lci", "hci"]}},
    Plot: {config: {data: series, groupBy: ["id", "year"], x: "year", y: "value", size: "value", color: "id"}},
    // Only the boxes fill: medians are rules and whisker ends and outliers are markers.
    BoxWhisker: {config: {data: box, groupBy: ["id", "sub"], x: "id", y: "value"}, marks: m => m.type === "rect" && m.width > 30 && m.height > 5},
    Histogram: {config: {data: samples, groupBy: "group", value: "value"}},
    Pyramid: {config: {data: ["Male", "Female"].flatMap(sex => ["0-9", "10-19", "20-29"].map((age, b) => ({sex, age, population: 900 - b * 200}))), groupBy: "sex", y: "age", x: "population"}},
    Beeswarm: {config: {data: samples, groupBy: "id", color: "group", x: "value", y: "group"}},
  };
};

/** Renders one case per feature and backend and reports its marks. */
const probe = async ({name, feature, renderer, pageCasesSrc}) => {
  const spec = new Function(`return (${pageCasesSrc})();`)()[name];
  const image = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";
  const el = document.createElement("div");
  el.style.cssText = "width:600px;height:400px;";
  document.body.appendChild(el);
  const viz = new window.d3plus[spec.cls || name]()
    .select(el)
    .config(spec.config)
    .shapeConfig(feature === "texture" ? {texture: "lines"} : {backgroundImage: image})
    .renderer(renderer)
    .duration(0);
  await new Promise(r => viz.render(r));

  const leaves = [];
  const walk = (node, anc) => {
    if (node.type === "group") {
      for (const c of node.children || []) walk(c, `${anc}>${node.key || ""}`);
      return;
    }
    leaves.push({...node, anc});
  };
  walk(viz._lastSceneRendered.root, "");
  const images = new Set(leaves.filter(l => l.type === "image").map(l => l.key));
  const filled = leaves.filter(l =>
    ["rect", "circle", "path", "area"].includes(l.type) &&
    l.datum != null &&
    !String(l.key).endsWith("::hit") &&
    l.paint && l.paint.fill && !["none", "transparent"].includes(l.paint.fill) &&
    !/axis|Axis|Line-group/.test(l.anc),
  );
  const mark = l => ({
    key: String(l.key),
    type: l.type,
    width: l.width,
    height: l.height,
    textured: String(l.paint.fill).startsWith("pattern:"),
    image: images.has(`${l.key}-bgimage-img`),
  });
  const svg = el.querySelector("svg.d3plus-render-svg");
  const out = {
    chart: filled.filter(l => l.anc.includes("viz-chart-cells")).map(mark),
    legend: filled.filter(l => l.anc.includes("viz-legend")).map(mark),
    domPatternFills: renderer === "svg" ? svg.querySelectorAll("[fill^='url(#']").length : null,
    domImages: renderer === "svg" ? svg.querySelectorAll("image").length : null,
  };
  el.remove();
  return out;
};

const pageCasesSrc = pageCases.toString();
const cases = Object.entries(pageCases());

for (const [name, spec] of cases) {
  for (const feature of ["texture", "backgroundImage"]) {
    it(`${name}: shapeConfig.${feature} reaches every filled mark on SVG and Canvas`, {timeout: 120000}, async function () {
      for (const renderer of ["svg", "canvas"]) {
        const label = `${name} (${renderer})`;
        const r = await render("", probe, {name, feature, renderer, pageCasesSrc});
        const pick = spec.marks ? m => spec.marks(m) : () => true;
        const exempt = feature === "backgroundImage" && spec.noImage ? m => spec.noImage.test(m.key) : () => false;
        assert.ok(r.chart.filter(pick).length > 0, `${label}: has filled marks`);
        const marks = r.chart.filter(m => pick(m) && !exempt(m));
        const has = m => (feature === "texture" ? m.textured : m.image);
        const missing = marks.filter(m => !has(m)).map(m => `${m.type}:${m.key}`);
        assert.deepStrictEqual(missing, [], `${label}: every filled mark takes the ${feature}`);
        const legendMissing = r.legend.filter(m => !has(m)).map(m => m.key);
        assert.deepStrictEqual(legendMissing, [], `${label}: every legend swatch takes the ${feature}`);
        if (renderer === "svg") {
          const drawn = feature === "texture" ? r.domPatternFills : r.domImages;
          assert.ok(drawn >= marks.length + r.legend.length, `${label}: the DOM draws them (${drawn})`);
        }
      }
    });
  }
}

it("BoxWhisker: a per-box texture accessor and shapeConfig.Box.backgroundImage reach the boxes", {timeout: 120000}, async function () {
  const out = await render("", async () => {
    const data = ["alpha", "beta"].flatMap(id => [20, 40, 74, 80, 115, 125, 150, 300].map((value, sub) => ({id, sub, value})));
    const el = document.createElement("div");
    el.style.cssText = "width:600px;height:400px;";
    document.body.appendChild(el);
    const viz = new window.d3plus.BoxWhisker()
      .select(el)
      .config({data, groupBy: ["id", "sub"], x: "id", y: "value", duration: 0})
      .shapeConfig({
        texture: d => (d.id === "alpha" ? "lines" : false),
        Box: {backgroundImage: d => (d.id === "beta" ? "data:image/svg+xml,%3Csvg%2F%3E" : false)},
      });
    await new Promise(r => viz.render(r));
    const leaves = [];
    const walk = n => (n.type === "group" ? (n.children || []).forEach(walk) : leaves.push(n));
    walk(viz._lastSceneRendered.root);
    const boxes = leaves.filter(n =>
      n.type === "rect" && n.width > 30 && n.height > 5 && n.datum && n.datum.data && !String(n.key).endsWith("::hit"));
    const images = leaves.filter(n => n.type === "image").map(n => n.key);
    return boxes.map(b => ({
      // The merged box datum lists its rows' ids.
      id: String(b.datum.data.id).split("_")[0],
      textured: String(b.paint.fill).startsWith("pattern:"),
      image: images.includes(`${b.key}-bgimage-img`),
    }));
  });
  assert.deepStrictEqual(out, [
    {id: "alpha", textured: true, image: false},
    {id: "beta", textured: false, image: true},
  ]);
});
