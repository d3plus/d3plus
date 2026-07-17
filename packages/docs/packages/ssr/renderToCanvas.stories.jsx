// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/ssr/renderToCanvas.args";
import {renderToCanvas} from "@d3plus/ssr";

export default {
  title: "Ssr/renderToCanvas",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Renders a d3plus chart to a native canvas in Node using @napi-rs/canvas,\nwith no browser. Returns the canvas so callers can encode to any supported\nformat (canvas.encode(\"png\"), .toBuffer(\"image/jpeg\"), …) or pipe it.\n\nPrefer renderToStaticPNG when you just want PNG bytes.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

