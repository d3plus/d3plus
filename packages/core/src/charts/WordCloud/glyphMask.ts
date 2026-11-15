/**
    Rasterizes WordCloud's words into glyph masks: each word is drawn at its
    font, size, and angle onto an offscreen canvas, many to a sheet, and the
    alpha of its pixels read back into a 1-bit `GlyphSprite`. Where no canvas
    is available, each word is measured instead and its mask fills its
    rotated text box.
*/

import {textWidth} from "@d3plus/dom";

import {boxSprite} from "./occupancy.js";
import type {GlyphSprite} from "./occupancy.js";

/** One word to rasterize. */
export interface GlyphWord {
  text: string;
  /** The CSS font-family list. */
  family: string;
  weight: number | string;
  /** The font size in pixels. */
  size: number;
  /** The angle in degrees, clockwise. */
  rotate: number;
  /** Extra pixels of clearance kept around the word's ink. */
  padding: number;
}

/** A word's unrotated text box, from its anchor (its baseline center). */
export interface GlyphMetrics {
  /** The advance width. */
  width: number;
  /** The ink's height above the baseline. */
  ascent: number;
  /** The ink's depth below the baseline. */
  descent: number;
}

/** A rasterized word: its mask, and the text box it was measured with. */
export interface WordGlyph {
  sprite: GlyphSprite;
  metrics: GlyphMetrics;
}

/** The 2D canvas surface the rasterizer draws on. */
type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** The sheet's width; words are packed onto it in rows. */
const SHEET_WIDTH = 2048;
/** The tallest sheet drawn at once; more words go on another sheet. */
const SHEET_HEIGHT = 2048;

/**
    A 2D context on a new `width` × `height` canvas: an `OffscreenCanvas`
    where there is one (browsers, workers, and Node under `@d3plus/ssr`),
    else a `<canvas>` from the document, else null.
    @param width The canvas's width.
    @param height The canvas's height.
*/
export function glyphContext(width: number, height: number): Context | null {
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const ctx = new OffscreenCanvas(width, height).getContext("2d", {
        willReadFrequently: true,
      });
      if (ctx) return ctx as Context;
    }
    if (typeof document !== "undefined" && document.createElement) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", {willReadFrequently: true});
      if (ctx) return ctx;
    }
  } catch {
    return null;
  }
  return null;
}

/** The context every chart rasterizes on, made the first time one is needed. */
let shared: Context | null = null;

/**
    The 2D context words are rasterized on: one sheet-sized canvas, made
    once and reused (see `glyphContext`), or null where there is no canvas.
*/
export function sharedGlyphContext(): Context | null {
  shared ??= glyphContext(SHEET_WIDTH, SHEET_HEIGHT);
  return shared;
}

/** The CSS font shorthand for `word`. */
export function glyphFont(
  word: Pick<GlyphWord, "family" | "weight" | "size">,
): string {
  return `normal normal ${word.weight} ${word.size}px ${word.family}`;
}

/**
    The axis-aligned box, around the word's anchor, that its padded text box
    covers once turned by its angle.
    @param metrics The word's unrotated text box.
    @param word The word's angle and padding.
*/
export function rotatedBox(
  metrics: GlyphMetrics,
  word: Pick<GlyphWord, "rotate" | "padding">,
): {x0: number; y0: number; x1: number; y1: number} {
  const p = word.padding;
  const left = -metrics.width / 2 - p;
  const right = metrics.width / 2 + p;
  const top = -metrics.ascent - p;
  const bottom = metrics.descent + p;
  const a = (word.rotate * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ]) {
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    x0 = Math.min(x0, rx);
    y0 = Math.min(y0, ry);
    x1 = Math.max(x1, rx);
    y1 = Math.max(y1, ry);
  }
  return {x0, y0, x1, y1};
}

/**
    A word's text box without a canvas: its width from `textWidth`, else an
    estimate, and the ascent and descent of a typical Latin face.
    @param word The word.
*/
export function estimateMetrics(word: GlyphWord): GlyphMetrics {
  let width: number;
  try {
    width = textWidth(word.text, {
      "font-family": word.family,
      "font-size": word.size,
      "font-weight": word.weight,
    });
  } catch {
    width = NaN;
  }
  if (!Number.isFinite(width) || width <= 0)
    width = word.text.length * word.size * 0.6;
  return {width, ascent: word.size * 0.75, descent: word.size * 0.25};
}

/**
    Masks that fill each word's rotated text box: the fallback where no
    canvas can rasterize the glyphs.
    @param words The words.
*/
export function boxGlyphs(words: GlyphWord[]): WordGlyph[] {
  return words.map(word => {
    const metrics = estimateMetrics(word);
    const box = rotatedBox(metrics, word);
    const x0 = Math.floor(box.x0);
    const y0 = Math.floor(box.y0);
    return {
      metrics,
      sprite: boxSprite(Math.ceil(box.x1) - x0, Math.ceil(box.y1) - y0, x0, y0),
    };
  });
}

/** Reads a word's ink box from a canvas measurement, with fallbacks. */
function measure(ctx: Context, word: GlyphWord): GlyphMetrics {
  ctx.font = glyphFont(word);
  const m = ctx.measureText(word.text);
  const ascent = m.actualBoundingBoxAscent;
  const descent = m.actualBoundingBoxDescent;
  const ink = (m.actualBoundingBoxLeft ?? 0) + (m.actualBoundingBoxRight ?? 0);
  return {
    width: Math.max(m.width, Number.isFinite(ink) ? ink : 0),
    ascent: Number.isFinite(ascent) ? ascent : word.size * 0.75,
    descent: Number.isFinite(descent) ? descent : word.size * 0.25,
  };
}

/** Where a word sits on the sheet, and the box it was drawn in. */
interface Slot {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The anchor's offset from the slot's top-left. */
  ax: number;
  ay: number;
}

/** Packs slots left to right in rows, starting a new sheet when one fills. */
function packSlots(
  boxes: {x0: number; y0: number; x1: number; y1: number}[],
): Slot[][] {
  const sheets: Slot[][] = [[]];
  let x = 0,
    y = 0,
    rowHeight = 0;
  for (const box of boxes) {
    const ax = Math.ceil(-box.x0) + 1;
    const ay = Math.ceil(-box.y0) + 1;
    const width = Math.min(SHEET_WIDTH, ax + Math.ceil(box.x1) + 1);
    const height = Math.min(SHEET_HEIGHT, ay + Math.ceil(box.y1) + 1);
    if (x + width > SHEET_WIDTH) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    if (y + height > SHEET_HEIGHT) {
      sheets.push([]);
      x = 0;
      y = 0;
      rowHeight = 0;
    }
    sheets[sheets.length - 1].push({x, y, width, height, ax, ay});
    x += width;
    rowHeight = Math.max(rowHeight, height);
  }
  return sheets;
}

/** Reads one slot's alpha into a mask, trimmed to the rows and columns with ink. */
function readSprite(
  pixels: Uint8ClampedArray,
  sheetWidth: number,
  slot: Slot,
): GlyphSprite {
  let top = slot.height,
    bottom = -1,
    left = slot.width,
    right = -1;
  for (let r = 0; r < slot.height; r++) {
    const row = ((slot.y + r) * sheetWidth + slot.x) * 4 + 3;
    for (let c = 0; c < slot.width; c++)
      if (pixels[row + c * 4]) {
        if (r < top) top = r;
        bottom = r;
        if (c < left) left = c;
        if (c > right) right = c;
      }
  }
  if (bottom < 0) return boxSprite(1, 1, 0, 0);
  const inkWidth = right - left + 1;
  const height = bottom - top + 1;
  const cols = (inkWidth + 31) >> 5;
  const mask = new Uint32Array(cols * height);
  for (let r = 0; r < height; r++) {
    const row = ((slot.y + top + r) * sheetWidth + slot.x + left) * 4 + 3;
    for (let c = 0; c < inkWidth; c++)
      if (pixels[row + c * 4])
        mask[r * cols + (c >> 5)] |= 1 << (31 - (c & 31));
  }
  return {
    width: cols * 32,
    inkWidth,
    height,
    cols,
    mask,
    x0: left - slot.ax,
    y0: top - slot.ay,
  };
}

/** Draws one sheet's words and reads their masks back. */
function drawSheet(
  ctx: Context,
  words: GlyphWord[],
  slots: Slot[],
): GlyphSprite[] {
  const height = slots.reduce((h, s) => Math.max(h, s.y + s.height), 1);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, SHEET_WIDTH, height);
  ctx.fillStyle = ctx.strokeStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  words.forEach((word, k) => {
    const slot = slots[k];
    ctx.save();
    ctx.beginPath();
    ctx.rect(slot.x, slot.y, slot.width, slot.height);
    ctx.clip();
    ctx.translate(slot.x + slot.ax, slot.y + slot.ay);
    ctx.rotate((word.rotate * Math.PI) / 180);
    ctx.font = glyphFont(word);
    ctx.fillText(word.text, 0, 0);
    if (word.padding > 0) {
      ctx.lineWidth = word.padding * 2;
      ctx.strokeText(word.text, 0, 0);
    }
    ctx.restore();
  });
  const pixels = ctx.getImageData(0, 0, SHEET_WIDTH, height).data;
  return slots.map(slot => readSprite(pixels, SHEET_WIDTH, slot));
}

/**
    Rasterizes `words` into glyph masks on a canvas, or, without one, into
    masks that fill their measured text boxes (see `boxGlyphs`).
    @param words The words, each at its font, size, angle, and padding.
    @param context A 2D context to draw on, or null to measure the words
    instead. Defaults to the shared canvas (see `sharedGlyphContext`).
*/
export function rasterizeWords(
  words: GlyphWord[],
  context: Context | null = sharedGlyphContext(),
): WordGlyph[] {
  if (!words.length) return [];
  const ctx = context;
  if (!ctx) return boxGlyphs(words);
  let metrics: GlyphMetrics[];
  try {
    metrics = words.map(word => measure(ctx, word));
  } catch {
    return boxGlyphs(words);
  }
  const boxes = words.map((word, k) => rotatedBox(metrics[k], word));
  const sheets = packSlots(boxes);
  const sprites: GlyphSprite[] = [];
  let at = 0;
  for (const slots of sheets) {
    const batch = words.slice(at, at + slots.length);
    sprites.push(...drawSheet(ctx, batch, slots));
    at += slots.length;
  }
  return words.map((_, k) => ({sprite: sprites[k], metrics: metrics[k]}));
}
