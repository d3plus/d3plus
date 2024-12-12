import React from "react";
import { argTypes as pieArgTypes } from "./Pie.args";
import { assign } from "d3plus-common";

import { Donut as D3plusDonut } from "d3plus-react";
export const Donut = ({ config }) => <D3plusDonut config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Pie args and
   * overrides any defaults that have been changed in Donut
   */
  Object.keys(pieArgTypes)
    .reduce((obj, k) => (obj[k] = pieArgTypes[k], obj), {}),

  /**
   * Donut-specific methods
   */
  {
    innerRadius: {
      table: {
        defaultValue: {
          detail: `
          import {min} from "d3-array";

function innerRadius() {
  return min([
    this._width - this._margin.left - this._margin.right,
    this._height - this.margin.top - this._margin.bottom
  ]) / 4;
}`
        }
      }
    },
    padPixel: {
      defaultValue: 2,
      table: {
        summary: "number",
        detail: 2
      }
    }
  }
);
