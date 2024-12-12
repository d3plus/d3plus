import {constant} from "../utils/index.js";

import {default as Plot} from "./Plot.js";

/**
    @class AreaPlot
    @extends Plot
    @desc Creates an area plot based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.Plot()
  .baseline(0)
  .discrete("x")
  .shape("Area")
*/
export default class AreaPlot extends Plot {

  /**
      @memberof AreaPlot
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {

    super();
    this._baseline = 0;
    this._discrete = "x";
    this._shape = constant("Area");
    this.x("x");

  }

}
