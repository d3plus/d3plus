import {it} from "vitest";
import assert from "assert";
// The package entry loads first so the shape modules resolve in their usual order.
import "../../index.ts";
import {boxRectConfig} from "../../src/shapes/Box.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

const box = {data: {id: "alpha", value: 300}, i: 4, key: "alpha", values: []};

it("boxRectConfig: passes the Box's texture and backgroundImage to its box Rect", () => {
  const config = boxRectConfig(
    {texture: () => "lines", textureDefault: {size: 6}, backgroundImage: () => "a.png", backgroundImageFit: () => "contain"},
    {fill: "white"},
  );
  assert.strictEqual(config.fill, "white");
  assert.strictEqual(config.texture(box, 0), "lines");
  assert.deepStrictEqual(config.textureDefault, {size: 6});
  assert.strictEqual(config.backgroundImage(box, 0), "a.png");
  assert.strictEqual(config.backgroundImageFit(box, 0), "contain");
});

it("boxRectConfig: resolves accessors against the box's merged datum and index", () => {
  const seen = [];
  const config = boxRectConfig({texture: (d, i) => (seen.push([d, i]), d.id === "alpha" ? "grid" : false)}, {});
  assert.strictEqual(config.texture(box, 0), "grid");
  assert.deepStrictEqual(seen, [[box.data, 4]]);
});

it("boxRectConfig: rectConfig overrides the Box's own keys", () => {
  const config = boxRectConfig({texture: () => "lines", backgroundImage: () => "a.png"}, {texture: false, backgroundImage: "b.png"});
  assert.strictEqual(config.texture, false);
  assert.strictEqual(config.backgroundImage, "b.png");
});

it("boxRectConfig: leaves out keys the Box doesn't set", () => {
  const config = boxRectConfig({}, {fill: "white", stroke: "black"});
  assert.deepStrictEqual(config, {fill: "white", stroke: "black"});
});
