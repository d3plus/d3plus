import React from "react";
import Viz from "./Viz.args";
import { assign } from "@d3plus/dom";

import { Radar as D3plusRadar } from "@d3plus/react";
export const Radar = ({ config }) => <D3plusRadar config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Radar
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|shape|zoom.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Radar-specific methods
   */
  {
    axisConfig: {
      type: {
        summary: "object"
      },
      defaultValue: {
        shapeConfig: {
          fill: "none",
          labelConfig: {
            fontColor: "#999",
            padding: 0,
            textAnchor: (d, i, x) => x.textAnchor,
            verticalAlign: "middle"
          },
          stroke: "#eee",
          strokeWidth: 1
        }
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `
{
  shapeConfig: {
    fill: "none",
    labelConfig: {
      fontColor: "#999",
      padding: 0,
      textAnchor: (d, i, x) => x.textAnchor,
      verticalAlign: "middle"
    },
    stroke: "#eee",
    strokeWidth: 1
  }
}`
        }
      },
      control: {
        type: "object"
      },
      description: "Sets the config method used for the radial spokes, circles, and labels."
    },
    metric: {
      type: {
        summary: "string | function"
      },
      defaultValue: "metric",
      table: {
        defaultValue: {
          summary: "metric",
        }
      },
      control: {
        type: "text"
      },
      description: "Sets the accessor or key value to the be used as axis."
    },
    outerPadding: {
      type: {
        summary: "number"
      },
      defaultValue: 100,
      table: {
        defaultValue: {
          summary: 100,
        }
      },
      control: {
        type: "number"
      },
      description: "Determines how much pixel spaces to give the outer labels."
    },
    value: {
      type: {
        summary: "function | string"
      },
      defaultValue: d => d.value,
      table: {
        defaultValue: {
          summary: "function",
          detail: "d => d.value"
        }
      },
      control: {
        type: null
      },
      description: "Sets the value accessor to the specified function or number."
    }
  }
);
