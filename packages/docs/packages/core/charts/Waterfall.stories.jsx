// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Waterfall} from "../../../args/core/charts/Waterfall.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Waterfall",
  component: Waterfall,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a waterfall chart: one bar per category (x, or y with\ndiscrete(\"y\") for horizontal bars) whose value is the change it makes\nto a running total. Each bar floats from where the previous bar ended;\nrows marked by subtotal draw from zero to the running total. Bars are\ncolored as increases, decreases, or totals, and labeled with their change.\nEach groupBy series keeps its own running total, drawn side by side.\n\nThe value axis includes zero by default. To zoom in on a bridge between\nlarge totals (say 1,000 to 1,020), set a yDomain (xDomain for\nhorizontal bars) that stops short of zero, e.g. yDomain([980]): the\naxis keeps zero behind a break, as BarChart does, and subtotal bars rise\nfrom zero through it.",
      },
    },
  }
};

const Template = (args) => <Waterfall config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const income = [
  {item: "Revenue", amount: 420, subtotal: true},
  {item: "Cost of Goods", amount: -180},
  {item: "Gross Profit", subtotal: true},
  {item: "Marketing", amount: -45},
  {item: "R&D", amount: -60},
  {item: "Other Income", amount: 25},
  {item: "Operating Income", subtotal: true},
  {item: "Taxes", amount: -38},
  {item: "Net Income", subtotal: true},
];

const cash = [
  {month: "Opening", flow: 50, subtotal: true},
  {month: "Jan", flow: 12},
  {month: "Feb", flow: -8},
  {month: "Mar", flow: 15},
  {month: "Apr", flow: 9},
  {month: "May", flow: -14},
  {month: "Jun", flow: -6},
  {month: "Jul", flow: 20},
  {month: "Aug", flow: 4},
  {month: "Sep", flow: -11},
  {month: "Oct", flow: 7},
  {month: "Nov", flow: 13},
  {month: "Dec", flow: -5},
  {month: "Closing", subtotal: true},
];

const regions = [
  {region: "North", quarter: "Q1", change: 40},
  {region: "North", quarter: "Q2", change: 25},
  {region: "North", quarter: "Q3", change: -15},
  {region: "North", quarter: "Q4", change: 18},
  {region: "North", quarter: "Year", subtotal: true},
  {region: "South", quarter: "Q1", change: 30},
  {region: "South", quarter: "Q2", change: -10},
  {region: "South", quarter: "Q3", change: 22},
  {region: "South", quarter: "Q4", change: 8},
  {region: "South", quarter: "Year", subtotal: true},
];

const bridge = [
  {driver: "Opening", value: 1000, subtotal: true},
  {driver: "Price", value: 15},
  {driver: "Volume", value: -8},
  {driver: "Mix", value: 13},
  {driver: "Closing", subtotal: true},
];

const bridges = [2023, 2024, 2025].flatMap((year, y) => [
  {year, driver: "Start", value: 100 + y * 20, subtotal: true},
  {year, driver: "Price", value: 12 - y * 9},
  {year, driver: "Volume", value: -6 + y * 8},
  {year, driver: "Mix", value: 4 - y * 3},
  {year, driver: "FX", value: -3 - y},
  {year, driver: "End", subtotal: true},
]);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: income,
  x: "item",
  y: "amount",
  subtotal: "subtotal",
};
BasicExample.parameters = {controls: {include: ["subtotal", "connectors", "connectorConfig"]}, docs: {description: {story: "Each row's value is a change: its bar floats from where the running total stood to where it ends, green when it rises and red when it falls. Rows marked by `subtotal` draw from zero to the running total; a subtotal with its own value (here Revenue) sets the running total to it, and one without (Gross Profit, Operating Income, Net Income) shows the running total. Thin connectors carry each bar's end across to the next."}}};

export const Horizontal = Template.bind({});
Horizontal.args = {
  data: income,
  discrete: "y",
  x: "amount",
  y: "item",
  subtotal: "subtotal",
};
Horizontal.parameters = {controls: {include: ["discrete", "x", "y"]}, docs: {description: {story: "`discrete(\"y\")` lays the bars along the y axis, reading from the top down, with each change labeled past the end of its bar."}}};

export const CashFlow = Template.bind({});
CashFlow.args = {
  data: cash,
  x: "month",
  y: "flow",
  subtotal: "subtotal",
  connectorConfig: {strokeDasharray: "3 2"},
};
CashFlow.parameters = {controls: {include: ["connectorConfig"]}, docs: {description: {story: "A month-by-month cash flow between an opening and a closing balance, with dashed connectors from `connectorConfig`."}}};

export const BrokenAxis = Template.bind({});
BrokenAxis.args = {
  data: bridge,
  x: "driver",
  y: "value",
  subtotal: "subtotal",
  yDomain: [980],
};
BrokenAxis.parameters = {controls: {include: ["yDomain", "baselineBreak"]}, docs: {description: {story: "The value axis includes zero by default, which flattens a bridge between large totals. A `yDomain` (`xDomain` for horizontal bars) that stops short of zero zooms in: the axis starts at `980`, keeps a `0` tick behind a break, and the subtotal bars rise from that `0` through the break. As in BarChart, the bars run solid through the break; `yConfig({baselineBreakConfig: {mask: true}})` cuts the break's gap out of every bar, totals included. Turn `baselineBreak` off and the axis stretches back down to `0`."}}};

export const SideBySideSeries = Template.bind({});
SideBySideSeries.args = {
  data: regions,
  groupBy: "region",
  x: "quarter",
  y: "change",
  subtotal: "subtotal",
};
SideBySideSeries.parameters = {controls: {include: ["groupBy"]}, docs: {description: {story: "Each `groupBy` series keeps its own running total, drawn side by side within each category. Bars stay colored by increase, decrease, and total, so name the series in the tooltip, or use `facet` to give each series its own panel."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: bridges,
  facet: "year",
  x: "driver",
  y: "value",
  subtotal: "subtotal",
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "`facet` draws one waterfall per value, each with its own running total, on a shared value axis."}}};

export const CustomColors = Template.bind({});
CustomColors.args = {
  data: cash,
  x: "month",
  y: "flow",
  subtotal: "subtotal",
  increaseColor: "#1098ad",
  decreaseColor: "#e67700",
  totalColor: "#495057",
  connectors: false,
};
CustomColors.parameters = {controls: {include: ["increaseColor", "decreaseColor", "totalColor", "connectors"]}, docs: {description: {story: "`increaseColor`, `decreaseColor`, and `totalColor` set each kind's fill, and the legend follows. `connectors(false)` drops the connector lines."}}};
