import assert from "assert";

import it from "./jsdom.js";
import {CanvasRenderer, SvgRenderer} from "../es/index.js";

const token = `pattern:${JSON.stringify({texture: "circles", background: "#f00"})}`;

function scene(fill) {
  return {
    width: 100,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [{type: "rect", key: "a", x: 10, y: 10, width: 30, height: 30, paint: {fill}}],
    },
  };
}

it("SvgRenderer materializes a texture pattern fill", () => {
  const r = new SvgRenderer();
  r.mount({container: document.body, width: 100, height: 100});
  r.drawScene(scene(token));

  const rect = document.querySelector('[data-key="a"]');
  assert.match(rect.getAttribute("fill"), /^url\(#/, "rect fill points at a pattern");
  assert.ok(document.querySelector("pattern"), "a <pattern> def was added to the svg");

  r.destroy();
});

it("CanvasRenderer degrades a texture fill to its background color", () => {
  const r = new CanvasRenderer();
  r.mount({container: document.body, width: 100, height: 100});
  r.drawScene(scene(token));

  // Painting a pattern fill must not throw, and the node stays pickable.
  assert.strictEqual(r.pick([20, 20]).node.key, "a", "rect still rendered/pickable with degraded fill");

  r.destroy();
});
