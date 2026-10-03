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


import FunctionExample from "../../helpers/FunctionExample.jsx";

const code = `import {writeFileSync} from "node:fs";
import {LinePlot} from "@d3plus/core";
import {renderToCanvas} from "@d3plus/ssr";

const canvas = await renderToCanvas(
  new LinePlot().data(rows).groupBy("city").x("year").y("population"),
  {width: 800, height: 500},
);

// Encode the same surface to whatever format you need.
writeFileSync("plot.jpg", await canvas.encode("jpeg", 90));
writeFileSync("plot.webp", await canvas.encode("webp"));
const png = canvas.toBuffer("image/png"); // synchronous`;

export const Example = () => <FunctionExample input={code} language="js" />;
Example.parameters = {
  docs: {
    source: {code, language: "js"},
    description: {
      story: "The step beneath `renderToStaticPNG`: renders the chart onto a native canvas and returns it, so you can encode to JPEG, WebP, or AVIF (with a quality setting), get a synchronous buffer, or draw more onto the surface before saving. Takes the same options as `renderToStaticPNG`. Node only; the snippet is not executed here.",
    },
  },
};
