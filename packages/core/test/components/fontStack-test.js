import {describe, it} from "vitest";
import assert from "assert";
import {fontStack} from "../../src/components/fontStack.ts";

const families = ["Inter", "Helvetica Neue", "Arial", "sans-serif"];

describe("fontStack", () => {
  it("starts at the measured family and keeps the ones after it", () => {
    assert.strictEqual(
      fontStack(families, "Helvetica Neue"),
      "'Helvetica Neue', 'Arial', sans-serif",
    );
    assert.strictEqual(
      fontStack(families, "Inter"),
      "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
    );
  });

  it("reads a CSS list, quoted or not", () => {
    assert.strictEqual(
      fontStack(`"Fira Sans", 'Helvetica Neue', serif`, "'Helvetica Neue'"),
      "'Helvetica Neue', serif",
    );
  });

  it("is the measured family alone when it ends the list", () => {
    assert.strictEqual(fontStack(families, "sans-serif"), "sans-serif");
  });

  it("puts a measured family that isn't listed first", () => {
    assert.strictEqual(
      fontStack(["Arial", "sans-serif"], "Georgia"),
      "'Georgia', 'Arial', sans-serif",
    );
  });

  it("is the whole list when no family was found", () => {
    assert.strictEqual(
      fontStack(["Fira Sans", "Futura"], false),
      "'Fira Sans', 'Futura'",
    );
  });
});
