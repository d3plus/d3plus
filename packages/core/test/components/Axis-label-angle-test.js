import {it} from "vitest";
import assert from "assert";
import {AxisBottom, AxisLeft, AxisRight, AxisTop} from "../../index.ts";
import {labelExtent} from "../../src/components/Axis/axisLabelThinning.ts";
import {labelDepth} from "../../src/components/Axis/axisLayoutLabels.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    #438: `labelRotation` takes a number of degrees. Labels slant at that
    angle, hang off the axis from the end nearest it, claim the room their
    slant needs, and thin by how close their slanted text runs.
*/

const names = [
  "Agriculture and Fishing",
  "Mining",
  "Manufacturing",
  "Electricity and Gas",
  "Construction",
  "Retail Trade",
  "Transportation",
];

const compute = (Type, rotation, size = [400, 200]) =>
  new Type()
    .renderMode("compute")
    .select(null)
    .width(size[0])
    .height(size[1])
    .scale("point")
    .domain(names)
    .labelRotation(rotation)
    .render();

/** The axis's tick label nodes, by text. */
function labels(axis) {
  const out = [];
  const walk = nodes =>
    nodes.forEach(n => {
      if (n.type === "text") out.push(n);
      if (n.children) walk(n.children);
    });
  walk(axis.toScene().children);
  return out;
}

it("labelRotation takes a number", () => {
  const axis = new AxisBottom();
  assert.strictEqual(axis.labelRotation(), undefined);
  assert.strictEqual(axis.labelRotation(-45), axis);
  assert.strictEqual(axis.labelRotation(), -45);
});

it("a number rotates the labels by that angle", () => {
  for (const angle of [-45, 30, 90, -60]) {
    const axis = compute(AxisBottom, angle);
    assert.strictEqual(axis._labelRotation, true, `${angle} rotates`);
    const rotations = labels(axis).map(n => n.transform.rotate);
    assert.ok(rotations.length >= 2, `${angle}: labels drawn`);
    assert.ok(
      rotations.every(r => r === angle),
      `${angle}: ${rotations}`,
    );
  }
  const turned = compute(AxisBottom, 135);
  assert.ok(
    labels(turned).every(n => n.transform.rotate === -45),
    "135 reads as -45",
  );
});

it("0 keeps the labels flat, and true/false/undefined are unchanged", () => {
  const flat = compute(AxisBottom, 0);
  assert.strictEqual(flat._labelRotation, false);
  assert.ok(labels(flat).every(n => !n.transform.rotate));
  const upright = compute(AxisBottom, true);
  assert.ok(labels(upright).every(n => n.transform.rotate === -90));
  // -90 is drawn exactly as `true` is.
  assert.deepStrictEqual(
    labels(compute(AxisBottom, -90)).map(n => n.transform),
    labels(upright).map(n => n.transform),
  );
  assert.deepStrictEqual(
    compute(AxisBottom, -90).outerBounds(),
    upright.outerBounds(),
  );
  assert.ok(labels(compute(AxisBottom, false)).every(n => !n.transform.rotate));
});

it("slanted labels anchor the end nearest the axis", () => {
  const anchor = (Type, angle) =>
    compute(
      Type,
      angle,
      [400, 400],
    ).schema.shapeConfig.labelConfig.textAnchor();
  assert.strictEqual(anchor(AxisBottom, -45), "end");
  assert.strictEqual(anchor(AxisBottom, 30), "start");
  assert.strictEqual(anchor(AxisBottom, 90), "start");
  assert.strictEqual(anchor(AxisBottom, true), "end");
  assert.strictEqual(anchor(AxisTop, -45), "start");
  assert.strictEqual(anchor(AxisTop, 45), "end");
  assert.strictEqual(anchor(AxisLeft, -45), "end");
  assert.strictEqual(anchor(AxisRight, 30), "start");
  assert.strictEqual(anchor(AxisLeft, 90), "middle");
});

it("a slanted label's depth is its text projected across the axis", () => {
  const slanted = compute(AxisBottom, -45);
  const upright = compute(AxisBottom, -90);
  const flat = compute(AxisBottom, false, [2000, 200]);
  assert.ok(
    slanted._labelSpace < upright._labelSpace,
    `-45 (${slanted._labelSpace}) is shallower than -90 (${upright._labelSpace})`,
  );
  assert.ok(
    slanted._labelSpace > flat._labelSpace,
    `and deeper than flat (${flat._labelSpace})`,
  );
});

it("a slanted label narrows the range on the side it runs toward", () => {
  const back = compute(AxisBottom, -45)._d3Scale.range();
  const on = compute(AxisBottom, 30)._d3Scale.range();
  const upright = compute(AxisBottom, -90)._d3Scale.range();
  assert.ok(back[0] > upright[0] + 30, `-45 leaves room before: ${back}`);
  assert.ok(on[1] < upright[1] - 30, `30 leaves room after: ${on}`);
  const left = compute(AxisLeft, -45, [260, 400])._d3Scale.range();
  const right = compute(AxisRight, -45, [260, 400])._d3Scale.range();
  const flatLeft = compute(AxisLeft, false, [260, 400])._d3Scale.range();
  const flatRight = compute(AxisRight, false, [260, 400])._d3Scale.range();
  assert.ok(
    left[1] < flatLeft[1] - 25,
    `a left axis's -45 labels run down past the last tick: ${left}`,
  );
  assert.ok(
    right[0] > flatRight[0] + 25,
    `a right axis's run up past the first: ${right}`,
  );
});

it("slanted labels thin where their slanted text would touch", () => {
  const many = Array.from({length: 40}, (_, i) => `Category ${i + 1}`);
  const axis = new AxisBottom()
    .renderMode("compute")
    .select(null)
    .width(400)
    .height(200)
    .scale("point")
    .domain(many)
    .labelRotation(-45)
    .render();
  const shown = labels(axis).length;
  assert.ok(shown > 5 && shown < 40, `${shown} of 40 shown`);
});

it("labelExtent / labelDepth — a slanted label's footprint", () => {
  const datum = {
    angle: -45,
    slant: true,
    fP: 5,
    fS: 12,
    height: 22,
    lineHeight: 17,
    lines: ["Manufacturing"],
    rotate: true,
    width: 80,
  };
  assert.ok(Math.abs(labelExtent(datum, true) - 12 / Math.SQRT1_2) < 1e-9);
  assert.strictEqual(
    labelExtent({...datum, angle: 90}, false),
    80,
    "text along a vertical axis spans its width",
  );
  assert.ok(
    Math.abs(labelDepth(datum, true) - ((80 + 17) * Math.SQRT1_2 + 5)) < 1e-9,
  );
  assert.ok(
    Math.abs(labelDepth(datum, false) - (80 + 17) * Math.SQRT1_2) < 1e-9,
    "no padding on a vertical axis",
  );
  assert.strictEqual(
    labelDepth({...datum, slant: false}, true),
    80,
    "an upright label's depth is its width",
  );
});

it("_labelOverflow — how far slanted labels reach past a fixed range", () => {
  const fixed = new AxisLeft()
    .renderMode("compute")
    .select(null)
    .width(260)
    .height(400)
    .scale("point")
    .domain(names)
    .range([10, 390])
    .labelRotation(-45)
    .render();
  const [before, after] = fixed._labelOverflow;
  assert.strictEqual(before, 0, "-45 labels on a left axis run down");
  assert.ok(after > 20, `the last label reaches past the range: ${after}`);
  const free = compute(AxisLeft, -45, [260, 400]);
  const end = Math.max(...free._d3Scale.range());
  assert.ok(
    free._labelOverflow[1] <= 400 - end,
    `a free range narrows so they end inside the axis: ${free._labelOverflow[1]} <= ${400 - end}`,
  );
  assert.deepStrictEqual(compute(AxisBottom, true)._labelOverflow, [0, 0]);
});
