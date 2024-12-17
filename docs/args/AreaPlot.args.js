import React from "react";
import { argTypes as plotArgTypes } from "./Plot.args";
import { assign } from "d3plus-common";

import { AreaPlot as D3plusArea } from "d3plus-react";
export const AreaPlot = ({ config }) => <D3plusArea config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Plot args and
   * overrides any defaults that have been changed in AreaPlot
   */
  Object.keys(plotArgTypes)
    .reduce((obj, k) => (obj[k] = plotArgTypes[k], obj), {}),

  /**
   * Area-specific methods
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
    shape: {
      table: {
        defaultValue: {
          summary: "Area"
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
