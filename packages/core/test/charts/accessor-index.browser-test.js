import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A data-driven chart's style accessors (`shapeConfig` fill, stroke, …)
    receive the same `i` its handlers report for the mark they paint: the
    row's position in the data, or -1 for a mark that stands for several
    rows.
*/

const region = {
  type: "Topology",
  objects: {
    land: {
      type: "GeometryCollection",
      geometries: [{type: "Polygon", arcs: [[0]], id: "land"}],
    },
  },
  arcs: [
    [
      [-74, 41],
      [-74, 44.5],
      [-69, 44.5],
      [-69, 41],
      [-74, 41],
    ],
  ],
};

const charts = {
  Pack: `new lib.Pack()
    .data([
      {group: "A", id: "a1", value: 10}, {group: "A", id: "a2", value: 20},
      {group: "B", id: "b1", value: 15}, {group: "B", id: "b2", value: 25},
    ])
    .groupBy(["group", "id"]).sum("value")`,
  Radar: `new lib.Radar()
    .data([
      {id: "A", m: "x", v: 1}, {id: "A", m: "y", v: 2}, {id: "A", m: "z", v: 3},
      {id: "B", m: "x", v: 3}, {id: "B", m: "y", v: 1}, {id: "B", m: "z", v: 2},
    ])
    .groupBy("id").metric("m").value("v")`,
  "Geomap points": `new lib.Geomap()
    .data([
      {id: "Boston", point: [-71.06, 42.36]},
      {id: "Providence", point: [-71.41, 41.82]},
      {id: "Hartford", point: [-72.68, 41.76]},
    ])
    .groupBy("id").tiles(false).topojson(region)`,
  "Geomap regions (TileGridMap)": `new lib.TileGridMap()
    .data([{id: "25", v: 1}, {id: "09", v: 2}, {id: "44", v: 3}, {id: "06", v: 4}])
    .groupBy("id")`,
  Tree: `new lib.Tree()
    .data([{p: "P", id: "a"}, {p: "P", id: "b"}, {p: "Q", id: "c"}])
    .groupBy(["p", "id"])`,
  Icicle: `new lib.Icicle()
    .data([
      {group: "A", id: "a1", value: 10}, {group: "A", id: "a2", value: 20},
      {group: "B", id: "b1", value: 15},
    ])
    .groupBy(["group", "id"]).sum("value")`,
  RadialLine: `new lib.RadialLine()
    .data([
      {id: "A", m: "Jan", v: 1}, {id: "A", m: "Feb", v: 2}, {id: "A", m: "Mar", v: 3},
      {id: "B", m: "Jan", v: 3}, {id: "B", m: "Feb", v: 1}, {id: "B", m: "Mar", v: 2},
    ])
    .groupBy("id").x("m").y("v")`,
};

const probe = async ([src, region]) => {
  const seen = new Map();
  const rec = color => (d, i) => {
    if (d && typeof d === "object") {
      if (!seen.has(d)) seen.set(d, new Set());
      seen.get(d).add(i);
    }
    return color;
  };
  const style = () => ({fill: rec("#4c6ef5"), stroke: rec("#222")});
  const shapeConfig = {...style()};
  for (const k of ["Circle", "Rect", "Path", "Line", "Area"])
    shapeConfig[k] = style();
  const viz = new Function("lib", "region", `return ${src};`)(
    window.d3plus,
    region,
  )
    .shapeConfig(shapeConfig)
    .duration(0)
    .width(500)
    .height(400);
  await new Promise(r => viz.select("#viz").render(r));
  const marks = [];
  const walk = n => {
    if (
      ["rect", "circle", "line", "area", "path"].includes(n.type) &&
      n.datum !== undefined &&
      n.interactive !== false &&
      !n.interactionGroup &&
      !String(n.key).endsWith("::hit")
    ) {
      const {d, i} = viz._interactionDatum(
        {node: n, datum: n.datum, index: n.index},
        {type: "click"},
      );
      const got = seen.get(d);
      if (got) marks.push({key: String(n.key), i, accessor: [...got]});
    }
    (n.children || []).forEach(walk);
  };
  walk(viz._paintedScene.root.children.find(n => n.key === "viz-chart-cells"));
  return marks;
};

for (const [name, src] of Object.entries(charts))
  it(`${name}: style accessors get the handler's i`, async () => {
    const marks = await render(
      '<div id="viz" style="width:500px;height:400px"></div>',
      probe,
      [src, region],
    );
    assert.ok(
      marks.length >= 3,
      `painted marks were checked (${marks.length})`,
    );
    for (const m of marks)
      assert.deepStrictEqual(
        m.accessor,
        [m.i],
        `${m.key} (handler i = ${m.i})`,
      );
    if (name === "Pack" || name === "Tree" || name === "Icicle")
      assert.ok(
        marks.some(m => m.i === -1),
        "a group mark reports and is painted with -1",
      );
  });

it("SlopeChart: a line's markers read its stroke with the row and its index", async () => {
  const calls = await render(
    '<div id="viz" style="width:500px;height:400px"></div>',
    async () => {
      const calls = [];
      const data = [
        {id: "A", year: 2015, v: 1},
        {id: "A", year: 2020, v: 3},
        {id: "B", year: 2015, v: 4},
        {id: "B", year: 2020, v: 2},
      ];
      const viz = new window.d3plus.SlopeChart()
        .data(data)
        .groupBy("id")
        .x("year")
        .y("v")
        .shapeConfig({
          Line: {
            stroke: (d, i) => {
              calls.push({wrapped: !!d.__d3plus__, i});
              return "#222";
            },
          },
        })
        .duration(0);
      await new Promise(r => viz.select("#viz").render(r));
      return calls;
    },
  );
  assert.ok(calls.length, "the stroke accessor ran");
  for (const c of calls) {
    assert.strictEqual(c.wrapped, false, "a source row, not a wrapper");
    assert.strictEqual(typeof c.i, "number", "with an index");
  }
});
