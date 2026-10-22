// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/format/dateFormatter.args";
import {dateFormatter} from "@d3plus/format";

export default {
  title: "Format/dateFormatter",
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Returns a function that labels any date in dataArray exactly as [formatDate](#formatDate) would, reading the interval and position of every date once up front, so labeling all of them takes linear time. Pass the returned function the date to format and, optionally, the dates shown alongside it (sorted once for each new array it is given).",
      },
    },
  },
};

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.
