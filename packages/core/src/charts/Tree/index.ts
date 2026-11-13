/**
    Tree — d3-hierarchy tidy tree.

    Implementation files in this folder:
      - `applyLayout.ts` — tree layout + label measure + link descriptors.
      - `emit.ts` — Path (links) + per-shape-type scene nodes.
*/

import {tree} from "d3-hierarchy";

import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import {depthOf} from "../features/depthKey.js";
import {legendLabel} from "../features/legendLabel.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type Viz from "../viz/Viz.js";

import {applyTreeLayout} from "./applyLayout.js";
import {treeEmit} from "./emit.js";
import {nodeLabel} from "./nodeLabel.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {backgroundInk} from "../viz/backgroundInk.js";

export const treeDef: ChartDefinition = {
  name: "Tree",

  layoutStage: applyTreeLayout,
  emit: treeEmit,
  insetRegion: sceneInsetRegion,

  // A node's `groupBy` level, from the hierarchy depth applyTreeLayout stamps
  // onto its row.
  shapeDepth: (_viz: VizInstance, d: DataPoint) => {
    const depth = depthOf(d);
    return depth === undefined ? undefined : depth - 1;
  },

  ctx: {
    tree: tree(),
    previousShapes: [],
  },

  fields: [
    /**
        The orientation of the whole tree: `"vertical"` (top to bottom) or
        `"horizontal"` (left to right).
        @type {"vertical" | "horizontal"}
    */
    {key: "orient", default: "vertical"},
    /**
        The [separation](https://github.com/d3/d3-hierarchy#tree_separation) between
        neighboring nodes: a function of two nodes `a` and `b` that returns their
        relative spacing. The nodes are usually siblings, but may be more distant
        relatives placed side by side. Defaults to `1` for siblings and `2` for
        other neighbors.
    */
    {
      key: "separation",
      default: (a: {parent: unknown}, b: {parent: unknown}) =>
        a.parent === b.parent ? 1 : 2,
    },
    {key: "shape", default: constant("Circle"), coerce: "const"},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => nodeLabel(viz, d, i),
        labelConfig: {
          fontColor: () => backgroundInk(viz),
        },
        Path: {
          fill: "none",
          stroke: () => viz.schema.colorDefaults.missing,
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
        title: (d: DataPoint, i: number) => nodeLabel(viz, d, i),
      }),
    },
    {
      key: "legendTooltip",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: legendLabel.bind(viz as unknown as Viz),
      }),
    },
  ],
};

/**
    Uses d3's tree layout to create a tidy tree chart based on an array of data.
*/
export default makeChart(treeDef);
