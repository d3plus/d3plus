import React from "react";
import { argTypes as plotArgTypes } from "./Plot.args";
import { assign } from "d3plus-common";

import { LinePlot as D3plusLinePlot } from "d3plus-react";
export const LinePlot = ({ config }) => <D3plusLinePlot config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Plot args and
   * overrides any defaults that have been changed in LinePlot
   */
  Object.keys(plotArgTypes)
    .reduce((obj, k) => (obj[k] = plotArgTypes[k], obj), {}),

  /**
   * LinePlot-specific methods
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
    }
  }
);
