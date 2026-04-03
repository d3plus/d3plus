// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/largestRect.args";
import {largestRect} from "@d3plus/math";

export default {
  title: "Math/largestRect",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspect ratios.

An angle of zero means that the longer side of the polygon (the width) will be aligned with the x axis. An angle of 90 and/or -90 means that the longer side of the polygon (the width) will be aligned with the y axis. The value can be a number between -90 and 90 specifying the angle of rotation of the polygon, a string which is parsed to a number, or an array of numbers specifying the possible rotations of the polygon.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

