/**
    Treemap — d3-hierarchy treemap layout, one cell per leaf.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — rect + label scene nodes from the laid-out data.
      - `thresholdFunction.ts` — pure threshold-merge algorithm.

    The default export is the chart class via `makeChart(def)`; the named
    export is the def itself.
*/

import {
  treemap,
  treemapBinary,
  treemapDice,
  treemapResquarify,
  treemapSlice,
  treemapSliceDice,
  treemapSquarify,
} from "d3-hierarchy";
import type {HierarchyNode} from "d3-hierarchy";

import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {makeChart} from "../makeChart.js";
import {vizPreDrawStages} from "../stages.js";
import type {VizInstance} from "../vizTypes.js";

import {applyTreemapLayout} from "./applyLayout.js";
import {treemapEmit} from "./emit.js";
import {thresholdFunction} from "./thresholdFunction.js";

const tileMethods: Record<string, unknown> = {
  treemapBinary,
  treemapDice,
  treemapResquarify,
  treemapSlice,
  treemapSliceDice,
  treemapSquarify,
};

interface AggregatedLeaf extends HierarchyNode<DataPoint> {
  children?: AggregatedLeaf[];
  data: DataPoint & {_isAggregation?: boolean};
}

const isAggregated = (leaf: AggregatedLeaf): boolean =>
  !!leaf.children &&
  leaf.children.length === 1 &&
  leaf.children[0].data._isAggregation === true;

type SortFn = (a: HierarchyNode<DataPoint>, b: HierarchyNode<DataPoint>) => number;

export const treemapDef: ChartDefinition = {
  name: "Treemap",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyTreemapLayout],
  layoutStage: applyTreemapLayout,
  emit: treemapEmit,

  thresholdFunction: (viz: VizInstance, data: unknown[]) =>
    thresholdFunction(data as DataPoint[], {
      aggs: viz._aggs,
      drawDepth: viz._drawDepth,
      groupBy: viz._groupBy as ((d: DataPoint) => unknown)[],
      threshold: viz._threshold as (branchData: DataPoint[]) => number,
      thresholdKey: viz._thresholdKey as (d: DataPoint) => number,
    }),

  ctx: {
    treemap: treemap().round(true),
  },

  fields: [
    {key: "layoutPadding", default: 1},
    {
      key: "sort",
      default: ((a, b) => (b.value ?? 0) - (a.value ?? 0)) as SortFn,
      decorate: (_viz, base) => {
        const baseSort = base as SortFn;
        return ((a, b) => {
          const aggA = isAggregated(a as AggregatedLeaf);
          const aggB = isAggregated(b as AggregatedLeaf);
          return aggA && !aggB ? 1 : !aggA && aggB ? -1 : baseSort(a, b);
        }) as SortFn;
      },
    },
    {
      key: "sum",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
      onSet: (viz, v) => { viz._thresholdKey = v; },
    },
    {
      key: "tile",
      default: treemapSquarify,
      coerce: v => {
        if (typeof v !== "string") return v;
        const key = `treemap${v.charAt(0).toUpperCase()}${v.slice(1)}`;
        return tileMethods[key] ?? treemapSquarify;
      },
    },
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint & {rank?: number}, i: number) => {
          const rank = typeof d.rank === "number" ? `${d.rank + 1}. ` : "";
          const sumFn = viz.schema.sum as (d: DataPoint, i: number) => number;
          return `${rank}${viz._drawLabel(d, i)}, ${sumFn(d, i)}.`;
        },
        labelConfig: {fontMax: 32, fontMin: 8, fontResize: true, padding: 5},
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: [
          [
            () => viz._translate("Share"),
            (_d: DataPoint, _i: number, x: Record<string, unknown>) =>
              `${formatAbbreviate((x.share as number) * 100, viz._locale)}%`,
          ],
        ],
      }),
    },
    {
      key: "legendTooltip",
      merge: true,
      factory: () => ({tbody: []}),
    },
    {
      key: "legendSort",
      factory: (viz: VizInstance) => {
        const sumFn = viz.schema.sum as (d: DataPoint) => number;
        return (a: DataPoint, b: DataPoint) => sumFn(b) - sumFn(a);
      },
    },
    {
      key: "legend",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (config: D3plusConfig, arr: DataPoint[]) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          if (arr.length === viz._filteredData.length) return false;
          return base.call(viz, config, arr);
        };
      },
    },
  ],
};

export default makeChart(treemapDef);
