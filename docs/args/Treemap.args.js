import React from "react";
import Viz from "./Viz.args";
import { assign } from "d3plus-common";

import { Treemap as D3plusTreemap } from "d3plus-react";
export const Treemap = ({ config }) => <D3plusTreemap config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Treemap
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|shape|zoom.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Treemap-specific methods
   */
  {
    sum: {
      type: {
        summary: "string | function",
        required: true
      },
      table: {
        defaultValue: {
          summary: "\"value\"",
          detail: `d => d.value`
        }
      },
      description: `The accessor key for each data point used to calculate the size of each rectangle.`,
      control: {type: "text"}
    },
    tile: {
      defaultValue: "squarify",
      type: {
        summary: "string | function"
      },
      table: {
        defaultValue: {
          summary: "squarify",
          detail: `import {treemapSquarify as squarify} from "d3-hierarchy";`
        }
      },
      description: `Sets the tiling method used when calcuating the size and position of the rectangles.

  Can either be a string referring to a d3-hierarchy [tiling method](https://github.com/d3/d3-hierarchy#treemap-tiling), or a custom function in the same format.`,
      control: {
        type: "select",
        options: ["binary", "dice", "slice", "sliceDice", "squarify", "resquarify"]
      }
    }
  }
);
