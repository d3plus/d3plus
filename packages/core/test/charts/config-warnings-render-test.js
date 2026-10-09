import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(closeBrowser);

/**
    Rendering and hovering every chart type with ordinary configs must not log
    unknown-property warnings: the shared config internal code hands to shapes
    and text boxes is not the user's, so only user mistakes may warn.
*/

const series = [
  {id: "alpha", x: 4, y: 7, year: 2020},
  {id: "alpha", x: 5, y: 25, year: 2021},
  {id: "alpha", x: 6, y: 13, year: 2022},
  {id: "beta", x: 4, y: 17, year: 2020},
  {id: "beta", x: 5, y: 8, year: 2021},
  {id: "beta", x: 6, y: 13, year: 2022},
].map(d => ({...d, lci: d.y - 2, hci: d.y + 2}));
const tree = [
  {parent: "Group 1", id: "alpha", value: 29},
  {parent: "Group 1", id: "beta", value: 10},
  {parent: "Group 1", id: "gamma", value: 2},
  {parent: "Group 2", id: "delta", value: 29},
  {parent: "Group 2", id: "eta", value: 25},
];
const codebase = [
  {area: "Frontend", module: "Components", file: "Button", size: 120},
  {area: "Frontend", module: "Components", file: "Table", size: 410},
  {area: "Frontend", module: "Pages", file: "Dashboard", size: 520},
  {area: "Frontend", module: "Pages", file: "Settings", size: 180},
  {area: "Backend", module: "API", file: "Users", size: 330},
  {area: "Backend", module: "API", file: "Orders", size: 460},
  {area: "Backend", module: "Jobs", file: "Email", size: 20},
  {area: "Docs", module: "Guides", file: "Theming", size: 40},
];
const sunburst = {data: codebase, groupBy: ["area", "module", "file"], sum: "size"};
const links = [
  {source: "alpha", target: "beta", value: 5},
  {source: "alpha", target: "gamma", value: 3},
  {source: "beta", target: "delta", value: 2},
  {source: "beta", target: "epsilon", value: 4},
  {source: "zeta", target: "gamma", value: 1},
];
const nodes = [
  {id: "alpha", x: 1, y: 1},
  {id: "beta", x: 2, y: 1},
  {id: "gamma", x: 1, y: 2},
  {id: "delta", x: 3, y: 2},
  {id: "epsilon", x: 3, y: 3},
  {id: "zeta", x: 0, y: 3},
];
const radarMetrics = names => ["alpha", "beta"].flatMap((id, g) =>
  names.map((metric, m) => ({id, metric, value: 20 + ((m * 13 + g * 31) % 70)})));
const radar = radarMetrics(["Speed", "Power", "Range", "Comfort", "Safety", "Price"]);
const radarLong = radarMetrics([
  "Customer Satisfaction Index", "Revenue", "Net Promoter Score (Trailing 12 Months)", "Churn",
  "Average Handling Time", "Employee Engagement", "Market Share", "Gross Margin Percentage",
]);
const plot = {data: series, groupBy: "id", x: "x", y: "y"};
const flag = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='2'%3E%3Crect width='3' height='2' fill='%23c00'/%3E%3C/svg%3E";
const image = {backgroundImage: flag};
const swarmRows = Array.from({length: 40}, (_, i) => ({
  id: `s${i}`,
  group: ["north", "south"][i % 2],
  value: i % 7 === 0 ? 80 + i : (i * 37) % 40,
  size: 1 + (i % 5),
}));
const swarm = {data: swarmRows, groupBy: "id", x: "value"};
// Small multiples: the same series in two panels.
const regional = ["east", "west"].flatMap((region, r) => series.map(d => ({...d, region, y: d.y + r * 5})));
const faceted = {...plot, data: regional, facet: "region"};
const titled = {title: "Title", subtitle: "Subtitle", total: "y"};
const population = ["0-9", "10-19", "20-29"].flatMap((age, b) => [2020, 2021].flatMap(year => [
  {age, sex: "Male", area: "Urban", pop: 60 - b * 10, before: 55, year},
  {age, sex: "Male", area: "Rural", pop: 30 - b * 5, before: 25, year},
  {age, sex: "Female", area: "Urban", pop: 62 - b * 10, before: 50, year},
  {age, sex: "Female", area: "Rural", pop: 31 - b * 5, before: 30, year},
]));
const pyramid = {data: population, groupBy: "sex", x: "pop", y: "age"};
const topojson = {
  type: "Topology",
  objects: {c: {type: "GeometryCollection", geometries: [{type: "Polygon", arcs: [[0]], id: "x"}]}},
  arcs: [[[-10, 40], [10, 40], [10, 60], [-10, 60], [-10, 40]]],
};

const charts = [
  ["AreaPlot", plot],
  ["AreaPlot", {...plot, confidence: ["lci", "hci"]}],
  ["BarChart", {...plot, ...titled}],
  ["Beeswarm", swarm],
  ["Beeswarm", {...swarm, y: "group", color: "group", ...titled}],
  ["Beeswarm", {...swarm, x: "group", y: "value", size: "size", swarmConfig: {overflow: "clamp"}}],
  ["Beeswarm", {...swarm, y: "group", xBreak: [45, 75]}],
  ["Beeswarm", {...swarm, height: 120}],
  ["BarChart", {...plot, stacked: true, time: "year"}],
  ["BarChart", {...faceted, ...titled, facetConfig: {columns: 2, titleConfig: {fontSize: 14}}}],
  ["BarChart", {...plot, confidence: ["lci", "hci"]}],
  ["BarChart", {...plot, discrete: "y", x: "y", y: "x", confidence: ["lci", "hci"]}],
  ["BarChart", {...plot, stacked: true, confidence: ["lci", "hci"]}],
  ["BarChart", {
    ...plot,
    confidence: [false, "hci"],
    confidenceConfig: {capWidth: 6, tooltip: false, strokeDasharray: "2 2", Bar: {stroke: "#333", strokeWidth: 2}},
  }],
  ["BarChart", {
    data: [
      {id: "alpha", x: "a", y: 42, lci: 38, hci: 47},
      {id: "beta", x: "b", y: 960, lci: 850, hci: 990},
    ],
    groupBy: "id", x: "x", y: "y", yBreak: [80, 900], confidence: ["lci", "hci"],
  }],
  ["BoxWhisker", {data: series, groupBy: ["id", "y"], x: "id", y: "y"}],
  ["BumpChart", {...plot, discrete: "x"}],
  ["Chord", {links}],
  ["Donut", {data: tree, groupBy: "id", value: "value"}],
  ["Gauge", {data: [{id: "Speed", value: 72}], domain: [0, 100]}],
  ["Gauge", {data: [{id: "Speed", value: 72, region: "east"}, {id: "Speed", value: 40, region: "west"}], domain: [0, 100], facet: "region"}],
  ["Geomap", {data: [{id: "x", value: 3}], colorScale: "value", tiles: false, topojson}],
  ["Histogram", {data: series, groupBy: "id", value: "y", binWidth: 5}],
  ["LinePlot", {...plot, lineLabels: true, lineMarkers: true, confidence: ["lci", "hci"]}],
  ["LinePlot", {...faceted, facetConfig: {scales: "independent", sort: "descending"}}],
  ["LinePlot", {
    ...plot,
    annotations: [
      {shape: "Line", data: [{id: "a", x: 4, y: 10}, {id: "a", x: 6, y: 10}], stroke: "red"},
      {shape: "Rect", layer: "front", data: [{id: "r", x: 5, y: 15, width: 10, height: 10}]},
      {shape: "Circle", data: [{id: "c", x: 5, y: 20, r: 5}]},
    ],
  }],
  ["Matrix", {data: [{row: "R1", column: "C1", value: 10}, {row: "R2", column: "C2", value: 30}], groupBy: ["row", "column"], row: "row", column: "column", colorScale: "value"}],
  ["Network", {links, nodes, size: "value"}],
  ["Pack", {data: tree, groupBy: ["parent", "id"], sum: "value"}],
  ["Pie", {data: tree, groupBy: "id", value: "value"}],
  ["Pie", {data: tree, groupBy: "id", value: "value", facet: "parent"}],
  ["Plot", {...plot, size: "y"}],
  ["Plot", {data: series.map(d => ({...d, kind: d.id === "alpha" ? "odd" : "even", key: `${d.id}-${d.year}`})), groupBy: "key", color: "kind", x: "x", y: "y"}],
  ["Plot", {...plot, swarm: true, shapeConfig: {Circle: {trail: false}}}],
  ["Priestley", {data: [{id: "a", start: 2004, end: 2007}, {id: "b", start: 2005, end: 2010}], start: "start", end: "end"}],
  ["Pyramid", {...pyramid, ...titled}],
  ["Pyramid", {...pyramid, categoryPosition: "left"}],
  ["Pyramid", {...pyramid, groupBy: ["sex", "area"]}],
  ["Pyramid", {...pyramid, percent: true, comparison: "before", sideTitleConfig: {fontSize: 12}, comparisonConfig: {strokeWidth: 2}}],
  ["Pyramid", {...pyramid, time: "year", axisPersist: true}],
  ["Radar", {data: series, groupBy: "id", metric: "x", value: "y"}],
  ["Radar", {data: radar, groupBy: "id", metric: "metric", value: "value", levels: [0, 25, 50, 75, 100]}, {fns: {levelFormat: "d => `${d}%`"}}],
  ["Radar", {
    data: radar, groupBy: "id", metric: "metric", value: "value", levels: 4, levelLabelAngle: 22.5,
    levelLabelConfig: {fontColor: "#6b7280", fontSize: 11, fontWeight: 600},
    axisConfig: {barConfig: {stroke: "#495057", strokeWidth: 2}, gridConfig: {"stroke-width": 1, strokeDasharray: "4 3"}, shapeConfig: {stroke: "#adb5bd"}},
  }],
  ["Radar", {data: radar, groupBy: "id", metric: "metric", value: "value", levelLabels: false, outerPadding: 80}],
  ["Radar", {data: radarLong, groupBy: "id", metric: "metric", value: "value"}],
  ["Radar", {data: radar, groupBy: "id", metric: "metric", value: "value"}, {style: "background:rgb(20, 20, 20)"}],
  ["RadialMatrix", {data: [{row: "R1", column: "C1", value: 10}, {row: "R2", column: "C2", value: 30}], groupBy: ["row", "column"], row: "row", column: "column", colorScale: "value"}],
  ["Rings", {links, center: "alpha"}],
  ["Sankey", {links}],
  ["StackedArea", {...plot, ...titled}],
  ["Sunburst", {data: tree, groupBy: ["parent", "id"], sum: "value"}],
  ["Sunburst", {...sunburst, title: "Title", subtitle: "Subtitle", total: "size"}],
  ["Sunburst", {...sunburst, shade: false, threshold: 0.05, thresholdName: "Files"}],
  ["Sunburst", {...sunburst, ringSize: "area", padPixel: 2, innerRadius: 0, shadeConfig: {step: 0.3, max: 0.5}}],
  ["Sunburst", {...sunburst, colorScale: "size"}],
  ["Tree", {data: tree, groupBy: ["parent", "id"]}],
  ["Treemap", {data: tree, groupBy: ["parent", "id"], sum: "value", ...titled}],
  ["BarChart", {...plot, shapeConfig: {Bar: image}}],
  ["Chord", {links, shapeConfig: image}],
  ["Gauge", {data: [{id: "Speed", value: 72}], domain: [0, 100], indicator: "progress", shapeConfig: image}],
  ["Geomap", {data: [{id: "x", value: 3}], tiles: false, topojson, shapeConfig: {Path: image}}],
  ["Matrix", {data: [{row: "R1", column: "C1", value: 10}, {row: "R2", column: "C2", value: 30}], groupBy: ["row", "column"], row: "row", column: "column", shapeConfig: {Rect: image}}],
  ["Network", {links, nodes, shapeConfig: image}],
  ["Pack", {data: tree, groupBy: ["parent", "id"], sum: "value", shapeConfig: {Circle: {...image, backgroundImageFit: "contain"}}}],
  ["Pie", {data: tree, groupBy: "id", value: "value", shapeConfig: {Path: image}}],
  ["Radar", {data: radar, groupBy: "id", metric: "metric", value: "value", shapeConfig: image}],
  ["Sankey", {links, shapeConfig: {Rect: image}}],
  ["Treemap", {data: tree, groupBy: ["parent", "id"], sum: "value", shapeConfig: {...image, backgroundImageFit: "contain"}}],
];

/**
    Renders `[name, config, opts?]` into a fresh element with the given
    backend (`opts.style` adds CSS to the element; `opts.fns` maps config
    keys to function source, since functions can't cross into the page),
    sweeps synthetic pointer events across it (shapes, legend, timeline, the
    plot's hover surface), and returns every warning logged along the way.
*/
const renderAndHover = async ({charts, renderer}) => {
  const warnings = [];
  const warn = console.warn;
  console.warn = msg => warnings.push(String(msg));
  try {
    for (const [name, config, opts = {}] of charts) {
      const el = document.createElement("div");
      el.style.cssText = `width:500px;height:400px;${opts.style ?? ""}`;
      document.body.appendChild(el);
      const fns = Object.fromEntries(
        Object.entries(opts.fns ?? {}).map(([key, src]) => [key, new Function(`return (${src});`)()]),
      );
      const viz = new window.d3plus[name]()
        .select(el)
        .config({...config, ...fns})
        .renderer(renderer)
        .duration(0);
      await new Promise(r => viz.render(r));
      const box = el.getBoundingClientRect();
      for (let j = 0; j < 8; j++)
        for (let i = 0; i < 10; i++) {
          const clientX = box.left + (box.width * (i + 0.5)) / 10;
          const clientY = box.top + (box.height * (j + 0.5)) / 8;
          const target = document.elementFromPoint(clientX, clientY);
          if (!target || !el.contains(target)) continue;
          for (const type of ["mouseover", "mouseenter", "mousemove"])
            target.dispatchEvent(new MouseEvent(type, {clientX, clientY, bubbles: true}));
        }
      el.remove();
    }
  }
  finally {
    console.warn = warn;
  }
  return warnings;
};

for (const renderer of ["svg", "canvas"]) {
  it(`renders and hovers every chart type without config warnings (${renderer})`, async function () {
    this.timeout(120000);
    const warnings = await render("", renderAndHover, {charts, renderer});
    assert.deepStrictEqual(warnings, []);
  });
}

/**
    Zooms a Sunburst into an arc and back out twice — through its center disc
    and through the Back control — and returns every warning logged.
*/
const zoomAndBack = async ({config, renderer}) => {
  const warnings = [];
  const warn = console.warn;
  console.warn = msg => warnings.push(String(msg));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    const el = document.createElement("div");
    el.style.cssText = "width:500px;height:400px";
    document.body.appendChild(el);
    const viz = new window.d3plus.Sunburst().select(el).config(config).renderer(renderer).duration(0);
    await new Promise(r => viz.render(r));
    const arc = path => viz._chartScene.find(n => n.type === "path" && n.key === `sunburst-${JSON.stringify(path)}`);
    const click = node => viz._routeSceneEvent({
      type: "click", point: [1, 1], pick: {node, datum: node.datum, index: node.index},
      nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
    });
    click(arc(["Backend"]));
    await wait(100);
    click(arc(["Backend"]));
    await wait(100);
    click(arc(["Frontend"]));
    await wait(100);
    el.querySelector(".back-control").click();
    await wait(100);
    el.remove();
  }
  finally {
    console.warn = warn;
  }
  return warnings;
};

for (const renderer of ["svg", "canvas"]) {
  it(`zooms a Sunburst in and back out without config warnings (${renderer})`, async function () {
    this.timeout(60000);
    const warnings = await render("", zoomAndBack, {config: sunburst, renderer});
    assert.deepStrictEqual(warnings, []);
  });
}

it("still warns about a typo in the user's config", async function () {
  this.timeout(60000);
  const typos = [
    ["LinePlot", {...plot, shapeConfig: {fil: "red"}}],
    ["LinePlot", {...plot, annotations: [{shape: "Line", data: [{id: "a", x: 4, y: 10}], strok: "red"}]}],
    ["Network", {links, nodes, shapeConfig: {labelConfig: {fontSzie: 12}}}],
    ["BarChart", {...plot, titl: "Title"}],
  ];
  const warnings = await render("", renderAndHover, {charts: typos, renderer: "svg"});
  assert.deepStrictEqual(warnings, [
    'LinePlot.shapeConfig() received unknown property "fil".',
    'Line.config() received unknown property "strok".',
    'TextBox.config() received unknown property "fontSzie".',
    'BarChart.config() received unknown property "titl".',
  ]);
});
