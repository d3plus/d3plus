// WARNING: do not edit this file directly, it is generated dynamically from
// the source JSDOC comments using the npm run docs script.

import React from "react";



export const argTypes = {
  alpha: {
    control: {
      type: "number"
    },
    description: "The angle in radians to rotate.",
    table: {
      defaultValue: {
        summary: "undefined"
      }
    },
    type: {
      required: true,
      summary: "number"
    }
  },
  origin: {
    control: {
      type: "array"
    },
    defaultValue: "[0, 0]",
    description: "The origin point of the rotation, which should always be an `[x, y]` formatted Array.",
    table: {
      defaultValue: {
        summary: "[0, 0]"
      }
    },
    type: {
      required: false,
      summary: "array"
    }
  },
  p: {
    control: {
      type: "array"
    },
    description: "The point to be rotated, which should always be an `[x, y]` formatted Array.",
    table: {
      defaultValue: {
        summary: "undefined"
      }
    },
    type: {
      required: true,
      summary: "array"
    }
  }
};
