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

import {BarChart, Treemap} from "@d3plus/react";


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

const linkedData = [
  {region: "Americas", country: "Brazil", revenue: 42},
  {region: "Americas", country: "Chile", revenue: 18},
  {region: "Americas", country: "Mexico", revenue: 27},
  {region: "Europe", country: "France", revenue: 35},
  {region: "Europe", country: "Germany", revenue: 39},
  {region: "Europe", country: "Spain", revenue: 21},
];

const linkedRow = {display: "flex", flexWrap: "wrap", gap: 16};
const linkedCell = {flex: "1 1 280px", minWidth: 0, height: 320};

export const LinkedCharts = () => (
  <div style={linkedRow}>
    <div style={linkedCell}>
      <Treemap config={{
        data: linkedData, groupBy: ["region", "country"], sum: "revenue",
        title: "Revenue share", link: "storybook-linked",
      }} />
    </div>
    <div style={linkedCell}>
      <BarChart config={{
        data: linkedData, groupBy: "country", x: "country", y: "revenue", color: "region",
        title: "Revenue by country", link: {group: "storybook-linked", by: "country"},
      }} />
    </div>
  </div>
);
LinkedCharts.parameters = {
  docs: {
    source: {
      code: `import {BarChart, Treemap} from "@d3plus/core";

const data = [
  {region: "Americas", country: "Brazil", revenue: 42},
  {region: "Americas", country: "Chile", revenue: 18},
  {region: "Europe", country: "France", revenue: 35},
  {region: "Europe", country: "Germany", revenue: 39},
];

// Charts that share a link group mirror each other's hover, active,
// highlight (including search), and legend hide/solo state.
new Treemap()
  .select("#share")
  .data(data)
  .groupBy(["region", "country"])
  .sum("revenue")
  .link("dashboard")
  .render();

new BarChart()
  .select("#bars")
  .data(data)
  .groupBy("country")
  .x("country")
  .y("revenue")
  .link({group: "dashboard", by: "country"})
  .render();`,
      language: "jsx",
    },
    description: {
      story: "Hover a tile, search, or click a legend entry in either chart and the other follows. `link` takes a group name, or `{group, by}` to choose the value rows match on (default: each chart's own id). Matching is by value, so a region tile in the Treemap lights up every country bar in that region. Set `hover`, `active`, `highlight`, or `legend` to `false` in the object form to stop mirroring that interaction.",
    },
  },
};
