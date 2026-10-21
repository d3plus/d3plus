import {it} from "vitest";
import assert from "assert";
import {labelMisses, rotatesLabels} from "../../src/components/Axis/axisLayout.ts";
import {isDiscreteScale, thinEvenly} from "../../src/components/Axis/axisLayoutLabels.ts";
import {buildTickFormat} from "../../src/components/Axis/axisLayoutScale.ts";

/** A measured horizontal label `width` wide, centered at `position`. */
const label = (i, position, width) =>
  ({d: `L${i}`, i, fP: 5, fS: 12, height: 22, lineHeight: 16.8, lines: ["x"], rotate: false, width, position, fits: true});

const hiddenOf = textData => textData.filter(t => t.truncated).map(t => t.i);

it("isDiscreteScale — band, ordinal and point scales label every category", () => {
  for (const scale of ["band", "ordinal", "point"]) assert.strictEqual(isDiscreteScale(scale), true, scale);
  for (const scale of ["linear", "log", "sqrt", "time"]) assert.strictEqual(isDiscreteScale(scale), false, scale);
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
  const textData = Array.from({length: 8}, (_, i) => label(i, i * 50, i === 3 ? 80 : 30));
  thinEvenly(textData, true);
  assert.deepStrictEqual(hiddenOf(textData), [1, 3, 5, 7]);
});

it("thinEvenly — spaces labels stacked across a vertical axis by their glyphs", () => {
  // One-line labels span their 12px font size along a vertical axis.
  const textData = Array.from({length: 6}, (_, i) => ({...label(i, i * 14, 200)}));
  thinEvenly(textData, false);
  assert.deepStrictEqual(hiddenOf(textData), [1, 3, 5]);
});

it("rotatesLabels — only an axis of named categories rotates on its own", () => {
  const band = {schema: {scale: "band"}};
  assert.strictEqual(rotatesLabels(band, ["Tokyo", "Delhi"]), true);
  assert.strictEqual(rotatesLabels({schema: {scale: "point"}}, ["Tokyo", "Delhi"]), true);
  assert.strictEqual(rotatesLabels(band, [2001, 2002]), false, "numbers read in sequence");
  assert.strictEqual(rotatesLabels(band, ["2001", "2002"]), false, "numeric strings too");
  assert.strictEqual(rotatesLabels(band, [new Date(2001, 0, 1)]), false, "dates too");
  assert.strictEqual(rotatesLabels({schema: {scale: "linear"}}, ["Tokyo"]), false, "continuous scales thin");
  const names = new Map([[5, "Tokyo"], [15, "Delhi"]]);
  const spans = {schema: {scale: "linear", labels: [5, 15]}};
  assert.strictEqual(rotatesLabels(spans, [5, 15], d => names.get(d)), true,
    "a continuous axis labeled at given values with names rotates");
  assert.strictEqual(rotatesLabels(spans, [5, 15], d => `${d}`), false, "numbered ones thin");
  assert.strictEqual(rotatesLabels({schema: {scale: "linear"}}, [5, 15], d => names.get(d)), false,
    "ticks the axis picked itself thin");
});

it("buildTickFormat — rotated labels read rotatedTickFormat, as the rotation stands at each call", () => {
  const axis = {
    _labelRotation: false,
    schema: {scale: "linear", tickFormat: d => `Region ${d}\n50%`, rotatedTickFormat: d => `Region ${d}`},
  };
  const format = buildTickFormat(axis, {}, () => []);
  assert.strictEqual(format(1), "Region 1\n50%");
  axis._labelRotation = true;
  assert.strictEqual(format(1), "Region 1", "the same formatter follows the rotation");
  axis._labelRotation = false;
  assert.strictEqual(format(1), "Region 1\n50%");
  const plain = {_labelRotation: true, schema: {scale: "linear", tickFormat: d => `Region ${d}\n50%`}};
  assert.strictEqual(buildTickFormat(plain, {}, () => [])(1), "Region 1\n50%", "tickFormat alone formats rotated labels too");
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
