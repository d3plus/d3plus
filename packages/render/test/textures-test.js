import assert from "assert";

import it from "./jsdom.js";
import {CanvasRenderer, SvgRenderer, patternTileSvg} from "../es/index.js";

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

it("CanvasRenderer paints a texture's solid fallback until the tile rasterizes", () => {
  const r = new CanvasRenderer();
  r.mount({container: document.body, width: 100, height: 100});
  r.drawScene(scene(token));

  // Rasterization is async (Image decode); the first synchronous paint uses the
  // texture's background color and must not throw, and the node stays pickable.
  // The real CanvasPattern arrives on Image load (covered end-to-end in a real
  // browser by core's render-parity suite — jsdom does not decode images).
  assert.strictEqual(r.pick([20, 20]).node.key, "a", "rect still rendered/pickable with fallback fill");

  r.destroy();
});

it("patternTileSvg builds standalone SVG for a texture tile", () => {
  const out = patternTileSvg(token);
  assert.ok(out, "returns a result for a valid pattern token");
  assert.ok(out.width > 0 && out.height > 0, "reports positive tile dimensions");
  assert.match(out.svg, /<pattern/, "embeds the textures.js <pattern> def");
  assert.match(out.svg, /<rect[^>]*fill="url\(#/, "fills a tile rect with the pattern");
  assert.doesNotMatch(out.svg, /NaN|undefined/, "tile geometry is fully resolved (no NaN/undefined)");
});

it("patternTileSvg returns null for non-pattern or malformed tokens", () => {
  assert.strictEqual(patternTileSvg("#ff0000"), null, "plain color");
  assert.strictEqual(patternTileSvg("gradient:{}"), null, "gradient token");
  assert.strictEqual(patternTileSvg("pattern:{not json"), null, "malformed JSON");
  assert.strictEqual(
    patternTileSvg(`pattern:${JSON.stringify({texture: "notaTexture"})}`),
    null,
    "unknown texture class",
  );
});
