/**
    Dashboard: the grid its charts are placed on. Pure layout math, no chart
    state: track sizes, CSS-grid-style placement with spans, and each
    chart's cell in pixels.

    @module
*/
import {facetDimensions} from "../facet/facetGrid.js";
import type {
  DashboardLayoutConfig,
  DashboardPlacement,
} from "./dashboardTypes.js";

/** `layoutConfig` with every option resolved. */
export interface ResolvedDashboardLayout {
  columns?: number | number[];
  rows?: number | number[];
  padding: number;
  align: boolean;
  shareX: boolean;
  shareY: boolean;
}

/** The space between charts when `layoutConfig.padding` isn't set. */
export const DASHBOARD_PADDING = 4;

/** The width/height ratio the automatic column count aims each chart at. */
export const DASHBOARD_ASPECT = 4 / 3;

/** A box in dashboard pixels. */
export interface DashboardArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A chart's placement on the grid, resolved to whole tracks. */
export interface DashboardSlot {
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
}

/** A chart's cell: its slot and its box in dashboard pixels. */
export interface DashboardCell extends DashboardSlot, DashboardArea {
  index: number;
}

/** `layoutConfig` with its defaults applied. */
export function resolveDashboardLayout(raw: unknown): ResolvedDashboardLayout {
  const c = (
    raw && typeof raw === "object" ? raw : {}
  ) as DashboardLayoutConfig;
  return {
    columns: c.columns,
    rows: c.rows,
    padding:
      typeof c.padding === "number" && c.padding >= 0
        ? c.padding
        : DASHBOARD_PADDING,
    align: c.align !== false,
    shareX: c.shareX === true,
    shareY: c.shareY === true,
  };
}

/** A whole number of at least 1, or undefined. */
function count(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : undefined;
}

/** The number of tracks a `columns`/`rows` value asks for, or undefined when it doesn't fix one. */
export function trackCount(spec: number | number[] | undefined) {
  return Array.isArray(spec) ? spec.length || undefined : count(spec);
}

/**
    Each of `n` tracks' share of the space: the weights `spec` gives (a
    non-positive or missing weight counts as 1), and 1 for every track it
    doesn't cover.
*/
export function trackWeights(
  spec: number | number[] | undefined,
  n: number,
): number[] {
  const given = Array.isArray(spec) ? spec : [];
  return Array.from({length: n}, (_, i) => {
    const w = given[i];
    return typeof w === "number" && Number.isFinite(w) && w > 0 ? w : 1;
  });
}

/**
    Splits `length` pixels into tracks sized by `weights`, with `padding`
    between them. Returns each track's start (relative to 0) and size.
*/
export function trackOffsets(
  weights: number[],
  length: number,
  padding: number,
): {start: number; size: number}[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const free = Math.max(0, length - padding * Math.max(0, weights.length - 1));
  let start = 0;
  return weights.map(w => {
    const size = (free * w) / total;
    const track = {start, size};
    start += size + padding;
    return track;
  });
}

/** A span clamped to `[1, max]`. */
function span(value: unknown, max: number): number {
  return Math.min(max, count(value) ?? 1);
}

/**
    Places every chart on a grid `columns` wide, the way CSS grid places
    items: charts with both a `row` and a `column` first, at that cell, then
    the rest in order, each in the first free cell that fits its span,
    scanning rows top to bottom (only its row, or only its column, when it
    gives one). A span wider than the grid is clamped to it. Charts may
    overlap only when two fix the same cell.
*/
export function placeCharts(
  placements: DashboardPlacement[],
  columns: number,
): DashboardSlot[] {
  const taken: boolean[][] = [];
  const free = (s: DashboardSlot): boolean => {
    if (s.column + s.columnSpan > columns) return false;
    for (let r = s.row; r < s.row + s.rowSpan; r++)
      for (let c = s.column; c < s.column + s.columnSpan; c++)
        if (taken[r]?.[c]) return false;
    return true;
  };
  const take = (s: DashboardSlot): DashboardSlot => {
    for (let r = s.row; r < s.row + s.rowSpan; r++) {
      taken[r] ??= [];
      for (let c = s.column; c < s.column + s.columnSpan; c++)
        taken[r][c] = true;
    }
    return s;
  };
  const slots: (DashboardSlot | undefined)[] = placements.map(() => undefined);
  const sized = placements.map(p => ({
    column: count((p.column ?? -1) + 1),
    row: count((p.row ?? -1) + 1),
    columnSpan: span(p.columnSpan, columns),
    rowSpan: span(p.rowSpan, Infinity),
  }));
  sized.forEach((p, i) => {
    if (p.column === undefined || p.row === undefined) return;
    const column = Math.min(p.column - 1, columns - p.columnSpan);
    slots[i] = take({...p, column, row: p.row - 1});
  });
  sized.forEach((p, i) => {
    if (slots[i]) return;
    const fixedColumn =
      p.column !== undefined
        ? Math.min(p.column - 1, columns - p.columnSpan)
        : undefined;
    for (let row = p.row !== undefined ? p.row - 1 : 0; ; row++) {
      const first = fixedColumn ?? 0;
      const last = fixedColumn ?? columns - p.columnSpan;
      for (let column = first; column <= last; column++) {
        const slot = {...p, column, row};
        if (free(slot)) {
          slots[i] = take(slot);
          break;
        }
      }
      // A chart fixed to one row that has no room there overlaps its end.
      if (!slots[i] && p.row !== undefined && fixedColumn === undefined) {
        slots[i] = take({...p, column: columns - p.columnSpan, row});
      }
      if (slots[i]) break;
    }
  });
  return slots as DashboardSlot[];
}

/**
    The grid's column count: `columns` when it fixes one; otherwise enough
    for `rows` to hold every chart, or the count that draws `count` charts
    of `DASHBOARD_ASPECT` largest in `area`. Never fewer than a placed chart's
    column and span reach.
*/
export function dashboardColumns(
  placements: DashboardPlacement[],
  area: {width: number; height: number},
  layout: Pick<ResolvedDashboardLayout, "columns" | "rows" | "padding">,
): number {
  const reach = Math.max(
    1,
    ...placements.map(
      p => (count((p.column ?? -1) + 1) ?? 1) + (count(p.columnSpan) ?? 1) - 1,
    ),
  );
  const fixed = trackCount(layout.columns);
  if (fixed) return fixed;
  const rows = trackCount(layout.rows);
  const n = placements.length;
  const auto = rows
    ? Math.ceil(n / rows)
    : facetDimensions(n, area, {
        padding: layout.padding,
        titleHeight: 0,
        aspect: DASHBOARD_ASPECT,
      }).columns;
  return Math.max(reach, auto || 1);
}

/** Lays the charts out in `area`: each one's grid slot and box. */
export function dashboardGrid(
  placements: DashboardPlacement[],
  area: DashboardArea,
  layout: Pick<ResolvedDashboardLayout, "columns" | "rows" | "padding">,
): DashboardCell[] {
  if (!placements.length) return [];
  const columns = dashboardColumns(placements, area, layout);
  const slots = placeCharts(placements, columns);
  const rows = Math.max(
    trackCount(layout.rows) ?? 0,
    ...slots.map(s => s.row + s.rowSpan),
  );
  const xs = trackOffsets(
    trackWeights(layout.columns, columns),
    area.width,
    layout.padding,
  );
  const ys = trackOffsets(
    trackWeights(layout.rows, rows),
    area.height,
    layout.padding,
  );
  return slots.map((slot, index) => {
    const first = xs[slot.column],
      last = xs[slot.column + slot.columnSpan - 1];
    const top = ys[slot.row],
      bottom = ys[slot.row + slot.rowSpan - 1];
    return {
      index,
      ...slot,
      x: area.x + first.start,
      y: area.y + top.start,
      width: last.start + last.size - first.start,
      height: bottom.start + bottom.size - top.start,
    };
  });
}
