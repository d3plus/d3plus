import {it} from "vitest";
import assert from "assert";
import {
  boxGlyphs,
  estimateMetrics,
  glyphContext,
  glyphFont,
  glyphFontLoads,
  markFontsLoaded,
  rasterizeWords,
  rotatedBox,
  sharedGlyphContext,
} from "../../src/charts/WordCloud/glyphMask.ts";
import {OccupancyBoard} from "../../src/charts/WordCloud/occupancy.ts";

const word = (text, extra = {}) => ({
  text,
  family: "sans-serif",
  weight: 400,
  size: 40,
  rotate: 0,
  padding: 0,
  ...extra,
});

/** The sprite's pixel at (x, y), from its top-left. */
const bit = (s, x, y) =>
  (s.mask[y * s.cols + (x >> 5)] & (1 << (31 - (x & 31)))) !== 0;

it("glyphFont builds a canvas font shorthand", () => {
  assert.strictEqual(
    glyphFont({family: "Inter, sans-serif", weight: 600, size: 24}),
    "normal normal 600 24px Inter, sans-serif",
  );
});

it("glyphContext and sharedGlyphContext give a 2D context on an offscreen canvas", () => {
  const ctx = glyphContext(64, 32);
  assert.ok(ctx && typeof ctx.getImageData === "function");
  const shared = sharedGlyphContext();
  assert.ok(shared);
  assert.strictEqual(sharedGlyphContext(), shared, "made once");
});

it("markFontsLoaded counts the web font loads glyphFontLoads reports", () => {
  const before = glyphFontLoads();
  markFontsLoaded();
  assert.strictEqual(glyphFontLoads(), before + 1);
});

it("rotatedBox turns a word's padded text box about its anchor", () => {
  const metrics = {width: 40, ascent: 10, descent: 4};
  assert.deepStrictEqual(rotatedBox(metrics, {rotate: 0, padding: 1}), {
    x0: -21,
    y0: -11,
    x1: 21,
    y1: 5,
  });
  const turned = rotatedBox(metrics, {rotate: 90, padding: 0});
  assert.ok(Math.abs(turned.x0 + 4) < 1e-9 && Math.abs(turned.x1 - 10) < 1e-9);
  assert.ok(Math.abs(turned.y0 + 20) < 1e-9 && Math.abs(turned.y1 - 20) < 1e-9);
});

it("estimateMetrics measures a word's width and assumes a Latin face's ascent", () => {
  const m = estimateMetrics(word("Hello"));
  assert.ok(m.width > 40 && m.width < 160, `${m.width}`);
  assert.strictEqual(m.ascent, 30);
  assert.strictEqual(m.descent, 10);
});

it("boxGlyphs masks each word's whole rotated text box", () => {
  const [g] = boxGlyphs([word("Hello")]);
  assert.strictEqual(g.sprite.height, 40);
  assert.ok(Math.abs(g.sprite.inkWidth - g.metrics.width) <= 2);
  assert.ok(bit(g.sprite, 0, 0) && bit(g.sprite, g.sprite.inkWidth - 1, 39));
  const [up] = boxGlyphs([word("Hello", {rotate: 90})]);
  assert.ok(Math.abs(up.sprite.inkWidth - 40) <= 2);
  assert.ok(Math.abs(up.sprite.height - g.metrics.width) <= 2);
  // Without a canvas, rasterizeWords falls back to the boxes.
  const [fallback] = rasterizeWords([word("Hello")], null);
  assert.deepStrictEqual(fallback.sprite, g.sprite);
  assert.deepStrictEqual(rasterizeWords([]), []);
});

it("rasterizeWords masks a word's glyphs tightly around its anchor", () => {
  const [g] = rasterizeWords([word("Hello")]);
  const {sprite, metrics} = g;
  assert.ok(metrics.width > 60, `${metrics.width}`);
  assert.ok(metrics.ascent > 20 && metrics.ascent < 40, `${metrics.ascent}`);
  // The mask is trimmed to the ink, which sits above the baseline and spans
  // about the advance width around the anchor.
  assert.ok(sprite.y0 < -20 && sprite.y0 + sprite.height <= 2);
  assert.ok(Math.abs(sprite.x0 + metrics.width / 2) < 6, `${sprite.x0}`);
  assert.ok(Math.abs(sprite.inkWidth - metrics.width) < 8);
  // Glyph-tight: the mask holds far fewer pixels than its box (the counters
  // and the gaps between letters are empty).
  let ink = 0;
  for (let y = 0; y < sprite.height; y++)
    for (let x = 0; x < sprite.inkWidth; x++) ink += bit(sprite, x, y);
  assert.ok(ink > 0 && ink < sprite.inkWidth * sprite.height * 0.6, `${ink}`);
});

it("rasterizeWords pads, rotates, and packs many words onto sheets", () => {
  const [plain, padded] = rasterizeWords([
    word("Wave"),
    word("Wave", {padding: 3}),
  ]);
  assert.ok(padded.sprite.inkWidth >= plain.sprite.inkWidth + 5);
  assert.ok(padded.sprite.height >= plain.sprite.height + 5);
  const [up] = rasterizeWords([word("Wave", {rotate: -90})]);
  assert.ok(Math.abs(up.sprite.height - plain.sprite.inkWidth) <= 2);
  assert.ok(Math.abs(up.sprite.inkWidth - plain.sprite.height) <= 2);
  // Enough large words to fill more than one sheet each mask the same.
  const many = Array.from({length: 400}, (_, k) =>
    word(`Word${k % 10}`, {size: 90}),
  );
  const out = rasterizeWords(many);
  assert.strictEqual(out.length, 400);
  assert.deepStrictEqual(out[399].sprite, out[9].sprite);
});

it("glyph masks let a small word nest inside a large word's box", () => {
  const [big, small] = rasterizeWords([
    word("LIT", {size: 120}),
    word("a", {size: 18}),
  ]);
  const board = new OccupancyBoard(400, 200);
  board.place(big.sprite, 100, 40);
  // Somewhere inside the big word's box, the small word fits between strokes.
  let nested = false;
  for (
    let y = 40;
    y < 40 + big.sprite.height - small.sprite.height && !nested;
    y++
  )
    for (
      let x = 100;
      x < 100 + big.sprite.inkWidth - small.sprite.inkWidth;
      x++
    )
      if (!board.collides(small.sprite, x, y)) {
        nested = true;
        break;
      }
  assert.ok(nested, "found a gap");
});
