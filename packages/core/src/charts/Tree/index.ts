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
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type Viz from "../viz/Viz.js";

import {applyTreeLayout} from "./applyLayout.js";
import {treeEmit} from "./emit.js";
import {nodeLabel} from "./nodeLabel.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import {optionalAccessor} from "../viz/vizFields.js";

export const treeDef: DataDrivenChartDefinition = {
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
        The orientation of the whole tree: `"vertical"` (top to bottom),
        `"horizontal"` (left to right), or `"radial"` (around a circle, the
        root at the center and the leaves around the edge, with links
        curving outward and labels turned along their spokes; `RadialTree`
        draws this).
        @type {"vertical" | "horizontal" | "radial"}
    */
    {key: "orient", default: "vertical"},
    /**
        Sets how far each node sits from the root by a value instead of by
        its depth: its height above the leaves, such as the distance at
        which a hierarchical clustering merged its children. The root sits
        at the tallest height and nodes of height 0 at the far edge, so the
        leaves line up there as in a cluster dendrogram, spaced evenly in
        order. A key in the data, or an accessor function receiving the
        node's row (a branch's merged row), its index, and `{id, level,
        leaf}`: its `groupBy` value at its own level, that level (0 for the
        top), and whether it is drawn without children. A node with no
        number is 0 when it is a leaf, and as tall as its tallest child
        otherwise. Defaults to none, which spaces the levels evenly.
        @type {string | function}
    */
    {key: "nodeHeight", coerce: optionalAccessor},
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
