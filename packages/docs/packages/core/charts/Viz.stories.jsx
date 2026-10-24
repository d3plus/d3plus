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
        component:
          "The base class every d3plus chart extends. Owns the shared configuration surface (data, groupBy, size and color accessors, title, legend, tooltip, timeline, zoom, table view) and the render lifecycle that each chart type's definition plugs its layout into. Not used directly; see the chart classes (BarChart, Treemap, …).",
      },
    },
  },
};

const Template = args => <Viz config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {BarChart, Donut, LinePlot, Matrix, Treemap} from "@d3plus/react";
import datafy from "../../../helpers/datafy";

const note = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.5,
  color: "#495057",
  maxWidth: 720,
};

export const Reference = () => (
  <p style={note}>
    Not used directly: every chart class extends it. The table below is the
    configuration common to all of them; each chart&apos;s own page documents
    what it adds.
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
      story:
        "`Viz` owns the shared surface of every chart: loading and filtering `data`, `groupBy` hierarchies, color and size accessors, the title, legend, color scale, timeline, tooltip, zoom and table-view controls, and the render lifecycle. A chart definition plugs its layout into this pipeline, which is why the same `config` keys work on a Treemap and a LinePlot alike.",
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
      <Treemap
        config={{
          data: linkedData,
          groupBy: ["region", "country"],
          sum: "revenue",
          title: "Revenue share",
          link: "storybook-linked",
        }}
      />
    </div>
    <div style={linkedCell}>
      <BarChart
        config={{
          data: linkedData,
          groupBy: "country",
          x: "country",
          y: "revenue",
          color: "region",
          title: "Revenue by country",
          link: {group: "storybook-linked", by: "country"},
        }}
      />
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
      story:
        "Hover a tile, search, or click a legend entry in either chart and the other follows. `link` takes a group name, or `{group, by}` to choose the value rows match on (default: each chart's own id). Matching is by value, so a region tile in the Treemap lights up every country bar in that region. Set `hover`, `active`, `highlight`, or `legend` to `false` in the object form to stop mirroring that interaction.",
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
    <BarChart
      config={{
        data: smData,
        groupBy: "product",
        x: "year",
        y: "exports",
        title: "Exports by region",
        facet: "region",
      }}
    />
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
      story:
        "`facet` splits a chart into a grid of equally sized panels, one per distinct value of a data key (or accessor). Every panel is the same chart drawn from its own rows, sharing one legend, title, timeline, and set of controls. Hover a bar to highlight its series in every panel, or click a legend entry to hide it everywhere. Panels share their x/y scales by default, so the axes are labeled only along the grid's left and bottom edges.",
    },
  },
};

export const SmallMultiplesLinePlot = () => (
  <div style={smBox}>
    <LinePlot
      config={{
        data: smData,
        groupBy: "product",
        x: "year",
        y: "exports",
        facet: "region",
        facetConfig: {padding: 12},
      }}
    />
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
      story:
        "The grid sizes itself: the column count is the one that draws the panels largest for the chart's shape, so there is nothing to set. `facetConfig.padding` changes the space between panels. To pin the grid instead, set `columns` and/or `rows` (`facetConfig: {columns: 5}` puts every region in one row). The shared tooltip and crosshair follow the panel under the pointer.",
    },
  },
};

export const SmallMultiplesIndependentScales = () => (
  <div style={smBox}>
    <BarChart
      config={{
        data: smData,
        groupBy: "product",
        x: "year",
        y: "exports",
        stacked: true,
        facet: "region",
        facetConfig: {scales: "independent"},
      }}
    />
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
      story:
        'With `scales: "independent"`, each panel fits its own rows, which shows the shape of small regions at the cost of comparing heights across panels. Every panel then labels its own axes.',
    },
  },
};

export const SmallMultiplesDonut = () => (
  <div style={smBox}>
    <Donut
      config={{
        data: smLatest,
        groupBy: "product",
        value: "exports",
        title: "2023 export mix",
        facet: "region",
        facetConfig: {
          sort: ["Asia", "Europe", "Americas", "Africa", "Oceania"],
        },
      }}
    />
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
      story:
        'Any chart type can be faceted. `sort` orders the panels: `"ascending"` (the default), `"descending"`, `"data"` (first appearance), a comparator, or an explicit list of values.',
    },
  },
};

export const SmallMultiplesTreemap = () => (
  <div style={smBox}>
    <Treemap
      config={{
        data: smData,
        groupBy: "product",
        sum: "exports",
        time: "year",
        facet: "region",
        facetConfig: {
          title: (region, rows) =>
            `${region}: ${rows.reduce((s, d) => s + d.exports, 0)}`,
          titleConfig: {fontSize: 13, textAnchor: "start"},
        },
      }}
    />
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
      story:
        "One timeline drives every panel. `title` formats each panel's title from its facet value and rows (or `false` hides them), and `titleConfig` styles them.",
    },
  },
};

export const SmallMultiplesMatrix = () => (
  <div style={smBox}>
    <Matrix
      config={{
        data: smData,
        groupBy: ["product", "year"],
        row: "product",
        column: "year",
        colorScale: "exports",
        facet: "region",
      }}
    />
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
      story:
        "A colorScale is shared too: one scale, spanning the values every panel draws, colors all of them.",
    },
  },
};

export const SaveControl = () => (
  <div style={linkedRow}>
    <div style={linkedCell}>
      <Treemap
        config={{
          data: linkedData,
          groupBy: ["region", "country"],
          sum: "revenue",
          title: "Revenue share",
        }}
      />
    </div>
    <div style={linkedCell}>
      <BarChart
        config={{
          data: linkedData,
          groupBy: "country",
          x: "country",
          y: "revenue",
          color: "region",
          title: "Revenue by country",
          saveControlConfig: {
            filename: "revenue",
            formats: ["png"],
            background: "#f8f9fa",
            pixelRatio: 2,
          },
        }}
      />
    </div>
  </div>
);
SaveControl.parameters = {
  docs: {
    source: {
      code: `import {BarChart, Treemap} from "@d3plus/core";

// Every chart has the download button: its menu saves a PNG, SVG, or JPG
// named after the title ("Revenue share.png").
new Treemap()
  .select("#share")
  .data(data)
  .groupBy(["region", "country"])
  .sum("revenue")
  .title("Revenue share")
  .render();

// One format saves in one click. Other keys go to html-to-image.
new BarChart()
  .select("#bars")
  .data(data)
  .groupBy("country")
  .x("country")
  .y("revenue")
  .color("region")
  .title("Revenue by country")
  .saveControlConfig({
    filename: "revenue",
    formats: ["png"],
    background: "#f8f9fa",
    pixelRatio: 2
  })
  .render();`,
      language: "jsx",
    },
    description: {
      story:
        "The download button in each chart's top-left corner saves the chart as the reader sees it, title and legend included, without the controls or tooltip. With several `formats` it opens a menu; with one, it saves straight away. `filename` defaults to the title, `background` to the page color behind the chart, and `saveControl: false` removes the button.",
    },
  },
};

// Storybook is static, so this stub answers the demo URL in the page itself:
// each request returns the next reading. Other requests pass through.
const liveUrl = "/__d3plus-demo/live-sales.json";
if (typeof window !== "undefined" && !window.__d3plusLiveSales) {
  window.__d3plusLiveSales = true;
  let reading = 0;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (!String(input).endsWith(liveUrl)) return nativeFetch(input, init);
    reading++;
    const rows = ["North", "South", "East", "West"].map((region, i) => ({
      region,
      sales: Math.round(50 + 40 * Math.sin(reading * 0.7 + i * 1.7)),
    }));
    return Promise.resolve(new Response(JSON.stringify(rows)));
  };
}

export const DataPolling = () => (
  <div style={{height: 400}}>
    <BarChart
      config={{
        data: liveUrl,
        groupBy: "region",
        x: "region",
        y: "sales",
        title: "Sales by region (refreshes every 2 seconds)",
        dataPollingInterval: 2000,
      }}
    />
  </div>
);
DataPolling.parameters = {
  docs: {
    source: {
      code: `import {BarChart} from "@d3plus/core";

new BarChart()
  .select("#chart")
  .data("/api/sales.json")
  .groupBy("region")
  .x("region")
  .y("sales")
  .title("Sales by region (refreshes every 2 seconds)")
  .dataPollingInterval(2000)
  .render();`,
      language: "jsx",
    },
    description: {
      story:
        "With a URL as `data`, `dataPollingInterval` re-fetches it every that many milliseconds and transitions to the new values, keeping hover, zoom, legend toggles, and the timeline selection. An unchanged response is not redrawn, a failed one keeps the last data and retries, and polling waits while the tab is hidden or the chart is scrolled out of view. This demo answers its URL from an in-page stub.",
    },
  },
};

const revenue = [
  {id: "North", year: 2021, value: 14},
  {id: "North", year: 2022, value: 18},
  {id: "North", year: 2023, value: 23},
  {id: "South", year: 2021, value: 9},
  {id: "South", year: 2022, value: 13},
  {id: "South", year: 2023, value: 11},
];
const revenueConfig = {
  data: revenue,
  groupBy: "id",
  x: "year",
  y: "value",
  discrete: "x",
  title: "Revenue by region",
};
const darkChartCss = `
.dark-chart { background: #1e1f26; border-radius: 6px; }
.dark-chart text { fill: #f1f3f5; }
`;

export const ClassName = () => (
  <div style={{display: "flex", flexWrap: "wrap", gap: 24}}>
    <style>{darkChartCss}</style>
    <div style={{width: 420, height: 300}}>
      <BarChart config={{...revenueConfig, className: "dark-chart"}} />
    </div>
    <div style={{width: 420, height: 300}}>
      <BarChart config={revenueConfig} />
    </div>
  </div>
);
ClassName.parameters = {
  docs: {
    source: {
      code: `/* page CSS */
.dark-chart { background: #1e1f26; border-radius: 6px; }
.dark-chart text { fill: #f1f3f5; }

new BarChart()
  .select("#revenue")
  .config({data, groupBy: "id", x: "year", y: "value", discrete: "x"})
  .className("dark-chart")
  .render();`,
      language: "jsx",
    },
    description: {
      story:
        '`className` adds classes to the element a chart draws on (its root `<svg class="d3plus-viz">`, or its `<canvas>` with the Canvas renderer) next to the fixed classes, so page CSS can style one chart: here only the left chart matches `.dark-chart`. It takes a space-separated string or an array, and a new value replaces the classes the last one added. Components drawn on their own (Axis, Legend, TextBox, …) take it on their `<svg>`, and `tooltipConfig.className` adds classes to a chart\'s tooltips.',
    },
  },
};
