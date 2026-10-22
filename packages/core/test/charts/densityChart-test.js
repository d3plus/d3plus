import {it} from "vitest";
import assert from "assert";
import {
  DENSITY,
  densityMeta,
  densityShapeId,
  densityTooltipRows,
  installDensity,
  summarizeBeforePreDraw,
  unwrapRow,
} from "../../src/charts/helpers/densityChart.ts";
import {violinDef} from "../../src/charts/Violin/index.ts";
import {ridgelineDef} from "../../src/charts/Ridgeline/index.ts";

/** The default `value` accessor from a density chart's fields. */
const field = (def, key) => def.fields.find(f => f.key === key);
const valueField = field(violinDef, "value");

/** A minimal viz carrying what the density plumbing reads. */
function fakeViz(data, schema = {}, layout = {}) {
  const accessor = key => d => d[key];
  const viz = {
    _data: data,
    _xConfig: {},
    _yConfig: {},
    _buffer: {Bar: false},
    ctx: {},
    preDraws: 0,
    schema: {
      groupBy: [accessor("id")],
      value: valueField.coerce("v"),
      densityConfig: {points: 9, cut: 0},
      densityScale: "area",
      medianSort: false,
      locale: "en-US",
      translate: s => `t:${s}`,
      ...schema,
    },
  };
  viz._preDraw = () => viz.preDraws++;
  installDensity(viz, {
    valueAxis: () => "y",
    categoryPadding: () => [0.5, 0.5],
    emit: () => [],
    ...layout,
  });
  return viz;
}

const rows = [
  {id: "b", v: 5, other: 1},
  {id: "a", v: 1},
  {id: "b", v: 7},
  {id: "a", v: 3},
  {id: "a", v: 2},
];

it("unwrapRow / densityMeta: walk __d3plus__ wrappers", () => {
  const meta = {summary: {}, order: 0, scale: 1};
  const row = {id: "a", [DENSITY]: meta};
  const wrapped = {__d3plus__: true, data: {__d3plus__: true, data: row}};
  assert.strictEqual(unwrapRow(wrapped), row);
  assert.strictEqual(unwrapRow(row), row);
  assert.strictEqual(densityMeta(wrapped), meta);
  assert.strictEqual(densityMeta({id: "raw"}), undefined);
  assert.strictEqual(densityMeta(undefined), undefined);
});

it("densityShapeId: prefixes the row id", () => {
  assert.strictEqual(densityShapeId({id: "setosa"}), "density-setosa");
});

it("summarizeBeforePreDraw: one summary row per group", () => {
  const viz = fakeViz(rows.slice());
  summarizeBeforePreDraw(viz);
  assert.strictEqual(viz._data.length, 2);
  const [b, a] = viz._data;
  assert.strictEqual(b.id, "b");
  assert.strictEqual(b.x, "b", "category on the category axis");
  assert.strictEqual(b.y, 6, "median on the value axis");
  assert.strictEqual(b.other, 1, "keeps the first row's fields");
  assert.ok(!("v" in b), "drops the raw value");
  assert.strictEqual(a.y, 2);
  assert.strictEqual(densityMeta(a).summary.n, 3);
  assert.strictEqual(densityMeta(a).order, 1);
  assert.strictEqual(
    densityMeta(a).summary.curve.length,
    9,
    "densityConfig reaches the curve",
  );
  assert.strictEqual(
    viz._yConfig.title,
    "v",
    "value axis titled after the value key",
  );
});

it("summarizeBeforePreDraw: re-summarizes the raw rows on every draw", () => {
  const viz = fakeViz(rows.slice());
  summarizeBeforePreDraw(viz);
  const first = viz._data;
  summarizeBeforePreDraw(viz);
  assert.notStrictEqual(viz._data, first);
  assert.strictEqual(
    viz._data.length,
    2,
    "summary rows aren't summarized again",
  );
  viz._data = [{id: "z", v: 1}];
  summarizeBeforePreDraw(viz);
  assert.deepStrictEqual(
    viz._data.map(d => d.id),
    ["z"],
    "new data replaces the raw rows",
  );
});

it("summarizeBeforePreDraw: ungrouped rows become one category named after the value", () => {
  const viz = fakeViz([{v: 1}, {v: 2}, {v: 4}]);
  summarizeBeforePreDraw(viz);
  assert.strictEqual(viz._data.length, 1);
  assert.strictEqual(viz._data[0].id, "v");
  assert.strictEqual(viz._data[0].x, "v");
  const fn = fakeViz([{w: 1}, {w: 2}], {value: valueField.coerce(d => d.w)});
  summarizeBeforePreDraw(fn);
  assert.strictEqual(
    fn._data[0].x,
    "t:Value",
    "a function accessor falls back to a translated label",
  );
  assert.strictEqual(fn._yConfig.title, undefined);
});

it("summarizeBeforePreDraw: the first groupBy level is the category", () => {
  const viz = fakeViz(
    [
      {day: 1, sex: "F", v: 1},
      {day: 1, sex: "M", v: 2},
      {day: 2, sex: "F", v: 3},
    ],
    {groupBy: [d => d.day, d => d.sex]},
  );
  summarizeBeforePreDraw(viz);
  assert.deepStrictEqual(
    viz._data.map(d => d.x),
    ["1", "1", "2"],
    "categories are strings",
  );
});

it("summarizeBeforePreDraw: groups by facet and time too", () => {
  const data = [
    {id: "a", f: 1, v: 1},
    {id: "a", f: 2, v: 2},
    {id: "a", f: 1, v: 3},
  ];
  const viz = fakeViz(data, {facet: d => d.f});
  summarizeBeforePreDraw(viz);
  assert.strictEqual(viz._data.length, 2);
  assert.deepStrictEqual(
    viz._data.map(d => d.f),
    [1, 2],
  );
  const timed = fakeViz(data, {time: d => d.f});
  summarizeBeforePreDraw(timed);
  assert.strictEqual(timed._data.length, 2);
});

it("summarizeBeforePreDraw: medianSort orders the rows and categories", () => {
  const viz = fakeViz(rows.slice(), {medianSort: "ascending"});
  summarizeBeforePreDraw(viz);
  assert.deepStrictEqual(
    viz._data.map(d => d.id),
    ["a", "b"],
  );
  assert.deepStrictEqual(
    viz._data.map(d => densityMeta(d).order),
    [0, 1],
  );
});

it("summarizeBeforePreDraw: densityScale sets each row's width factor", () => {
  const data = [
    {id: "a", v: 1},
    {id: "a", v: 2},
    {id: "b", v: 10},
    {id: "b", v: 30},
  ];
  const area = fakeViz(data);
  summarizeBeforePreDraw(area);
  const [a, b] = area._data.map(densityMeta);
  assert.strictEqual(a.scale, b.scale, "area: one shared factor");
  const width = fakeViz(data, {densityScale: "width"});
  summarizeBeforePreDraw(width);
  width._data
    .map(densityMeta)
    .forEach(m => assert.ok(Math.abs(m.scale * m.summary.peak - 1) < 1e-12));
});

it("summarizeBeforePreDraw: moves the automatic title with the value axis", () => {
  let axis = "y";
  const viz = fakeViz(rows.slice(), {}, {valueAxis: () => axis});
  summarizeBeforePreDraw(viz);
  assert.strictEqual(viz._yConfig.title, "v");
  axis = "x";
  summarizeBeforePreDraw(viz);
  assert.strictEqual(viz._yConfig.title, undefined, "old axis cleared");
  assert.strictEqual(viz._xConfig.title, "v");
  assert.strictEqual(viz._data[0].y, "b", "category moved to y");
  viz._xConfig.title = "Mine";
  summarizeBeforePreDraw(viz);
  assert.strictEqual(viz._xConfig.title, "Mine", "a user title is kept");
});

it("installDensity: wires the pre-draw, category sort, buffer, and emitter", () => {
  const emit = () => [];
  const viz = fakeViz(rows.slice(), {}, {emit});
  assert.strictEqual(viz._plotShapeEmitters.Area, emit);
  assert.strictEqual(typeof viz._buffer.Area, "function");
  assert.strictEqual(viz._buffer.Bar, false, "other buffers kept");
  viz._preDraw();
  assert.strictEqual(viz.preDraws, 1, "runs the original pre-draw");
  assert.strictEqual(viz._data.length, 2);
  const sort = viz.schema.xSort;
  assert.strictEqual(typeof sort, "function", "sorts the category axis");
  assert.strictEqual(viz.schema.ySort, undefined);
  const [b, a] = viz._data;
  assert.ok(sort(b, a) < 0, "data order");
  assert.ok(
    sort({__d3plus__: true, data: a}, {__d3plus__: true, data: b}) > 0,
    "unwraps rows",
  );
  const mine = () => 0;
  viz.schema.xSort = mine;
  viz._preDraw();
  assert.strictEqual(viz.schema.xSort, mine, "a user sort is kept");
});

it("installDensity: a reversed layout sorts categories backwards", () => {
  const viz = fakeViz(rows.slice(), {}, {valueAxis: () => "x", reverse: true});
  viz._preDraw();
  const sort = viz.schema.ySort;
  assert.strictEqual(viz.schema.xSort, undefined);
  const [b, a] = viz._data;
  assert.ok(sort(b, a) > 0);
});

it("installDensity: the Area buffer covers every curve and pads the category axis", () => {
  const viz = fakeViz(rows.slice());
  viz._preDraw();
  const scale = domain => {
    let d = domain,
      padding = 0,
      align = 0.5;
    return {
      domain: v => (v === undefined ? d : (d = v)),
      padding: v => (v === undefined ? padding : (padding = v)),
      align: v => (v === undefined ? align : (align = v)),
    };
  };
  const x = scale(["b", "a"]);
  const y = scale([6, 2]); // y domains run top-down
  const data = viz._data.map(d => ({__d3plus__: true, data: d}));
  viz._buffer.Area.call(viz, {data, x, y});
  assert.deepStrictEqual(
    y.domain(),
    [7, 1],
    "value axis spans the curves (cut 0)",
  );
  assert.strictEqual(x.padding(), 0.5);
  assert.strictEqual(x.align(), 0.5);
  const untouched = scale([0, 1]);
  viz._buffer.Area.call(viz, {data, x: untouched, y: untouched, x2: true});
  assert.deepStrictEqual(
    untouched.domain(),
    [0, 1],
    "secondary axes untouched",
  );
});

it("densityTooltipRows: a distribution, or a raw observation's value", () => {
  const viz = fakeViz(rows.slice());
  summarizeBeforePreDraw(viz);
  const table = densityTooltipRows(
    viz,
    {__d3plus__: true, data: viz._data[1]},
    0,
  );
  assert.deepStrictEqual(table, [
    ["t:Observations", "3"],
    ["t:Maximum", "3"],
    ["t:Upper Quartile", "2.5"],
    ["t:Median", "2"],
    ["t:Lower Quartile", "1.5"],
    ["t:Minimum", "1"],
  ]);
  assert.deepStrictEqual(densityTooltipRows(viz, {id: "a", v: 4}, 0), [
    ["v", "4"],
  ]);
  assert.deepStrictEqual(
    densityTooltipRows(viz, {id: "a"}, 0),
    [],
    "no value, no rows",
  );
});

it("densityFields: ctx and fields close both defs, accessors before config bags", () => {
  for (const def of [violinDef, ridgelineDef]) {
    const keys = Object.keys(def);
    assert.deepStrictEqual(keys.slice(-2), ["ctx", "fields"], def.name);
    const bags = def.fields.map(f => Boolean(f.merge));
    const firstBag = bags.indexOf(true);
    assert.ok(
      bags.slice(firstBag).every(Boolean),
      `${def.name}: config bags last`,
    );
  }
  assert.strictEqual(field(violinDef, "densityConfig").default.cut, 2);
  assert.strictEqual(field(ridgelineDef, "densityConfig").default.cut, 3);
});
