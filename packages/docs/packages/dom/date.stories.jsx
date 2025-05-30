// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/date.args";
import {date} from "@d3plus/dom";

export default {
  title: "Dom/date",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Returns a javascript Date object for a given a Number (representing either a 4-digit year or milliseconds since epoch), a String representing a Quarter (ie. \"Q2 1987\", mapping to the last day in that quarter), or a String that is in [valid dateString format](http://dygraphs.com/date-formats.html). Besides the 4-digit year parsing, this function is useful when needing to parse negative (BC) years, which the vanilla Date object cannot parse.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

