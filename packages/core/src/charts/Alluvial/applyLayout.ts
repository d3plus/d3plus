/**
    `applyAlluvialLayout` — the Alluvial layout stage. Aggregates the drawn
    rows into nodes and bands, orders and places them in one fixed column per
    dimension below the column titles, and builds the datum each node and
    band is drawn with. Stashes the result on `viz.ctx.alluvial`, and outside
    small multiples swaps the chart's drawn rows for one row per path, which
    is what the table view lists.
*/

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {fieldNameOf} from "../../utils/fieldAccessor.js";
import {chartBounds} from "../features/chartGeometry.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {aggregateAlluvial, alluvialPathText} from "./aggregate.js";
import type {AlluvialBand, AlluvialGraph, AlluvialNode} from "./aggregate.js";
import type {AlluvialAccessor, AlluvialDimension} from "./dimensions.js";
import {
  alluvialColumns,
  layoutAlluvial,
  sortAlluvialColumns,
} from "./layout.js";
import type {AlluvialNodeSort} from "./layout.js";
import {alluvialDimensions, setAlluvialMeta, sourceRows} from "./meta.js";
import {
  TITLE_GAP,
  alluvialTitleBoxes,
  alluvialTitleStyle,
  sizeAlluvialTitles,
} from "./titles.js";
import type {AlluvialTitle} from "./titles.js";

/** A node as drawn: its rect, and the datum it reports. */
export interface AlluvialDrawnNode {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  id: string;
  shape: "Rect";
  node: AlluvialNode;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** A band as drawn: the band, the datum it reports, and its path as text. */
export interface AlluvialDrawnBand {
  band: AlluvialBand;
  datum: DataPoint;
  text: string;
}

/** What the layout leaves on `viz.ctx.alluvial` for the emit and the hover. */
export interface AlluvialCtx {
  graph: AlluvialGraph;
  dims: AlluvialDimension[];
  nodes: AlluvialDrawnNode[];
  bands: AlluvialDrawnBand[];
  titles: AlluvialTitle[];
  titleStyle: Record<string, unknown>;
  width: number;
  height: number;
}

/** The row value accessor `value` defaults to: every row counts once. */
export const countRows: AlluvialAccessor = () => 1;

/**
    The name of the value each node and band totals: the data key `value`
    reads, "Count" when it counts rows, else "Value".
    @param viz The chart.
*/
export function alluvialValueTitle(viz: VizInstance): string {
  const key = fieldNameOf(viz.schema.value);
  if (key) return key;
  const translate = viz.schema.translate as (s: string) => string;
  return translate(viz.schema.value === countRows ? "Count" : "Value");
}

/**
    The id a node reports: its category in the `colorBy` column (so it
    shares its origin's color and legend entry), and elsewhere its column's
    title and its category, so equal categories in two columns stay apart.
*/
export function alluvialNodeId(
  node: AlluvialNode,
  dims: AlluvialDimension[],
  colorBy: number,
): unknown {
  if (node.column === colorBy) return node.category;
  const title = dims[node.column]?.title || `${node.column + 1}`;
  return `${title}: ${node.label}`;
}

/**
    One row per path, ordered top to bottom: each dimension's category under
    its title (or its column number), then the path's value.
    @param graph The sorted graph.
    @param dims The dimensions.
    @param valueKey The value column's name.
*/
export function alluvialPathRows(
  graph: AlluvialGraph,
  dims: AlluvialDimension[],
  valueKey: string,
): DataPoint[] {
  const ordered = graph.paths.slice().sort((a, b) => {
    for (let k = 0; k < a.nodes.length; k++) {
      const diff = a.nodes[k].rank - b.nodes[k].rank;
      if (diff) return diff;
    }
    return 0;
  });
  return ordered.map(path => {
    const row: DataPoint = {};
    path.nodes.forEach((node, k) => {
      row[dims[k].title || `${k + 1}`] = node.category as DataPoint[string];
    });
    row[valueKey] = path.value;
    const origin = path.nodes[graph.colorBy];
    return setAlluvialMeta(row, {
      kind: "path",
      id: origin.category,
      rows: path.rows.map(r => graph.rows[r]),
    });
  });
}

/** One merged datum for a set of the graph's rows. */
function mergedDatum(
  viz: VizInstance,
  graph: AlluvialGraph,
  rows: number[],
): DataPoint {
  return merge(
    rows.map(r => graph.rows[r]),
    viz.schema.aggs,
  ) as DataPoint;
}

export const applyAlluvialLayout: TransformStage = ({viz}) => {
  const v = viz as VizInstance;
  const {width, height} = chartBounds(v);
  const rows = ((v._filteredData ?? []) as DataPoint[]).flatMap(sourceRows);
  const {dims, k} = alluvialDimensions(v);
  const graph = aggregateAlluvial(
    rows,
    dims,
    v.schema.value as AlluvialAccessor,
    k,
  );
  sortAlluvialColumns(graph, v.schema.nodeSort as AlluvialNodeSort);

  const columns = alluvialColumns(
    dims.length,
    width,
    v.schema.nodeWidth as number,
  );
  const titles = alluvialTitleBoxes(
    dims.map(d => d.title),
    columns.x,
    columns.nodeWidth,
    width,
  );
  const titleStyle = alluvialTitleStyle(v, titles);
  const locale = v.schema.locale as string | undefined;
  const titleHeight = sizeAlluvialTitles(titles, titleStyle, locale);

  layoutAlluvial(graph, {
    width,
    height,
    top: titleHeight ? titleHeight + TITLE_GAP : 0,
    nodeWidth: v.schema.nodeWidth as number,
    nodePadding: v.schema.nodePadding as number,
  });

  const nodes: AlluvialDrawnNode[] = graph.columns.flat().map((node, i) => ({
    __d3plus__: true,
    data: setAlluvialMeta(mergedDatum(v, graph, node.rows), {
      kind: "node",
      id: alluvialNodeId(node, dims, graph.colorBy),
      node,
    }),
    i,
    id: node.id,
    shape: "Rect",
    node,
    x0: node.x0,
    x1: node.x1,
    y0: node.y0,
    y1: node.y1,
  }));

  const bands: AlluvialDrawnBand[] = graph.bands.map(band => ({
    band,
    datum: setAlluvialMeta(mergedDatum(v, graph, band.rows), {
      kind: "band",
      id: band.origin.category,
      band,
    }),
    text: alluvialPathText(band, dims.length),
  }));

  const ctx: AlluvialCtx = {
    graph,
    dims,
    nodes,
    bands,
    titles,
    titleStyle,
    width,
    height,
  };
  v.ctx.alluvial = ctx;

  if (v._facetStep !== "panel")
    v._filteredData = alluvialPathRows(graph, dims, alluvialValueTitle(v));

  return {shapeData: nodes as unknown as DataPoint[]};
};
