// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/stylize.args";
import {stylize} from "@d3plus/dom";

export default {
  title: "Dom/stylize",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Applies each key/value in an object as a style.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {select} from "d3-selection";

import DomExample from "../../helpers/DomExample.jsx";

const styles = {fill: "#1c7ed6", stroke: "#1864ab", "stroke-width": 3, opacity: 0.85};

export const BasicExample = () => (
  <DomExample
    initial={
      <svg width="160" height="60">
        <rect x="10" y="10" width="140" height="40" rx="6" />
      </svg>
    }
    setup={node => stylize(select(node).select("rect"), styles)}
  />
);
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {select} from "d3-selection";
import {stylize} from "@d3plus/dom";

stylize(select("rect"), ${JSON.stringify(styles, null, 2)});`,
      language: "jsx",
    },
    description: {
      story: "Applies every key of an object as an inline style on a d3 selection, one `.style()` call per entry, which is how a chart's `shapeConfig` styles reach the drawn elements. Keys are CSS property names (`stroke-width`, not `strokeWidth`).",
    },
  },
};
