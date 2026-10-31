/**
    Alluvial aggregation: rows → one node per category per dimension, and the
    bands between adjacent columns. Each row's whole path is traced, so every
    band is split by the row's category in the `colorBy` column (its origin)
    and keeps that origin's color across every column.
*/

import type {DataPoint} from "@d3plus/data";

import {isMissingCategory} from "./dimensions.js";
import type {AlluvialAccessor, AlluvialDimension} from "./dimensions.js";

/** One category of one dimension: a node in that dimension's column. */
export interface AlluvialNode {
  /** Unique across the chart: the column index and the category. */
  id: string;
  /** The column (dimension index) it sits in. */
  column: number;
  /** The category's value, as the first row with it gave it. */
  category: unknown;
  /** The category as text. */
  label: string;
  /** The summed value of the rows in this category. */
  value: number;
  /** The order the category first appeared in, within its column. */
  first: number;
  /** Its position in the column once ordered (see `sortAlluvialColumns`). */
  rank: number;
  /** The indices (into `AlluvialGraph.rows`) of the rows in this category. */
  rows: number[];
  /** The indices of the paths through this node. */
  paths: Set<number>;
  /** The bands leaving this node, to the next column. */
  sourceBands: AlluvialBand[];
  /** The bands entering this node, from the previous column. */
  targetBands: AlluvialBand[];
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The rows of one origin flowing from one node to a node in the next column. */
export interface AlluvialBand {
  /** Unique across the chart: its ends and origin. */
  id: string;
  /** The column its source sits in. */
  column: number;
  source: AlluvialNode;
  target: AlluvialNode;
  /** The node in the `colorBy` column its rows belong to. */
  origin: AlluvialNode;
  value: number;
  /** The indices (into `AlluvialGraph.rows`) of its rows. */
  rows: number[];
  /** The indices of the paths it carries. */
  paths: Set<number>;
  /** Its top and bottom where it leaves its source. */
  sy0: number;
  sy1: number;
  /** Its top and bottom where it enters its target. */
  ty0: number;
  ty1: number;
}

/** A distinct combination of categories, one per dimension, and its rows. */
export interface AlluvialPath {
  nodes: AlluvialNode[];
  value: number;
  rows: number[];
}

/** The aggregated chart: its columns of nodes, its bands, and its paths. */
export interface AlluvialGraph {
  /** One column of nodes per dimension, in dimension order. */
  columns: AlluvialNode[][];
  bands: AlluvialBand[];
  paths: AlluvialPath[];
  /** The rows drawn: those with a category on every dimension and a positive value. */
  rows: DataPoint[];
  /** The column whose categories color the bands. */
  colorBy: number;
  /** The summed value of every row drawn. */
  total: number;
}

function makeNode(column: number, category: unknown, first: number) {
  const label = String(category);
  const node: AlluvialNode = {
    id: `${column}|${label}`,
    column,
    category,
    label,
    value: 0,
    first,
    rank: first,
    rows: [],
    paths: new Set(),
    sourceBands: [],
    targetBands: [],
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
  };
  return node;
}

function makeBand(
  column: number,
  source: AlluvialNode,
  target: AlluvialNode,
  origin: AlluvialNode,
): AlluvialBand {
  const band: AlluvialBand = {
    id: `${source.id}→${target.id}@${origin.id}`,
    column,
    source,
    target,
    origin,
    value: 0,
    rows: [],
    paths: new Set(),
    sy0: 0,
    sy1: 0,
    ty0: 0,
    ty1: 0,
  };
  source.sourceBands.push(band);
  target.targetBands.push(band);
  return band;
}

/**
    Aggregates rows into an alluvial graph. A row missing a category on any
    dimension (see `isMissingCategory`), or whose value isn't a positive
    number, is left out. Categories match by their text, so `1` and `"1"`
    are one category.
    @param rows The data rows.
    @param dims The resolved dimensions, one column each.
    @param value Each row's value: its weight in every node and band it
    passes through (a constant `1` counts rows).
    @param colorBy The column whose categories split and color the bands.
*/
export function aggregateAlluvial(
  rows: DataPoint[],
  dims: AlluvialDimension[],
  value: AlluvialAccessor,
  colorBy = 0,
): AlluvialGraph {
  const lookups = dims.map(() => new Map<string, AlluvialNode>());
  const columns: AlluvialNode[][] = dims.map(() => []);
  const bandLookup = new Map<string, AlluvialBand>();
  const bands: AlluvialBand[] = [];
  const pathLookup = new Map<string, number>();
  const paths: AlluvialPath[] = [];
  const kept: DataPoint[] = [];
  const origin = Math.max(0, Math.min(dims.length - 1, colorBy));
  let total = 0;

  rows.forEach((row, i) => {
    const categories = dims.map(dim => dim.accessor(row, i));
    if (!dims.length || categories.some(isMissingCategory)) return;
    const v = Number(value(row, i));
    if (!Number.isFinite(v) || v <= 0) return;
    const r = kept.length;
    kept.push(row);
    total += v;

    const nodes = categories.map((category, k) => {
      const key = String(category);
      let node = lookups[k].get(key);
      if (!node) {
        node = makeNode(k, category, columns[k].length);
        lookups[k].set(key, node);
        columns[k].push(node);
      }
      node.value += v;
      node.rows.push(r);
      return node;
    });

    const pathKey = nodes.map(n => n.id).join("\u0000");
    let p = pathLookup.get(pathKey);
    if (p === undefined) {
      p = paths.length;
      pathLookup.set(pathKey, p);
      paths.push({nodes, value: 0, rows: []});
    }
    paths[p].value += v;
    paths[p].rows.push(r);

    const start = nodes[origin];
    for (const node of nodes) node.paths.add(p);
    for (let k = 0; k < nodes.length - 1; k++) {
      const key = `${nodes[k].id}\u0000${nodes[k + 1].id}\u0000${start.id}`;
      let band = bandLookup.get(key);
      if (!band) {
        band = makeBand(k, nodes[k], nodes[k + 1], start);
        bandLookup.set(key, band);
        bands.push(band);
      }
      band.value += v;
      band.rows.push(r);
      band.paths.add(p);
    }
  });

  return {columns, bands, paths, rows: kept, colorBy: origin, total};
}

/**
    A band's path as text: its two categories, the origin's category when it
    sits in another column, and `…` for each run of columns between them,
    e.g. `"West → Chairs → Online"` or `"West → … → Online → Yes"`.
    @param band The band.
    @param columns The number of columns.
*/
export function alluvialPathText(band: AlluvialBand, columns: number): string {
  const labels: (string | undefined)[] = new Array(columns).fill(undefined);
  labels[band.origin.column] = band.origin.label;
  labels[band.source.column] = band.source.label;
  labels[band.target.column] = band.target.label;
  const first = labels.findIndex(l => l !== undefined);
  let last = labels.length - 1;
  while (last > first && labels[last] === undefined) last--;
  const parts: string[] = [];
  for (let k = first; k <= last; k++) {
    const label = labels[k];
    if (label !== undefined) parts.push(label);
    else if (parts[parts.length - 1] !== "…") parts.push("…");
  }
  return parts.join(" → ");
}
