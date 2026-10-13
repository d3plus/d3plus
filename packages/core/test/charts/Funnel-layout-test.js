import assert from "assert";
import {
  applyFunnelLayout,
  funnelCurve,
  funnelOrder,
  funnelOrient,
  sharedScaleMax,
  stageRates,
  STROKE_BUFFER,
} from "../../es/src/charts/Funnel/applyLayout.js";
import {
  neckConfig,
  neckPaint,
  stageAria,
} from "../../es/src/charts/Funnel/emit.js";
import {
  funnelFacetHooks,
  funnelFacetPanel,
  shareFunnelScale,
} from "../../es/src/charts/Funnel/funnelFacet.js";
import {
  funnelDef,
  funnelTooltipRows,
} from "../../es/src/charts/Funnel/index.js";

const field = k => funnelDef.fields.find(f => f.key === k);

function mockViz(schema = {}, data) {
  return {
    schema: {
      width: 420,
      height: 320,
      value: d => d.value,
      orient: "vertical",
      curve: "linear",
      stagePadding: 0.25,
      taper: false,
      locale: "en-US",
      translate: s => s,
      valueFormat: v => `${v}`,
      connectorConfig: {opacity: 0.35},
      ...schema,
    },
    _margin: {top: 10, bottom: 10, left: 10, right: 10},
    _filteredData: data ?? [
      {id: "Visit", value: 400},
      {id: "Trial", value: 200},
      {id: "Paid", value: 50},
    ],
    _drawLabel: d => d.id,
    ctx: {},
  };
}

it("Funnel layout: funnelOrient and funnelCurve fall back to the defaults", () => {
  assert.strictEqual(funnelOrient(mockViz()), "vertical");
  assert.strictEqual(
    funnelOrient(mockViz({orient: "horizontal"})),
    "horizontal",
  );
  assert.strictEqual(funnelOrient(mockViz({orient: "sideways"})), "vertical");
  assert.strictEqual(funnelCurve(mockViz()), "linear");
  assert.strictEqual(funnelCurve(mockViz({curve: "smooth"})), "smooth");
  assert.strictEqual(funnelCurve(mockViz({curve: "wavy"})), "linear");
});

it("Funnel layout: a vertical funnel stacks stages down the chart area", () => {
  const viz = mockViz();
  const {shapeData} = applyFunnelLayout({viz});
  assert.strictEqual(shapeData.length, 3);
  const [a, b, c] = shapeData;
  // Chart area 400 × 300; 296 long and 396 across after the stroke buffer.
  assert.strictEqual(a.start, STROKE_BUFFER);
  assert.ok(Math.abs(c.end - (300 - STROKE_BUFFER)) < 1e-9, "fills the height");
  assert.ok(b.start > a.end, "a gap between stages");
  assert.deepStrictEqual([a.max, b.max, c.max], [396, 198, 49.5]);
  assert.strictEqual(a.min, a.max, "flat bars without taper");
  assert.deepStrictEqual(a.neck, [], "no neck into the first stage");
  assert.deepStrictEqual(b.neck[0], [a.end, 396]);
  assert.deepStrictEqual(b.neck[b.neck.length - 1], [b.start, 198]);
  assert.deepStrictEqual(viz.ctx.funnel, {
    orient: "vertical",
    curve: "linear",
    center: 200,
    breadth: 396,
    offset: STROKE_BUFFER,
  });
});

it("Funnel layout: stages carry their rows, values, and conversion rates", () => {
  const viz = mockViz();
  const {shapeData} = applyFunnelLayout({viz});
  assert.ok(shapeData.every(s => s.__d3plus__));
  assert.deepStrictEqual(
    shapeData.map(s => s.data.id),
    ["Visit", "Trial", "Paid"],
  );
  assert.deepStrictEqual(
    shapeData.map(s => s.i),
    [0, 1, 2],
  );
  assert.deepStrictEqual(
    shapeData.map(s => s.first),
    [1, 0.5, 0.125],
  );
  assert.ok(Number.isNaN(shapeData[0].previous));
  assert.strictEqual(shapeData[2].previous, 0.25);
  const rows = viz._filteredData;
  assert.deepStrictEqual(rows[1], {id: "Trial", value: 200}, "user rows are left untouched");
  assert.strictEqual(stageRates(viz).get(rows[1]).first, 0.5, "kept for the tooltip");
  assert.strictEqual(stageRates(viz).get(rows[2]).previous, 0.25);
});

it("Funnel layout: a horizontal funnel runs across the width", () => {
  const viz = mockViz({orient: "horizontal"});
  const {shapeData} = applyFunnelLayout({viz});
  assert.ok(Math.abs(shapeData[2].end - (400 - STROKE_BUFFER)) < 1e-9);
  assert.strictEqual(shapeData[0].max, 296, "widths run along the height");
  assert.strictEqual(viz.ctx.funnel.center, 150);
});

it("Funnel layout: taper narrows each stage toward the next one", () => {
  const viz = mockViz({taper: true});
  const {shapeData} = applyFunnelLayout({viz});
  const [a, , c] = shapeData;
  assert.strictEqual(a.max, 396);
  assert.ok(a.min < a.max && a.min > 198, "ends partway to the next width");
  assert.strictEqual(c.min, c.max, "the last stage keeps its own width");
});

it("Funnel layout: no rows lays out nothing", () => {
  const viz = mockViz({}, []);
  assert.deepStrictEqual(applyFunnelLayout({viz}).shapeData, []);
});

it("Funnel layout: funnelTooltipRows shows the value, then both rates after the first stage", () => {
  const viz = mockViz();
  applyFunnelLayout({viz});
  const [first, second] = viz._filteredData;
  assert.deepStrictEqual(funnelTooltipRows(viz, first, 0), [["Value", "400"]]);
  assert.deepStrictEqual(funnelTooltipRows(viz, second, 1), [
    ["Value", "200"],
    ["% of First Stage", "50%"],
    ["% of Previous Stage", "50%"],
  ]);
  assert.deepStrictEqual(
    funnelTooltipRows(viz, {id: "Legend", value: NaN}, 0),
    [],
    "rows without a value or rates add nothing",
  );
});

it("Funnel layout: neckPaint defaults to the stage fill and honors connectorConfig", () => {
  const s = {data: {id: "Trial"}, i: 1};
  assert.deepStrictEqual(neckPaint(mockViz(), s, "#123456"), {
    fill: "#123456",
    opacity: 0.35,
    stroke: undefined,
    strokeWidth: undefined,
  });
  const viz = mockViz({
    connectorConfig: {
      fill: d => `fill-${d.id}`,
      opacity: 1,
      stroke: "#000",
      strokeWidth: 2,
    },
  });
  assert.deepStrictEqual(neckPaint(viz, s, "#123456"), {
    fill: "fill-Trial",
    opacity: 1,
    stroke: "#000",
    strokeWidth: 2,
  });
});

it("Funnel layout: a neck inherits its stage's texture unless connectorConfig overrides it", () => {
  const s = {data: {id: "Trial"}, i: 1};
  const sc = {texture: "lines", backgroundImage: "stage.png", stroke: "#000"};
  const textured = neckPaint(mockViz(), s, "#123456", sc);
  assert.ok(textured.fill.startsWith("pattern:"), "the stage's texture");
  assert.strictEqual(textured.opacity, 0.35);
  const off = mockViz({connectorConfig: {opacity: 0.35, texture: false}});
  assert.strictEqual(neckPaint(off, s, "#123456", sc).fill, "#123456");
  const own = mockViz({connectorConfig: {texture: d => (d.id === "Trial" ? "circles" : false)}});
  assert.ok(neckPaint(own, s, "#123456", {}).fill.includes("circles"), "connectorConfig.texture");
  assert.strictEqual(neckPaint(mockViz(), s, "#123456").fill, "#123456", "no shape config");
});

it("Funnel layout: neckConfig lays connectorConfig over the stage's shape config", () => {
  const sc = {texture: "lines", backgroundImage: "stage.png", backgroundImageFit: "contain"};
  assert.deepStrictEqual(neckConfig(mockViz(), sc), {...sc, opacity: 0.35});
  const viz = mockViz({connectorConfig: {opacity: 0.5, backgroundImage: false}});
  assert.deepStrictEqual(neckConfig(viz, sc), {
    texture: "lines",
    backgroundImage: false,
    backgroundImageFit: "contain",
    opacity: 0.5,
  });
  assert.deepStrictEqual(neckConfig(mockViz({connectorConfig: undefined})), {});
});

it("Funnel layout: stageAria names the stage's rank, name, and value", () => {
  const viz = mockViz();
  assert.strictEqual(
    stageAria(viz, {data: {id: "Trial"}, i: 1, value: 200}),
    "2. Trial, 200.",
  );
  assert.strictEqual(
    stageAria(viz, {data: {id: "Trial"}, i: 1, value: NaN}),
    "2. Trial.",
  );
});

it("Funnel definition: ctx and fields come last, with config bags at the end", () => {
  const keys = Object.keys(funnelDef);
  assert.deepStrictEqual(keys.slice(-2), ["ctx", "fields"]);
  const fieldKeys = funnelDef.fields.map(f => f.key);
  assert.deepStrictEqual(fieldKeys.slice(-2), [
    "connectorConfig",
    "tooltipConfig",
  ]);
  assert.strictEqual(field("connector").default, true);
  assert.strictEqual(field("conversion").default, false);
  assert.strictEqual(field("curve").default, "linear");
  assert.strictEqual(field("orient").default, "vertical");
  assert.strictEqual(field("stagePadding").default, 0.3);
  assert.strictEqual(field("taper").default, false);
  assert.strictEqual(field("zoom").default, false);
});

it("Funnel definition: value accepts a key, an accessor, or a constant", () => {
  const coerce = field("value").coerce;
  assert.strictEqual(coerce("count")({count: 7}), 7);
  const fn = d => d.n;
  assert.strictEqual(coerce(fn), fn);
  assert.strictEqual(coerce(5)({}), 5);
});

it("Funnel layout: funnelOrder keeps data order unless sort is a comparator", () => {
  const rows = [{id: "B", value: 2}, {id: "A", value: 9}, {id: "C", value: 2}];
  assert.strictEqual(funnelOrder(mockViz(), rows), rows, "no sort: data order");
  assert.strictEqual(funnelOrder(mockViz({sort: "value"}), rows), rows);
  const sorted = funnelOrder(mockViz({sort: (a, b) => b.value - a.value}), rows);
  assert.deepStrictEqual(sorted.map(d => d.id), ["A", "B", "C"], "ties keep data order");
  assert.deepStrictEqual(rows.map(d => d.id), ["B", "A", "C"], "the user's array is untouched");
});

it("Funnel layout: sort orders the stages, and conversion rates follow it", () => {
  const data = [
    {id: "Paid", value: 50},
    {id: "Visit", value: 400},
    {id: "Trial", value: 200},
  ];
  const viz = mockViz({sort: (a, b) => b.value - a.value}, data);
  const {shapeData} = applyFunnelLayout({viz});
  assert.deepStrictEqual(shapeData.map(s => s.data.id), ["Visit", "Trial", "Paid"]);
  assert.deepStrictEqual(shapeData.map(s => s.i), [0, 1, 2], "i is the drawn rank");
  assert.ok(shapeData[0].start < shapeData[1].start && shapeData[1].start < shapeData[2].start);
  assert.ok(Number.isNaN(shapeData[0].previous), "the first drawn stage has no previous");
  assert.strictEqual(shapeData[1].previous, 0.5);
  assert.strictEqual(shapeData[2].previous, 0.25);
  assert.strictEqual(shapeData[2].first, 0.125);
  const rates = stageRates(viz);
  assert.deepStrictEqual(rates.get(data[0]), {first: 0.125, previous: 0.25});
  assert.ok(Number.isNaN(rates.get(data[1]).previous));
  assert.deepStrictEqual(Object.keys(data[0]), ["id", "value"], "rows are untouched");
});

it("Funnel layout: a shared scale max narrows every stage", () => {
  const own = applyFunnelLayout({viz: mockViz()}).shapeData;
  const viz = mockViz();
  viz.ctx.funnelScaleMax = 800;
  assert.strictEqual(sharedScaleMax(viz), 800);
  const shared = applyFunnelLayout({viz}).shapeData;
  // The largest stage (400) draws at half the breadth against a max of 800.
  own.forEach((s, i) => assert.ok(Math.abs(shared[i].max - s.max / 2) < 1e-9));
  assert.strictEqual(sharedScaleMax(mockViz()), 0, "no shared scale by default");
});

it("Funnel facet: panels size independently unless facetConfig shares scales", () => {
  assert.strictEqual(funnelFacetHooks.scales, "independent");
  assert.strictEqual(funnelFacetHooks.share, shareFunnelScale);
  assert.strictEqual(funnelFacetHooks.panel, funnelFacetPanel);
  assert.ok(field("sort"), "sort is a Funnel option");
  assert.strictEqual(field("sort").default, undefined, "data order by default");
});

it("Funnel facet: shareFunnelScale finds the largest stage across panels", () => {
  const viz = mockViz();
  const scale = shareFunnelScale(viz, [
    [{value: 400}, {value: 120}],
    [],
    [{value: 900}, {value: -2000}, {value: "n/a"}],
  ]);
  assert.deepStrictEqual(scale, {max: 900});
  assert.deepStrictEqual(shareFunnelScale(viz, []), {max: 0});
});

it("Funnel facet: funnelFacetPanel applies the shared scale and undoes it", () => {
  const viz = mockViz();
  const undo = funnelFacetPanel(viz, {shared: true, scales: {max: 900}});
  assert.strictEqual(viz.ctx.funnelScaleMax, 900);
  undo();
  assert.strictEqual(viz.ctx.funnelScaleMax, undefined);
  viz.ctx.funnelScaleMax = 5;
  const undoIndependent = funnelFacetPanel(viz, {shared: false, scales: undefined});
  assert.strictEqual(viz.ctx.funnelScaleMax, undefined, "independent panels use their own scale");
  undoIndependent();
  assert.strictEqual(viz.ctx.funnelScaleMax, 5);
});
