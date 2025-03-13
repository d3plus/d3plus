import React from "react";
import Viz from "./Viz.args";
import { assign } from "@d3plus/dom";

import { Tree as D3plusTree } from "@d3plus/react";
export const Tree = ({ config }) => <D3plusTree config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Tree
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|shape|zoom.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Tree-specific methods
   */
  {
    orient: {
      type: {
        summary: "string"
      },
      defaultValue: "vertical",
      table: {
        defaultValue: {
          summary: "vertical"
        }
      },
      control: {
        type: "select",
        options: ["vertical", "horizontal"]
      },
      description: "Sets the orientation to the specified value."
    },
    separation: {
      type: {
        summary: "function"
      },
      defaultValue: (a, b) => a.parent === b.parent ? 1 : 2,
      table: {
        defaultValue: {
          summary: "function",
          detail: "(a, b) => a.parent === b.parent ? 1 : 2"
        }
      },
      control: {
        type: null
      },
      description: "Sets the separation accessor to the specified function."
    }
  }
)
