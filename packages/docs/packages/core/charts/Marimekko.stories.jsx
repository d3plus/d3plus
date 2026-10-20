// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Marimekko} from "../../../args/core/charts/Marimekko.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Marimekko",
  component: Marimekko,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a Marimekko (mosaic) chart from an array of data: one bar per\ndiscrete value (x), as wide as its barWidth (by default its total),\nwith the bar's groupBy segments stacked to 100% of its height. Each\ncategory's label shows its bar's share of the total width, and tooltips\nshow each segment's value, its share of the bar, and the bar's width and\nshare of the total width. Set stackOffset(\"none\") to stack absolute\nvalues instead.",
      },
    },
  }
};

const Template = (args) => <Marimekko config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {argTypes as barChartArgTypes, BarChart} from "../../../args/core/charts/BarChart.args";
import datafy from "../../../helpers/datafy";

// Illustrative smartphone revenue ($B) and units sold (millions) by region
// and brand, written as a self-contained expression so "Show code" prints the
// generator.
const sales = datafy(`(() => {
  const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Other"];
  const regions = {
    "North America": [62, 24, 1, 1, 9],
    "Europe": [38, 30, 12, 6, 14],
    "Asia Pacific": [70, 34, 40, 38, 58],
    "Latin America": [6, 14, 7, 3, 8],
    "Middle East & Africa": [8, 12, 6, 5, 16],
  };
  const units = {"North America": 150, "Europe": 190, "Asia Pacific": 640, "Latin America": 130, "Middle East & Africa": 190};
  return Object.entries(regions).flatMap(([region, values]) =>
    values.map((revenue, i) => ({Region: region, Brand: brands[i], Revenue: revenue, "Units Sold": units[region]})),
  );
})()`);

const byYear = datafy(`[2020, 2022, 2024].flatMap((year, y) => [
  ["North America", [62, 24, 1, 1, 9]],
  ["Europe", [38, 30, 12, 6, 14]],
  ["Asia Pacific", [70, 34, 40, 38, 58]],
  ["Latin America", [6, 14, 7, 3, 8]],
].flatMap(([region, values]) =>
  values.map((revenue, i) => ({
    Year: year,
    Region: region,
    Brand: ["Apple", "Samsung", "Xiaomi", "Oppo", "Other"][i],
    Revenue: Math.round(revenue * (0.5 + 0.25 * y + ((i * 7) % 5) * 0.04)),
  })),
))`);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: sales,
  groupBy: "Brand",
  x: "Region",
  y: "Revenue",
};
BasicExample.parameters = {controls: {include: ["groupBy", "x", "y"]}, docs: {description: {story: "Each region's bar is as wide as its total revenue, and each brand's segment fills its share of the bar's height, so every segment's area is its share of the whole market. Each region's label shows its share of the market on a line beneath its name, which wraps to fit a narrow bar and can widen into room its neighbors leave. A label that still can't fit is left out, and the labels rotate, showing the name alone, only when half or more can't fit. Hover a segment for its revenue, its share of the region, and the region's total and share of the market."}}};

export const WithoutWidthShares = Template.bind({});
WithoutWidthShares.args = {
  data: sales,
  groupBy: "Brand",
  x: "Region",
  y: "Revenue",
  barWidthShare: false,
};
WithoutWidthShares.parameters = {controls: {include: ["barWidthShare"]}, docs: {description: {story: "`barWidthShare(false)` labels each region by name alone, leaving each bar's share of the total width to its tooltip."}}};

export const BarWidthMeasure = Template.bind({});
BarWidthMeasure.args = {
  data: sales,
  groupBy: "Brand",
  x: "Region",
  y: "Revenue",
  barWidth: "Units Sold",
  aggs: {"Units Sold": funcify((rows, value) => Math.max(...rows.map(value)), "(rows, value) => Math.max(...rows.map(value))")},
};
BarWidthMeasure.parameters = {controls: {include: ["barWidth", "aggs"]}, docs: {description: {story: "`barWidth` sizes each bar by its own measure instead of its total: here each region is as wide as its phones sold, so Latin America and the Middle East & Africa, which sell many low-priced phones, widen, and North America narrows. Each label's share is of the units sold. The measure is read off the merge of the bar's rows, which sums numbers; when every row repeats its bar's value, as `\"Units Sold\"` does here, merge it with `aggs` instead."}}};

export const AbsoluteHeights = Template.bind({});
AbsoluteHeights.args = {
  data: sales,
  groupBy: "Brand",
  x: "Region",
  y: "Revenue",
  stackOffset: "none",
};
AbsoluteHeights.parameters = {controls: {include: ["stackOffset"]}, docs: {description: {story: "`stackOffset(\"none\")` stacks absolute values, so each bar's height is its total too."}}};

export const Horizontal = Template.bind({});
Horizontal.args = {
  data: sales,
  discrete: "y",
  groupBy: "Brand",
  x: "Revenue",
  y: "Region",
};
Horizontal.parameters = {controls: {include: ["discrete", "x", "y"]}, docs: {description: {story: "With `discrete(\"y\")` the bars run horizontally: each region's row is as tall as its total, and its segments fill the width. Labels along a vertical axis never rotate, so each region's share follows its name."}}};

export const GapsAndOrder = Template.bind({});
GapsAndOrder.args = {
  data: sales,
  groupBy: "Brand",
  x: "Region",
  y: "Revenue",
  groupPadding: 6,
  xSort: funcify((a, b) => b.Revenue - a.Revenue, "(a, b) => b.Revenue - a.Revenue"),
};
GapsAndOrder.parameters = {controls: {include: ["groupPadding", "xSort"]}, docs: {description: {story: "`groupPadding` opens a pixel gap between bars, and `xSort` orders the bars, receiving each bar's merged data (here, widest first)."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: byYear,
  groupBy: "Brand",
  x: "Region",
  y: "Revenue",
  facet: "Year",
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "`facet` draws one mosaic per year on a shared width scale, so a narrower panel is a smaller market, while each region's label and tooltip show its share of that year's own total, so every year's shares add to 100%. Every panel labels its own regions, but the 0–100% axis is the same in each, so only the left column draws it, leaving the other panels' bars its room."}}};

export const SmallMultiplesIndependent = Template.bind({});
SmallMultiplesIndependent.args = {
  data: byYear,
  groupBy: "Brand",
  x: "Region",
  y: "Revenue",
  facet: "Year",
  facetConfig: {scales: "independent"},
};
SmallMultiplesIndependent.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "`facetConfig({scales: \"independent\"})` fits each year's mosaic to its own panel, so every panel fills its width and each region's label shows its share of that year's total. The 0–100% axis still reads the same in every panel, so it stays on the left column alone; `facetConfig({axes: \"all\"})` gives every panel its own."}}};

export const VariableWidthBarChart = (args) => <BarChart config={configify(args, barChartArgTypes)} />;
VariableWidthBarChart.args = {
  data: [
    {Country: "United States", Population: 335, "GDP per Capita": 81},
    {Country: "China", Population: 1410, "GDP per Capita": 12.6},
    {Country: "India", Population: 1430, "GDP per Capita": 2.5},
    {Country: "Japan", Population: 124, "GDP per Capita": 33.8},
    {Country: "Germany", Population: 84, "GDP per Capita": 52.7},
    {Country: "Brazil", Population: 216, "GDP per Capita": 10.3},
  ],
  groupBy: "Country",
  x: "Country",
  y: "GDP per Capita",
  barWidth: "Population",
  groupPadding: 2,
  legend: false,
};
VariableWidthBarChart.parameters = {controls: {include: ["barWidth"]}, docs: {description: {story: "Any BarChart takes `barWidth`. Here each country's bar is as wide as its population and as tall as its GDP per capita, so its area is its total GDP."}}};

export const SideBySideSeries = (args) => <BarChart config={configify(args, barChartArgTypes)} />;
SideBySideSeries.args = {
  data: [
    {Sector: "Retail", Year: "2023", Revenue: 42, Employees: 30},
    {Sector: "Retail", Year: "2024", Revenue: 48, Employees: 30},
    {Sector: "Technology", Year: "2023", Revenue: 55, Employees: 12},
    {Sector: "Technology", Year: "2024", Revenue: 70, Employees: 12},
    {Sector: "Energy", Year: "2023", Revenue: 38, Employees: 6},
    {Sector: "Energy", Year: "2024", Revenue: 33, Employees: 6},
    {Sector: "Healthcare", Year: "2023", Revenue: 30, Employees: 18},
    {Sector: "Healthcare", Year: "2024", Revenue: 36, Employees: 18},
  ],
  groupBy: "Year",
  x: "Sector",
  y: "Revenue",
  barWidth: "Employees",
  aggs: {Employees: funcify((rows, value) => Math.max(...rows.map(value)), "(rows, value) => Math.max(...rows.map(value))")},
  barWidthShare: true,
  barPadding: 2,
  groupPadding: 8,
};
SideBySideSeries.parameters = {controls: {include: ["barWidth", "barWidthShare", "barPadding", "groupPadding"]}, docs: {description: {story: "Unstacked series split each variable-width bar side by side, spaced by `barPadding`, the way grouped bars split a category. Each sector's bar is as wide as its employees, and `barWidthShare` adds each sector's share of them to its label."}}};
