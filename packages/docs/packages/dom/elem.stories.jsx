// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/elem.args";
import {elem} from "@d3plus/dom";

export default {
  title: "Dom/elem",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Manages the enter/update/exit pattern for a single DOM element, applying enter, update, and exit attributes with optional transitions.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {useState} from "react";
import {select} from "d3-selection";

import DomExample from "../../helpers/DomExample.jsx";

const snippet = (code, story) => ({
  docs: {source: {code: `import {select} from "d3-selection";\nimport {elem} from "@d3plus/dom";\n\n${code}`, language: "jsx"}, description: {story}},
});

export const BasicExample = () => (
  <DomExample
    setup={node => {
      elem("div.demo-box", {
        parent: select(node),
        enter: {"data-state": "entered", title: "created by elem()"},
        update: {"data-updated": "true"},
      });
    }}
  />
);
BasicExample.parameters = snippet(
  `elem("div.demo-box", {
  parent: select(container),
  enter: {"data-state": "entered", title: "created by elem()"},
  update: {"data-updated": "true"},
});`,
  "Selects (or creates) exactly one element matching the selector under `parent`, applying `enter` attributes when it is first created and `update` attributes on every call. The tag and class come from the selector, so `div.demo-box` makes a `<div class=\"demo-box\">`. Calling it again finds the same element instead of adding another; this is how charts keep one container per role across redraws.",
);

const Conditional = () => {
  const [shown, setShown] = useState(true);
  return (
    <div style={{display: "grid", gap: 12}}>
      <label style={{fontSize: 13, display: "flex", gap: 8, alignItems: "center"}}>
        <input type="checkbox" checked={shown} onChange={e => setShown(e.target.checked)} />
        <code>condition</code>
      </label>
      <DomExample
        deps={[shown]}
        setup={node => {
          elem("p.demo-note", {
            parent: select(node),
            condition: shown,
            enter: {"data-state": "entered"},
            update: {"data-shown": String(shown)},
          }).text("rendered while condition is true");
        }}
      />
    </div>
  );
};
export const ConditionalRemoval = () => <Conditional />;
ConditionalRemoval.parameters = snippet(
  `elem("p.demo-note", {
  parent: select(container),
  condition: showNote,   // false removes the element, applying \`exit\` first
  enter: {"data-state": "entered"},
  update: {"data-shown": String(showNote)},
}).text("rendered while condition is true");`,
  "`condition: false` runs the exit side of the pattern and removes the element; flipping it back creates it again. With a `duration`, enter, update, and exit attributes are applied through a transition instead of instantly.",
);
