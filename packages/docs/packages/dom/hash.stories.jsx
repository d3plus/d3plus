// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/hash.args";
import {hash} from "@d3plus/dom";

export default {
  title: "Dom/hash",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Stable hash that serializes functions by their source, so function-valued\nconfig props (accessors, formatters) still register as changed when their\nbody changes. Wrappers use this to diff config across a framework's render\ncycles — two structurally identical config objects hash equal, so an\nunchanged config skips a re-render.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

