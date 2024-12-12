import React from "react";
import { argTypes as plotArgTypes } from "./Plot.args";
import { assign } from "d3plus-common";

import { BarChart as D3plusBarChart } from "d3plus-react";
export const BarChart = ({ config }) => <D3plusBarChart config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Plot args and
   * overrides any defaults that have been changed in BarChart
   */
  Object.keys(plotArgTypes)
    .reduce((obj, k) => (obj[k] = plotArgTypes[k], obj), {}),

  /**
   * BarChart-specific methods
   */
  {
    baseline: {
      defaultValue: 0,
      table: {
        defaultValue: {
          summary: 0
        }
      }
    },
    discrete: {
      defaultValue: "x",
      table: {
        defaultValue: {
          summary: "x"
        }
      }
    },
    legend: {
      table: {
        defaultValue: {
          summary: "function",
          detail: `(config, arr) => {
  const legendIds = arr.map(this._groupBy[this._legendDepth].bind(this)).sort().join();
  const barIds = this._filteredData.map(this._groupBy[this._legendDepth].bind(this)).sort().join();
  if (legendIds === barIds) return false;
  return defaultLegend.bind(this)(config, arr);
}`
        }
      }
    },
    shape: {
      defaultValue: "Bar",
      table: {
        defaultValue: {
          summary: "Bar"
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
    }
  }
);
