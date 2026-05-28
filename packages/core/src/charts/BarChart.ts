import type {DataPoint} from "@d3plus/data";
import {barChartDef} from "./ChartDefinition.js";
import {default as Plot} from "./Plot.js";

/**
    Creates a bar chart based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.Plot()
  .baseline(0)
  .discrete("x")
  .shape("Bar")
*/
export default class BarChart extends Plot {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {
    super();
    // E3+E4: scalar defaults sourced from barChartDef. The chart's identity
    // (which Plot defaults to flip) now lives in the chart-definition value.
    this._baseline = barChartDef.defaults.baseline as number;
    this._discrete = barChartDef.defaults.discrete as string;
    this._shape = barChartDef.defaults.shape as (d: DataPoint, i: number) => string;
    const defaultLegend = this._legend;
    this._legend = (config: Record<string, unknown>, arr: DataPoint[]) => {
      const legendIds = arr
        .map(this._groupBy[this._legendDepth].bind(this))
        .sort()
        .join();
      const barIds = this._filteredData
        .map(this._groupBy[this._legendDepth].bind(this))
        .sort()
        .join();
      if (legendIds === barIds) return false;
      return defaultLegend.bind(this)(config, arr);
    };
  }
}
