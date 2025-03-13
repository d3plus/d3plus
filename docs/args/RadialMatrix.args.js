import React from "react";
import { argTypes as matrixArgTypes } from "./Matrix.args";
import { assign } from "@d3plus/dom";

import { RadialMatrix as D3plusRadialMatrix } from "@d3plus/react";
export const RadialMatrix = ({ config }) => <D3plusRadialMatrix config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Matrix args and
   * overrides any defaults that have been changed in RadialMatrix
   */
  Object.keys(matrixArgTypes)
  .reduce((obj, k) => (obj[k] = matrixArgTypes[k], obj), {}),

  /**
   * RadialMatrix-specific methods
   */
  {
    columnConfig: {
      defaultValue: {
        shapeConfig: {
          labelConfig: {
            fontColor: "#000",
            padding: 5,
            textAnchor: d => [0, 180].includes(d.angle) ? "middle" : [2, 3].includes(d.quadrant) ? "end" : "start",
            verticalAlign: d => [90, 270].includes(d.angle) ? "middle" : [2, 1].includes(d.quadrant) ? "bottom" : "top"
          }
        }
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `{
  shapeConfig: {
    labelConfig: {
      fontColor: "#000",
      padding: 5,
      textAnchor: d => [0, 180].includes(d.angle) ? "middle" : [2, 3].includes(d.quadrant) ? "end" : "start",
      verticalAlign: d => [90, 270].includes(d.angle) ? "middle" : [2, 1].includes(d.quadrant) ? "bottom" : "top"
    }
  }
}`
        }
      }
    },
    innerRadius: {
      type: {
        summary: "number | function"
      },
      defaultValue: outerRadius => outerRadius / 5,
      table: {
        defaultValue: {
          summary: "function",
          detail: "outerRadius => outerRadius / 5"
        }
      },
      control: {
        type: "number"
      },
      description: "The radius (in pixels) for the inner donut hole of the diagram. Can either be a static Number, or an accessor function that receives the outer radius as it's only argument."
    }
  }
);
