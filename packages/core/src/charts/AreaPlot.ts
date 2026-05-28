import {areaPlotDef} from "./ChartDefinition.js";
import {default as Plot} from "./Plot.js";

/**
    Creates an area plot based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.Plot()
  .baseline(0)
  .discrete("x")
  .shape("Area")
*/
export default class AreaPlot extends Plot {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {
    super();
    // E3: scalar defaults sourced from areaPlotDef.
    this._baseline = areaPlotDef.defaults.baseline as number;
    this._discrete = areaPlotDef.defaults.discrete as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._shape = areaPlotDef.defaults.shape as any;
  }
}
