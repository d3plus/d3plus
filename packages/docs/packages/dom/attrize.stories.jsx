// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/attrize.args";
import {attrize} from "@d3plus/dom";

export default {
  title: "Dom/attrize",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Applies each key/value in an object as an attr.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {select} from "d3-selection";

import DomExample from "../../helpers/DomExample.jsx";

const attrs = {width: 120, height: 40, rx: 6, fill: "#1c7ed6", "data-label": "attrized"};

export const BasicExample = () => (
  <DomExample
    initial={
      <svg width="160" height="60">
        <rect x="10" y="10" />
      </svg>
    }
    setup={node => attrize(select(node).select("rect"), attrs)}
  />
);
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {select} from "d3-selection";
import {attrize} from "@d3plus/dom";

attrize(select("rect"), ${JSON.stringify(attrs, null, 2)});`,
      language: "jsx",
    },
    description: {
      story: "Applies every key of an object as an attribute on a d3 selection, one `.attr()` call per entry. `elem` uses it for its `enter`, `update`, and `exit` attribute sets; `stylize` is the same idea for inline styles.",
    },
  },
};
