import React from "react";
import Viz from "./Viz.args";
import { assign } from "d3plus-common";

import { Matrix as D3plusMatrix } from "d3plus-react";
export const Matrix = ({ config }) => <D3plusMatrix config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Matrix
   */
  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|shape|zoom.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Matrix-specific methods
   */
  {
    cellPadding: {
      type: {
        summary: "number"
      },
      defaultValue: 2,
      table: {
        defaultValue: {
          summary: 2
        }
      },
      control: {
        type: "number"
      },
      description: "Sets the pixel padding between each cell."
    },
    column: {
      type: {
        summary: "string | function"
      },
      defaultValue: d => d.column,
      table: {
        defaultValue: {
          summary: "function",
          detail: "d => d.column"
        }
      },
      control: {
        type: "text"
      },
      description: "Determines which key in the data should be used for each column in the matrix."
    },
    columnConfig: {
      type: {
        summary: "object"
      },
      defaultValue: {
        align: "start",
        barConfig: {
          stroke: 0
        },
        gridSize: 0,
        orient: "top",
        padding: 5,
        paddingInner: 0,
        paddingOuter: 0,
        scale: "band",
        tickSize: 0
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `{
  align: "start",
  barConfig: {
    stroke: 0
  },
  gridSize: 0,
  orient: top,
  padding: 5,
  paddingInner: 0,
  paddingOuter: 0,
  scale: "band",
  tickSize: 0
}`
        }
      },
      control: {
        type: "object"
      },
      description: "A pass-through to the underlying Axis config used for the column labels."
    },
    columnList: {
      type: {
        summary: "array"
      },
      defaultValue: [],
      table: {
        defaultValue: {
          summary: "[]"
        }
      },
      control: {
        type: "array"
      },
      description: "A manual list of IDs to be used for columns."
    },
    columnSort: {
      type: {
        summary: "function"
      },
      defaultValue: (a, b) => a - b,
      table: {
        defaultValue: {
          summary: "function",
          detail: "(a, b) => a - b"
        }
      },
      control: {
        type: null
      },
      description: "A comparator function that sorts the unique set of column values."
    },
    row: {
      type: {
        summary: "string | function"
      },
      defaultValue: d => d.row,
      table: {
        defaultValue: {
          summary: "function",
          detail: "d => d.row"
        }
      },
      control: {
        type: "text"
      },
      description: "Determines which key in the data should be used for each row in the matrix."
    },
    rowConfig: {
      type: {
        summary: "object"
      },
      defaultValue: {
        align: "start",
        barConfig: {
          stroke: 0
        },
        gridSize: 0,
        orient: "left",
        padding: 5,
        paddingInner: 0,
        paddingOuter: 0,
        scale: "band",
        tickSize: 0
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `{
  align: "start",
  barConfig: {
    stroke: 0
  },
  gridSize: 0,
  orient: left,
  padding: 5,
  paddingInner: 0,
  paddingOuter: 0,
  scale: "band",
  tickSize: 0
}`
        }
      },
      control: {
        type: "object"
      },
      description: "A pass-through to the underlying Axis config used for the row labels."
    },
    rowList: {
      type: {
        summary: "array"
      },
      defaultValue: [],
      table: {
        defaultValue: {
          summary: "[]"
        }
      },
      control: {
        type: "array"
      },
      description: "A manual list of IDs to be used for rows."
    },
    rowSort: {
      type: {
        summary: "function"
      },
      defaultValue: (a, b) => a - b,
      table: {
        defaultValue: {
          summary: "function",
          detail: "(a, b) => a - b"
        }
      },
      control: {
        type: null
      },
      description: "A comparator function that sorts the unique set of row values."
    }
  }
);
