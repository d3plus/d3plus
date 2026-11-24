import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scaleLog, scaleTime} from "d3-scale";
import {
  categoryDragAxis,
  clampValue,
  dragOptions,
  dragRange,
  invertPixel,
  keyValue,
  pixelOf,
  pixelPrecision,
  roundToPixel,
  snapToStep,
  valueAtPixel,
} from "../../src/charts/features/referenceDragValue.ts";
import {linkedValues} from "../../src/charts/Plot/valueColors.ts";

// Draggable reference annotations: the values a pixel or a key moves a
// line to, and the valueColors thresholds that name a line.

// y 0..50 drawn from 310 (bottom) up to 10.
const yScale = scaleLinear().domain([0, 50]).range([310, 10]);
const yAxis = {scale: v => yScale(v), domain: [0, 50]};

it("dragOptions: true takes the defaults, an object its bounds and step", () => {
  assert.deepStrictEqual(dragOptions(true), {});
  assert.strictEqual(dragOptions(false), null);
  assert.strictEqual(dragOptions(undefined), null);
  assert.deepStrictEqual(dragOptions({min: 5, max: new Date(10), step: 2}), {
    min: 5,
    max: 10,
    step: 2,
  });
  assert.deepStrictEqual(dragOptions({min: "a", step: -1}), {
    min: undefined,
    max: undefined,
    step: undefined,
  });
});

it("invertPixel: reads linear, log, and time axes, clamped to the domain", () => {
  assert.ok(Math.abs(invertPixel(yAxis, 160) - 25) < 1e-6);
  assert.strictEqual(invertPixel(yAxis, 400), 0, "below the plot");
  assert.strictEqual(invertPixel(yAxis, -5), 50, "above the plot");
  const log = scaleLog().domain([1, 1000]).range([0, 300]);
  assert.ok(
    Math.abs(invertPixel({scale: log, domain: [1, 1000]}, 200) - 100) < 1e-6,
  );
  const t0 = Date.UTC(2020, 0, 1),
    t1 = Date.UTC(2021, 0, 1);
  const time = scaleTime().domain([t0, t1]).range([0, 366]);
  const day = invertPixel({scale: time, domain: [t0, t1], time: true}, 31);
  assert.ok(Math.abs(day - Date.UTC(2020, 1, 1)) < 1000);
  assert.ok(Number.isNaN(invertPixel({scale: yScale, domain: [NaN, 1]}, 4)));
});

it("snapToStep: the nearest multiple, written to the step's decimals", () => {
  assert.strictEqual(snapToStep(12.3, 5), 10);
  assert.strictEqual(snapToStep(0.1 + 0.2, 0.1), 0.3);
  assert.strictEqual(snapToStep(7.13, 0.25), 7.25);
  assert.strictEqual(snapToStep(7.13, 0), 7.13, "no step");
  assert.strictEqual(snapToStep(1.23456e-7, 1e-7), 1e-7);
});

it("pixelPrecision and roundToPixel: about a pixel's worth of the axis", () => {
  // 300px for 50 units: a pixel is 1/6 of a unit, so tenths.
  assert.strictEqual(pixelPrecision(yAxis, 160), 0.1);
  assert.strictEqual(roundToPixel(yAxis, 25.4567, 160), 25.5);
  const t0 = new Date(2020, 0, 1),
    t1 = new Date(2022, 0, 1);
  const time = scaleTime().domain([t0, t1]).range([0, 300]);
  const axis = {scale: time, domain: [+t0, +t1], time: true};
  const rounded = new Date(roundToPixel(axis, +new Date(2020, 5, 3, 14), 120));
  assert.strictEqual(rounded.getHours(), 0, "a pixel spans days: whole days");
  assert.strictEqual(rounded.getDate(), 4);
});

it("dragRange and clampValue: the domain, narrowed by min and max", () => {
  assert.deepStrictEqual(dragRange(yAxis, {}), [0, 50]);
  assert.deepStrictEqual(dragRange(yAxis, {min: 10, max: 80}), [10, 50]);
  assert.deepStrictEqual(dragRange(yAxis, {min: 40, max: 20}), [0, 50]);
  assert.strictEqual(clampValue(-3, [0, 50]), 0);
  assert.strictEqual(clampValue(51, [0.5, 50.5], 2), 50, "a step inside");
  assert.strictEqual(clampValue(0, [0.5, 50.5], 2), 2);
  assert.strictEqual(clampValue(20, [0, 50], 2), 20);
});

it("valueAtPixel: snapped to the step, or a pixel's worth, inside the range", () => {
  assert.strictEqual(valueAtPixel(yAxis, 160, {step: 5}), 25);
  assert.strictEqual(valueAtPixel(yAxis, 157, {}), 25.5);
  assert.strictEqual(valueAtPixel(yAxis, 0, {max: 40}), 40);
  assert.ok(
    Number.isNaN(valueAtPixel({scale: yScale, domain: [NaN, 0]}, 2, {})),
  );
});

it("keyValue: arrows step, Page keys ten steps, Home and End the ends", () => {
  const at = {value: 25, px: 160};
  assert.strictEqual(keyValue("ArrowUp", yAxis, at, 300, {step: 1}), 26);
  assert.strictEqual(keyValue("ArrowLeft", yAxis, at, 300, {step: 1}), 24);
  assert.strictEqual(keyValue("PageUp", yAxis, at, 300, {step: 1}), 35);
  assert.strictEqual(keyValue("PageDown", yAxis, at, 300, {step: 2}), 6);
  assert.strictEqual(keyValue("Home", yAxis, at, 300, {min: 10}), 10);
  assert.strictEqual(keyValue("End", yAxis, at, 300, {}), 50);
  assert.strictEqual(keyValue("Enter", yAxis, at, 300, {}), null);
  // Without a step: a hundredth of the plot (3px, half a unit), upward on a
  // y axis whose pixels run down.
  assert.strictEqual(keyValue("ArrowUp", yAxis, at, 300, {}), 25.5);
  assert.strictEqual(keyValue("ArrowDown", yAxis, at, 300, {}), 24.5);
  assert.strictEqual(
    keyValue("ArrowUp", yAxis, {value: 50, px: 10}, 300, {}),
    50,
  );
});

it("pixelOf: a value's pixel, a date's time read as a date", () => {
  assert.strictEqual(pixelOf(yAxis, 25), 160);
  const t0 = Date.UTC(2020, 0, 1);
  const time = scaleTime()
    .domain([t0, t0 + 100])
    .range([0, 100]);
  const seen = [];
  pixelOf(
    {scale: v => (seen.push(v), time(v)), domain: [t0, t0 + 100], time: true},
    t0 + 50,
  );
  assert.ok(seen[0] instanceof Date);
});

it("categoryDragAxis: categories ordered so a rising value moves right or up", () => {
  const px = {a: 100, b: 200, c: 300};
  const across = categoryDragAxis(
    ["c", "a", "b", "z"],
    c => px[c] ?? NaN,
    false,
  );
  assert.deepStrictEqual(
    across.categories,
    ["a", "b", "c"],
    "unplaced dropped",
  );
  assert.deepStrictEqual(across.domain, [0, 2]);
  assert.strictEqual(across.scale(1), 200);
  assert.strictEqual(across.scale(1.5), 250, "between neighbors");
  assert.strictEqual(across.scale(9), 300, "clamped");
  // On a vertical axis pixels run down, so up is the smaller pixel.
  const up = categoryDragAxis(["a", "b", "c"], c => px[c], true);
  assert.deepStrictEqual(up.categories, ["c", "b", "a"]);
  assert.strictEqual(valueAtPixel(up, 190, {step: 1}), 1, "snaps to b");
  assert.strictEqual(
    keyValue("ArrowUp", up, {value: 1, px: 200}, 300, {step: 1}),
    2,
  );
  assert.strictEqual(
    categoryDragAxis(["a"], () => NaN, false),
    null,
  );
});

it("linkedValues: a line's id stands for its value", () => {
  const lines = [
    {y: 30, id: "target"},
    {x: new Date(5), id: "when"},
    {y: "mean", id: "avg"},
  ];
  assert.deepStrictEqual(linkedValues("target", lines), [30]);
  assert.deepStrictEqual(
    linkedValues([10, "target", "when"], lines),
    [10, 30, 5],
  );
  assert.deepStrictEqual(linkedValues(["avg", "missing", 4], lines), [4]);
  assert.strictEqual(linkedValues(20, lines), 20, "no names: as given");
  assert.strictEqual(linkedValues(true, lines), true);
  assert.deepStrictEqual(linkedValues("target", undefined), []);
});
