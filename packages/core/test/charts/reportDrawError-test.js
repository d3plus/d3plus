import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {
  chartName,
  reportDrawError,
} from "../../src/charts/viz/reportDrawError.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

it("chartName: reads the class's _displayName, then its name", () => {
  class Minified {
    static _displayName = "Treemap";
  }
  class Named {}
  assert.strictEqual(chartName(new Minified()), "Treemap");
  assert.strictEqual(chartName(new Named()), "Named");
  assert.strictEqual(chartName(Object.create(null, {})), "chart");
});

it("reportDrawError: logs the chart's name and the error itself", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  class Treemap {
    static _displayName = "Treemap";
  }
  const error = new Error("label blew up");
  reportDrawError(new Treemap(), error);
  assert.deepStrictEqual(spy.mock.calls, [
    ["d3plus: Treemap could not draw.", error],
  ]);
});
