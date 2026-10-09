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
const plot = {data: series, groupBy: "id", x: "x", y: "y"};
const titled = {title: "Title", subtitle: "Subtitle", total: "y"};
const topojson = {
  type: "Topology",
  objects: {c: {type: "GeometryCollection", geometries: [{type: "Polygon", arcs: [[0]], id: "x"}]}},
  arcs: [[[-10, 40], [10, 40], [10, 60], [-10, 60], [-10, 40]]],
};

const charts = [
  ["AreaPlot", plot],
  ["AreaPlot", {...plot, confidence: ["lci", "hci"]}],
  ["BarChart", {...plot, ...titled}],
  ["BarChart", {...plot, stacked: true, time: "year"}],
  ["BoxWhisker", {data: series, groupBy: ["id", "y"], x: "id", y: "y"}],
  ["BumpChart", {...plot, discrete: "x"}],
  ["Chord", {links}],
  ["Donut", {data: tree, groupBy: "id", value: "value"}],
  ["Gauge", {data: [{id: "Speed", value: 72}], domain: [0, 100]}],
  ["Geomap", {data: [{id: "x", value: 3}], colorScale: "value", tiles: false, topojson}],
  ["Histogram", {data: series, groupBy: "id", value: "y", binWidth: 5}],
  ["LinePlot", {...plot, lineLabels: true, lineMarkers: true, confidence: ["lci", "hci"]}],
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
  ["Plot", {...plot, size: "y"}],
  ["Priestley", {data: [{id: "a", start: 2004, end: 2007}, {id: "b", start: 2005, end: 2010}], start: "start", end: "end"}],
  ["Radar", {data: series, groupBy: "id", metric: "x", value: "y"}],
  ["RadialMatrix", {data: [{row: "R1", column: "C1", value: 10}, {row: "R2", column: "C2", value: 30}], groupBy: ["row", "column"], row: "row", column: "column", colorScale: "value"}],
  ["Rings", {links, center: "alpha"}],
  ["Sankey", {links}],
  ["StackedArea", {...plot, ...titled}],
  ["Tree", {data: tree, groupBy: ["parent", "id"]}],
  ["Treemap", {data: tree, groupBy: ["parent", "id"], sum: "value", ...titled}],
];

/**
    Renders `[name, config]` into a fresh element with the given backend,
    sweeps synthetic pointer events across it (shapes, legend, timeline, the
    plot's hover surface), and returns every warning logged along the way.
*/
const renderAndHover = async ({charts, renderer}) => {
  const warnings = [];
  const warn = console.warn;
  console.warn = msg => warnings.push(String(msg));
  try {
    for (const [name, config] of charts) {
      const el = document.createElement("div");
      el.style.cssText = "width:500px;height:400px";
      document.body.appendChild(el);
      const viz = new window.d3plus[name]().select(el).config(config).renderer(renderer).duration(0);
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
