// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Dumbbell} from "../../../args/core/charts/Dumbbell.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Dumbbell",
  component: Dumbbell,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a dumbbell (range dot) chart from an array of data with one row per\ncategory and series, such as a country's value in 2010 and in 2020. Each\ncategory, read from the axis named by discrete (\"y\" by default, for\nhorizontal dumbbells), draws a circle per row at its value, colored by\ngroupBy, with a connector between the category's smallest and largest\nvalues. Circles are styled by shapeConfig.Circle and connectors by\nshapeConfig.Line; gapSort orders the categories by the size of their\ngap.",
      },
    },
  }
};

const Template = (args) => <Dumbbell config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import datafy from "../../../helpers/datafy";

// Life expectancy at birth in 2000 and 2021, one row per country and year.
const life = datafy(`[
  ["Japan", "Asia", 81.1, 84.5],
  ["Switzerland", "Europe", 79.7, 83.9],
  ["Australia", "Oceania", 79.2, 83.3],
  ["United Kingdom", "Europe", 77.7, 80.7],
  ["United States", "Americas", 76.6, 76.4],
  ["China", "Asia", 71.4, 78.2],
  ["Brazil", "Americas", 70.1, 72.8],
  ["Russia", "Europe", 65.3, 69.4],
  ["India", "Asia", 62.7, 67.2],
  ["South Africa", "Africa", 55.9, 62.3],
  ["Ethiopia", "Africa", 50.7, 65.0],
  ["Nigeria", "Africa", 46.3, 52.7],
].flatMap(([country, continent, before, after]) => [
  {country, continent, year: "2000", "Life Expectancy": before},
  {country, continent, year: "2021", "Life Expectancy": after},
])`);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: life,
  groupBy: "year",
  x: "Life Expectancy",
  y: "country",
};
BasicExample.parameters = {controls: {include: ["groupBy", "x", "y"]}, docs: {description: {story: "Give the chart one row per category and series: here a country's life expectancy in 2000 and in 2021. `groupBy` names the series, which color the dots and fill the legend, and a connector spans each country's two values. Hover a country to compare both years in one tooltip."}}};

export const SortedByGap = Template.bind({});
SortedByGap.args = {
  data: life,
  groupBy: "year",
  x: "Life Expectancy",
  y: "country",
  gapSort: "descending",
};
SortedByGap.parameters = {controls: {include: ["gapSort"]}, docs: {description: {story: "`gapSort` orders the categories by their gap, the distance between each one's smallest and largest value. `\"descending\"` puts the widest gap at the top; `\"ascending\"` the narrowest."}}};

export const StyledConnectors = Template.bind({});
StyledConnectors.args = {
  data: life,
  groupBy: "year",
  x: "Life Expectancy",
  y: "country",
  gapSort: "ascending",
  shapeConfig: {Circle: {r: 7}, Line: {stroke: "#adb5bd", strokeWidth: 8, strokeLinecap: "round"}},
};
StyledConnectors.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Connectors are styled through `shapeConfig.Line` and dots through `shapeConfig.Circle`."}}};

export const VerticalRanges = Template.bind({});
VerticalRanges.args = {
  data: datafy(`["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].flatMap((month, i) => {
    const low = [-3, -2, 2, 7, 12, 17, 20, 19, 15, 9, 4, -1][i];
    const high = [4, 6, 11, 17, 22, 27, 30, 29, 25, 18, 11, 6][i];
    return [
      {month, stat: "Low", "°C": low},
      {month, stat: "Mean", "°C": (low + high) / 2},
      {month, stat: "High", "°C": high},
    ];
  })`),
  groupBy: "stat",
  discrete: "x",
  x: "month",
  y: "°C",
  color: funcify(
    d => ({Low: "#4c6ef5", Mean: "#868e96", High: "#f03e3e"})[d.stat],
    "d => ({Low: \"#4c6ef5\", Mean: \"#868e96\", High: \"#f03e3e\"})[d.stat]",
  ),
};
VerticalRanges.parameters = {controls: {include: ["discrete"]}, docs: {description: {story: "Set `discrete` to `\"x\"` for vertical dumbbells. A category can hold any number of points; the connector spans its lowest to its highest."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: life,
  groupBy: "year",
  facet: "continent",
  facetConfig: {scales: "independent"},
  x: "Life Expectancy",
  y: "country",
  gapSort: "descending",
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "`facet` draws a panel per continent. With independent scales, each panel lists only its own countries, sorted by its own gaps."}}};
