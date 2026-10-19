/**
    Pure Waffle layout math: how many cells each category gets, the grid's
    shape, and where each cell sits.

    @module
*/

/** The order cells fill the grid in: along each row, or down each column. */
export type WaffleFillDirection = "row" | "column";

/** The grid corner the first cell sits in. */
export type WaffleFillStart =
  "top-left" | "top-right" | "bottom-left" | "bottom-right";

/** A cell's grid position: its row (from the top) and column (from the left). */
export interface WaffleGridPosition {
  row: number;
  column: number;
}

/** The pixel geometry of a grid of square cells centered in an area. */
export interface WaffleCellGeometry {
  /** The side length of each cell. */
  size: number;
  /** The gap between neighboring cells. */
  padding: number;
  /** The left edge of the first column. */
  x: number;
  /** The top edge of the first row. */
  y: number;
}

const finitePositive = (v: number): number =>
  Number.isFinite(v) && v > 0 ? v : 0;

/**
    Splits `total` whole units among `values` in proportion to each value,
    using the largest-remainder (Hamilton) method: every value first gets the
    floor of its exact quota, then the units left over go one each to the
    values with the largest fractional remainders. The counts always sum to
    `total` (when any value is positive). Ties go to the larger value, then
    to the earlier one. Non-finite and non-positive values get 0.
*/
export function largestRemainder(values: number[], total: number): number[] {
  const clean = values.map(finitePositive);
  const sum = clean.reduce((a, b) => a + b, 0);
  const units = Math.max(0, Math.round(finitePositive(total)));
  if (!sum || !units) return clean.map(() => 0);
  const quotas = clean.map(v => (v / sum) * units);
  const counts = quotas.map(Math.floor);
  let left = units - counts.reduce((a, b) => a + b, 0);
  const order = quotas
    .map((q, i) => ({i, r: q - counts[i], v: clean[i]}))
    .filter(d => d.v > 0)
    .sort((a, b) => b.r - a.r || b.v - a.v || a.i - b.i);
  for (let k = 0; left > 0 && order.length; k = (k + 1) % order.length) {
    counts[order[k].i]++;
    left--;
  }
  return counts;
}

/**
    The number of cells each value fills. Without `unit`, the values share
    all `cells` of the grid (each cell is `1 / cells` of the total). With a
    positive `unit`, each cell stands for `unit` of the value, and the values
    share `round(sum / unit)` cells.
*/
export function waffleCounts(
  values: number[],
  {cells, unit}: {cells: number; unit?: number},
): number[] {
  if (unit !== undefined && finitePositive(unit)) {
    const sum = values.map(finitePositive).reduce((a, b) => a + b, 0);
    return largestRemainder(values, Math.round(sum / unit));
  }
  return largestRemainder(values, cells);
}

/**
    The grid's rows and columns for `count` filled cells. Without `unit` the
    grid is `rows × columns`. With `unit`, the count sets its size: a
    row-wise fill keeps `columns` and adds rows as needed, a column-wise fill
    keeps `rows` and adds columns.
*/
export function waffleGrid(
  count: number,
  {
    rows,
    columns,
    fillDirection,
    unit,
  }: {
    rows: number;
    columns: number;
    fillDirection: WaffleFillDirection;
    unit?: number;
  },
): {rows: number; columns: number} {
  const r = Math.max(1, Math.round(finitePositive(rows)) || 1);
  const c = Math.max(1, Math.round(finitePositive(columns)) || 1);
  if (unit === undefined || !finitePositive(unit)) return {rows: r, columns: c};
  const n = Math.max(1, count);
  return fillDirection === "column"
    ? {rows: r, columns: Math.ceil(n / r)}
    : {rows: Math.ceil(n / c), columns: c};
}

/**
    The grid position of the `k`th cell (0-based) in fill order: along each
    row (or down each column for `"column"`), starting from `fillStart`.
*/
export function waffleCellPosition(
  k: number,
  {
    rows,
    columns,
    fillDirection,
    fillStart,
  }: {
    rows: number;
    columns: number;
    fillDirection: WaffleFillDirection;
    fillStart: WaffleFillStart;
  },
): WaffleGridPosition {
  let row = fillDirection === "column" ? k % rows : Math.floor(k / columns);
  let column = fillDirection === "column" ? Math.floor(k / rows) : k % columns;
  if (fillStart.startsWith("bottom")) row = rows - 1 - row;
  if (fillStart.endsWith("right")) column = columns - 1 - column;
  return {row, column};
}

/**
    Sizes a `rows × columns` grid of square cells to the largest that fits
    `width × height` with `padding` pixels between cells, and centers it.
    The gap shrinks to at most 40% of a cell's pitch, so tiny grids (small
    multiples) keep visible cells.
*/
export function waffleCellGeometry(
  width: number,
  height: number,
  {rows, columns, padding}: {rows: number; columns: number; padding: number},
): WaffleCellGeometry {
  const w = finitePositive(width);
  const h = finitePositive(height);
  const r = Math.max(1, rows);
  const c = Math.max(1, columns);
  let pad = finitePositive(padding);
  let pitch = Math.min((w + pad) / c, (h + pad) / r);
  if (pad > pitch * 0.4) {
    pad = 0.4 * Math.min(w / c, h / r);
    pitch = Math.min((w + pad) / c, (h + pad) / r);
  }
  const size = Math.max(0, pitch - pad);
  const gridWidth = c * size + (c - 1) * pad;
  const gridHeight = r * size + (r - 1) * pad;
  return {
    size,
    padding: pad,
    x: (w - gridWidth) / 2,
    y: (h - gridHeight) / 2,
  };
}
