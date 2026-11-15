import {it} from "vitest";
import assert from "assert";
import {bufferConfig} from "../../src/charts/plotBuffers/bufferConfig.ts";

/**
    `bufferConfig` hands a Plot buffer a shape's config with each accessor
    key's plain value wrapped as a constant.
*/

it("bufferConfig — wraps plain accessor values as constants", () => {
  const config = bufferConfig({
    width: 12,
    height: "8",
    r: 0,
    x: 3,
    y: 4,
    id: "a",
  });
  assert.strictEqual(config.width({}, 0), 12);
  assert.strictEqual(config.height({}, 0), "8");
  assert.strictEqual(config.r({}, 0), 0, "zero too");
  assert.strictEqual(config.x(), 3);
  assert.strictEqual(config.y(), 4);
  assert.strictEqual(config.id(), "a");
});

it("bufferConfig — keeps functions and every other key as given", () => {
  const width = d => d.w;
  const labelConfig = {fontSize: 12};
  const source = {width, curve: "linear", labelConfig, hitArea: false};
  const config = bufferConfig(source);
  assert.strictEqual(config.width, width);
  assert.strictEqual(config.curve, "linear");
  assert.strictEqual(config.labelConfig, labelConfig);
  assert.strictEqual(config.hitArea, false);
  assert.ok(!("height" in config), "adds no keys");
  assert.notStrictEqual(config, source, "a copy");
  assert.strictEqual(source.width, width, "the config is untouched");
  const plain = {width: 5};
  bufferConfig(plain);
  assert.strictEqual(plain.width, 5);
});

it("bufferConfig — undefined without a config", () => {
  assert.strictEqual(bufferConfig(undefined), undefined);
  assert.strictEqual(bufferConfig(null), undefined);
  assert.strictEqual(bufferConfig(12), undefined);
});
