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

