import React from "react";
import Viz from "./Viz.args";
import { assign } from "d3plus-common";

import { Pack as D3plusPack } from "d3plus-react";
export const Pack = ({ config }) => <D3plusPack config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Pack
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|shape|zoom.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Pack-specific methods
   */
  {
    layoutPadding: {
      type: {
        summary: "function | number"
      },
      defaultValue: 1,
      table: {
        defaultValue: {
          summary: 1
        }
      },
      control: {
        type: "number"
      },
      description: "Sets the padding accessor to the specified function or number."
    },
    packOpacity: {
      type: {
        summary: "function | number"
      },
      defaultValue: 0.25,
      table: {
        defaultValue: {
          summary: 0.25
        }
      },
      control: {
        type: "number"
      },
      description: "Sets the opacity accessor to the specified function or number."
    },
    sort: {
      type: {
        summary: "function"
      },
      defaultValue: (a, b) => b.value - a.value,
      table: {
        defaultValue: {
          summary: "function",
          detail: "(a, b) => b.value - a.value"
        }
      },
      control: {
        type: null
      },
      description: "Sets the sort order for the pack using the specified comparator function."
    },
    sum: {
      type: {
        summary: "function | string | number"
      },
      defaultValue: d => d.sum,
      table: {
        defaultValue: {
          summary: "function",
          detail: "d => d.sum"
        }
      },
      control: {
        type: null
      },
      description: "Sets the sum accessor to the specified function or number"
    }
  }
);
