import {constant} from "../utils/index.js";

import {default as Plot} from "./Plot.js";

/**
    @class BarChart
    @extends Plot
    @desc Creates a bar chart based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.Plot()
  .baseline(0)
  .discrete("x")
  .shape("Bar")
*/
export default class BarChart extends Plot {

  /**
      @memberof BarChart
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {

    super();
    this._baseline = 0;
    this._discrete = "x";
    const defaultLegend = this._legend;
    this._legend = (config, arr) => {
      const legendIds = arr.map(this._groupBy[this._legendDepth].bind(this)).sort().join();
      const barIds = this._filteredData.map(this._groupBy[this._legendDepth].bind(this)).sort().join();
      if (legendIds === barIds) return false;
      return defaultLegend.bind(this)(config, arr);
    };
    this._shape = constant("Bar");
    this.x("x");

  }

}
