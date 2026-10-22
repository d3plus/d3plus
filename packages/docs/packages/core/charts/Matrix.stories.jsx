// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Matrix} from "../../../args/core/charts/Matrix.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Matrix",
  component: Matrix,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a simple rows/columns Matrix view of any dataset.",
      },
    },
  },
};

const Template = args => <Matrix config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  // Illustrative trade between continents, in US dollars.
  data: [
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "Africa",
      "Trade Value": 75e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "Asia",
      "Trade Value": 170e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "Europe",
      "Trade Value": 200e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "North America",
      "Trade Value": 40e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "Oceania",
      "Trade Value": 2e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "South America",
      "Trade Value": 12e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "Africa",
      "Trade Value": 220e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "Asia",
      "Trade Value": 3200e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "Europe",
      "Trade Value": 1300e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "North America",
      "Trade Value": 1400e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "Oceania",
      "Trade Value": 150e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "South America",
      "Trade Value": 180e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "Africa",
      "Trade Value": 230e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "Asia",
      "Trade Value": 1100e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "Europe",
      "Trade Value": 4300e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "North America",
      "Trade Value": 650e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "Oceania",
      "Trade Value": 60e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "South America",
      "Trade Value": 110e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "Africa",
      "Trade Value": 40e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "Asia",
      "Trade Value": 650e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "Europe",
      "Trade Value": 480e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "North America",
      "Trade Value": 1250e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "Oceania",
      "Trade Value": 40e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "South America",
      "Trade Value": 170e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "Africa",
      "Trade Value": 4e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "Asia",
      "Trade Value": 230e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "Europe",
      "Trade Value": 25e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "North America",
      "Trade Value": 25e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "Oceania",
      "Trade Value": 25e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "South America",
      "Trade Value": 2e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "Africa",
      "Trade Value": 15e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "Asia",
      "Trade Value": 190e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "Europe",
      "Trade Value": 110e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "North America",
      "Trade Value": 140e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "Oceania",
      "Trade Value": 3e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "South America",
      "Trade Value": 120e9,
    },
  ],
  groupBy: ["Exporter Continent", "Importer Continent"],
  column: "Importer Continent",
  row: "Exporter Continent",
  colorScale: "Trade Value",
};
BasicExample.parameters = {
  controls: {include: ["column", "row"]},
  docs: {
    description: {
      story:
        "Draws a cell at every `row` × `column` intersection (exporter vs. importer continent); `groupBy` supplies both dimensions and `colorScale` shades each cell by Trade Value.",
    },
  },
};

export const WithColorScale = Template.bind({});
WithColorScale.args = {
  data: [
    {row: "R1", column: "C1", value: 10},
    {row: "R1", column: "C2", value: 25},
    {row: "R1", column: "C3", value: 15},
    {row: "R2", column: "C1", value: 30},
    {row: "R2", column: "C2", value: 20},
    {row: "R2", column: "C3", value: 5},
    {row: "R3", column: "C1", value: 18},
    {row: "R3", column: "C2", value: 12},
    {row: "R3", column: "C3", value: 28},
  ],
  groupBy: ["row", "column"],
  column: "column",
  row: "row",
  colorScale: "value",
  colorScaleConfig: {scale: "jenks"},
  colorScalePosition: "right",
};
WithColorScale.parameters = {
  controls: {include: ["colorScale", "colorScaleConfig", "colorScalePosition"]},
  docs: {
    description: {
      story:
        'Shades cells with a `colorScaleConfig` `scale: "jenks"` (natural-breaks) classification and moves the legend to the right via `colorScalePosition`.',
    },
  },
};
