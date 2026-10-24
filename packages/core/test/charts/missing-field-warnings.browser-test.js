import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {captureWarnings} from "~test/helpers.js";

/**
    A config key naming a field no row has logs one console warning per key
    and field, on each chart, however many times it redraws; the chart still
    renders as it would without the warning.
*/

const data = [
  {year: 2020, value: 10, region: "North"},
  {year: 2021, value: 14, region: "North"},
  {year: 2020, value: 8, region: "South"},
  {year: 2021, value: 11, region: "South"},
];

const draws = async ({data, renderer}) => {
  const draw = viz => new Promise(r => viz.render(r));
  const el = document.createElement("div");
  el.style.cssText = "width:500px;height:300px";
  document.body.appendChild(el);
  const first = [];
  const viz = new window.d3plus.LinePlot()
    .select(el)
    .renderer(renderer)
    .duration(0)
    .config({data, groupBy: "region", x: "year", y: "vlaue"});
  first.push(...(await captureWarnings(() => draw(viz))));
  const redraw = await captureWarnings(() => draw(viz));
  const renamed = await captureWarnings(() => draw(viz.y("valu")));
  const fixed = await captureWarnings(() => draw(viz.y("value")));
  const shapes = [];
  const walk = nodes =>
    nodes.forEach(n => (shapes.push(n), walk(n.children ?? [])));
  walk(viz._chartScene);
  const lines = shapes.filter(n => n.shapeType === "Line").length;
  el.remove();
  return {first, redraw, renamed, fixed, lines};
};

for (const renderer of ["svg", "canvas"]) {
  it(`warns once about a y key no row has (${renderer})`, async function () {
    const result = await render("", draws, {data, renderer});
    assert.deepStrictEqual(result.first, [
      "LinePlot y: no rows have 'vlaue'; fields are: year, value, region",
    ]);
    assert.deepStrictEqual(result.redraw, [], "a redraw doesn't warn again");
    assert.deepStrictEqual(result.renamed, [
      "LinePlot y: no rows have 'valu'; fields are: year, value, region",
    ]);
    assert.deepStrictEqual(result.fixed, []);
    assert.ok(result.lines > 0, "the fixed key draws lines");
  });
}

const charts = async ({renderer}) => {
  const warnings = await captureWarnings(async () => {
    const configs = [
      [
        "Treemap",
        {
          data: [
            {parent: "A", id: "a", value: 1},
            {parent: "A", id: "b", value: 2},
          ],
          groupBy: ["parent", "nme"],
          sum: "size",
        },
      ],
      [
        "Network",
        {
          nodes: [
            {id: "a", x: 0, y: 0},
            {id: "b", x: 1, y: 1},
          ],
          links: [{source: "a", target: "b", weight: 2}],
          size: "weight",
          nodeGroupBy: "key",
        },
      ],
      ["Pie", {data: [], groupBy: "id", value: "missing"}],
      [
        "BarChart",
        {
          data: [{id: "a", x: "a", y: 1}],
          groupBy: "id",
          x: "x",
          y: d => d.nope,
          time: "date",
        },
      ],
    ];
    for (const [name, config] of configs) {
      const el = document.createElement("div");
      el.style.cssText = "width:400px;height:300px";
      document.body.appendChild(el);
      const viz = new window.d3plus[name]()
        .select(el)
        .renderer(renderer)
        .duration(0)
        .config(config);
      await new Promise(r => viz.render(r));
      el.remove();
    }
  });
  return warnings.map(String);
};

for (const renderer of ["svg", "canvas"]) {
  it(`checks groupBy levels, sum, nodes and links, and time (${renderer})`, async function () {
    const warnings = await render("", charts, {renderer});
    assert.deepStrictEqual(warnings, [
      "Treemap groupBy: no rows have 'nme'; fields are: parent, id, value",
      "Treemap sum: no rows have 'size'; fields are: parent, id, value",
      "Network nodeGroupBy: no rows have 'key'; fields are: id, x, y, source, target, weight",
      "BarChart time: no rows have 'date'; fields are: id, x, y",
    ]);
  });
}
