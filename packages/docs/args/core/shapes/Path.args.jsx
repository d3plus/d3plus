// WARNING: do not edit this file directly, it is generated dynamically from
// the source JSDOC comments using the npm run docs script.

import React from "react";
import {argTypes as shapeArgTypes} from "./Shape.args.jsx";
import {assign} from "@d3plus/dom";

import {Path as D3plusPath} from "@d3plus/react";
export const Path = ({ config }) => <D3plusPath config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Shape primitive and
   * overrides any defaults that have been changed in Path
   */
  Object.keys(shapeArgTypes)
    .reduce((obj, k) => (obj[k] = shapeArgTypes[k], obj), {}),

  /**
   * Path-specific methods
   */
  
  {
    d: {
      control: {
        type: "text"
      },
      defaultValue: "d => d[\"path\"]",
      table: {
        defaultValue: {
          detail: "d => d[\"path\"]",
          summary: "function"
        }
      },
      type: {
        required: false,
        summary: "function | string"
      }
    },
    labelBounds: {
      control: {},
      defaultValue: "(d, i, aes) => {\n  const r = largestRect(aes.points, {\n      angle: this._labelConfig.rotate ? this._labelConfig.rotate(d, i) : 0\n  });\n  return r ? {\n      angle: r.angle,\n      width: r.width,\n      height: r.height,\n      x: r.cx - r.width / 2,\n      y: r.cy - r.height / 2\n  } : false;\n}",
      description: "The given function is passed the data point, index, and internally defined properties of the shape and should return an object containing the following values: `width`, `height`, `x`, `y`. If an array is returned from the function, each value will be used in conjunction with each label.",
      table: {
        defaultValue: {
          detail: "(d, i, aes) => {\n  const r = largestRect(aes.points, {\n      angle: this._labelConfig.rotate ? this._labelConfig.rotate(d, i) : 0\n  });\n  return r ? {\n      angle: r.angle,\n      width: r.width,\n      height: r.height,\n      x: r.cx - r.width / 2,\n      y: r.cy - r.height / 2\n  } : false;\n}",
          summary: "function"
        }
      },
      type: {
        required: false,
        summary: "function"
      }
    },
    labelConfig: {
      control: {
        type: "object"
      },
      defaultValue: "Object.assign(this._labelConfig, {textAnchor: middle, verticalAlign: middle})",
      table: {
        defaultValue: {
          summary: "Object.assign(this._labelConfig, {textAnchor: middle, verticalAlign: middle})"
        }
      },
      type: {
        required: false,
        summary: "object"
      }
    },
    render: {
      control: {},
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      type: {
        required: false,
        summary: "function"
      }
    }
  }
);
