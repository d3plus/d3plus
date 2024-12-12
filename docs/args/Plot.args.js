import React from "react";
import Viz from "./Viz.args";
import { assign } from "d3plus-common";

import { Plot as D3plusPlot } from "d3plus-react";
export const Plot = ({ config }) => <D3plusPlot config={config} />;

export const argTypes = assign(

  /**
   * Filters out unused argTypes from the Viz primitive and
   * overrides any defaults that have been changed in Plot
   */

  Object.keys(Viz.argTypes)
    .filter(k => !k.match(/^(discrete|zoom.*)$/))
    .reduce((obj, k) => (obj[k] = Viz.argTypes[k], obj), {}),

  /**
   * Plot-specific methods
   */

  {
    annotations: {
      type: {
        summary: "array | object"
      },
      table: {
        defaultValue: {
          summary: "[]"
        }
      },
      control: { type: "array" },
      description: `Allows drawing custom shapes to be used as annotations in the provided x/y plot.

This method accepts custom config objects for the [Shape](https://github.com/d3plus/d3plus-shape) class, either a single config object or an array of config objects.

Each config object requires an additional parameter, the "shape", which denotes which [Shape](https://github.com/d3plus/d3plus-shape) sub-class to use ([Rect](https://github.com/d3plus/d3plus-shape#Rect), [Line](https://github.com/d3plus/d3plus-shape#Line), etc).

Annotations will be drawn underneath the data to be displayed.`
    },
    backgroundConfig: {
      type: {
        summary: "object"
      },
      defaultValue: {
        duration: 0,
        fill: "transparent"
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `{
  duration: 0,
  fill: "transparent"
}`
        }
      },
      control: { type: "object" },
      description: `A d3plus-shape config Object that is used for styling the background rectangle of the inner x/y plot.`
    },
    barPadding: {
      type: {
        summary: "number"
      },
      defaultValue: 0,
      table: {
        defaultValue: {
          summary: 0
        }
      },
      control: { type: "number" },
      description: `Sets the pixel space between each bar in a group of bars.`
    },
    baseline: {
      type: {
        summary: "number"
      },
      defaultValue: "undefined",
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      control: { type: "number" },
      description: `Sets the baseline for the x/y plot.`
    },
    confidence: {
      type: {
        summary: "string[] | function[]"
      },
      defaultValue: "undefined",
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      control: { type: "text" },
      description: `Sets the confidence to the specified array of lower and upper bounds.
Can be called with accessor functions or static keys.

Example:

\`var data = {id: "alpha", value: 10, lci: 9, hci: 11};\`

Accessor function

\`confidence: d => [d.lci, d.hci]\`

Static keys

\`confidence: ["lci", "hci"]\`
`
    },
    confidenceConfig: {
      type: {
        summary: "object"
      },
      defaultValue: "undefined",
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      control: { type: "object" },
      description: `Sets the config method for each shape rendered as a confidence interval`
    },
    discrete: {
      type: {
        summary: "string"
      },
      defaultValue: "x",
      table: {
        defaultValue: {
          summary: "x"
        }
      },
      control: { type: "text" },
      description: `Sets the discrete axis to the specified string.`
    },
    discreteCutoff: {
      type: {
        summary: "number"
      },
      defaultValue: 100,
      table: {
        defaultValue: {
          summary: 100
        }
      },
      control: { type: "number" },
      description: `When the width or height of the chart is less than or equal to this pixel value, the discrete axis will not be shown.

This helps produce slick sparklines.

Set this value to \`0\` to disable the behavior entirely.`
    },
    groupPadding: {
      type: {
        summary: "number"
      },
      defaultValue: 5,
      table: {
        defaultValue: {
          summary: 5
        }
      },
      control: { type: "number" },
      description: `Sets the pixel space between groups of bars.`
    },
    lineLabels: {
      type: {
        summary: "boolean"
      },
      defaultValue: false,
      table: {
        defaultValue: {
          summary: false
        }
      },
      control: { type: "boolean" },
      description: `Draws labels on the right side of any Line shapes that are drawn on the plot.`
    },
    lineMarkerConfig: {
      type: {
        summary: "object"
      },
      defaultValue: false,
      table: {
        defaultValue: {
          summary: "object",
          detail: `import {colorAssign} from "d3plus-color";
import {constant} from "d3plus-common";

{
  fill: function fill(d, i) {
    return colorAssign(this._id(d, i))
  },
  r: constant(3)
}`
        }
      },
      control: { type: "object" },
      description: `Shape config for the Circle shapes drawn by the lineMarkers method.`
    },
    lineMarkers: {
      type: {
        summary: "boolean"
      },
      defaultValue: false,
      table: {
        defaultValue: {
          summary: false
        }
      },
      control: { type: "boolean" },
      description: `Draws circle markers on each vertex of a Line.`
    },
    shape: {
      defaultValue: "Circle",
      table: {
        defaultValue: {
          summary: "Circle"
        }
      }
    },
    shapeSort: {
      type: {
        summary: "function"
      },
      table: {
        defaultValue: {
          summary: "function",
          detail: `const _shapeOrder = ["Area", "Path", "Bar", "Box", "Line", "Rect", "Circle"];

function shapeSort(a, b) {
  return _shapeOrder.indexOf(a) - _shapeOrder.indexOf(b)
};
          `
        }
      },
      control: { type: null },
      description: `A comparator function that sorts the shapes based on their type.`
    },
    size: {
      type: {
        summary: "function | number | string"
      },
      defaultValue: "undefined",
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      control: { type: "text" },
      description: `Sets the size of circles to the given number, data key, or function.`
    },
    sizeMax: {
      type: {
        summary: "number"
      },
      defaultValue: 20,
      table: {
        defaultValue: {
          summary: 20
        }
      },
      control: { type: "number" },
      description: `Sets the size scale maximum to the specified number.`
    },
    sizeMin: {
      type: {
        summary: "number"
      },
      defaultValue: 5,
      table: {
        defaultValue: {
          summary: 5
        }
      },
      control: { type: "number" },
      description: `Sets the size scale minimum to the specified number.`
    },
    sizeScale: {
      type: {
        summary: "string"
      },
      defaultValue: "sqrt",
      table: {
        defaultValue: {
          summary: "sqrt"
        }
      },
      control: {
        type: "select",
        options: ["identity", "linear", "log", "radial", "sqrt", "time"]
      },
      description: `Sets the size scale to the specified string.`
    },
    stacked: {
      type: {
        summary: "boolean"
      },
      defaultValue: false,
      table: {
        defaultValue: {
          summary: false
        }
      },
      control: { type: "boolean" },
      description: `Sets the shape stacking functionality.`
    },
    stackOffset: {
      type: {
        summary: "function | string"
      },
      defaultValue: "descending",
      table: {
        defaultValue: {
          summary: "descending"
        }
      },
      control: { type: "text" },
      description: `Sets the stack offset.`
    },
    stackOrder: {
      type: {
        summary: "function | string | array"
      },
      defaultValue: "none",
      table: {
        defaultValue: {
          summary: "none"
        }
      },
      control: { type: "text" },
      description: `Sets the stack order.`
    },
    x: {
      type: {
        summary: "function | number"
      },
      defaultValue: "x",
      table: {
        defaultValue: {
          summary: "x"
        }
      },
      control: { type: "text" },
      description: `Sets the x accessor to the specified function or number.`
    },
    x2: {
      type: {
        summary: "function | number"
      },
      defaultValue: "x2",
      table: {
        defaultValue: {
          summary: "x2"
        }
      },
      control: { type: "text" },
      description: `Sets the x2 accessor to the specified function or number.`
    },
    xConfig: {
      type: {
        summary: "object"
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `import {range} from "d3-array";

{
  gridConfig: {
    stroke: function stroke(d) {
      if (this._discrete && this._discrete.charAt(0) === "x") return "transparent";
      const range = this._xAxis.range();
      return range[0] === this._xAxis._getPosition.bind(this._xAxis)(d.id) ? "transparent" : "#eee";
    }
  }
}`
        }
      },
      control: { type: "object" },
      description: `A pass-through to the underlying [Axis](https://github.com/d3plus/d3plus-axis) config used for the x-axis.`
    },
    xCutoff: {
      type: {
        summary: "number"
      },
      defaultValue: 150,
      table: {
        defaultValue: {
          summary: "undefined"
        }
      },
      control: { type: "number" },
      description: `When the width of the chart is less than or equal to this pixel value, and the x-axis is not the discrete axis, it will not be shown.`
    },
    x2Config: {
      type: {
        summary: "object"
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `{
  padding: 0
}`
        }
      },
      control: { type: "object" },
      description: `A pass-through to the underlying [Axis](https://github.com/d3plus/d3plus-axis) config used for the x2-axis.`
    },
    xDomain: {
      type: {
        summary: "array"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "object" },
      description: `Sets the x domain to the specified array.`
    },
    x2Domain: {
      type: {
        summary: "array"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "object" },
      description: `Sets the x2 domain to the specified array.`
    },
    xSort: {
      type: {
        summary: "function"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "object" },
      description: `A comparator function that custom sorts discrete x axis.`
    },
    x2Sort: {
      type: {
        summary: "function"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "object" },
      description: `A comparator function that custom sorts discrete x2 axis.`
    },
    y: {
      type: {
        summary: "function | number"
      },
      defaultValue: "y",
      table: {
        defaultValue: {
          summary: "y"
        }
      },
      control: { type: "text" },
      description: `Sets the y accessor to the specified function or number.`
    },
    y2: {
      type: {
        summary: "function | number"
      },
      defaultValue: "y2",
      table: {
        defaultValue: {
          summary: "y2"
        }
      },
      control: { type: "text" },
      description: `Sets the y2 accessor to the specified function or number.`
    },
    yConfig: {
      type: {
        summary: "object"
      },
      table: {
        defaultValue: {
          summary: "object",
          detail: `import {range} from "d3-array";

{
  gridConfig: {
    stroke: function stroke(d) {
      if (this._discrete && this._discrete.charAt(0) === "y") return "transparent";
      const range = this._yAxis.range();
      return range[0] === this._yAxis._getPosition.bind(this._yAxis)(d.id) ? "transparent" : "#eee";
    }
  }
}`
        }
      },
      control: { type: "object" },
      description: `A pass-through to the underlying [Axis](https://github.com/d3plus/d3plus-axis) config used for the y-axis.`
    },
    yCutoff: {
      type: {
        summary: "number"
      },
      defaultValue: 150,
      table: {
        defaultValue: {
          summary: 150
        }
      },
      control: { type: "number" },
      description: `When the width of the chart is less than or equal to this pixel value, and the y-axis is not the discrete axis, it will not be shown.`
    },
    y2Config: {
      type: {
        summary: "object"
      },
      table: {
        defaultValue: {
          summary: "{}",
        }
      },
      control: { type: "object" },
      description: `A pass-through to the underlying [Axis](https://github.com/d3plus/d3plus-axis) config used for the y2-axis.`
    },
    yDomain: {
      type: {
        summary: "array"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "object" },
      description: `Sets the y domain to the specified array.`
    },
    y2Domain: {
      type: {
        summary: "array"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "object" },
      description: `Sets the y2 domain to the specified array.`
    },
    ySort: {
      type: {
        summary: "function"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "object" },
      description: `A comparator function that custom sorts discrete y axis.`
    },
    y2Sort: {
      type: {
        summary: "function"
      },
      table: {
        defaultValue: {
          summary: "undefined",
        }
      },
      control: { type: "object" },
      description: `A comparator function that custom sorts discrete y2 axis.`
    }
  }
);
