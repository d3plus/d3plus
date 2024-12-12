import React from "react";
import Viz from "./Viz.args";
import { assign } from "d3plus-common";

import { Priestley as D3plusPriestley } from "d3plus-react";
export const Priestley = ({ config }) => <D3plusPriestley config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Priestley
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|shape|zoom.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Priestley-specific methods
   */
  {
    axisConfig: {
      type: {
        summary: "object"
      },
      defaultValue: {
        scale: "time"
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `
{
  scale: "time"
}`
        }
      },
      control: {
        type: "object"
      },
      description: "Sets the config method for the axis."
    },
    end: {
      type: {
        summary: "string | function"
      },
      defaultValue: "end",
      table: {
        defaultValue: {
          summary: "end",
        }
      },
      control: {
        type: "text"
      },
      description: "Sets the end accessor to the specified function or key."
    },
    paddingInner: {
      type: {
        summary: "number"
      },
      defaultValue: 0.05,
      table: {
        defaultValue: {
          summary: 0.05,
        }
      },
      control: {
        type: "number"
      },
      description: "Sets the inner padding value of the underlining band scale used to determine the height of each bar. Values should be a ratio between 0 and 1 representing the space in between each rectangle."
    },
    paddingOuter: {
      type: {
        summary: "number"
      },
      defaultValue: 0.05,
      table: {
        defaultValue: {
          summary: 0.05,
        }
      },
      control: {
        type: "number"
      },
      description: "Sets the outer padding value of the underlining band scale used to determine the height of each bar. Values should be a ratio between 0 and 1 representing the space around the outer rectangles."
    },
    start: {
      type: {
        summary: "string | function"
      },
      defaultValue: "start",
      table: {
        defaultValue: {
          summary: "start",
        }
      },
      control: {
        type: "text"
      },
      description: "Sets the start accessor to the specified function or key"
    }
  }
);
