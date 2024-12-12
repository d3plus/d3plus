import React from "react";
import { argTypes as plotArgTypes } from "./Plot.args";
import { assign } from "d3plus-common";

import { BumpChart as D3plusBumpChart } from "d3plus-react";
export const BumpChart = ({ config }) => <D3plusBumpChart config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Plot args and
   * overrides any defaults that have been changed in BumpChart
   */
  Object.keys(plotArgTypes)
    .reduce((obj, k) => (obj[k] = plotArgTypes[k], obj), {}),

  /**
   * BumpChart-specific methods
   */
  {
    discrete: {
      defaultValue: "x",
      table: {
        defaultValue: {
          summary: "x"
        }
      }
    },
    shape: {
      defaultValue: "Line",
      table: {
        defaultValue: {
          summary: "Line"
        }
      }
    },
    x: {
      defaultValue: "x",
      table: {
        defaultValue: {
          summary: "x"
        }
      }
    },
    yConfig: {
      defaultValue: {
        tickFormat: function (val) {
          const data = this.formattedData;
          const xMin = data[0].x instanceof Date ? data[0].x.getTime() : data[0].x;
          const startData = data.filter(d => (d.x instanceof Date ? d.x.getTime() : d.x) === xMin);
          const d = startData.find(d => d.y === val);

          return d ? this._drawLabel(d, d.i) : "";
        }
      },
      table: {
        defaultValue: {
          summary: "object"
        }
      }
    },
    ySort: {
      defaultValue: function (a, b) {
        return this._y(b) - this._y(a);
      },
      table: {
        defaultValue: {
          summary: "function",
          defaultValue: `(a, b) => this._y(b) - this._y(a);`
        }
      }
    },
    y2: {
      defaultValue: d => this._y(d),
      table: {
        defaultValue: {
          summary: "function"
        }
      }
    },
    y2Config: {
      defaultValue: {
        tickFormat: val => {
          const data = this._formattedData;
          const xMax = data[data.length - 1].x instanceof Date ? data[data.length - 1].x.getTime() : data[data.length - 1].x;
          const endData = data.filter(d => (d.x instanceof Date ? d.x.getTime() : d.x) === xMax);
          const d = endData.find(d => d.y === val);

          return d ? this._drawLabel(d, d.i) : "";
        }
      },
      table: {
        defaultValue: {
          summary: "object"
        }
      }
    },
    y2Sort: {
      defaultValue: (a, b) => this._y(b) - this._y(a),
      table: {
        defaultValue: {
          summary: "function",
          defaultValue: `(a, b) => this._y(b) - this._y(a);`
        }
      }
    }
  }
);
