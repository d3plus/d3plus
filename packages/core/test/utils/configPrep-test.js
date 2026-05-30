import assert from "assert";
import {default as configPrep} from "../../es/src/utils/configPrep.js";

it("configPrep", () => {
  // minimal context that configPrep expects as `this`
  const ctx = {
    schema: {
      shapeConfig: {
        fill: "red",
        opacity: d => d.value,
        on: {"click.shape": () => "clicked"},
        label: {fontColor: "black"},
        points: [[0, 0], [1, 1]],
      },
      duration: 200,
      on: {
        "click": () => "global click",
        "mouseleave.shape": () => "leave",
        "click.legend": () => "legend click",
      },
    },
  };

  const result = configPrep.call(ctx);

  assert.strictEqual(result.duration, 200, "duration passed through");
  assert.strictEqual(result.fill, "red", "simple values passed through");
  assert.ok(typeof result.opacity === "function", "functions are wrapped");
  assert.ok(typeof result.on === "object", "on events parsed");
  assert.ok(typeof result.on["click"] === "function", "global click event included");
  assert.ok(typeof result.on["mouseleave.shape"] === "function", "namespaced shape event included");
  assert.strictEqual(result.on["click.legend"], undefined, "non-matching namespace excluded");
  assert.ok(typeof result.label === "object", "nested objects preserved");
  assert.ok(Array.isArray(result.points), "arrays preserved");

  // test with nest parameter
  const ctxWithNest = {
    schema: {
      shapeConfig: {
        fill: "blue",
        Rect: {fill: "green", on: {"click.shape": () => "rect click"}},
      },
      duration: 100,
      on: {},
    },
  };
  const nested = configPrep.call(ctxWithNest, ctxWithNest.schema.shapeConfig, "shape", "Rect");
  assert.strictEqual(nested.fill, "green", "nested config overrides parent");

  // test wrapFunction unwraps __d3plus__ wrapper objects
  const ctxWrap = {
    schema: {
      shapeConfig: {accessor: d => d.name},
      duration: 0,
      on: {},
    },
  };
  const wrapped = configPrep.call(ctxWrap);
  const d3plusObj = {__d3plus__: true, data: {name: "test"}, i: 0};
  assert.strictEqual(wrapped.accessor(d3plusObj, 0), "test", "unwraps __d3plus__ objects");

  // simple data passes through
  assert.strictEqual(wrapped.accessor({name: "direct"}, 0), "direct", "plain objects pass through");
});
