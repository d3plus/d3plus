/**
    RadialTree — a Tree laid out around a circle (`orient: "radial"`).

    Extends Tree; inherits its layout stage and emit, which draw the radial
    layout when `orient` is `"radial"` (see `Tree/radialLayout.ts`).
*/

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Tree, {treeDef} from "../Tree/index.js";

export const radialTreeDef: ChartDefinition = {
  name: "RadialTree",

  emit: treeDef.emit,

  // Small-multiple panels as close to square as the grid allows.
  facet: {aspect: 1},

  ctx: {},

  fields: [
    /**
        The orientation of the whole tree: `"radial"` (the default) lays it
        around a circle, the root at the center and the leaves around the
        edge; `"vertical"` and `"horizontal"` draw it as a Tree does.
        @type {"radial" | "vertical" | "horizontal"}
    */
    {key: "orient", default: "radial"},
  ],
};

/**
    A tree laid out around a circle: the root at the center, the leaves
    around the edge, links curving outward between them, and labels turned
    along their spokes. With `nodeHeight`, it draws a radial cluster
    dendrogram.
*/
export default makeChart(radialTreeDef, Tree);
