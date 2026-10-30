import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint} from "d3-scale";
import {colorDefaults} from "@d3plus/color";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  annotationTextNode,
  annotationTextStyle,
  wrapAnnotationText,
} from "../../src/charts/features/annotationText.ts";
import {
  calloutNodes,
  calloutPicker,
  calloutRowNodes,
} from "../../src/charts/features/calloutScene.ts";
import {
  annotationLayer,
  plotAnnotationList,
} from "../../src/charts/features/plotAnnotations.ts";
import {
  expandReferenceBands,
  expandReferenceLines,
  REFERENCE_BAND,
  REFERENCE_LINE,
  referenceAxis,
  referenceBandLabelAt,
  referenceBandNodes,
  referenceBandRect,
  referenceLineLabelAt,
  referenceLineNodes,
  referenceLinePoints,
} from "../../src/charts/features/referenceAnnotations.ts";

useJsdom();

// The text color a white page gets.
const INK = colorDefaults.dark;

// Reference lines and bands: their expansion into annotations, geometry,
// labels, and scene nodes; and callout scene nodes and text.

// A 400×300 plot at (40, 10): x 0..100 → 40..440, y 0..50 → 310..10.
const plot = {x0: 40, y0: 10, x1: 440, y1: 310};
const frame = {
  plot,
  axes: {
    x: {scale: scaleLinear().domain([0, 100]).range([40, 440])},
    y: {scale: scaleLinear().domain([0, 50]).range([310, 10])},
  },
};
const point = scalePoint().domain(["A", "B", "C", "D"]).range([90, 390]);
const bars = {
  plot,
  axes: {
    x: {scale: v => point(v) ?? NaN, categories: point.domain(), slots: true},
    y: frame.axes.y,
  },
};
const block = {
  lines: ["Hi"],
  widths: [20],
  width: 20,
  height: 16,
  lineHeight: 16,
};

it("expandReferenceLines: one back-layer ReferenceLine annotation per entry", () => {
  assert.deepStrictEqual(expandReferenceLines([{y: 5, label: "T"}]), [
    {layer: "back", y: 5, label: "T", shape: REFERENCE_LINE},
  ]);
  assert.deepStrictEqual(expandReferenceLines({x: 1, layer: "front"}), [
    {layer: "front", x: 1, shape: REFERENCE_LINE},
  ]);
  assert.deepStrictEqual(expandReferenceLines(undefined), []);
  assert.deepStrictEqual(expandReferenceLines([null, 4, {y: 1}]).length, 1);
});

it("expandReferenceBands: one back-layer ReferenceBand annotation per entry", () => {
  assert.deepStrictEqual(expandReferenceBands([{x: [1, 2]}]), [
    {layer: "back", x: [1, 2], shape: REFERENCE_BAND},
  ]);
  assert.deepStrictEqual(expandReferenceBands(false), []);
});

it("referenceAxis: the first axis an entry sets", () => {
  assert.strictEqual(referenceAxis({y: 0}), "y");
  assert.strictEqual(referenceAxis({x2: "a"}), "x2");
  assert.strictEqual(referenceAxis({y2: 1, x: null}), "y2");
  assert.strictEqual(referenceAxis({label: "x"}), null);
});

it("referenceLinePoints: across the whole plot at the value", () => {
  assert.deepStrictEqual(referenceLinePoints(frame, {y: 25}), {
    axis: "y",
    at: 160,
    points: [
      [40, 160],
      [440, 160],
    ],
  });
  assert.deepStrictEqual(referenceLinePoints(frame, {x: 50}).points, [
    [240, 310],
    [240, 10],
  ]);
  assert.strictEqual(referenceLinePoints(bars, {x: "C"}).at, point("C"));
  assert.strictEqual(
    referenceLinePoints(frame, {x: 0.25, ref: "plot"}).at,
    140,
  );
  assert.strictEqual(referenceLinePoints(frame, {y: 80}), null, "off the plot");
  assert.strictEqual(referenceLinePoints(frame, {x: "Z"}), null);
  assert.strictEqual(referenceLinePoints(frame, {label: "no axis"}), null);
});

it("referenceBandRect: the span across the plot, clipped to it", () => {
  assert.deepStrictEqual(referenceBandRect(frame, {x: [25, 50]}), {
    axis: "x",
    box: {x: 140, y: 10, width: 100, height: 300},
  });
  assert.deepStrictEqual(referenceBandRect(frame, {y: [20, 30]}).box, {
    x: 40,
    y: 130,
    width: 400,
    height: 60,
  });
  // Categories B..C on a bar axis: each one's whole slot.
  assert.deepStrictEqual(referenceBandRect(bars, {x: ["B", "C"]}).box, {
    x: 140,
    y: 10,
    width: 200,
    height: 300,
  });
  assert.deepStrictEqual(
    referenceBandRect(frame, {x: [80, 200]}).box.width,
    80,
    "clipped at the plot's right edge",
  );
  assert.strictEqual(referenceBandRect(frame, {x: [150, 200]}), null);
  assert.strictEqual(referenceBandRect(frame, {x: 5}), null, "not a pair");
});

it("referenceLineLabelAt: beside the line's end, flipping to stay in the plot", () => {
  const h = {axis: "y", at: 160};
  assert.deepStrictEqual(referenceLineLabelAt(frame, h, block), {
    x: 436,
    y: 140,
    align: "end",
  });
  assert.deepStrictEqual(referenceLineLabelAt(frame, h, block, "start"), {
    x: 44,
    y: 140,
    align: "start",
  });
  assert.strictEqual(
    referenceLineLabelAt(frame, {axis: "y", at: 20}, block).y,
    24,
    "below a line near the top",
  );
  const v = {axis: "x", at: 240};
  assert.deepStrictEqual(referenceLineLabelAt(frame, v, block), {
    x: 244,
    y: 14,
    align: "start",
  });
  assert.strictEqual(referenceLineLabelAt(frame, v, block, "start").y, 290);
  assert.deepStrictEqual(
    referenceLineLabelAt(frame, {axis: "x", at: 430}, block),
    {
      x: 426,
      y: 14,
      align: "end",
    },
  );
});

it("referenceBandLabelAt: inside the band's top corner", () => {
  const box = {x: 100, y: 10, width: 50, height: 300};
  assert.deepStrictEqual(referenceBandLabelAt(box), {
    x: 104,
    y: 14,
    align: "start",
  });
  assert.deepStrictEqual(referenceBandLabelAt(box, "end"), {
    x: 146,
    y: 14,
    align: "end",
  });
});

it("annotationTextStyle: theme-aware defaults, each overridable", () => {
  const viz = new LinePlot();
  const style = annotationTextStyle(viz, () => undefined);
  assert.strictEqual(style.fontColor, INK, "dark text on a white page");
  assert.strictEqual(style.fontSize, 12);
  assert.strictEqual(style.lineHeight, 16);
  assert.strictEqual(style.maxWidth, 150);
  assert.ok(style.fontFamily.includes("Inter"));
  const own = {
    fontColor: "red",
    fontSize: 20,
    fontFamily: "Georgia",
    maxWidth: 50,
  };
  const custom = annotationTextStyle(viz, k => own[k]);
  assert.strictEqual(custom.fontColor, "red");
  assert.strictEqual(custom.fontSize, 20);
  assert.strictEqual(custom.lineHeight, 26);
  assert.strictEqual(custom.fontFamily, "'Georgia'");
  assert.strictEqual(custom.maxWidth, 50);
  viz._theme = {text: "#f0f0f0"};
  assert.strictEqual(
    annotationTextStyle(viz, () => undefined).fontColor,
    "#f0f0f0",
  );
});

it("wrapAnnotationText: wraps at the style's maxWidth", () => {
  const style = annotationTextStyle(new LinePlot(), k =>
    k === "maxWidth" ? 60 : undefined,
  );
  const one = wrapAnnotationText("Short", style);
  assert.deepStrictEqual(one.lines, ["Short"]);
  assert.strictEqual(one.height, 16);
  const many = wrapAnnotationText("A much longer note that has to wrap", style);
  assert.ok(many.lines.length > 1, "wraps");
  assert.ok(many.width <= 60, `no line wider than the max (${many.width})`);
  assert.strictEqual(many.height, many.lines.length * 16);
});

it("annotationTextNode: an inert text node, its block's top at y", () => {
  const style = annotationTextStyle(new LinePlot(), () => undefined);
  const node = annotationTextNode(
    {...block, lines: ["a", "b"], widths: [5, 6]},
    style,
    {
      key: "k",
      x: 10,
      y: 20,
      align: "middle",
    },
  );
  assert.strictEqual(node.type, "text");
  assert.strictEqual(node.interactive, false);
  assert.deepStrictEqual(node.transform, {x: 10, y: 20});
  assert.deepStrictEqual(
    node.lines.map(l => l.y),
    [8, 24],
  );
  assert.strictEqual(node.font.anchor, "middle");
  assert.strictEqual(node.font.baseline, "middle");
});

it("calloutPicker: an accessor, else the row's value, else the annotation's", () => {
  const pick = calloutPicker(
    {shape: "Callout", dx: 5, dy: (d, i) => d.v * 10 + i, fill: "red"},
    {v: 2, dx: 9},
    1,
  );
  assert.strictEqual(pick("dx"), 9);
  assert.strictEqual(pick("dy"), 21);
  assert.strictEqual(pick("fill"), "red");
  assert.strictEqual(pick("stroke"), undefined);
});

const byKey = (nodes, suffix) => nodes.find(n => n.key.endsWith(suffix));

it("calloutRowNodes: connector, arrowhead, box, and text, all inert", () => {
  const viz = new LinePlot();
  const nodes = calloutRowNodes(viz, {shape: "Callout"}, frame, {
    d: {x: 50, y: 25, label: "Note"},
    i: 0,
    key: "c",
  });
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    ["c-connector", "c-marker", "c-box", "c-label"],
  );
  assert.ok(nodes.every(n => n.interactive === false));
  const box = byKey(nodes, "box");
  // Centered 40px above the anchor at (240, 160).
  assert.strictEqual(box.x + box.width / 2, 240);
  assert.strictEqual(box.y + box.height / 2, 120);
  assert.strictEqual(
    box.paint.fill,
    "rgb(255, 255, 255)",
    "the page's background",
  );
  assert.strictEqual(box.paint.strokeOpacity, 0.25, "a subtle border");
  const connector = byKey(nodes, "connector");
  assert.strictEqual(
    connector.points[0][1],
    box.y + box.height,
    "leaves the box's bottom",
  );
  assert.strictEqual(connector.paint.stroke, INK, "the text color");
  const marker = byKey(nodes, "marker");
  assert.strictEqual(marker.type, "path");
  assert.ok(marker.d.startsWith("M240,160"), "the arrow's tip is the anchor");
  assert.strictEqual(byKey(nodes, "label").lines[0].text, "Note");
});

it("calloutRowNodes: overrides win; no box, dot marker, no connector", () => {
  const viz = new LinePlot();
  const row = {d: {x: 50, y: 25, label: "Note"}, i: 0, key: "c"};
  const own = calloutRowNodes(
    viz,
    {
      shape: "Callout",
      fill: "navy",
      stroke: "gold",
      fontColor: "white",
      connectorStroke: "lime",
      marker: "dot",
      dx: 80,
      dy: 0,
    },
    frame,
    row,
  );
  assert.strictEqual(byKey(own, "box").paint.fill, "navy");
  assert.strictEqual(byKey(own, "box").paint.stroke, "gold");
  assert.strictEqual(byKey(own, "label").paint.fill, "white");
  assert.strictEqual(byKey(own, "connector").paint.stroke, "lime");
  assert.strictEqual(byKey(own, "marker").type, "circle");
  assert.deepStrictEqual(
    [byKey(own, "marker").cx, byKey(own, "marker").cy],
    [240, 160],
  );
  const bare = calloutRowNodes(
    viz,
    {shape: "Callout", fill: false, stroke: "none", connector: false},
    frame,
    row,
  );
  assert.deepStrictEqual(
    bare.map(n => n.key),
    ["c-label"],
  );
});

it("calloutRowNodes: nothing without a label or with the anchor off the plot", () => {
  const viz = new LinePlot();
  const at = d =>
    calloutRowNodes(viz, {shape: "Callout"}, frame, {d, i: 0, key: "c"});
  assert.deepStrictEqual(at({x: 50, y: 25}), []);
  assert.deepStrictEqual(at({x: 150, y: 25, label: "off"}), []);
  assert.deepStrictEqual(at({x: "Z", y: 25, label: "no x"}), []);
});

it("calloutNodes: every row, keyed by index", () => {
  const nodes = calloutNodes(
    new LinePlot(),
    {
      shape: "Callout",
      xRef: "plot",
      yRef: "plot",
      data: [
        {x: 0.5, y: 0.5, label: "a"},
        {x: 0.25, y: 0.5, label: "b"},
      ],
    },
    frame,
    "k",
  );
  assert.ok(byKey(nodes, "k-0-label") && byKey(nodes, "k-1-label"));
  assert.deepStrictEqual(
    calloutNodes(new LinePlot(), {shape: "Callout"}, frame, "k"),
    [],
  );
});

it("referenceLineNodes: the line in the text color, dashed on request, and its label", () => {
  const viz = new LinePlot();
  const [line, label] = referenceLineNodes(
    viz,
    {shape: REFERENCE_LINE, y: 25, label: "Target", dash: true},
    frame,
    "r",
  );
  assert.strictEqual(line.type, "line");
  assert.strictEqual(line.interactive, false);
  assert.strictEqual(line.paint.stroke, INK);
  assert.strictEqual(line.paint.strokeOpacity, 0.6);
  assert.deepStrictEqual(line.paint.strokeDasharray, [4, 4]);
  assert.strictEqual(label.lines[0].text, "Target");
  const [own] = referenceLineNodes(
    viz,
    {shape: REFERENCE_LINE, x: 10, stroke: "red", strokeWidth: 3, dash: "2 1"},
    frame,
    "r",
  );
  assert.strictEqual(own.paint.stroke, "red");
  assert.strictEqual(own.paint.strokeWidth, 3);
  assert.deepStrictEqual(own.paint.strokeDasharray, [2, 1]);
  assert.deepStrictEqual(
    referenceLineNodes(viz, {shape: REFERENCE_LINE, y: 99}, frame, "r"),
    [],
  );
});

it("referenceBandNodes: a translucent rect in the text color, and its label", () => {
  const viz = new LinePlot();
  const [band, label] = referenceBandNodes(
    viz,
    {shape: REFERENCE_BAND, x: [25, 50], label: "Recession"},
    frame,
    "b",
  );
  assert.strictEqual(band.type, "rect");
  assert.strictEqual(band.interactive, false);
  assert.strictEqual(band.paint.fill, INK);
  assert.strictEqual(band.paint.fillOpacity, 0.08);
  assert.strictEqual(band.paint.stroke, undefined, "no edges by default");
  assert.deepStrictEqual(label.transform, {x: 144, y: 14});
  const [own] = referenceBandNodes(
    viz,
    {
      shape: REFERENCE_BAND,
      y: [0, 10],
      fill: "teal",
      fillOpacity: 0.3,
      stroke: "teal",
    },
    frame,
    "b",
  );
  assert.strictEqual(own.paint.fill, "teal");
  assert.strictEqual(own.paint.fillOpacity, 0.3);
  assert.strictEqual(own.paint.stroke, "teal");
});

it("annotationLayer: callouts in front, everything else behind, unless set", () => {
  assert.strictEqual(annotationLayer({shape: "Callout"}), "front");
  assert.strictEqual(annotationLayer({shape: "Line"}), "back");
  assert.strictEqual(annotationLayer({shape: REFERENCE_LINE}), "back");
  assert.strictEqual(
    annotationLayer({shape: "Callout", layer: "back"}),
    "back",
  );
  assert.strictEqual(annotationLayer({shape: "Rect", layer: "front"}), "front");
});

it("plotAnnotationList: bands, then lines, then the chart's own annotations", () => {
  const viz = new LinePlot()
    .referenceLines([{y: 1}])
    .referenceBands([{y: [1, 2]}])
    .annotations([{shape: "Circle", data: []}, {data: []}]);
  assert.deepStrictEqual(
    plotAnnotationList(viz).map(d => d.shape),
    [REFERENCE_BAND, REFERENCE_LINE, "Circle"],
  );
});
