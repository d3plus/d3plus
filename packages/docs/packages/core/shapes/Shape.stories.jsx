// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Shape} from "../../../args/core/shapes/Shape.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Shape",
  component: Shape,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "An abstracted class for generating shapes.",
      },
    },
  }
};

const Template = (args) => <Shape config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const note = {margin: 0, fontSize: 14, lineHeight: 1.5, color: "#495057", maxWidth: 720};

export const Reference = () => (
  <p style={note}>
    The abstract base of Rect, Circle, Line, Area, Path, Bar, Box, Whisker, and Image. The table below is the
    configuration they all share, which is also what a chart&apos;s <code>shapeConfig</code> accepts.
  </p>
);
Reference.args = {height: 90};
Reference.parameters = {
  controls: {sort: "alpha"},
  docs: {
    source: {
      code: `import {Rect, Treemap} from "@d3plus/core";

// Any Shape setting can be passed through a chart's shapeConfig…
new Treemap().shapeConfig({
  fill: d => (d.flagged ? "#c92a2a" : "#1c7ed6"),
  stroke: "#ffffff",
  strokeWidth: 1,
  labelConfig: {fontSize: 12},
});

// …or set on a shape class used on its own.
const data = [
  {id: "a", x: 60, y: 40, width: 80, height: 40},
  {id: "b", x: 160, y: 40, width: 80, height: 40},
];

new Rect().select("#svg").data(data).fill("#1c7ed6").render();`,
      language: "jsx",
    },
    description: {
      story: "`Shape` handles what every drawn element has in common: positioning, fill and stroke, opacity, hover and active states, labels (through `labelConfig`), and events. Subclasses add only their geometry. In a chart, `shapeConfig` is applied to whichever shape class the chart draws with.",
    },
  },
};
