/**
    Tree — d3-hierarchy tidy tree.

    Implementation files in this folder:
      - `applyLayout.ts` — tree layout + label measure + link descriptors.
      - `emit.ts` — Path (links) + per-shape-type scene nodes.
*/

import {tree} from "d3-hierarchy";

import {colorContrast, colorDefaults} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import {legendLabel} from "../features/legendLabel.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type Viz from "../viz/Viz.js";

import {applyTreeLayout} from "./applyLayout.js";
import {treeEmit} from "./emit.js";

export const treeDef: ChartDefinition = {
  name: "Tree",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyTreeLayout,
  emit: treeEmit,

  ctx: {
    tree: tree(),
    previousShapes: [],
  },

  fields: [
    {key: "orient", default: "vertical"},
    {
      key: "separation",
      default: (a: {parent: unknown}, b: {parent: unknown}) =>
        a.parent === b.parent ? 1 : 2,
    },
    {key: "shape", default: constant("Circle")},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => {
          const treeData = viz.ctx.linksData ? viz._chartScene : undefined;
          // The original ariaLabel used `_treeData[i].depth`; under the new
          // model the depth is on the source node so the accessor needs to
          // walk shapeData differently. Keep the simpler form: drawLabel only.
          void treeData;
          return viz._drawLabel(d, i);
        },
        labelConfig: {
          fontColor: () => {
            const bg = viz._select
              ? backgroundColor(viz._select.node())
              : "rgb(255, 255, 255)";
            return colorContrast(bg);
          },
        },
        Path: {
          fill: "none",
          stroke: colorDefaults.missing,
          strokeWidth: 2,
        },
        r: constant(7),
        width: constant(12),
        height: constant(12),
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        // The Tooltip calls `title(d, i)` with the bound row; the node's
        // hierarchy depth is stamped onto that row in applyTreeLayout, so the
        // label resolves at the node's own level rather than the leaf level.
        title: (d: DataPoint & {depth?: number}, i: number) =>
          viz._drawLabel(d, i, (d.depth ?? 1) - 1),
      }),
    },
    {
      key: "legendTooltip",
      merge: true,
      factory: (viz: VizInstance) => ({title: legendLabel.bind(viz as unknown as Viz)}),
    },
  ],
};

export default makeChart(treeDef);
