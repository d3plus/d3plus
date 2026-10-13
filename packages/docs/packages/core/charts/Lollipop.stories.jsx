// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Lollipop} from "../../../args/core/charts/Lollipop.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Lollipop",
  component: Lollipop,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a lollipop chart from an array of data: each row draws a thin stem\nfrom the baseline (or the value axis's break) to a circle at its value,\nwith a category axis set by discrete (\"x\" draws vertical stems, \"y\"\nhorizontal ones). Rows sharing a category but differing in groupBy sit\nside by side, as grouped bars do. Stems are styled by shapeConfig.Line\n(stroke, strokeWidth, …) and heads by shapeConfig.Circle (r,\nfill, …); a size accessor scales the heads and adds a size legend.",
      },
    },
  }
};

const Template = (args) => <Lollipop config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {country: "Finland", kg: 12},
    {country: "Norway", kg: 9.9},
    {country: "Iceland", kg: 9},
    {country: "Denmark", kg: 8.7},
    {country: "Netherlands", kg: 8.4},
    {country: "Sweden", kg: 8.2},
    {country: "Switzerland", kg: 7.9},
    {country: "Belgium", kg: 6.8},
  ],
  groupBy: "country",
  x: "country",
  y: "kg",
};
BasicExample.parameters = {controls: {include: ["x", "y", "shapeConfig"]}, docs: {description: {story: "Each row draws a stem from the baseline to a circle at its value. A lollipop reads like a bar chart with far less ink, which helps when many categories have similar, large values."}}};

export const Horizontal = Template.bind({});
Horizontal.args = {
  data: [
    {country: "Finland", kg: 12},
    {country: "Norway", kg: 9.9},
    {country: "Iceland", kg: 9},
    {country: "Denmark", kg: 8.7},
    {country: "Netherlands", kg: 8.4},
    {country: "Sweden", kg: 8.2},
    {country: "Switzerland", kg: 7.9},
    {country: "Belgium", kg: 6.8},
  ],
  groupBy: "country",
  discrete: "y",
  x: "kg",
  y: "country",
  ySort: funcify(
    (a, b) => a.kg - b.kg,
    "(a, b) => a.kg - b.kg",
  ),
};
Horizontal.parameters = {controls: {include: ["discrete", "ySort"]}, docs: {description: {story: "Set `discrete` to `\"y\"` for horizontal stems, which leave room for long category names. A `ySort` comparator orders the categories; the first sorts to the bottom, so sorting ascending puts the largest value on top."}}};

export const GroupedSeries = Template.bind({});
GroupedSeries.args = {
  data: [
    {quarter: "Q1", year: "2024", sales: 42},
    {quarter: "Q1", year: "2025", sales: 48},
    {quarter: "Q2", year: "2024", sales: 51},
    {quarter: "Q2", year: "2025", sales: 49},
    {quarter: "Q3", year: "2024", sales: 47},
    {quarter: "Q3", year: "2025", sales: 58},
    {quarter: "Q4", year: "2024", sales: 63},
    {quarter: "Q4", year: "2025", sales: 71},
  ],
  groupBy: "year",
  x: "quarter",
  y: "sales",
};
GroupedSeries.parameters = {controls: {include: ["groupBy", "groupPadding", "barPadding"]}, docs: {description: {story: "Rows that share a category but differ in `groupBy` sit side by side, the way grouped bars do, colored by series. Hover a category to compare every series there in one tooltip."}}};

export const NegativeValues = Template.bind({});
NegativeValues.args = {
  data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    .map((month, i) => ({month, anomaly: [-1.2, -0.4, 0.6, 1.4, 0.9, -0.3, 1.8, 2.1, 0.7, -0.8, -1.5, 0.2][i]})),
  groupBy: "month",
  x: "month",
  y: "anomaly",
  color: funcify(
    d => (d.anomaly < 0 ? "#4c6ef5" : "#f03e3e"),
    "d => (d.anomaly < 0 ? \"#4c6ef5\" : \"#f03e3e\")",
  ),
  legend: false,
};
NegativeValues.parameters = {controls: {include: ["baseline", "color"]}, docs: {description: {story: "Stems always start at the `baseline` (0 by default), so negative values hang below it."}}};

export const StyledStems = Template.bind({});
StyledStems.args = {
  data: [
    {city: "Tokyo", region: "Asia", population: 37.4, growth: 0.2},
    {city: "Delhi", region: "Asia", population: 31.0, growth: 3.1},
    {city: "Shanghai", region: "Asia", population: 27.1, growth: 2.9},
    {city: "São Paulo", region: "Americas", population: 22.0, growth: 0.9},
    {city: "Mexico City", region: "Americas", population: 21.8, growth: 0.6},
    {city: "Cairo", region: "Africa", population: 21.3, growth: 2.0},
    {city: "Lagos", region: "Africa", population: 14.9, growth: 3.5},
    {city: "Kinshasa", region: "Africa", population: 14.3, growth: 4.4},
  ],
  groupBy: "city",
  color: "region",
  discrete: "y",
  x: "population",
  y: "city",
  size: "growth",
  sizeMin: 4,
  sizeMax: 12,
  shapeConfig: {Line: {strokeWidth: 1, strokeDasharray: "3 2"}},
};
StyledStems.parameters = {controls: {include: ["size", "sizeMin", "sizeMax", "sizeScale", "sizeLegend", "shapeConfig"]}, docs: {description: {story: "Stems are styled through `shapeConfig.Line` and heads through `shapeConfig.Circle`. A `size` accessor scales the heads, here by annual growth, and adds a size legend whose circles match the heads."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: ["Africa", "Americas", "Asia", "Europe"].flatMap((region, r) =>
    ["Q1", "Q2", "Q3", "Q4"].flatMap((quarter, q) => [
      {region, quarter, year: "2024", sales: 20 + ((r * 7 + q * 5) % 17)},
      {region, quarter, year: "2025", sales: 24 + ((r * 5 + q * 9) % 19)},
    ])),
  groupBy: "year",
  facet: "region",
  x: "quarter",
  y: "sales",
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "`facet` splits the chart into one panel per region, sharing the value axis so panels compare directly."}}};
