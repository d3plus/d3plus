import assert from "assert";
import {isSvgTarget} from "../es/src/saveElement.js";

it("isSvgTarget is true for an <svg> element", () => {
  assert.strictEqual(isSvgTarget({tagName: "svg"}), true);
});

it("isSvgTarget is case-insensitive", () => {
  assert.strictEqual(isSvgTarget({tagName: "SVG"}), true);
});

it("isSvgTarget is false for an HTML container", () => {
  assert.strictEqual(isSvgTarget({tagName: "div"}), false);
});

it("isSvgTarget is false for other svg-namespaced elements", () => {
  assert.strictEqual(isSvgTarget({tagName: "g"}), false);
});

it("isSvgTarget is false when tagName is missing", () => {
  assert.strictEqual(isSvgTarget({}), false);
});
