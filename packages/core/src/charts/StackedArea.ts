import {stackedAreaDef} from "./ChartDefinition.js";
import {default as AreaPlot} from "./AreaPlot.js";

/**
    Creates a stacked area plot based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.AreaPlot()
  .stacked(true)
*/
export default class StackedArea extends AreaPlot {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {
    super();
    // E3: scalar default sourced from stackedAreaDef.
    this._stacked = stackedAreaDef.defaults.stacked as boolean;
  }
}
