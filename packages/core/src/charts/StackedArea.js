import {default as AreaPlot} from "./AreaPlot.js";

/**
    @class StackedArea
    @extends Area
    @desc Creates a stacked area plot based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.AreaPlot()
  .stacked(true)
*/
export default class StackedArea extends AreaPlot {

  /**
      @memberof StackedArea
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {

    super();
    this._stacked = true;

  }

}
