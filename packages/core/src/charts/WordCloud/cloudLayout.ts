/**
    WordCloud's placement: each word, largest first, walks a spiral out from
    the middle of the chart area until its glyph mask lands on free pixels.
    When a word finds no room, every font size shrinks and the words are
    placed again, down to `CLOUD_FONT_FLOOR`; past that, the words that still
    don't fit are left out.
*/

import type {GlyphSprite} from "./occupancy.js";
import {OccupancyBoard} from "./occupancy.js";
import {hashUnit} from "./rotation.js";
import {makeSpiral, SPIRAL_SPACING} from "./spiral.js";
import type {SpiralKind} from "./spiral.js";

/** One word to place, in placement order (largest first). */
export interface CloudWord {
  /** A stable id, hashed for the word's spiral. */
  id: string;
  /** The font size in pixels, before any shrinking. */
  size: number;
}

/** A placed word: its anchor (baseline center) in the chart area. */
export interface CloudPlacement {
  /** The word's index in the words given. */
  index: number;
  x: number;
  y: number;
}

/** The result of placing a set of words. */
export interface CloudFit {
  /** Every word placed, in placement order. */
  placed: CloudPlacement[];
  /** The indices of the words left out. */
  dropped: number[];
  /** The factor every font size was scaled by. */
  scale: number;
  /** The words' font sizes at that scale, by index. */
  sizes: number[];
  /** The words' masks at that scale, by index. */
  sprites: GlyphSprite[];
}

/** The options for placing words. */
export interface CloudOptions {
  width: number;
  height: number;
  spiral?: SpiralKind;
}

/** The smallest font size, in pixels, shrinking takes a word to. */
export const CLOUD_FONT_FLOOR = 6;

/** The factor font sizes shrink by on each retry. */
export const CLOUD_SHRINK = 0.85;

/** The seeds the spiral's phase and direction are hashed with. */
const PHASE_SEED = 0x68e31da4;
const TURN_SEED = 0x1b56c4e9;

/**
    Walks the spiral from the middle of `board` for a spot where `sprite`
    covers only free pixels, and returns its top-left corner, or null when
    the spiral leaves the board without finding one.
    @param board The occupancy so far.
    @param sprite The word's mask.
    @param id The word's id, hashed for the spiral's phase and direction.
    @param kind The spiral to walk.
*/
export function findSpot(
  board: OccupancyBoard,
  sprite: GlyphSprite,
  id: string,
  kind: SpiralKind = "archimedean",
): [number, number] | null {
  const {width, height} = board;
  if (sprite.inkWidth > width || sprite.height > height) return null;
  const aspect = height ? width / height : 1;
  const point = makeSpiral(kind, {
    aspect,
    phase: hashUnit(id, PHASE_SEED) * 2 * Math.PI,
    direction: hashUnit(id, TURN_SEED) < 0.5 ? 1 : -1,
  });
  // The word's mask starts centered on the middle of the area, and stays
  // inside it while it is at most this far off on each axis.
  const startX = (width - sprite.inkWidth) / 2;
  const startY = (height - sprite.height) / 2;
  // Once the spiral is past the area's corners (measured on the spiral's
  // own ellipse, or its rectangles), no further point lands inside.
  const rect = kind === "rectangular";
  const reach = rect
    ? Math.max(startX / aspect, startY) + SPIRAL_SPACING
    : Math.hypot(startX / aspect, startY) + 1;
  for (let n = 0; ; n++) {
    const [dx, dy] = point(n);
    const out = rect
      ? Math.max(Math.abs(dx) / aspect, Math.abs(dy))
      : Math.hypot(dx / aspect, dy);
    if (out > reach) return null;
    const x = Math.round(startX + dx);
    const y = Math.round(startY + dy);
    if (board.inside(sprite, x, y) && !board.collides(sprite, x, y))
      return [x, y];
  }
}

/**
    Places each word in order on an empty `width` × `height` area. With
    `stopAtMiss`, stops at the first word that finds no room; otherwise
    skips it and goes on.
    @param sprites The words' masks, in placement order.
    @param ids The words' ids.
    @param options The area and spiral.
    @param stopAtMiss Whether to give up at the first word left out.
*/
export function placeSprites(
  sprites: GlyphSprite[],
  ids: string[],
  options: CloudOptions,
  stopAtMiss = false,
): {placed: CloudPlacement[]; dropped: number[]} {
  const board = new OccupancyBoard(options.width, options.height);
  const placed: CloudPlacement[] = [];
  const dropped: number[] = [];
  for (let k = 0; k < sprites.length; k++) {
    const sprite = sprites[k];
    const spot = findSpot(board, sprite, ids[k], options.spiral);
    if (!spot) {
      dropped.push(k);
      if (stopAtMiss) break;
      continue;
    }
    board.place(sprite, spot[0], spot[1]);
    placed.push({index: k, x: spot[0] - sprite.x0, y: spot[1] - sprite.y0});
  }
  return {placed, dropped};
}

/**
    The factor each retry scales font sizes by: the previous one times
    `CLOUD_SHRINK`, or null when every word is already at the floor.
    @param scale The current factor.
    @param largest The largest font size, unscaled.
    @param floor The smallest size shrinking takes a word to.
*/
export function nextScale(
  scale: number,
  largest: number,
  floor = CLOUD_FONT_FLOOR,
): number | null {
  if (largest * scale <= floor) return null;
  return Math.max(scale * CLOUD_SHRINK, floor / largest);
}

/**
    A word's font size at `scale`: its size times the factor, but no
    smaller than the floor (or its own size, if that is smaller).
    @param size The word's unscaled size.
    @param scale The factor.
    @param floor The smallest size shrinking takes a word to.
*/
export function scaledSize(
  size: number,
  scale: number,
  floor = CLOUD_FONT_FLOOR,
): number {
  return Math.max(size * scale, Math.min(size, floor));
}

/**
    Places every word, shrinking all font sizes and retrying while any word
    is left out. Once every size is at the floor, the words that still don't
    fit are dropped, the smallest ones as they are placed last.
    @param words The words, largest first.
    @param rasterize Masks the words at their scaled font sizes, in order.
    @param options The area and spiral.
*/
export function fitCloud(
  words: CloudWord[],
  rasterize: (sizes: number[]) => GlyphSprite[],
  options: CloudOptions,
): CloudFit {
  const ids = words.map(w => w.id);
  const largest = words.reduce((m, w) => Math.max(m, w.size), 0);
  let scale = 1;
  for (;;) {
    const sizes = words.map(w => scaledSize(w.size, scale));
    const sprites = rasterize(sizes);
    const next = nextScale(scale, largest);
    const last = next === null;
    const {placed, dropped} = placeSprites(sprites, ids, options, !last);
    if (!dropped.length || last)
      return {placed, dropped, scale, sizes, sprites};
    scale = next;
  }
}
