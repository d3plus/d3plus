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

import FunctionExample from "../../helpers/FunctionExample.jsx";

const code = `import {writeFileSync} from "node:fs";
import {BarChart} from "@d3plus/core";
import {renderToStaticSVG} from "@d3plus/ssr";

const svg = await renderToStaticSVG(
  new BarChart().data(rows).groupBy("region").x("quarter").y("revenue"),
  {width: 800, height: 500},
);
// '<svg xmlns="http://www.w3.org/2000/svg" …>…</svg>'

writeFileSync("revenue.svg", svg);`;

export const Example = () => <FunctionExample input={code} language="js" />;
Example.parameters = {
  docs: {
    source: {code, language: "js"},
    description: {
      story: "Renders any chart to a standalone `<svg>` string in Node, with no browser. The chart is configured exactly as in the browser; `width` and `height` are required because there is no container to measure. A temporary headless DOM is installed for the render and torn down before the promise resolves. This package runs in Node only, so the snippet is not executed here; the [Server-Side Rendering guide](?path=/docs/guides-server-side-rendering--docs) covers setup, fonts, and maps.",
    },
  },
};
