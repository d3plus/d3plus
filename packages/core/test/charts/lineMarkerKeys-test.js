import {describe, it} from "vitest";
import assert from "node:assert";
import {lineMarkerKeys} from "../../src/charts/Plot/lineMarkerKeys.ts";

describe("lineMarkerKeys", () => {
  it("keys a marker by its series and discrete value", () => {
    const a = {id: "a", discrete: "2010", x: 2010, y: 1};
    const b = {id: "b", discrete: "2010", x: 2010, y: 2};
    const keys = lineMarkerKeys([a, b], "x");
    assert.strictEqual(keys.get(a), "a_2010");
    assert.strictEqual(keys.get(b), "b_2010");
  });

  it("keys by x/y position without a discrete axis", () => {
    const a = {id: "a", discrete: "undefined", x: 2, y: 11};
    const b = {id: "a", discrete: "undefined", x: 2.5, y: 6};
    const keys = lineMarkerKeys([a, b], undefined);
    assert.strictEqual(keys.get(a), "a_2_11");
    assert.strictEqual(keys.get(b), "a_2.5_6");
  });

  it("numbers a series' repeated positions", () => {
    const a = {id: "a", discrete: "5", x: 5, y: 2};
    const b = {id: "a", discrete: "5", x: 5, y: 5};
    const c = {id: "a", discrete: "5", x: 5, y: 9};
    const keys = lineMarkerKeys([a, b, c], "x");
    assert.deepStrictEqual(
      [a, b, c].map(d => keys.get(d)),
      ["a_5", "a_5_1", "a_5_2"],
    );
  });
});
