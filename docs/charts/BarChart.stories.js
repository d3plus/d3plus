import React from "react";
import {argTypes, BarChart as Viz} from "../args/BarChart.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";
import {formatAbbreviate} from "d3plus-format";

export default {
  title: "Charts/Bar Chart",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

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
  data: "https://datamexico.org/api/data?Indicator=62,63,64&Sector=31-33&cube=indicators_economic_census&drilldowns=Indicator,Category&measures=Value,Percentage&parents=false&locale=en",
  groupBy: "Indicator",
  barPadding: 0,
  groupPadding: 40,
  label: funcify(
    d => `${formatAbbreviate(d["Percentage"])}%`,
    "d => `${formatAbbreviate(d['Percentage'])}%`"
  ),
  x: "Category",
  y: "Percentage",
  yConfig: {
    tickFormat: funcify(
      d => `${d}%`,
      "d => `${d}%`"
    )
  }
}
CustomBarPadding.parameters = {controls: {include: ["barPadding", "groupPadding"]}};

export const GroupedBars = Template.bind({});
GroupedBars.args = {
  data: "https://datamexico.org/api/data?Indicator=62,63,64&Sector=31-33&cube=indicators_economic_census&drilldowns=Indicator,Category&measures=Value,Percentage&parents=false&locale=en",
  groupBy: "Indicator",
  label: funcify(
    d => `${formatAbbreviate(d["Percentage"])}%`,
    "d => `${formatAbbreviate(d['Percentage'])}%`"
  ),
  x: "Category",
  y: "Percentage",
  yConfig: {
    tickFormat: funcify(
      d => `${d}%`,
      "d => `${d}%`"
    )
  }
};

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

export const StackedPercentages = Template.bind({});
StackedPercentages.args = {
  data: "https://datamexico.org/api/data?Indicator=107&Nation=mex&cube=indicators_economic_census&drilldowns=Category,Indicator,Sector&measures=Percentage&parents=false&locale=en",
  discrete: "y",
  groupBy: "Category",
  stacked: true,
  x: "Percentage",
  xConfig: {
    tickFormat: funcify(
      d => `${d}%`,
      "d => `${d}%`"
    )
  },
  y: "Sector"
};
StackedPercentages.parameters = {controls: {include: ["stacked"]}};

export const PopulationPyramid = Template.bind({});
PopulationPyramid.args = {
  data: [
    {
      "Age range ID": 1,
      "Age range": "0 to 4",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1445122
    },
    {
      "Age range ID": 1,
      "Age range": "0 to 4",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1385933
    },
    {
      "Age range ID": 2,
      "Age range": "5 to 9",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1473968
    },
    {
      "Age range ID": 2,
      "Age range": "5 to 9",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1417319
    },
    {
      "Age range ID": 3,
      "Age range": "10 to 15",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1483727
    },
    {
      "Age range ID": 3,
      "Age range": "10 to 15",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1430083
    },
    {
      "Age range ID": 4,
      "Age range": "15 to 19",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1466289
    },
    {
      "Age range ID": 4,
      "Age range": "15 to 19",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1420257
    },
    {
      "Age range ID": 5,
      "Age range": "20 to 24",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1438000
    },
    {
      "Age range ID": 5,
      "Age range": "20 to 24",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1401017
    },
    {
      "Age range ID": 6,
      "Age range": "25 to 29",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1371191
    },
    {
      "Age range ID": 6,
      "Age range": "25 to 29",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1344048
    },
    {
      "Age range ID": 7,
      "Age range": "30 to 34",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1251238
    },
    {
      "Age range ID": 7,
      "Age range": "30 to 34",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1233884
    },
    {
      "Age range ID": 8,
      "Age range": "35 to 39",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1156915
    },
    {
      "Age range ID": 8,
      "Age range": "35 to 39",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1145477
    },
    {
      "Age range ID": 9,
      "Age range": "40 to 44",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 1038422
    },
    {
      "Age range ID": 9,
      "Age range": "40 to 44",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -1034343
    },
    {
      "Age range ID": 10,
      "Age range": "45 to 49",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 899326
    },
    {
      "Age range ID": 10,
      "Age range": "45 to 49",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -903752
    },
    {
      "Age range ID": 11,
      "Age range": "50 to 54",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 774590
    },
    {
      "Age range ID": 11,
      "Age range": "50 to 54",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -788241
    },
    {
      "Age range ID": 12,
      "Age range": "55 to 59",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 634510
    },
    {
      "Age range ID": 12,
      "Age range": "55 to 59",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -658490
    },
    {
      "Age range ID": 13,
      "Age range": "60 to 64",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 501128
    },
    {
      "Age range ID": 13,
      "Age range": "60 to 64",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -532940
    },
    {
      "Age range ID": 14,
      "Age range": "65 to 69",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 379352
    },
    {
      "Age range ID": 14,
      "Age range": "65 to 69",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -415647
    },
    {
      "Age range ID": 15,
      "Age range": "70 to 74",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 271687
    },
    {
      "Age range ID": 15,
      "Age range": "70 to 74",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -311231
    },
    {
      "Age range ID": 16,
      "Age range": "75 to 79",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 186805
    },
    {
      "Age range ID": 16,
      "Age range": "75 to 79",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -229221
    },
    {
      "Age range ID": 17,
      "Age range": "80+",
      "Sex ID": 1,
      "Sex": "Male",
      "Population": 166789
    },
    {
      "Age range ID": 17,
      "Age range": "80+",
      "Sex ID": 2,
      "Sex": "Female",
      "Population": -235076
    }
  ],
  discrete: "y",
  groupBy: "Sex",
  shapeConfig: {
    label: false
  },
  stacked: true,
  x: "Population",
  xConfig: {
    tickFormat: funcify(
      d => formatAbbreviate(Math.abs(d)),
      "d => formatAbbreviate(Math.abs(d))"
    )
  },
  y: "Age range"
};
PopulationPyramid.parameters = {controls: {include: ["stacked", "xConfig"]}};

