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

import {BarChart, Donut, LinePlot, Matrix, Treemap} from "@d3plus/react";
import datafy from "../../../helpers/datafy";


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

// Small multiples: one panel per region, from deterministic sample data. The
// generator is also what each "Show code" snippet prints as its `data`.
const smData = datafy(`(() => {
  const regions = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
  const products = ["Coffee", "Cocoa", "Tea"];
  const years = [2019, 2020, 2021, 2022, 2023];
  return regions.flatMap((region, r) => products.flatMap((product, p) => years.map((year, y) => ({
    region, product, year,
    exports: Math.round((20 + ((r * 11 + p * 7 + y * 5) % 17) * 4) * (1 + r * 0.6)),
  }))));
})()`);
const smDataCode = `const data = ${smData.__source};\n\n`;
const smLatest = smData.filter(d => d.year === 2023);
const smBox = {height: 520};

export const SmallMultiples = () => (
  <div style={smBox}>
    <BarChart config={{
      data: smData, groupBy: "product", x: "year", y: "exports",
      title: "Exports by region",
      facet: "region",
    }} />
  </div>
);
SmallMultiples.parameters = {
  docs: {
    source: {
      code: `import {BarChart} from "@d3plus/core";

${smDataCode}// One panel per region, sharing one legend, title, and set of y-axis values.
new BarChart()
  .select("#chart")
  .data(data)
  .groupBy("product")
  .x("year")
  .y("exports")
  .title("Exports by region")
  .facet("region")
  .render();`,
      language: "jsx",
    },
    description: {
      story: "`facet` splits a chart into a grid of equally sized panels, one per distinct value of a data key (or accessor). Every panel is the same chart drawn from its own rows, sharing one legend, title, timeline, and set of controls. Hover a bar to highlight its series in every panel, or click a legend entry to hide it everywhere. Panels share their x/y scales by default, so the axes are labeled only along the grid's left and bottom edges.",
    },
  },
};

export const SmallMultiplesLinePlot = () => (
  <div style={smBox}>
    <LinePlot config={{
      data: smData, groupBy: "product", x: "year", y: "exports",
      facet: "region",
      facetConfig: {padding: 12},
    }} />
  </div>
);
SmallMultiplesLinePlot.parameters = {
  docs: {
    source: {
      code: `${smDataCode}new LinePlot()
  .data(data)
  .groupBy("product")
  .x("year")
  .y("exports")
  .facet("region")
  .facetConfig({padding: 12})
  .render();`,
      language: "jsx",
    },
    description: {
      story: "The grid sizes itself: the column count is the one that draws the panels largest for the chart's shape, so there is nothing to set. `facetConfig.padding` changes the space between panels. To pin the grid instead, set `columns` and/or `rows` (`facetConfig: {columns: 5}` puts every region in one row). The shared tooltip and crosshair follow the panel under the pointer.",
    },
  },
};

export const SmallMultiplesIndependentScales = () => (
  <div style={smBox}>
    <BarChart config={{
      data: smData, groupBy: "product", x: "year", y: "exports", stacked: true,
      facet: "region",
      facetConfig: {scales: "independent"},
    }} />
  </div>
);
SmallMultiplesIndependentScales.parameters = {
  docs: {
    source: {
      code: `${smDataCode}new BarChart()
  .data(data)
  .groupBy("product")
  .x("year")
  .y("exports")
  .stacked(true)
  .facet("region")
  .facetConfig({scales: "independent"})
  .render();`,
      language: "jsx",
    },
    description: {
      story: "With `scales: \"independent\"`, each panel fits its own rows, which shows the shape of small regions at the cost of comparing heights across panels. Every panel then labels its own axes.",
    },
  },
};

export const SmallMultiplesDonut = () => (
  <div style={smBox}>
    <Donut config={{
      data: smLatest, groupBy: "product", value: "exports",
      title: "2023 export mix",
      facet: "region",
      facetConfig: {sort: ["Asia", "Europe", "Americas", "Africa", "Oceania"]},
    }} />
  </div>
);
SmallMultiplesDonut.parameters = {
  docs: {
    source: {
      code: `const data = ${smData.__source}.filter(d => d.year === 2023);

new Donut()
  .data(data)
  .groupBy("product")
  .value("exports")
  .title("2023 export mix")
  .facet("region")
  .facetConfig({sort: ["Asia", "Europe", "Americas", "Africa", "Oceania"]})
  .render();`,
      language: "jsx",
    },
    description: {
      story: "Any chart type can be faceted. `sort` orders the panels: `\"ascending\"` (the default), `\"descending\"`, `\"data\"` (first appearance), a comparator, or an explicit list of values.",
    },
  },
};

export const SmallMultiplesTreemap = () => (
  <div style={smBox}>
    <Treemap config={{
      data: smData, groupBy: "product", sum: "exports", time: "year",
      facet: "region",
      facetConfig: {
        title: (region, rows) => `${region}: ${rows.reduce((s, d) => s + d.exports, 0)}`,
        titleConfig: {fontSize: 13, textAnchor: "start"},
      },
    }} />
  </div>
);
SmallMultiplesTreemap.parameters = {
  docs: {
    source: {
      code: `${smDataCode}new Treemap()
  .data(data)
  .groupBy("product")
  .sum("exports")
  .time("year")
  .facet("region")
  .facetConfig({
    title: (region, rows) => \`\${region}: \${rows.reduce((s, d) => s + d.exports, 0)}\`,
    titleConfig: {fontSize: 13, textAnchor: "start"}
  })
  .render();`,
      language: "jsx",
    },
    description: {
      story: "One timeline drives every panel. `title` formats each panel's title from its facet value and rows (or `false` hides them), and `titleConfig` styles them.",
    },
  },
};

export const SmallMultiplesMatrix = () => (
  <div style={smBox}>
    <Matrix config={{
      data: smData, groupBy: ["product", "year"], row: "product", column: "year",
      colorScale: "exports",
      facet: "region",
    }} />
  </div>
);
SmallMultiplesMatrix.parameters = {
  docs: {
    source: {
      code: `${smDataCode}new Matrix()
  .data(data)
  .groupBy(["product", "year"])
  .row("product")
  .column("year")
  .colorScale("exports")
  .facet("region")
  .render();`,
      language: "jsx",
    },
    description: {
      story: "A colorScale is shared too: one scale, spanning the values every panel draws, colors all of them.",
    },
  },
};
