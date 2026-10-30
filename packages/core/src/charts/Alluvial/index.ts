/**
    Alluvial — parallel sets: how rows flow across several categorical
    dimensions, one column of category nodes per dimension.

    Implementation files in this folder:
      - `dimensions.ts` — resolves `dimensions` and `colorBy`.
      - `aggregate.ts` — rows → nodes, bands split by origin, and paths.
      - `layout.ts` — node order, node and band positions, ribbon paths.
      - `titles.ts` — the column titles.
      - `meta.ts` — what each drawn datum stands for, and the default `groupBy`.
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — band ribbons, node rects and labels, column titles.
      - `hover.ts` — path highlighting and tooltip content.
*/

import {colorGray} from "@d3plus/color";
import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import {themed} from "../../utils/theme.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {simpleHover} from "../viz/simpleHover.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyAlluvialLayout, countRows} from "./applyLayout.js";
import type {AlluvialCtx} from "./applyLayout.js";
import {isMissingCategory} from "./dimensions.js";
import {alluvialEmit} from "./emit.js";
import {
  alluvialTooltipRows,
  alluvialTooltipTitle,
  installAlluvialHover,
} from "./hover.js";
import {alluvialGroupBy, alluvialMeta, setAlluvialMeta} from "./meta.js";

/** `value`'s setter: a data key, an accessor, or a constant. */
export function alluvialValue(value: unknown): unknown {
  if (typeof value === "function") return value;
  if (typeof value === "string") return fieldAccessor(value);
  return constant(value as number);
}

/**
    Drops the drawn (and legend) rows whose `colorBy` category is missing:
    their rows have no origin, so the chart leaves them out.
*/
function dropMissingOrigins(viz: VizInstance, data: unknown[]): unknown[] {
  const id = viz.schema.groupBy[0] as (d: DataPoint, i: number) => unknown;
  return (data as DataPoint[]).filter((d, i) => !isMissingCategory(id(d, i)));
}

/**
    Rows merge by origin for the legend; the merged row keeps its origin and
    rows, so the layout can trace each row.
*/
function installRowMerging(viz: VizInstance): void {
  const groupBy = alluvialGroupBy(viz);
  viz._mergeRows = (leaves: DataPoint[]) => {
    const merged = merge(leaves, viz.schema.aggs) as DataPoint;
    const index = (viz._data as DataPoint[]).indexOf(leaves[0]);
    return setAlluvialMeta(merged, {
      kind: "group",
      id: groupBy(leaves[0], index),
      rows: leaves,
    });
  };
}

export const alluvialDef: DataDrivenChartDefinition = {
  name: "Alluvial",

  layoutStage: applyAlluvialLayout,
  emit: alluvialEmit,
  thresholdFunction: dropMissingOrigins,

  setup: (viz: VizInstance) => {
    viz.schema.groupBy = [alluvialGroupBy(viz)];
    installRowMerging(viz);
    installAlluvialHover(viz);
    (viz as VizInstance & {hover: typeof simpleHover}).hover = simpleHover;
  },

  facet: {aspect: 3 / 2},

  ctx: {},

  fields: [
    /**
        The fill opacity of the bands between columns.
    */
    {key: "bandOpacity", default: 0.5},
    /**
        The column whose categories color the bands: a column index, or a
        dimension's data key or title. Each row's band keeps its category's
        color through every column, and the legend lists that column's
        categories. Defaults to the first column.
        @type {number | string}
    */
    {key: "colorBy", default: 0},
    /**
        The categorical dimensions, one column each, left to right: data
        keys, accessor functions `(d, i) => category`, or `{value, title}`
        objects (`value` being a key or an accessor). A key is its column's
        title; a bare accessor has none. Rows missing a category on any
        dimension (`undefined`, `null`, or `""`) are left out; to keep them,
        map the missing values to a category of their own with an accessor.
        @type {(string | function | {value: string | function, title?: string})[]}
    */
    {key: "dimensions", default: []},
    /**
        Styles the column titles above each column (any TextBox config).
        @type {object}
    */
    {key: "dimensionTitleConfig", merge: true, default: {}},
    /** The vertical gap between nodes in the same column, in pixels. */
    {key: "nodePadding", default: 10},
    /**
        How the nodes in each column are ordered, top to bottom:
        `"crossings"` (the default: the first column by value, then each
        column by where its flows come from, which untangles the bands),
        `"value"` (largest first), `"data"` (the order categories first appear
        in the data), or a comparator receiving two nodes
        (`{category, column, label, value}`).
        @type {"crossings" | "value" | "data" | function}
    */
    {key: "nodeSort", default: "crossings"},
    /** The width of each node, in pixels. */
    {key: "nodeWidth", default: 16},
    /**
        Each row's weight: a data key or an accessor `(d, i) => number`. Node
        and band sizes sum it, so a key sums that field. Defaults to
        counting rows.
        @type {string | function}
    */
    {key: "value", default: countRows, coerce: alluvialValue},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Rect: {
          // Nodes in the colorBy column take their category's color; the
          // rest are a neutral gray.
          fill: (d: DataPoint, i: number) => {
            const meta = alluvialMeta(d);
            const c = viz.ctx.alluvial as AlluvialCtx | undefined;
            if (meta?.kind === "node" && meta.node.column !== c?.graph.colorBy)
              return themed(viz._theme, t => t.link, colorGray[500]);
            const fill = viz.schema.shapeConfig.fill;
            return typeof fill === "function" ? fill(d, i) : fill;
          },
        },
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint, i: number) => alluvialTooltipTitle(viz, d, i),
        tbody: (d: DataPoint) => alluvialTooltipRows(viz, d),
      }),
    },
  ],
};

/**
    Creates an alluvial (parallel sets) chart from plain data rows: one
    column per entry in `dimensions`, one node per category in each column,
    and bands between neighboring columns sized by how many rows (or how
    much `value`) flow between each pair of categories. Each band keeps the
    color of its rows' category in the `colorBy` column across every column.
*/
export default makeChart(alluvialDef);
