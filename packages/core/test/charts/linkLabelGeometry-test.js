import {it} from "vitest";
import assert from "assert";
import {near} from "~test/helpers.js";

import {
  arcLabelAnchor,
  cubicAngle,
  cubicMidpoint,
  cubicPoint,
  labelCorners,
  labelHitsBox,
  labelHitsCircle,
  labelsOverlap,
  placeLinkLabels,
  ringsEdgeAnchor,
  sankeyLinkAnchor,
  segmentMidpoint,
  uprightAngle,
} from "../../internal.ts";

/**
    Link label geometry: the middle of a straight link, a curve, an arc, and
    a Sankey band, the upright text angle, and the overlap tests that hide
    labels covering a node or each other.
*/

const deg = r => (r * 180) / Math.PI;

/** `near`, to a millionth unless told otherwise. */
const close = (a, b, tolerance = 1e-6, message = "") =>
  near(a, b, tolerance, message);

it("segmentMidpoint — the middle of the run between the end circles", () => {
  const plain = segmentMidpoint([0, 0], [10, 0]);
  assert.deepStrictEqual(plain, {x: 5, y: 0, angle: 0});
  // A wide source pushes the middle of the visible run toward the target.
  const m = segmentMidpoint([0, 0], [10, 0], 4, 0);
  close(m.x, 7);
  close(m.y, 0);
  const diagonal = segmentMidpoint([0, 0], [0, 10], 2, 2);
  close(diagonal.y, 5);
  close(deg(diagonal.angle), 90);
  const overlapping = segmentMidpoint([0, 0], [4, 0], 5, 5);
  close(overlapping.x, 5, 1e-9, "the visible run is empty: its start edge");
  assert.deepStrictEqual(segmentMidpoint([3, 4], [3, 4]), {
    x: 3,
    y: 4,
    angle: 0,
  });
});

it("cubicPoint and cubicAngle — ends, middle, and direction of a curve", () => {
  const p = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
  ];
  assert.deepStrictEqual(cubicPoint(...p, 0), [0, 0]);
  assert.deepStrictEqual(cubicPoint(...p, 1), [10, 0]);
  assert.deepStrictEqual(cubicPoint(...p, 0.5), [5, 7.5]);
  close(deg(cubicAngle(...p, 0)), 90, 1e-9, "leaves straight down (y down)");
  close(deg(cubicAngle(...p, 0.5)), 0, 1e-9, "level at the top");
  close(deg(cubicAngle(...p, 1)), -90, 1e-9);
  const flat = [
    [0, 0],
    [0, 0],
    [10, 5],
    [10, 5],
  ];
  close(
    cubicAngle(...flat, 0),
    Math.atan2(5, 10),
    1e-9,
    "a control point on its end runs toward the far end",
  );
});

it("cubicMidpoint — halfway along the curve's length", () => {
  // A symmetric curve: its length midpoint is its middle.
  const s = cubicMidpoint([0, 0], [5, 0], [5, 10], [10, 10]);
  close(s.x, 5, 1e-6);
  close(s.y, 5, 1e-6);
  close(s.angle, Math.atan2(15, 7.5), 1e-6, "steepest at the middle");
  // A straight "curve" with bunched controls: t = 0.5 isn't the middle.
  const bunched = [
    [0, 0],
    [0, 0],
    [0, 0],
    [12, 0],
  ];
  assert.ok(cubicPoint(...bunched, 0.5)[0] < 2, "t = 0.5 sits near the start");
  close(cubicMidpoint(...bunched).x, 6, 0.05, "the length midpoint is at 6");
});

it("uprightAngle — keeps text between -90° and 90°", () => {
  assert.strictEqual(uprightAngle(0), 0);
  assert.strictEqual(
    uprightAngle(Math.PI),
    0,
    "right to left reads left to right",
  );
  close(uprightAngle(Math.PI / 4), 45);
  close(uprightAngle((3 * Math.PI) / 4), -45);
  close(uprightAngle(-Math.PI / 4), -45);
  close(uprightAngle((-3 * Math.PI) / 4), 45);
  assert.strictEqual(uprightAngle(Math.PI / 2), -90, "vertical reads up");
  assert.strictEqual(uprightAngle(-Math.PI / 2), -90);
});

it("labelCorners — a box's corners, rotated about its center", () => {
  const flat = labelCorners({x: 10, y: 10, width: 4, height: 2, angle: 0});
  assert.deepStrictEqual(flat, [
    [8, 9],
    [12, 9],
    [12, 11],
    [8, 11],
  ]);
  const turned = labelCorners({x: 0, y: 0, width: 4, height: 2, angle: 90});
  close(turned[0][0], 1);
  close(turned[0][1], -2);
  close(turned[2][0], -1);
  close(turned[2][1], 2);
});

it("labelsOverlap — flat and rotated boxes", () => {
  const a = {x: 0, y: 0, width: 10, height: 4, angle: 0};
  assert.ok(labelsOverlap(a, {...a, x: 5}));
  assert.ok(!labelsOverlap(a, {...a, x: 10}), "touching edges don't count");
  assert.ok(!labelsOverlap(a, {...a, y: 10}));
  // Rotated 90°, a box 10 wide spans y -5…5 at x 0…: it crosses `a`.
  assert.ok(labelsOverlap(a, {...a, x: 3, angle: 90}));
  // Two boxes rotated 45° whose bounding boxes overlap but they don't.
  const d1 = {x: 0, y: 0, width: 20, height: 2, angle: 45};
  const d2 = {x: 6, y: -6, width: 20, height: 2, angle: 45};
  assert.ok(!labelsOverlap(d1, d2), "parallel diagonals apart");
  assert.ok(labelsOverlap(d1, {...d2, x: 1, y: -1}));
});

it("labelHitsCircle — in the label's own frame", () => {
  const box = {x: 0, y: 0, width: 20, height: 4, angle: 0};
  assert.ok(labelHitsCircle(box, {x: 0, y: 5, r: 4}));
  assert.ok(!labelHitsCircle(box, {x: 0, y: 7, r: 4}));
  const upright = {...box, angle: 90};
  assert.ok(labelHitsCircle(upright, {x: 0, y: 12, r: 3}), "past its end");
  assert.ok(!labelHitsCircle(upright, {x: 6, y: 0, r: 3}));
  assert.ok(labelHitsCircle(box, {x: 0, y: 0, r: 100}), "inside a node");
});

it("labelHitsBox — against a flat node box", () => {
  const rect = {x: 10, y: -5, width: 10, height: 10};
  assert.ok(labelHitsBox({x: 8, y: 0, width: 6, height: 2, angle: 0}, rect));
  assert.ok(!labelHitsBox({x: 5, y: 0, width: 6, height: 2, angle: 0}, rect));
  assert.ok(labelHitsBox({x: 5, y: 0, width: 14, height: 2, angle: 30}, rect));
  assert.ok(!labelHitsBox({x: 5, y: 0, width: 6, height: 2, angle: 90}, rect));
});

it("placeLinkLabels — keeps labels clear of nodes and earlier labels", () => {
  const label = (id, x, y, angle = 0) => ({
    id,
    box: {x, y, width: 10, height: 4, angle},
  });
  const kept = placeLinkLabels(
    [
      label("first", 0, 0),
      label("overlaps first", 4, 1),
      label("on a node", 50, 0),
      label("in a node box", 0, 50),
      label("free", 0, 20),
      {id: "empty", box: {x: 0, y: 80, width: 0, height: 4, angle: 0}},
    ],
    {
      circles: [{x: 52, y: 0, r: 5}],
      boxes: [{x: -5, y: 45, width: 10, height: 10}],
    },
  );
  assert.deepStrictEqual(
    kept.map(l => l.id),
    ["first", "free"],
  );
  assert.deepStrictEqual(placeLinkLabels([label("a", 0, 0)], {}).length, 1);
  const turned = {x: 0, y: 0, width: 4, height: 40, angle: 30};
  assert.deepStrictEqual(
    placeLinkLabels([label("a", 0, 0), label("b", 0, 30)], {
      labels: [turned],
    }).map(l => l.id),
    ["b"],
    "other labels' boxes are obstacles too",
  );
});

it("ringsEdgeAnchor — a spline's curve midpoint, or a straight edge's run", () => {
  const spline = {
    spline: true,
    source: {id: "a", x: 0, y: 0},
    target: {id: "b", x: 10, y: 0},
    sourceX: 0,
    sourceY: 0,
    sourceBisectX: 0,
    sourceBisectY: 10,
    targetBisectX: 10,
    targetBisectY: 10,
    targetX: 10,
    targetY: 0,
  };
  const a = ringsEdgeAnchor(spline);
  close(a.x, 5, 1e-6);
  close(a.y, 7.5, 1e-6);
  close(a.angle, 0, 1e-6);
  const straight = ringsEdgeAnchor({
    source: {id: "a", x: 0, y: 0, r: 2},
    target: {id: "b", x: 0, y: 20, r: 6},
  });
  close(straight.x, 0);
  close(straight.y, 8);
  close(deg(straight.angle), 90);
});

it("sankeyLinkAnchor — the middle of a band", () => {
  const link = {
    source: {x1: 100},
    target: {x0: 300},
    y0: 50,
    y1: 150,
  };
  const a = sankeyLinkAnchor(link);
  close(a.x, 200, 1e-6);
  close(a.y, 100, 1e-6);
  assert.ok(a.angle > 0, "runs down toward the lower target");
  const level = sankeyLinkAnchor({...link, y1: 50});
  close(level.angle, 0, 1e-9);
  assert.strictEqual(sankeyLinkAnchor({source: {}, target: {}}), null);
});

it("arcLabelAnchor — the top of the arc, running with the line", () => {
  const arc = (orient, side) => ({
    arc: {from: 0, to: 100, base: 200, scale: 1, side, orient},
  });
  assert.deepStrictEqual(arcLabelAnchor(arc("horizontal", "above")), {
    x: 50,
    y: 150,
    angle: 0,
  });
  assert.deepStrictEqual(arcLabelAnchor(arc("horizontal", "below")), {
    x: 50,
    y: 250,
    angle: 0,
  });
  const vertical = arcLabelAnchor(arc("vertical", "above"));
  assert.deepStrictEqual([vertical.x, vertical.y], [250, 50]);
  close(vertical.angle, Math.PI / 2);
});
