// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, BarChart} from "../../../args/core/charts/BarChart.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/BarChart",
  component: BarChart,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a bar chart based on an array of data.",
      },
    },
  }
};

const Template = (args) => <BarChart config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {formatAbbreviate} from "@d3plus/format";

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13}
  ],
  groupBy: "id",
  x: "x",
  y: "y"
};
BasicExample.parameters = {controls: {include: ["x", "y"]}};

export const SortingBars = Template.bind({});
SortingBars.args = {
  data: [
    {"Travel Time": "< 5 Minutes",     "ID Travel Time": "0", "Population Percentage":  2},
    {"Travel Time": "15 - 24 Minutes", "ID Travel Time": "2", "Population Percentage": 30},
    {"Travel Time": "35 - 44 Minutes", "ID Travel Time": "4", "Population Percentage":  7},
    {"Travel Time": "45 - 89 Minutes", "ID Travel Time": "5", "Population Percentage": 11},
    {"Travel Time": "5 - 14 Minutes",  "ID Travel Time": "1", "Population Percentage": 20},
    {"Travel Time": "90+ Minutes",     "ID Travel Time": "6", "Population Percentage":  5},
    {"Travel Time": "25 - 34 Minutes", "ID Travel Time": "3", "Population Percentage": 25}
  ],
  groupBy: "Travel Time",
  x: "Travel Time",
  y: "Population Percentage",
  xSort: funcify(
    (a, b) => a["ID Travel Time"] - b["ID Travel Time"],
    `(a, b) => a["ID Travel Time"] - b["ID Travel Time"]`
  )
};
SortingBars.parameters = {controls: {include: ["xSort"]}};

export const CustomBarPadding = Template.bind({});
CustomBarPadding.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13}
  ],
  barPadding: 5,
  groupBy: "id",
  groupPadding: 40,
  x: "x",
  y: "y"
}
CustomBarPadding.parameters = {controls: {include: ["barPadding", "groupPadding"]}};

export const StackedBars = Template.bind({});
StackedBars.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13}
  ],
  groupBy: "id",
  stacked: true,
  x: "x",
  y: "y"
};
StackedBars.parameters = {controls: {include: ["stacked"]}};

export const HorizontalBars = Template.bind({});
HorizontalBars.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13}

  ],
  groupBy: "id",
  discrete: "y",
  x: "y",
  y: "x"
};
HorizontalBars.parameters = {controls: {include: ["discrete", "x", "y"]}};

export const TexturedBars = Template.bind({});
TexturedBars.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13}
  ],
  groupBy: "id",
  shapeConfig: {
    texture: "nylon",
    textureDefault: {
      size: 10,
      stroke: "rgba(0, 0, 0, 0.1)",
      strokeWidth: 1,
    },
  },
  x: "x",
  y: "y"
};
TexturedBars.parameters = {controls: {include: ["shapeConfig"]}};

export const PopulationPyramid = Template.bind({});
PopulationPyramid.args = {
  groupPadding: 2,
  data: [
    {
      "Age range": "0 to 4",
      "Sex": "Male",
      "Population": 1445122
    },
    {
      "Age range": "0 to 4",
      "Sex": "Female",
      "Population": 1385933
    },
    {
      "Age range": "5 to 9",
      "Sex": "Male",
      "Population": 1473968
    },
    {
      "Age range": "5 to 9",
      "Sex": "Female",
      "Population": 1417319
    },
    {
      "Age range": "10 to 15",
      "Sex": "Male",
      "Population": 1483727
    },
    {
      "Age range": "10 to 15",
      "Sex": "Female",
      "Population": 1430083
    },
    {
      "Age range": "15 to 19",
      "Sex": "Male",
      "Population": 1466289
    },
    {
      "Age range": "15 to 19",
      "Sex": "Female",
      "Population": 1420257
    },
    {
      "Age range": "20 to 24",
      "Sex": "Male",
      "Population": 1438000
    },
    {
      "Age range": "20 to 24",
      "Sex": "Female",
      "Population": 1401017
    },
    {
      "Age range": "25 to 29",
      "Sex": "Male",
      "Population": 1371191
    },
    {
      "Age range": "25 to 29",
      "Sex": "Female",
      "Population": 1344048
    },
    {
      "Age range": "30 to 34",
      "Sex": "Male",
      "Population": 1251238
    },
    {
      "Age range": "30 to 34",
      "Sex": "Female",
      "Population": 1233884
    },
    {
      "Age range": "35 to 39",
      "Sex": "Male",
      "Population": 1156915
    },
    {
      "Age range": "35 to 39",
      "Sex": "Female",
      "Population": 1145477
    },
    {
      "Age range": "40 to 44",
      "Sex": "Male",
      "Population": 1038422
    },
    {
      "Age range": "40 to 44",
      "Sex": "Female",
      "Population": 1034343
    },
    {
      "Age range": "45 to 49",
      "Sex": "Male",
      "Population": 899326
    },
    {
      "Age range": "45 to 49",
      "Sex": "Female",
      "Population": 903752
    },
    {
      "Age range": "50 to 54",
      "Sex": "Male",
      "Population": 774590
    },
    {
      "Age range": "50 to 54",
      "Sex": "Female",
      "Population": 788241
    },
    {
      "Age range": "55 to 59",
      "Sex": "Male",
      "Population": 634510
    },
    {
      "Age range": "55 to 59",
      "Sex": "Female",
      "Population": 658490
    },
    {
      "Age range": "60 to 64",
      "Sex": "Male",
      "Population": 501128
    },
    {
      "Age range": "60 to 64",
      "Sex": "Female",
      "Population": 532940
    },
    {
      "Age range": "65 to 69",
      "Sex": "Male",
      "Population": 379352
    },
    {
      "Age range": "65 to 69",
      "Sex": "Female",
      "Population": 415647
    },
    {
      "Age range": "70 to 74",
      "Sex": "Male",
      "Population": 271687
    },
    {
      "Age range": "70 to 74",
      "Sex": "Female",
      "Population": 311231
    },
    {
      "Age range": "75 to 79",
      "Sex": "Male",
      "Population": 186805
    },
    {
      "Age range": "75 to 79",
      "Sex": "Female",
      "Population": 229221
    },
    {
      "Age range": "80+",
      "Sex": "Male",
      "Population": 166789
    },
    {
      "Age range": "80+",
      "Sex": "Female",
      "Population": 235076
    }
  ],
  discrete: "y",
  groupBy: "Sex",
  height: 400,
  shapeConfig: {
    label: d => d["Age range"]
  },
  stacked: true,
  x: funcify(
      d => d.Population * (d.Sex === 'Female' ? -1 : 1),
      "d => d.Population * (d.Sex === 'Female' ? -1 : 1)"
    ),
  xConfig: {
    tickFormat: funcify(
      d => formatAbbreviate(Math.abs(d)),
      "d => formatAbbreviate(Math.abs(d))"
    )
  },
  y: "Age range",
  yConfig: {barConfig: {stroke: "transparent"}, ticks: []}
};
PopulationPyramid.parameters = {controls: {include: ["stacked", "xConfig", "yConfig"]}};
const featureData = [
  {region: "North", quarter: "Q1", revenue: 35},
  {region: "North", quarter: "Q2", revenue: 50},
  {region: "North", quarter: "Q3", revenue: 42},
  {region: "North", quarter: "Q4", revenue: 47},
  {region: "South", quarter: "Q1", revenue: 20},
  {region: "South", quarter: "Q2", revenue: 30},
  {region: "South", quarter: "Q3", revenue: 38},
  {region: "South", quarter: "Q4", revenue: 33}
];

// Custom render: `renderer` is not a control, so merge it into config directly.
export const RenderingToCanvas = (args) =>
  <BarChart config={{...configify(args, argTypes), renderer: "canvas"}} />;
RenderingToCanvas.args = {
  data: featureData,
  groupBy: "region",
  x: "quarter",
  y: "revenue"
};
RenderingToCanvas.parameters = {
  controls: {include: ["renderer"]},
  docs: {description: {story: "Set `renderer: \"canvas\"` to paint to a `<canvas>` element instead of SVG. Useful for charts with very large numbers of shapes; hover, tooltips, and pointer events still work. SVG is the default."}}
};

// Custom render: `on` is not a control, so merge the handlers into config directly.
export const ClickAndHoverEvents = (args) =>
  <BarChart config={{
    ...configify(args, argTypes),
    on: {
      "click.shape": funcify(
        d => console.log("clicked bar:", d),
        'd => console.log("clicked bar:", d)'
      ),
      "mouseenter.shape": funcify(
        d => console.log("hovered bar:", d),
        'd => console.log("hovered bar:", d)'
      )
    }
  }} />;
ClickAndHoverEvents.args = {
  data: featureData,
  groupBy: "region",
  x: "quarter",
  y: "revenue"
};
ClickAndHoverEvents.parameters = {
  controls: {include: ["on"]},
  docs: {description: {story: "Register pointer handlers via `on`. Open the browser console, then click or hover a bar. Event names mirror d3-selection; the `.shape` namespace scopes the handler to data marks (use `.legend` for legend entries, or a shape class like `.Bar`). The handler receives the datum."}}
};

export const CustomTooltip = Template.bind({});
CustomTooltip.args = {
  data: featureData,
  groupBy: "region",
  x: "quarter",
  y: "revenue",
  tooltipConfig: {
    title: funcify(d => `${d.region} — ${d.quarter}`, "d => `${d.region} — ${d.quarter}`"),
    tbody: [
      ["Region", funcify(d => d.region, "d => d.region")],
      ["Revenue", funcify(d => `$${d.revenue}M`, "d => `$${d.revenue}M`")]
    ]
  }
};
CustomTooltip.parameters = {controls: {include: ["tooltipConfig"]}};

export const DownloadButton = Template.bind({});
DownloadButton.args = {
  data: featureData,
  groupBy: "region",
  x: "quarter",
  y: "revenue",
  downloadButton: true,
  downloadConfig: {type: "png"}
};
DownloadButton.parameters = {
  controls: {include: ["downloadButton", "downloadConfig", "downloadPosition"]},
  docs: {description: {story: "Enable a built-in download button with `downloadButton: true`. `downloadConfig.type` accepts `\"png\"`, `\"jpg\"`, or `\"svg\"`."}}
};

// Custom render: `locale` is not a control, so merge it into config directly.
export const Localized = (args) =>
  <BarChart config={{...configify(args, argTypes), locale: "ar-SA"}} />;
Localized.args = {
  data: featureData,
  groupBy: "region",
  x: "quarter",
  y: "revenue"
};
Localized.parameters = {
  controls: {include: ["locale"]},
  docs: {description: {story: "Pass a `locale` (here `\"ar-SA\"`) to translate built-in UI text and format numbers for that region. Right-to-left locales also flip layout. Dictionaries live in `@d3plus/locales`."}}
};
