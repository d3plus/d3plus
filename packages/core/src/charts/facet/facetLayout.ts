/**
    Small multiples on a map-shaped grid (`facetConfig.layout`): placing
    each facet value in its cell, and laying the cells out, with empty cells
    left empty. Pure layout math, no chart state.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {
  FacetCell,
  FacetValue,
  ResolvedFacetConfig,
} from "./facetConfig.js";
import type {FacetGroup} from "./facetData.js";
import type {FacetArea, FacetGridOptions} from "./facetGrid.js";
import {FACET_LAYOUTS} from "./facetLayouts.js";
import type {FacetLayoutCell} from "./facetLayouts.js";

/**
    `facetConfig.layout`: a named map-shaped grid (`"us-states"`,
    `"eu-countries"`, `"world-regions"`), or a grid of your own mapping each
    facet value to its `[row, column]` (from 0, top left).
*/
export type FacetLayout = string | Record<string, [number, number]>;

/** Whether `v` is a whole number of at least 0. */
const isPlace = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;

/**
    The cells a `layout` setting describes: a named layout's, or one cell
    per entry of a `{[value]: [row, column]}` map (its value as the code).
    Undefined for anything else, including a name no layout has.
*/
export function resolveFacetLayout(
  layout: unknown,
): FacetLayoutCell[] | undefined {
  if (typeof layout === "string") return FACET_LAYOUTS[layout];
  if (!layout || typeof layout !== "object" || Array.isArray(layout))
    return undefined;
  const out: FacetLayoutCell[] = [];
  for (const [code, place] of Object.entries(layout)) {
    if (!Array.isArray(place)) continue;
    const [row, column] = place;
    if (isPlace(row) && isPlace(column)) out.push({code, row, column});
  }
  return out.length ? out : undefined;
}

/** A value as the text a layout matches it by: trimmed and lower-cased. */
const matchKey = (value: unknown): string => `${value}`.trim().toLowerCase();

/**
    Finds a facet value's cell: the cell whose code, name, or alias it
    equals, ignoring case and surrounding space.
*/
export function layoutMatcher(
  cells: FacetLayoutCell[],
): (value: unknown) => FacetLayoutCell | undefined {
  const index = new Map<string, FacetLayoutCell>();
  for (const cell of cells)
    for (const name of [cell.code, cell.name, ...(cell.aliases ?? [])])
      if (name !== undefined && !index.has(matchKey(name)))
        index.set(matchKey(name), cell);
  return value => index.get(matchKey(value));
}

/** A facet group placed in its cell. */
export interface PlacedFacet<G> {
  group: G;
  cell: FacetLayoutCell;
}

/**
    Places each group in its cell, in the order given. Groups whose value no
    cell matches, and groups whose cell an earlier group took, are left out
    and returned as `missing`.
*/
export function placeFacets<G extends Pick<FacetGroup, "value">>(
  groups: G[],
  cells: FacetLayoutCell[],
): {placed: PlacedFacet<G>[]; missing: G[]} {
  const match = layoutMatcher(cells);
  const taken = new Set<FacetLayoutCell>();
  const placed: PlacedFacet<G>[] = [];
  const missing: G[] = [];
  for (const group of groups) {
    const cell = match(group.value);
    if (!cell || taken.has(cell)) missing.push(group);
    else {
      taken.add(cell);
      placed.push({group, cell});
    }
  }
  return {placed, missing};
}

/** The grid's row and column counts: enough for every cell of the layout. */
export function layoutDimensions(
  cells: Pick<FacetLayoutCell, "row" | "column">[],
): {
  rows: number;
  columns: number;
} {
  return {
    rows: Math.max(0, ...cells.map(c => c.row + 1)),
    columns: Math.max(0, ...cells.map(c => c.column + 1)),
  };
}

/**
    Lays panels out on a map-shaped grid: panel `i` in the cell at
    `places[i]`, every cell the same size, empty cells left empty. A panel
    with no panel directly to its left or below it is on that edge: it is
    widened by `gutter.left`, or deepened by `gutter.bottom`, reaching into
    the empty cell beside it (or the grid's gutter) for the axis labels only
    edge panels draw. The rightmost column is widened by `gutter.right`.
    @param places Each panel's row and column.
    @param grid The grid's row and column counts (see `layoutDimensions`).
    @param area The box the grid fills.
    @param opts The padding and gutters (see `facetGrid`).
*/
export function layoutGridCells(
  places: Pick<FacetLayoutCell, "row" | "column">[],
  grid: {rows: number; columns: number},
  area: FacetArea,
  opts: Pick<FacetGridOptions, "padding" | "columnPadding" | "gutter">,
): FacetCell[] {
  const {rows, columns} = grid;
  if (!rows || !columns) return [];
  const gutter = opts.gutter ?? {left: 0, right: 0, bottom: 0};
  const pad = opts.padding,
    padX = opts.columnPadding ?? pad;
  const cellW = Math.max(
    0,
    (area.width - gutter.left - gutter.right - (columns - 1) * padX) / columns,
  );
  const cellH = Math.max(
    0,
    (area.height - gutter.bottom - (rows - 1) * pad) / rows,
  );
  const filled = new Set(places.map(p => `${p.row},${p.column}`));
  const has = (row: number, column: number) => filled.has(`${row},${column}`);
  return places.map(({row, column}, index) => {
    const edges = {
      top: !has(row - 1, column),
      right: !has(row, column + 1),
      bottom: !has(row + 1, column),
      left: !has(row, column - 1),
    };
    const x = area.x + gutter.left + column * (cellW + padX);
    return {
      index,
      row,
      column,
      x: edges.left ? x - gutter.left : x,
      y: area.y + row * (cellH + pad),
      width:
        cellW +
        (edges.left ? gutter.left : 0) +
        (column === columns - 1 ? gutter.right : 0),
      height: cellH + (edges.bottom ? gutter.bottom : 0),
      edges,
    };
  });
}

/**
    Each placed panel's title: its cell's short code (`"CA"`), or what
    `facetConfig.title` returns, or nothing with titles off.
*/
export function layoutTitleTexts(
  config: Pick<ResolvedFacetConfig, "title">,
  panels: {value: FacetValue; data: DataPoint[]}[],
  places: Pick<FacetLayoutCell, "code">[],
): string[] {
  const {title} = config;
  return panels.map((p, i) =>
    title === false
      ? ""
      : title
        ? `${title(p.value, p.data)}`
        : (places[i]?.code ?? ""),
  );
}

/** What hovering each panel's title shows: its place's full name, unless the title already reads it. */
export function layoutTitleTooltips(
  texts: string[],
  places: Pick<FacetLayoutCell, "name">[],
): (string | undefined)[] {
  return texts.map((text, i) => {
    const name = places[i]?.name;
    return text && name && name !== text ? name : undefined;
  });
}

/**
    The values left out of a map-shaped grid, for a warning: up to `limit`
    of them, then how many more.
*/
export function missingFacetMessage(values: unknown[], limit = 5): string {
  const shown = values.slice(0, limit).map(v => `"${v}"`);
  const more = values.length - shown.length;
  return `${shown.join(", ")}${more > 0 ? ` and ${more} more` : ""}`;
}
