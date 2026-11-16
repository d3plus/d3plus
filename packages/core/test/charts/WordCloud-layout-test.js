import {it} from "vitest";
import assert from "assert";
import {
  archimedeanSpiral,
  makeSpiral,
  rectangularSpiral,
  SPIRAL_SPACING,
  SPIRAL_STEP,
  spiralKind,
} from "../../src/charts/WordCloud/spiral.ts";
import {
  boxSprite,
  OccupancyBoard,
} from "../../src/charts/WordCloud/occupancy.ts";
import {
  CLOUD_FONT_FLOOR,
  CLOUD_SHRINK,
  findSpot,
  fitCloud,
  nextScale,
  placeSprites,
  scaledSize,
} from "../../src/charts/WordCloud/cloudLayout.ts";
import {
  hashString,
  hashUnit,
  wordRotation,
} from "../../src/charts/WordCloud/rotation.ts";
import {
  fontScaleKind,
  wordFontSize,
} from "../../src/charts/WordCloud/fontScale.ts";

/** A sprite from rows of "#" (ink) and "." (empty). */
const art = (rows, x0 = 0, y0 = 0) => {
  const inkWidth = Math.max(...rows.map(r => r.length));
  const cols = (inkWidth + 31) >> 5;
  const mask = new Uint32Array(cols * rows.length);
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === "#") mask[r * cols + (c >> 5)] |= 1 << (31 - (c & 31));
    }),
  );
  return {width: cols * 32, inkWidth, height: rows.length, cols, mask, x0, y0};
};

it("spiralKind falls back to archimedean", () => {
  assert.strictEqual(spiralKind("rectangular"), "rectangular");
  assert.strictEqual(spiralKind("archimedean"), "archimedean");
  assert.strictEqual(spiralKind("bogus"), "archimedean");
  assert.strictEqual(spiralKind(undefined), "archimedean");
});

it("archimedeanSpiral starts at the origin, steps evenly, and widens a turn at a time", () => {
  const point = archimedeanSpiral();
  assert.deepStrictEqual(point(0), [0, 0]);
  // Consecutive points sit about SPIRAL_STEP apart, near and far.
  for (const n of [50, 500, 5000]) {
    const [x1, y1] = point(n);
    const [x2, y2] = point(n + 1);
    const step = Math.hypot(x2 - x1, y2 - y1);
    assert.ok(Math.abs(step - SPIRAL_STEP) < 0.2, `step ${step} at ${n}`);
  }
  // The radius grows monotonically, SPIRAL_SPACING per full turn.
  const b = SPIRAL_SPACING / (2 * Math.PI);
  const r = n => Math.hypot(...point(n));
  assert.ok(r(1000) > r(999));
  const t = n => Math.sqrt((2 * n * SPIRAL_STEP) / b);
  assert.ok(Math.abs(r(1000) - b * t(1000)) < 1e-9);
});

it("archimedeanSpiral stretches by aspect and follows its phase and direction", () => {
  const plain = archimedeanSpiral();
  const wide = archimedeanSpiral({aspect: 2});
  const [px, py] = plain(300);
  const [wx, wy] = wide(300);
  assert.ok(Math.abs(wx - 2 * px) < 1e-9);
  assert.ok(Math.abs(wy - py) < 1e-9);
  const ccw = archimedeanSpiral({direction: -1});
  const [cx, cy] = ccw(300);
  assert.ok(Math.abs(cx - px) < 1e-9 && Math.abs(cy + py) < 1e-9, "mirrored");
  const turned = archimedeanSpiral({phase: Math.PI});
  const [tx, ty] = turned(300);
  assert.ok(Math.abs(tx + px) < 1e-9 && Math.abs(ty + py) < 1e-9, "half turn");
});

it("rectangularSpiral walks runs of 1, 1, 2, 2, 3, 3 steps around the origin", () => {
  const point = rectangularSpiral();
  const s = SPIRAL_SPACING;
  const path = Array.from({length: 9}, (_, n) => point(n));
  assert.deepStrictEqual(path, [
    [0, 0],
    [s, 0],
    [s, s],
    [0, s],
    [-s, s],
    [-s, 0],
    [-s, -s],
    [0, -s],
    [s, -s],
  ]);
  // Stretched by aspect along x, and the other way round with direction -1.
  const wide = rectangularSpiral({aspect: 2, direction: -1});
  assert.deepStrictEqual(wide(2), [2 * s, -s]);
  // `makeSpiral` picks it by name.
  assert.deepStrictEqual(makeSpiral("rectangular")(3), [0, s]);
  assert.deepStrictEqual(makeSpiral("archimedean")(0), [0, 0]);
});

it("boxSprite fills its box, and OccupancyBoard tests collisions bit by bit", () => {
  const box = boxSprite(40, 2, -20, -1);
  assert.strictEqual(box.width, 64);
  assert.strictEqual(box.inkWidth, 40);
  assert.strictEqual(box.cols, 2);
  assert.strictEqual(box.mask[0], 0xffffffff);
  assert.strictEqual(box.mask[1] >>> 0, 0xff000000);

  const board = new OccupancyBoard(100, 20);
  assert.ok(!board.collides(box, 3, 3));
  board.place(box, 3, 3);
  assert.ok(board.taken(3, 3) && board.taken(42, 4));
  assert.ok(!board.taken(43, 3) && !board.taken(2, 3) && !board.taken(3, 5));
  // Overlapping by one pixel on either side, across a 32-bit word boundary.
  assert.ok(board.collides(boxSprite(1, 1, 0, 0), 42, 4));
  assert.ok(!board.collides(boxSprite(1, 1, 0, 0), 43, 4));
  assert.ok(board.collides(box, 42, 4));
  assert.ok(!board.collides(box, 43, 4));
  assert.ok(!board.collides(box, 3, 5));
  assert.ok(board.inside(box, 60, 18) && !board.inside(box, 61, 18));
  assert.ok(!board.inside(box, 0, 19) && !board.inside(box, -1, 0));
});

it("OccupancyBoard lets a glyph nest in another's gaps", () => {
  // A "U" with a hollow middle, and a dot that fits inside it.
  const cup = art(["#....#", "#....#", "#....#", "######"]);
  const dot = art(["##", "##"]);
  const board = new OccupancyBoard(64, 16);
  board.place(cup, 30, 4);
  // The dot's bounding box lies inside the cup's, but no ink overlaps.
  assert.ok(!board.collides(dot, 32, 4));
  assert.ok(board.collides(dot, 30, 4));
  assert.ok(board.collides(dot, 32, 6));
  // At every shift, the ink-on-ink test matches a pixel-by-pixel check.
  for (let x = 25; x < 40; x++)
    for (let y = 0; y < 10; y++) {
      let expected = false;
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 2; c++) expected ||= board.taken(x + c, y + r);
      assert.strictEqual(board.collides(dot, x, y), expected, `${x},${y}`);
    }
});

it("findSpot starts in the middle and spirals out to free space", () => {
  const board = new OccupancyBoard(200, 100);
  const word = boxSprite(40, 10, -20, -8);
  assert.deepStrictEqual(findSpot(board, word, "a"), [80, 45]);
  board.place(word, 80, 45);
  const spot = findSpot(board, word, "b");
  assert.ok(spot, "found room");
  assert.ok(!board.collides(word, ...spot) && board.inside(word, ...spot));
  // The same id walks the same spiral.
  assert.deepStrictEqual(findSpot(board, word, "b"), spot);
  const rect = findSpot(board, word, "b", "rectangular");
  assert.ok(rect && !board.collides(word, ...rect));
  // A word larger than the area, or with no room left, finds none.
  assert.strictEqual(findSpot(board, boxSprite(300, 10, 0, 0), "c"), null);
  const full = new OccupancyBoard(64, 8);
  full.place(boxSprite(64, 8, 0, 0), 0, 0);
  assert.strictEqual(findSpot(full, boxSprite(4, 4, 0, 0), "d"), null);
  assert.strictEqual(
    findSpot(full, boxSprite(4, 4, 0, 0), "d", "rectangular"),
    null,
  );
});

it("placeSprites places words in order, anchored by their sprite offsets", () => {
  const sprites = [boxSprite(60, 20, -30, -15), boxSprite(20, 10, -10, -8)];
  const {placed, dropped} = placeSprites(sprites, ["a", "b"], {
    width: 200,
    height: 100,
  });
  assert.deepStrictEqual(dropped, []);
  assert.deepStrictEqual(placed[0], {index: 0, x: 100, y: 55});
  assert.strictEqual(placed[1].index, 1);
  // With stopAtMiss, the first miss ends the pass; without, it is skipped.
  const big = boxSprite(300, 10, 0, 0);
  const all = [sprites[0], big, sprites[1]];
  const ids = ["a", "big", "b"];
  const stopped = placeSprites(all, ids, {width: 200, height: 100}, true);
  assert.deepStrictEqual(stopped.dropped, [1]);
  assert.strictEqual(stopped.placed.length, 1);
  const skipped = placeSprites(all, ids, {width: 200, height: 100});
  assert.deepStrictEqual(skipped.dropped, [1]);
  assert.deepStrictEqual(
    skipped.placed.map(p => p.index),
    [0, 2],
  );
});

it("nextScale shrinks by CLOUD_SHRINK down to the floor; scaledSize clamps there", () => {
  assert.strictEqual(nextScale(1, 60), CLOUD_SHRINK);
  assert.strictEqual(nextScale(0.11, 60), CLOUD_FONT_FLOOR / 60);
  assert.strictEqual(nextScale(CLOUD_FONT_FLOOR / 60, 60), null);
  assert.strictEqual(nextScale(1, 5), null);
  assert.strictEqual(scaledSize(60, 0.5), 30);
  assert.strictEqual(scaledSize(10, 0.5), CLOUD_FONT_FLOOR);
  // A word already under the floor keeps its size.
  assert.strictEqual(scaledSize(4, 0.5), 4);
});

/** Square sprites as wide as each size, centered on their anchors. */
const squares = sizes => sizes.map(s => boxSprite(s, s, -s / 2, -s / 2));

it("fitCloud keeps the sizes when every word fits", () => {
  const words = [
    {id: "a", size: 20},
    {id: "b", size: 10},
  ];
  const calls = [];
  const fit = fitCloud(words, sizes => (calls.push(sizes), squares(sizes)), {
    width: 100,
    height: 100,
  });
  assert.strictEqual(fit.scale, 1);
  assert.deepStrictEqual(fit.sizes, [20, 10]);
  assert.deepStrictEqual(fit.dropped, []);
  assert.strictEqual(fit.placed.length, 2);
  assert.strictEqual(calls.length, 1);
});

it("fitCloud shrinks every size and retries until all the words fit", () => {
  const words = [
    {id: "a", size: 60},
    {id: "b", size: 40},
    {id: "c", size: 30},
  ];
  const calls = [];
  const fit = fitCloud(words, sizes => (calls.push(sizes), squares(sizes)), {
    width: 80,
    height: 60,
  });
  assert.ok(calls.length > 1, "retried");
  assert.ok(fit.scale < 1);
  assert.deepStrictEqual(fit.dropped, []);
  assert.strictEqual(fit.placed.length, 3);
  // Each retry scaled every size by the same factor.
  calls.forEach((sizes, k) =>
    sizes.forEach((s, w) =>
      assert.ok(Math.abs(s - words[w].size * CLOUD_SHRINK ** k) < 1e-9),
    ),
  );
  assert.deepStrictEqual(fit.sizes, calls[calls.length - 1]);
});

it("fitCloud drops the words that don't fit even at the floor", () => {
  const words = Array.from({length: 40}, (_, k) => ({id: `w${k}`, size: 60}));
  const fit = fitCloud(words, squares, {width: 30, height: 30});
  assert.strictEqual(fit.scale, CLOUD_FONT_FLOOR / 60);
  assert.ok(fit.dropped.length > 0);
  assert.strictEqual(fit.placed.length + fit.dropped.length, 40);
  // Words are placed in order, so the ones left out come last.
  const placed = fit.placed.map(p => p.index);
  assert.ok(Math.max(...placed) < Math.max(...fit.dropped));
});

it("fitCloud lays out the same words the same way every time", () => {
  const words = Array.from({length: 30}, (_, k) => ({
    id: `word-${k}`,
    size: 40 - k,
  }));
  const run = () => fitCloud(words, squares, {width: 300, height: 200}).placed;
  assert.deepStrictEqual(run(), run());
});

it("hashString is a stable FNV-1a hash, varied by its seed", () => {
  assert.strictEqual(hashString(""), 0x811c9dc5);
  assert.strictEqual(hashString("a"), 0xe40c292c);
  assert.strictEqual(hashString("foobar"), 0xbf9cf968);
  assert.notStrictEqual(hashString("a", 1), hashString("a"));
  const u = hashUnit("word");
  assert.ok(u >= 0 && u < 1);
  assert.strictEqual(hashUnit("word"), u);
});

it("wordRotation takes a number, picks from an array by id, or calls an accessor", () => {
  const d = {id: "data", angle: 30};
  assert.strictEqual(wordRotation(45, d, 0, "data"), 45);
  assert.strictEqual(wordRotation("-90", d, 0, "data"), -90);
  assert.strictEqual(wordRotation(undefined, d, 0, "data"), 0);
  assert.strictEqual(wordRotation(null, d, 0, "data"), 0);
  assert.strictEqual(wordRotation("tilt", d, 0, "data"), 0);
  assert.strictEqual(wordRotation([], d, 0, "data"), 0);
  assert.strictEqual(
    wordRotation(row => row.angle, d, 0, "data"),
    30,
  );
  assert.strictEqual(
    wordRotation((_, i) => i * 10, d, 3, "data"),
    30,
  );
  // An array's pick is deterministic per id and spreads over the angles.
  const angles = [0, 90, -90];
  const ids = Array.from({length: 60}, (_, k) => `word${k}`);
  const picks = ids.map(id => wordRotation(angles, {}, 0, id));
  assert.deepStrictEqual(
    ids.map(id => wordRotation(angles, {}, 5, id)),
    picks,
  );
  assert.ok(picks.every(a => angles.includes(a)));
  assert.deepStrictEqual(new Set(picks).size, 3);
});

it("wordFontSize maps values onto the size range by its scale", () => {
  const values = [1, 25, 100];
  const sqrt = wordFontSize(values, [10, 60]);
  assert.strictEqual(sqrt(1), 10);
  assert.strictEqual(sqrt(100), 60);
  assert.ok(Math.abs(sqrt(25) - (10 + (50 * (5 - 1)) / 9)) < 1e-9);
  const linear = wordFontSize(values, [10, 60], "linear");
  assert.ok(Math.abs(linear(25) - (10 + (50 * 24) / 99)) < 1e-9);
  const log = wordFontSize(values, [10, 60], "log");
  assert.ok(Math.abs(log(10) - 35) < 1e-9);
  // Equal values all draw at the largest size; out-of-range values clamp.
  assert.strictEqual(wordFontSize([5, 5], [10, 60])(5), 60);
  assert.strictEqual(sqrt(1000), 60);
  assert.strictEqual(fontScaleKind("log"), "log");
  assert.strictEqual(fontScaleKind("linear"), "linear");
  assert.strictEqual(fontScaleKind("cube"), "sqrt");
});
