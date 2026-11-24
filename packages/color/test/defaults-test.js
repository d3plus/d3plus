import {it} from "vitest";
import assert from "assert";
import {default as defaults} from "../src/defaults.ts";

it("defaults — off, caution, and on make a traffic light", () => {
  assert.strictEqual(defaults.off, "#c92a2a");
  assert.strictEqual(defaults.caution, "#f08c00");
  assert.strictEqual(defaults.on, "#2b8a3e");
});

it("defaults — neutral is a light fill, starting as the light text color's gray", () => {
  assert.strictEqual(defaults.neutral, "#f8f9fa");
  assert.strictEqual(defaults.light, "#f8f9fa");
});
