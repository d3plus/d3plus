import assert from "assert";
import {color} from "d3-color";
import {textureKey} from "../../es/src/shapes/textureKey.js";
import {Rect} from "../../es/index.js";
import it from "../jsdom.js";

const parse = key => JSON.parse(key);

it("textureKey: no texture returns false", () => {
  assert.strictEqual(textureKey(false, () => "red", () => "blue"), false);
  assert.strictEqual(textureKey(undefined, () => "red", () => "blue"), false);
});

it("textureKey: a name defaults background to fill and lines to stroke", () => {
  const cfg = parse(textureKey("lines", () => "red", () => "blue"));
  assert.strictEqual(cfg.texture, "lines");
  assert.strictEqual(cfg.background, "red");
  assert.strictEqual(cfg.stroke, "blue");
  assert.strictEqual(cfg.fill, "blue");
});

it("textureKey: path names and grid map to their textures.js generators", () => {
  const paths = parse(textureKey("hexagons", () => "red", () => "blue"));
  assert.strictEqual(paths.texture, "paths");
  assert.strictEqual(paths.d, "hexagons");
  assert.strictEqual(paths.fill, undefined);
  const grid = parse(textureKey("grid", () => "red", () => "blue"));
  assert.strictEqual(grid.texture, "lines");
  assert.deepStrictEqual(grid.orientation, ["vertical", "horizontal"]);
});

it("textureKey: d3-color objects serialize as CSS color strings", () => {
  const cfg = parse(
    textureKey("lines", () => color("red"), () => color("blue").darker(0.25)),
  );
  assert.strictEqual(cfg.background, "rgb(255, 0, 0)");
  assert.strictEqual(typeof cfg.stroke, "string");
  assert.strictEqual(cfg.stroke, color("blue").darker(0.25).toString());
  assert.strictEqual(cfg.fill, cfg.stroke);
});

it("textureKey: textureDefault merges in and its stroke wins over the shape stroke", () => {
  const cfg = parse(
    textureKey("lines", () => "red", () => "blue", {stroke: "orange", size: 8}),
  );
  assert.strictEqual(cfg.stroke, "orange");
  assert.strictEqual(cfg.size, 8);
});

it("textureKey: does not mutate a texture config object", () => {
  const texture = {texture: "lines"};
  textureKey(texture, () => "red", () => "blue");
  assert.deepStrictEqual(texture, {texture: "lines"});
  const second = parse(textureKey(texture, () => "green", () => "blue"));
  assert.strictEqual(second.background, "green");
});

it("Shape: a color-object stroke reaches the texture as a string", () => {
  const scene = new Rect()
    .data([{id: "a"}])
    .fill("red")
    .stroke(() => color("red").darker(0.25))
    .texture("lines")
    .toScene();
  const fill = scene.children[0].paint.fill;
  assert.ok(fill.startsWith("pattern:"));
  assert.ok(!fill.includes('"r":'), "stroke is not a serialized color object");
});

it("textureKey: an unfilled shape gets no texture", () => {
  assert.strictEqual(textureKey("lines", () => "none", () => "blue"), false);
});
