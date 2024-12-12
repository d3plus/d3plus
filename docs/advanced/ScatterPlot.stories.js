import React from "react";
import {argTypes, Plot} from "../args/Plot.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Advanced/Scatter Plot",
  component: Plot,
  argTypes
};

const Template = (args) => <Plot config={configify(args, argTypes)} />;

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
  xConfig: {
    title: "Economic Complexity Index (ECI)"
  },
  y: "Measure",
  yConfig: {
    domain: [100000000, 100000000000000],
    scale: "log",
    title: "Gross Domestic Product (GDP)"
  }
};

export const TrendlineUsingAnnotations = Template.bind()
TrendlineUsingAnnotations.args = {
  data: [
    "https://api.datamexico.org/tesseract/data.jsonrecords?Year=2020&cube=economy_foreign_trade_ent&drilldowns=State&measures=Trade+Value&parents=false&sparse=false",
    "https://api.datamexico.org/tesseract/data.jsonrecords?Year=2020&cube=complexity_eci&drilldowns=State&measures=ECI&parents=false&sparse=false"
  ],
  groupBy: "State ID",
  annotations: [
    {
      data: [
        {
          "id": "Trend",
          "x": 10000000,
          "y": -2.5
        },
        {
          "id": "Trend",
          "x": 1000000000000,
          "y": 2
        },
        {
          "id": "Baseline",
          "x": 10000000,
          "y": 0
        },
        {
          "id": "Baseline",
          "x": 1000000000000,
          "y": 0
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
  label: funcify(
    d => d["State"],
    "d => d['State']"
  ),
  legend: false,
  x: "Trade Value",
  xConfig: {
    domain: [10000000, 1000000000000],
    scale: "log"
  },
  y: "ECI",
  yConfig: {
    domain: [-2.5, 2]
  }
}

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
    d => {
      if (d.name === "alpha" || d.name === "delta" || d.name === "epsilon") return "Rect";
      return "Circle";
    },
    "d => {if (d.name === 'alpha' || d.name === 'delta' || d.name === 'epsilon') return 'Rect'; return 'Circle';}"
  ),
  size: "value",
  x: "value",
  y: "weight"
};

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
  sizeMin: 20
};

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
    d => {
      if (d.id === "delta") return "Line";
      return "Circle";
    },
    "d => {if (d.id === 'delta') return 'Line'; return 'Circle';}"),
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
