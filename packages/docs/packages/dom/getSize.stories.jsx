// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/getSize.args";
import {getSize} from "@d3plus/dom";

export default {
  title: "Dom/getSize",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Finds the available width and height for a specified HTMLElement, traversing it's parents until it finds something with constrained dimensions. Falls back to the inner dimensions of the browser window if none is found.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import DomExample from "../../helpers/DomExample.jsx";

export const BasicExample = () => (
  <DomExample
    initial={
      <div style={{width: 300, height: 150, padding: 12, boxSizing: "border-box", background: "#f1f3f5", borderRadius: 4, fontSize: 12}}>
        <div className="target" style={{color: "#666"}}>a 300×150 box with 12px padding; the inner div has no height of its own</div>
      </div>
    }
    output={node => `getSize(inner) // ${JSON.stringify(getSize(node.querySelector(".target")))}`}
    language="js"
  />
);
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {getSize} from "@d3plus/dom";

getSize(document.querySelector(".target")); // [width, height]`,
      language: "jsx",
    },
    description: {
      story: "Returns `[width, height]` available to an element. Each dimension comes from the element itself when it has one, minus padding and borders; otherwise the search walks up to the first ancestor that does, ending at the window's inner size. Here the inner div fills its parent's width but has no height, so the height is borrowed from the 150px box. Charts call this to size themselves to their container.",
    },
  },
};
