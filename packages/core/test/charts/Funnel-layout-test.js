import assert from "assert";
import {
  applyFunnelLayout,
  FIRST_KEY,
  funnelCurve,
  funnelOrient,
  PREVIOUS_KEY,
  STROKE_BUFFER,
} from "../../es/src/charts/Funnel/applyLayout.js";
import {neckPaint, stageAria} from "../../es/src/charts/Funnel/emit.js";
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
  assert.strictEqual(rows[1][FIRST_KEY], 0.5, "stamped for the tooltip");
  assert.strictEqual(rows[2][PREVIOUS_KEY], 0.25);
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
