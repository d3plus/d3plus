import {it} from "vitest";
import assert from "assert";
import {
  labelMisses,
  rotatesLabels,
} from "../../src/components/Axis/axisLayout.ts";
import {
  regrowShown,
  thinEvenly,
  thinForLines,
} from "../../src/components/Axis/axisLabelThinning.ts";
import {isDiscreteScale} from "../../src/components/Axis/axisLayoutLabels.ts";
import {buildTickFormat} from "../../src/components/Axis/axisLayoutScale.ts";

/** A measured horizontal label `width` wide, centered at `position`. */
const label = (i, position, width) => ({
  d: `L${i}`,
  i,
  fP: 5,
  fS: 12,
  height: 22,
  lineHeight: 16.8,
  lines: ["x"],
  rotate: false,
  width,
  position,
  fits: true,
});

const hiddenOf = textData => textData.filter(t => t.truncated).map(t => t.i);

it("isDiscreteScale — band, ordinal and point scales label every category", () => {
  for (const scale of ["band", "ordinal", "point"])
    assert.strictEqual(isDiscreteScale(scale), true, scale);
  for (const scale of ["linear", "log", "sqrt", "time"])
    assert.strictEqual(isDiscreteScale(scale), false, scale);
});

it("thinEvenly — keeps every label that fits side by side", () => {
  const textData = Array.from({length: 6}, (_, i) => label(i, i * 50, 30));
  thinEvenly(textData, true);
  assert.deepStrictEqual(hiddenOf(textData), []);
});

it("thinEvenly — hides labels at the shortest regular interval that clears them", () => {
  // 50px apart, 60px wide: neighbors crowd, every second label clears.
  const pairs = Array.from({length: 7}, (_, i) => label(i, i * 50, 60));
  thinEvenly(pairs, true);
  assert.deepStrictEqual(hiddenOf(pairs), [1, 3, 5]);

  // 30px apart, 70px wide: every second still crowds (60 < 70 + 5), every third clears.
  const thirds = Array.from({length: 8}, (_, i) => label(i, i * 30, 70));
  thinEvenly(thirds, true);
  assert.deepStrictEqual(hiddenOf(thirds), [1, 2, 4, 5, 7]);
});

it("thinEvenly — one wide label sets the interval for all of them", () => {
  // Only label 3 crowds its neighbors, yet the whole axis thins evenly
  // instead of leaving one irregular gap.
  const textData = Array.from({length: 8}, (_, i) =>
    label(i, i * 50, i === 3 ? 80 : 30),
  );
  thinEvenly(textData, true);
  assert.deepStrictEqual(hiddenOf(textData), [1, 3, 5, 7]);
});

it("thinEvenly — spaces labels stacked across a vertical axis by their glyphs", () => {
  // One-line labels span their 12px font size along a vertical axis.
  const textData = Array.from({length: 6}, (_, i) => ({
    ...label(i, i * 14, 200),
  }));
  thinEvenly(textData, false);
  assert.deepStrictEqual(hiddenOf(textData), [1, 3, 5]);
});

it("rotatesLabels — only an axis of named categories rotates on its own", () => {
  const band = {schema: {scale: "band"}};
  assert.strictEqual(rotatesLabels(band, ["Tokyo", "Delhi"]), true);
  assert.strictEqual(
    rotatesLabels({schema: {scale: "point"}}, ["Tokyo", "Delhi"]),
    true,
  );
  assert.strictEqual(
    rotatesLabels(band, [2001, 2002]),
    false,
    "numbers read in sequence",
  );
  assert.strictEqual(
    rotatesLabels(band, ["2001", "2002"]),
    false,
    "numeric strings too",
  );
  assert.strictEqual(
    rotatesLabels(band, [new Date(2001, 0, 1)]),
    false,
    "dates too",
  );
  assert.strictEqual(
    rotatesLabels({schema: {scale: "linear"}}, ["Tokyo"]),
    false,
    "continuous scales thin",
  );
  const names = new Map([
    [5, "Tokyo"],
    [15, "Delhi"],
  ]);
  const spans = {schema: {scale: "linear", labels: [5, 15]}};
  assert.strictEqual(
    rotatesLabels(spans, [5, 15], d => names.get(d)),
    true,
    "a continuous axis labeled at given values with names rotates",
  );
  assert.strictEqual(
    rotatesLabels(spans, [5, 15], d => `${d}`),
    false,
    "numbered ones thin",
  );
  assert.strictEqual(
    rotatesLabels({schema: {scale: "linear"}}, [5, 15], d => names.get(d)),
    false,
    "ticks the axis picked itself thin",
  );
});

it("buildTickFormat — rotated labels read rotatedTickFormat, as the rotation stands at each call", () => {
  const axis = {
    _labelRotation: false,
    schema: {
      scale: "linear",
      tickFormat: d => `Region ${d}\n50%`,
      rotatedTickFormat: d => `Region ${d}`,
    },
  };
  const format = buildTickFormat(axis, {}, () => []);
  assert.strictEqual(format(1), "Region 1\n50%");
  axis._labelRotation = true;
  assert.strictEqual(
    format(1),
    "Region 1",
    "the same formatter follows the rotation",
  );
  axis._labelRotation = false;
  assert.strictEqual(format(1), "Region 1\n50%");
  const plain = {
    _labelRotation: true,
    schema: {scale: "linear", tickFormat: d => `Region ${d}\n50%`},
  };
  assert.strictEqual(
    buildTickFormat(plain, {}, () => [])(1),
    "Region 1\n50%",
    "tickFormat alone formats rotated labels too",
  );
});

it("labelMisses — counts labels cut short or hidden", () => {
  const textData = [
    {fits: true, truncated: false},
    {fits: false, truncated: false},
    {fits: true, truncated: true},
    {fits: false, truncated: true},
  ];
  assert.strictEqual(labelMisses(textData), 3);
  assert.strictEqual(labelMisses([{fits: true, truncated: false}]), 0);
});

/** A measured label stacked across a vertical axis, `lines` long, at `position`. */
const stacked = (i, position, fits = false) => ({
  ...label(i, position, 90),
  fits,
  space: 40,
  lines: ["x", "x"],
});

it("regrowShown — labels left shown take the room the hidden ones leave", () => {
  // Ticks 25px apart; every second label hidden, so the shown ones sit 50
  // apart: up to their 5px padding short of each other.
  const textData = [0, 1, 2, 3, 4].map(i => stacked(i, 50 + i * 25));
  textData.forEach(t => (t.truncated = t.i % 2 === 1));
  const rooms = [];
  regrowShown(
    textData,
    (d, space) => {
      rooms.push([d.i, space]);
      return Object.assign(d, {space});
    },
    [0, 200],
  );
  // The end labels are also held to twice their distance to the axis ends.
  assert.deepStrictEqual(rooms, [
    [0, 45],
    [2, 45],
    [4, 45],
  ]);
});

it("regrowShown — leaves labels alone when none is hidden, or when they fit", () => {
  const all = [0, 1, 2].map(i => stacked(i, 50 + i * 50));
  regrowShown(all, () => assert.fail("nothing hidden"), [0, 200]);
  const fitting = [0, 1, 2].map(i => stacked(i, 50 + i * 25, true));
  fitting[1].truncated = true;
  regrowShown(fitting, () => assert.fail("they fit"), [0, 200]);
});

it("regrowShown — never less room than a label had, nor past an end of the axis", () => {
  // Shown labels 60 apart, but the first sits 10px from the start of the
  // axis: it keeps the 40px it had rather than shrink to 2 × 10 − 5.
  const textData = [10, 40, 70].map((position, i) => stacked(i, position));
  textData[1].truncated = true;
  const rooms = [];
  regrowShown(
    textData,
    (d, space) => {
      rooms.push([d.i, space]);
      return d;
    },
    [0, 100],
  );
  // The last label: min(60 apart, 2 × 30 to the end) − 5 = 55.
  assert.deepStrictEqual(rooms, [[2, 55]]);
});

/**
    Five labels 25px apart, each measured at a line per 15px of room (up to
    six), fitting whole in `whole` px: as `thinForLines` sees a bucketed
    color scale's.
*/
const buckets = whole => {
  const textData = [0, 1, 2, 3, 4].map(i => ({
    ...stacked(i, 50 + i * 25),
    space: 20,
    lines: ["x"],
  }));
  const resize = (d, space) =>
    Object.assign(d, {
      space,
      lines: Array(Math.min(6, Math.floor(space / 15))).fill("x"),
      fits: space >= whole,
    });
  return {textData, resize};
};
const shownOf = textData => textData.filter(t => !t.truncated).map(t => t.i);

it("thinForLines — hides labels until the ones shown fit whole, keeping the first and last", () => {
  // Every other label leaves 45px (3 lines); first and last alone, 95px.
  const {textData, resize} = buckets(90);
  thinForLines(textData, resize, 20);
  assert.deepStrictEqual(shownOf(textData), [0, 4]);
  assert.deepStrictEqual(
    textData.filter(t => !t.truncated).map(t => t.space),
    [95, 95],
    "measured in the room between them",
  );
});

it("thinForLines — hides no more labels than fitting whole takes", () => {
  const {textData, resize} = buckets(45);
  thinForLines(textData, resize, 20);
  assert.deepStrictEqual(shownOf(textData), [0, 2, 4]);
});

it("thinForLines — with none fitting whole, the most lines for the labels shown", () => {
  // Never whole: first and last alone take 6 lines, every other one 3.
  const {textData, resize} = buckets(Infinity);
  thinForLines(textData, resize, 20);
  assert.deepStrictEqual(shownOf(textData), [0, 4]);
});

it("thinForLines — keeps labels that already fit whole, or too few to thin", () => {
  const fitting = buckets(10);
  fitting.textData.forEach(t => (t.fits = true));
  thinForLines(fitting.textData, () => assert.fail("they fit"), 20);
  assert.deepStrictEqual(shownOf(fitting.textData), [0, 1, 2, 3, 4]);
  const two = buckets(90);
  const pair = two.textData.slice(0, 2);
  thinForLines(pair, () => assert.fail("too few"), 20);
  assert.deepStrictEqual(shownOf(pair), [0, 1]);
});

it("thinForLines — leaves the labels shown as they are when hiding more gains no line", () => {
  // Lines capped at one: thinning buys nothing.
  const {textData} = buckets(Infinity);
  const flat = (d, space) =>
    Object.assign(d, {space, lines: ["x"], fits: false});
  thinForLines(textData, flat, 20);
  assert.deepStrictEqual(shownOf(textData), [0, 1, 2, 3, 4]);
});
