// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/ssr/withDom.args";
import {withDom} from "@d3plus/ssr";

export default {
  title: "Ssr/withDom",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Runs fn with a headless DOM installed, tearing it down afterward even if\nfn throws. The DomEnv is passed to fn for access to window/document.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import FunctionExample from "../../helpers/FunctionExample.jsx";

const code = `import {withDom} from "@d3plus/ssr";

const html = await withDom({}, async ({document}) => {
  const table = document.createElement("table");
  table.innerHTML = "<tr><td>built headlessly</td></tr>";
  return table.outerHTML;
});
// The headless DOM is torn down here, whether the callback returned or threw.

// Options are the same as installDom's: pass your own window, or custom HTML.
await withDom({html: "<!doctype html><html lang='es'><body></body></html>"}, async env => {
  // …
});`;

export const Example = () => <FunctionExample input={code} language="js" />;
Example.parameters = {
  docs: {
    source: {code, language: "js"},
    description: {
      story: "`installDom` with the cleanup handled for you: the callback receives the environment, its return value is passed through, and `teardown()` runs in a `finally`, so an exception inside the callback cannot leave browser globals behind. Node only; the snippet is not executed here.",
    },
  },
};
