/**
    LinePlot — Plot with `discrete: "x"`, `shape: "Line"`.
*/

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";

export const linePlotDef: ChartDefinition = {
  name: "LinePlot",
  paintDriven: true,

  ctx: {},

  fields: [
    {key: "discrete", default: "x"},
    /**
        LinePlot names each series along its own line by default (see
        `lineLabels`), and its legend hides when every line got a name.
    */
    {key: "lineLabels", default: "along"},
    {key: "shape", default: constant("Line"), coerce: "const"},
  ],
};

/**
    Creates a line plot based on an array of data.
*/
export default makeChart(linePlotDef, Plot);
