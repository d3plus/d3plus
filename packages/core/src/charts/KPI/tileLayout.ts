/**
    Where KPI tiles go: the grid of tiles in the chart area, the label,
    value, delta, and sparkline inside each tile, and the sparkline's
    points. Pure layout math, no chart state.
*/

import {facetGrid} from "../facet/facetGrid.js";

/** A box, in pixels. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How the tiles fill the chart area. */
export interface KpiGridOptions {
  /** A fixed column count. */
  columns?: number;
  /** A fixed row count. */
  rows?: number;
  /** The space between tiles. */
  padding: number;
  /** The tile width/height ratio the grid aims for. */
  aspect: number;
}

/** The tile width/height ratio the grid aims for by default. */
export const TILE_ASPECT = 1.75;

/** The space between tiles by default, in pixels. */
export const TILE_PADDING = 12;

/**
    The boxes of `count` tiles, left to right and top to bottom, filling
    `area`: the column count that draws `aspect`-shaped tiles largest wins,
    as it does for small multiples.
*/
export function kpiGrid(count: number, area: Box, opts: KpiGridOptions): Box[] {
  return facetGrid(count, area, {...opts, titleHeight: 0}).map(c => ({
    x: c.x,
    y: c.y,
    width: c.width,
    height: c.height,
  }));
}

/** One line of text in a tile: its vertical center and font size. */
export interface TileLine {
  y: number;
  size: number;
}

/** The parts of a tile, in the tile's own coordinates. */
export interface TileContent {
  /** The inset around the content. */
  pad: number;
  label?: TileLine;
  /** The value's line, left out of a tile too small to hold it. */
  value?: TileLine;
  delta?: TileLine;
  /** Whether the words after the delta have room. */
  comparison: boolean;
  sparkline?: Box;
}

/** Which parts a tile shows. */
export interface TileParts {
  label: boolean;
  delta: boolean;
  sparkline: boolean;
}

/** The largest the value is drawn, in pixels. */
export const MAX_VALUE_SIZE = 64;

/** The shortest a sparkline is drawn; a tile with less room drops it. */
export const MIN_SPARKLINE_HEIGHT = 16;

/** The smallest value a tile keeps room for beside a sparkline, in pixels. */
export const MIN_VALUE_SIZE = 18;

/** The smallest any text in a tile is drawn; text that would be smaller is left out. */
export const MIN_TEXT_SIZE = 8;

/** The line height, as a multiple of the font size. */
const LEADING = 1.25;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** The height of lines of these font sizes, `gap` apart. */
const blockHeight = (sizes: number[], gap: number) =>
  sizes.reduce((sum, s) => sum + s * LEADING, 0) +
  Math.max(0, sizes.length - 1) * gap;

/**
    Lays out a `width` × `height` tile: the label, the value, and the delta
    stacked from the top, and the sparkline filling the bottom. Font sizes
    grow with the tile. A tile without a sparkline centers its text. In a
    tile too short for its text, the value shrinks first; then the label and
    delta shrink and the comparison words go, then the label, then the
    delta, and last the value, so nothing is drawn outside the tile.
*/
export function tileContent(
  width: number,
  height: number,
  parts: TileParts,
): TileContent {
  const pad = Math.min(
    clamp(Math.min(width, height) * 0.08, 6, 18),
    Math.min(width, height) * 0.15,
  );
  const inner = Math.max(0, height - pad * 2);
  const gap = clamp(height * 0.03, 2, 8);
  let labelSize = parts.label ? clamp(height * 0.085, 10, 15) : 0;
  let deltaSize = parts.delta ? clamp(height * 0.08, 10, 14) : 0;
  const lines = () => [labelSize, deltaSize].filter(s => s > 0);
  // The room left for the value beside the other lines, as a font size.
  const valueRoom = (extra = 0) =>
    (inner - blockHeight(lines(), gap) - (lines().length ? gap : 0) - extra) /
    LEADING;
  let spark = parts.sparkline ? Math.min(inner * 0.32, 96) : 0;
  // A sparkline gives way when it would leave the value too little room.
  if (spark < MIN_SPARKLINE_HEIGHT || valueRoom(spark + gap) < MIN_VALUE_SIZE)
    spark = 0;
  const cap = spark ? MAX_VALUE_SIZE : Math.min(MAX_VALUE_SIZE, inner * 0.45);
  const preferred = clamp(valueRoom(spark ? spark + gap : 0), 12, cap);
  let valueSize = Math.min(preferred, valueRoom(spark ? spark + gap : 0));
  let comparison = true;
  if (!spark && valueSize < 12) {
    comparison = false;
    if (labelSize) labelSize = MIN_TEXT_SIZE;
    if (deltaSize) deltaSize = MIN_TEXT_SIZE;
    valueSize = Math.min(preferred, valueRoom());
    if (valueSize < 10 && labelSize) {
      labelSize = 0;
      valueSize = Math.min(preferred, valueRoom());
    }
    if (valueSize < 10 && deltaSize) {
      deltaSize = 0;
      valueSize = Math.min(preferred, valueRoom());
    }
  }
  const hasValue = valueSize >= MIN_TEXT_SIZE;
  const sizes = [labelSize, hasValue ? valueSize : 0, deltaSize].filter(
    v => v > 0,
  );
  const block = blockHeight(sizes, gap);
  let y = spark ? pad : pad + Math.max(0, (inner - block) / 2);
  const line = (size: number): TileLine => {
    const out = {y: y + (size * LEADING) / 2, size};
    y += size * LEADING + gap;
    return out;
  };
  const out: TileContent = {pad, comparison};
  if (labelSize) out.label = line(labelSize);
  if (hasValue) out.value = line(valueSize);
  if (deltaSize) out.delta = line(deltaSize);
  if (spark)
    out.sparkline = {
      x: pad,
      y: height - pad - spark,
      width: Math.max(0, width - pad * 2),
      height: spark,
    };
  return out;
}

/** How a sparkline draws: a line, a line over a filled area, or bars. */
export type SparklineType = "line" | "area" | "bar";

/** Coerces a `sparkline` setting to a type, or false for none. */
export function sparklineType(value: unknown): SparklineType | false {
  if (value === false) return false;
  return value === "line" || value === "bar" ? value : "area";
}

/** A sparkline point, placed: `x` and `y` in pixels, `base` the zero (bars) or bottom (areas) line. */
export interface SparkPoint {
  x: number;
  y: number;
  base: number;
}

/**
    Places a series of `values` in `box`, evenly spaced in order: points
    spanning the box's width for a line or area, the centers of equal bands
    for bars. Bars read from zero; lines and areas fit the values' range. A
    point with no value gets `NaN` coordinates.
*/
export function sparklinePoints(
  values: number[],
  box: Box,
  type: SparklineType,
): SparkPoint[] {
  const n = values.length;
  const finite = values.filter(Number.isFinite);
  if (!n || !finite.length) return [];
  let lo = Math.min(...finite),
    hi = Math.max(...finite);
  if (type === "bar") {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  const span = hi - lo;
  const bottom = box.y + box.height;
  // Equal values sit mid-height on a line; bars that are all zero stay flat.
  const y = (v: number) =>
    span > 0
      ? bottom - ((v - lo) / span) * box.height
      : type === "bar"
        ? bottom
        : box.y + box.height / 2;
  const base = type === "bar" ? y(0) : bottom;
  const x = (k: number) =>
    type === "bar"
      ? box.x + ((k + 0.5) / n) * box.width
      : n > 1
        ? box.x + (k / (n - 1)) * box.width
        : box.x + box.width / 2;
  return values.map((v, k) =>
    Number.isFinite(v) ? {x: x(k), y: y(v), base} : {x: NaN, y: NaN, base},
  );
}
