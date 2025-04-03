import React from "react";
import { argTypes as plotArgTypes } from "./Plot.args";
import { assign } from "@d3plus/dom";

import { StackedArea as D3plusStackedArea } from "@d3plus/react";
export const StackedArea = ({ config }) => <D3plusStackedArea config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Plot args and
   * overrides any defaults that have been changed in StackedArea
   */
  Object.keys(plotArgTypes)
    .reduce((obj, k) => (obj[k] = plotArgTypes[k], obj), {}),

  /**
   * StackedArea-specific methods
   */
  {
    shape: {
      table: {
        defaultValue: {
          summary: "Area"
        }
      }
    },
    stacked: {
      defaultValue: true,
      table: {
        defaultValue: {
          summary: true
        }
      }
    }
  }
);
