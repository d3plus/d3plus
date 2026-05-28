import {assign} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import {boxWhiskerDef} from "./ChartDefinition.js";
import {default as Plot} from "./Plot.js";

/**
    Creates a simple box and whisker based on an array of data.
*/
export default class BoxWhisker extends Plot {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {
    super();
    // E3: scalar defaults sourced from boxWhiskerDef.
    this._discrete = boxWhiskerDef.defaults.discrete as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._shape = boxWhiskerDef.defaults.shape as any;

    this._tooltipConfig = assign(this._tooltipConfig, {
      title: (
        d: DataPoint & {__d3plus__?: boolean; data?: DataPoint; i?: number},
        i: number,
      ) => {
        if (!d) return "";
        while (d.__d3plus__ && d.data) {
          d = d.data as DataPoint & {
            __d3plus__?: boolean;
            data?: DataPoint;
            i?: number;
          };
          i = d.i as number;
        }
        if (this._label) return this._label(d, i);
        const l = this._ids(d, i).slice(0, this._drawDepth);
        return l[l.length - 1];
      },
    });
  }
}
