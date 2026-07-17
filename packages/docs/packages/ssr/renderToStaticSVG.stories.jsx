// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/ssr/renderToStaticSVG.args";
import {renderToStaticSVG} from "@d3plus/ssr";

export default {
  title: "Ssr/renderToStaticSVG",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Renders a d3plus chart to a standalone SVG string in Node, with no browser.\n\nWorks for every non-map chart out of the box, and for Geomap in vector-only\nmode (.tiles(false)); to include basemap tiles use renderToStaticSVG\nwith a tiled Geomap, which fetches + inlines them (see the Geomap helper).\n\nThe chart is rendered into a throwaway headless DOM that is fully torn down\nbefore this resolves — no globals are left mutated.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

