import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {choiceOptions} from "../src/components/Playground/options.ts";

describe("choiceOptions", () => {
  it("adds false and true when the type takes a boolean", () => {
    assert.deepEqual(
      choiceOptions('boolean | "x" | "y" | "auto"', ["x", "y", "auto"]),
      [false, true, "x", "y", "auto"],
    );
  });

  it("keeps the options of a type without a boolean", () => {
    assert.deepEqual(choiceOptions('"svg" | "canvas"', ["svg", "canvas"]), [
      "svg",
      "canvas",
    ]);
  });

  it("lists each boolean once", () => {
    assert.deepEqual(choiceOptions('boolean | "auto"', [true, "auto"]), [
      false,
      true,
      "auto",
    ]);
  });
});
