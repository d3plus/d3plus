import {it} from "vitest";
import assert from "assert";
import {
  axisMaxSize,
  pinMaxSize,
  resolveMaxSize,
} from "../../src/components/Axis/axisMaxSize.ts";

it("resolveMaxSize — a number is the limit itself", () => {
  assert.strictEqual(resolveMaxSize(120, 400), 120);
  assert.strictEqual(resolveMaxSize(0, 400), 0);
});

it("resolveMaxSize — a function is called with the size", () => {
  assert.strictEqual(
    resolveMaxSize(size => size / 4, 400),
    100,
  );
});

it("resolveMaxSize — unset stays unset", () => {
  assert.strictEqual(resolveMaxSize(undefined, 400), undefined);
});

it("axisMaxSize — reads a horizontal axis's height and a vertical axis's width", () => {
  const schema = {maxSize: size => size / 2, width: 600, height: 200};
  assert.strictEqual(axisMaxSize(schema, true), 100);
  assert.strictEqual(axisMaxSize(schema, false), 300);
});

it("axisMaxSize — passes a number or an unset limit through", () => {
  assert.strictEqual(
    axisMaxSize({maxSize: 80, width: 600, height: 200}, true),
    80,
  );
  assert.strictEqual(axisMaxSize({width: 600, height: 200}, false), undefined);
});

it("pinMaxSize — replaces a function with its limit for the size", () => {
  const axis = {schema: {maxSize: size => size / 2}};
  assert.strictEqual(pinMaxSize(axis, 500), axis, "returns the axis");
  assert.strictEqual(axis.schema.maxSize, 250);
});

it("pinMaxSize — leaves a number or an unset limit alone", () => {
  assert.strictEqual(
    pinMaxSize({schema: {maxSize: 80}}, 500).schema.maxSize,
    80,
  );
  const unset = pinMaxSize({schema: {}}, 500);
  assert.strictEqual(unset.schema.maxSize, undefined);
});
