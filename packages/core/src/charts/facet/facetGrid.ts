/**
    Small multiples: the panel grid. Pure layout math — no chart state.

    @module
*/
import type {FacetCell} from "./facetConfig.js";

/** The box the grid fills, in surface pixels. */
export interface FacetArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Inputs to the grid layout. */
export interface FacetGridOptions {
  /** Fixed column count, if any. */
  columns?: number;
  /** Fixed row count, if any. */
  rows?: number;
  /** Space between panels. */
  padding: number;
  /** Space between columns, when it differs from `padding` (room for axis labels that overhang a panel's sides). */
  columnPadding?: number;
  /** Height of each panel's title band (part of the panel). */
  titleHeight: number;
  /** The panel width/height ratio the chart reads best at. */
  aspect: number;
  /** Extra width for the left and right columns and extra height for the bottom edge (axis labels only those panels draw). */
  gutter?: {left: number; right: number; bottom: number};
}

/**
    How large a chart of `aspect` can draw in a `width` × `height` box: the
    area of the biggest `aspect`-shaped rect that fits.
*/
export function fittedArea(width: number, height: number, aspect: number): number {
  if (width <= 0 || height <= 0) return 0;
  const w = Math.min(width, height * aspect);
  return w * (w / aspect);
}

/**
    The grid's column and row counts for `count` panels. A fixed `columns`
    and/or `rows` is honored (rows grow if the two can't hold every panel);
    otherwise the column count that lets an `aspect`-shaped chart draw
    largest wins, preferring fewer empty cells, then the panel shape closest
    to `aspect`.
*/
export function facetDimensions(
  count: number,
  area: {width: number; height: number},
  opts: FacetGridOptions,
): {columns: number; rows: number} {
  if (count <= 0) return {columns: 0, rows: 0};
  const {columns, rows} = opts;
  if (columns) return {columns: Math.min(columns, count), rows: Math.max(rows ?? 0, Math.ceil(count / columns))};
  if (rows) {
    const cols = Math.ceil(count / rows);
    return {columns: cols, rows: Math.ceil(count / cols)};
  }
  const gutter = opts.gutter ?? {left: 0, right: 0, bottom: 0};
  let best = {columns: 1, rows: count};
  let bestScore = -1, bestEmpty = Infinity, bestShape = Infinity;
  for (let c = 1; c <= count; c++) {
    const r = Math.ceil(count / c);
    const w = (area.width - gutter.left - gutter.right - (c - 1) * (opts.columnPadding ?? opts.padding)) / c;
    const h = (area.height - gutter.bottom - (r - 1) * opts.padding) / r - opts.titleHeight;
    const score = fittedArea(w, h, opts.aspect);
    const empty = c * r - count;
    const shape = h > 0 ? Math.abs(Math.log(w / h / opts.aspect)) : Infinity;
    const better =
      score > bestScore * 1.01 ||
      (score >= bestScore * 0.99 && (empty < bestEmpty || (empty === bestEmpty && shape < bestShape)));
    if (better) {
      best = {columns: c, rows: r};
      bestScore = Math.max(score, bestScore);
      bestEmpty = empty;
      bestShape = shape;
    }
  }
  return best;
}

/**
    Lays `count` panels out left-to-right, top-to-bottom in `area`. Every
    panel is the same size, except that the left and right columns are
    widened by `gutter.left` and `gutter.right` and the panels on the bottom
    edge (those with no panel below them) are deepened by `gutter.bottom`, so
    panels that draw axis labels the others skip keep the same plot area. A
    bottom-edge panel above an empty cell reaches into that cell's space.
*/
export function facetGrid(count: number, area: FacetArea, opts: FacetGridOptions): FacetCell[] {
  const {columns, rows} = facetDimensions(count, area, opts);
  if (!columns) return [];
  const gutter = opts.gutter ?? {left: 0, right: 0, bottom: 0};
  const pad = opts.padding, padX = opts.columnPadding ?? pad;
  const cellW = Math.max(0, (area.width - gutter.left - gutter.right - (columns - 1) * padX) / columns);
  const cellH = Math.max(0, (area.height - gutter.bottom - (rows - 1) * pad) / rows);
  const cells: FacetCell[] = [];
  for (let index = 0; index < count; index++) {
    const row = Math.floor(index / columns), column = index % columns;
    const below = index + columns < count;
    const x = area.x + column * (cellW + padX) + (column ? gutter.left : 0);
    const y = area.y + row * (cellH + pad);
    cells.push({
      index, row, column, x, y,
      width: cellW + (column ? 0 : gutter.left) + (column === columns - 1 ? gutter.right : 0),
      height: cellH + (below ? 0 : gutter.bottom),
      edges: {
        top: row === 0,
        right: column === columns - 1 || index === count - 1,
        bottom: !below,
        left: column === 0,
      },
    });
  }
  return cells;
}
