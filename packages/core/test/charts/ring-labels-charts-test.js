import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Chord, Donut, Pie, RadialBar, Sunburst} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {applyPieLayout} from "../../src/charts/Pie/applyLayout.ts";
import {pieEmit} from "../../src/charts/Pie/emit.ts";
import {
  pieSliceLabels,
  ringFontRange,
} from "../../src/charts/Pie/curvedLabels.ts";
import {applySunburstLayout} from "../../src/charts/Sunburst/applyLayout.ts";
import {
  metricsWidth,
  sunburstCurvedNodes,
  sunburstLabelPlacements,
} from "../../src/charts/Sunburst/curvedLabels.ts";
import {
  sunburstArcGeometry,
  sunburstLabel,
} from "../../src/charts/Sunburst/emit.ts";
import {applyChordLayout} from "../../src/charts/Chord/applyLayout.ts";
import {chordEmit} from "../../src/charts/Chord/emit.ts";
import {
  CHORD_LABEL_FONT_SIZE,
  applyChordLabelGeometry,
  chordAllCurved,
  chordCurves,
  chordLabelFontSize,
} from "../../src/charts/Chord/labels.ts";
import {applyRadialBarLayout} from "../../src/charts/RadialBar/applyLayout.ts";
import {
  radialBarCurvedLabels,
  radialBarLabelSpot,
} from "../../src/charts/RadialBar/curvedLabels.ts";
import {
  measureTrackLabels,
  radialBarCurvedRows,
  trackFontSize,
} from "../../src/charts/RadialBar/trackLayout.ts";

useJsdom();

const TAU = Math.PI * 2;
const sectors = [
  {id: "Manufacturing", value: 31},
  {id: "Retail Trade", value: 22},
  {id: "Health Care", value: 16},
  {id: "Construction", value: 11},
  {id: "Education", value: 7},
  {id: "Agriculture", value: 4},
  {id: "Mining", value: 2.5},
];

/** A 600×500 chart laid out with no margins, ready to read. */
function draw(viz, stage) {
  viz.width(600).height(500).duration(0);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const {shapeData} = runStages({viz}, [stage]);
  return {viz, shapeData};
}

const curvedText = nodes =>
  nodes.filter(n => n.type === "text" && n.path).map(n => n.lines[0].text);
const straightText = nodes =>
  nodes
    .filter(n => n.type === "text" && !n.path)
    .map(n => n.lines.map(l => l.text).join(" "));

it("ringFontRange — fontSize alone, else fontMin to fontMax, 8 to 24 by default", () => {
  assert.deepStrictEqual(ringFontRange({}), {fontMin: 8, fontMax: 24});
  assert.deepStrictEqual(ringFontRange({fontSize: 12}), {
    fontMin: 12,
    fontMax: 12,
  });
  assert.deepStrictEqual(ringFontRange({fontMin: 10, fontMax: 16}), {
    fontMin: 10,
    fontMax: 16,
  });
  assert.deepStrictEqual(ringFontRange({fontMin: 30, fontMax: 16}), {
    fontMin: 16,
    fontMax: 16,
  });
});

it("pieEmit — a Donut curves its slice names along the ring, with the share beneath", () => {
  const {viz, shapeData} = draw(
    new Donut().data(sectors).groupBy("id").value("value"),
    applyPieLayout,
  );
  const nodes = pieEmit({viz, shapeData});
  const curved = curvedText(nodes);
  for (const name of ["Manufacturing", "Retail Trade", "Health Care"])
    assert.ok(curved.includes(name), `${name} in ${curved}`);
  assert.ok(
    curved.some(t => /^[\d.]+%$/.test(t)),
    "the share on a second line",
  );
  // Every slice is named at most once.
  const all = [...curved, ...straightText(nodes)].filter(t => !t.endsWith("%"));
  assert.strictEqual(new Set(all).size, all.length, all.join(", "));
  const label = nodes.find(n => n.path && n.lines[0].text === "Health Care");
  const wedge = nodes.find(
    n => n.type === "path" && n.datum?.id === "Health Care",
  );
  assert.strictEqual(label.datum, wedge.datum, "dims with its wedge");
  assert.strictEqual(label.interactive, false);
});

it("pieEmit — labelPosition inside keeps the straight labels; along curves every one that fits", () => {
  const inside = draw(
    new Donut().data(sectors).groupBy("id").labelPosition("inside"),
    applyPieLayout,
  );
  assert.deepStrictEqual(curvedText(pieEmit(inside)), []);
  const along = draw(
    new Donut().data(sectors).groupBy("id").labelPosition("along"),
    applyPieLayout,
  );
  const nodes = pieEmit(along);
  assert.deepStrictEqual(
    straightText(nodes),
    [],
    "no straight labels with along",
  );
  assert.ok(curvedText(nodes).length >= sectors.length - 1);
});

it("pieSliceLabels — a full Pie's curves follow the rim, where its narrow wedges are widest", () => {
  const {viz, shapeData} = draw(
    new Pie().data(sectors).groupBy("id").labelPosition("along"),
    applyPieLayout,
  );
  const radius = viz.ctx.arcData.outerRadius()();
  const {straight, curved} = pieSliceLabels({
    viz,
    slices: shapeData,
    arcOf: d => ({
      innerRadius: 0,
      outerRadius: radius,
      startAngle: d.startAngle,
      endAngle: d.endAngle,
    }),
    nameOf: d => d.data.id,
    shareOf: () => "",
    fillOf: () => "#ffffff",
    straight: [],
    labelConfig: {},
  });
  assert.deepStrictEqual(straight, []);
  const mining = curved.find(n => n.lines[0].text === "Mining");
  assert.ok(mining, "the narrow Mining wedge is named along its rim");
  // Dark text on a white fill.
  assert.notStrictEqual(mining.paint.fill.toLowerCase(), "#ffffff");
  const r = Math.hypot(
    ...mining.path.d
      .match(/M(-?[\d.]+),(-?[\d.]+)/)
      .slice(1)
      .map(Number),
  );
  assert.ok(r > radius * 0.8, `${r} near the rim of ${radius}`);
});

it("metricsWidth — a label's one-line width from its words at 1px", () => {
  const width = metricsWidth({words: [3, 2], space: 0.25});
  assert.strictEqual(width(10), 52.5);
  assert.strictEqual(metricsWidth({words: [], space: 0.3})(10), 0);
});

const files = [
  ["Frontend", "Components", 820],
  ["Frontend", "Pages", 840],
  ["Backend", "API", 1000],
  ["Backend", "Database", 670],
  ["Docs", "Guides", 125],
].map(([area, module, size]) => ({area, module, size}));

const sunburst = config =>
  draw(
    new Sunburst()
      .data(files)
      .groupBy(["area", "module"])
      .sum("size")
      .config(config ?? {}),
    applySunburstLayout,
  );

it("sunburstLabelPlacements — curves along wide arcs; inside keeps the straight boxes", () => {
  const {viz, shapeData} = sunburst();
  const inputs = {
    labelOf: n => sunburstLabel(viz, n),
    arcOf: n => sunburstArcGeometry(n, 0, 0),
    fontMin: 8,
    fontMax: 24,
  };
  const {boxes, curves} = sunburstLabelPlacements(viz, shapeData, {}, inputs);
  const curvedNames = [...curves.keys()].map(inputs.labelOf);
  assert.ok(curvedNames.includes("Frontend"), curvedNames.join());
  assert.ok(curvedNames.includes("Backend"), curvedNames.join());
  for (const n of shapeData)
    assert.ok(!(boxes.has(n) && curves.has(n)), "one placement per arc");
  const inside = sunburst({labelPosition: "inside"});
  const straightOnly = sunburstLabelPlacements(
    inside.viz,
    inside.shapeData,
    {},
    {...inputs, labelOf: n => sunburstLabel(inside.viz, n)},
  );
  assert.strictEqual(straightOnly.curves.size, 0);
  assert.ok(straightOnly.boxes.size > 0);
});

it("sunburstCurvedNodes — a text node per curve, in its color and with its arc's datum", () => {
  const {viz, shapeData} = sunburst();
  const {curves} = sunburstLabelPlacements(
    viz,
    shapeData,
    {},
    {
      labelOf: n => sunburstLabel(viz, n),
      arcOf: n => sunburstArcGeometry(n, 0, 0),
      fontMin: 8,
      fontMax: 24,
    },
  );
  const nodes = sunburstCurvedNodes(
    viz,
    curves,
    {},
    {
      labelOf: n => sunburstLabel(viz, n),
      colorOf: () => "#abcdef",
    },
  );
  assert.strictEqual(nodes.length, curves.size);
  const [node] = nodes;
  assert.strictEqual(node.paint.fill, "#abcdef");
  const source = [...curves.keys()].find(n => n.datum === node.datum);
  assert.ok(source, "carries its arc's datum");
  assert.ok(`${node.key}`.startsWith("sunburst-curved-"));
});

const flows = [
  {source: "North America", target: "Europe", value: 8},
  {source: "Europe", target: "East Asia", value: 6},
  {source: "East Asia", target: "North America", value: 7},
  {source: "Africa", target: "Europe", value: 3},
];
const chord = config =>
  draw(
    new Chord()
      .links(flows)
      .value("value")
      .config(config ?? {}),
    applyChordLayout,
  );

it("chordLabelFontSize — the Path labelConfig's fontSize, else the default", () => {
  assert.strictEqual(chordLabelFontSize(chord().viz), CHORD_LABEL_FONT_SIZE);
  assert.strictEqual(
    chordLabelFontSize(chord({shapeConfig: {labelConfig: {fontSize: 14}}}).viz),
    14,
  );
});

it("chordCurves — each group's name along its arc, or null on its spoke", () => {
  const {viz} = chord();
  const nodes = viz.ctx.chordCtx.nodes;
  const curves = chordCurves(viz, nodes, 200);
  assert.ok(curves.every(Boolean), "every name fits along a wide arc");
  for (const fit of curves) assert.ok(fit.radius > 200, "outside the ring");
  assert.strictEqual(chordAllCurved(viz, nodes, curves), true);
  const inside = chord({labelPosition: "inside"});
  const none = chordCurves(inside.viz, inside.viz.ctx.chordCtx.nodes, 200);
  assert.ok(none.every(c => c === null));
  assert.strictEqual(
    chordAllCurved(inside.viz, inside.viz.ctx.chordCtx.nodes, none),
    false,
  );
});

it("applyChordLayout — curved names leave the ring more room than spoke labels", () => {
  const curved = chord();
  const spoke = chord({labelPosition: "inside"});
  const radius = c =>
    Math.hypot(
      ...c.viz.ctx.chordCtx
        .arcFn(c.viz.ctx.chordCtx.nodes[0].group)
        .match(/M(-?[\d.]+),(-?[\d.]+)/)
        .slice(1)
        .map(Number),
    );
  assert.ok(radius(curved) > radius(spoke) + 20);
  assert.ok(curved.viz.ctx.chordCtx.nodes.every(n => n.labelCurve));
  assert.ok(spoke.viz.ctx.chordCtx.nodes.every(n => !n.labelCurve));
});

it("applyChordLabelGeometry — reads outward along each spoke, flipped on the left", () => {
  const nodes = [
    {data: {}, i: 0, group: {startAngle: 0.2, endAngle: 0.6}},
    {data: {}, i: 1, group: {startAngle: 4, endAngle: 4.4}},
  ];
  applyChordLabelGeometry(nodes, 100, 60);
  assert.strictEqual(nodes[0].labelAnchor, "start");
  assert.strictEqual(nodes[1].labelAnchor, "end");
  assert.ok(
    Math.abs(Math.hypot(nodes[0].labelX, nodes[0].labelY) - 100) < 1e-9,
  );
});

it("chordEmit — curved names in the chart's ink, or spoke labels in it too", () => {
  const curved = chord();
  const nodes = chordEmit({viz: curved.viz});
  const texts = nodes.filter(n => n.type === "text");
  assert.ok(texts.length === 4 && texts.every(n => n.path));
  const dark = chord({theme: "dark", labelPosition: "inside"});
  const spoke = chordEmit({viz: dark.viz}).filter(n => n.type === "text");
  assert.ok(spoke.length === 4 && spoke.every(n => !n.path));
  assert.ok(
    spoke.every(n => n.paint.fill !== "black" && n.paint.fill !== "#000000"),
    "spoke labels follow the dark theme",
  );
});

const activity = [
  {id: "Running", value: 82},
  {id: "Cycling", value: 64},
  {id: "Yoga", value: 30},
];
const radialBar = config =>
  draw(
    new RadialBar()
      .data(activity)
      .groupBy("id")
      .value("value")
      .config(config ?? {}),
    applyRadialBarLayout,
  );

it("radialBarCurvedRows — curved when the sweep leaves no room, or on along", () => {
  assert.deepStrictEqual(radialBarCurvedRows(radialBar().viz, activity), [
    false,
    false,
    false,
  ]);
  assert.deepStrictEqual(
    radialBarCurvedRows(radialBar({maxAngle: 360}).viz, activity),
    [true, true, true],
  );
  assert.deepStrictEqual(
    radialBarCurvedRows(
      radialBar({labelPosition: d => (d.id === "Yoga" ? "along" : "auto")}).viz,
      activity,
    ),
    [false, false, true],
  );
  assert.deepStrictEqual(
    radialBarCurvedRows(
      radialBar({maxAngle: 360, labelPosition: "inside"}).viz,
      activity,
    ),
    [false, false, false],
  );
});

it("trackFontSize and measureTrackLabels — a track's label size and width", () => {
  const {viz} = radialBar();
  assert.strictEqual(trackFontSize(viz, 10), 8);
  assert.strictEqual(trackFontSize(viz, 20), 12);
  assert.strictEqual(trackFontSize(viz, 50), 14);
  const [first] = measureTrackLabels(viz, activity, 20);
  assert.strictEqual(first.text, "Running");
  assert.strictEqual(first.size, 12);
  assert.ok(first.width > 30);
});

it("radialBarLabelSpot — inside the bar from its start, else past its end", () => {
  const bar = {innerRadius: 100, outerRadius: 120, startAngle: 0, endAngle: 1};
  const w = fs => fs * 4;
  const inBar = radialBarLabelSpot(bar, TAU, w, 10);
  assert.strictEqual(inBar.inBar, true);
  // The text starts at the bar's start.
  const [x, y] = inBar.fit.d
    .match(/M(-?[\d.]+),(-?[\d.]+)/)
    .slice(1)
    .map(Number);
  const start = Math.atan2(x, -y);
  assert.ok(start >= 0 && start < 0.05, `${start}`);
  const short = radialBarLabelSpot({...bar, endAngle: 0.1}, TAU, w, 10);
  assert.strictEqual(short.inBar, false);
  assert.strictEqual(
    radialBarLabelSpot({...bar, endAngle: 0.1}, 0.2, w, 10),
    null,
    "no room before the sweep ends",
  );
  assert.strictEqual(
    radialBarLabelSpot({...bar, outerRadius: 105}, TAU, w, 10),
    null,
    "too thin",
  );
});

it("radialBarCurvedLabels — names each full-circle track, dimming with its bar", () => {
  const {viz, shapeData} = radialBar({maxAngle: 360});
  const nodes = radialBarCurvedLabels(viz, shapeData, viz.ctx.polar);
  assert.deepStrictEqual(
    nodes.map(n => n.lines[0].text),
    ["Running", "Cycling", "Yoga"],
  );
  assert.ok(nodes.every((n, k) => n.datum === shapeData[k].data));
  const gap = radialBar();
  assert.deepStrictEqual(
    radialBarCurvedLabels(gap.viz, gap.shapeData, gap.viz.ctx.polar),
    [],
  );
});
