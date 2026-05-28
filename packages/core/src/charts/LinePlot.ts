import {linePlotDef} from "./ChartDefinition.js";
import {default as Plot} from "./Plot.js";

/**
    Creates a line plot based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.Plot()
  .discrete("x")
  .shape("Line")
*/
export default class LinePlot extends Plot {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {
    super();
    // E3: scalar defaults sourced from linePlotDef.
    this._discrete = linePlotDef.defaults.discrete as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._shape = linePlotDef.defaults.shape as any;
  }
}
