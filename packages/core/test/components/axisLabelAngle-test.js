import {it} from "vitest";
import assert from "assert";
import {
  axisCrossing,
  autoAngle,
  FLAT,
  normalizeAngle,
  rotatedTextAnchor,
  settingAngle,
  settingRotates,
  settingTurn,
  slantedDepth,
  slantedLabelBox,
  slantedReach,
  slantedWrapSize,
  slantsLabels,
} from "../../src/components/Axis/axisLabelAngle.ts";

/** #438: numeric `labelRotation` angles. */

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} ≈ ${b}`);

it("normalizeAngle — into [-90, 90], reading left to right", () => {
  assert.strictEqual(normalizeAngle(-45), -45);
  assert.strictEqual(normalizeAngle(30), 30);
  assert.strictEqual(normalizeAngle(90), 90);
  assert.strictEqual(normalizeAngle(-90), -90);
  assert.strictEqual(normalizeAngle(135), -45);
  assert.strictEqual(normalizeAngle(-135), 45);
  assert.strictEqual(normalizeAngle(180), 0);
  assert.strictEqual(normalizeAngle(270), -90);
  assert.strictEqual(normalizeAngle(315), -45);
  assert.strictEqual(normalizeAngle(-360), 0);
  assert.ok(Object.is(normalizeAngle(-180), 0), "no -0");
});

it("settingAngle / settingRotates — what a setting rotates by", () => {
  assert.strictEqual(settingAngle(true), -90);
  assert.strictEqual(settingAngle(undefined), -90, "automatic rotation");
  assert.strictEqual(settingAngle(-45), -45);
  assert.strictEqual(settingAngle(225), 45);
  assert.strictEqual(settingAngle(NaN), -90);
  assert.strictEqual(settingRotates(true), true);
  assert.strictEqual(settingRotates(false), false);
  assert.strictEqual(settingRotates(undefined), false);
  assert.strictEqual(settingRotates(-45), true);
  assert.strictEqual(settingRotates(0), false);
  assert.strictEqual(settingRotates(180), false);
  assert.strictEqual(settingRotates(Infinity), false);
});

it("slantsLabels — numbers lay out at their angle, except upright on a horizontal axis", () => {
  assert.strictEqual(slantsLabels(-45, true), true);
  assert.strictEqual(slantsLabels(30, false), true);
  assert.strictEqual(slantsLabels(-90, true), false, "drawn as `true` is");
  assert.strictEqual(slantsLabels(90, true), false);
  assert.strictEqual(slantsLabels(90, false), true, "along a vertical axis");
  assert.strictEqual(slantsLabels(true, true), false);
  assert.strictEqual(slantsLabels(true, false), false);
  assert.strictEqual(slantsLabels(0, true), false);
  assert.strictEqual(slantsLabels(undefined, true), false);
});

it("axisCrossing — the angle between the text and its axis", () => {
  close(axisCrossing(-45, true), Math.PI / 4);
  close(axisCrossing(30, true), Math.PI / 6);
  close(axisCrossing(30, false), Math.PI / 3);
  close(axisCrossing(90, false), 0);
  close(axisCrossing(-90, true), Math.PI / 2);
});

it("rotatedTextAnchor — the text end nearest the axis sits at the tick", () => {
  assert.strictEqual(rotatedTextAnchor("bottom", -45), "end");
  assert.strictEqual(rotatedTextAnchor("bottom", -90), "end");
  assert.strictEqual(rotatedTextAnchor("bottom", 30), "start");
  assert.strictEqual(rotatedTextAnchor("bottom", 90), "start");
  assert.strictEqual(rotatedTextAnchor("top", -45), "start");
  assert.strictEqual(rotatedTextAnchor("top", 45), "end");
  assert.strictEqual(rotatedTextAnchor("left", -45), "end");
  assert.strictEqual(rotatedTextAnchor("left", 30), "end");
  assert.strictEqual(rotatedTextAnchor("right", -45), "start");
  assert.strictEqual(rotatedTextAnchor("right", 90), "middle");
  assert.strictEqual(rotatedTextAnchor("left", -90), "middle");
});

it("slantedLabelBox — the anchored end at the tick, clear of the axis by the gap", () => {
  const width = 100,
    textHeight = 14,
    gap = 6;
  for (const [orient, angle] of [
    ["bottom", -45],
    ["bottom", 30],
    ["top", -45],
    ["top", 60],
    ["left", -45],
    ["left", 30],
    ["right", -30],
    ["right", 90],
  ]) {
    const box = slantedLabelBox(orient, angle, width, textHeight, 20, gap);
    assert.strictEqual(box.width, width);
    assert.strictEqual(box.height, 20);
    const horizontal = orient === "top" || orient === "bottom";
    const sign = orient === "bottom" || orient === "right" ? 1 : -1;
    // Distance of each corner out from the axis line.
    const out = box.corners.map(c => sign * (horizontal ? c.y : c.x));
    close(Math.min(...out), gap, `${orient} ${angle}: nearest corner`);
    close(
      Math.max(...out) - Math.min(...out),
      slantedDepth(angle, horizontal, width, textHeight),
      `${orient} ${angle}: depth`,
    );
    // The anchored end's midpoint lies across from the tick.
    const anchor = rotatedTextAnchor(orient, angle);
    const [c0, c1, c2, c3] = box.corners;
    const mid =
      anchor === "end"
        ? {x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2}
        : anchor === "start"
          ? {x: (c0.x + c3.x) / 2, y: (c0.y + c3.y) / 2}
          : {
              x: (c0.x + c1.x + c2.x + c3.x) / 4,
              y: (c0.y + c1.y + c2.y + c3.y) / 4,
            };
    close(horizontal ? mid.x : mid.y, 0, `${orient} ${angle}: at the tick`);
  }
});

it("slantedLabelBox — the box rotates about its center onto the corners", () => {
  const box = slantedLabelBox("bottom", -45, 80, 14, 14, 5);
  const cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  const t = (-45 * Math.PI) / 180;
  const rotate = (x, y) => ({
    x: cx + (x - cx) * Math.cos(t) - (y - cy) * Math.sin(t),
    y: cy + (x - cx) * Math.sin(t) + (y - cy) * Math.cos(t),
  });
  const corners = [
    rotate(box.x, box.y),
    rotate(box.x + box.width, box.y),
    rotate(box.x + box.width, box.y + box.height),
    rotate(box.x, box.y + box.height),
  ];
  corners.forEach((c, i) => {
    close(c.x, box.corners[i].x, `corner ${i} x`);
    close(c.y, box.corners[i].y, `corner ${i} y`);
  });
});

it("slantedReach — how far a label runs along the axis either side of its tick", () => {
  const [before, after] = slantedReach("bottom", -45, 100, 0);
  close(before, 100 * Math.SQRT1_2, "-45 runs back from its tick");
  close(after, 0);
  const [b2, a2] = slantedReach("bottom", 30, 100, 0);
  close(b2, 0);
  close(a2, 100 * Math.cos(Math.PI / 6), "30 runs on from its tick");
  const [b3, a3] = slantedReach("left", 90, 60, 14);
  close(b3, 30, "text along the axis centers on its tick");
  close(a3, 30);
});

it("slantedDepth — the text projected across the axis", () => {
  close(slantedDepth(-45, true, 100, 14), (100 + 14) * Math.SQRT1_2);
  close(slantedDepth(-90, true, 100, 14), 100);
  close(slantedDepth(90, false, 100, 14), 14, "along a vertical axis");
});

it("slantedWrapSize — long enough to reach the depth, thick enough for the spacing", () => {
  const size = slantedWrapSize(-45, true, 100, 40, 17);
  close(size.width, (100 - 17 * Math.SQRT1_2) / Math.SQRT1_2);
  close(size.height, 40 * Math.SQRT1_2);
  assert.strictEqual(
    slantedWrapSize(-10, true, 100, 20, 17).height,
    17,
    "at least one line",
  );
  assert.deepStrictEqual(
    slantedWrapSize(90, false, 120, 50, 17),
    {width: 50, height: 120},
    "text along the axis",
  );
  assert.strictEqual(slantedWrapSize(-45, true, 5, 40, 17).width, 0);
});

it("settingTurn — how a setting draws the labels before the layout decides", () => {
  assert.deepStrictEqual(settingTurn(undefined, true), FLAT);
  assert.deepStrictEqual(settingTurn(false, true), FLAT);
  assert.deepStrictEqual(settingTurn(0, true), FLAT);
  assert.deepStrictEqual(settingTurn(true, true), {
    rotate: true,
    angle: -90,
    slant: false,
  });
  assert.deepStrictEqual(settingTurn(-45, true), {
    rotate: true,
    angle: -45,
    slant: true,
  });
  assert.deepStrictEqual(settingTurn(-90, true), {
    rotate: true,
    angle: -90,
    slant: false,
  });
  assert.deepStrictEqual(settingTurn(90, false), {
    rotate: true,
    angle: 90,
    slant: true,
  });
});

it("autoAngle — crowded labels slant 30 degrees, mirrored on a top axis", () => {
  assert.strictEqual(autoAngle("bottom"), -30);
  assert.strictEqual(autoAngle("top"), 30);
});
