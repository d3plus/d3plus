// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Plot} from "../../../args/core/charts/Plot.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Plot",
  component: Plot,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an x/y plot based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Plot config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", x: 4, y: 7},
    {id: "beta", x: 5, y: 2},
    {id: "gamma", x: 6, y: 13},
    {id: "delta", x: 2, y: 11},
    {id: "epsilon", x: 5, y: 5},
    {id: "zeta", x: 3, y: 4},
    {id: "eta", x: 2.5, y: 6},
    {id: "theta", x: 5.5, y: 9}
  ],
  groupBy: "id",
  x: "x",
  y: "y"
};
BasicExample.parameters = {controls: {include: ["x", "y"]}};

export const BubbleChart = Template.bind({});
BubbleChart.args = {
  data: [
    {id: "alpha", x: 4, y: 7, value: 240},
    {id: "beta", x: 5, y: 2, value: 120},
    {id: "gamma", x: 6, y: 13, value: 180}
  ],
  groupBy: "id",
  size: "value",
  sizeMax: 90,
  sizeMin: 20,
  x: "x",
  y: "y"
};
BubbleChart.parameters = {controls: {include: ["size", "sizeMax", "sizeMin"]}};

export const ShapeBackgroundImages = Template.bind({});
ShapeBackgroundImages.args = {
  data: "https://oec.world/api/gdp/eci?Year=2019&x=OEC.ECI&y=NY.GDP.MKTP.CD",
  groupBy: "Country",
  shapeConfig: {
    Circle: {
      backgroundImage: funcify(
        d => `https://oec.world/images/icons/country/country_${d["Country ID"].slice(2,5)}_circle.png`,
        "d => `https://oec.world/images/icons/country/country_${d['Country ID'].slice(2,5)}_circle.png`"
      ),
      label: funcify(
        () => "",
        "() => ''"
      )
    }
  },
  size: "Trade Value",
  sizeMax: 50,
  x: "ECI",
  y: "Measure"
};
ShapeBackgroundImages.parameters = {controls: {include: ["shapeConfig", "size", "sizeMax"]}};

export const TrendlineUsingAnnotations = Template.bind()
TrendlineUsingAnnotations.args = {
  data: "https://datausa.io/api/data?measures=Adult%20Obesity,Average%20Commute%20Time&drilldowns=State&year=2022",
  dataFormat: funcify(
    resp => resp.data.filter(d => d["ID State"] !== "04000US72"),
    'resp => resp.data.filter(d => d["ID State"] !== "04000US72")'
  ),
  groupBy: "State",
  annotations: [
    {
      data: [
        {
          "id": "Trend",
          "x": 16,
          "y": 0.4
        },
        {
          "id": "Trend",
          "x": 34,
          "y": 0.25
        },
        {
          "id": "Baseline",
          "x": 16,
          "y": 0.3
        },
        {
          "id": "Baseline",
          "x": 34,
          "y": 0.3
        }
      ],
      shape: "Line",
      stroke: funcify(
        d => d["id"] === "Trend" ? "#6A994E" : "#c3c3c3",
        "d => d['id'] === 'Trend' ? '#6A994E' : '#c3c3c3'"
      ),
      strokeDasharray: "10",
      strokeWidth: 2
    }
  ],
  x: "Average Commute Time",
  y: "Adult Obesity"
};
TrendlineUsingAnnotations.parameters = {controls: {include: ["annotations"]}};

export const MultipleShapes = Template.bind({});
MultipleShapes.args = {
  data: [
    {"value": 100, "weight": .45,  "name": "alpha"},
    {"value": 70,  "weight": .60,  "name": "beta"},
    {"value": 40,  "weight": -.2,  "name": "gamma"},
    {"value": 15,  "weight": .1,   "name": "delta"},
    {"value": 5,   "weight": -.43, "name": "epsilon"},
    {"value": 1,   "weight": 0,    "name": "zeta"}
  ],
  groupBy: "name",
  shape: funcify(
    d => (d.name === "alpha" || d.name === "delta" || d.name === "epsilon") ? "Rect" : "Circle",
    `d => (d.name === "alpha" || d.name === "delta" || d.name === "epsilon") ? "Rect" : "Circle"`
  ),
  size: "value",
  x: "value",
  y: "weight"
};
MultipleShapes.parameters = {controls: {include: ["shape"]}};

export const SortingShapes = Template.bind({});
SortingShapes.args = {
  data: [
    {id: "alpha", time: 4, value: 240},
    {id: "beta", time: 5, value: 120},
    {id: "gamma", time: 6, value: 180},
    {id: "delta", time: 4, value: 240},
    {id: "delta", time: 5, value: 120},
    {id: "delta", time: 6, value: 180}
  ],
  groupBy: "id",
  shape: funcify(
    d => d.id === "delta" ? "Line" : "Circle",
    `d => d.id === "delta" ? "Line" : "Circle"`
  ),
  shapeConfig: {
    Line: {
      strokeLinecap: "round",
      strokeWidth: 5
    }
  },
  shapeSort: funcify(
    (a, b) => ["Circle", "Line"].indexOf(b) - ["Circle", "Line"].indexOf(a),
    "(a, b) => ['Circle', 'Line'].indexOf(b) - ['Circle', 'Line'].indexOf(a)"),
  sizeMin: 20,
  x: "time",
  y: "value"
};
SortingShapes.parameters = {controls: {include: ["shapeSort"]}};
