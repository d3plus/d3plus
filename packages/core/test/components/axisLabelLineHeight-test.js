import {it} from "vitest";
import assert from "assert";
import {AxisLeft} from "../../index.ts";
import TextBox from "../../src/components/TextBox.ts";
import {measureAxis} from "../../src/components/Axis/axisLimit.ts";
import {labelLineHeight} from "../../src/components/Axis/axisLabelLineHeight.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    Axis labels are measured with the line height they are painted with:
    the label config's `lineHeight`, else the shape config's, else 1.2 times
    the font size, as the label's TextBox draws it by default.
*/

it("labelLineHeight — 1.2 times the font size by default, as TextBox draws", () => {
  assert.strictEqual(labelLineHeight({}, 5, 0, 12), 12 * 1.2);
  assert.strictEqual(labelLineHeight(undefined, 5, 0, 20), 20 * 1.2);
  const box = new TextBox().fontSize(12);
  assert.strictEqual(
    labelLineHeight({}, 5, 0, 12),
    box.schema.lineHeight({}, 0),
    "TextBox's default for 12px text",
  );
});

it("labelLineHeight — reads the font size from the label config when not given", () => {
  assert.strictEqual(labelLineHeight({labelConfig: {fontSize: 10}}, 5, 0), 12);
  assert.strictEqual(
    labelLineHeight({labelConfig: {fontSize: d => d * 2}}, 5, 0),
    12,
    "a fontSize accessor gets the tick",
  );
  assert.strictEqual(labelLineHeight({}, 5, 0), 12 * 1.2, "12px by default");
});

it("labelLineHeight — the label config's lineHeight, then the shape config's", () => {
  assert.strictEqual(
    labelLineHeight({labelConfig: {lineHeight: 20}}, 5, 0, 12),
    20,
  );
  assert.strictEqual(labelLineHeight({lineHeight: 18}, 5, 0, 12), 18);
  assert.strictEqual(
    labelLineHeight({labelConfig: {lineHeight: 20}, lineHeight: 18}, 5, 0, 12),
    20,
    "the label config wins",
  );
  const calls = [];
  const lineHeight = (d, i) => (calls.push([d, i]), 10 + i);
  assert.strictEqual(labelLineHeight({lineHeight}, "a", 3, 12), 13);
  assert.deepStrictEqual(calls, [["a", 3]], "accessors get the tick and index");
});

it("labelLineHeight — a missing or unusable line height falls back to the default", () => {
  for (const lineHeight of [0, -4, NaN, "16px", () => undefined])
    assert.strictEqual(
      labelLineHeight({labelConfig: {lineHeight}}, 5, 0, 10),
      12,
      String(lineHeight),
    );
});

const names = [
  "Agriculture, Forestry, Fishing and Hunting",
  "Health Care and Social Assistance",
  "Arts, Entertainment, and Recreation",
];

const axis = config =>
  new AxisLeft()
    .renderMode("compute")
    .select(null)
    .width(400)
    .height(300)
    .scale("point")
    .domain(names)
    .config(config)
    .render();

/** Each painted label's line height and line count, by text. */
const painted = a =>
  a._tickShape._labelClass._textData().map(t => [t.data.data.id, t.lH]);

it("an axis measures and paints its labels at one line height", () => {
  for (const [config, expected] of [
    [{}, 12 * 1.2],
    [{shapeConfig: {labelConfig: {lineHeight: 19}}}, 19],
    [{shapeConfig: {lineHeight: () => 21}}, 21],
    [{shapeConfig: {labelConfig: {fontSize: 15}}}, 15 * 1.2],
  ]) {
    const a = axis(config);
    const {textData} = measureAxis(a);
    assert.deepStrictEqual(
      textData.map(t => t.lineHeight),
      names.map(() => expected),
      `${JSON.stringify(config)} measures`,
    );
    assert.deepStrictEqual(
      painted(a),
      names.map(n => [n, expected]),
      `${JSON.stringify(config)} paints`,
    );
  }
});
