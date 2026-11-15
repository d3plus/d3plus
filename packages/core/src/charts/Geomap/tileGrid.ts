/**
    Tile-grid maps: each region drawn as one equal hexagon (or square) at a
    fixed `[column, row]` cell of a grid, such as the built-in layout of the
    US states.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import type {ConfigField} from "../../fluent.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {DEFAULT_OCEAN} from "./basemapTheme.js";
import type {Themed} from "./basemapTheme.js";
import {squarePathD} from "./cartogram.js";
import {cartogramKind} from "./cartogramLayout.js";
import type {CartogramRegion, CartogramShape} from "./cartogramLayout.js";

/** A tile-grid layout: each region's `[column, row]`, by id. Odd rows sit half a tile to the right. */
export type TileGridLayout = Record<string, [number, number]>;

/** The tile shapes a tile grid draws. */
export type TileGridShape = "hex" | "square";

/** The US states (and DC) as a hexagon grid, by postal abbreviation. */
export const US_STATES_TILE_GRID: TileGridLayout = {
  AK: [0, 1],
  ME: [11, 1],
  VT: [10, 2],
  NH: [11, 2],
  WA: [1, 3],
  MT: [2, 3],
  ND: [3, 3],
  MN: [4, 3],
  WI: [5, 3],
  MI: [7, 3],
  NY: [9, 3],
  MA: [10, 3],
  RI: [11, 3],
  ID: [2, 4],
  WY: [3, 4],
  SD: [4, 4],
  IA: [5, 4],
  IL: [6, 4],
  IN: [7, 4],
  OH: [8, 4],
  PA: [9, 4],
  NJ: [10, 4],
  CT: [11, 4],
  OR: [1, 5],
  NV: [2, 5],
  CO: [3, 5],
  NE: [4, 5],
  MO: [5, 5],
  KY: [6, 5],
  WV: [7, 5],
  VA: [8, 5],
  MD: [9, 5],
  DE: [10, 5],
  CA: [2, 6],
  UT: [3, 6],
  NM: [4, 6],
  KS: [5, 6],
  AR: [6, 6],
  TN: [7, 6],
  NC: [8, 6],
  SC: [9, 6],
  DC: [10, 6],
  AZ: [3, 7],
  OK: [4, 7],
  LA: [5, 7],
  MS: [6, 7],
  AL: [7, 7],
  GA: [8, 7],
  HI: [0, 8],
  TX: [5, 8],
  FL: [8, 8],
};

/** Each state's postal abbreviation, by its two-digit FIPS code. */
const POSTAL_BY_FIPS: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};

/**
    A US state's postal abbreviation from its id: the abbreviation itself
    (`"CA"`), its FIPS code as a string or number (`"06"`, `6`), or an id
    ending in its FIPS code (`"04000US06"`). Undefined for anything else.
    @param id The state's id.
*/
export function usStateKey(id: unknown): string | undefined {
  const s = `${id ?? ""}`.trim();
  if (/^[A-Za-z]{2}$/.test(s)) {
    const upper = s.toUpperCase();
    return upper in US_STATES_TILE_GRID ? upper : undefined;
  }
  const fips = s.match(/^(?:.*\D)?(\d{1,2})$/);
  return fips ? POSTAL_BY_FIPS[fips[1].padStart(2, "0")] : undefined;
}

/** A Geomap's tile grid: where each region goes, and the key each region is found by. */
export interface TileGrid {
  layout: TileGridLayout;
  /** Whether the layout is a built-in one (whose keys are the tiles' labels). */
  builtin: boolean;
  /** The layout key of a region, from its id, or undefined when the layout has no cell for it. */
  key: (id: unknown) => string | undefined;
  shape: TileGridShape;
  /** The gap between neighboring tiles, in pixels. */
  padding: number;
}

/** The built-in layouts, by name. */
const BUILT_IN: Record<string, {layout: TileGridLayout; key: TileGrid["key"]}> =
  {
    "us-states": {layout: US_STATES_TILE_GRID, key: usStateKey},
  };

/**
    `tileGrid`, resolved: a built-in layout's name, or a layout of the
    user's (whose keys are the regions' ids). Null when it is off.
*/
export function tileGridOf(viz: VizInstance): TileGrid | null {
  const option = viz.schema.tileGrid as string | TileGridLayout | false;
  const shape: TileGridShape =
    viz.schema.tileGridShape === "square" ? "square" : "hex";
  const padding = Math.max(0, Number(viz.schema.tileGridPadding) || 0);
  if (typeof option === "string" && BUILT_IN[option])
    return {...BUILT_IN[option], builtin: true, shape, padding};
  if (option && typeof option === "object") {
    const layout = option;
    return {
      layout,
      builtin: false,
      key: id => (`${id}` in layout ? `${id}` : undefined),
      shape,
      padding,
    };
  }
  return null;
}

/**
    Whether the map redraws its regions as shapes of their own (a
    `cartogram` or a `tileGrid`), leaving out points, links, dots, bins and
    the tiles.
*/
export function regionsReshaped(viz: VizInstance): boolean {
  return Boolean(cartogramKind(viz) || tileGridOf(viz));
}

const SQRT3 = Math.sqrt(3);

/** A coordinate rounded to a thousandth of a pixel. */
const round = (v: number) => Math.round(v * 1000) / 1000;

/**
    A pointy-top hexagon centered on `(x, y)` as polygon path data.
    @param x The center x.
    @param y The center y.
    @param r The distance from the center to each corner.
*/
export function hexPathD(x: number, y: number, r: number): string {
  let d = "";
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    d += `${k ? "L" : "M"}${round(x + r * Math.sin(a))},${round(y - r * Math.cos(a))}`;
  }
  return `${d}Z`;
}

/**
    Each cell's tile, by id: hexagons (or squares) as large as fit the
    layout inside `bounds`, centered there, with odd rows half a tile to the
    right and `padding` pixels between neighbors. A hexagon's `r` is its
    corner radius, and a square's half its side.
    @param cells Each region's id and cell.
    @param bounds The box the tiles fit, `[x0, y0, x1, y1]`.
    @param shape Hexagons or squares.
    @param padding The gap between neighboring tiles, in pixels.
*/
export function tileGridShapes(
  cells: {id: string | number; col: number; row: number}[],
  bounds: [number, number, number, number],
  shape: TileGridShape,
  padding = 0,
): Map<string | number, CartogramShape> {
  const shapes = new Map<string | number, CartogramShape>();
  if (!cells.length) return shapes;
  const hex = shape === "hex";
  // A tile's width, and the step between rows, in tile widths.
  const rowStep = hex ? SQRT3 / 2 : 1;
  const tileHeight = hex ? 2 / SQRT3 : 1;
  const xs = cells.map(c => c.col + (c.row % 2 ? 0.5 : 0));
  const ys = cells.map(c => c.row);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const spanX = maxX - minX + 1;
  const spanY = (maxY - minY) * rowStep + tileHeight;
  const [x0, y0, x1, y1] = bounds;
  const width = Math.max(0, Math.min((x1 - x0) / spanX, (y1 - y0) / spanY));
  const left = x0 + (x1 - x0 - spanX * width) / 2;
  const top = y0 + (y1 - y0 - spanY * width) / 2;
  const gap = Math.min(padding, width / 2);
  cells.forEach((c, i) => {
    const x = left + (xs[i] - minX + 0.5) * width;
    const y = top + ((ys[i] - minY) * rowStep + tileHeight / 2) * width;
    const r = hex ? (width - gap) / SQRT3 : (width - gap) / 2;
    shapes.set(c.id, {
      d: hex ? hexPathD(x, y, r) : squarePathD(x, y, r),
      x,
      y,
      r,
      square: !hex,
    });
  });
  return shapes;
}

/**
    The regions a tile grid draws without a `topojson`: one per cell of the
    layout, joined to the row whose id names it (and taking that id), each
    with a feature of no geometry standing in for its shape.
    @param grid The tile grid.
    @param data Each region's datum, by its id.
*/
export function tileGridRegions(
  grid: TileGrid,
  data: Record<string, DataPoint>,
): (CartogramRegion & {__d3plus__: true})[] {
  const byKey = new Map<string, string>();
  for (const id of Object.keys(data)) {
    const key = grid.key(id);
    if (key !== undefined && !byKey.has(key)) byKey.set(key, id);
  }
  return Object.keys(grid.layout).map(key => {
    const id = byKey.get(key) ?? key;
    const feature = {type: "Feature", id, properties: {}, geometry: null};
    return {__d3plus__: true, data: data[id], feature, id};
  });
}

/**
    Each region's tile, by region id, for the regions the tile grid's
    layout has a cell for (the first region found for each cell). Null
    when `tileGrid` is off.
    @param viz The Geomap.
    @param regions The regions.
    @param bounds The box the tiles fit, `[x0, y0, x1, y1]`.
*/
export function geomapTileGrid(
  viz: VizInstance,
  regions: CartogramRegion[],
  bounds: [number, number, number, number],
): Map<string | number, CartogramShape> | null {
  const grid = tileGridOf(viz);
  if (!grid) return null;
  const taken = new Set<string>();
  const cells: {id: string | number; col: number; row: number}[] = [];
  for (const region of regions) {
    const key = grid.key(region.id);
    const cell = key === undefined ? undefined : grid.layout[key];
    if (!cell || taken.has(key!)) continue;
    taken.add(key!);
    cells.push({id: region.id, col: Number(cell[0]), row: Number(cell[1])});
  }
  return tileGridShapes(cells, bounds, grid.shape, grid.padding);
}

/** Geomap's tile-grid fields. */
export function tileGridFields(): ConfigField[] {
  return [
    /**
        Draws each region as one equal tile at a fixed cell of a grid:
        `"us-states"` for the built-in hexagon grid of the US states (and
        DC), or a layout of your own, `{[id]: [column, row]}`, where odd
        rows sit half a tile to the right. `false` (the default) draws the
        map.
        @type {false | "us-states" | Record<string, [number, number]>}
    */
    {key: "tileGrid", default: false},
    /**
        The tiles of a `tileGrid`: `"hex"` (the default) for hexagons, or
        `"square"` for squares.
        @type {"hex" | "square"}
    */
    {key: "tileGridShape", default: "hex"},
    /**
        The gap between neighboring `tileGrid` tiles, in pixels.
        @type {number}
    */
    {key: "tileGridPadding", default: 2},
  ];
}

/**
    The color behind the map: `ocean`, or without one set, no backdrop
    behind a tile grid.
    @param viz The Geomap.
*/
export function tileGridOcean(viz: VizInstance): Themed<string> {
  const ocean = viz.schema.ocean as Themed<string>;
  return ocean === DEFAULT_OCEAN && tileGridOf(viz) ? "transparent" : ocean;
}
