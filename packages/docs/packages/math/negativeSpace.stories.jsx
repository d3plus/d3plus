// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/negativeSpace.args";
import {negativeSpace} from "@d3plus/math";

export default {
  title: "Math/negativeSpace",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Finds the open, axis-aligned rectangles inside bounds that lie entirely\noutside the marks described by obstacles. The marks are treated as a single\nsolid region — the convex hull of every (padded) obstacle box — so a hole in\nthe middle of a ring of points is never returned, only the space around them.\nBoxes in options.exclude are kept clear too, each on its own. Each\nreturned box is maximal (it cannot grow in any direction without leaving\nbounds or touching the hull or an excluded box). Results are sorted largest area first, and the\noutput is deterministic for a given input.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

