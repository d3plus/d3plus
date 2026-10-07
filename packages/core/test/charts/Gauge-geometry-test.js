import assert from "assert";
import {
  arcExtent,
  defaultTickCount,
  gaugeAngle,
  gaugeDomain,
  fitDial,
  gaugeTicks,
  needlePath,
  resolveBands,
  toDegrees,
  toRadians,
  unionBox,
} from "../../es/src/charts/Gauge/gaugeGeometry.js";
import {
  dialBox,
  dialLayout,
  dialRings,
} from "../../es/src/charts/Gauge/dialLayout.js";
import {
  applyGaugeLayout,
  hasName,
} from "../../es/src/charts/Gauge/applyLayout.js";
import {gaugeDef} from "../../es/src/charts/Gauge/index.js";

const close = (a, b, msg, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} ≈ ${b}`);
const sweep240 = [toRadians(-120), toRadians(120)];

it("Gauge geometry: toRadians / toDegrees round-trip", () => {
  close(toRadians(180), Math.PI, "180°");
  close(toDegrees(Math.PI / 2), 90, "π/2");
  close(toDegrees(toRadians(-120)), -120, "round trip");
});

it("Gauge geometry: gaugeAngle maps the domain onto the sweep and clamps outside it", () => {
  const [s, e] = sweep240;
  close(gaugeAngle(0, [0, 100], s, e), s, "min → start");
  close(gaugeAngle(100, [0, 100], s, e), e, "max → end");
  close(gaugeAngle(50, [0, 100], s, e), 0, "midpoint → 12 o'clock");
  close(toDegrees(gaugeAngle(72, [0, 100], s, e)), 52.8, "72 → 52.8°");
  close(gaugeAngle(150, [0, 100], s, e), e, "above max clamps to end");
  close(gaugeAngle(-20, [0, 100], s, e), s, "below min clamps to start");
  close(gaugeAngle(NaN, [0, 100], s, e), s, "NaN → start");
  close(
    gaugeAngle(25, [0, 100], e, s),
    toRadians(60),
    "reversed sweep runs counter-clockwise",
  );
});

it("Gauge geometry: gaugeDomain includes zero and band edges, nices auto ends, and keeps user ends", () => {
  assert.deepStrictEqual(gaugeDomain([72], [], [0, 100]), [0, 100]);
  assert.deepStrictEqual(gaugeDomain([73]), [0, 80], "auto max is niced");
  assert.deepStrictEqual(
    gaugeDomain([3.4], [], undefined, 4),
    [0, 4],
    "nice to the tick count",
  );
  assert.deepStrictEqual(
    gaugeDomain([-12, 30]),
    [-15, 30],
    "negative values extend the minimum",
  );
  assert.deepStrictEqual(
    gaugeDomain([50], [{max: 100, color: "red"}]),
    [0, 100],
    "band edges count",
  );
  assert.deepStrictEqual(
    gaugeDomain([150], [], [0, undefined]),
    [0, 160],
    "only the unset end is auto",
  );
  assert.deepStrictEqual(
    gaugeDomain([5], [], [null, 10]),
    [0, 10],
    "null leaves an end to the data",
  );
  assert.deepStrictEqual(
    gaugeDomain([], [], [5, 5]),
    [5, 6],
    "an empty span widens",
  );
  assert.deepStrictEqual(
    gaugeDomain([NaN]),
    [0, 1],
    "non-finite values are ignored",
  );
});

it("Gauge geometry: defaultTickCount gives about one tick per 45°", () => {
  assert.strictEqual(defaultTickCount(...sweep240), 5);
  assert.strictEqual(defaultTickCount(toRadians(-90), toRadians(90)), 4);
  assert.strictEqual(defaultTickCount(0, toRadians(30)), 2, "at least two");
});

it("Gauge geometry: gaugeTicks labels both ends and drops a crowded interior tick", () => {
  const t = gaugeTicks([0, 100], undefined, true, 5);
  assert.deepStrictEqual(t.major, [0, 20, 40, 60, 80, 100]);
  assert.strictEqual(
    t.minor.length,
    15,
    "minor ticks every 5, excluding majors and ends",
  );
  assert.ok(
    t.minor.every(m => m % 5 === 0 && m % 20 !== 0 && m > 0 && m < 100),
  );

  assert.deepStrictEqual(
    gaugeTicks([0, 75], 5, false, 5).major,
    [0, 20, 40, 60, 75],
    "uneven max kept",
  );
  assert.deepStrictEqual(
    gaugeTicks([0, 75], 5, false, 5).minor,
    [],
    "minor ticks off",
  );
  assert.deepStrictEqual(
    gaugeTicks([0, 88], 5, false, 5).major,
    [0, 20, 40, 60, 88],
    "80 crowds 88",
  );
  assert.deepStrictEqual(
    gaugeTicks([0, 100], [50, 0, 150, 25, NaN], false, 5).major,
    [0, 25, 50],
    "explicit ticks are filtered to the domain and sorted",
  );
  assert.deepStrictEqual(
    gaugeTicks([0, 100], false, true, 5),
    {major: [], minor: []},
    "false hides all",
  );
});

it("Gauge geometry: resolveBands chains, clamps, defaults colors, and drops empty bands", () => {
  assert.deepStrictEqual(
    resolveBands(
      [{max: 60, color: "g"}, {max: 85, color: "y"}, {color: "r"}],
      [0, 100],
      "x",
    ),
    [
      {min: 0, max: 60, color: "g"},
      {min: 60, max: 85, color: "y"},
      {min: 85, max: 100, color: "r"},
    ],
  );
  assert.deepStrictEqual(
    resolveBands(
      [
        {min: -10, max: 20, color: "a"},
        {min: 150, color: "b"},
        {max: 10, color: "c"},
        null,
        {min: 30, max: 50},
      ],
      [0, 100],
      "x",
    ),
    [
      {min: 0, max: 20, color: "a"},
      {min: 30, max: 50, color: "x"},
    ],
  );
  assert.deepStrictEqual(resolveBands(undefined, [0, 1], "x"), []);
});

it("Gauge geometry: arcExtent bounds the sweep and its center", () => {
  const e240 = arcExtent(...sweep240);
  close(e240.x0, -1, "240° x0");
  close(e240.x1, 1, "240° x1");
  close(e240.y0, -1, "240° y0");
  close(e240.y1, 0.5, "240° y1");
  const e180 = arcExtent(toRadians(-90), toRadians(90));
  close(e180.y1, 0, "180° stops at the center line");
  const full = arcExtent(0, Math.PI * 2);
  assert.deepStrictEqual(
    [full.x0, full.x1, full.y0, full.y1].map(Math.round),
    [-1, 1, -1, 1],
  );
  const quarter = arcExtent(0, Math.PI / 2);
  close(quarter.x0, 0, "quarter includes its center");
  close(quarter.y1, 0, "quarter y1");
});

it("Gauge geometry: unionBox spans both boxes", () => {
  assert.deepStrictEqual(
    unionBox({x0: -1, x1: 1, y0: -1, y1: 0}, {x0: -0.5, x1: 2, y0: 0, y1: 0.4}),
    {x0: -1, x1: 2, y0: -1, y1: 0.4},
  );
});

it("Gauge geometry: fitDial centers the largest dial that fits", () => {
  const box = {x0: -1, x1: 1, y0: -1, y1: 0.5};
  const fit = fitDial(400, 300, box);
  close(fit.radius, 200, "fills the area");
  close(fit.cx, 200, "centered horizontally");
  close(fit.cy - fit.radius, 0, "top of the dial at the top");
  close(fit.cy + fit.radius * 0.5, 300, "bottom of the box at the bottom");

  const tall = fitDial(200, 600, box);
  close(tall.radius, 100, "width-bound");
  close(tall.cy, 300 + 25, "footprint centered vertically");
  assert.strictEqual(fitDial(0, 300, box).radius, 0, "no room, no dial");
});

it("Gauge geometry: needlePath draws a closed, tapered needle pointing up", () => {
  const d = needlePath(90, 3, 12);
  assert.ok(d.startsWith("M-3,0"), d);
  assert.ok(d.includes(",-90"), "tip at -length");
  assert.ok(d.includes(",12"), "tail behind the hub");
  assert.ok(d.endsWith("Z"));
});

const extent = arcExtent(...sweep240);

it("Gauge dialLayout: puts bands on the track and the value under the hub for a needle", () => {
  const l = dialLayout(100, {
    indicator: "needle",
    thickness: 0.2,
    hasBands: true,
    hasName: true,
    rows: 1,
    hasValue: true,
    extent,
  });
  assert.deepStrictEqual(
    [l.outer, l.inner, l.bandOuter, l.bandInner],
    [100, 80, 100, 80],
  );
  close(l.tickOuter, 77, "ticks start just inside the track");
  close(l.majorLength, 7, "major tick length");
  close(l.minorLength, 3.5, "minor tick length");
  close(l.tickFontSize, 8, "tick font clamps to its minimum");
  close(l.tickLabelRadius, 60.6, "tick labels inside the ticks");
  close(l.needleLength, 90, "needle reaches mid-track");
  close(l.valueY, 21.5, "value below the hub");
  close(l.nameY, 39, "name below the value");
});

it("Gauge dialLayout: puts bands in a strip inside a progress track and centers the labels", () => {
  const l = dialLayout(100, {
    indicator: "progress",
    thickness: 0.2,
    hasBands: true,
    hasName: true,
    rows: 1,
    hasValue: true,
    extent,
  });
  close(l.bandOuter, 77.5, "strip just inside the track");
  close(l.bandInner, 74, "strip thickness");
  close(l.tickOuter, 71, "ticks inside the strip");
  close(l.valueFontSize, 30, "larger value for progress");
  close(l.valueY, -6, "label block centered on the dial");

  const semi = arcExtent(toRadians(-90), toRadians(90));
  const s = dialLayout(100, {
    indicator: "progress",
    thickness: 0.2,
    hasBands: false,
    hasName: true,
    rows: 1,
    hasValue: true,
    extent: semi,
  });
  assert.ok(
    s.nameY + s.nameFontSize / 2 < 0,
    "labels stay above the center line of a semicircle",
  );
  close(s.tickOuter, 77, "no strip without bands");
});

it("Gauge dialLayout: honors a fixed tick font size and clamps the thickness", () => {
  const l = dialLayout(200, {
    indicator: "needle",
    thickness: 5,
    hasBands: false,
    hasName: false,
    rows: 1,
    hasValue: true,
    extent,
    tickFontSize: 13,
  });
  assert.strictEqual(l.tickFontSize, 13);
  assert.strictEqual(l.inner, 0, "thickness is capped at the full radius");
  assert.strictEqual(l.nameFontSize, 0, "no name, no name space");
});

it("Gauge dialLayout: dialRings gives one track per progress row, stepping inward", () => {
  assert.deepStrictEqual(
    dialRings(100, 0.2, 3, false),
    [{inner: 80, outer: 100}],
    "a needle dial has one track",
  );
  assert.deepStrictEqual(dialRings(100, 0.2, 1, true), [
    {inner: 80, outer: 100},
  ]);
  const two = dialRings(100, 0.2, 2, true);
  assert.deepStrictEqual(
    two,
    [
      {inner: 80, outer: 100},
      {inner: 58, outer: 78},
    ],
    "2px gap between tracks",
  );
  const many = dialRings(100, 0.2, 5, true);
  assert.strictEqual(many.length, 5);
  close(
    many[0].outer - many[4].inner,
    50,
    "many tracks thin out to span half the radius",
  );
  assert.ok(
    many.every((r, i) => !i || r.outer < many[i - 1].inner),
    "tracks don't overlap",
  );
});

it("Gauge dialLayout: several rows drop the value and name labels", () => {
  const l = dialLayout(100, {
    indicator: "progress",
    thickness: 0.2,
    hasBands: true,
    hasName: true,
    rows: 3,
    hasValue: false,
    extent,
  });
  assert.strictEqual(l.rings.length, 3);
  assert.strictEqual(
    l.inner,
    l.rings[2].inner,
    "inner edge of the innermost track",
  );
  close(l.bandOuter, l.inner - 2.5, "bands inside the innermost track");
  assert.strictEqual(l.valueFontSize, 0);
  assert.strictEqual(l.nameFontSize, 0, "no value, no name");
  const box = dialBox({
    indicator: "needle",
    thickness: 0.2,
    hasBands: false,
    hasName: false,
    rows: 2,
    hasValue: false,
    extent,
  });
  close(box.y1, 0.5, "only the sweep and the needle tail");
  const semi = dialBox({
    indicator: "needle",
    thickness: 0.2,
    hasBands: false,
    hasName: false,
    rows: 2,
    hasValue: false,
    extent: arcExtent(toRadians(-90), toRadians(90)),
  });
  close(semi.y1, 0.12, "a semicircle only needs room for the tails");
});

it("Gauge dialLayout: dialBox covers the sweep, the needle tail, and the labels", () => {
  const needle = dialBox({
    indicator: "needle",
    thickness: 0.2,
    hasBands: false,
    hasName: true,
    rows: 1,
    hasValue: true,
    extent,
  });
  close(needle.y0, -1, "top of the dial");
  close(needle.y1, 0.5, "the 240° sweep already covers the labels");
  const semi = arcExtent(toRadians(-90), toRadians(90));
  const below = dialBox({
    indicator: "needle",
    thickness: 0.2,
    hasBands: false,
    hasName: true,
    rows: 1,
    hasValue: true,
    extent: semi,
  });
  close(below.y1, 0.435, "labels hang below a semicircle");
  const progress = dialBox({
    indicator: "progress",
    thickness: 0.2,
    hasBands: false,
    hasName: false,
    rows: 1,
    hasValue: true,
    extent: semi,
  });
  close(progress.y1, 0, "a progress semicircle needs nothing below its center");
});

const field = key => gaugeDef.fields.find(f => f.key === key);
const mockViz = (data, schema = {}) => ({
  _filteredData: data,
  _margin: {top: 0, right: 0, bottom: 0, left: 0},
  ctx: {},
  schema: {
    width: 424,
    height: 324,
    value: d => d.value,
    groupBy: [d => d.id],
    colorDefaults: {missing: "#ccc"},
    bands: field("bands").default,
    startAngle: field("startAngle").default,
    endAngle: field("endAngle").default,
    thickness: field("thickness").default,
    indicator: field("indicator").default,
    minorTicks: field("minorTicks").default,
    ...schema,
  },
});

it("applyGaugeLayout: reads every row on one shared, centered dial", () => {
  const data = [
    {id: "a", value: 50},
    {id: "b", value: 150},
    {id: "c", value: -10},
    {id: "d", value: 25},
  ];
  const viz = mockViz(data, {
    domain: [0, 100],
    bands: [{max: 70, color: "orange"}, {color: "red"}],
  });
  const {shapeData} = applyGaugeLayout({viz});
  assert.strictEqual(shapeData.length, 4);
  assert.deepStrictEqual(
    shapeData.map(g => Math.round(toDegrees(g.angle))),
    [0, 120, -120, -60],
  );
  assert.ok(shapeData.every((g, i) => g.__d3plus__ && g.i === i));
  assert.strictEqual(shapeData[1].data, data[1], "keeps the source row");
  assert.strictEqual(shapeData[1].value, 150, "keeps the unclamped value");

  const shared = viz.ctx.gauge;
  assert.deepStrictEqual(shared.domain, [0, 100]);
  assert.deepStrictEqual(shared.ticks.major, [0, 20, 40, 60, 80, 100]);
  assert.deepStrictEqual(
    shared.bands.map(b => [b.min, b.max]),
    [
      [0, 70],
      [70, 100],
    ],
  );
  assert.strictEqual(shared.dial.indicator, "needle");
  assert.strictEqual(shared.dial.hasBands, true);
  assert.strictEqual(shared.dial.rows, 4);
  assert.strictEqual(
    shared.dial.hasValue,
    false,
    "several rows hide the value label",
  );
  assert.strictEqual(shared.dial.hasName, false);
  close(shared.radius, 210, "one dial fills the chart area");
  close(shared.cx, 212, "centered horizontally, inside the stroke buffer");
  close(shared.cy, 214.5, "footprint centered vertically");
});

it("applyGaugeLayout: a single named row shows its value and name", () => {
  const viz = mockViz([{id: "Speed", value: 72}], {domain: [0, 100]});
  applyGaugeLayout({viz});
  assert.strictEqual(viz.ctx.gauge.dial.hasValue, true);
  assert.strictEqual(viz.ctx.gauge.dial.hasName, true);
  assert.strictEqual(hasName(viz, {id: "Speed"}, 0), true);
  assert.strictEqual(hasName(viz, {value: 1}, 0), false, "no id, no name");
  assert.strictEqual(
    hasName({schema: {label: () => "x", groupBy: []}}, {}, 0),
    true,
    "a label counts",
  );
});

it("applyGaugeLayout: reads the indicator, ticks, and an unnamed row", () => {
  const viz = mockViz([{value: 3.4}], {
    indicator: "progress",
    ticks: false,
    minorTicks: false,
    startAngle: -90,
    endAngle: 90,
    axisConfig: {shapeConfig: {labelConfig: {fontSize: 14}}},
  });
  const {shapeData} = applyGaugeLayout({viz});
  assert.strictEqual(shapeData.length, 1);
  assert.strictEqual(viz.ctx.gauge.dial.hasName, false, "no id, no name");
  assert.strictEqual(viz.ctx.gauge.dial.indicator, "progress");
  assert.strictEqual(viz.ctx.gauge.dial.tickFontSize, 14);
  assert.deepStrictEqual(viz.ctx.gauge.ticks, {major: [], minor: []});
  assert.deepStrictEqual(viz.ctx.gauge.domain, [0, 4]);
});

it("applyGaugeLayout: returns no gauges for no data", () => {
  const viz = mockViz([]);
  assert.deepStrictEqual(applyGaugeLayout({viz}).shapeData, []);
});
