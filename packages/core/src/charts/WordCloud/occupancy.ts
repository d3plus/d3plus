/**
    WordCloud's collision test: words as 1-bit glyph masks, packed 32
    pixels to a word, and the chart area as an occupancy bitmap they are
    stamped into once placed.
*/

/**
    A word's rasterized glyphs: a 1-bit mask of the pixels its ink (and
    padding) covers, `cols` 32-pixel words per row.
*/
export interface GlyphSprite {
  /** The mask's width in pixels, a multiple of 32. */
  width: number;
  /** The ink's width in pixels (at most `width`). */
  inkWidth: number;
  /** The mask's height in pixels. */
  height: number;
  /** 32-pixel words per row (`width / 32`). */
  cols: number;
  /** Row-major bits, most significant bit leftmost. */
  mask: Uint32Array;
  /** The mask's top-left corner, from the word's anchor (its baseline center). */
  x0: number;
  y0: number;
}

/**
    A sprite whose mask fills a `width` × `height` box: a word measured
    without rasterizing it.
    @param width The box's width in pixels.
    @param height The box's height in pixels.
    @param x0 The box's left edge, from the word's anchor.
    @param y0 The box's top edge, from the word's anchor.
*/
export function boxSprite(
  width: number,
  height: number,
  x0: number,
  y0: number,
): GlyphSprite {
  const inkWidth = Math.max(1, Math.ceil(width));
  const h = Math.max(1, Math.ceil(height));
  const cols = (inkWidth + 31) >> 5;
  const mask = new Uint32Array(cols * h);
  for (let r = 0; r < h; r++)
    for (let c = 0; c < cols; c++) {
      const bits = Math.min(32, inkWidth - c * 32);
      mask[r * cols + c] = bits === 32 ? 0xffffffff : ~(0xffffffff >>> bits);
    }
  return {width: cols * 32, inkWidth, height: h, cols, mask, x0, y0};
}

/**
    The chart area as a bitmap of the pixels placed words cover.
*/
export class OccupancyBoard {
  readonly width: number;
  readonly height: number;
  /** 32-pixel words per row, plus one so a shifted sprite never reads past a row. */
  readonly cols: number;
  readonly bits: Uint32Array;

  /**
      @param width The area's width in pixels.
      @param height The area's height in pixels.
  */
  constructor(width: number, height: number) {
    this.width = Math.max(0, Math.floor(width));
    this.height = Math.max(0, Math.floor(height));
    this.cols = ((this.width + 31) >> 5) + 1;
    this.bits = new Uint32Array(this.cols * this.height);
  }

  /** Whether `sprite`, with its top-left at (x, y), lies inside the area. */
  inside(sprite: GlyphSprite, x: number, y: number): boolean {
    return (
      x >= 0 &&
      y >= 0 &&
      x + sprite.inkWidth <= this.width &&
      y + sprite.height <= this.height
    );
  }

  /**
      Whether `sprite`, with its top-left at the whole pixel (x, y), covers
      any pixel already taken. The sprite must lie inside the area.
  */
  collides(sprite: GlyphSprite, x: number, y: number): boolean {
    const {cols: sc, mask, height} = sprite;
    const shift = x & 31;
    const base = x >> 5;
    const back = 32 - shift;
    const bits = this.bits;
    for (let r = 0; r < height; r++) {
      const row = (y + r) * this.cols + base;
      const src = r * sc;
      for (let c = 0; c < sc; c++) {
        const v = mask[src + c];
        if (!v) continue;
        if (shift === 0) {
          if (bits[row + c] & v) return true;
        } else if (
          bits[row + c] & (v >>> shift) ||
          bits[row + c + 1] & (v << back)
        )
          return true;
      }
    }
    return false;
  }

  /** Marks the pixels `sprite` covers, with its top-left at (x, y), as taken. */
  place(sprite: GlyphSprite, x: number, y: number): void {
    const {cols: sc, mask, height} = sprite;
    const shift = x & 31;
    const base = x >> 5;
    const back = 32 - shift;
    const bits = this.bits;
    for (let r = 0; r < height; r++) {
      const row = (y + r) * this.cols + base;
      const src = r * sc;
      for (let c = 0; c < sc; c++) {
        const v = mask[src + c];
        if (!v) continue;
        if (shift === 0) bits[row + c] |= v;
        else {
          bits[row + c] |= v >>> shift;
          bits[row + c + 1] |= v << back;
        }
      }
    }
  }

  /** Whether the pixel at (x, y) is taken. */
  taken(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return (this.bits[y * this.cols + (x >> 5)] & (1 << (31 - (x & 31)))) !== 0;
  }
}
