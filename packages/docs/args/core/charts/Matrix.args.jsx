// WARNING: do not edit this file directly, it is generated dynamically from
// the source JSDOC comments using the npm run docs script.

import React from "react";
import {argTypes as vizArgTypes} from "./Viz.args.jsx";
import {assign} from "@d3plus/dom";

import {Matrix as D3plusMatrix} from "@d3plus/react";
export const Matrix = ({ config }) => <D3plusMatrix config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Matrix
   */
  Object.keys(vizArgTypes)
    .reduce((obj, k) => (obj[k] = vizArgTypes[k], obj), {}),

  /**
   * Matrix-specific methods
   */
  
  {
    cellPadding: {
      control: {
        type: "number"
      },
      defaultValue: 2,
      table: {
        defaultValue: {
          summary: 2
        }
      },
      type: {
        required: false,
        summary: "number"
      }
    },
    column: {
      control: {
        type: "text"
      },
      defaultValue: "d => d[\"column\"]",
      table: {
        defaultValue: {
          detail: "d => d[\"column\"]",
          summary: "function"
        }
      },
      type: {
        required: false,
        summary: "string | function"
      }
    },
    columnConfig: {
      control: {
        type: "object"
      },
      defaultValue: "assign({orient: top}, defaultAxisConfig)",
      table: {
        defaultValue: {
          summary: "assign({orient: top}, defaultAxisConfig)"
        }
      },
      type: {
        required: true,
        summary: "object"
      }
    },
    columnList: {
      control: {
        type: "array"
      },
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      type: {
        required: false,
        summary: "array"
      }
    },
    columnSort: {
      control: {},
      defaultValue: "(a, b) => `${a}`.localeCompare(`${b}`)",
      table: {
        defaultValue: {
          detail: "(a, b) => `${a}`.localeCompare(`${b}`)",
          summary: "function"
        }
      },
      type: {
        required: false,
        summary: "function"
      }
    },
    label: {
      control: {
        type: "text"
      },
      defaultValue: "(d, i) => `${getProp.bind(this)(row, d, i)} / ${getProp.bind(this)(column, d, i)}`",
      table: {
        defaultValue: {
          detail: "(d, i) => `${getProp.bind(this)(row, d, i)} / ${getProp.bind(this)(column, d, i)}`",
          summary: "function"
        }
      },
      type: {
        required: false,
        summary: "function | string"
      }
    },
    on: {
      control: {
        type: "text"
      },
      defaultValue: {
        "mousemove.shape": "(d, i, x, event) => {\n  defaultMouseMoveShape(d, i, x, event);\n  const row = getProp.bind(this)(\"row\", d, i);\n  const column = getProp.bind(this)(\"column\", d, i);\n  this.hover((h, ii)=>getProp.bind(this)(\"row\", h, ii) === row || getProp.bind(this)(\"column\", h, ii) === column);\n}"
      },
      table: {
        defaultValue: {
          summary: {
            "mousemove.shape": "(d, i, x, event) => {\n  defaultMouseMoveShape(d, i, x, event);\n  const row = getProp.bind(this)(\"row\", d, i);\n  const column = getProp.bind(this)(\"column\", d, i);\n  this.hover((h, ii)=>getProp.bind(this)(\"row\", h, ii) === row || getProp.bind(this)(\"column\", h, ii) === column);\n}"
          }
        }
      },
      type: {
        required: false,
        summary: "string"
      }
    },
    row: {
      control: {
        type: "text"
      },
      defaultValue: "d => d[\"row\"]",
      table: {
        defaultValue: {
          detail: "d => d[\"row\"]",
          summary: "function"
        }
      },
      type: {
        required: false,
        summary: "string | function"
      }
    },
    rowConfig: {
      control: {
        type: "object"
      },
      defaultValue: "assign({orient: left}, defaultAxisConfig)",
      table: {
        defaultValue: {
          summary: "assign({orient: left}, defaultAxisConfig)"
        }
      },
      type: {
        required: true,
        summary: "object"
      }
    },
    rowList: {
      control: {
        type: "array"
      },
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      type: {
        required: false,
        summary: "array"
      }
    },
    rowSort: {
      control: {},
      defaultValue: "(a, b) => `${a}`.localeCompare(`${b}`)",
      table: {
        defaultValue: {
          detail: "(a, b) => `${a}`.localeCompare(`${b}`)",
          summary: "function"
        }
      },
      type: {
        required: false,
        summary: "function"
      }
    }
  }
);
