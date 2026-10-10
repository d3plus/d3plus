/**
    Pure grid geometry for Calendar: the cell size that fits a set of blocks
    into the chart area, where a (week, weekday) slot lands in pixels for each
    orientation, and the outline around a month inside a year block.
*/

/**
    `"horizontal"` runs weeks left to right with weekdays down the side;
    `"vertical"` runs weeks top to bottom with weekdays across the top.
*/
export type CalendarOrient = "horizontal" | "vertical";

/** What `fitCalendar` sizes: equal blocks, each a grid of cells below and beside its labels. */
export interface CalendarFitInput {
  /** How many blocks to place. */
  count: number;
  /** Cells across one block. */
  gridColumns: number;
  /** Cells down one block. */
  gridRows: number;
  /** Pixels above each block's cells (its labels). */
  insetTop: number;
  /** Pixels left of each block's cells (its labels). */
  insetLeft: number;
  /** Pixels between neighboring blocks. */
  gap: number;
  /** The area to fill. */
  width: number;
  height: number;
  /** Blocks per row; when unset, the count that gives the largest cells. */
  columns?: number;
}

/** The fitted cell size and the block arrangement it allows. */
export interface CalendarFit {
  cell: number;
  /** Blocks per row. */
  columns: number;
  /** Rows of blocks. */
  rows: number;
  blockWidth: number;
  blockHeight: number;
  /** The whole arrangement's size. */
  width: number;
  height: number;
}

/**
    The largest square cell that fits `count` blocks into the area, arranged
    in rows of `columns` blocks (or whichever column count gives the largest
    cell, preferring fewer columns on ties).
*/
export function fitCalendar(input: CalendarFitInput): CalendarFit {
  const {
    count,
    gridColumns,
    gridRows,
    insetTop,
    insetLeft,
    gap,
    width,
    height,
  } = input;
  const n = Math.max(1, count);
  const candidates = input.columns
    ? [Math.min(n, Math.max(1, Math.round(input.columns)))]
    : Array.from({length: n}, (_, k) => k + 1);
  let best: {cell: number; columns: number; rows: number} | undefined;
  for (const columns of candidates) {
    const rows = Math.ceil(n / columns);
    const cellW =
      (width - columns * insetLeft - (columns - 1) * gap) /
      (columns * gridColumns);
    const cellH =
      (height - rows * insetTop - (rows - 1) * gap) / (rows * gridRows);
    const cell = Math.max(0, Math.min(cellW, cellH));
    if (!best || cell > best.cell + 1e-9) best = {cell, columns, rows};
  }
  const {cell, columns, rows} = best!;
  const blockWidth = insetLeft + gridColumns * cell;
  const blockHeight = insetTop + gridRows * cell;
  return {
    cell,
    columns,
    rows,
    blockWidth,
    blockHeight,
    width: columns * blockWidth + (columns - 1) * gap,
    height: rows * blockHeight + (rows - 1) * gap,
  };
}

/** The top-left corner, in cell units, of a (week, weekday) slot. */
export function slotPosition(
  week: number,
  day: number,
  orient: CalendarOrient,
): [number, number] {
  return orient === "vertical" ? [day, week] : [week, day];
}

/** Cells across and down one block of `weeks` weeks. */
export function blockGrid(
  weeks: number,
  orient: CalendarOrient,
): {columns: number; rows: number} {
  return orient === "vertical"
    ? {columns: 7, rows: weeks}
    : {columns: weeks, rows: 7};
}

/**
    The outline around a month inside a year block, as an SVG path in pixels:
    the boundary of every cell from its first day (week `w0`, slot `d0`)
    through its last (week `w1`, slot `d1`), running along the cell edges.
*/
export function monthOutlinePath(
  first: {week: number; day: number},
  last: {week: number; day: number},
  cell: number,
  orient: CalendarOrient,
): string {
  const {week: w0, day: d0} = first;
  const {week: w1, day: d1} = last;
  const points: [number, number][] = [
    [w0 + 1, d0],
    [w0, d0],
    [w0, 7],
    [w1, 7],
    [w1, d1 + 1],
    [w1 + 1, d1 + 1],
    [w1 + 1, 0],
    [w0 + 1, 0],
  ];
  const round = (v: number) => Math.round(v * 100) / 100;
  return `${points
    .map(([w, d], k) => {
      const [x, y] = slotPosition(w, d, orient);
      return `${k ? "L" : "M"}${round(x * cell)},${round(y * cell)}`;
    })
    .join("")}Z`;
}

/**
    The week a month's label sits beside: its first full week, so the label
    lines up with the bulk of the month rather than a lone leading day.
*/
export function monthLabelWeek(first: {week: number; day: number}): number {
  return first.day === 0 ? first.week : first.week + 1;
}

/**
    Which weekday slots get a label: all seven when the cells are at least
    `minSpacing` pixels apart, else every other one starting from the second
    (Mon/Wed/Fri on a Sunday-first week).
*/
export function weekdayLabelSlots(cell: number, minSpacing: number): number[] {
  return cell >= minSpacing ? [0, 1, 2, 3, 4, 5, 6] : [1, 3, 5];
}

/** The corner radius of a cell `size` pixels wide: `radius`, kept below a third of the size. */
export function cellCornerRadius(radius: number, size: number): number {
  if (!(radius > 0) || !(size > 0)) return 0;
  return Math.min(radius, size / 3);
}
