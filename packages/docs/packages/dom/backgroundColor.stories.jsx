// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/backgroundColor.args";
import {backgroundColor} from "@d3plus/dom";

export default {
  title: "Dom/backgroundColor",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Given a DOM element, returns its background color by walking up the\nancestor chain until a non-transparent background is found. Falls back\nto \"rgb(255, 255, 255)\" (white) if every ancestor is transparent.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import DomExample from "../../helpers/DomExample.jsx";

const box = (background, label, child) => (
  <div style={{background, padding: 12, border: "1px dashed rgba(0,0,0,0.2)", borderRadius: 4, fontSize: 12}}>
    <div style={{marginBottom: child ? 8 : 0, color: "#666"}}>{label}</div>
    {child}
  </div>
);

export const BasicExample = () => (
  <DomExample
    initial={box("#fff3bf", "outer: #fff3bf", box("transparent", "middle: transparent", box("transparent", "inner: transparent (the element passed)")))}
    output={node => `backgroundColor(inner) // "${backgroundColor(node.querySelector("div div div"))}"`}
    language="js"
  />
);
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {backgroundColor} from "@d3plus/dom";

backgroundColor(document.querySelector(".inner")); // "rgb(255, 243, 191)"`,
      language: "jsx",
    },
    description: {
      story: "Walks up from the element through its ancestors and returns the first computed background that is not transparent, as an `rgb()` string. Charts use it to pick legible text and stroke colors against whatever the chart is actually sitting on.",
    },
  },
};

export const Fallback = () => (
  <DomExample
    initial={box("transparent", "no colored ancestor inside this container")}
    output={node => `backgroundColor(div) // "${backgroundColor(node.querySelector("div"))}"`}
    language="js"
  />
);
Fallback.parameters = {
  docs: {
    source: {
      code: `import {backgroundColor} from "@d3plus/dom";

// Every ancestor transparent: the walk reaches the page, which here is white.
backgroundColor(element); // "rgb(255, 255, 255)"`,
      language: "jsx",
    },
    description: {
      story: "When nothing on the way up has a background, the walk ends at the page itself: here the documentation page's white, and if even that is transparent the function falls back to `rgb(255, 255, 255)`.",
    },
  },
};
