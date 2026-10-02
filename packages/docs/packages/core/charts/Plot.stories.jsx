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
BasicExample.parameters = {controls: {include: ["x", "y"]}, docs: {description: {story: "The simplest scatter plot: each row becomes a point positioned by its `x` and `y` values, with `groupBy` giving every id its own color."}}};

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
BubbleChart.parameters = {controls: {include: ["size", "sizeMax", "sizeMin"]}, docs: {description: {story: "Map a third variable to point radius with `size`, turning the scatter into a bubble chart; `sizeMin` and `sizeMax` clamp the radius range so extreme values stay legible."}}};

export const TimelineMotionTrails = Template.bind({});
TimelineMotionTrails.args = {
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
  // duration: 2000,
  groupBy: "id",
  time: "year",
  shapeConfig: {
    trail: true
  },
  size: "value",
  sizeMax: 40,
  sizeMin: 24,
  x: "x",
  y: "y"
};
TimelineMotionTrails.parameters = {
  controls: {include: ["duration", "shapeConfig"]},
  docs: {description: {story: "Press **play** on the timeline: each point trails a tapering cone from its previous year's position to its current one, colored with a gradient that fades to transparent at the tail (which narrows to the point's pre-move size) and fading out as it arrives. **On by default** for scatter points — opt out with `shapeConfig.Circle.trail: false`. Works on both the SVG and Canvas backends — toggle `renderer` to compare."}}
};

export const SquareMotionTrails = Template.bind({});
SquareMotionTrails.args = {
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
  shape: "Rect",
  size: "value",
  sizeMax: 40,
  sizeMin: 24,
  x: "x",
  y: "y"
};
SquareMotionTrails.parameters = {
  controls: {include: ["renderer", "shape"]},
  docs: {description: {story: "Trails aren't circle-only: `Rect` marks trail too, and the cone is sized to the square's silhouette *perpendicular to travel* — so a square moving diagonally reaches corner-to-corner rather than edge-to-edge, matching what the eye sees. Also on by default for scatter squares; opt out with `shapeConfig.Rect.trail: false`."}}
};

export const PersistentMotionTrails = Template.bind({});
PersistentMotionTrails.args = {
  // A Hans Rosling-style health-and-wealth dataset: each nation ebbs and flows
  // year to year but trends from the poor/short-lived bottom-left toward the
  // rich/long-lived top-right, so every trail sweeps one general direction.
  data: [
    {nation: "Meridia", year: 1963, income: 14, lifeExpectancy: 43, population: 25},
    {nation: "Meridia", year: 1973, income: 17, lifeExpectancy: 46, population: 31},
    {nation: "Meridia", year: 1983, income: 20, lifeExpectancy: 50, population: 39},
    {nation: "Meridia", year: 1993, income: 25, lifeExpectancy: 54, population: 48},
    {nation: "Meridia", year: 2003, income: 33, lifeExpectancy: 60, population: 58},
    {nation: "Meridia", year: 2013, income: 45, lifeExpectancy: 67, population: 68},
    {nation: "Meridia", year: 2023, income: 60, lifeExpectancy: 73, population: 77},
    {nation: "Cauda",   year: 1963, income: 22, lifeExpectancy: 50, population: 20},
    {nation: "Cauda",   year: 1973, income: 30, lifeExpectancy: 55, population: 24},
    {nation: "Cauda",   year: 1983, income: 27, lifeExpectancy: 53, population: 28},
    {nation: "Cauda",   year: 1993, income: 38, lifeExpectancy: 59, population: 33},
    {nation: "Cauda",   year: 2003, income: 51, lifeExpectancy: 65, population: 39},
    {nation: "Cauda",   year: 2013, income: 64, lifeExpectancy: 71, population: 45},
    {nation: "Cauda",   year: 2023, income: 79, lifeExpectancy: 77, population: 49},
    {nation: "Aouine",  year: 1963, income: 31, lifeExpectancy: 53, population: 40},
    {nation: "Aouine",  year: 1973, income: 35, lifeExpectancy: 56, population: 46},
    {nation: "Aouine",  year: 1983, income: 34, lifeExpectancy: 59, population: 52},
    {nation: "Aouine",  year: 1993, income: 43, lifeExpectancy: 63, population: 58},
    {nation: "Aouine",  year: 2003, income: 56, lifeExpectancy: 69, population: 63},
    {nation: "Aouine",  year: 2013, income: 69, lifeExpectancy: 75, population: 67},
    {nation: "Aouine",  year: 2023, income: 85, lifeExpectancy: 81, population: 70},
    {nation: "Boreas",  year: 1963, income: 46, lifeExpectancy: 61, population: 90},
    {nation: "Boreas",  year: 1973, income: 53, lifeExpectancy: 65, population: 101},
    {nation: "Boreas",  year: 1983, income: 61, lifeExpectancy: 69, population: 110},
    {nation: "Boreas",  year: 1993, income: 67, lifeExpectancy: 72, population: 118},
    {nation: "Boreas",  year: 2003, income: 75, lifeExpectancy: 76, population: 125},
    {nation: "Boreas",  year: 2013, income: 83, lifeExpectancy: 80, population: 130},
    {nation: "Boreas",  year: 2023, income: 91, lifeExpectancy: 83, population: 133}
  ],
  groupBy: "nation",
  time: "year",
  // trailPersist alone is enough — it auto-switches the chart to fixed axes
  // (axisPersist) and a single-period timeline (brushing) internally. Bubbles
  // layer largest-behind automatically because a `size` accessor is set, so
  // small nations stay visible on top.
  shapeConfig: {Circle: {trailPersist: true}},
  size: "population",
  sizeMax: 45,
  sizeMin: 10,
  x: "income",
  y: "lifeExpectancy"
};
PersistentMotionTrails.parameters = {
  controls: {include: ["renderer", "shapeConfig"]},
  docs: {description: {story: "A Hans Rosling-style health-and-wealth view: press **play** and each nation's bubble ebbs and flows but trends from the poor, short-lived bottom-left toward the rich, long-lived top-right, leaving a persistent trail of its path. By default a trail shows only the current move and fades on arrival; `shapeConfig.Circle.trailPersist` keeps past moves too — a **number** keeps that many step-segments, **`true`** a long slowly-fading tail. Trails follow the timeline's direction: they grow **forward** and **rewind** (the newest segment retracting) when you step back. The whole trail draws as one shape, so overlapping turns don't darken. Setting `trailPersist` is all you need — it switches the chart to fixed axes and a single-period timeline internally (the conditions a persistent trail needs)."}}
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
ShapeBackgroundImages.parameters = {controls: {include: ["shapeConfig", "size", "sizeMax"]}, docs: {description: {story: "Render each circle as an image by setting `shapeConfig.Circle.backgroundImage` to a per-datum URL (and blanking the `label`) — here country icons stand in for the bubbles on a GDP-versus-complexity plot."}}};

export const Annotations = Template.bind({});
Annotations.args = {
  data: [
    {store: "Store 1", visitors: 4.2, revenue: 48},
    {store: "Store 2", visitors: 5.1, revenue: 61},
    {store: "Store 3", visitors: 6.0, revenue: 66},
    {store: "Store 4", visitors: 6.8, revenue: 79},
    {store: "Store 5", visitors: 7.5, revenue: 84},
    {store: "Store 6", visitors: 8.3, revenue: 97},
    {store: "Store 7", visitors: 9.0, revenue: 182},
    {store: "Store 8", visitors: 9.6, revenue: 108},
    {store: "Store 9", visitors: 10.4, revenue: 121},
    {store: "Store 10", visitors: 11.2, revenue: 126},
    {store: "Store 11", visitors: 12.1, revenue: 139},
    {store: "Store 12", visitors: 13.0, revenue: 150}
  ],
  groupBy: "store",
  x: "visitors",
  y: "revenue",
  legend: false,
  shapeConfig: {Circle: {fill: "#4dabf7"}},
  annotations: [
    // A dashed reference line across the plot, with a small text label above it.
    {
      shape: "Line",
      data: [{id: "target", x: 4, y: 100}, {id: "target", x: 13.4, y: 100}],
      stroke: "#adb5bd",
      strokeDasharray: "6 4",
      strokeWidth: 1.5
    },
    {
      shape: "Rect",
      data: [{id: "target-label", x: 4.9, y: 106, width: 84, height: 18}],
      fill: "transparent",
      label: "Target: $100k",
      labelConfig: {fontColor: "#868e96", fontSize: 11, padding: 0, textAnchor: "start", verticalAlign: "middle"}
    },
    // A pull-out label for one data point: a ring around it, a leader line, and a callout box,
    // all drawn in front of the marks.
    {
      shape: "Circle",
      layer: "front",
      data: [{id: "ring", x: 9.0, y: 182, r: 13}],
      fill: "transparent",
      stroke: "#c92a2a",
      strokeWidth: 2
    },
    {
      shape: "Line",
      layer: "front",
      data: [{id: "leader", x: 9.35, y: 180}, {id: "leader", x: 10.6, y: 172}],
      stroke: "#c92a2a",
      strokeWidth: 1.5
    },
    {
      shape: "Rect",
      layer: "front",
      data: [{id: "callout", x: 11.8, y: 172, width: 150, height: 40}],
      fill: "#fff5f5",
      stroke: "#c92a2a",
      strokeWidth: 1.5,
      label: "Store 7\n$182k from 9k visitors",
      labelConfig: {fontColor: "#c92a2a", fontSize: 12, padding: 4, textAnchor: "middle", verticalAlign: "middle"}
    }
  ]
};
Annotations.parameters = {controls: {include: ["annotations"]}, docs: {description: {story: "Layer custom shapes over the data with `annotations`. Each entry names a `shape`, brings its own `data` in the same `x`/`y` units as the marks, and sits `\"back\"` (default) or `\"front\"` of them via `layer`. Here a dashed `Line` with a `Rect` text label marks a revenue target, and a pull-out label calls out one store: a `Circle` ring around the point, a `Line` leader, and a `Rect` callout carrying a `label`. Width, height and radius are in pixels. To draw a fitted trend line, use `trendLine` instead."}}};

export const TrendLine = Template.bind({});
TrendLine.args = {
  data: [
    {region: "North", id: "North 1", x: 1.0, y: 8.8},
    {region: "North", id: "North 2", x: 1.8, y: 8.8},
    {region: "North", id: "North 3", x: 2.6, y: 14.0},
    {region: "North", id: "North 4", x: 3.4, y: 12.7},
    {region: "North", id: "North 5", x: 4.2, y: 13.2},
    {region: "North", id: "North 6", x: 5.0, y: 18.8},
    {region: "North", id: "North 7", x: 5.8, y: 26.6},
    {region: "North", id: "North 8", x: 6.6, y: 26.8},
    {region: "North", id: "North 9", x: 7.4, y: 28.0},
    {region: "North", id: "North 10", x: 8.2, y: 23.1},
    {region: "North", id: "North 11", x: 9.0, y: 28.4},
    {region: "North", id: "North 12", x: 9.8, y: 26.9},
    {region: "South", id: "South 1", x: 1.0, y: 17.1},
    {region: "South", id: "South 2", x: 1.8, y: 18.7},
    {region: "South", id: "South 3", x: 2.6, y: 22.4},
    {region: "South", id: "South 4", x: 3.4, y: 33.3},
    {region: "South", id: "South 5", x: 4.2, y: 34.5},
    {region: "South", id: "South 6", x: 5.0, y: 36.7},
    {region: "South", id: "South 7", x: 5.8, y: 39.0},
    {region: "South", id: "South 8", x: 6.6, y: 34.1},
    {region: "South", id: "South 9", x: 7.4, y: 37.9},
    {region: "South", id: "South 10", x: 8.2, y: 44.1},
    {region: "South", id: "South 11", x: 9.0, y: 47.8},
    {region: "South", id: "South 12", x: 9.8, y: 51.7},
    {region: "West", id: "West 1", x: 1.0, y: 34.6},
    {region: "West", id: "West 2", x: 1.8, y: 28.2},
    {region: "West", id: "West 3", x: 2.6, y: 37.7},
    {region: "West", id: "West 4", x: 3.4, y: 41.7},
    {region: "West", id: "West 5", x: 4.2, y: 42.9},
    {region: "West", id: "West 6", x: 5.0, y: 42.1},
    {region: "West", id: "West 7", x: 5.8, y: 48.9},
    {region: "West", id: "West 8", x: 6.6, y: 47.5},
    {region: "West", id: "West 9", x: 7.4, y: 60.8},
    {region: "West", id: "West 10", x: 8.2, y: 63.2},
    {region: "West", id: "West 11", x: 9.0, y: 62.6},
    {region: "West", id: "West 12", x: 9.8, y: 62.8}
  ],
  groupBy: ["region", "id"],
  x: "x",
  y: "y",
  trendLine: true
};
TrendLine.parameters = {controls: {include: ["trendLine", "trendLineConfig"]}, docs: {description: {story: "Set `trendLine: true` to fit a least-squares line to the plotted data. Each series (here the parent `region` of each point) gets its own dashed line in its color, drawn behind the marks. Hover a line for its equation, R² and number of observations."}}};

export const TrendLineConfidence = Template.bind({});
TrendLineConfidence.args = {
  data: TrendLine.args.data,
  groupBy: ["region", "id"],
  x: "x",
  y: "y",
  trendLine: "linear",
  trendLineConfig: {
    group: "all",
    confidence: true
  }
};
TrendLineConfidence.parameters = {controls: {include: ["trendLine", "trendLineConfig"]}, docs: {description: {story: "`trendLineConfig.group: \"all\"` fits one line to every point instead of one per series, and `confidence: true` shades the 95% confidence band for the line (set `confidenceLevel` to change it, and `confidenceConfig` to style it). Bands are drawn for linear fits only."}}};

export const TrendLineTypes = Template.bind({});
TrendLineTypes.args = {
  data: [
    {id: "p1", x: 0.0, y: -36.7},
    {id: "p2", x: 0.5, y: -26.9},
    {id: "p3", x: 1.0, y: -14.5},
    {id: "p4", x: 1.5, y: -7.4},
    {id: "p5", x: 2.0, y: -4.7},
    {id: "p6", x: 2.5, y: -1.9},
    {id: "p7", x: 3.0, y: 1.6},
    {id: "p8", x: 3.5, y: 1.1},
    {id: "p9", x: 4.0, y: -1.1},
    {id: "p10", x: 4.5, y: -0.6},
    {id: "p11", x: 5.0, y: 2.5},
    {id: "p12", x: 5.5, y: -4.6},
    {id: "p13", x: 6.0, y: -5.2},
    {id: "p14", x: 6.5, y: -0.6},
    {id: "p15", x: 7.0, y: -2.6},
    {id: "p16", x: 7.5, y: 1.5},
    {id: "p17", x: 8.0, y: 4.6},
    {id: "p18", x: 8.5, y: 8.9},
    {id: "p19", x: 9.0, y: 21.6},
    {id: "p20", x: 9.5, y: 25.0}
  ],
  groupBy: "id",
  x: "x",
  y: "y",
  legend: false,
  trendLine: "polynomial",
  trendLineConfig: {
    order: 3,
    stroke: "#c92a2a",
    strokeDasharray: "none"
  }
};
TrendLineTypes.parameters = {controls: {include: ["trendLine", "trendLineConfig"]}, docs: {description: {story: "Besides `\"linear\"`, `trendLine` accepts `\"exponential\"`, `\"logarithmic\"`, `\"power\"` and `\"polynomial\"` (with `trendLineConfig.order` setting the degree). Other `trendLineConfig` keys style the line: here a solid red cubic fit. Points with a single `groupBy` level are each their own series, so they share one trend line."}}};

export const TrendLineProjection = Template.bind({});
TrendLineProjection.args = {
  data: TrendLine.args.data,
  groupBy: ["region", "id"],
  x: "x",
  y: "y",
  trendLine: "linear",
  trendLineConfig: {
    group: "all",
    confidence: true,
    projection: {to: 14}
  }
};
TrendLineProjection.parameters = {controls: {include: ["trendLine", "trendLineConfig"]}, docs: {description: {story: "On a continuous axis, `trendLineConfig.projection` with `{to}` extends the fit to that value; the x axis widens to fit it. A number would step that many times past the last value, by the median gap between values. With `confidence`, the band beyond the data is a prediction interval, wider than the confidence band, since it covers where individual new points could fall."}}};

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
MultipleShapes.parameters = {controls: {include: ["shape"]}, docs: {description: {story: "Pass a function to `shape` to choose a mark type per datum — some points draw as `Rect`, the rest as `Circle` — letting one plot encode a category through shape."}}};

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
SortingShapes.parameters = {controls: {include: ["shapeSort"]}, docs: {description: {story: "When a plot mixes shape types, `shapeSort` sets the order they are drawn — the comparator here renders `Line` marks before `Circle`s so the points sit on top of the connecting line."}}};

export const SizeLegend = Template.bind({});
SizeLegend.args = {
  data: [
    {id: "Alpha", x: 4, y: 7, revenue: 120}, {id: "Beta", x: 5, y: 2, revenue: 1450},
    {id: "Gamma", x: 6, y: 9, revenue: 640}, {id: "Delta", x: 2, y: 4, revenue: 80},
    {id: "Epsilon", x: 8, y: 5, revenue: 2300}, {id: "Zeta", x: 3, y: 8, revenue: 900},
    {id: "Eta", x: 7, y: 3, revenue: 310}, {id: "Theta", x: 9, y: 8, revenue: 1800}
  ],
  groupBy: "id",
  legendPosition: "bottom",
  size: "revenue",
  sizeMax: 36,
  sizeMin: 4,
  x: "x",
  y: "y"
};
SizeLegend.parameters = {controls: {include: ["size", "sizeLegend", "sizeLegendPosition", "sizeLegendConfig", "legendPosition"]}, docs: {description: {story: "When `size` sizes the bubbles by more than one value, a size legend appears in the chart's bottom-right corner. Its circles are drawn at the same radii as the chart's bubbles, so the largest circle matches the largest bubble exactly. When `size` is a data key, that key becomes the legend's title. By default the legend takes room from the right margin, so the chart keeps its full height. Set `sizeLegendPosition` to `\"bottom\"` to take room from the bottom instead, or `sizeLegend` to `false` to hide it."}}};

export const SizeLegendConfig = Template.bind({});
SizeLegendConfig.args = {
  ...SizeLegend.args,
  colorScale: "y",
  colorScalePosition: "right",
  sizeLegendConfig: {
    title: "Revenue ($M)",
    values: [100, 1000, 2000],
    tickFormat: funcify(
      d => `$${d}M`,
      "d => `$${d}M`"
    )
  }
};
SizeLegendConfig.parameters = {controls: {include: ["sizeLegendConfig", "colorScalePosition"]}, docs: {description: {story: "`sizeLegendConfig` customizes the size legend: `title`, `values` (the circles to draw), `tickFormat`, and styling through `shapeConfig`, `lineConfig`, `labelConfig`, and `titleConfig`. A colorScale on the right shares the right column, shortening so it ends above the size legend."}}};

export const LegendInset = Template.bind({});
LegendInset.args = {
  data: [
    {id: "Alpha", group: "North", x: 1, y: 9}, {id: "Beta", group: "North", x: 2, y: 10},
    {id: "Gamma", group: "North", x: 1.5, y: 8}, {id: "Delta", group: "East", x: 9, y: 9},
    {id: "Epsilon", group: "East", x: 10, y: 10}, {id: "Zeta", group: "East", x: 8.5, y: 8},
    {id: "Eta", group: "South", x: 1, y: 1}, {id: "Theta", group: "South", x: 2, y: 2},
    {id: "Iota", group: "South", x: 2.5, y: 1.2}
  ],
  groupBy: ["group", "id"],
  x: "x",
  y: "y"
};
LegendInset.parameters = {controls: {include: ["legendInset", "legendInsetConfig", "size"]}, docs: {description: {story: "When the points leave a corner of the plot empty, the legend is drawn there, over a translucent box, instead of taking a margin. If the chart also sizes its points, the size legend gets the first try at that space and the legend goes back to its margin. Points that enclose an empty area never get a legend placed inside them."}}};
