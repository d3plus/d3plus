import React from "react";
import { argTypes as plotArgTypes } from "./Plot.args";
import { assign } from "d3plus-common";

import { BoxWhisker as D3plusBoxWhisker } from "d3plus-react";
export const BoxWhisker = ({ config }) => <D3plusBoxWhisker config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Plot args and
   * overrides any defaults that have been changed in BoxWhisker
   */
  Object.keys(plotArgTypes)
    .reduce((obj, k) => (obj[k] = plotArgTypes[k], obj), {}),

  /**
   * BoxWhisker-specific methods
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
      table: {
        defaultValue: {
          summary: "Box"
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
