import assert from "assert";
import {
  bandShades,
  baselineValue,
  bulletDomain,
  bulletExtent,
  domainFraction,
  fitAxis,
  growFrom,
  markerPoints,
  mergeExtents,
  normalizeBands,
  spanRect,
  ticksFit,
  trackPosition,
} from "../../es/src/charts/Bullet/bulletGeometry.js";
import {
  axisDepth,
  bulletStack,
  TICK_GAP,
  TICK_LENGTH,
} from "../../es/src/charts/Bullet/bulletLayout.js";
import {shadeBands} from "../../es/src/charts/Bullet/bulletStyle.js";

const close = (a, b, msg, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} ≈ ${b}`);

const horizontal = {
  orient: "horizontal",
  band: {x: 100, y: 20, width: 200, height: 40},
  domain: [0, 100],
};
const vertical = {
  orient: "vertical",
  band: {x: 50, y: 10, width: 30, height: 300},
  domain: [0, 100],
};

it("Bullet geometry: normalizeBands turns thresholds into bands and keeps band objects", () => {
  assert.deepStrictEqual(normalizeBands([60, 85]), [
    {max: 60},
    {max: 85},
    {},
  ]);
  assert.deepStrictEqual(
    normalizeBands([{max: 50, color: "red"}, {color: "green"}]),
    [{max: 50, color: "red"}, {color: "green"}],
    "objects pass through",
  );
  assert.deepStrictEqual(
    normalizeBands([40, {max: 70, color: "gold"}]),
    [{max: 40}, {max: 70, color: "gold"}, {}],
    "a list ending on a bounded band gets a closing band",
  );
  assert.deepStrictEqual(normalizeBands([NaN, null, 30]), [{max: 30}, {}]);
  assert.deepStrictEqual(normalizeBands(undefined), []);
  assert.deepStrictEqual(normalizeBands("60"), []);
  const input = [{max: 5}];
  normalizeBands(input)[0].max = 9;
  assert.strictEqual(input[0].max, 5, "input objects are not mutated");
});

it("Bullet geometry: bandShades steps from the darkest shade to the lightest", () => {
  assert.deepStrictEqual(bandShades(0), []);
  assert.deepStrictEqual(bandShades(1), [0.24]);
  const three = bandShades(3);
  assert.strictEqual(three.length, 3);
  close(three[0], 0.36, "first is darkest");
  close(three[1], 0.24, "middle");
  close(three[2], 0.12, "last is lightest");
  assert.deepStrictEqual(bandShades(2, 1, 0), [1, 0]);
});

it("Bullet geometry: shadeBands fills in colors only where a band has none", () => {
  const mix = t => `mix(${t.toFixed(2)})`;
  assert.deepStrictEqual(
    shadeBands([{max: 1}, {max: 2, color: "red"}, {}], mix),
    [{max: 1, color: "mix(0.36)"}, {max: 2, color: "red"}, {color: "mix(0.12)"}],
  );
  assert.deepStrictEqual(shadeBands([], mix), []);
});

it("Bullet geometry: bulletExtent collects finite values and band edges", () => {
  assert.deepStrictEqual(
    bulletExtent([72, NaN, 90], [{max: 60}, {min: 10, max: 120}], undefined),
    {extent: [10, 120], input: undefined},
  );
  assert.deepStrictEqual(bulletExtent([NaN], [], [0, 5]), {
    extent: [],
    input: [0, 5],
  });
});

it("Bullet geometry: mergeExtents widens the extent and keeps the first input", () => {
  const a = bulletExtent([5, 20], [], [0, undefined]);
  const b = bulletExtent([-3, 8], [], [1, 2]);
  assert.deepStrictEqual(mergeExtents(a, b), {
    extent: [-3, 20],
    input: [0, undefined],
  });
  assert.deepStrictEqual(mergeExtents(bulletExtent([], [], undefined), a).extent, [5, 20]);
});

it("Bullet geometry: bulletDomain nices to the tick count, includes zero, and keeps user ends", () => {
  assert.deepStrictEqual(bulletDomain(bulletExtent([73], [], undefined)), [0, 80]);
  assert.deepStrictEqual(bulletDomain(bulletExtent([324], [], undefined), 2), [0, 400]);
  assert.deepStrictEqual(bulletDomain(bulletExtent([-4.2, 3], [], undefined)), [-6, 4]);
  assert.deepStrictEqual(bulletDomain(bulletExtent([150], [], [0, 97])), [0, 97]);
  assert.deepStrictEqual(bulletDomain({extent: [], input: undefined}), [0, 1]);
});

it("Bullet geometry: ticksFit checks the gap between neighboring labels", () => {
  const ten = () => 10;
  assert.strictEqual(ticksFit([0, 50, 100], [0, 100], 100, ten, 8), true);
  assert.strictEqual(ticksFit([0, 50, 100], [0, 100], 30, ten, 8), false);
  assert.strictEqual(ticksFit([0], [0, 100], 1, ten, 8), true, "a single tick always fits");
});

it("Bullet geometry: fitAxis picks the densest ticks that fit and nices the domain to them", () => {
  const e = bulletExtent([324], [], undefined);
  const narrow = fitAxis(e, undefined, 150, () => 18);
  assert.deepStrictEqual(narrow.domain, [0, 400]);
  assert.deepStrictEqual(narrow.ticks, [0, 200, 400], "ends line up with the step");
  const wide = fitAxis(e, undefined, 700, () => 18);
  assert.deepStrictEqual(wide.domain, [0, 350]);
  assert.deepStrictEqual(wide.ticks, [0, 50, 100, 150, 200, 250, 300, 350]);
  const crowded = fitAxis(e, undefined, 700, () => 200);
  assert.ok(crowded.ticks.length < wide.ticks.length, "wide labels thin the ticks");
  const fixed = fitAxis(bulletExtent([10], [], [0, 100]), undefined, 400, () => 18);
  assert.deepStrictEqual(fixed.domain, [0, 100], "user ends are kept");
  assert.deepStrictEqual(fixed.ticks, [0, 20, 40, 60, 80, 100]);
});

it("Bullet geometry: fitAxis honors a tick count, a tick array, and false", () => {
  const e = bulletExtent([73], [], undefined);
  assert.deepStrictEqual(fitAxis(e, 2, 500, () => 10), {domain: [0, 100], ticks: [0, 50, 100]});
  assert.deepStrictEqual(fitAxis(e, [0, 25, 300, 75], 500, () => 10), {
    domain: [0, 80],
    ticks: [0, 25, 75],
  });
  assert.deepStrictEqual(fitAxis(e, false, 500, () => 10), {domain: [0, 80], ticks: []});
  const tiny = fitAxis(e, undefined, 0, () => 10);
  assert.deepStrictEqual(tiny.ticks, tiny.domain, "no room: just the ends");
});

it("Bullet geometry: domainFraction clamps to the domain", () => {
  close(domainFraction(25, [0, 100]), 0.25, "inside");
  assert.strictEqual(domainFraction(150, [0, 100]), 1);
  assert.strictEqual(domainFraction(-5, [0, 100]), 0);
  assert.strictEqual(domainFraction(NaN, [0, 100]), 0);
  assert.strictEqual(domainFraction(3, [3, 3]), 0, "empty domain");
  close(domainFraction(0, [-50, 50]), 0.5, "negative domain");
});

it("Bullet geometry: trackPosition grows rightward or upward", () => {
  assert.strictEqual(trackPosition(horizontal, 0), 100);
  assert.strictEqual(trackPosition(horizontal, 50), 200);
  assert.strictEqual(trackPosition(horizontal, 250), 300, "clamped");
  assert.strictEqual(trackPosition(vertical, 0), 310, "bottom");
  assert.strictEqual(trackPosition(vertical, 100), 10, "top");
});

it("Bullet geometry: baselineValue starts bars at zero, else the end nearest it", () => {
  assert.strictEqual(baselineValue([0, 100]), 0);
  assert.strictEqual(baselineValue([-5, 3]), 0);
  assert.strictEqual(baselineValue([20, 80]), 20);
  assert.strictEqual(baselineValue([-80, -20]), -20);
});

it("Bullet geometry: spanRect covers a value span, centered across the band", () => {
  assert.deepStrictEqual(spanRect(horizontal, 0, 50, 0.5), {
    x: 100,
    y: 30,
    width: 100,
    height: 20,
  });
  assert.deepStrictEqual(
    spanRect(horizontal, 50, 0, 1),
    {x: 100, y: 20, width: 100, height: 40},
    "order doesn't matter",
  );
  assert.deepStrictEqual(spanRect(vertical, 0, 50, 0.5), {
    x: 57.5,
    y: 160,
    width: 15,
    height: 150,
  });
  assert.strictEqual(spanRect(horizontal, 0, 50, 3).height, 40, "size clamps to the band");
});

it("Bullet geometry: markerPoints crosses the band at the value", () => {
  assert.deepStrictEqual(markerPoints(horizontal, 75, 0.5), [
    [250, 30],
    [250, 50],
  ]);
  assert.deepStrictEqual(markerPoints(vertical, 50, 1), [
    [50, 160],
    [80, 160],
  ]);
});

it("growFrom — collapses a rect onto the baseline at its full thickness", () => {
  const h = spanRect(horizontal, 20, 60, 0.5);
  assert.deepStrictEqual(growFrom(horizontal, 0, h), {...h, x: 100, width: 0});
  const v = spanRect(vertical, 20, 60, 0.5);
  assert.deepStrictEqual(growFrom(vertical, 0, v), {...v, y: 310, height: 0});
  // A domain spanning zero grows a negative bar back from zero, too.
  const signed = {...horizontal, domain: [-100, 100]};
  const neg = spanRect(signed, 0, -50, 1);
  assert.deepStrictEqual(growFrom(signed, 0, neg), {...neg, x: 200, width: 0});
});

const stack = (opts = {}) => ({
  orient: "horizontal",
  width: 600,
  height: 300,
  count: 3,
  bulletSize: 40,
  labelWidth: 80,
  labelHeight: 26,
  axis: "row",
  tickFontSize: 10,
  tickLabelWidth: 20,
  tickOverhang: [4, 10],
  ...opts,
});

it("Bullet layout: axisDepth is the tick mark, gap, and label", () => {
  assert.strictEqual(axisDepth(stack()), TICK_LENGTH + TICK_GAP + 10);
  assert.strictEqual(axisDepth(stack({orient: "vertical"})), TICK_LENGTH + TICK_GAP + 20);
  assert.strictEqual(axisDepth(stack({axis: false})), 0);
});

it("Bullet layout: bulletStack stacks horizontal rows with labels at the start", () => {
  const slots = bulletStack(stack());
  assert.strictEqual(slots.length, 3);
  const [a, b, c] = slots;
  assert.strictEqual(a.band.x, 2 + 80 + 12, "band starts after the label column");
  assert.strictEqual(a.band.x + a.band.width, 600 - 2 - 10, "room for the last tick label");
  assert.strictEqual(a.band.height, 40, "capped at bulletSize");
  assert.ok(b.band.y > a.band.y + a.band.height + axisDepth(stack()), "rows don't overlap");
  close(c.band.y - b.band.y, b.band.y - a.band.y, "even steps");
  const top = a.band.y;
  const bottom = c.band.y + c.band.height + axisDepth(stack());
  close(top - 0, 300 - bottom, "the stack is centered", 1e-6);
  assert.deepStrictEqual(a.label, {x: 82, y: a.band.y + 20, anchor: "end", maxWidth: 80});
  assert.ok(slots.every(s => s.axis), "each row has its axis");
  assert.strictEqual(a.hit.x, 0, "the hit area includes the label");
  assert.ok(a.hit.y + a.hit.height >= a.band.y + a.band.height + axisDepth(stack()));
});

it("Bullet layout: bulletStack shrinks bands to fit and shares one axis", () => {
  const tight = bulletStack(stack({height: 120, count: 4}));
  assert.ok(tight[0].band.height < 40, "bands thin out");
  assert.ok(tight[0].band.height >= 4);
  const shared = bulletStack(stack({axis: "shared"}));
  assert.deepStrictEqual(shared.map(s => s.axis), [false, false, true], "the last row labels the axis");
  const none = bulletStack(stack({axis: false, labelWidth: 0, labelHeight: 0}));
  assert.ok(none.every(s => !s.axis));
  assert.strictEqual(none[0].band.x, 2, "no labels: the band starts at the edge");
  assert.strictEqual(none[0].band.width, 596);
  const wideLabels = bulletStack(stack({labelWidth: 500}));
  assert.strictEqual(wideLabels[0].label.maxWidth, 210, "labels take at most 35% of the width");
});

it("Bullet layout: bulletStack lines up vertical columns with labels on top", () => {
  const slots = bulletStack(stack({orient: "vertical", width: 400, height: 300, count: 4}));
  assert.strictEqual(slots.length, 4);
  const [a, b] = slots;
  assert.strictEqual(a.band.width, b.band.width);
  assert.ok(b.band.x > a.band.x + a.band.width, "columns don't overlap");
  assert.strictEqual(a.band.y, 2 + 26 + 12 + 5, "below the label block and half a tick label");
  assert.strictEqual(a.band.y + a.band.height, 300 - 5 - 2);
  assert.strictEqual(a.label.anchor, "middle");
  close(a.label.x, a.band.x + a.band.width / 2, "label centered over the band");
  assert.ok(a.band.x - axisDepth(stack({orient: "vertical"})) >= 0, "axis fits to the left");
  const shared = bulletStack(stack({orient: "vertical", axis: "shared"}));
  assert.deepStrictEqual(shared.map(s => s.axis), [true, false, false], "the first column labels the axis");
});

it("Bullet layout: bulletStack places nothing without room or rows", () => {
  assert.deepStrictEqual(bulletStack(stack({count: 0})), []);
  assert.deepStrictEqual(bulletStack(stack({width: 0})), []);
  assert.deepStrictEqual(bulletStack(stack({height: -5})), []);
});
