import {assign} from "@d3plus/dom";
import {constant} from "../utils/index.js";

import {default as Plot} from "./Plot.js";

/**
    @class BoxWhisker
    @extends Plot
    @desc Creates a simple box and whisker based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.Plot()
  .discrete("x")
  .shape("Box")
*/
export default class BoxWhisker extends Plot {

  /**
      @memberof BoxWhisker
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {

    super();
    this._discrete = "x";
    this._shape = constant("Box");

    this._tooltipConfig = assign(this._tooltipConfig, {
      title: (d, i) => {
        if (!d) return "";
        while (d.__d3plus__ && d.data) {
          d = d.data;
          i = d.i;
        }
        if (this._label) return this._label(d, i);
        const l = this._ids(d, i).slice(0, this._drawDepth);
        return l[l.length - 1];
      }
    });

  }

}
