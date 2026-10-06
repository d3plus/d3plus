import assert from "assert";
import {textureFill, paintFromShapeConfig} from "../../es/src/charts/features/emitHelpers.js";
import it from "../jsdom.js";

it("textureFill: returns a string fill when no texture is set", () => {
  assert.strictEqual(textureFill({}, {id: "a"}, 0, "red"), "red");
  assert.strictEqual(textureFill({}, {id: "a"}, 0, {not: "a string"}), undefined);
});

it("textureFill: returns a pattern token built from the datum's fill and stroke", () => {
  const sc = {texture: d => (d.id === "a" ? "lines" : false), stroke: () => "blue"};
  const a = textureFill(sc, {id: "a"}, 0, "red");
  assert.ok(a.startsWith("pattern:"));
  const cfg = JSON.parse(a.slice("pattern:".length));
  assert.strictEqual(cfg.background, "red");
  assert.strictEqual(cfg.stroke, "blue");
  assert.strictEqual(textureFill(sc, {id: "b"}, 1, "red"), "red");
});

it("textureFill: applies textureDefault", () => {
  const sc = {texture: "lines", textureDefault: {size: 6}};
  const cfg = JSON.parse(textureFill(sc, {id: "a"}, 0, "red").slice("pattern:".length));
  assert.strictEqual(cfg.size, 6);
});

it("paintFromShapeConfig: resolves a texture into the fill", () => {
  const paint = paintFromShapeConfig({fill: "red", stroke: "blue", texture: "lines"}, {id: "a"}, 0);
  assert.ok(paint.fill.startsWith("pattern:"));
});

it("textureFill: leaves an unfilled link path unfilled", () => {
  assert.strictEqual(textureFill({texture: "lines"}, {id: "a"}, 0, "none"), "none");
});
