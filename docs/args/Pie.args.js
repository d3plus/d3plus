import React from "react";
import Viz from "./Viz.args";
import { assign } from "d3plus-common";

import { Pie as D3plusPie } from "d3plus-react";
export const Pie = ({ config }) => <D3plusPie config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Pie
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|shape|zoom.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Pie-specific methods
   */
  {
    innerRadius: {
      type: {
        summary: "function | number"
      },
      defaultValue: 0,
      table: {
        defaultValue: {
          summary: 0
        }
      },
      control: { type: "number" },
      description: `The pixel value, or function that returns a pixel value, that is used as the inner radius of the Pie (creating a Donut).`
    },
    padAngle: {
      type: {
        summary: "number"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "number" },
      description: `The padding between each arc, set as a radian value between \`0\` and \`1\`.

If set, this will override any previously set padPixel value.`
    },
    padPixel: {
      type: {
        summary: "number"
      },
      defaultValue: 0,
      table: {
        defaultValue: {
          summary: 0
        }
      },
      control: { type: "number" },
      description: `The padding between each arc, set as a pixel number value.

By default the value is \`0\`, which shows no padding between each arc.

If \`padAngle\` is defined, the \`padPixel\` value will not be considered.`
    },
    sort: {
      type: {
        summary: "function"
      },
      table: {
        defaultValue: {
          summary: "function",
          detail: `(a, b) => b.value - a.value`
        }
      },
      control: { type: null },
      description: `A comparator function that sorts the Pie slices.`
    },
    value: {
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
      description: `The accessor key for each data point used to calculate the size of each Pie section.`
    }
  }
);
