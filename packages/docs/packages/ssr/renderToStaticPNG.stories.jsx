// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/ssr/renderToStaticPNG.args";
import {renderToStaticPNG} from "@d3plus/ssr";

export default {
  title: "Ssr/renderToStaticPNG",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Renders a d3plus chart to a PNG Buffer in Node, with no browser.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import FunctionExample from "../../helpers/FunctionExample.jsx";

const code = `import {writeFileSync} from "node:fs";
import {Treemap} from "@d3plus/core";
import {renderToStaticPNG} from "@d3plus/ssr";

const data = [
  {parent: "Fruit", id: "Apples", value: 30},
  {parent: "Fruit", id: "Pears", value: 12},
  {parent: "Vegetables", id: "Carrots", value: 18},
];

const png = await renderToStaticPNG(
  new Treemap().data(data).groupBy(["parent", "id"]).sum("value"),
  {width: 800, height: 500, pixelRatio: 2},
);
// Uint8Array (a Node Buffer) holding a 1600×1000 PNG

writeFileSync("treemap.png", png);`;

export const Example = () => <FunctionExample input={code} language="js" />;
Example.parameters = {
  docs: {
    source: {code, language: "js"},
    description: {
      story: "Rasterizes a chart to a PNG buffer in Node through `@napi-rs/canvas`, with no browser. `pixelRatio` (default 2) scales the backing store for sharper output, and `fonts` registers font files so text matches the browser. Node only, so the snippet is not executed here; see the [Server-Side Rendering guide](?path=/docs/guides-server-side-rendering--docs) for fonts and the Geomap tile options.",
    },
  },
};
