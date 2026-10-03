// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Viz} from "../../../args/core/charts/Viz.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Viz",
  component: Viz,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "The base class every d3plus chart extends. Owns the shared configuration surface (data, groupBy, size and color accessors, title, legend, tooltip, timeline, zoom, table view) and the render lifecycle that each chart type's definition plugs its layout into. Not used directly; see the chart classes (BarChart, Treemap, …).",
      },
    },
  }
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


const note = {margin: 0, fontSize: 14, lineHeight: 1.5, color: "#495057", maxWidth: 720};

export const Reference = () => (
  <p style={note}>
    Not used directly: every chart class extends it. The table below is the configuration common to all of them;
    each chart&apos;s own page documents what it adds.
  </p>
);
Reference.args = {height: 90};
Reference.parameters = {
  controls: {sort: "alpha"},
  docs: {
    source: {
      code: `import {Treemap} from "@d3plus/core";

// Everything in the table applies to any chart, alongside its own settings.
new Treemap()
  .select("#chart")
  .data("/data/revenue.json")
  .groupBy(["region", "product"])
  .sum("revenue")
  .title("Revenue by region")
  .legendPosition("bottom")
  .tooltipConfig({tbody: [["Revenue", d => d.revenue]]})
  .render();`,
      language: "jsx",
    },
    description: {
      story: "`Viz` owns the shared surface of every chart: loading and filtering `data`, `groupBy` hierarchies, color and size accessors, the title, legend, color scale, timeline, tooltip, zoom and table-view controls, and the render lifecycle. A chart definition plugs its layout into this pipeline, which is why the same `config` keys work on a Treemap and a LinePlot alike.",
    },
  },
};
