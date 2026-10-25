// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Treemap} from "../../../args/core/charts/Treemap.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Treemap",
  component: Treemap,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Uses the d3 treemap layout to create SVG rectangles based on an array of data.",
      },
    },
  },
};

const Template = args => <Treemap config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", value: 29},
    {id: "beta", value: 10},
    {id: "gamma", value: 2},
    {id: "delta", value: 29},
    {id: "eta", value: 25},
  ],
  groupBy: "id",
  sum: "value",
};
BasicExample.parameters = {
  controls: {include: ["sum"]},
  docs: {
    description: {
      story:
        "Each rectangle's area is proportional to its `sum` of the `value` field, giving one tile per `groupBy` id.",
    },
  },
};

export const NestedData = Template.bind({});
NestedData.args = {
  data: [
    {parent: "Group 1", id: "alpha", value: 29},
    {parent: "Group 1", id: "beta", value: 10},
    {parent: "Group 1", id: "gamma", value: 2},
    {parent: "Group 2", id: "delta", value: 29},
    {parent: "Group 2", id: "eta", value: 25},
  ],
  groupBy: ["parent", "id"],
  sum: "value",
};
NestedData.parameters = {
  controls: {include: ["groupBy"]},
  docs: {
    description: {
      story:
        'A two-level `groupBy` (["parent", "id"]) nests child rectangles inside their parent groups, so each group occupies its own region of the layout, named in a header strip across its top. Hover a strip to highlight its group, or click it to zoom in.',
    },
  },
};

export const GroupHeaders = Template.bind({});
GroupHeaders.args = {
  data: [
    {sector: "Technology", industry: "Software", company: "Northwind", cap: 92},
    {sector: "Technology", industry: "Software", company: "Bluefin", cap: 61},
    {sector: "Technology", industry: "Software", company: "Quanta", cap: 34},
    {
      sector: "Technology",
      industry: "Chips",
      company: "Silicon Ridge",
      cap: 78,
    },
    {sector: "Technology", industry: "Chips", company: "Nanocore", cap: 29},
    {sector: "Healthcare", industry: "Pharma", company: "Helix", cap: 66},
    {sector: "Healthcare", industry: "Pharma", company: "Medora", cap: 31},
    {sector: "Healthcare", industry: "Devices", company: "Pulse", cap: 44},
    {sector: "Financial", industry: "Banks", company: "First Harbor", cap: 58},
    {sector: "Financial", industry: "Banks", company: "Granite", cap: 37},
    {sector: "Financial", industry: "Insurance", company: "Shield", cap: 41},
    {sector: "Energy", industry: "Oil & Gas", company: "Basin", cap: 33},
    {sector: "Energy", industry: "Renewables", company: "Solstice", cap: 21},
  ],
  groupBy: ["sector", "industry", "company"],
  groupLabelConfig: {fill: "#343a40", fontSize: 12},
  sum: "cap",
};
GroupHeaders.parameters = {
  controls: {include: ["groupLabels", "groupLabelConfig"]},
  docs: {
    description: {
      story:
        "With a three-level `groupBy`, every level above the tiles gets its own header strip, nested like a market map: sectors, then industries inside them. `groupLabelConfig` styles the strips (here a dark `fill` and a 12px font); a group too small for a strip simply gets none. Set `groupLabels: false` to draw the tiles alone.",
    },
  },
};

export const ChangingTilingMethod = Template.bind({});
ChangingTilingMethod.args = {
  data: [
    {Group: "Store", "Sub-Group": "Convenience Store", "Number of Stores": 100},
    {
      Group: "Store",
      "Sub-Group": "Grocery Store",
      "Number of Food Stores": 150,
    },
    {Group: "Store", "Sub-Group": "Supercenters", "Number of Food Stores": 30},
    {
      Group: "Other",
      "Sub-Group": "Farmer's Market",
      "Number of Food Stores": 50,
    },
    {
      Group: "Restaurant",
      "Sub-Group": "Fast-Food Restaurant",
      "Number of Food Stores": 60,
    },
    {
      Group: "Restaurant",
      "Sub-Group": "Full-Service Restaurant",
      "Number of Food Stores": 120,
    },
  ],
  groupBy: ["Group", "Sub-Group"],
  sum: "Number of Food Stores",
  tile: "slice",
};
ChangingTilingMethod.parameters = {
  controls: {include: ["tile"]},
  docs: {
    description: {
      story:
        '`tile: "slice"` arranges children as parallel strips instead of the default squarified layout that favors square-ish tiles; use it when preserving order along one axis matters more than aspect ratio.',
    },
  },
};

export const SmallDataThreshold = Template.bind({});
SmallDataThreshold.args = {
  colorScale: "Total Population",
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=pums_5&drilldowns=State&measures=Total%20Population&Year=2023",
  groupBy: "State",
  sum: "Total Population",
  threshold: 0.0025,
  thresholdName: "States",
};
SmallDataThreshold.parameters = {
  controls: {include: ["threshold", "thresholdName"]},
  docs: {
    description: {
      story:
        '`threshold: 0.0025` merges every state below 0.25% of the total sum into one catch-all rectangle labeled by `thresholdName` ("States"), keeping tiny slivers from cluttering the layout. Hover it to see the states it holds, largest first. A bucket needs at least two states: a lone small state stays as itself.',
    },
  },
};

/** A three-stripe flag as an inline SVG data URI. */
const flag = ([a, b, c]) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20"><rect width="10" height="20" fill="${a}"/><rect x="10" width="10" height="20" fill="${b}"/><rect x="20" width="10" height="20" fill="${c}"/></svg>`,
  )}`;

export const BackgroundImages = Template.bind({});
BackgroundImages.args = {
  data: [
    {id: "France", value: 68, stripes: ["#0055a4", "#ffffff", "#ef4135"]},
    {id: "Italy", value: 59, stripes: ["#009246", "#ffffff", "#ce2b37"]},
    {id: "Belgium", value: 12, stripes: ["#000000", "#fdda24", "#ef3340"]},
    {id: "Ireland", value: 5, stripes: ["#169b62", "#ffffff", "#ff883e"]},
  ],
  groupBy: "id",
  shapeConfig: {
    backgroundImage: funcify(d => flag(d.stripes), "d => flag(d.stripes)"),
  },
  sum: "value",
};
BackgroundImages.parameters = {
  controls: {include: ["shapeConfig"]},
  docs: {
    description: {
      story:
        '`shapeConfig.backgroundImage` draws an image inside each shape: here an accessor returns a flag per country (`flag` builds a small SVG data URI). The image covers the rectangle, is clipped to it, and sits under the labels. Set `backgroundImageFit: "contain"` to show the whole image instead.',
    },
  },
};

export const ClickToOpenLink = Template.bind({});
ClickToOpenLink.args = {
  data: [
    {id: "Wikipedia", value: 60, url: "https://www.wikipedia.org"},
    {id: "OpenStreetMap", value: 25, url: "https://www.openstreetmap.org"},
    {id: "Project Gutenberg", value: 10, url: "https://www.gutenberg.org"},
    {id: "Internet Archive", value: 30, url: "https://archive.org"},
  ],
  groupBy: "id",
  on: {
    "click.shape": funcify(
      d => window.open(d.url, "_blank", "noopener"),
      'd => window.open(d.url, "_blank", "noopener")',
    ),
  },
  sum: "value",
};
ClickToOpenLink.parameters = {
  controls: {include: ["on"]},
  docs: {
    description: {
      story:
        'Click a tile to open its site. `on` maps event names to handlers: `"click.shape"` runs for clicks on the chart\'s tiles (`"click.legend"` for legend entries), with the clicked row as its first argument, so each row\'s `url` field opens in a new tab.',
    },
  },
};

export const ColorScaleHoverMark = Template.bind({});
ColorScaleHoverMark.args = {
  data: [
    {id: "Ash", value: 12},
    {id: "Birch", value: 45},
    {id: "Cedar", value: 23},
    {id: "Elm", value: 67},
    {id: "Fir", value: 89},
    {id: "Maple", value: 34},
    {id: "Oak", value: 150},
    {id: "Pine", value: 56},
  ],
  colorScale: "value",
  colorScaleConfig: {scale: "linear"},
  colorScalePosition: "bottom",
  groupBy: "id",
  sum: "value",
};
ColorScaleHoverMark.parameters = {
  controls: {include: ["colorScaleConfig"]},
  docs: {
    description: {
      story:
        "Hover a tile to mark its value on the colorScale: an extra axis tick marks the value on the color bar and a badge reads it where the tick's label would sit. With a bucketed scale drawn as swatches (`jenks`, `buckets`, `quantile`), the hover highlight already keeps the value's swatch lit, so no mark is drawn. Turn it off with `colorScaleConfig: {hoverMark: false}`, and style it with `colorScaleConfig.hoverMarkConfig`.",
    },
  },
};
