import {it} from "vitest";
import assert from "assert";
import {scaleLinear} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  REFERENCE_BAND,
  REFERENCE_LINE,
  referenceBandLabelAt,
  referenceBandLabelSpots,
  referenceBandNodes,
  referenceLineLabelAt,
  referenceLineLabelSpots,
  referenceLineNodes,
} from "../../src/charts/features/referenceAnnotations.ts";
import {
  labelSpotBox,
  pickLabelSpot,
  placeReferenceLabels,
  registerLabelSpots,
  slideSteps,
} from "../../src/charts/features/referenceLabelPlacement.ts";

useJsdom();

// Reference labels move clear of the data labels: the spots each may take,
// and how the first clear one is picked.

// A 400×300 plot at (40, 10): x 0..100 → 40..440, y 0..50 → 310..10.
const plot = {x0: 40, y0: 10, x1: 440, y1: 310};
const frame = {
  plot,
  axes: {
    x: {scale: scaleLinear().domain([0, 100]).range([40, 440])},
    y: {scale: scaleLinear().domain([0, 50]).range([310, 10])},
  },
};
const block = {
  lines: ["Hi"],
  widths: [20],
  width: 20,
  height: 16,
  lineHeight: 16,
};
const key = s => `${s.x},${s.y},${s.align}`;

it("labelSpotBox: the block's box, lined up by the spot's alignment", () => {
  assert.deepStrictEqual(labelSpotBox({x: 100, y: 50, align: "start"}, block), {
    x: 100,
    y: 50,
    width: 20,
    height: 16,
  });
  assert.strictEqual(labelSpotBox({x: 100, y: 50, align: "end"}, block).x, 80);
  assert.strictEqual(
    labelSpotBox({x: 100, y: 50, align: "middle"}, block).x,
    90,
  );
});

it("slideSteps: steps from one end to the other, both included", () => {
  assert.deepStrictEqual(slideSteps(0, 12), [0, 6, 12]);
  assert.deepStrictEqual(slideSteps(0, 14), [0, 6, 12, 14]);
  assert.deepStrictEqual(slideSteps(14, 0), [14, 8, 2, 0]);
  assert.deepStrictEqual(slideSteps(5, 5), [5]);
});

it("pickLabelSpot: the first clear spot inside the plot, else null", () => {
  const spots = [
    {x: 50, y: 20, align: "start"},
    {x: 430, y: 20, align: "start"},
    {x: 100, y: 20, align: "start"},
  ];
  assert.strictEqual(pickLabelSpot(spots, block, [], plot), spots[0]);
  const over = [{x: 60, y: 25, width: 10, height: 10}];
  assert.strictEqual(
    pickLabelSpot(spots, block, over, plot),
    spots[2],
    "skips a spot over an obstacle and one past the plot's edge",
  );
  assert.strictEqual(
    pickLabelSpot([spots[1]], block, [], plot),
    spots[1],
    "the preferred spot need only be clear",
  );
  assert.strictEqual(
    pickLabelSpot(spots, block, [{x: 0, y: 0, width: 500, height: 50}], plot),
    null,
  );
  assert.strictEqual(
    pickLabelSpot(spots, block, [{x: 70, y: 20, width: 10, height: 16}], plot),
    spots[0],
    "touching edges do not collide",
  );
});

it("referenceLineLabelSpots: the preferred spot, the other side, the other end, then along the line", () => {
  const h = {axis: "y", at: 160};
  const spots = referenceLineLabelSpots(frame, h, block);
  assert.deepStrictEqual(spots[0], referenceLineLabelAt(frame, h, block));
  assert.deepStrictEqual(spots.slice(1, 4), [
    {x: 436, y: 164, align: "end"},
    {x: 44, y: 140, align: "start"},
    {x: 44, y: 164, align: "start"},
  ]);
  const along = spots.slice(4);
  assert.deepStrictEqual(along[0], {x: 416, y: 140, align: "start"});
  assert.deepStrictEqual(along.at(-1), {x: 44, y: 164, align: "start"});
  assert.ok(along.every(s => s.y === 140 || s.y === 164));

  const v = {axis: "x", at: 240};
  const vSpots = referenceLineLabelSpots(frame, v, block, "end");
  assert.deepStrictEqual(vSpots[0], referenceLineLabelAt(frame, v, block));
  assert.deepStrictEqual(vSpots.slice(1, 4), [
    {x: 236, y: 14, align: "end"},
    {x: 244, y: 290, align: "start"},
    {x: 236, y: 290, align: "end"},
  ]);
  assert.ok(
    vSpots.slice(4).every(s => s.x === 244 || s.x === 236),
    "along the line, either side of it",
  );
});

it("referenceBandLabelSpots: the preferred corner, the other corners, then along the band", () => {
  const tall = {x: 100, y: 10, width: 80, height: 300};
  const spots = referenceBandLabelSpots(tall, "x", block);
  assert.deepStrictEqual(spots[0], referenceBandLabelAt(tall));
  assert.deepStrictEqual(spots.slice(1, 4), [
    {x: 176, y: 14, align: "end"},
    {x: 104, y: 290, align: "start"},
    {x: 176, y: 290, align: "end"},
  ]);
  assert.ok(
    spots.slice(4).every(s => s.x === 104 || s.x === 176),
    "a tall band's spots run down its sides",
  );
  assert.deepStrictEqual(
    referenceBandLabelSpots(tall, "x", block, "end")[0],
    referenceBandLabelAt(tall, "end"),
  );
  const wide = {x: 40, y: 100, width: 400, height: 60};
  const across = referenceBandLabelSpots(wide, "y", block).slice(4);
  assert.ok(
    across.every(s => s.y === 104 || s.y === 140),
    "a wide band's spots run along its top and bottom",
  );
  assert.deepStrictEqual(across[0], {x: 44, y: 104, align: "start"});
  assert.deepStrictEqual(across.at(-1), {x: 416, y: 140, align: "start"});
});

it("placeReferenceLabels: moves registered labels clear, in order, and drops one with no room", () => {
  const text = (k, x) => ({
    type: "text",
    key: k,
    x: 0,
    y: 0,
    transform: {x, y: 20},
    lines: [{text: k, x: 0, y: 8, width: 20}],
    font: {size: 12, anchor: "start", baseline: "middle"},
  });
  const a = text("a", 50);
  const b = text("b", 50);
  const c = text("c", 50);
  const other = text("other", 50);
  registerLabelSpots(a, block, [
    {x: 50, y: 20, align: "start"},
    {x: 100, y: 20, align: "start"},
  ]);
  registerLabelSpots(b, block, [
    {x: 110, y: 20, align: "start"},
    {x: 100, y: 20, align: "start"},
    {x: 200, y: 60, align: "end"},
  ]);
  registerLabelSpots(c, block, [{x: 100, y: 20, align: "start"}]);
  const obstacle = {x: 55, y: 25, width: 5, height: 5};
  const out = placeReferenceLabels(
    [{type: "group", key: "g", children: [a, b]}, c, other],
    [obstacle],
    plot,
  );
  const [group, ...rest] = out;
  const [movedA, movedB] = group.children;
  assert.deepStrictEqual(movedA.transform, {x: 100, y: 20});
  assert.strictEqual(movedA.font.anchor, "start");
  assert.deepStrictEqual(
    movedB.transform,
    {x: 200, y: 60},
    "clear of the label placed before it",
  );
  assert.strictEqual(movedB.font.anchor, "end");
  assert.deepStrictEqual(
    rest.map(n => n.key),
    ["other"],
    "a label with no clear spot is dropped; others pass through",
  );
  assert.deepStrictEqual(a.transform, {x: 50, y: 20}, "the input is untouched");
});

it("referenceLineNodes and referenceBandNodes: their labels register their spots", () => {
  const viz = new LinePlot();
  const [, label] = referenceLineNodes(
    viz,
    {shape: REFERENCE_LINE, y: 25, label: "Target"},
    frame,
    "r",
  );
  const blocker = [{x: 0, y: 0, width: 500, height: 500}];
  assert.deepStrictEqual(
    placeReferenceLabels([label], blocker, plot),
    [],
    "a registered label",
  );
  const [, bandLabel] = referenceBandNodes(
    viz,
    {shape: REFERENCE_BAND, x: [20, 40], label: "Band"},
    frame,
    "b",
  );
  const [moved] = placeReferenceLabels(
    [bandLabel],
    [{x: 100, y: 10, width: 30, height: 30}],
    plot,
  );
  assert.notDeepStrictEqual(
    key({...moved.transform, align: moved.font.anchor}),
    key({...bandLabel.transform, align: bandLabel.font.anchor}),
    "moves off a data label in its corner",
  );
});
