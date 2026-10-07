// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/ssr/installDom.args";
import {installDom} from "@d3plus/ssr";

export default {
  title: "Ssr/installDom",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Stands up a headless DOM and mirrors its globals onto globalThis so d3plus\ncan render. Returns a DomEnv whose teardown() restores the previous\nglobal state exactly — nothing is left mutated after a render.\n\nPrefer withDom unless you need to manage the lifecycle yourself.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import FunctionExample from "../../helpers/FunctionExample.jsx";

const code = `import {installDom} from "@d3plus/ssr";

const env = await installDom();
// window, document, and the other browser globals d3plus touches now
// exist on globalThis, backed by jsdom.
try {
  const list = env.document.createElement("ul");
  list.innerHTML = "<li>built headlessly</li>";
  console.log(list.outerHTML);
} finally {
  env.teardown(); // restores every global it replaced, even after an error
}

// Bring your own DOM instead of jsdom (for example linkedom):
const custom = await installDom({window: myWindow});`;

export const Example = () => <FunctionExample input={code} language="js" />;
Example.parameters = {
  docs: {
    source: {code, language: "js"},
    description: {
      story: "The lower-level half of server rendering: installs a headless `window` and `document` (jsdom by default, or a `window` you supply) on `globalThis`, plus the small set of browser APIs d3plus needs that those DOMs lack, and returns a `teardown()` that puts every global back. `renderToStaticSVG` and `renderToStaticPNG` do this for you; use it directly when other DOM-dependent code has to run in the same environment. Node only, so the snippet is not executed here.",
    },
  },
};
