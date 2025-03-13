import React from "react";
import { argTypes as networkArgTypes } from "./Network.args";
import { assign } from "@d3plus/dom";

import { Rings as D3plusRings } from "@d3plus/react";
export const Rings = ({ config }) => <D3plusRings config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Network args and
   * overrides any defaults that have been changed in Rings
   */
  Object.keys(networkArgTypes)
    .filter(k => !k.match(/^(x|y*)$/))
    .reduce((obj, k) => (obj[k] = networkArgTypes[k], obj), {}),

  /**
   * Rings-specific methods
   */
  {
    center: {
      type: {
        summary: "string"
      },
      defaultValue: undefined,
      table: {
        defaultValue: {
          summary: "string"
        }
      },
      control: {
        type: "text"
      },
      description: "Sets the center node to be the node with the given id."
    }
  }
);