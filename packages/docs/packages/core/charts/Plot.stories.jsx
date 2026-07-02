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

export const MotionTrails = Template.bind({});
MotionTrails.args = {
  data: [
    {id: "alpha", year: 2019, x: 2,  y: 3,  value: 180},
    {id: "alpha", year: 2020, x: 5,  y: 8,  value: 180},
    {id: "alpha", year: 2021, x: 9,  y: 5,  value: 180},
    {id: "alpha", year: 2022, x: 12, y: 11, value: 180},
    {id: "beta",  year: 2019, x: 11, y: 12, value: 120},
    {id: "beta",  year: 2020, x: 8,  y: 6,  value: 120},
    {id: "beta",  year: 2021, x: 4,  y: 9,  value: 120},
    {id: "beta",  year: 2022, x: 2,  y: 2,  value: 120},
    {id: "gamma", year: 2019, x: 6,  y: 1,  value: 240},
    {id: "gamma", year: 2020, x: 3,  y: 10, value: 240},
    {id: "gamma", year: 2021, x: 10, y: 8,  value: 240},
    {id: "gamma", year: 2022, x: 7,  y: 4,  value: 240}
  ],
  groupBy: "id",
  time: "year",
  size: "value",
  sizeMax: 40,
  sizeMin: 24,
  x: "x",
  y: "y",
  renderer: "canvas",
  shapeConfig: {Circle: {trail: true}}
};
MotionTrails.parameters = {
  controls: {include: ["renderer", "shapeConfig"]},
  docs: {description: {story: "Press **play** on the timeline: each point streaks a capsule trail from its previous year's position as it animates to the next, pointing back where it came from and fading as it arrives. Enable with `shapeConfig.Circle.trail: true`; the streak matches the point's diameter. Motion trails render on the **Canvas** backend (`renderer: \"canvas\"`)."}}
};

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
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=county_health_ranking&drilldowns=State&measures=Adult%20Obesity,Diabetes%20Prevalence&Year=2025",
  dataFormat: funcify(
    resp => resp.data.filter(d => d["State ID"] !== "04000US72"),
    'resp => resp.data.filter(d => d["State ID"] !== "04000US72")'
  ),
  groupBy: "State",
  annotations: [
    {
      // x is "Diabetes Prevalence" (~0.07–0.14) and y is "Adult Obesity"
      // (~0.25–0.42), both proportions — so annotation coordinates must use
      // the same units to overlay the scatter.
      data: [
        {
          "id": "Trend",
          "x": 0.07,
          "y": 0.28
        },
        {
          "id": "Trend",
          "x": 0.14,
          "y": 0.4
        },
        {
          "id": "Baseline",
          "x": 0.07,
          "y": 0.34
        },
        {
          "id": "Baseline",
          "x": 0.14,
          "y": 0.34
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
  x: "Diabetes Prevalence",
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
