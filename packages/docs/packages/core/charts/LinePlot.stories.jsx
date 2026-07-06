// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, LinePlot} from "../../../args/core/charts/LinePlot.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/LinePlot",
  component: LinePlot,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a line plot based on an array of data.",
      },
    },
  }
};

const Template = (args) => <LinePlot config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    { id: "alpha", x: 4, y: 7 },
    { id: "alpha", x: 5, y: 25 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 13 }
  ],
  groupBy: "id",
  x: "x",
  y: "y"
};
BasicExample.parameters = {controls: {include: ["x", "y"]}, docs: {description: {story: "A minimal line plot: `groupBy` splits the data into one line per `id`, with `x` and `y` mapping each point's position."}}};

export const LineLabels = Template.bind({});
LineLabels.args = {
  data: [
    { id: "alpha", x: 4, y: 9 },
    { id: "alpha", x: 5, y: 17 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 16 },
    { id: "gamma", x: 4, y: 14 },
    { id: "gamma", x: 5, y: 9 },
    { id: "gamma", x: 6, y: 11 }
  ],
  groupBy: "id",
  lineLabels: true,
  x: "x",
  y: "y"
};
LineLabels.parameters = {controls: {include: ["lineLabels"]}, docs: {description: {story: "Set `lineLabels: true` to print each series name at the **end of its line**, letting you trace a color straight to its label without consulting a legend."}}};

export const CustomLineLabels = Template.bind({});
CustomLineLabels.args = {
  data: [
    { id: "alpha", x: 4, y: 9 },
    { id: "alpha", x: 5, y: 17 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 16 },
    { id: "gamma", x: 4, y: 14 },
    { id: "gamma", x: 5, y: 9 },
    { id: "gamma", x: 6, y: 11 }
  ],
  groupBy: "id",
  lineLabels: true,
  shapeConfig: {
    Line: {
      label: funcify(
        function(d) {
          const dataArray = this._filteredData.filter(f => f.id === d.id);
          const maxX = Math.max(...dataArray.map(f => f.x));
          const maxData = dataArray.find(f => f.x === maxX);

          return `${maxData.y}`;
        },
        `function(d) {
        const dataArray = this._filteredData.filter(f => f.id === d.id);
        const maxX = Math.max(...dataArray.map(f => f.x));
        const maxData = dataArray.find(f => f.x === maxX); 
        return \`\${maxData.y}\`;
      }`
      )
    }
  },
  x: "x",
  y: "y"
};
CustomLineLabels.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Override the default series-name label via `shapeConfig.Line.label` — here a function returns each line's final `y` value, so the tip of every line reports its latest number."}}};

export const SecondaryYAxis = Template.bind({});
SecondaryYAxis.args = {
  data: [
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2011,
      "Trade Value": 1403273708182,
      "Trade Value Growth": 0.17509765715100706
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2012,
      "Trade Value": 1453520657725,
      "Trade Value Growth": 0.03580694860170724
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2013,
      "Trade Value": 1478035757057,
      "Trade Value Growth": 0.016866013703836988
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2014,
      "Trade Value": 1521969928619,
      "Trade Value Growth": 0.029724701416885744
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2015,
      "Trade Value": 1409516953687,
      "Trade Value Growth": -0.07388646307488954
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2016,
      "Trade Value": 1353648792022,
      "Trade Value Growth": -0.0396363885647921
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2017,
      "Trade Value": 1456201053251,
      "Trade Value Growth": 0.07575987348669187
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2018,
      "Trade Value": 1548849519602,
      "Trade Value Growth": 0.06362340292513889
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2019,
      "Trade Value": 1511931053052,
      "Trade Value Growth": -0.023836057720756986
    }
  ],
  groupBy: "Country",
  time: "Year",
  x: "Year",
  y: "Trade Value",
  y2: "Trade Value Growth",
  y2Config: {
    tickFormat: funcify(
      d => `${parseInt(d * 100)}%`,
      "d => `${parseInt(d * 100)}%`"
    )
  }
};
SecondaryYAxis.parameters = {controls: {include: ["y2", "y2Config"]}, docs: {description: {story: "Plot a second metric against a right-hand axis with `y2`; because growth lives on a different scale than trade value, `y2Config.tickFormat` renders it as a percentage independent of the left axis."}}};

export const LineVertexMarkers = Template.bind({});
LineVertexMarkers.args = {
  data: [
    { id: "alpha", x: 4, y: 9 },
    { id: "alpha", x: 5, y: 17 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 16 },
    { id: "gamma", x: 4, y: 14 },
    { id: "gamma", x: 5, y: 9 },
    { id: "gamma", x: 6, y: 11 }
  ],
  groupBy: "id",
  lineMarkers: true,
  lineMarkerConfig: {
    r: 6
  },
  x: "x",
  y: "y"
};
LineVertexMarkers.parameters = {controls: {include: ["lineMarkers", "lineMarkersConfig"]}, docs: {description: {story: "Enable `lineMarkers: true` to draw a circle at every data point, sized here to radius 6 via `lineMarkerConfig.r` so individual observations stand out."}}};

export const ChangingVertexMarkerStyle = Template.bind({});
ChangingVertexMarkerStyle.args = {
  data: [
    { id: "alpha", x: 4, y: 9 },
    { id: "alpha", x: 5, y: 17 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 16 },
    { id: "gamma", x: 4, y: 14 },
    { id: "gamma", x: 5, y: 9 },
    { id: "gamma", x: 6, y: 11 }
  ],
  groupBy: "id",
  lineMarkers: true,
  lineMarkerConfig: {
    opacity: funcify(d => d.x === 6 ? 1 : 0.25, "d => d.x === 6 ? 1 : 0.25"),
    r: funcify(d => d.x === 6 ? 6 : 4, "d => d.x === 6 ? 6 : 3")
  },
  x: "x",
  y: "y"
};
ChangingVertexMarkerStyle.parameters = {controls: {include: ["lineMarkerConfig"]}, docs: {description: {story: "Pass functions to `lineMarkerConfig` (`r` and `opacity`) to style markers per datum — here only each line's final point (`x === 6`) is drawn large and fully opaque to spotlight the endpoints."}}};

export const ChangingSplining = Template.bind({});
ChangingSplining.args = {
  data: [
    { fruit: "apple", price: 5, year: 2014 },
    { fruit: "banana", price: 4, year: 2014 },
    { fruit: "apple", price: 7, year: 2015 },
    { fruit: "banana", price: 6, year: 2015 },
    { fruit: "apple", price: 10, year: 2016 },
    { fruit: "banana", price: 8, year: 2016 },
    { fruit: "apple", price: 6, year: 2017 },
    { fruit: "banana", price: 10, year: 2017 },
    { fruit: "apple", price: 8, year: 2018 },
    { fruit: "banana", price: 15, year: 2018 }
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      curve: "catmullRom"
    }
  },
  x: "year",
  y: "price"
};
ChangingSplining.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Set `shapeConfig.Line.curve` to `\"catmullRom\"` to interpolate a smooth spline through the points instead of connecting them with straight segments."}}};

export const ChangingStrokeWidth = Template.bind({});
ChangingStrokeWidth.args = {
  data: [
    { id: "alpha", x: 4, y: 7 },
    { id: "alpha", x: 5, y: 25 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 13 }
  ],
  groupBy: "id",
  shapeConfig: {
    Line: {
      strokeWidth: 5
    }
  },
  x: "x",
  y: "y"
};
ChangingStrokeWidth.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Thicken every line with `shapeConfig.Line.strokeWidth` when you want the trend to read boldly at a glance."}}};

export const ConfidenceIntervals = Template.bind({});
ConfidenceIntervals.args = {
  data: [
    { fruit: "apple", year: 1, amount: 50, moe: 2 },
    { fruit: "apple", year: 2, amount: 56, moe: 1 },
    { fruit: "apple", year: 3, amount: 58, moe: 1 },
    { fruit: "banana", year: 1, amount: 88, moe: 3 },
    { fruit: "banana", year: 2, amount: 90, moe: 4 },
    { fruit: "banana", year: 3, amount: 76, moe: 3 }
  ],
  groupBy: "fruit",
  confidence: [
    funcify(
      d => d.amount - d.moe,
      "d => d.amount - d.moe"
    ),
    funcify(
      d => d.amount + d.moe,
      "d => d.amount + d.moe"
    )
  ],
  confidenceConfig: {
    fillOpacity: 0.3
  },
  x: "year",
  y: "amount"
};
ConfidenceIntervals.parameters = {controls: {include: ["confidence", "confidenceConfig"]}, docs: {description: {story: "Supply `confidence` as a `[lower, upper]` pair of accessors to draw a shaded margin-of-error band around each line; `confidenceConfig.fillOpacity` keeps that region translucent."}}};

export const DashedLines = Template.bind({});
DashedLines.args = {
  data: [
    { fruit: "apple", price: 5, year: 2014 },
    { fruit: "banana", price: 4, year: 2014 },
    { fruit: "cherry", price: 7, year: 2014 },
    { fruit: "apple", price: 7, year: 2015 },
    { fruit: "banana", price: 6, year: 2015 },
    { fruit: "cherry", price: 9, year: 2015 },
    { fruit: "apple", price: 10, year: 2016 },
    { fruit: "banana", price: 8, year: 2016 },
    { fruit: "cherry", price: 5, year: 2016 },
    { fruit: "apple", price: 6, year: 2017 },
    { fruit: "banana", price: 10, year: 2017 },
    { fruit: "cherry", price: 10, year: 2017 },
    { fruit: "apple", price: 8, year: 2018 },
    { fruit: "banana", price: 15, year: 2018 },
    { fruit: "cherry", price: 12, year: 2018 }
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      strokeDasharray: funcify(
        d => {
          if (d.fruit === "apple") return "10";
          if (d.fruit === "banana") return "10 7 3";
          if (d.fruit === "cherry") return "10 7 5 2";
          return "0";
        },
        `d => {
        if (d.fruit === "apple") return "10";
        if (d.fruit === "banana") return "10 7 3";
        if (d.fruit === "cherry") return "10 7 5 2";
        return "0";
      }`)
    }
  },
  x: "year",
  y: "price"
};
DashedLines.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Return a different dash pattern per series from `shapeConfig.Line.strokeDasharray` to distinguish lines by stroke style rather than color alone."}}};

export const CustomLineColors = Template.bind({});
CustomLineColors.args = {
  data: [
    { fruit: "apple", price: 5, year: 2014 },
    { fruit: "banana", price: 4, year: 2014 },
    { fruit: "cherry", price: 7, year: 2014 },
    { fruit: "apple", price: 7, year: 2015 },
    { fruit: "banana", price: 6, year: 2015 },
    { fruit: "cherry", price: 9, year: 2015 },
    { fruit: "apple", price: 10, year: 2016 },
    { fruit: "banana", price: 8, year: 2016 },
    { fruit: "cherry", price: 5, year: 2016 },
    { fruit: "apple", price: 6, year: 2017 },
    { fruit: "banana", price: 10, year: 2017 },
    { fruit: "cherry", price: 10, year: 2017 },
    { fruit: "apple", price: 8, year: 2018 },
    { fruit: "banana", price: 15, year: 2018 },
    { fruit: "cherry", price: 12, year: 2018 }
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      stroke: funcify(
        d => {
          if (d.fruit === "apple") return "green";
          if (d.fruit === "banana") return "goldenrod";
          if (d.fruit === "cherry") return "red";
          return "grey";
        },
        `d => {
        if (d.fruit === "apple") return "green";
        if (d.fruit === "banana") return "goldenrod";
        if (d.fruit === "cherry") return "red";
        return "grey";
      }`
      )
    }
  },
  x: "year",
  y: "price"
};
CustomLineColors.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Return a color per series from `shapeConfig.Line.stroke` to override the automatic palette with your own meaningful hues."}}};

export const SortingLines = Template.bind({});
SortingLines.args = {
  data: [
    { fruit: "apple", price: 5, year: 2014 },
    { fruit: "banana", price: 4, year: 2014 },
    { fruit: "apple", price: 7, year: 2015 },
    { fruit: "banana", price: 6, year: 2015 },
    { fruit: "apple", price: 10, year: 2016 },
    { fruit: "banana", price: 8, year: 2016 },
    { fruit: "apple", price: 6, year: 2017 },
    { fruit: "banana", price: 10, year: 2017 },
    { fruit: "apple", price: 8, year: 2018 },
    { fruit: "banana", price: 15, year: 2018 }
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      strokeLinecap: "round",
      strokeWidth: 10
    },
    sort: funcify(
      (a, b) => a.fruit === "apple" ? 1 : -1,
      `(a, b) => a.fruit === "apple" ? 1 : -1`
    )
  },
  x: "year",
  y: "price"
};
SortingLines.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "With thick, round-capped strokes the lines overlap, so `shapeConfig.sort` sets the draw order — here forcing *apple* to render on top of the others."}}};

export const DottedLinePredictions = Template.bind({});
DottedLinePredictions.args = {
  data: [
    {
      "Year": 2016,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 363829206796,
      "Type": "Observed"
    },
    {
      "Year": 2016,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 364493560621,
      "Type": "Observed"
    },
    {
      "Year": 2017,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 376297646785,
      "Type": "Observed"
    },
    {
      "Year": 2017,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 401741532115,
      "Type": "Observed"
    },
    {
      "Year": 2018,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 414829536859,
      "Type": "Observed"
    },
    {
      "Year": 2018,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 441736801029,
      "Type": "Observed"
    },
    {
      "Year": 2019,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 425699639802,
      "Type": "Observed"
    },
    {
      "Year": 2019,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 432693158563,
      "Type": "Observed"
    },
    {
      "Year": 2020,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 366314124058,
      "Type": "Observed"
    },
    {
      "Year": 2020,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 406070750072,
      "Type": "Observed"
    },
    {
      "Year": 2020,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 366314124058,
      "Type": "Predicted"
    },
    {
      "Year": 2020,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 406070750072,
      "Type": "Predicted"
    },
    {
      "Year": 2021,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 346314124058,
      "Type": "Predicted"
    },
    {
      "Year": 2021,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 386070750072,
      "Type": "Predicted"
    },
    {
      "Year": 2022,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 336314124058,
      "Type": "Predicted"
    },
    {
      "Year": 2022,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 396070750072,
      "Type": "Predicted"
    }
  ],
  groupBy: ["Type", "Flow"],
  shapeConfig: {
    Line: {
      strokeDasharray: funcify(
        d => d.Type === "Predicted" ? "10" : "0",
        `d => d.Type === "Predicted" ? "10" : "0"`
      )
    }
  },
  time: "Year",
  x: "Year",
  y: "Trade Value"
};
DottedLinePredictions.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Group by `[\"Type\", \"Flow\"]` and key `shapeConfig.Line.strokeDasharray` off `Type` so each flow's forecast continues as a dashed line while its observed history stays solid."}}};

export const QuarterlyData = Template.bind({});
QuarterlyData.args = {
  data: "https://api.datasaudi.sa/tesseract/data.jsonrecords?cube=gastat_gdp&drilldowns=Economic+Activity+Section,Quarter&measures=GDP&locale=en&Economic%20Activity%20Section=3",
  groupBy: "Economic Activity Section",
  time: "Quarter",
  title: "Saudi Manufacturing GDP Over Time",
  x: "Quarter",
  y: "GDP",
  yConfig: {
    title: "Billions of SAR"
  }
};
QuarterlyData.parameters = {controls: {include: ["time"]}, docs: {description: {story: "Point `data` at a remote URL to load records directly, and set `time` (and `x`) to the `Quarter` field so d3plus parses the quarterly periods into an ordered time axis."}}};
